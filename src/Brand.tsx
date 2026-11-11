import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { Character } from "./components/Character";
import { MapScene } from "./components/MapScene";
import { MapToken } from "./components/MapIcons";
import { HAND_BOLD } from "./theme";
import type { CharacterSpec, Visual } from "./schema";
import demo from "../episodes/demo-mali.json";

const MASCOT = (demo as any).mascot as CharacterSpec;

const useFonts = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(h));
  }, [h]);
};

const title = (size: number): React.CSSProperties => ({
  fontFamily: HAND_BOLD,
  fontWeight: 700,
  fontSize: size,
  color: "#f5c518",
  WebkitTextStroke: `${size / 8}px #1e1a17`,
  paintOrder: "stroke fill",
  textShadow: `0 ${size / 14}px 0 rgba(0,0,0,0.35)`,
  lineHeight: 1,
  whiteSpace: "nowrap",
});

const Coin: React.FC<{ x: number; y: number; r: number; rot?: number }> = ({ x, y, r, rot = 0 }) => (
  <svg width={r * 2} height={r * 2} viewBox="-50 -50 100 100" style={{ position: "absolute", left: x - r, top: y - r, transform: `rotate(${rot}deg)` }}>
    <circle r={46} fill="#f2c230" stroke="#1e1a17" strokeWidth={6} />
    <circle r={34} fill="none" stroke="#c99a1a" strokeWidth={4} />
    <text y={15} textAnchor="middle" fontFamily={HAND_BOLD} fontWeight={700} fontSize={42} fill="#8a5a10">
      ¼
    </text>
  </svg>
);

/** 800 x 800 profile picture: the guide on a gold sunburst, framed for YouTube's circle crop. */
export const Avatar: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 42%, #2f8f88 0%, #1f5f5b 60%, #123c3a 100%)", overflow: "hidden" }}>
      <svg width={800} height={800} style={{ position: "absolute" }}>
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return <path key={i} d={`M400 330 L${400 + Math.cos(a) * 600} ${330 + Math.sin(a) * 600} L${400 + Math.cos(a + 0.12) * 600} ${330 + Math.sin(a + 0.12) * 600} Z`} fill="rgba(245,197,24,0.13)" />;
        })}
      </svg>
      <Coin x={150} y={250} r={70} rot={-14} />
      <Coin x={655} y={210} r={56} rot={12} />
      <div style={{ position: "absolute", left: 445, top: 215, transform: "translateX(-50%)" }}>
        <Character spec={MASCOT} pose="happy" mouth={0} height={940} />
      </div>
    </AbsoluteFill>
  );
};

const bannerMap: Extract<Visual, { kind: "map" }> = {
  kind: "map",
  from: { lon: 14, lat: 18, zoom: 1.55 },
  events: [
    { type: "fill", countries: ["Argentina", "Switzerland", "Japan", "Spain", "Netherlands", "United States of America"], t: 0, color: "#e0a526", stagger: 0 },
    { type: "flow", path: [[-58.4, -34.6], [-35, -5], [-15, 25], [-3.7, 40.4]], t: 0, color: "#ffd34d", width: 7 },
    { type: "flow", path: [[-74, 40.7], [-40, 48], [-10, 50], [4.9, 52.4]], t: 0, color: "#ffffff", width: 6 },
    { type: "flow", path: [[8.5, 47.4], [60, 40], [110, 33], [139.7, 35.7]], t: 0, color: "#ffd34d", width: 7 },
    { type: "pin", at: [-58.4, -34.6], t: 0 },
    { type: "pin", at: [8.5, 47.4], t: 0 },
    { type: "pin", at: [139.7, 35.7], t: 0 },
  ],
};

/** 2560 x 1440 channel banner. Everything that matters sits inside YouTube's 1546 x 423 safe area. */
export const Banner: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{ background: "#0d2a5c", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 1920, height: 1080, transform: "scale(1.33334)", transformOrigin: "0 0" }}>
        <MapScene v={bannerMap} cast={[]} />
      </div>
      {/* darken the band behind the title so it reads on TV, desktop and phone */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,20,40,0.15) 0%, rgba(10,20,40,0.55) 40%, rgba(10,20,40,0.55) 60%, rgba(10,20,40,0.15) 100%)" }} />
      {/* safe area: x 507-2053, y 508-931 */}
      <div style={{ position: "absolute", left: 600, top: 545, width: 1100 }}>
        <div style={title(150)}>Farthing Explains</div>
        <div style={{ ...title(64), color: "#ffffff", marginTop: 26, WebkitTextStroke: "8px #1e1a17" }}>How money makes and breaks nations</div>
        <div style={{ ...title(46), color: "#ffd34d", marginTop: 26, WebkitTextStroke: "7px #1e1a17" }}>New stories every week</div>
      </div>
      <Coin x={560} y={600} r={52} rot={-12} />
      <Coin x={1760} y={880} r={40} rot={16} />
      <div style={{ position: "absolute", left: 1835, top: 478 }}>
        <Character spec={MASCOT} pose="point" mouth={0} height={460} flip />
      </div>
      <svg viewBox="-80 -80 160 160" width={150} height={150} style={{ position: "absolute", left: 1650, top: 800, overflow: "visible" }}>
        <MapToken icon="gold" />
      </svg>
    </AbsoluteFill>
  );
};
