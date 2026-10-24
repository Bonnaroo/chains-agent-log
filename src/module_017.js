/* ============================================================
   CHAINS — "In the Bag" disc log. window.ChainsBag
   Log the discs you carry — quick (just a count) or detailed
   (real discs by name + type). Feeds the disc counter and a
   bag-by-type breakdown. chains-app RTDB, keyed by whoami.

   Shape:  users/{whoami}/bag = { count, discs:[{id,name,type,brand,lost}], updatedAt }
   Disc types: Putter · Midrange · Fairway · Driver (Distance) · other.
   (A real discs.json catalog — flight numbers per mold — is a CDN
    data job; the picker upgrades to it automatically when present.)
   ============================================================ */
(function () {
  var w = window;
  function fb() { return (w.ChainsFB && w.ChainsFB.ok) ? w.ChainsFB : null; }
  function db() { var f = fb(); return f ? f.db : null; }
  function whoami() { try { return (w.ChainsID && ChainsID.whoami && ChainsID.whoami()) || null; } catch (e) { return null; } }
  function emit() { try { w.dispatchEvent(new Event("chains:bag")); } catch (e) {} }
  function uid() { return "d-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  var _bagErrAt = 0;
  function _bagFail(e) { var t = Date.now(); if (t - _bagErrAt > 6000) { _bagErrAt = t; try { if (w.ChainsToast) ChainsToast.show("Couldn't sync your bag \u2014 saved on this device.", "error"); } catch (x) {} } try { console.warn("[ChainsBag] write failed", e); } catch (x) {} }

  var TYPES = ["Putter", "Midrange", "Fairway", "Driver"];
  function typeColor(t) {
    return { Putter: "#1F8A5B", Midrange: "#2A6FDB", Fairway: "#B8902A", Driver: "#C23A33" }[t] || "#9CA3AF";
  }

  var LK = "chains_bag_v1";
  function readLocal() { try { return JSON.parse(localStorage.getItem(LK) || "null"); } catch (e) { return null; } }
  function writeLocal(b) { try { localStorage.setItem(LK, JSON.stringify(b)); } catch (e) {} }

  function blank() { return { count: 0, discs: [], updatedAt: Date.now() }; }

  // current bag (local mirror; hydrate() refreshes from cloud)
  function get() { return readLocal() || blank(); }
  // v492: the discs you LIST are the truth. In the bag = not lost, not on the shelf.
  // The manual count is only a fallback for people who never list their discs.
  function inBag(b) { b = b || get(); return (b.discs || []).filter(function (d) { return !d.lost && !d.shelf; }); }
  function onShelf(b) { b = b || get(); return (b.discs || []).filter(function (d) { return !d.lost && d.shelf; }); }
  function effectiveCount(b) { b = b || get(); var any = (b.discs || []).some(function (d) { return !d.lost; }); return any ? inBag(b).length : (b.count || 0); }

  function _persist(b) {
    b.updatedAt = Date.now(); writeLocal(b);
    var d = db(), who = whoami();
    if (d && who) {
      // Owner copy (private, self-read) + a friend-readable SHARED mirror so the
      // "see a friend's bag" view reads it without exposing the private users/ node.
      // A bag carries no personal info (just discs), so the whole thing is shareable.
      try { var p = d.ref("users/" + who + "/bag").set(b); if (p && p.catch) p.catch(_bagFail); } catch (e) { _bagFail(e); }
      try { d.ref("sharedBags/" + who).set(b); } catch (e) {}
    }
    emit();
    return b;
  }

  function hydrate() {
    var d = db(), who = whoami();
    if (!d || !who) return Promise.resolve(get());
    return d.ref("users/" + who + "/bag").get().then(function (s) { var v = s.val(); if (v) { writeLocal(v); try { d.ref("sharedBags/" + who).set(v); } catch (e) {} } return v || get(); }).catch(function () { return get(); });
  }
  // Read-only fetch of ANOTHER player's bag (by their identity key). Bags are shared
  // with friends — prefer the public sharedBags mirror; fall back to the legacy
  // users/ path (a bag saved before the mirror existed). Never writes.
  function bagFor(otherId) {
    var d = db(); if (!d || !otherId) return Promise.resolve(null);
    return d.ref("sharedBags/" + otherId).get()
      .then(function (s) { return s.exists() ? (s.val() || null) : d.ref("users/" + otherId + "/bag").get().then(function (s2) { return s2.val() || null; }).catch(function () { return null; }); })
      .catch(function () { return null; });
  }

  function setCount(n) { var b = get(); b.count = Math.max(0, parseInt(n, 10) || 0); return _persist(b); }
  // map a catalog type (7 values) to a bag bucket (4).
  function bagType(t) {
    if (!t) return "Driver";
    if (/putter|approach/i.test(t)) return "Putter";
    if (/midrange/i.test(t)) return "Midrange";
    if (/control|hybrid|fairway/i.test(t)) return "Fairway";
    if (/distance/i.test(t)) return "Driver";
    return "Driver";
  }
  function addDisc(name, type, brand) {
    var b = get(); b.discs = b.discs || [];
    b.discs.push({ id: uid(), name: String(name || "Disc").slice(0, 40), type: TYPES.indexOf(type) >= 0 ? type : "Driver", brand: brand || null, lost: false, addedAt: Date.now() });
    return _persist(b);
  }
  // Add a real catalog disc (full snapshot kept so the bag renders offline).
  // v491: extra = { plastic, color, weight, notes }. Two copies of a mold are fine when
  // the plastic or color differ (a Star Destroyer and a Champion Destroyer are two discs);
  // an identical copy revives a lost one or is a no-op.
  function addDiscObj(d, extra) {
    if (!d) return get();
    extra = extra || {};
    var b = get(); b.discs = b.discs || [];
    var mold = d.mold || d.name || "Disc";
    var key = ((d.brand || "") + "|" + mold + "|" + (extra.plastic || "") + "|" + (extra.color || "")).toLowerCase();
    var dup = b.discs.filter(function (x) { return (((x.brand || "") + "|" + x.name + "|" + (x.plastic || "") + "|" + (x.color || "")).toLowerCase()) === key; })[0];
    if (dup) { if (dup.lost) { dup.lost = false; return _persist(b); } return b; }
    b.discs.push({ id: uid(), name: String(mold).slice(0, 40), brand: d.brand || null, type: bagType(d.type), moldType: d.type || null,
      speed: d.speed != null ? d.speed : null, glide: d.glide != null ? d.glide : null, turn: d.turn != null ? d.turn : null, fade: d.fade != null ? d.fade : null,
      stability: d.stability || null, pic: d.pic || null, key: (d.brand || "") + "|" + mold,
      plastic: extra.plastic ? String(extra.plastic).slice(0, 40) : null, color: extra.color ? String(extra.color).slice(0, 24) : null, weight: extra.weight ? Math.max(100, Math.min(200, parseInt(extra.weight, 10) || 0)) || null : null, notes: extra.notes ? String(extra.notes).slice(0, 120) : null,
      lost: false, addedAt: Date.now() });
    return _persist(b);
  }
  function updateDisc(id, patch) {
    var b = get(); (b.discs || []).forEach(function (d) { if (d.id !== id) return; ["plastic", "color", "notes"].forEach(function (k) { if (patch[k] !== undefined) d[k] = patch[k] ? String(patch[k]).slice(0, 120) : null; }); if (patch.weight !== undefined) d.weight = patch.weight ? Math.max(100, Math.min(200, parseInt(patch.weight, 10) || 0)) || null : null; if (patch.type && TYPES.indexOf(patch.type) >= 0) d.type = patch.type; });
    return _persist(b);
  }
  function removeDisc(id) { var b = get(); b.discs = (b.discs || []).filter(function (d) { return d.id !== id; }); return _persist(b); }
  function setLost(id, lost) { var b = get(); (b.discs || []).forEach(function (d) { if (d.id === id) { d.lost = !!lost; if (lost) d.shelf = false; } }); return _persist(b); }
  function setShelf(id, on) { var b = get(); (b.discs || []).forEach(function (d) { if (d.id === id) { d.shelf = !!on; if (on) d.lost = false; } }); return _persist(b); }

  // breakdown by type (active discs only)
  function breakdown(b) {
    b = b || get(); var out = {}; TYPES.forEach(function (t) { out[t] = 0; });
    (b.discs || []).forEach(function (d) { if (!d.lost && !d.shelf) out[d.type] = (out[d.type] || 0) + 1; });
    return out;
  }

  (function boot(n) { if (whoami()) { try { hydrate(); } catch (e) {} return; } if ((n || 0) < 30) setTimeout(function () { boot((n || 0) + 1); }, 500); })();

  // ---- disc catalog (discs.json on the CDN; fetched once, cached) ----------
  var CATKEY = "chains_discs_cache_v1", _catalog = null;
  try { _catalog = JSON.parse(localStorage.getItem(CATKEY) || "null"); if (_catalog && _catalog.length) { var _seen = {}, _u = []; _catalog.forEach(function (d) { var k = ((d.brand || "") + "|" + (d.mold || "")).toLowerCase(); if (_seen[k]) return; _seen[k] = 1; _u.push(d); }); if (_u.length !== _catalog.length) { _catalog = _u; try { localStorage.setItem(CATKEY, JSON.stringify(_u)); } catch (e) {} } } } catch (e) {}
  // v491: plastics per brand (curated data/plastics.json) + color list
  var PLKEY = "chains_plastics_cache_v1", _plastics = null;
  try { _plastics = JSON.parse(localStorage.getItem(PLKEY) || "null"); } catch (e) {}
  var COLORS = [["White", "#f4f1ea"], ["Yellow", "#f2d03b"], ["Orange", "#f07a2a"], ["Red", "#d8382f"], ["Pink", "#ee6fae"], ["Purple", "#7d4fd0"], ["Blue", "#2f6fdb"], ["Light blue", "#7cc3f0"], ["Teal", "#1fa39a"], ["Green", "#2f9a4a"], ["Lime", "#a8d93a"], ["Black", "#1c1c1c"], ["Grey", "#9a9a9a"], ["Clear", "#e9eef2"], ["Glow", "#d6f7c2"], ["Swirl", "linear-gradient(135deg,#f07a2a,#7d4fd0,#2f9a4a)"], ["Multi", "conic-gradient(#d8382f,#f2d03b,#2f9a4a,#2f6fdb,#d8382f)"]];
  function colorHex(name) { var c = COLORS.filter(function (x) { return x[0] === name; })[0]; return c ? c[1] : "#9CA3AF"; }
  function loadPlastics() {
    if (_plastics && _plastics.brands) return Promise.resolve(_plastics);
    var CDN = "https://cdn.jsdelivr.net/gh/Bonnaroo/chains-dgpt-data@main/data/plastics.json";
    var RAW = "https://raw.githubusercontent.com/Bonnaroo/chains-dgpt-data/main/data/plastics.json";
    function take(j) { if (j && j.brands) { _plastics = j; try { localStorage.setItem(PLKEY, JSON.stringify(j)); } catch (e) {} } return _plastics || { brands: {} }; }
    return fetch(CDN, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(take)
      .catch(function () { return fetch(RAW, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(take); })
      .catch(function () { return _plastics || { brands: {} }; });
  }
  function plasticsFor(brand) {
    var b = (_plastics && _plastics.brands) || {}; var list = b[brand];
    if (!list) { var lb = String(brand || "").toLowerCase(); Object.keys(b).forEach(function (k) { if (!list && k !== "_generic" && (lb.indexOf(k.toLowerCase()) >= 0 || k.toLowerCase().indexOf(lb) >= 0)) list = b[k]; }); }
    return (list || b._generic || ["Premium", "Base", "Other"]).slice();
  }
  function loadCatalog() {
    if (_catalog && _catalog.length) return Promise.resolve(_catalog);
    var CDN = "https://cdn.jsdelivr.net/gh/Bonnaroo/chains-dgpt-data@main/data/discs.json";
    var RAW = "https://raw.githubusercontent.com/Bonnaroo/chains-dgpt-data/main/data/discs.json";
    function take(j) { var arr = (j && j.discs) ? j.discs : (Array.isArray(j) ? j : []); var seen = {}, u = []; arr.forEach(function (d) { var k = ((d.brand || "") + "|" + (d.mold || "")).toLowerCase(); if (seen[k]) return; seen[k] = 1; u.push(d); }); arr = u; if (arr.length) { _catalog = arr; try { localStorage.setItem(CATKEY, JSON.stringify(arr)); } catch (e) {} } return arr; }
    return fetch(CDN, { cache: "force-cache" }).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(take)
      .then(function (arr) { return (arr && arr.length) ? arr : Promise.reject(); })
      .catch(function () { return fetch(RAW, { cache: "force-cache" }).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(take); })
      .catch(function () { return _catalog || []; });
  }
  function stabilityColor(s) {
    return { "Very Understable": "#8b5cf6", "Understable": "#2A6FDB", "Stable": "#1F8A5B", "Overstable": "#d97706", "Very Overstable": "#c23a33" }[s] || "#9CA3AF";
  }

  w.ChainsBag = {
    available: function () { return !!whoami(); }, TYPES: TYPES, typeColor: typeColor,
    get: get, hydrate: hydrate, effectiveCount: effectiveCount,
    setCount: setCount, addDisc: addDisc, addDiscObj: addDiscObj, bagType: bagType, removeDisc: removeDisc, setLost: setLost, breakdown: breakdown,
    loadCatalog: loadCatalog, stabilityColor: stabilityColor,
    updateDisc: updateDisc, setShelf: setShelf, inBag: inBag, onShelf: onShelf, loadPlastics: loadPlastics, plasticsFor: plasticsFor, COLORS: COLORS, colorHex: colorHex
  };
})();
