/* Chains — icon set (Lucide-compatible 24×24 stroke icons).
   Swappable 1:1 for the Lucide CDN set. Attaches window.Icons. */
(function () {
  const S = ({ children, size = 20, sw = 2, style }) =>
    React.createElement(
      "svg",
      {
        width: size, height: size, viewBox: "0 0 24 24", fill: "none",
        stroke: "currentColor", strokeWidth: sw, strokeLinecap: "round",
        strokeLinejoin: "round", style,
      },
      children
    );
  const P = (d) => React.createElement("path", { d });
  const E = (cx, cy, rx, ry) => React.createElement("ellipse", { cx, cy, rx, ry });
  const C = (cx, cy, r) => React.createElement("circle", { cx, cy, r });
  const L = (x1, y1, x2, y2) => React.createElement("line", { x1, y1, x2, y2 });
  const PL = (pts) => React.createElement("polyline", { points: pts });
  const mk = (...kids) => (props) => React.createElement(S, props, ...kids);

  const Icons = {
    // basket / target — the brand glyph for picks
    Target: mk(C(12, 12, 10), C(12, 12, 6), C(12, 12, 2)),
    Disc: mk(E(12, 12, 10, 5), C(12, 12, 2)),
    Trophy: mk(P("M6 9H4.5a2.5 2.5 0 0 1 0-5H6"), P("M18 9h1.5a2.5 2.5 0 0 0 0-5H18"),
      P("M4 22h16"), P("M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"),
      P("M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"), P("M18 2H6v7a6 6 0 0 0 12 0V2Z")),
    Calendar: mk(React.createElement("rect", { x: 3, y: 4, width: 18, height: 18, rx: 2 }),
      L(16, 2, 16, 6), L(8, 2, 8, 6), L(3, 10, 21, 10)),
    Users: mk(P("M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"), C(9, 7, 4),
      P("M22 21v-2a4 4 0 0 0-3-3.87"), P("M16 3.13a4 4 0 0 1 0 7.75")),
    List: mk(L(8, 6, 21, 6), L(8, 12, 21, 12), L(8, 18, 21, 18), L(3, 6, 3.01, 6), L(3, 12, 3.01, 12), L(3, 18, 3.01, 18)),
    Flame: mk(P("M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z")),
    ChevLeft: mk(PL("15 18 9 12 15 6")),
    ChevRight: mk(PL("9 18 15 12 9 6")),
    ChevDown: mk(PL("6 9 12 15 18 9")),
    Plus: mk(L(12, 5, 12, 19), L(5, 12, 19, 12)),
    Check: mk(PL("20 6 9 17 4 12")),
    Search: mk(C(11, 11, 8), L(21, 21, 16.65, 16.65)),
    Reset: mk(P("M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"), PL("3 3 3 8 8 8")),
    Medal: mk(P("M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"),
      P("M11 12 5.12 2.2"), P("M13 12l5.88-9.8"), P("M8 7h8"), C(12, 17, 5), P("M12 18v-2h-.5")),
    Pin: mk(P("M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"), C(12, 10, 3)),
    TrendUp: mk(PL("22 7 13.5 15.5 8.5 10.5 2 17"), PL("16 7 22 7 22 13")),
    X: mk(L(18, 6, 6, 18), L(6, 6, 18, 18)),
    Settings: mk(P("M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"), C(12, 12, 3)),
    Lock: mk(React.createElement("rect", { x: 3, y: 11, width: 18, height: 11, rx: 2 }), P("M7 11V7a5 5 0 0 1 10 0v4")),
    Star: mk(P("M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z")),
    Newspaper: mk(P("M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"), P("M18 14h-8"), P("M15 18h-5"), P("M10 6h8v4h-8z")),
    Play: mk(C(12, 12, 10), P("M10 8 16 12 10 16Z")),
    Close: mk(L(18, 6, 6, 18), L(6, 6, 18, 18)),
    Dot: mk(C(12, 12, 4)),
    Scoreboard: mk(React.createElement("rect", { x: 3, y: 4, width: 18, height: 14, rx: 2 }), L(3, 9, 21, 9), L(8, 9, 8, 18), L(14, 9, 14, 18), L(12, 20, 12, 22), L(9, 22, 15, 22)),
    Chat: mk(P("M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z")),
    Send: mk(L(22, 2, 11, 13), P("M22 2 15 22 11 13 2 9 22 2Z")),
    Bell: mk(P("M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"), P("M13.73 21a2 2 0 0 1-3.46 0")),
    Refresh: mk(P("M23 4v6h-6"), P("M1 20v-6h6"), P("M3.51 9a9 9 0 0 1 14.85-3.36L23 10"), P("M1 14l4.64 4.36A9 9 0 0 0 20.49 15")),
    Sun: mk(C(12, 12, 4), L(12, 2, 12, 4), L(12, 20, 12, 22), L(4.93, 4.93, 6.34, 6.34), L(17.66, 17.66, 19.07, 19.07), L(2, 12, 4, 12), L(20, 12, 22, 12), L(6.34, 17.66, 4.93, 19.07), L(19.07, 4.93, 17.66, 6.34)),
    // v519: real icons for the tiles/rows that used emoji
    Home: mk(P("M3 11.5 12 4l9 7.5"), P("M5 10.5V20h14v-9.5")),
    Flag: mk(P("M5 21V4"), P("M5 4h12l-2.5 4L17 12H5")),
    Map: mk(P("M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"), P("M9 4v14"), P("M15 6v14")),
    Backpack: mk(P("M8 6V5a4 4 0 0 1 8 0v1"), P("M6 6h12a2 2 0 0 1 2 2v12H4V8a2 2 0 0 1 2-2Z"), P("M8 14h8v6H8z"), P("M12 10h0")),
    User: mk(C(12, 8, 4), P("M4 21a8 8 0 0 1 16 0")),
    Compass: mk(C(12, 12, 10), P("m15.5 8.5-2 5-5 2 2-5 5-2Z")),
    Layers: mk(P("m12 3 9 5-9 5-9-5 9-5Z"), P("m3 13 9 5 9-5"), P("m3 17 9 5 9-5")),
    Tv: mk(React.createElement("rect", { x: 3, y: 6, width: 18, height: 12, rx: 2 }), P("m8 2 4 4 4-4"), P("M8 22h8")),
    Grid: mk(React.createElement("rect", { x: 3, y: 3, width: 7, height: 7, rx: 1.5 }), React.createElement("rect", { x: 14, y: 3, width: 7, height: 7, rx: 1.5 }), React.createElement("rect", { x: 3, y: 14, width: 7, height: 7, rx: 1.5 }), React.createElement("rect", { x: 14, y: 14, width: 7, height: 7, rx: 1.5 })),
  };
  window.Icons = Icons;
})();
