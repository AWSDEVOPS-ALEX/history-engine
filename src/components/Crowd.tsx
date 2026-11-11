import React from "react";
import { AbsoluteFill, Img, getStaticFiles, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Character } from "./Character";
import { Icon, isCardIcon } from "./Icons";
import { MapToken } from "./MapIcons";
import { HAND_BOLD, outlineCss } from "../theme";
import type { Bubble, Cam, CastMember, CharacterSpec, Pose, Visual } from "../schema";

/* ---------- camera ---------- */

/** Slow push-in (or pull-out) on any flat scene, centred on a point. Vector art stays sharp. */
export const CamWrap: React.FC<{ cam?: Cam; children: React.ReactNode }> = ({ cam, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  if (!cam) return <>{children}</>;
  const z = interpolate(frame, [0, durationInFrames], [cam.from ?? 1, cam.to ?? (cam.from ?? 1) * 1.08], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: `${cam.x}% ${cam.y}%` }}>{children}</AbsoluteFill>;
};

/* ---------- crowds ---------- */

const SKINS = ["#f0cfb0", "#e8c4a0", "#d9a878", "#c89a6a", "#a8754a", "#e0b48c"];
const CLOTHES = ["#b23a2a", "#2d5a7b", "#5b6b3a", "#7a3b5a", "#e07b1f", "#4f6d8f", "#8a5a2b", "#3a3a48", "#2f7f7a"];
const HAIR = ["#2b2622", "#3a2a1e", "#5a3d2b", "#9a9a9a", "#7a4a2a"];
const HATS: CharacterSpec["hat"][] = ["none", "cap", "brim", "none", "tallhat", "none", "cap"];

const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** A generic townsperson, varied by seed. */
export const extra = (seed: number): CharacterSpec => ({
  skin: SKINS[Math.floor(rnd(seed) * SKINS.length)],
  robe: CLOTHES[Math.floor(rnd(seed + 1) * CLOTHES.length)],
  trim: "#e0b84a",
  hair: HAIR[Math.floor(rnd(seed + 2) * HAIR.length)],
  hat: HATS[Math.floor(rnd(seed + 3) * HATS.length)],
  hatColor: CLOTHES[Math.floor(rnd(seed + 4) * CLOTHES.length)],
  bun: rnd(seed + 5) > 0.7,
  beard: rnd(seed + 6) > 0.75 ? "short" : "none",
  beardColor: "#3a2a1e",
  glasses: rnd(seed + 7) > 0.85,
});

type CrowdV = Extract<Visual, { kind: "crowd" }>;

/**
 * Several people reacting together: cheering, running across, protesting (arms up, bouncing) or
 * queueing. Two depth rows, back row smaller, so it reads as a crowd rather than a line-up.
 */
export const CrowdLayer: React.FC<{ v: CrowdV }> = ({ v }) => {
  const frame = useCurrentFrame();
  const n = v.n ?? 7;
  const seed = v.seed ?? 1;
  const action = v.action ?? "cheer";
  const people = Array.from({ length: n }).map((_, i) => {
    const back = i % 2 === 1;
    const h = back ? 380 : 470;
    let x = action === "queue" ? 12 + i * (76 / Math.max(1, n - 1)) : 8 + ((i + 0.5) / n) * 84 + (rnd(seed + i) - 0.5) * 6;
    let y = 0;
    let pose: Pose = "talk";
    let flip = rnd(seed + i * 3) > 0.5;
    const ph = rnd(seed + i * 5) * 10;
    if (action === "cheer") {
      pose = (Math.floor((frame + ph * 10) / 26) % 2 ? "happy" : "point") as Pose;
      y = -Math.abs(Math.sin(frame / 9 + ph)) * 16;
    } else if (action === "protest") {
      pose = (Math.floor((frame + ph * 10) / 16) % 2 ? "angry" : "happy") as Pose;
      y = -Math.abs(Math.sin(frame / 6 + ph)) * 14;
    } else if (action === "run") {
      pose = "confused";
      flip = false;
      x = ((x + frame * (0.55 + rnd(seed + i) * 0.3)) % 120) - 10;
      y = -Math.abs(Math.sin(frame / 3 + ph)) * 26;
    } else if (action === "queue") {
      pose = i === 0 ? "talk" : (["shrug", "confused", "talk", "angry"] as Pose[])[i % 4];
      flip = true;
      y = Math.sin(frame / 20 + ph) * 3;
    } else {
      pose = (["talk", "shrug", "confused"] as Pose[])[i % 3];
    }
    return { i, back, h, x, y, pose, flip };
  });
  return (
    <AbsoluteFill>
      {[...people].sort((a, b) => Number(b.back) - Number(a.back)).map((p) => (
        <div key={p.i} style={{ position: "absolute", left: `${p.x}%`, bottom: p.back ? 230 : 60, transform: `translate(-50%, ${p.y}px)` }}>
          <div style={{ position: "absolute", left: "50%", bottom: 4, width: p.h * 0.3, height: 20, transform: "translateX(-50%)", borderRadius: "50%", background: "rgba(0,0,0,0.2)" }} />
          <Character spec={extra(seed * 31 + p.i)} pose={p.pose} height={p.h} flip={p.flip} seed={p.i} />
        </div>
      ))}
    </AbsoluteFill>
  );
};

/* ---------- thought bubbles ---------- */

