/**
 * Writes an .srt subtitle file for YouTube from the episode's text and real clip durations.
 *   npm run subtitles -- episodes/<ep>.json      → out/<ep>.srt
 * Upload it in YouTube Studio > Subtitles. Run after `npm run voice` so timings are exact.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import type { Episode } from "../src/schema";
import { segmentSeconds } from "../src/schema";

const file = process.argv[2];
if (!file) throw new Error("usage: npm run subtitles -- episodes/<file>.json");
const ep: Episode = JSON.parse(readFileSync(file, "utf8"));

const MAX_LINE = 42;
const ts = (sec: number) => {
  const ms = Math.round(sec * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`;
};

// split a line into captions of at most two 42-character lines, timed by word share
const chunk = (text: string) => {
  const words = text.split(/\s+/).filter(Boolean);
  const out: string[][] = [];
  let cur: string[] = [];
  for (const w of words) {
    if ((cur.join(" ") + " " + w).trim().length > MAX_LINE * 2 - 4) {
      out.push(cur);
      cur = [];
    }
    cur.push(w);
  }
  if (cur.length) out.push(cur);
  return out;
};
const twoLines = (ws: string[]) => {
  const s = ws.join(" ");
  if (s.length <= MAX_LINE) return s;
  let best = 0;
  for (let i = 1; i < ws.length; i++) if (ws.slice(0, i).join(" ").length <= s.length / 2 + 6) best = i;
  return ws.slice(0, best).join(" ") + "\n" + ws.slice(best).join(" ");
};

let t = 0;
let n = 1;
const cues: string[] = [];
for (const s of ep.segments) {
  const dur = segmentSeconds(s);
  const pieces = chunk(s.text);
  const totalWords = pieces.reduce((a, p) => a + p.length, 0);
  let start = t;
  for (const p of pieces) {
    const d = (dur - 0.3) * (p.length / totalWords);
    cues.push(`${n++}\n${ts(start)} --> ${ts(start + d)}\n${twoLines(p)}\n`);
    start += d;
  }
  t += dur;
}
mkdirSync("out", { recursive: true });
const out = join("out", `${basename(file, ".json")}.srt`);
writeFileSync(out, cues.join("\n"));
console.log(`Subtitles: ${out} (${n - 1} captions)`);
