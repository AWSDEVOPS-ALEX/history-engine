import React from "react";
import { AbsoluteFill, Audio, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import type { Episode, Segment } from "./schema";
import { Background } from "./components/Sets";
import { MapScene } from "./components/MapScene";
import { Icon, isCardIcon } from "./components/Icons";
import { MapToken } from "./components/MapIcons";
import { Easing, interpolate } from "remotion";
import type { Bubble, Label, Prop, Visual } from "./schema";
import { ActionScene } from "./components/Actions";
import { CamWrap, CrowdLayer, DocumentCard, MissingPhoto, ThoughtBubble, hasFile } from "./components/Crowd";
import { wordStarts } from "./timing";
import { BlurFillPhoto, CTAOverlay, PortraitCard, ScrollCard } from "./components/Cards";
import { Character } from "./components/Character";
import { Mascot, type Stage } from "./components/Mascot";
import { Subtitles } from "./components/Subtitles";
import { GrayCardHeadline } from "./components/GrayCardHeadline";
import { GrayStage } from "./components/GrayStage";
import { segmentSeconds } from "./schema";
import { HandText } from "./components/HandText";
import { DateBadge } from "./components/DateBadge";
import { Mood } from "./components/Atmosphere";
import { outlineCss } from "./theme";
import { SfxTrack } from "./sfx";

/** The mascot can change pose mid-line: "poses": [{ "t": 2.5, "pose": "point" }]. */
const poseAt = (m: NonNullable<Segment["mascot"]>, sec: number) => {
  let p = m.pose;
  for (const k of [...(m.poses ?? [])].sort((a, b) => a.t - b.t)) if (sec >= k.t) p = k.pose;
  return p;
};

/** Mouth openness without audio: syllable-like flapping while the line lasts. */
const fakeMouth = (frame: number, total: number) => {
  if (frame > total - 6) return 0;
  const v = Math.sin(frame * 1.15) * 0.75 + Math.sin(frame * 0.41) * 0.45;
  return Math.max(0, Math.min(1, v));
};

const WithAudio: React.FC<{ seg: Segment; ep: Episode; idx: number }> = ({ seg, ep, idx }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const src = staticFile(seg.audio!);
  const data = useAudioData(src);
  let mouth = 0;
  if (data) {
    const bins = visualizeAudio({ fps, frame, audioData: data, numberOfSamples: 32 });
    const level = bins.slice(0, 12).reduce((a, b) => a + b, 0) / 12;
    mouth = Math.min(1, level * 9);
  }
  return (
    <>
      <Audio src={src} />
      <Body seg={seg} ep={ep} idx={idx} mouth={mouth} />
    </>
  );
};

const WithoutAudio: React.FC<{ seg: Segment; ep: Episode; idx: number }> = ({ seg, ep, idx }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return <Body seg={seg} ep={ep} idx={idx} mouth={fakeMouth(frame, durationInFrames)} />;
};

export const SegmentView: React.FC<{ seg: Segment; ep: Episode; idx?: number }> = ({ seg, ep, idx = 0 }) => (
  <>
    {seg.audio ? <WithAudio seg={seg} ep={ep} idx={idx} /> : <WithoutAudio seg={seg} ep={ep} idx={idx} />}
    {ep.sfx !== false ? <SfxTrack seg={seg} volume={ep.sfxVolume ?? 0.45} mode={ep.sfxMode ?? "scenes"} /> : null}
  </>
);

/** One picture: a visual plus its own labels and thought bubbles. Animations start from the shot's first frame. */
const ShotView: React.FC<{ v: Visual; seg: Segment; ep: Episode; mouth: number; seed: number; labels?: Label[]; bubbles?: Bubble[]; wordTime?: (w: number) => number }> = ({ v, seg, ep, mouth, seed, labels, bubbles, wordTime }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let scene: React.ReactNode = null;
  switch (v.kind) {
    case "gray":
      scene = (
        <AbsoluteFill>
          {v.bg ? (
            // the environment sits slightly soft behind the props, so the props stay the subject
            <AbsoluteFill style={{ filter: "blur(1.5px) saturate(1.05)", transform: "scale(1.02)" }}>
              <Background set={v.bg} />
            </AbsoluteFill>
          ) : (
            <GrayStage seed={seed} />
          )}
          <AbsoluteFill style={{ transform: `scale(${1 + (frame / fps) * 0.012}) translateX(${-(frame / fps) * 3}px)` }}>
            {/* Icon sits top-right as a small accent; GrayCardHeadline owns centre */}
            {v.icon ? <Icon name={v.icon} x={v.iconX ?? 88} y={v.iconY ?? 14} scale={v.iconScale ?? 0.45} /> : null}
            {v.props?.map((p, i) => <PropView key={i} p={p} />)}
          </AbsoluteFill>
        </AbsoluteFill>
      );
      break;
    case "set":
      scene = (
        <AbsoluteFill>
          <Background set={v.set} />
          {v.props?.map((p, i) => <PropView key={i} p={p} />)}
        </AbsoluteFill>
      );
      break;
    case "crowd":
      scene = (
        <AbsoluteFill>
          <Background set={v.set} />
          <CrowdLayer v={v} />
          {v.props?.map((p, i) => <PropView key={i} p={p} />)}
        </AbsoluteFill>
      );
      break;
    case "action":
      scene = <ActionScene v={v} />;
      break;
    case "document":
      scene = (
        <AbsoluteFill>
          <Background set={v.bg ?? "study"} />
          <DocumentCard v={v} cast={ep.cast} />
        </AbsoluteFill>
      );
      break;
    case "map":
      scene = <MapScene v={v} cast={ep.cast} satellite={ep.satellite !== false} wordTime={wordTime} />;
      break;
    case "scene": {
      const speakerIdx = v.cast.findIndex((c) => c.id === seg.speaker);
      scene = (
        <AbsoluteFill>
          <Background set={v.set} />
          {v.props?.map((p, i) => <PropView key={`p${i}`} p={p} />)}
          {v.cast.map((c, i) => {
            const member = ep.cast.find((m) => m.id === c.id);
            if (!member) return null;
            const h = 560 * (c.scale ?? 1);
            // optional walk-in from the side
            const walk = c.enter ? interpolate(frame, [0, 22], [c.enter === "left" ? -1400 : 1400, 0], { extrapolateRight: "clamp" }) : 0;
            const hop = walk !== 0 ? -Math.abs(Math.sin(frame / 2.6)) * 22 : 0;
            return (
              <div key={c.id} style={{ position: "absolute", left: `${c.x}%`, bottom: 90, transform: `translate(calc(-50% + ${walk}px), ${hop}px)` }}>
                <div style={{ position: "absolute", left: "50%", bottom: -6, width: h * 0.32, height: 26, transform: "translateX(-50%)", borderRadius: "50%", background: "rgba(0,0,0,0.22)" }} />
                <Character spec={member.look} pose={c.pose ?? "talk"} mouth={i === speakerIdx ? mouth : 0} height={h} flip={c.flip} seed={i + 1} talking={i === speakerIdx} />
              </div>
            );
          })}
          {speakerIdx >= 0 && seg.type === "skit" ? <SkitLine text={seg.text} x={v.cast[speakerIdx].x} /> : null}
        </AbsoluteFill>
      );
      break;
    }
    case "portrait":
      scene = hasFile(v.src) ? <PortraitCard src={v.src} name={v.name} overlay={v.overlay} /> : <MissingPhoto src={v.src} caption={v.name} />;
      break;
    case "photo":
      scene = hasFile(v.src) ? <BlurFillPhoto src={v.src} caption={v.caption} /> : <MissingPhoto src={v.src} caption={v.caption} />;
      break;
    case "scroll":
      scene = <ScrollCard v={v} />;
      break;
  }

  // a small punch-in on every cut keeps the energy up (Ethos cuts hard and often)
  // a gentle settle on each cut (Ethos cuts cleanly; no jolt)
  const punch = seg.cut === "pop" ? interpolate(frame, [0, 10], [1.03, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }) : 1;
  const cam = "cam" in v ? v.cam : undefined;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${punch})` }}>
        <CamWrap cam={cam}>{scene}</CamWrap>
      </AbsoluteFill>
      {bubbles?.map((b, i) => <ThoughtBubble key={`b${i}`} b={b} />)}
      {labels?.map((l, i) => <HandText key={i} label={l} plate={v.kind !== "gray" && v.kind !== "document"} />)}
    </AbsoluteFill>
  );
};

const Body: React.FC<{ seg: Segment; ep: Episode; idx: number; mouth: number }> = ({ seg, ep, idx, mouth }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const narratorTalking = seg.speaker === "NARRATOR";
  const secs = segmentSeconds(seg);
  const total = Math.round(secs * fps);

  // the line's pictures: the main visual, then any shots switched on a word
  const { starts } = wordStarts(seg.text, secs);
  const shots = [
    { from: 0, visual: seg.visual, labels: seg.labels, bubbles: seg.bubbles },
    ...(seg.shots ?? []).map((s) => ({ from: Math.round((starts[Math.min(s.word, starts.length - 1)] ?? 0) * fps), visual: s.visual, labels: s.labels, bubbles: s.bubbles })),
  ].sort((x, y) => x.from - y.from);

  const guide = ep.guides?.[seg.id.split("-")[0]] ?? ep.mascot;
  return (
    <AbsoluteFill>
      {shots.map((s, i) => {
        const to = i + 1 < shots.length ? shots[i + 1].from : Math.max(total, s.from + 1);
        return (
          <Sequence key={i} from={s.from} durationInFrames={Math.max(1, to - s.from)} layout="none">
            <ShotView v={s.visual} seg={seg} ep={ep} mouth={mouth} seed={idx * 3 + i} labels={s.labels} bubbles={s.bubbles} wordTime={(w) => (starts[Math.min(w, starts.length - 1)] ?? 0) - s.from / fps} />
          </Sequence>
        );
      })}
      <Mood mood={seg.mood} />
      {seg.mascot ? (
        <Mascot
          spec={guide}
          pose={poseAt(seg.mascot, frame / fps)}
          stage={stageFor(ep, idx)!}
          sameAsBefore={idx > 0 && sameSpot(stageFor(ep, idx - 1), stageFor(ep, idx)!)}
          poseChangeAt={(seg.mascot.poses ?? []).map((p) => p.t)}
          mouth={narratorTalking ? mouth : 0}
          talking={narratorTalking}
          exit={leavesAfter(ep, idx)}
        />
      ) : null}
      {seg.visual.kind === "gray" && seg.text ? <GrayCardHeadline text={seg.text} /> : null}
      {ep.subtitles !== false && seg.type === "narration" && seg.visual.kind !== "gray" ? <Subtitles text={seg.text} seconds={secs} /> : null}
      {seg.date ? <DateBadge date={seg.date} /> : null}
      {seg.type === "cta" ? <CTAOverlay text={seg.ctaText ?? "Subscribe. It's free."} /> : null}
    </AbsoluteFill>
  );
};

/** In skits the spoken line appears in handwriting above the speaker, as Ethos does. */
const SkitLine: React.FC<{ text: string; x: number }> = ({ text, x }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // smooth cubic ease-out — no spring overshoot or shake
  const t = Math.min(1, frame / 10);
  const s = 1 - Math.pow(1 - t, 3);
  const clamped = Math.min(78, Math.max(22, x));
  return (
    <div
      style={{
        position: "absolute",
        left: `${clamped}%`,
        top: 150,
        width: 860,
        transform: `translateX(-50%) scale(${s})`,
        textAlign: "center",
        ...outlineCss(66),
        fontSize: 66,
      }}
    >
      {text}
    </div>
  );
};

/** A prop on a gray card or in a scene: card icons draw large, map tokens are scaled up. */
const PropView: React.FC<{ p: Prop }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (isCardIcon(p.icon)) return <Icon name={p.icon} x={p.x} y={p.y} scale={p.scale ?? 0.6} delay={p.t ?? 0} anim={p.anim} />;
  const local = frame - (p.t ?? 0) * fps;
  if (local < 0) return null;
  // smooth cubic ease-out pop — no spring bounce or shake
  const pt = Math.min(1, local / 14);
  const s = (1 - Math.pow(1 - pt, 3)) * 2.6 * (p.scale ?? 1);
  const bob = p.anim === "none" ? 0 : Math.sin(local / 22) * 5;
  return (
    <svg viewBox="-80 -80 160 160" width={160} height={160} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, overflow: "visible", transform: `translate(-50%,-50%) translateY(${bob}px) scale(${s})` }}>
      <ellipse cx={0} cy={40} rx={34} ry={7} fill="rgba(0,0,0,0.2)" />
      <MapToken icon={p.icon} step={local * 0.4} />
    </svg>
  );
};

/**
 * Where the guide stands this segment, so he doesn't sit in one corner all video. A fixed rotation
 * of spots, skipping any spot that would cover the segment's labels or props. "mascot.stage" or
 * "mascot.side" in the JSON overrides it.
 */
const visuals = (seg: Segment) => [seg.visual, ...(seg.shots ?? []).map((s) => s.visual)];
const xs = (seg: Segment) => [
  ...[...(seg.labels ?? []), ...(seg.shots ?? []).flatMap((s) => s.labels ?? [])].map((l) => l.x),
  ...visuals(seg).flatMap((v) => ("props" in v && v.props ? v.props.map((p) => p.x) : [])),
  ...[...(seg.bubbles ?? []), ...(seg.shots ?? []).flatMap((s) => s.bubbles ?? [])].map((b) => b.x),
  ...visuals(seg).flatMap((v) => (v.kind === "document" ? [50] : [])),
];
/**
 * Where the guide stands. He is one consistent character who comes and goes: he walks on when he
 * wasn't in the previous shot, usually stands on the right, moves left only when something on the
 * right needs the space, and now and then leans in for a close-up.
 */
export const stageFor = (ep: Episode, i: number): Stage | null => {
  const seg = ep.segments[i];
  if (!seg?.mascot) return null;
  if (seg.mascot.stage) return seg.mascot.stage;
  if (seg.type === "cta") return "right";
  const x = xs(seg);
  const rightFree = x.every((v) => v <= 66);
  const leftFree = x.every((v) => v >= 30);
  const side: "left" | "right" = seg.mascot.side ?? (rightFree || !leftFree ? "right" : "left");
  const prev = ep.segments[i - 1];
  const fresh = !prev?.mascot;
  if (fresh) return side === "left" ? "walkL" : "walkR";
  // count appearances so far to pace the close-ups
  let n = 0;
  for (let k = 0; k <= i; k++) if (ep.segments[k].mascot) n++;
  const closeOk = side === "right" && visuals(seg).every((v) => v.kind !== "map" && v.kind !== "action") && x.every((v) => v <= 64);
  if (closeOk && n % 5 === 0) return "close";
  return side;
};
/** True when the guide leaves at the end of this segment (the next one has no guide). */
export const leavesAfter = (ep: Episode, i: number) => !!ep.segments[i]?.mascot && !ep.segments[i + 1]?.mascot;
const sameSpot = (a: Stage | null, b: Stage) => {
  const norm = (s: Stage | null) => (s === "walkL" ? "left" : s === "walkR" ? "right" : s);
  return norm(a) === norm(b) && b !== "walkL" && b !== "walkR";
};