export const ThoughtBubble: React.FC<{ b: Bubble }> = ({ b }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - (b.t ?? 0) * fps;
  if (t < 0) return null;
  const s = spring({ frame: t, fps, config: { damping: 28, stiffness: 110 } }) * (b.scale ?? 1);
  const bob = Math.sin(frame / 20) * 6;
  const [tx, ty] = b.tail ?? [b.x - 8, b.y + 26];
  return (
    <>
      {[0.25, 0.5, 0.72].map((k, i) => {
        const pop = spring({ frame: t - i * 3, fps, config: { damping: 26 } });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${tx + (b.x - tx) * k}%`,
              top: `${ty + (b.y - ty) * k}%`,
              width: 22 + i * 14,
              height: 22 + i * 14,
              borderRadius: "50%",
              background: "#fbfaf6",
              border: "5px solid #2b2622",
              transform: `translate(-50%,-50%) scale(${pop})`,
            }}
          />
        );
      })}
      <div style={{ position: "absolute", left: `${b.x}%`, top: `${b.y}%`, transform: `translate(-50%,-50%) translateY(${bob}px) scale(${s})` }}>
        <svg width={420} height={300} viewBox="0 0 420 300" style={{ overflow: "visible" }}>
          <path
            d="M70 210 C10 210 10 130 70 125 C55 60 140 35 175 75 C200 20 300 25 310 80 C380 70 410 150 355 175 C390 230 320 265 280 240 C250 285 160 285 140 245 C110 270 50 255 70 210 Z"
            fill="#fbfaf6"
            stroke="#2b2622"
            strokeWidth={8}
            strokeLinejoin="round"
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {isCardIcon(b.icon) ? (
            <div style={{ position: "relative", width: 200, height: 150 }}>
              <Icon name={b.icon} x={50} y={50} scale={0.32} />
            </div>
          ) : (
            <svg viewBox="-80 -80 160 160" width={180} height={150} style={{ overflow: "visible" }}>
              <g transform="scale(1.5)">
                <MapToken icon={b.icon} step={frame * 0.4} />
              </g>
            </svg>
          )}
          {b.text ? <div style={{ fontFamily: HAND_BOLD, fontWeight: 700, fontSize: 34, color: "#2b2622", marginTop: -10 }}>{b.text}</div> : null}
        </div>
      </div>
    </>
  );
};

/* ---------- hero document ---------- */

type DocV = Extract<Visual, { kind: "document" }>;

/** A big drawn paper — a law, a decree, a bank notice — with a heading, scribbled lines, a seal and a slammed stamp. */
export const DocumentCard: React.FC<{ v: DocV; cast: CastMember[] }> = ({ v, cast }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drop = spring({ frame, fps, config: { damping: 27, stiffness: 120 } });
  const lines = interpolate(frame, [8, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const st = frame - (v.stampAt ?? 1.6) * fps;
  const stamp = st < 0 ? 0 : spring({ frame: st, fps, config: { damping: 9, stiffness: 260 } });
  const presenter = v.presenter ? cast.find((c) => c.id === v.presenter) : undefined;
  const docX = presenter ? 40 : 50;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: `${docX}%`,
          top: "47%",
          width: 620,
          height: 800,
          transform: `translate(-50%,-50%) translateY(${(1 - drop) * 500}px) rotate(${-2 + Math.sin(frame / 40)}deg)`,
          background: "linear-gradient(#fbf6e6, #efe2bf)",
          border: "6px solid #2b2622",
          borderRadius: 8,
          boxShadow: "14px 18px 0 rgba(0,0,0,0.18)",
          padding: "54px 50px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ fontFamily: HAND_BOLD, fontWeight: 700, fontSize: 52, lineHeight: 1.1, color: "#2b2622", textAlign: "center" }}>{v.title}</div>
        {v.sub ? <div style={{ fontFamily: HAND_BOLD, fontSize: 34, color: "#5a4a3a", textAlign: "center", marginTop: 12 }}>{v.sub}</div> : null}
        <div style={{ marginTop: 36 }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ height: 8, borderRadius: 4, background: "#8a7a66", margin: "26px 0", width: `${(i === 8 ? 55 : 92 - (i % 3) * 8) * Math.min(1, Math.max(0, lines * 9 - i))}%` }} />
          ))}
        </div>
        {v.seal !== false ? <div style={{ position: "absolute", right: 60, bottom: 50, width: 96, height: 96, borderRadius: "50%", background: "#b23a2a", border: "6px solid #6e1f16" }} /> : null}
        {v.stamp && stamp > 0 ? (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "58%",
              transform: `translate(-50%,-50%) rotate(-14deg) scale(${1 + (1 - stamp) * 1.6})`,
              opacity: Math.min(1, stamp * 2),
              border: "10px solid #c0392b",
              borderRadius: 14,
              padding: "6px 30px",
              fontFamily: HAND_BOLD,
              fontWeight: 700,
              fontSize: 96,
              color: "#c0392b",
              letterSpacing: 6,
              whiteSpace: "nowrap",
            }}
          >
            {v.stamp}
          </div>
        ) : null}
      </div>
      {presenter ? (
        <div style={{ position: "absolute", left: "72%", bottom: 40, transform: "translateX(-50%)" }}>
          <Character spec={presenter.look} pose="point" height={620} flip />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/* ---------- photos that may not be downloaded yet ---------- */

/** True when public/<src> exists, so a missing archive photo shows a placeholder instead of failing the render. */
export const hasFile = (src: string) => getStaticFiles().some((f) => f.name === src);

export const MissingPhoto: React.FC<{ src: string; caption?: string }> = ({ src, caption }) => (
  <AbsoluteFill style={{ background: "#b8b2a6", alignItems: "center", justifyContent: "center" }}>
    <div style={{ ...outlineCss(56), fontSize: 56, textAlign: "center" }}>
      photo goes here
      <div style={{ fontSize: 38, marginTop: 10 }}>public/{src}</div>
      {caption ? <div style={{ fontSize: 34, marginTop: 10, opacity: 0.8 }}>{caption}</div> : null}
    </div>
  </AbsoluteFill>
);

export { Img, staticFile };
