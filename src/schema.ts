// Episode script format. One JSON file per episode drives everything:
// the voice script reads it and Remotion renders it. Every visual is drawn in code; no generated images.

export type LonLat = [number, number];

export type Pose = "talk" | "point" | "angry" | "confused" | "happy" | "shrug";

/** Handwritten text that types itself onto the screen. x/y are 0–100 (% of frame). */
export type Label = {
  text: string;
  x: number;
  y: number;
  at?: number; // seconds after the segment starts
  size?: number; // px at 1080p, default 64
  color?: string;
  rotate?: number;
  caps?: boolean;
  emph?: "underline" | "circle" | "box"; // hand-drawn marker emphasis, drawn after the text finishes
  emphColor?: string;
};

/** A prop that pops in on a gray card or in a scene. x/y in % of the frame, t in seconds. */
export type Prop = {
  icon: IconName | MapIcon;
  x: number;
  y: number;
  t?: number;
  scale?: number;
  anim?: "bob" | "spin" | "shake" | "pulse" | "none";
};

/** A cartoon person. Build any historical figure from these parts. */
export type CharacterSpec = {
  skin?: string;
  robe?: string;
  trim?: string;
  hat?: "none" | "crown" | "turban" | "cap" | "tallhat" | "hood" | "helmet" | "mitre" | "brim" | "peaked";
  bun?: boolean; // hair tied in a bun (use with hair colour)
  hatColor?: string;
  beard?: "none" | "short" | "long";
  beardColor?: string;
  hair?: string;
  glasses?: boolean;
  prop?: "none" | "lantern" | "staff" | "scroll" | "sword" | "coin"; // right hand
  staff?: "none" | "plain" | "chronicler"; // left hand, full height; "chronicler" has a hanging lantern
  satchel?: boolean;
  belt?: string;
  pattern?: "none" | "stripes" | "diamonds"; // robe hem pattern
  sandals?: boolean;
};

export type CastMember = {
  id: string; // matches a speaker tag, e.g. "MANSA_MUSA"
  name?: string;
  look: CharacterSpec;
  voice?: string; // Fish Audio reference_id
};

export type MapView = { lon: number; lat: number; zoom: number };

export type MapIcon =
  | "camel" | "ship" | "soldier" | "horse" | "gold" | "salt" | "crown" | "book"
  | "mosque" | "tent" | "swords" | "fire" | "scroll" | "house" | "castle" | "flag"
  | "cattle" | "wheat" | "train" | "factory" | "banknotes" | "stamp" | "press" | "chainsaw" | "dollar" | "soy"
  | "oil" | "water" | "diamond";

/**
 * Things that happen on the map while the narrator talks. `t` = seconds after the segment starts.
 * Everything is pinned to geography, so it moves with the camera.
 */
export type MapEvent =
  | { type: "icon"; at: LonLat; icon: MapIcon; t: number; size?: number; label?: string }
  | { type: "move"; path: LonLat[]; icon: MapIcon; t: number; dur?: number; count?: number; trail?: boolean; color?: string; label?: string }
  | { type: "flow"; path: LonLat[]; t: number; color?: string; width?: number }
  | { type: "battle"; at: LonLat; t: number }
  | { type: "pulse"; at: LonLat; t: number; color?: string }
  | { type: "label"; at: LonLat; text: string; t: number; word?: number; size?: number; color?: string; caps?: boolean; rotate?: number; spacing?: number; style?: "region" }
  | { type: "pin"; at: LonLat; t: number; label?: string; color?: string; word?: number }
  /** A country's flag planted on the map when the country is mentioned. */
  | { type: "nation"; at: LonLat; t: number; word?: number; code: "ar" | "gb" | "us" | "ca" | "fr" | "de" | "it" | "es" | "br" | "cn" | "jp" | "sg" | "my" | "id" | "in" | "tw"; label?: string }
  /**
   * A thing being mentioned pops out of the map at its place: a round badge with the drawn item
   * (or a photo) on a dotted leader line, with a short label. The camera eases in towards it.
   * `word` times it to the spoken word (0-based in the line); otherwise `t` seconds.
   */
  | { type: "callout"; at: LonLat; t: number; word?: number; icon?: IconName | MapIcon; src?: string; label?: string; focus?: boolean; zoom?: number; side?: "left" | "right"; pos?: "above" | "below"; persist?: boolean }
  | { type: "medallion"; at: LonLat; t: number; src: string; offset?: [number, number]; size?: number; label?: string }
  | { type: "counter"; at: LonLat; from: number; to: number; t: number; dur?: number; prefix?: string; suffix?: string }
  | { type: "fill"; countries: string[]; t: number; color?: string; stagger?: number }
  | { type: "arrow"; from: LonLat; to: LonLat; t: number; color?: string; bend?: number }
  | { type: "scatter"; around: LonLat; icon: MapIcon; n: number; spread?: number; t: number; size?: number }
  | { type: "border"; countries: string[]; t: number; color?: string }
  | { type: "flag"; at: LonLat; t: number; color?: string; label?: string };

