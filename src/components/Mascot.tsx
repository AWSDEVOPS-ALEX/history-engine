import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Character } from "./Character";
import type { CharacterSpec, Pose } from "../schema";

/**
 * Where the guide stands in a segment. The episode picks a stage per segment (see stageFor in
 * SegmentView) so he moves around: corners, a big close-up, walking on from either side.
 */
export type Stage = "right" | "left" | "close" | "walkR" | "walkL";

const SPOT: Record<Stage, { left: number; h: number; bottom: number }> = {
  right: { left: 1460, h: 640, bottom: -30 },
  left: { left: 130, h: 640, bottom: -30 },
  close: { left: 1340, h: 1000, bottom: -400 }, // chest-up, big and close to camera
  walkR: { left: 1460, h: 640, bottom: -30 },
  walkL: { left: 130, h: 640, bottom: -30 },
};

export const Mascot: React.FC<{
  spec: CharacterSpec;
  pose: Pose;
  stage: Stage;
  sameAsBefore: boolean; // same spot as the previous segment: stay put, no re-entrance
  poseChangeAt?: number[]; // seconds; a little hop each time the pose changes
  mouth: number;
  talking?: boolean;
  exit?: boolean; // walk off at the end of the segment
}> = ({ spec, pose, stage, sameAsBefore, poseChangeAt = [], mouth, talking = false, exit = false }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const s = SPOT[stage];
  const onLeft = stage === "left" || stage === "walkL";

  // smooth cubic ease-out — no spring overshoot
  const smoothEase = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

  // entrance: walk on from the nearest edge, or glide up smoothly from below
  let x = 0;
  let y = 0;
  if (stage === "walkR" || stage === "walkL") {
    const t = interpolate(frame, [0, 32], [1, 0], { extrapolateRight: "clamp" });
    const k = 1 - smoothEase(1 - t); // ease-in slide
    x = (stage === "walkR" ? 480 : -520) * k;
    y = k > 0 ? -Math.abs(Math.sin(frame / 4)) * 10 : 0; // subtle walk bob
  } else if (!sameAsBefore) {
    // rise up — no bounce, just a smooth ease-out
    const k = smoothEase(Math.min(frame, 20) / 20);
    y = (1 - k) * (stage === "close" ? 200 : 90);
  }

  // leaving: glide off the nearest edge — ease-in acceleration, no bounce
  if (exit) {
    const t = interpolate(frame, [durationInFrames - 20, durationInFrames - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const k = t * t; // ease-in: starts gentle, accelerates out
    x += (onLeft ? -560 : 560) * k;
  }

  // idle life: very gentle sway and breathing — reduced amplitude for calmer feel
  x += Math.sin(frame / 72) * 7;
  y += Math.sin(frame / 28) * 2.5;

  // gentle rise-and-fall on pose change — softer than a hop
  for (const t of poseChangeAt) {
    const d = frame / fps - t;
    if (d >= 0 && d < 0.4) y -= Math.sin((d / 0.4) * Math.PI) * 18;
  }

  // face the middle of the frame
  const flip = onLeft ? pose !== "point" : false;
  const lean = stage === "close" ? Math.sin(frame / 30) * 1.5 : 0;

  return (
    <div style={{ position: "absolute", left: s.left, bottom: s.bottom, transform: `translate(${x}px, ${y}px) rotate(${lean}deg)`, transformOrigin: "50% 100%" }}>
      <div style={{ position: "absolute", left: "50%", bottom: 8, width: s.h * 0.3, height: 24, transform: "translateX(-50%)", borderRadius: "50%", background: "rgba(0,0,0,0.25)" }} />
      <Character spec={spec} pose={pose} mouth={mouth} height={s.h} flip={flip} talking={talking} />
    </div>
  );
};
