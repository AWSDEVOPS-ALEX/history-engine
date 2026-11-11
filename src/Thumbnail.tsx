import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { Character } from "./components/Character";
import { FlagArt } from "./components/Flags";
import { MapToken } from "./components/MapIcons";
import { HAND_BOLD } from "./theme";
import type { CharacterSpec } from "./schema";
import ep from "../episodes/ep01-argentina.json";

/** YouTube thumbnail for Ep 1 (1280×720): `npx remotion still Thumb01 out/thumb-ep01.png` */
const MASCOT = (ep as any).mascot as CharacterSpec;
const ink = "#1e1a17";

const useFonts = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(h));
  }, [h]);
};

const word = (size: number, color: string): React.CSSProperties => ({
  fontFamily: HAND_BOLD,
  fontWeight: 700,
  fontSize: size,
  color,
  WebkitTextStroke: `${size / 7}px ${ink}`,
  paintOrder: "stroke fill",
  textShadow: `0 ${size / 12}px 0 rgba(0,0,0,0.45)`,
  lineHeight: 1,
  whiteSpace: "nowrap",
  letterSpacing: 2,
});

// jagged crack running down the middle of the flag
const CRACK = "M640 0 L612 70 L660 130 L604 205 L668 270 L618 352 L676 420 L622 505 L664 580 L630 650 L650 720";

export const Thumb01: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{ background: "#111" }}>
      <svg viewBox="0 0 1280 720" width="100%" height="100%" style={{ position: "absolute" }}>
        <defs>
          <radialGradient id="rich" cx="25%" cy="45%" r="70%">
            <stop offset="0%" stopColor="#fff2b0" />
            <stop offset="45%" stopColor="#f2b632" />
            <stop offset="100%" stopColor="#8a5a10" />
          </radialGradient>
          <radialGradient id="broke" cx="78%" cy="45%" r="70%">
            <stop offset="0%" stopColor="#c0392b" />
            <stop offset="60%" stopColor="#6e1610" />
            <stop offset="100%" stopColor="#240706" />
          </radialGradient>
          <clipPath id="left">
            <path d={`${CRACK} L0 720 L0 0 Z`} />
          </clipPath>
          <clipPath id="right">
            <path d={`${CRACK} L1280 720 L1280 0 Z`} />
          </clipPath>
        </defs>

        {/* rich side: gold glow and the flag, upright */}
        <g clipPath="url(#left)">
          <rect width={1280} height={720} fill="url(#rich)" />
          <g transform="translate(40 160) scale(6.6 7)">
            <FlagArt code="ar" />
          </g>
          <rect width={1280} height={720} fill="rgba(255,210,90,0.08)" />
          {[
            [120, 560, 1.7], [250, 610, 1.4], [380, 575, 1.6], [190, 470, 1.2], [470, 630, 1.3], [90, 300, 1.1], [530, 420, 1.0],
          ].map(([x, y, s], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(${s}) rotate(${i * 23})`}>
              <MapToken icon="gold" step={i} />
            </g>
          ))}
        </g>

        {/* broke side: dark red, the flag slipping and tilted, a DEFAULT stamp */}
        <g clipPath="url(#right)">
          <rect width={1280} height={720} fill="url(#broke)" />
          <g transform="translate(560 190) rotate(8) scale(6.6 7)" opacity={0.55}>
            <FlagArt code="ar" />
          </g>
          <rect width={1280} height={720} fill="rgba(40,0,0,0.35)" />
        </g>

        {/* the crack itself */}
        <path d={CRACK} stroke={ink} strokeWidth={16} fill="none" strokeLinejoin="round" />
        <path d={CRACK} stroke="#fff" strokeWidth={4} fill="none" strokeLinejoin="round" opacity={0.8} />
      </svg>

      {/* DEFAULT stamp on the broke side */}
      <div
        style={{
          position: "absolute",
          left: 760,
          top: 470,
          transform: "rotate(-14deg)",
          border: `12px solid #ff3b2f`,
          borderRadius: 18,
          padding: "2px 22px 8px",
          fontFamily: HAND_BOLD,
          fontWeight: 700,
          fontSize: 92,
          color: "#ff3b2f",
          letterSpacing: 6,
          background: "rgba(255,255,255,0.9)",
          boxShadow: "0 10px 0 rgba(0,0,0,0.35)",
        }}
      >
        DEFAULT
      </div>

      {/* headline */}
      <div style={{ position: "absolute", left: 40, top: 26, ...word(150, "#fff36b") }}>RICH</div>
      <div style={{ position: "absolute", left: 345, top: 30, ...word(140, "#ffffff") }}>➜</div>
      <div style={{ position: "absolute", left: 470, top: 26, ...word(150, "#ff4d3d") }}>BROKE</div>
      <div style={{ position: "absolute", left: 980, top: 18, ...word(178, "#ffffff"), transform: "rotate(6deg)" }}>×9</div>

      {/* the chronicler, shocked */}
      <div style={{ position: "absolute", left: 470, bottom: -180, filter: "drop-shadow(0 14px 18px rgba(0,0,0,0.55))" }}>
        <Character spec={MASCOT} pose="confused" mouth={1} height={760} />
      </div>
    </AbsoluteFill>
  );
};
