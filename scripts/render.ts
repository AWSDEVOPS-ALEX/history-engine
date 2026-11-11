/**
 * Render a full episode in chapter-sized chunks and join them, so a crash at minute 40
 * only costs one chunk. Chapters are read from segment ids: "c03-s12" belongs to chapter 3.
 *
 *   REMOTION_CHROME=/path/to/chrome npx tsx scripts/render.ts episodes/<file>.json
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { cpus } from "node:os";
import { basename, join, resolve } from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import type { Episode } from "../src/schema";
import { segmentFrames } from "../src/schema";

const file = process.argv[2];
if (!file) throw new Error("usage: tsx scripts/render.ts episodes/<file>.json");
// always attach the voice first (free if the clips already exist), so a render is never silent
execFileSync("npx", ["tsx", "scripts/voice.ts", file], { stdio: "inherit" });
const episode: Episode = JSON.parse(readFileSync(file, "utf8"));
const fps = episode.fps ?? 30;
const slug = basename(file, ".json");
const outDir = join("out", slug);
mkdirSync(outDir, { recursive: true });

// frame ranges per chapter
const ranges: { ch: string; from: number; to: number }[] = [];
let cursor = 0;
for (const s of episode.segments) {
  const ch = s.id.split("-")[0];
  const len = segmentFrames(s, fps);
  const last = ranges[ranges.length - 1];
  if (last && last.ch === ch) last.to = cursor + len - 1;
  else ranges.push({ ch, from: cursor, to: cursor + len - 1 });
  cursor += len;
}

const serveUrl = await bundle({ entryPoint: resolve("src/index.ts") });
const inputProps = { episode };
const composition = await selectComposition({ serveUrl, id: "Episode", inputProps, browserExecutable: process.env.REMOTION_CHROME });

const parts: string[] = [];
for (const r of ranges) {
  const out = join(outDir, `${r.ch}.mp4`);
  parts.push(out);
  if (existsSync(out)) {
    console.log(`skip ${r.ch} (exists)`);
    continue;
  }
  console.log(`render ${r.ch}: frames ${r.from}–${r.to}`);
  // 4K uses ~4x the memory per frame, so fewer frames at once; a failed chunk retries with fewer still
  const scale = Number(process.env.SCALE ?? 1);
  let conc = Number(process.env.CONCURRENCY ?? (scale > 1 ? Math.min(4, Math.max(1, Math.floor(cpus().length / 2))) : Math.max(1, cpus().length - 1)));
  const tmp = out.replace(/\.mp4$/, ".part.mp4");
  for (let attempt = 1; ; attempt++) {
    try {
      await renderMedia({
        serveUrl,
        composition,
        inputProps,
        codec: "h264",
        crf: 16,
        jpegQuality: 95,
        scale, // SCALE=2 renders 4K
        concurrency: conc,
        timeoutInMilliseconds: 180000, // heavy 4K frames can take a while; don't give up at 30 s
        frameRange: [r.from, r.to],
        outputLocation: tmp,
        browserExecutable: process.env.REMOTION_CHROME,
        logLevel: "error",
        onProgress: ({ progress }) => process.stdout.write(`\r  ${(progress * 100).toFixed(0)}%   `),
      });
      renameSync(tmp, out); // only a finished chunk gets its real name, so a crash never leaves a half file
      break;
    } catch (err) {
      rmSync(tmp, { force: true });
      if (attempt >= 3) throw err;
      conc = Math.max(1, Math.floor(conc / 2));
      console.log(`\n  chunk ${r.ch} failed (${(err as Error).message.split("\n")[0]}). Retrying with ${conc} at a time…`);
    }
  }
  console.log("");
}

const list = join(outDir, "parts.txt");
writeFileSync(list, parts.map((p) => `file '${resolve(p)}'`).join("\n"));
const final = join("out", `${slug}.mp4`);
execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", final]);
console.log(`Done: ${final}`);
execFileSync("npx", ["tsx", "scripts/subtitles.ts", file], { stdio: "inherit" });
