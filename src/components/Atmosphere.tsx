import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";

/** Lighting presets laid over a scene: plain day, blue night, warm candlelight. */
export const Mood: React.FC<{ mood?: "day" | "night" | "candle" }> = ({ mood }) => {
  const frame = useCurrentFrame();
  if (!mood || mood === "day") return null;
  if (mood === "night") return <AbsoluteFill style={{ background: "rgba(20,24,60,0.45)", mixBlendMode: "multiply" }} />;
  const flicker = 0.62 + 0.04 * Math.sin(frame / 3) + 0.03 * Math.sin(frame / 7);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 60%, rgba(255,190,90,${1 - flicker}) 0%, rgba(20,12,6,${flicker}) 70%)`,
      }}
    />
  );
};

/** Soft vignette and film grain over every frame, to glue the flat art together. */
export const Atmosphere: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 72%, rgba(0,0,0,0.12) 100%)" }} />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile("fx/grain.png")})`,
          backgroundPosition: `${(frame * 137) % 512}px ${(frame * 251) % 512}px`,
          opacity: 0.02,
          mixBlendMode: "overlay",
        }}
      />
    </AbsoluteFill>
  );
};
