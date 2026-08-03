#!/usr/bin/env python3
"""
Chains - STATE builder.

Writes company/STATE.md: one page that says what is true RIGHT NOW, assembled from
live systems rather than from anybody's memory. Every role (Cowork, Design, Engineer,
Watcher, the owner) reads this FIRST so we all start from the same facts.

Nothing in here is hand-written prose about status - if it's in this file, it was
measured. That's the point: a status doc people update by hand goes stale in a day.

Run:  python build_state.py            (needs GH_TOKEN env for the issue list)
Out:  company/STATE.md  +  company/state.json
"""
import json, os, re, base64, zlib, urllib.request
from datetime import datetime, timezone

GH = "https://api.github.com"
ORG = "Bonnaroo"
TOKEN = os.environ.get("GH_TOKEN", "")
APP = "https://raw.githubusercontent.com/Bonnaroo/chains-app/main/index.html"
FIELD = "https://raw.githubusercontent.com/Bonnaroo/chains-dgpt-data/main/data/field.json"
SEASON = "https://raw.githubusercontent.com/Bonnaroo/chains-dgpt-data/main/data/season.json"
LEAGUE = "https://chains-fantasy-default-rtdb.firebaseio.com/league.json"
LIVE = "https://chains-fantasy-default-rtdb.firebaseio.com/live.json"


def get(url, token=False, timeout=45):
    r = urllib.request.Request(url, headers={"User-Agent": "chains-state"})
    if token and TOKEN:
        r.add_header("Authorization", "token " + TOKEN)
    return urllib.request.urlopen(r, timeout=timeout).read()


def jget(url, token=False, default=None):
    try:
        return json.loads(get(url, token))
    except Exception:
        return default


def live_version():
    """Read the deployed version + which known fixes are present, from the real build."""
    try:
        raw = get(APP + "?z=" + str(datetime.now().timestamp()))
    except Exception:
        return {"version": "UNREACHABLE", "bytes": 0, "markers": {}}
    txt = raw.decode("utf-8", "ignore")
    m = re.search(r'CHAINS_VERSION\s*=\s*\\?"(v\d+)', txt)
    markers = {}
    checks = {
        "auth_gate": "window.AuthGate",
        "login_required": "ANONYMOUS SESSIONS NO LONGER GRANT ACCESS",
        "round_save_fix": "function authUid()",
        "in_the_bag_nav": 'label: "In the Bag"',
        "fantasy_impact": "window.ChainsImpact",
        "cdn_assets": "window.ChainsAssets",
    }
    for m2 in re.finditer(rb'"data":"([A-Za-z0-9+/=]{200,})"', raw):
        try:
            d = zlib.decompress(base64.b64decode(m2.group(1)), 16 + zlib.MAX_WBITS).decode("utf-8", "ignore")
        except Exception:
            continue
        for k, needle in checks.items():
            if needle in d:
                markers[k] = True
    for k in checks:
        markers.setdefault(k, False)
    return {"version": m.group(1) if m else "UNKNOWN", "bytes": len(raw), "markers": markers}


def issues():
    d = jget(f"{GH}/repos/{ORG}/chains-agent-log/issues?state=open&per_page=100", token=True, default=[])
    out = [i for i in d if "pull_request" not in i]
    return sorted(out, key=lambda x: x["number"])


def season_state():
    lg = jget(LEAGUE, default={}) or {}
    keys = (lg.get("keys") or {})
    done, picked, empty = [], [], []
    for k, v in keys.items():
        m = re.match(r"picks~46~(\d+)$", k)
        if not m:
            continue
        n = int(m.group(1))
        try:
            rows = json.loads(v["v"]) if isinstance(v, dict) and "v" in v else v
        except Exception:
            continue
        has_pick = any(r.get("p1") for r in rows)
        has_score = any(r.get("s1") is not None for r in rows)
        (done if has_score else picked if has_pick else empty).append(n)
    return {"scored": sorted(done), "picked_unscored": sorted(picked), "empty": sorted(empty)}


