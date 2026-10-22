#!/usr/bin/env python3
"""Full nightly export of the Chains accounts database (chains-app-f38f8) — every node, not just rounds.

Writes data/backups/full-YYYY-MM-DD.json and data/backups/full-latest.json, one JSON object keyed by
node. Keeps the last 45 daily files (older ones are deleted so the repo doesn't grow forever; the
rounds-*.json backups are untouched). Reads use an anonymous sign-in (the rules allow any signed-in
read on these nodes); if the rules are ever tightened, set FIREBASE_ID_TOKEN in the environment.

Restore (one node): see OPERATIONS.md in Bonnaroo/chains-agent-log — in short, take the node's object
out of the file and PUT it back to https://chains-app-f38f8-default-rtdb.firebaseio.com/<node>.json
with an admin token (Firebase console → Realtime Database → import JSON also works for a whole node).
"""
import json, os, sys, time, urllib.request
from datetime import datetime, timezone
from pathlib import Path

API_KEY = "AIzaSyAZ9T16EZSngQxNevsil-txb3xpEC4RKIE"
DB_ROOT = "https://chains-app-f38f8-default-rtdb.firebaseio.com"
LEGACY_ROOT = "https://chains-fantasy-default-rtdb.firebaseio.com"
HEADERS = {"User-Agent": "chains-backup/1.0", "Content-Type": "application/json"}
KEEP_DAYS = 45

# Every node the app writes (keep in sync with CHAINS_SYSTEM.md §3 / HANDOFF.md §6)
NODES = [
    "users", "usernames", "friends", "friendRequests", "friendCodes",
    "playRounds", "sharedRounds", "liveRounds", "roundsByPlayer", "courseStats",
    "territory", "territoryLog", "courseFirsts", "crews", "crewByUser", "crewCodes",
    "courseLeagues", "courseLeagueCodes", "leagues", "joinCodes", "leagueCodes",
    "sharedBags", "courseGeo", "courseCommunity", "lostFound", "messages", "threads",
    "aces", "config", "admins", "bugReports",
]
LEGACY_NODES = ["notifications", "live", "picks", "standings", "members", "events", "settings", "clubhouse", "pot"]


def post_json(url, payload, timeout=30):
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=HEADERS, method="POST")
    return json.loads(urllib.request.urlopen(req, timeout=timeout).read().decode("utf-8", "replace"))


def get_json(url, timeout=60):
    req = urllib.request.Request(url, headers=HEADERS)
    return json.loads(urllib.request.urlopen(req, timeout=timeout).read().decode("utf-8", "replace"))


def token():
    t = os.environ.get("FIREBASE_ID_TOKEN")
    if t:
        return t
    return post_json(f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={API_KEY}", {"returnSecureToken": True})["idToken"]


def main():
    out_dir = Path("data/backups"); out_dir.mkdir(parents=True, exist_ok=True)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    try:
        tok = token()
    except Exception as e:
        print(f"full backup FAILED: no auth token: {e}"); sys.exit(1)
    snap = {"_meta": {"taken_at": datetime.now(timezone.utc).isoformat(), "db": DB_ROOT, "nodes": {}}}
    failed = []
    for node in NODES:
        try:
            v = get_json(f"{DB_ROOT}/{node}.json?auth={tok}")
            snap[node] = v
            n = len(v) if isinstance(v, dict) else (0 if v is None else 1)
            snap["_meta"]["nodes"][node] = n
            print(f"  {node:20s} {n}")
        except Exception as e:
            failed.append(node); snap["_meta"]["nodes"][node] = f"ERROR {str(e)[:80]}"; print(f"  {node:20s} ERROR {e}")
        time.sleep(0.2)
    legacy = {}
    for node in LEGACY_NODES:
        try:
            legacy[node] = get_json(f"{LEGACY_ROOT}/{node}.json")
        except Exception as e:
            legacy[node] = None; print(f"  legacy/{node}: {e}")
    snap["_legacy"] = legacy

    # sanity: refuse to overwrite "latest" if the core nodes shrank dramatically (possible data loss)
    latest = out_dir / "full-latest.json"
    if latest.exists():
        try:
            prev = json.loads(latest.read_text(encoding="utf-8"))
            for core in ("playRounds", "usernames", "courseStats"):
                a = len(prev.get(core) or {}); b = len(snap.get(core) or {})
                if a and b < a * 0.5:
                    print(f"WARNING: {core} dropped from {a} to {b} — saving dated file but NOT touching full-latest.json")
                    (out_dir / f"full-{today}-SUSPECT.json").write_text(json.dumps(snap, ensure_ascii=False), encoding="utf-8")
                    sys.exit(0)
        except Exception as e:
            print("prev compare skipped:", e)

    body = json.dumps(snap, ensure_ascii=False)
    (out_dir / f"full-{today}.json").write_text(body, encoding="utf-8")
    latest.write_text(body, encoding="utf-8")
    # retention
    files = sorted(p for p in out_dir.glob("full-20*.json") if "SUSPECT" not in p.name)
    for p in files[:-KEEP_DAYS]:
        p.unlink(); print("  pruned", p.name)
    print(f"full backup OK: {len(NODES) - len(failed)}/{len(NODES)} nodes, {len(body) // 1024} KB" + (f", failed: {failed}" if failed else ""))
    if failed:
        sys.exit(2)


if __name__ == "__main__":
    main()
