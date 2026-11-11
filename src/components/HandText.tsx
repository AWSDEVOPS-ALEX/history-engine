import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { outlineCss } from "../theme";
import type { Label } from "../schema";

const CHARS_PER_SEC = 20;

/**
 * Handwritten label: pops in with a little bounce, types on letter by letter, then (optionally)
 * gets a marker underline, circle or box drawn around it. Wobbles gently while on screen.
 */
export const HandText: React.FC<{ label: Label; plate?: boolean }> = ({ label, plate = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = (label.at ?? 0) * fps;
  const t = frame - start;
  if (t < 0) return null;
  const text = label.caps ? label.text.toUpperCase() : label.text;
  // big numbers and key words (size 86+) slam in whole instead of typing
  const big = (label.size ?? 76) >= 86;
  const shown = big ? text.length : Math.min(text.length, Math.floor((t / fps) * CHARS_PER_SEC) + 1);
  const size = Math.max(66, (label.size ?? 76) * (big ? 1.5 : 1.3));
  const pop = big
    ? 1 + 0.35 * (1 - spring({ frame: t, fps, config: { damping: 28, stiffness: 140 }, durationInFrames: 16 }))
    : spring({ frame: t, fps, config: { damping: 27, stiffness: 140 }, durationInFrames: 18 });
  const shake = 0;
  const wobble = Math.sin((frame + label.x * 7) / 40) * 0.6;

  // emphasis mark, drawn after the text has finished typing
  const typedAt = big ? 8 : (text.length / CHARS_PER_SEC) * fps;
  const k = interpolate(t, [typedAt + 2, typedAt + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  const w = text.length * size * (label.caps ? 0.62 : 0.5);
  const h = size * 1.1;
  const color = label.emphColor ?? "#e0402b";
  const mark =
    label.emph === "underline"
      ? `M${-w * 0.52} ${h * 0.62} Q0 ${h * 0.78} ${w * 0.54} ${h * 0.58}`
      : label.emph === "circle"
        ? `M${w * 0.1} ${-h * 0.75} C${w * 0.75} ${-h * 0.8} ${w * 0.8} ${h * 0.75} 0 ${h * 0.78} C${-w * 0.8} ${h * 0.8} ${-w * 0.75} ${-h * 0.72} ${w * 0.18} ${-h * 0.82}`
        : label.emph === "box"
          ? `M${-w * 0.56} ${-h * 0.62} L${w * 0.57} ${-h * 0.66} L${w * 0.56} ${h * 0.64} L${-w * 0.55} ${h * 0.62} Z`
          : null;

  return (
    <div
      style={{
        position: "absolute",
        left: `${label.x}%`,
        top: `${label.y}%`,
        transform: `translate(calc(-50% + ${shake}px), -50%) rotate(${(label.rotate ?? 0) + wobble}deg) scale(${pop})`,
        opacity: Math.min(1, t / (big ? 5 : 4)),
      }}
    >
      {mark ? (
        <svg width={w * 2} height={h * 3} viewBox={`${-w} ${-h * 1.5} ${w * 2} ${h * 3}`} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", overflow: "visible" }}>
          <path d={mark} fill="none" stroke="#1e1a17" strokeWidth={size / 5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} opacity={0.6} />
          <path d={mark} fill="none" stroke={color} strokeWidth={size / 9} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} />
        </svg>
      ) : null}
      <div
        style={{
          position: "relative",
          ...outlineCss(size, label.color ?? "#ffffff"),
          fontSize: size,
          letterSpacing: label.caps ? size * 0.06 : size * 0.01,
          whiteSpace: "pre",
          // on busy backgrounds (maps, sets) the words sit on a dark plate so they never blend in
          ...(plate && text.length > 2 ? { background: "rgba(14,12,10,0.55)", borderRadius: size * 0.25, padding: `0 ${size * 0.28}px ${size * 0.08}px` } : {}),
        }}
      >
        {text.slice(0, shown)}
        <span style={{ opacity: 0 }}>{text.slice(shown)}</span>
      </div>
    </div>
  );
};
