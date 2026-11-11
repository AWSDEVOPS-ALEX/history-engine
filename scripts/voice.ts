/**
 * One Fish Audio clip per segment; real durations written back into the episode JSON.
 *   npm run voice -- episodes/<ep>.json
 *
 * .env:
 *   FISH_API_KEY=...        your key
 *   FISH_VOICE_ID=...       narrator voice (also used for characters without their own voice)
 *   FISH_MODEL=s1           optional, default s2.1-pro
 *   VOICE_TEMPO=0.82        optional, slows (<1) or speeds (>1) every clip without changing pitch.
 *                           Target ~148 words a minute (Ethos's pace); the script prints your pace.
 *
 * Clips are cached in public/audio/<ep>/. Raw downloads are kept as <id>.raw.mp3, so changing
 * VOICE_TEMPO re-processes them without paying Fish Audio again.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import type { Episode, Segment } from "../src/schema";

if (existsSync(".env"))
  for (const l of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }

const KEY = process.env.FISH_API_KEY?.trim();
const MODEL = process.env.FISH_MODEL ?? "s2.1-pro";
const TEMPO = Number(process.env.VOICE_TEMPO ?? 1);
const file = process.argv[2];
if (!file) throw new Error("usage: npm run voice -- episodes/<file>.json");

const ep: Episode = JSON.parse(readFileSync(file, "utf8"));
const slug = basename(file, ".json");
const dir = join("public", "audio", slug);
mkdirSync(dir, { recursive: true });

const real = (v?: string) => (v && !/^(YOUR_|VOICE_|paste_)/.test(v) ? v.trim() : undefined);
const DEFAULT_VOICE = real(process.env.FISH_VOICE_ID);
const voiceFor = (s: Segment) =>
  s.speaker === "NARRATOR"
    ? real(ep.narratorVoice) ?? DEFAULT_VOICE
    : real(ep.cast.find((c) => c.id === s.speaker)?.voice) ?? real(ep.narratorVoice) ?? DEFAULT_VOICE;

async function tts(text: string, referenceId?: string): Promise<Buffer> {
  if (!KEY) throw new Error("FISH_API_KEY missing from .env");
  if (!referenceId) throw new Error("FISH_VOICE_ID missing from .env");
  const res = await fetch("https://api.fish.audio/v1/tts", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", model: MODEL },
    body: JSON.stringify({ text, reference_id: referenceId, format: "mp3", mp3_bitrate: 192, normalize: true, latency: "normal" }),
  });
  if (res.status === 401) throw new Error("Fish Audio rejected the API key. Copy a fresh key from fish.audio > API Keys into .env");
  if (res.status === 402) throw new Error("Fish Audio: no API credit on this account");
  if (!res.ok) throw new Error(`Fish Audio ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

const seconds = (p: string) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]).toString().trim());

// apply tempo (pitch-preserving); ffmpeg's atempo accepts 0.5–2.0 per stage
const retime = (raw: string, out: string) => {
  if (TEMPO === 1) return execFileSync("cp", [raw, out]);
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", raw, "-filter:a", `atempo=${TEMPO}`, "-b:a", "192k", out]);
};

console.log(`Voice ID: ${DEFAULT_VOICE ?? "MISSING"} · model: ${MODEL} · tempo: ${TEMPO}`);
let words = 0;
let narrSec = 0;
for (const s of ep.segments) {
  const rel = join("audio", slug, `${s.id}.mp3`);
  const abs = join("public", rel);
  const raw = join(dir, `${s.id}.raw.mp3`);
  const legacy = existsSync(abs) && !existsSync(raw); // clips made before raw caching
  if (legacy) execFileSync("cp", [abs, raw]);
  if (!existsSync(raw)) {
    process.stdout.write(`voice ${s.id} (${s.speaker})… `);
    writeFileSync(raw, await tts(s.text, voiceFor(s)));
    console.log("ok");
  }
  retime(raw, abs);
  s.audio = rel;
  const d = seconds(abs);
  s.durationSec = Math.round((d + 0.3) * 100) / 100;
  if (s.speaker === "NARRATOR") {
    words += s.text.split(/\s+/).filter(Boolean).length;
    narrSec += d;
  }
}
writeFileSync(file, JSON.stringify(ep, null, 2));
const total = ep.segments.reduce((a, s) => a + (s.durationSec ?? 0), 0);
const wpm = narrSec ? Math.round(words / (narrSec / 60)) : 0;
console.log(`Done. ${ep.segments.length} clips, ${(total / 60).toFixed(1)} min. Narrator pace: ${wpm} words/min (target ~148).`);
if (wpm > 160) console.log(`Tip: add VOICE_TEMPO=${(148 / wpm * TEMPO).toFixed(2)} to .env and run this again (no extra Fish Audio cost).`);
