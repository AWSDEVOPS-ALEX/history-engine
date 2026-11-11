import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";

/**
 * Full-black text-card backdrop — the "verdict card" used for punchy one-liners,
 * statistics and pivot moments. Matches the Paper Billions / Penny style:
 * pure black background, slight paper-grain overlay, no scene elements.
 * The icon and text are rendered by SegmentView on top of this.
 */
export const GrayStage: React.FC<{ seed?: number }> = ({ seed = 0 }) => {
  const f = useCurrentFrame();

  // Fade in fast from black (first 4 frames) so the cut feels sharp, not soft
  const opacity = interpolate(f, [0, 4], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <AbsoluteFill style={{ background: "#0a0a0a", overflow: "hidden" }}>
      {/* Paper-grain noise overlay at ~5% opacity — matches blueprint spec */}
      <AbsoluteFill
        style={{
          opacity: 0.05,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />
      {/* Very subtle warm vignette — keeps it from being flat dead black */}
      <AbsoluteFill
        style={{
          opacity: opacity * 0.4,
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(60,50,30,0.3) 0%, rgba(0,0,0,0.0) 60%)",
        }}
      />
    </AbsoluteFill>
  );
};
