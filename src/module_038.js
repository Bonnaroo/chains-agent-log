/* Chains — Notifications feed. window.ChainsNotify
   General Firebase /notifications feed (read+write, like the rest of league data).
   First use: "you're on the clock" draft-turn nudge. Spoiler-free — never a score.
   In-app bell + badge now; real push rides on the same feed later (PWA step). */
(function () {
  var FB = "https://chains-fantasy-default-rtdb.firebaseio.com";
  var CACHE = "chains_notify_cache_v1";

  function getJSON(u) { return fetch(u, { cache: "no-store" }).then(function (r) { return r.ok ? r.text() : Promise.reject(); }).then(function (t) { try { return JSON.parse(t); } catch (e) { return null; } }); }
  function put(path, obj) { return ChainsBuild.legacyWrite(FB + path + ".json", { method: "PUT", body: JSON.stringify(obj) }).catch(function () {}); }
  function patch(path, obj) { return ChainsBuild.legacyWrite(FB + path + ".json", { method: "PATCH", body: JSON.stringify(obj) }).catch(function () {}); }

  var feed = {}; // notifId -> notif
  var listeners = [];
  function emit() { listeners.forEach(function (fn) { try { fn(); } catch (e) {} }); }
  function subscribe(fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (x) { return x !== fn; }); }; }

  // hydrate from cache for instant first paint
  try { var c = JSON.parse(localStorage.getItem(CACHE) || "null"); if (c) feed = c; } catch (e) {}

  // v512: keep the shared feed small — anything older than 45 days is dropped on load (a few per
  // visit, so no bursts) and never kept locally. Keeps every phone's first paint light.
  var KEEP_DAYS = 45, PRUNE_PER_LOAD = 15;
  function prune(all) {
    var cutoff = new Date(Date.now() - KEEP_DAYS * 86400000).toISOString(); var dropped = 0, out = {};
    Object.keys(all).forEach(function (k) {
      var n = all[k]; var old = !n || !n.created_at || String(n.created_at) < cutoff;
      if (old) { if (dropped < PRUNE_PER_LOAD) { dropped++; try { ChainsBuild.legacyWrite(FB + "/notifications/" + k + ".json", { method: "DELETE" }).catch(function () {}); } catch (e) {} } return; }
      out[k] = n;
    });
    return out;
  }
  function load() {
    return getJSON(FB + "/notifications.json").then(function (j) {
      feed = prune(j || {});
      try { localStorage.setItem(CACHE, JSON.stringify(feed)); } catch (e) {}
      emit();
      detectDraftTurn(); // opportunistic: keep the on-the-clock nudge current
      return feed;
    }).catch(function () {});
  }

  function myId() { return (window.ChainsID && ChainsID.whoami()) || null; }

  // Per-user dismissed set (local) so "clear" works in every build immediately and
  // only affects YOUR view (the feed is shared). Keyed by user id.
  var DISMISS = "chains_notify_dismissed_v1";
  function dismissedSet() { try { var o = JSON.parse(localStorage.getItem(DISMISS) || "{}"); return o[myId() || "_"] || {}; } catch (e) { return {}; } }
  function saveDismissed(set) { try { var o = JSON.parse(localStorage.getItem(DISMISS) || "{}"); o[myId() || "_"] = set; localStorage.setItem(DISMISS, JSON.stringify(o)); } catch (e) {} }
  function dismiss(notifId) { if (!notifId) return; var s = dismissedSet(); s[notifId] = true; saveDismissed(s); emit(); }
  function clearAll() { var s = dismissedSet(); mine().forEach(function (n) { s[n.id] = true; }); saveDismissed(s); emit(); }

  // entries for me (audience includes my id or "all"), newest first, minus dismissed
  function mine() {
    var id = myId();
    var dm = dismissedSet();
    return Object.keys(feed).map(function (k) { return Object.assign({ id: k }, feed[k]); })
      .filter(function (n) { return n && (n.audience === "all" || (Array.isArray(n.audience) && id && n.audience.indexOf(id) >= 0)); })
      .filter(function (n) { return !dm[n.id]; })
      .sort(function (a, b) { return String(b.created_at || "").localeCompare(String(a.created_at || "")); })
      .slice(0, 30);
  }
  function unreadCount() {
    var id = myId(); if (!id) return 0;
    return mine().filter(function (n) { return !(n.read_by && n.read_by[id]); }).length;
  }
  function markRead(notifId) {
    var id = myId(); if (!id || !notifId) return;
    if (feed[notifId]) { feed[notifId].read_by = feed[notifId].read_by || {}; feed[notifId].read_by[id] = true; emit(); }
    patch("/notifications/" + notifId + "/read_by", (function () { var o = {}; o[id] = true; return o; })());
  }

  function post(notif) {
    var id = notif.id || ("n-" + Date.now().toString(36));
    var full = Object.assign({ created_at: new Date().toISOString(), read_by: {} }, notif);
    delete full.id;
    feed[id] = full; emit();
    return put("/notifications/" + id, full).then(function () { return id; });
  }

  // ---- draft-turn detection (app owns the snake order) -------------------
  function detectDraftTurn() {
    return; // v476: the draft referee (poller) posts on-the-clock notices; the browser no longer guesses the order
    if (!window.ChainsEngine) return;
    var meta = ChainsEngine.seasonMeta();
    var ev = meta.next; // the event whose draft is open
    if (!ev) return;
    // don't notify for an event already underway/scored
    var res = ChainsEngine.eventResults(ev.t);
    if (res && res.scored) return;
    var draft = ChainsEngine.draftOrder(ev.t);
    var order = (draft && draft.order) || [];
    if (order.length < 1) return;
    // snake: order P1 round, then reversed P2 round
    var seq = order.map(function (m) { return { id: m.id, pick: "p1" }; })
      .concat(order.slice().reverse().map(function (m) { return { id: m.id, pick: "p2" }; }));
    var picks = ChainsEngine.picksFor(ev.t) || [];
    var byM = {}; picks.forEach(function (p) { byM[p.m] = p; });
    var slotIndex = -1, onClock = null;
    for (var i = 0; i < seq.length; i++) {
      var s = seq[i];
      var p = byM[s.id];
      if (!p || p[s.pick] == null || p[s.pick] === "") { slotIndex = i; onClock = s.id; break; }
    }
    if (onClock == null) return; // draft complete
    var eventId = window.ChainsProStats ? String(window.ChainsProStats.resultsIdForSlot(ev.t) || ev.t) : String(ev.t);
    var notifId = "draft-" + eventId + "-slot-" + slotIndex;
    if (feed[notifId]) return; // already fired for this slot (dedupe)
    var mem = ChainsEngine.member(onClock);
    post({
      id: notifId, type: "draft_turn",
      title: "You're on the clock \uD83E\uDD4F",
      body: "It's your pick for the " + ev.name + ".",
      audience: [onClock], link: "picks", event_id: eventId, t: ev.t,
    });
  }

  window.ChainsNotify = {
    load: load, subscribe: subscribe, mine: mine, unreadCount: unreadCount,
    markRead: markRead, dismiss: dismiss, clearAll: clearAll, post: post, detectDraftTurn: detectDraftTurn,
  };
  // poll the feed (in-app delivery); also re-detect on local pick changes
  if (document.readyState !== "loading") setTimeout(load, 1500); else document.addEventListener("DOMContentLoaded", function () { setTimeout(load, 1500); });
  setInterval(load, 60000);
  window.addEventListener("chains:local-change", function () { setTimeout(detectDraftTurn, 300); });
  window.addEventListener("chains:remote-update", function () { setTimeout(load, 300); });
})();