def main():
    now = datetime.now(timezone.utc)
    app = live_version()
    field = jget(FIELD, default={}) or {}
    season = jget(SEASON, default={}) or {}
    live = jget(LIVE, default={}) or {}
    iss = issues()
    ss = season_state()

    events = season.get("events") or []
    nxt = None
    for e in events:
        if e.get("t") and e["t"] not in ss["scored"]:
            nxt = e
            break

    field_ok = bool(field.get("event_id")) and len(field.get("players") or []) > 0
    top = [i for i in iss if "[TOP]" in i["title"]]

    state = {
        "generated_at": now.isoformat(),
        "app": app,
        "season": {
            "scored_events": ss["scored"],
            "awaiting_scores": ss["picked_unscored"],
            "next_event": nxt,
            "poller_event": live.get("event_name"),
            "poller_event_id": live.get("event_id"),
        },
        "field": {
            "ok": field_ok,
            "event_tag": field.get("event_tag"),
            "player_count": field.get("player_count") or len(field.get("players") or []),
            "stable_hours": field.get("stable_hours"),
            "updated_at": field.get("updated_at"),
            "note": field.get("note"),
        },
        "issues": {"open": len(iss), "top": len(top),
                   "top_list": [{"n": i["number"], "t": i["title"]} for i in top]},
    }

    L = []
    A = L.append
    A("# Chains — CURRENT STATE")
    A("")
    A(f"_Generated {now.strftime('%Y-%m-%d %H:%M UTC')} from live systems. Nothing here is typed by hand._")
    A("")
    A("**Everyone reads this first — Cowork, Design, Engineer, Watcher, the owner.**")
    A("It exists so nobody works from a stale memory of the app.")
    A("")
    A("## The app")
    A("")
    A(f"- **Live version: `{app['version']}`** ({app['bytes']:,} bytes)")
    A(f"- Any new build MUST be numbered higher than `{app['version']}`.")
    A("- Fixes confirmed present in the live build:")
    for k, v in sorted(app["markers"].items()):
        A(f"  - {'✅' if v else '❌'} `{k}`")
    A("")
    A("> If a fix shows ❌ that you believe shipped, it was clobbered — see")
    A("> `company/playbooks/never-clobber-a-deploy.md` before deploying anything.")
    A("")
    A("## Season")
    A("")
    A(f"- Scored events: {', '.join('T%d' % t for t in state['season']['scored_events']) or 'none'}")
    if state["season"]["awaiting_scores"]:
        A(f"- **Picked but NOT scored: {', '.join('T%d' % t for t in state['season']['awaiting_scores'])}** "
          "— the season won't roll over until these are scored.")
    if nxt:
        A(f"- Next event: **T{nxt.get('t')} {nxt.get('name')}** ({nxt.get('start_date')} → {nxt.get('end_date')}, id {nxt.get('event_id')})")
    A(f"- Live poller is on: {state['season']['poller_event']} (id {state['season']['poller_event_id']})")
    A("")
    A("## Registered field (can people draft?)")
    A("")
    if field_ok:
        A(f"- ✅ **{state['field']['player_count']} players** loaded for {state['field']['event_tag']}")
        sh = state["field"]["stable_hours"]
        if sh is not None:
            settled = "settled" if sh >= 24 else "still moving"
            A(f"- Roster unchanged for **{sh}h** — {settled}. (>24h = registration effectively done.)")
    else:
        A("- ❌ **FIELD IS EMPTY — nobody can draft.** " + str(state["field"].get("note") or ""))
        A("  This blocks the league regardless of anything else. Fix first.")
    A(f"- field.json updated: {state['field']['updated_at']}")
    A("")
    A("## Work")
    A("")
    A(f"- **{state['issues']['open']} open issues**, {state['issues']['top']} tagged [TOP]")
    for t in state["issues"]["top_list"][:12]:
        A(f"  - #{t['n']} {t['t'][:88]}")
    A("")
    A("## Who owns what")
    A("")
    A("| | Design | Cowork (backend) |")
    A("|---|---|---|")
    A("| Owns | screens, flows, components, copy — anything a user sees or taps | Firebase nodes, rules, accounts, data scripts, Actions, deploys |")
    A("")
    A("Full workflow: `company/DESIGN_LOOP.md`. Never interrupt Design mid-build.")
    A("Never deploy without the 3-level verification in `company/playbooks/production-verification.md`.")

    os.makedirs("company", exist_ok=True)
    open("company/STATE.md", "w", encoding="utf-8").write("\n".join(L) + "\n")
    open("company/state.json", "w", encoding="utf-8").write(json.dumps(state, indent=2))
    print("wrote company/STATE.md")
    print(f"  live={app['version']} field_ok={field_ok} open_issues={len(iss)}")


if __name__ == "__main__":
    main()
