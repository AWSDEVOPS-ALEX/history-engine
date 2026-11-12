import React, { useMemo } from "react";
import { geoCentroid, geoEquirectangular, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import SAT from "../sat-manifest.json";
import world from "world-atlas/countries-50m.json";
import worldLow from "world-atlas/countries-110m.json";
import { Character } from "./Character";
import { Icon, isCardIcon } from "./Icons";
import { hasFile } from "./Crowd";
import { FlagPole } from "./Flags";
import { MapToken } from "./MapIcons";
import { HAND_BOLD, HAND_BOLD as HAND, SANS } from "../theme";
import type { CastMember, LonLat, MapEvent, MapIcon, MapView, Visual } from "../schema";

type MapVisual = Extract<Visual, { kind: "map" }>;
type FC = FeatureCollection<Geometry, { name: string }>;
const COUNTRIES = feature(world as any, (world as any).objects.countries) as unknown as FC;
// Coarse outlines when zoomed out: same look, far fewer points to draw per frame.
const COUNTRIES_LOW = feature(worldLow as any, (worldLow as any).objects.countries) as unknown as FC;

/**
 * Rough biome colour from a country's centre, so deserts read sand, the tropics deep green,
 * the far north tundra. Painted-map stand-in for a satellite image.
 */
const biome = (name: string, [lon, lat]: [number, number]) => {
  if (name === "Antarctica" || name === "Greenland" || name === "Fr. S. Antarctic Lands") return "#dde8ed";
  if (name === "Australia") return "#d4a455";
  if (Math.abs(lat) > 62) return "#8fa882";
  if (lat > 14 && lat < 36 && lon > -18 && lon < 62) return "#e8c46a"; // Sahara, Arabia, Iran
  if (lat > 35 && lat < 50 && lon > 46 && lon < 80) return "#d9be72"; // Central Asian steppe-desert
  if (lat > 40 && lat < 52 && lon > 85 && lon < 125) return "#ccc070"; // Mongolia
  if (lat > 18 && lat < 34 && lon > -118 && lon < -98) return "#d4b868"; // Mexico / US southwest
  if ((name === "Namibia" || name === "Botswana") ) return "#dabb6a";
  if (lat > -12 && lat < 7) return "#3d8c30"; // rainforest belt — vivid green
  if (Math.abs(lat) >= 7 && Math.abs(lat) <= 15) return "#96b840"; // savanna
  if (Math.abs(lat) > 48) return "#5a9444";
  return "#5ea838"; // base green — much more vivid
};
const tint = (fc: FC) => fc.features.map((f) => biome(f.properties.name, geoCentroid(f as any) as [number, number]));
const TINT = tint(COUNTRIES);
const TINT_LOW = tint(COUNTRIES_LOW);

const W = 1920;
const H = 1080;
const ink = "#2b2622";
const TOKEN = 1.7; // on-screen size of map tokens; raise for bolder maps

const project = (v: MapView) =>
  geoEquirectangular()
    .scale((v.zoom * W) / (2 * Math.PI))
    .center([v.lon, v.lat])
    .translate([W / 2, H / 2]);

const lerpView = (a: MapView, b: MapView, k: number): MapView => ({
  lon: a.lon + (b.lon - a.lon) * k,
  lat: a.lat + (b.lat - a.lat) * k,
  zoom: a.zoom * Math.pow(b.zoom / a.zoom, k),
});

const ease = Easing.inOut(Easing.sin); // gentle start and stop, like a slow camera crane

/** Camera: from → to over the segment, or through keyframes; always a slow drift so the map never sits still. */
const cameraAt = (v: MapVisual, sec: number, total: number, events: MapEvent[] = []): MapView => {
  const base = baseCamera(v, sec, total);
  // ease in towards each callout as it is mentioned, then hold there until the next one
  const foci = events
    .filter((e): e is Extract<MapEvent, { type: "callout" }> => e.type === "callout" && e.focus !== false)
    .sort((a, b) => a.t - b.t);
  let from = base;
  let view = base;
  for (const c of foci) {
    const start = c.t - 0.5;
    if (sec < start) break;
    const target: MapView = { lon: c.at[0], lat: c.at[1] + 1.2 / Math.max(1, base.zoom / 4), zoom: Math.max(base.zoom * (c.zoom ?? 1.6), base.zoom) };
    const k = ease(Math.min(1, (sec - start) / 1.4));
    view = lerpView(from, target, k);
    from = view;
  }
  return view;
};

const baseCamera = (v: MapVisual, sec: number, total: number): MapView => {
  let view: MapView;
  if (v.keys?.length) {
    const keys = [{ t: 0, view: v.from }, ...v.keys].sort((a, b) => a.t - b.t);
    const i = keys.findIndex((k) => k.t > sec);
    if (i === -1) view = keys[keys.length - 1].view;
    else if (i === 0) view = keys[0].view;
    else {
      const a = keys[i - 1];
      const b = keys[i];
      view = lerpView(a.view, b.view, ease((sec - a.t) / Math.max(0.01, b.t - a.t)));
    }
  } else {
    const k = ease(Math.min(1, sec / Math.max(0.5, total)));
    view = lerpView(v.from, v.to ?? v.from, k);
  }
  return view;
};

const rand = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Point and heading at fraction p along a screen-space polyline. */
const along = (pts: [number, number][], p: number) => {
  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    segs.push(d);
    total += d;
  }
  let target = Math.max(0, Math.min(1, p)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i] || i === segs.length - 1) {
      const k = segs[i] ? Math.min(1, target / segs[i]) : 0;
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      return { x: ax + (bx - ax) * k, y: ay + (by - ay) * k, dx: bx - ax };
    }
    target -= segs[i];
  }
  return { x: pts[0][0], y: pts[0][1], dx: 1 };
};