/** Slow camera move on a set or card: push from zoom `from` to zoom `to`, centred on x/y (% of frame). */
export type Cam = { x: number; y: number; from?: number; to?: number };

/** A thought bubble with a drawn idea in it, trailing down to `tail` (a head, in % of frame). */
export type Bubble = { x: number; y: number; icon: IconName | MapIcon; t?: number; tail?: [number, number]; text?: string; scale?: number };

/** A new picture partway through a line: switches when word number `word` (0-based) is spoken. */
export type Shot = { word: number; visual: Visual; labels?: Label[]; bubbles?: Bubble[] };

/** An animated set-piece that acts out the line (see components/Actions.tsx). */
export type Visual =
  | {
    kind: "action";
    name:
      | "train" | "voyage" | "moneyrain" | "press" | "pricetag" | "bars" | "scales" | "fence" | "helicopter"
      | "chainsaw" | "crash" | "march" | "loop" | "harvest" | "ballot" | "vault" | "mattress";
    bg?: SetName;
    cargo?: "wheat" | "cattle" | "flag" | "people" | "empty"; // train, voyage
    from?: number; // pricetag, crash
    to?: number;
    prefix?: string;
    suffix?: string;
    item?: string; // pricetag caption, chainsaw target, vault/fence contents
    bars?: { label: string; value: number; color?: string; flag?: "ar" | "gb" | "us" | "ca" | "fr" | "de" | "it" | "es" | "br" | "cn" | "jp" }[];
    left?: { icon: IconName | MapIcon; label?: string };
    right?: { icon: IconName | MapIcon; label?: string };
    tilt?: number; // scales: final angle, + = right side down
    items?: { icon: IconName | MapIcon; label: string }[]; // loop
    reverse?: boolean; // voyage/train/march direction right → left
    hideValues?: boolean; // bars: compare heights only, no numbers
    cycle?: boolean; // crash: boom and bust again and again
  }
  | { kind: "gray"; icon?: IconName; iconX?: number; iconY?: number; iconScale?: number; props?: Prop[]; cam?: Cam; bg?: SetName }
  | { kind: "set"; set: SetName; cam?: Cam; props?: Prop[] }
  | {
      kind: "crowd";
      set: SetName;
      n?: number; // people, default 7
      action?: "cheer" | "run" | "protest" | "queue" | "stand";
      seed?: number;
      cam?: Cam;
      props?: Prop[];
    }
  | {
      kind: "document";
      title: string; // big heading on the paper
      sub?: string; // smaller line under it
      stamp?: string; // red stamp slammed on at `stampAt` seconds
      stampAt?: number;
      seal?: boolean;
      presenter?: string; // cast id standing beside it
      bg?: SetName; // environment behind the paper, default "study"
      cam?: Cam;
    }
  | {
      kind: "map";
      from: MapView;
      to?: MapView;
      keys?: { t: number; view: MapView }[]; // extra camera stops; overrides from/to when given
      events?: MapEvent[];
      intro?: "clouds"; // fly down through clouds at the start of the segment
      introDur?: number; // seconds, default 2.4
      regions?: { countries: string[]; color?: string; at?: number; opacity?: number }[];
      rivers?: { points: LonLat[]; at?: number; label?: string }[];
      routes?: { points: LonLat[]; at?: number; color?: string }[];
      cities?: { name: string; at: LonLat; t?: number }[];
      rulers?: { cast: string; at: LonLat; t?: number; label?: string }[];
    }
  | {
      kind: "scene";
      set: SetName;
      cam?: Cam;
      cast: { id: string; x: number; pose?: Pose; flip?: boolean; scale?: number; enter?: "left" | "right" }[];
      props?: Prop[];
    }
  | { kind: "portrait"; src: string; name: string; overlay?: "crown" | "none" }
  | { kind: "photo"; src: string; caption?: string }
  | { kind: "scroll"; quote?: string; dates?: string[]; highlight?: number; roll?: "open" | "close" };

