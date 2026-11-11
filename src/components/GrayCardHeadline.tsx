import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { SANS } from "../theme";

/**
 * Large centred white headline for gray (text-card) segments.
 * Blueprint spec: "Full black screen, white handwritten text, centred."
 *
 * - Text fades + slides up in the first 8 frames (sharp, not slow)
 * - Single-line or two-line, auto-sized
 * - Short sentences (< 60 chars) render bigger; longer ones scale down
 */
export const GrayCardHeadline: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Snap in fast — this is a punch card, not a slow reveal
  const t = interpolate(frame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const translateY = interpolate(frame, [0, 8], [28, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Scale font to text length: punchy short lines go large
  const len = text.length;
  const fontSize = len <= 40 ? 88 : len <= 65 ? 72 : len <= 90 ? 60 : 50;

  // Split on sentence boundary if the text has two distinct sentences
  const parts = text.split(/(?<=[.!?])\s+/);
  const isMultiPart = parts.length >= 2 && parts[0].length < 60;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 120px",
        opacity: t,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {isMultiPart ? (
        // Two-line layout: first sentence larger, second slightly smaller
        <>
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: Math.min(96, fontSize + 10),
              color: "#ffffff",
              textAlign: "center",
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
              textShadow: "0 2px 24px rgba(0,0,0,0.6)",
              marginBottom: 16,
            }}
          >
            {parts[0]}
          </div>
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: Math.min(72, fontSize - 4),
              color: "rgba(255,255,255,0.75)",
              textAlign: "center",
              lineHeight: 1.2,
              letterSpacing: "0.01em",
            }}
          >
            {parts.slice(1).join(" ")}
          </div>
        </>
      ) : (
        // Single block — big and centred
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 800,
            fontSize,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.2,
            letterSpacing: len <= 40 ? "-0.02em" : "-0.01em",
            textShadow: "0 2px 32px rgba(0,0,0,0.5)",
            maxWidth: 1400,
          }}
        >
          {text}
        </div>
      )}

      {/* Subtle red accent line under the text — matches Paper Billions data-label style */}
      <div
        style={{
          marginTop: 28,
          width: interpolate(frame, [4, 20], [0, Math.min(text.length * 18, 480)], {
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.quad),
          }),
          height: 4,
          background: "linear-gradient(90deg, #e74c3c, #c0392b)",
          borderRadius: 2,
          opacity: 0.85,
        }}
      />
    </AbsoluteFill>
  );
};
