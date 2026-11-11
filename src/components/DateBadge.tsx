import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { HAND_BOLD } from "../theme";

/** Animated date stamp: slams in big at the centre, then shrinks to a corner badge and fades out. */
export const DateBadge: React.FC<{ date: string }> = ({ date }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Phase 1 (0–18 frames): big slam-in at centre
  const slamIn = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  // Phase 2 (18–36 frames): shrink and move to corner
  const shrink = interpolate(frame, [18, 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  // Phase 3: fade out near end of segment
  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames - 4], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const isBig = frame < 36;

  if (isBig) {
    // Big centred slam: scale from 0.4 → 1 on slam-in, then scale 1 → 0.3 on shrink
    const scale = frame < 18
      ? interpolate(slamIn, [0, 1], [0.4, 1])
      : interpolate(shrink, [0, 1], [1, 0.3]);
    const opacity = frame < 18 ? slamIn : 1;

    return (
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        opacity,
      }}>
        <div style={{
          transform: `scale(${scale})`,
          transformOrigin: "50% 50%",
          padding: "18px 54px",
          background: "rgba(14,14,20,0.88)",
          borderRadius: 18,
          border: "4px solid rgba(242,239,232,0.18)",
          color: "#f2efe8",
          fontFamily: HAND_BOLD,
          fontWeight: 900,
          fontSize: 160,
          letterSpacing: "0.04em",
          textShadow: "0 4px 32px rgba(0,0,0,0.6)",
          lineHeight: 1,
        }}>
          {date}
        </div>
      </div>
    );
  }

  // Corner badge phase
  const cornerOpacity = interpolate(frame, [36, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }) * fadeOut;

  return (
    <div style={{
      position: "absolute",
      left: 40,
      top: 36,
      padding: "6px 22px",
      background: "rgba(24,24,30,0.82)",
      borderRadius: 10,
      color: "#f2efe8",
      fontFamily: HAND_BOLD,
      fontWeight: 700,
      fontSize: 54,
      opacity: cornerOpacity,
    }}>
      {date}
    </div>
  );
};