const outlined = { stroke: "#1e1a17", strokeWidth: 11, strokeLinejoin: "round" as const, paintOrder: "stroke" as const, fill: "#ffffff", fontWeight: 700 };

/**
 * Animated map. Camera moves, the sea shimmers, cloud shadows drift, and timed events
 * (caravans, ships, armies, battles, trade flows, icons, labels, counters, territory fills)
 * play on top while the narrator talks. Optional satellite basemap: public/basemap.jpg.
 */
export const MapScene: React.FC<{ v: MapVisual; cast: CastMember[]; satellite?: boolean; wordTime?: (w: number) => number }> = ({ v, cast, satellite = true, wordTime }) => {
  const useSat = satellite && SAT.mid.tiles.length > 0;
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const sec = frame / fps;
  const total = durationInFrames / fps;
  // events can be timed to a spoken word instead of seconds
  const events: MapEvent[] = (v.events ?? [])
    .map((e) => ("word" in e && e.word != null && wordTime ? { ...e, t: Math.max(0, wordTime(e.word)) } : e))
    // a badge mentioned near the end of a line still gets time to be seen before the cut
    .map((e) => (e.type === "callout" && !e.persist ? { ...e, t: Math.max(0, Math.min(e.t, total - 2.4)) } : e));
  const view = cameraAt(v, sec, total, events);
  const proj = project(view);
  const path = geoPath(proj);
  const low = view.zoom < 2.6;
  const features = (low ? COUNTRIES_LOW : COUNTRIES).features;
  const tints = low ? TINT_LOW : TINT;
  const byName = useMemo(() => new Map(COUNTRIES.features.map((f) => [f.properties.name, f])), []);
  const P = (p: LonLat) => proj(p) as [number, number];

  const reveal = (at = 0, dur = 1.4) =>
    interpolate(sec, [at, at + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  const pop = (t: number, i = 0) => spring({ frame: frame - t * fps, fps, config: { damping: 28, stiffness: 120 }, durationInFrames: 24 + i });
  const line = (pts: LonLat[]) => pts.map((p, i) => `${i ? "L" : "M"}${P(p).join(" ")}`).join(" ");
  const curve = (pts: LonLat[], bend = 0.22) => {
    const p = pts.map(P);
    let d = `M${p[0][0]} ${p[0][1]}`;
    for (let i = 1; i < p.length; i++) {
      const [ax, ay] = p[i - 1];
      const [bx, by] = p[i];
      d += ` Q${(ax + bx) / 2} ${(ay + by) / 2 - Math.hypot(bx - ax, by - ay) * bend} ${bx} ${by}`;
    }
    return d;
  };

  const medallions: React.ReactNode[] = []; // HTML, drawn above the map

  // Pin labels: try below, above, right, left; take the first spot that doesn't hit an earlier label
  // or leave the frame, so two nearby pins (Italy and Spain) never print on top of each other.
  const placed: { x0: number; x1: number; y0: number; y1: number }[] = [];
  const spots = new Map<number, { x: number; y: number; anchor: "middle" | "start" | "end" }>();
  events.forEach((e, i) => {
    if (e.type !== "pin" || !e.label || sec < e.t) return;
    const [x, y] = P(e.at);
    const w = e.label.length * 24 + 16;
    const tries: { x: number; y: number; anchor: "middle" | "start" | "end"; bx: number }[] = [
      { x, y: y + 44, anchor: "middle", bx: x - w / 2 },
      { x, y: y - 62, anchor: "middle", bx: x - w / 2 },
      { x: x + 26, y: y - 18, anchor: "start", bx: x + 26 },
      { x: x - 26, y: y - 18, anchor: "end", bx: x - 26 - w },
    ];
    const ok = (t: (typeof tries)[number]) =>
      t.bx > 20 && t.bx + w < W - 20 && t.y > 50 && t.y < H - 170 &&
      !placed.some((r) => t.bx < r.x1 && t.bx + w > r.x0 && t.y - 32 < r.y1 && t.y + 6 > r.y0);
    const pick = tries.find(ok) ?? tries[0];
    placed.push({ x0: pick.bx, x1: pick.bx + w, y0: pick.y - 32, y1: pick.y + 6 });
    spots.set(i, { x: pick.x, y: pick.y, anchor: pick.anchor });
  });
  const pinLabel = (i: number) => spots.get(i) ?? { x: 0, y: 0, anchor: "middle" as const };
  const under: React.ReactNode[] = []; // fills, borders, flows, arrows, trails
  const over: React.ReactNode[] = []; // tokens, battles, labels

  events.forEach((e: MapEvent, i) => {
    if (sec < e.t) return;
    const age = sec - e.t;
    switch (e.type) {
      case "fill": {
        const stagger = e.stagger ?? 0.35;
        e.countries.forEach((name, j) => {
          const f = byName.get(name);
          const o = reveal(e.t + j * stagger, 0.6) * 0.72;
          if (f && o > 0) under.push(<path key={`f${i}-${j}`} d={path(f) ?? ""} fill={e.color ?? "#e08a1f"} opacity={o} stroke="#fff3d6" strokeWidth={2.5} />);
        });
        break;
      }
      case "border":
        e.countries.forEach((name, j) => {
          const f = byName.get(name);
          if (f)
            under.push(
              <path key={`b${i}-${j}`} d={path(f) ?? ""} fill="none" stroke={e.color ?? "#ffe08a"} strokeWidth={6} strokeDasharray="18 12" strokeDashoffset={-frame * 2} opacity={reveal(e.t, 0.5)} />,
            );
        });
        break;
      case "flow": {
        const d = line(e.path);
        const k = reveal(e.t, 1.2);
        under.push(
          <g key={`fl${i}`} opacity={k}>
            <path d={d} fill="none" stroke="rgba(43,38,34,0.55)" strokeWidth={(e.width ?? 14) + 8} strokeLinecap="round" />
            <path d={d} fill="none" stroke={e.color ?? "#ffd34d"} strokeWidth={e.width ?? 14} strokeLinecap="round" strokeDasharray="6 26" strokeDashoffset={-frame * 3} />
          </g>,
        );
        break;
      }
      case "arrow": {
        const k = reveal(e.t, 1.1);
        under.push(
          <path
            key={`ar${i}`}
            d={curve([e.from, e.to], e.bend ?? 0.25)}
            fill="none"
            stroke={e.color ?? "#ffffff"}
            strokeWidth={10}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - k}
            markerEnd={k > 0.97 ? "url(#arrow)" : undefined}
          />,
        );
        break;
      }
      case "move": {
        const pts = e.path.map(P);
        const dur = e.dur ?? 4;
        const n = e.count ?? 1;
        const p = Easing.inOut(Easing.quad)(Math.min(1, age / dur));
        if (e.trail !== false) {
          const head = along(pts, p);
          // dashed trail from the start up to the moving head
          const trailPts: [number, number][] = [pts[0]];
          for (let s = 1; s < pts.length; s++) {
            const h = along(pts, Math.min(p, s / (pts.length - 1)));
            trailPts.push([h.x, h.y]);
            if (s / (pts.length - 1) >= p) break;
          }
          trailPts.push([head.x, head.y]);
          under.push(
            <path key={`tr${i}`} d={trailPts.map((q, k) => `${k ? "L" : "M"}${q[0]} ${q[1]}`).join(" ")} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={22} strokeLinecap="round" opacity={1} />,
            <path key={`tr${i}b`} d={trailPts.map((q, k) => `${k ? "L" : "M"}${q[0]} ${q[1]}`).join(" ")} fill="none" stroke={e.color ?? "#ffffff"} strokeWidth={14} strokeDasharray="18 14" strokeLinecap="round" opacity={1} />,
          );
        }
        for (let k = 0; k < n; k++) {
          const pk = Math.max(0, p - k * 0.035);
          const pos = along(pts, pk);
          const s = pop(e.t + k * 0.08) * 2.2 * TOKEN;
          over.push(
            <g key={`mv${i}-${k}`} transform={`translate(${pos.x + (k % 2) * 22} ${pos.y + (k % 3) * 10}) scale(${pos.dx < 0 ? -s : s} ${s})`}>
              <MapToken icon={e.icon} step={frame * 0.45 + k} color={e.color} />
            </g>,
          );
        }
        if (e.label && age < dur + 0.4) {
          const pos = along(pts, p);
          {
            const labelOpacity = interpolate(age, [dur - 0.2, dur + 0.4], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            over.push(
              <g key={`ml${i}`} opacity={labelOpacity}>
                <rect x={pos.x - 160} y={pos.y - 185} width={320} height={80} rx={16} fill="rgba(14,14,20,0.80)" />
                <text x={pos.x} y={pos.y - 120} textAnchor="middle" fontFamily={HAND_BOLD} fontSize={76} fill="#f7f4ee" stroke="rgba(0,0,0,0.6)" strokeWidth={6} paintOrder="stroke">
                  {e.label}
                </text>
              </g>,
            );
          }
        }
        break;
      }
      case "icon": {
        const [x, y] = P(e.at);
        const s = pop(e.t) * (e.size ?? 1) * TOKEN;
        const bob = Math.sin(frame / 9 + i) * 3;
        over.push(
          <g key={`ic${i}`} transform={`translate(${x} ${y + bob}) scale(${s})`}>
            <ellipse cx={0} cy={34} rx={34} ry={8} fill="rgba(0,0,0,0.25)" />
            <MapToken icon={e.icon} step={frame * 0.3} />
            {e.label ? (
              <text y={80} textAnchor="middle" fontFamily={HAND_BOLD} fontSize={44} {...outlined} strokeWidth={10}>
                {e.label}
              </text>
            ) : null}
          </g>,
        );
        break;
      }
      case "scatter": {
        const r = rand(i * 97 + 13);
        const spread = e.spread ?? 3;
        for (let k = 0; k < e.n; k++) {
          const lon = e.around[0] + (r() - 0.5) * spread * 2;
          const lat = e.around[1] + (r() - 0.5) * spread * 1.4;
          const [x, y] = P([lon, lat]);
          const s = pop(e.t + k * 0.12) * (e.size ?? 0.6) * TOKEN;
          if (s <= 0.001) continue;
          over.push(
            <g key={`sc${i}-${k}`} transform={`translate(${x} ${y}) scale(${s})`}>
              <MapToken icon={e.icon} step={frame * 0.3 + k} />
            </g>,
          );
        }
        break;
      }
      case "battle": {
        const [x, y] = P(e.at);
        const shake = age < 1.2 ? Math.sin(frame * 2.3) * 6 * (1 - age / 1.2) : 0;
        const burst = (age * 1.4) % 1;
        over.push(
          <g key={`bt${i}`} transform={`translate(${x + shake} ${y}) scale(${TOKEN * 0.9})`}>
            {Array.from({ length: 10 }).map((_, k) => {
              const a = (k / 10) * Math.PI * 2;
              return <path key={k} d={`M${Math.cos(a) * (30 + burst * 30)} ${Math.sin(a) * (30 + burst * 30)} L${Math.cos(a) * (50 + burst * 50)} ${Math.sin(a) * (50 + burst * 50)}`} stroke="#ffd34d" strokeWidth={6} strokeLinecap="round" opacity={1 - burst} />;
            })}
            <g transform={`scale(${pop(e.t) * 1.1})`}>
              <circle r={44} fill="#b23a2a" stroke={ink} strokeWidth={5} />
              <MapToken icon="swords" />
            </g>
            <g transform="translate(-48 28) scale(0.6)">
              <MapToken icon="fire" step={frame * 0.5} />
            </g>
            <g transform="translate(52 22) scale(0.5)">
              <MapToken icon="fire" step={frame * 0.5 + 2} />
            </g>
          </g>,
        );
        break;
      }
      case "flag": {
        const [x, y] = P(e.at);
        const rise = interpolate(age, [0, 0.5], [60, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) });
        over.push(
          <g key={`fg${i}`} transform={`translate(${x} ${y + rise}) scale(${TOKEN * 1.1})`} opacity={interpolate(age, [0, 0.15], [0, 1], { extrapolateRight: "clamp" })}>
            <ellipse cx={-20} cy={36} rx={22} ry={6} fill="rgba(0,0,0,0.3)" />
            <MapToken icon="flag" step={frame * 0.3 + i} color={e.color} />
            {e.label ? (
              <text x={20} y={-62} textAnchor="middle" fontFamily={HAND_BOLD} fontSize={38} {...outlined} strokeWidth={9}>
                {e.label}
              </text>
            ) : null}
          </g>,
        );
        break;
      }
      case "pin": {
        const [x, y] = P(e.at);
        const drop = interpolate(age, [0, 0.6], [-60, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
        const fade = interpolate(age, [0, 0.12], [0, 1], { extrapolateRight: "clamp" });
        over.push(
          <g key={`pn${i}`} opacity={fade}>
            <ellipse cx={x} cy={y + 2} rx={14} ry={5} fill="rgba(0,0,0,0.35)" />
            <g transform={`translate(${x} ${y + drop}) scale(0.8)`}>
              <path d="M0 0 C-13 -20 -24 -32 -24 -48 A24 24 0 1 1 24 -48 C24 -32 13 -20 0 0 Z" fill={e.color ?? "#f5c518"} stroke={ink} strokeWidth={4} />
              <circle cx={0} cy={-48} r={8} fill="#fffbe8" stroke={ink} strokeWidth={3} />
            </g>
            {e.label ? (() => {
              const spot = pinLabel(i);
              return (
                <text x={spot.x} y={spot.y} textAnchor={spot.anchor} fontFamily={SANS} fontWeight={600} fontSize={34} letterSpacing={3} fill="#ffffff" stroke="rgba(0,0,0,0.55)" strokeWidth={5} paintOrder="stroke" opacity={interpolate(age, [0.3, 0.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
                  {e.label.toUpperCase()}
                </text>
              );
            })() : null}
          </g>,
        );
        break;
      }
      case "medallion": {
        const [x, y] = P(e.at);
        const [dx, dy] = e.offset ?? [-250, -170];
        const size = e.size ?? 240;
        const s = pop(e.t);
        const lineK = interpolate(age, [0.2, 0.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        under.push(
          <g key={`ml${i}`}>
            <path d={`M${x + dx} ${y + dy} L${x} ${y}`} stroke="#ffffff" strokeWidth={5} strokeDasharray="2 12" strokeLinecap="round" pathLength={1} opacity={lineK} />
            <circle cx={x} cy={y} r={9} fill="#ffffff" stroke={ink} strokeWidth={3} opacity={lineK} />
          </g>,
        );
        medallions.push(
          <div key={`md${i}`} style={{ position: "absolute", left: x + dx, top: y + dy, transform: `translate(-50%,-50%) scale(${s})` }}>
            <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", border: "8px solid #f7f4ee", boxShadow: "0 0 0 4px #1e1a17, 0 14px 30px rgba(0,0,0,0.45)" }}>
              <Img src={staticFile(e.src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            {e.label ? (
              <div style={{ position: "absolute", top: size + 6, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", fontFamily: HAND_BOLD, fontWeight: 700, fontSize: 52, color: "#fff", WebkitTextStroke: "7px #1e1a17", paintOrder: "stroke fill" }}>
                {e.label}
              </div>
            ) : null}
          </div>,
        );
        break;
      }
      case "callout": {
        const [x, y] = P(e.at);
        const left = e.side ? e.side === "left" : x > W * 0.55;
        const dx = left ? -270 : 270;
        const dy = e.pos === "below" ? 230 : e.pos === "above" ? -250 : y < 360 ? 210 : -230;
        // keep clear of the right edge, where the guide stands
        const bx = Math.min(W - 640, Math.max(170, x + dx));
        const by = Math.min(H - 420, Math.max(170, y + dy));
        const s = e.persist ? 1 : spring({ frame: frame - e.t * fps, fps, config: { damping: 28, stiffness: 110 } });
        const lineK = e.persist ? 1 : interpolate(age, [0, 0.5], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
        under.push(
          <g key={`co${i}`}>
            <path d={`M${x} ${y} L${x + (bx - x) * lineK} ${y + (by - y) * lineK}`} stroke="#ffffff" strokeWidth={5} strokeDasharray="2 12" strokeLinecap="round" />
            <circle cx={x} cy={y} r={10} fill="#ffd34d" stroke={ink} strokeWidth={3} />
          </g>,
        );
        const R = 125;
        medallions.push(
          <div key={`cm${i}`} style={{ position: "absolute", left: bx, top: by, transform: `translate(-50%,-50%) scale(${s})`, opacity: e.persist ? 1 : Math.min(1, age * 4) }}>
            <div style={{ width: R * 2, height: R * 2, borderRadius: "50%", overflow: "hidden", background: "radial-gradient(circle at 50% 40%, #fffdf6, #efe6cf)", border: "7px solid #f7f4ee", boxShadow: "0 0 0 4px #1e1a17, 0 16px 34px rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {e.src && hasFile(e.src) ? (
                <Img src={staticFile(e.src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : e.icon && isCardIcon(e.icon) ? (
                <div style={{ position: "relative", width: R * 2, height: R * 2 }}>
                  <Icon name={e.icon} x={50} y={52} scale={0.42} anim="none" />
                </div>
              ) : e.icon ? (
                <svg viewBox="-80 -80 160 160" width={R * 1.7} height={R * 1.7} style={{ overflow: "visible" }}>
                  <g transform={`scale(1.35) translate(0 ${Math.sin(frame / 20) * 2})`}>
                    <MapToken icon={e.icon as MapIcon} step={frame * 0.3} />
                  </g>
                </svg>
              ) : null}
            </div>
            {e.label ? (
              <div style={{ position: "absolute", top: R * 2 + 10, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap", fontFamily: HAND, fontWeight: 700, fontSize: 46, color: "#fff", WebkitTextStroke: "6px rgba(0,0,0,0.6)", paintOrder: "stroke fill" }}>
                {e.label}
              </div>
            ) : null}
          </div>,
        );
        break;
      }
      case "nation": {
        const [x, y] = P(e.at);
        const rise = spring({ frame: frame - e.t * fps, fps, config: { damping: 28, stiffness: 110 } });
        over.push(
          <g key={`na${i}`} transform={`translate(${x} ${y + (1 - rise) * 40})`} opacity={Math.min(1, age * 5)}>
            <FlagPole code={e.code} f={frame} s={0.95} />
            {e.label ? (
              <text y={42} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={32} letterSpacing={3} fill="#ffffff" stroke="rgba(0,0,0,0.6)" strokeWidth={6} paintOrder="stroke">
                {e.label.toUpperCase()}
              </text>
            ) : null}
          </g>,
        );
        break;
      }
      case "pulse": {
        const [x, y] = P(e.at);
        over.push(
          <g key={`pu${i}`}>
            {[0, 0.33, 0.66].map((off) => {
              const q = (age * 0.8 + off) % 1;
              return <circle key={off} cx={x} cy={y} r={12 + q * 70} fill="none" stroke={e.color ?? "#fff3c4"} strokeWidth={5} opacity={1 - q} />;
            })}
            <circle cx={x} cy={y} r={11} fill={e.color ?? "#ffd34d"} stroke={ink} strokeWidth={4} />
          </g>,
        );
        break;
      }
      case "label": {
        const [x, y] = P(e.at);
        const region = e.style === "region";
        const txt = e.caps || region ? e.text.toUpperCase() : e.text;
        const shown = Math.min(txt.length, Math.floor(age * (region ? 14 : 20)) + 1);
        const size = (e.size ?? (region ? 110 : 64)) * 1.15;
        over.push(
          <text
            key={`lb${i}`}
            x={x}
            y={y}
            transform={e.rotate ? `rotate(${e.rotate} ${x} ${y})` : undefined}
            textAnchor="middle"
            fontFamily={HAND}
            fontSize={size}
            letterSpacing={e.spacing ?? (region ? size * 0.22 : e.caps ? 6 : 1)}
            {...outlined}
            fill={e.color ?? (region ? "rgba(255,255,255,0.93)" : "#ffffff")}
            stroke={region ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.6)"}
            strokeWidth={region ? 6 : 9}
          >
            {txt.slice(0, shown)}
          </text>,
        );
        break;
      }
      case "counter": {
        const [x, y] = P(e.at);
        const k = Easing.out(Easing.cubic)(Math.min(1, age / (e.dur ?? 2)));
        const n = Math.round(e.from + (e.to - e.from) * k);
        over.push(
          <g key={`ct${i}`} transform={`translate(${x} ${y}) scale(${pop(e.t)})`}>
            <text y={14} textAnchor="middle" fontFamily={HAND} fontSize={64} fill="#ffffff" stroke="rgba(0,0,0,0.6)" strokeWidth={9} paintOrder="stroke">
              {`${e.prefix ?? ""}${n.toLocaleString("en-US")}${e.suffix ?? ""}`}
            </text>
          </g>,
        );
        break;
      }
      case "dotScatter": {
        // Scatter white dots across a bounding box. bbox = [lonMin, latMin, lonMax, latMax]
        const [lonMin, latMin, lonMax, latMax] = e.bbox;
        const n = e.n ?? 40;
        const dotColor = e.color ?? "rgba(255,255,255,0.72)";
        const dotR = e.size ?? 5;
        // seeded pseudo-random so dots don't jump each frame
        const dots: { x: number; y: number; delay: number }[] = [];
        for (let d = 0; d < n; d++) {
          const seed1 = Math.sin(d * 127.1 + 311.7) * 43758.5453;
          const seed2 = Math.sin(d * 269.5 + 183.3) * 43758.5453;
          const lon = lonMin + (seed1 - Math.floor(seed1)) * (lonMax - lonMin);
          const lat = latMin + (seed2 - Math.floor(seed2)) * (latMax - latMin);
          const [dx, dy] = P([lon, lat]);
          dots.push({ x: dx, y: dy, delay: d / n });
        }
        over.push(
          <g key={`ds${i}`}>
            {dots.map((dot, di) => {
              const dotAge = Math.max(0, age - dot.delay * 0.6);
              const s = spring({ frame: Math.round(dotAge * fps), fps, config: { damping: 24, stiffness: 160 } });
              return <circle key={di} cx={dot.x} cy={dot.y} r={dotR} fill={dotColor} opacity={Math.min(1, dotAge * 6)} transform={`scale(${s})`} style={{ transformOrigin: `${dot.x}px ${dot.y}px` }} />;
            })}
          </g>,
        );
        break;
      }
      case "crossOut": {
        const [x, y] = P(e.at);
        const size = e.size ?? 110;
        const col = e.color ?? "#e63329";
        const mark = e.mark ?? "X";
        // Draw X as two crossed lines, or ? as text
        const draw = spring({ frame: frame - e.t * fps, fps, config: { damping: 18, stiffness: 80 } });
        const wobble = Math.sin(frame / 8) * 3;
        over.push(
          <g key={`cx${i}`} transform={`translate(${x} ${y}) rotate(${wobble})`} opacity={Math.min(1, age * 5)}>
            {mark === "X" ? (
              <>
                <line
                  x1={-size} y1={-size} x2={size * draw} y2={size * draw}
                  stroke={col} strokeWidth={22} strokeLinecap="round"
                  pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw}
                />
                <line
                  x1={size} y1={-size} x2={-size * draw} y2={size * draw}
                  stroke={col} strokeWidth={22} strokeLinecap="round"
                  pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw}
                />
                {/* white halo for legibility */}
                <line x1={-size} y1={-size} x2={size} y2={size} stroke="rgba(255,255,255,0.35)" strokeWidth={30} strokeLinecap="round" />
                <line x1={size} y1={-size} x2={-size} y2={size} stroke="rgba(255,255,255,0.35)" strokeWidth={30} strokeLinecap="round" />
              </>
            ) : (
              <text textAnchor="middle" dominantBaseline="central" fontFamily={HAND_BOLD} fontSize={size * 2.2} fill={col} stroke="rgba(0,0,0,0.5)" strokeWidth={12} paintOrder="stroke" transform={`scale(${draw})`}>
                {mark}
              </text>
            )}
          </g>,
        );
        break;
      }
      case "legendBadge": {
        // Map-pinned badge — appears near the specified location as a dark pill
        const [x, y] = e.at ? P(e.at) : [120, H - 120 - (i * 90)];
        const s = pop(e.t);
        const badgeColor = e.color ?? "rgba(28,24,20,0.82)";
        over.push(
          <g key={`lb${i}`} transform={`translate(${x} ${y}) scale(${s})`} opacity={Math.min(1, age * 4)}>
            <rect x={-110} y={-32} width={220} height={62} rx={31} fill={badgeColor} stroke="rgba(255,255,255,0.22)" strokeWidth={2.5} />
            {e.icon ? (
              <>
                <circle cx={-78} cy={-1} r={22} fill="rgba(255,255,255,0.14)" />
                <g transform="translate(-78 -1) scale(0.28)">
                  <MapToken icon={e.icon} step={frame * 0.3} />
                </g>
                <text x={-46} y={6} fontFamily={HAND} fontSize={34} fill="#ffffff" stroke="rgba(0,0,0,0.5)" strokeWidth={5} paintOrder="stroke">
                  {e.label}
                </text>
              </>
            ) : (
              <text x={0} y={6} textAnchor="middle" fontFamily={HAND} fontSize={34} fill="#ffffff" stroke="rgba(0,0,0,0.5)" strokeWidth={5} paintOrder="stroke">
                {e.label}
              </text>
            )}
          </g>,
        );
        break;
      }
    }
  });

  // drifting cloud shadows (screen space)
  const clouds = [0, 1, 2].map((k) => {
    const x = ((sec * (18 + k * 7) + k * 700) % (W + 900)) - 450;
    return <ellipse key={k} cx={x} cy={200 + k * 300} rx={360} ry={130} fill="url(#cloud)" />;
  });

  return (
    <AbsoluteFill>
      {useSat ? <SatLayer proj={proj} zoom={view.zoom} /> : null}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ position: "absolute" }}>
        <defs>
          <radialGradient id="sea" cx="40%" cy="40%" r="80%">
            <stop offset="0%" stopColor="#3d80e0" />
            <stop offset="100%" stopColor="#1a4f9e" />
          </radialGradient>
          <radialGradient id="cloud">
            <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <pattern id="waves" patternUnits="userSpaceOnUse" width={140} height={70} patternTransform={`translate(${(frame * 0.8) % 140} ${(frame * 0.3) % 70})`}>
            <path d="M10 20 q12 -10 24 0 M80 55 q12 -10 24 0" stroke="rgba(255,255,255,0.18)" strokeWidth={3} fill="none" strokeLinecap="round" />
          </pattern>
          <pattern id="relief" patternUnits="userSpaceOnUse" width={512} height={512}>
            <image href={staticFile("fx/relief.png")} width={512} height={512} />
          </pattern>
          <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
            <path d="M0 0 L10 5 L0 10 z" fill="#ffffff" />
          </marker>
        </defs>

        {useSat ? (
          null
        ) : (
          <>
            {/* painted map, used until satellite tiles are built */}
        <rect width={W} height={H} fill="url(#sea)" />
        {/* shallow water along every coast */}
        <g fill="none" stroke="#5aa0dc" strokeWidth={view.zoom > 6 ? 26 : 14} strokeLinejoin="round" opacity={0.55}>
          {features.map((f, i) => (
            <path key={i} d={path(f) ?? ""} />
          ))}
        </g>
        <g stroke="rgba(40,48,28,0.4)" strokeWidth={1.4}>
          {features.map((f, i) => (
            <path key={i} d={path(f) ?? ""} fill={tints[i]} />
          ))}
        </g>
        <g fill="url(#relief)" style={{ mixBlendMode: "multiply" }} opacity={0.55}>
          {features.map((f, i) => (
            <path key={i} d={path(f) ?? ""} />
          ))}
        </g>
          </>
        )}

        {v.regions?.map((r, ri) => (
          <g key={`r${ri}`} opacity={reveal(r.at ?? 0, 1.2) * (r.opacity ?? 0.72)}>
            {r.countries.map((name) => {
              const f = byName.get(name);
              return f ? <path key={name} d={path(f) ?? ""} fill={r.color ?? "#e08a1f"} stroke="#fff3d6" strokeWidth={2.5} strokeLinejoin="round" /> : null;
            })}
          </g>
        ))}

        {v.rivers?.map((r, i) => {
          const k = reveal(r.at ?? 0, 2.2);
          const d = line(r.points);
          return (
            <g key={`rv${i}`} fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d={d} stroke="#ffffff" strokeWidth={13} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} />
              <path d={d} stroke="#6fb6f0" strokeWidth={7} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} />
              {k >= 1 ? <path d={d} stroke="rgba(255,255,255,0.8)" strokeWidth={3} strokeDasharray="6 30" strokeDashoffset={-frame * 1.5} /> : null}
            </g>
          );
        })}

        {v.routes?.map((r, i) => {
          const k = reveal(r.at ?? 0, 2.4);
          return (
            <path key={`ro${i}`} d={curve(r.points)} fill="none" stroke={r.color ?? "#ffffff"} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} markerEnd={k > 0.98 ? "url(#arrow)" : undefined} />
          );
        })}

        {under}

        {v.cities?.map((c, i) => {
          const s = sec - (c.t ?? 0);
          if (s < 0) return null;
          const [x, y] = P(c.at);
          const pulse = (s * 1.2) % 1;
          return (
            <g key={`c${i}`}>
              <circle cx={x} cy={y} r={14 + pulse * 40} fill="none" stroke="#fff3c4" strokeWidth={4} opacity={1 - pulse} />
              <circle cx={x} cy={y} r={13} fill="#ffd34d" stroke={ink} strokeWidth={4} />
              <text x={x} y={y - 34} textAnchor="middle" fontFamily={HAND_BOLD} fontSize={66} {...outlined}>
                {c.name}
              </text>
            </g>
          );
        })}

        {over}
        {clouds}
      </svg>

      {v.rulers?.map((r, i) => {
        const member = cast.find((c) => c.id === r.cast);
        if (!member) return null;
        const [x, y] = P(r.at);
        const s = spring({ frame: frame - (r.t ?? 0) * fps, fps, config: { damping: 26 } });
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-62%) scale(${s})` }}>
            <div style={{ height: 230, overflow: "hidden" }}>
              <Character spec={member.look} pose="happy" height={560} seed={i} />
            </div>
            {r.label ? (
              <div style={{ textAlign: "center", fontFamily: HAND, fontSize: 46, fontWeight: 700, color: "#ffe9a8", WebkitTextStroke: "6px #1e1a17", paintOrder: "stroke fill" }}>{r.label}</div>
            ) : null}
          </div>
        );
      })}
      {medallions}
      {v.dateCounter ? (() => {
        const dc = v.dateCounter;
        const startNum = typeof dc.start === "number" ? dc.start : parseInt(String(dc.start), 10);
        const endNum = dc.end !== undefined ? (typeof dc.end === "number" ? dc.end : parseInt(String(dc.end), 10)) : startNum;
        const dur = dc.dur ?? total;
        const k = Easing.inOut(Easing.cubic)(Math.min(1, sec / Math.max(0.1, dur)));
        const val = Math.round(startNum + (endNum - startNum) * k);
        const display = `${dc.prefix ?? ""}${typeof dc.start === "number" ? val.toLocaleString("en-US") : val}${dc.suffix ?? ""}`;
        const fadeIn = Math.min(1, sec * 3);
        return (
          <div style={{
            position: "absolute", top: 36, left: 36,
            background: "rgba(20,16,12,0.78)",
            border: "2.5px solid rgba(255,220,120,0.55)",
            borderRadius: 18,
            padding: "10px 28px 10px 22px",
            fontFamily: HAND_BOLD,
            fontSize: 58,
            color: "#ffe9a8",
            WebkitTextStroke: "4px rgba(0,0,0,0.5)",
            paintOrder: "stroke fill",
            opacity: fadeIn,
            pointerEvents: "none",
            letterSpacing: 2,
            lineHeight: 1.1,
            boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
          }}>
            {display}
          </div>
        );
      })() : null}
      {v.intro === "clouds" ? <CloudIntro sec={sec} dur={v.introDur ?? 3.2} /> : null}
    </AbsoluteFill>
  );
};

/** Satellite tiles: the world overview when zoomed out, 30° tiles in the middle range, 10° tiles up close. */
const SatLayer: React.FC<{ proj: ReturnType<typeof project>; zoom: number }> = ({ proj, zoom }) => {
  const pxPerDeg = (zoom * W) / 360;
  const [lonL, latT] = proj.invert!([0, 0])!;
  const [lonR, latB] = proj.invert!([W, H])!;
  const box = (lon0: number, lat0: number, dLon: number, dLat: number): React.CSSProperties => {
    const [ax, ay] = proj([lon0, lat0])!;
    const [bx, by] = proj([lon0 + dLon, lat0 - dLat])!;
    return { position: "absolute", left: ax, top: ay, width: bx - ax + 1.5, height: by - ay + 1.5 };
  };
  const visible = (lon0: number, lat0: number, deg: number) => lon0 + deg > lonL && lon0 < lonR && lat0 > latB && lat0 - deg < latT;
  const tiles = (level: { deg: number; tiles: string[] }, dir: string) =>
    level.tiles
      .map((k) => k.split("_").map(Number))
      .filter(([lon0, lat0]) => visible(lon0, lat0, level.deg))
      .map(([lon0, lat0]) => <Img key={`${dir}${lon0}_${lat0}`} src={staticFile(`sat/${dir}/${lon0}_${lat0}.jpg`)} style={box(lon0, lat0, level.deg, level.deg)} />);
  return (
    <AbsoluteFill style={{ background: "#0d2a5c", overflow: "hidden", filter: "saturate(1.15) contrast(1.06) brightness(1.07)" }}>
      {pxPerDeg <= 13 && SAT.world ? (
        <Img src={staticFile(SAT.world)} style={box(-180, 90, 360, 180)} />
      ) : (
        <>
          {tiles(SAT.mid, "mid")}
          {pxPerDeg > 66 ? tiles(SAT.hi, "hi") : null}
        </>
      )}
    </AbsoluteFill>
  );
};

/** Fly down through soft clouds: they swell, drift outward and thin out as the camera dives. */
const CloudIntro: React.FC<{ sec: number; dur: number }> = ({ sec, dur }) => {
  const p = Math.min(1, sec / dur);
  if (p >= 1) return null;
  const r = rand(42);
  const puffs = Array.from({ length: 18 }, () => ({ x: r() * 1.3 - 0.15, y: r() * 1.3 - 0.15, s: 0.6 + r() * 0.9 }));
  const e = Easing.inOut(Easing.sin)(p);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: `rgba(244,246,248,${(1 - e) * 0.75})` }} />
      {puffs.map((c, i) => {
        const cx = 0.5 + (c.x - 0.5) * (1 + e * 1.8);
        const cy = 0.5 + (c.y - 0.5) * (1 + e * 1.8);
        const size = 900 * c.s * (1 + e * 1.6);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${cx * 100}%`,
              top: `${cy * 100}%`,
              width: size,
              height: size * 0.62,
              transform: "translate(-50%,-50%)",
              borderRadius: "50%",
              background: "radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(250,250,252,0.75) 35%, rgba(255,255,255,0) 70%)",
              opacity: 1 - Math.pow(p, 1.4),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
