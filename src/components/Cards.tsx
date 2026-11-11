import React from "react";
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { HAND, HAND_BOLD } from "../theme";
import type { Visual } from "../schema";

type ScrollV = Extract<Visual, { kind: "scroll" }>;

/** Parchment scroll for quotes and the chapter timeline. Unrolls on open, rolls shut on close. */
export const ScrollCard: React.FC<{ v: ScrollV }> = ({ v }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const open = spring({ frame, fps, config: { damping: 28, stiffness: 90 } });
  const close = v.roll === "close" ? interpolate(frame, [durationInFrames - 18, durationInFrames - 2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  const k = Math.min(open, close);
  const fullW = 1400;
  const w = 40 + (fullW - 40) * k;
  const dates = v.dates ?? [];
  return (
    <AbsoluteFill style={{ background: "#2e2620", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", width: w, height: 760, overflow: "hidden", background: "#efe2bf", boxShadow: "inset 0 0 80px rgba(120,80,30,0.35)" }}>
        <div style={{ position: "absolute", left: (w - fullW) / 2, width: fullW, height: 760, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          {v.quote ? (
            <div style={{ fontFamily: HAND_BOLD, fontWeight: 700, fontSize: 80, color: "#2b2622", textAlign: "center", padding: "0 140px", lineHeight: 1.35 }}>{v.quote}</div>
          ) : null}
          {dates.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 34, justifyContent: "center", padding: "0 120px" }}>
              {dates.map((d, i) => {
                const pop = spring({ frame: frame - 8 - i * 3, fps, config: { damping: 26 } });
                const hl = v.highlight === i;
                return (
                  <div
                    key={d}
                    style={{
                      width: 170,
                      height: 170,
                      borderRadius: "50%",
                      border: `6px solid ${hl ? "#c2410c" : "#4a3628"}`,
                      background: hl ? "#f6c76a" : "#e8d5a6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: HAND_BOLD,
                      fontWeight: 700,
                      fontSize: 54,
                      color: "#2b2622",
                      transform: `scale(${pop * (hl ? 1.12 : 1)})`,
                    }}
                  >
                    {d}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
      {[-1, 1].map((side) => (
        <div
          key={side}
          style={{ position: "absolute", left: 960 + side * (w / 2) - 22, top: 140, width: 44, height: 800, borderRadius: 22, background: "#8a5a2b", border: "5px solid #4a3020" }}
        />
      ))}
    </AbsoluteFill>
  );
};

/** Public-domain portrait on the gray card, with an optional cartoon crown and a handwritten name. */
export const PortraitCard: React.FC<{ src: string; name: string; overlay?: "crown" | "none" }> = ({ src, name, overlay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 26 } });
  const crown = spring({ frame: frame - 14, fps, config: { damping: 9 } });
  return (
    <AbsoluteFill style={{ background: "#bdbdbd" }}>
      <div style={{ position: "absolute", left: 1000, top: 100, width: 600, height: 760, transform: `translate(-50%,0) scale(${pop})`, borderRadius: 12, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", bottom: 40, width: "100%", textAlign: "center", fontFamily: HAND_BOLD, fontWeight: 700, fontSize: 70, color: "#fff", WebkitTextStroke: "8px #1e1a17", paintOrder: "stroke fill" }}>
          {name}
        </div>
      </div>
      {overlay === "crown" ? (
        <svg viewBox="0 0 300 200" width={200} style={{ position: "absolute", left: 900, top: 20, transform: `scale(${crown})` }}>
          <path d="M20 180 L30 40 L95 120 L150 20 L205 120 L270 40 L280 180 Z" fill="#f2c230" stroke="#2b2622" strokeWidth={10} strokeLinejoin="round" />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

/** Archive photo, centred, with a blurred copy of itself filling the frame behind it. */
export const BlurFillPhoto: React.FC<{ src: string; caption?: string }> = ({ src, caption }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const z = interpolate(frame, [0, durationInFrames], [1, 1.06]);
  return (
    <AbsoluteFill style={{ background: "#111" }}>
      <Img src={staticFile(src)} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", filter: "blur(36px) brightness(0.6) grayscale(0.4)", transform: "scale(1.15)" }} />
      <Img src={staticFile(src)} style={{ position: "absolute", left: "50%", top: 0, height: "100%", transform: `translateX(-50%) scale(${z})`, objectFit: "contain" }} />
      {caption ? (
        <div style={{ position: "absolute", bottom: 40, width: "100%", textAlign: "center", fontFamily: HAND, fontSize: 44, color: "#f2efe8" }}>{caption}</div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Subscribe card with a topic joke, slides up over whatever is on screen. */
export const CTAOverlay: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const inn = spring({ frame, fps, config: { damping: 27 } });
  const out = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const y = (1 - inn * out) * 400;
  const press = frame > fps * 1.2 && frame < fps * 1.5;
  return (
    <div style={{ position: "absolute", left: 160, bottom: 120 - y, display: "flex", alignItems: "center", gap: 36, background: "#f7f4ee", border: "6px solid #2b2622", borderRadius: 30, padding: "26px 40px", maxWidth: 1100 }}>
      <div
        style={{
          fontFamily: HAND_BOLD,
          fontSize: 54,
          color: "#fff",
          background: frame > fps * 1.5 ? "#6b6b6b" : "#d9271f",
          padding: "10px 34px",
          borderRadius: 14,
          transform: `scale(${press ? 0.92 : 1})`,
        }}
      >
        {frame > fps * 1.5 ? "SUBSCRIBED" : "SUBSCRIBE"}
      </div>
      <div style={{ fontFamily: HAND_BOLD, fontWeight: 700, fontSize: 50, color: "#2b2622", lineHeight: 1.2 }}>{text}</div>
    </div>
  );
};