export type IconName =
  | "coins" | "bulb" | "question" | "mound" | "crown" | "camel" | "book" | "none"
  | "chest" | "hourglass" | "shield" | "scales" | "bag" | "sword" | "exclaim" | "heart";
export type SetName = "palace" | "study" | "desert" | "fields" | "night-city" | "sky" | "village" | "sea" | "battlefield" | "market" | "shop" | "bank" | "home" | "factory" | "port" | "street" | "pampas" | "estancia" | "countryside" | "plaza" | "skyline";

export type SfxName =
  | "pop" | "whoosh" | "coin" | "clash" | "drum" | "march" | "hooves" | "water"
  | "pen" | "scroll" | "click" | "ding" | "fire" | "tick"
  | "train" | "horn" | "waves" | "murmur" | "cheer" | "register" | "press" | "stamp" | "crash" | "heli"
  | "chainsaw" | "ballot" | "vault" | "paper" | "softwhoosh";

export type Segment = {
  id: string;
  type: "narration" | "skit" | "cta";
  speaker: string; // "NARRATOR" or a cast id
  text: string;
  visual: Visual;
  date?: string; // date badge top-left
  mascot?: { pose: Pose; side?: "left" | "right"; stage?: "right" | "left" | "close" | "walkR" | "walkL"; poses?: { t: number; pose: Pose }[] } | null;
  labels?: Label[];
  bubbles?: Bubble[];
  shots?: Shot[]; // extra pictures within the line, switched on a word
  mood?: "day" | "night" | "candle";
  ctaText?: string;
  cut?: "pop" | "none"; // small punch-in at the start of the segment (default pop) // short text on the subscribe card (type: "cta")
  sfx?: { t: number; sound: SfxName; volume?: number }[]; // extra sounds on top of the automatic ones
  audio?: string; // set by scripts/voice.ts (path under public/)
  durationSec?: number; // set by scripts/voice.ts; estimated if missing
};

export type Episode = {
  title: string;
  fps?: number;
  mascot: CharacterSpec;
  cast: CastMember[];
  narratorVoice?: string;
  music?: string; // path under public/
  satellite?: boolean; // use NASA satellite tiles when built (npm run satellite); default true
  sfx?: boolean; // automatic sound effects, default true
  sfxMode?: "scenes" | "minimal" | "full"; // minimal (default): only battles, chapter scrolls and the subscribe click
  sfxVolume?: number; // 0–1, default 0.45
  musicVolume?: number; // 0–1, default 0.07
  subtitles?: boolean; // burned-in captions at the bottom, default true
  guides?: Record<string, CharacterSpec>; // per chapter ("c02"): a witness from that era replaces the mascot
  segments: Segment[];
};

const WORDS_PER_SEC = 2.5; // ~150 wpm, Ethos pace

export const segmentSeconds = (s: Segment) =>
  s.durationSec ?? Math.max(1.6, s.text.split(/\s+/).filter(Boolean).length / WORDS_PER_SEC + 0.35);

export const segmentFrames = (s: Segment, fps: number) => Math.round(segmentSeconds(s) * fps);
