/**
 * Quick visual check without rendering video: one still per segment (or per listed segment),
 * tiled into a single contact sheet. Cheap to look at, cheap for Claude to read.
 *
 *   npx tsx scripts/stills.ts episodes/ep01.json                 # every segment, at 70% of its length
 *   npx tsx scripts/stills.ts episodes/ep01.json c02-s04 c02-s05 # just these
 *   AT=0.3,0.9 npx tsx scripts/stills.ts episodes/ep01.json c01-s08   # several moments per segment
 *
 * Output: out/<episode>/stills/sheet.jpg (+ the single frames next to it)
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { cpus } from "node:os";
import { basename, join, resolve } from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import type { Episode } from "../src/schema";
import { segmentFrames } from "../src/schema";

const [file, ...only] = process.argv.slice(2);
if (!file) throw new Error("usage: tsx scripts/stills.ts episodes/<file>.json [segment ids…]");
const episode: Episode = JSON.parse(readFileSync(file, "utf8"));
const fps = episode.fps ?? 30;
const at = (process.env.AT ?? "0.7").split(",").map(Number);
const dir = join("out", basename(file, ".json"), "stills");
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });

const targets: { id: string; frame: number }[] = [];
let cursor = 0;
for (const s of episode.segments) {
  const len = segmentFrames(s, fps);
  if (!only.length || only.includes(s.id)) for (const a of at) targets.push({ id: s.id, frame: cursor + Math.floor(len * a) });
  cursor += len;
}

const serveUrl = await bundle({ entryPoint: resolve("src/index.ts") });
const inputProps = { episode };
const browserExecutable = process.env.REMOTION_CHROME;
const composition = await selectComposition({ serveUrl, id: "Episode", inputProps, browserExecutable });

// render a few at a time
const parallel = Math.max(1, Math.min(4, cpus().length));
const files: string[] = [];
for (let i = 0; i < targets.length; i += parallel) {
  await Promise.all(
    targets.slice(i, i + parallel).map(async (t, k) => {
      const out = join(dir, `${String(i + k).padStart(3, "0")}_${t.id}.jpg`);
      files[i + k] = out;
      await renderStill({ serveUrl, composition, inputProps, frame: t.frame, output: out, imageFormat: "jpeg", scale: 0.33, browserExecutable });
    }),
  );
  process.stdout.write(`\r${Math.min(i + parallel, targets.length)}/${targets.length}`);
}
console.log("");

const cols = Math.min(4, files.length);
const rows = Math.ceil(files.length / cols);
// segment-id labels need ffmpeg's drawtext filter; Homebrew ffmpeg often lacks it, so fall back to a plain grid
const tile = `tile=${cols}x${rows}:padding=4`;
const sheet = (vf: string) =>
  execFileSync("ffmpeg", ["-y", "-v", "error", "-pattern_type", "glob", "-i", join(dir, "*_*.jpg"), "-vf", vf, "-frames:v", "1", join(dir, "sheet.jpg")], { stdio: "pipe" });
try {
  sheet(`drawtext=text='%{metadata\\:lavf.image2dec.source_basename}':x=8:y=8:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.6,${tile}`);
} catch {
  sheet(tile);
}
console.log(`Contact sheet: ${join(dir, "sheet.jpg")}`);
