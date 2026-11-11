import React from "react";
import { Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import type { MapEvent, Segment, SfxName, Visual } from "./schema";
import { segmentSeconds } from "./schema";
import { wordStarts } from "./timing";

type Cue = { t: number; sound: SfxName; volume: number; until?: number };

const MOVE_SOUND: Record<string, SfxName> = { soldier: "march", horse: "hooves", ship: "water", camel: "march" };

/**
 * Sound effects are worked out from what is on screen, so every map event, label and card
 * gets its sound automatically. Add one-offs with "sfx": [{ "t": 1.2, "sound": "coin" }].
 * Sounds live in public/sfx/ (generated in code, no licence needed). Replace any file with
 * your own of the same name to change the sound everywhere.
 */
// Sounds kept in minimal mode: big moments only.
const MINIMAL = new Set<SfxName>(["drum", "clash", "scroll", "click"]);


/**
 * "scenes" mode (default): sound only where the picture does something you'd hear — a train, the
 * sea, a crowd, the press, a stamp, a crash, a helicopter. Maps stay quiet apart from battles,
 * ships and the cloud fly-in. Each shot inside a line gets its own sounds from the moment it appears.
 */
const sceneCues = (v: Visual, add: (t: number, s: SfxName, vol?: number) => void) => {
  switch (v.kind) {
    case "action":
      switch (v.name) {
        case "train": add(0.1, "train", 0.7); break;
        case "voyage": add(0, "waves", 0.6); add(0.6, "horn", 0.45); break;
        case "moneyrain": add(0, "cheer", 0.45); add(0.4, "register", 0.45); break;
        case "press": add(0, "press", 0.6); break;
        case "pricetag": add(0.3, "register", 0.4); break;
        case "bars": add(0.1, "paper", 0.5); break;
        case "scales": case "loop": case "harvest": add(0, "softwhoosh", 0.5); break;
        case "fence": add(0, "murmur", 0.4); add(0.3, "stamp", 0.35); break;
        case "helicopter": add(0, "heli", 0.7); break;
        case "chainsaw": add(0.3, "chainsaw", 0.45); break;
        case "crash": add(0.2, "crash", 0.7); break;
        case "march": add(0, "march", 0.7); add(0, "drum", 0.35); break;
        case "ballot": for (let k = 0; k < 3; k++) add(0.25 + k * 0.67, "ballot", 0.5); break;
        case "vault": add(0.3, "vault", 0.7); break;
        case "mattress": add(0.4, "paper", 0.5); break;
      }
      break;
    case "document":
      add(0, "paper", 0.5);
      if (v.stamp) add(v.stampAt ?? 1.6, "stamp", 0.8);
      break;
    case "crowd":
      add(0, v.action === "cheer" || v.action === "protest" ? "cheer" : "murmur", v.action === "stand" || v.action === "queue" ? 0.3 : 0.45);
      break;
    case "photo":
    case "portrait":
      add(0, "softwhoosh", 0.25);
      break;
    case "scroll":
      add(0, "scroll", 0.8);
      break;
    case "map":
      if (v.intro === "clouds") add(0, "softwhoosh", 0.6);
      (v.events ?? []).forEach((e) => {
        if (e.type === "battle") { add(e.t - 0.1, "drum", 0.8); add(e.t, "clash", 0.7); }
        if (e.type === "move" && e.icon === "ship") add(e.t, "waves", 0.35);
      });
      break;
  }
};

export const cuesFor = (seg: Segment, mode: "scenes" | "minimal" | "full" = "scenes"): Cue[] => {
  if (mode === "scenes") {
    const c: Cue[] = [];
    const secs = segmentSeconds(seg);
    const { starts } = wordStarts(seg.text, secs);
    const shots = [{ at: 0, v: seg.visual }, ...(seg.shots ?? []).map((s) => ({ at: starts[Math.min(s.word, starts.length - 1)] ?? 0, v: s.visual }))];
    shots.sort((a, b) => a.at - b.at);
    shots.forEach((sh, i) => {
      const until = i + 1 < shots.length ? shots[i + 1].at + 0.25 : undefined; // let it tail briefly past the cut
      sceneCues(sh.v, (t, sound, volume = 1) => c.push({ t: Math.max(0, sh.at + t), sound, volume, until }));
    });
    if (seg.type === "cta") { c.push({ t: 0, sound: "whoosh", volume: 0.5 }); c.push({ t: 1.2, sound: "click", volume: 0.9 }); }
    seg.sfx?.forEach((x) => c.push({ t: x.t, sound: x.sound, volume: x.volume ?? 1 }));
    return c.sort((a, b) => a.t - b.t);
  }
  const c: Cue[] = [];
  const add = (t: number, sound: SfxName, volume = 1) => c.push({ t: Math.max(0, t), sound, volume });
  const v = seg.visual;

  if (v.kind === "map") {
    (v.events ?? []).forEach((e: MapEvent) => {
      switch (e.type) {
        case "icon":
          add(e.t, e.icon === "gold" ? "coin" : "pop", 0.8);
          break;
        case "scatter":
          for (let k = 0; k < Math.min(4, e.n); k++) add(e.t + k * 0.12, e.icon === "gold" ? "coin" : "pop", 0.45);
          break;
        case "fill": {
          const st = e.stagger ?? 0.35;
          e.countries.slice(0, 5).forEach((_, k) => add(e.t + k * st, "pop", 0.4));
          break;
        }
        case "border":
        case "flow":
        case "arrow":
          add(e.t, "whoosh", 0.6);
          break;
        case "move":
          add(e.t, "whoosh", 0.5);
          add(e.t + 0.2, MOVE_SOUND[e.icon] ?? "march", e.icon === "camel" ? 0.4 : 0.7);
          if ((e.dur ?? 4) > 2.5) add(e.t + 1.8, MOVE_SOUND[e.icon] ?? "march", 0.4);
          break;
        case "battle":
          add(e.t - 0.1, "drum", 1);
          add(e.t, "clash", 0.9);
          add(e.t + 0.35, "fire", 0.5);
          break;
        case "pulse":
          add(e.t, "ding", 0.5);
          break;
        case "label":
          add(e.t, "pen", 0.7);
          break;
        case "counter":
          for (let k = 0; k < 6; k++) add(e.t + k * ((e.dur ?? 2) / 6), "tick", 0.6);
          break;
      }
    });
    v.rivers?.forEach((r) => add(r.at ?? 0, "water", 0.5));
    v.routes?.forEach((r) => add(r.at ?? 0, "whoosh", 0.5));
    v.cities?.forEach((x) => add(x.t ?? 0, "ding", 0.35));
    v.rulers?.forEach((x) => add(x.t ?? 0, "pop", 0.8));
  }
  if (v.kind === "gray" && v.icon && v.icon !== "none") add(0.1, v.icon === "coins" ? "coin" : "pop", 0.8);
  if (v.kind === "scroll") add(0, "scroll", 0.8);
  if (v.kind === "portrait" || v.kind === "photo") add(0, "whoosh", 0.5);
  if (seg.type === "skit") add(0, "pop", 0.25);
  if (seg.type === "cta") {
    add(0, "whoosh", 0.6);
    add(1.2, "click", 0.9);
  }
  seg.labels?.forEach((l) => add(l.at ?? 0, "pen", 0.6));
  seg.sfx?.forEach((x) => add(x.t, x.sound, x.volume ?? 1));
  const manual = new Set(seg.sfx ?? []);
  const kept = mode === "full" ? c : c.filter((q) => MINIMAL.has(q.sound) || [...manual].some((m) => m.t === q.t && m.sound === q.sound));
  return kept.sort((a, b) => a.t - b.t);
};

export const SfxTrack: React.FC<{ seg: Segment; volume: number; mode?: "scenes" | "minimal" | "full" }> = ({ seg, volume, mode = "scenes" }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const cues = cuesFor(seg, mode);
  const scrollClose = seg.visual.kind === "scroll" && seg.visual.roll === "close";
  return (
    <>
      {cues.map((q, i) => {
        const from = Math.round(q.t * fps);
        if (from >= durationInFrames) return null;
        return (
          <Sequence key={i} from={from} durationInFrames={q.until ? Math.max(1, Math.round(q.until * fps) - from) : undefined} layout="none">
            <Audio src={staticFile(`sfx/${q.sound}.wav`)} volume={(f) => q.volume * volume * (q.until ? Math.min(1, Math.max(0, (Math.round(q.until * fps) - from - f) / 8)) : 1)} />
          </Sequence>
        );
      })}
      {scrollClose ? (
        <Sequence from={Math.max(0, durationInFrames - 18)} layout="none">
          <Audio src={staticFile("sfx/scroll.wav")} volume={0.7 * volume} />
        </Sequence>
      ) : null}
    </>
  );
};
