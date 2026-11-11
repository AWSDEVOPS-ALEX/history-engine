/**
 * Builds the satellite map tiles from NASA Blue Marble Next Generation (public domain).
 * Run once; re-run with --hi when an episode zooms into a new region.
 *
 *   npm run satellite                          # world + medium detail (sharp to about zoom 11)
 *   npm run satellite -- --hi 5,35,20,48       # + high detail for lon 5..20, lat 35..48 (sharp to about zoom 45)
 *   npm run satellite -- --month 07            # which month's imagery (default 07 = July, green north)
 *   npm run satellite -- --source my.jpg       # use a local equirectangular world image instead of downloading
 *
 * Downloads go to .cache/sat (not bundled). Tiles go to public/sat. The tile list is written to
 * src/sat-manifest.json, which MapScene reads.
 */
import { execFileSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const args = process.argv.slice(2);
const opt = (k: string) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const mm = (opt("--month") ?? "07").padStart(2, "0");
const monthName = MONTHS[Number(mm) - 1];
const BASE = `https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography-bathymetry/${monthName}/`;
const stem = `world.topo.bathy.2004${mm}.3x`;

const CACHE = join(".cache", "sat");
const OUT = join("public", "sat");
mkdirSync(CACHE, { recursive: true });
mkdirSync(join(OUT, "mid"), { recursive: true });
mkdirSync(join(OUT, "hi"), { recursive: true });

// Ethos-style colour: a little more saturation and contrast than NASA's raw mosaic
const GRADE = "eq=saturation=1.18:contrast=1.07:brightness=0.01";
const ff = (a: string[]) => execFileSync("ffmpeg", ["-y", "-v", "error", ...a], { stdio: "inherit" });

async function download(url: string, dest: string) {
  if (existsSync(dest) && statSync(dest).size > 1_000_000) return;
  console.log(`downloading ${url.split("/").pop()} …`);
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Download failed ${res.status}: ${url}`);
  const total = Number(res.headers.get("content-length") ?? 0);
  let got = 0;
  const body = Readable.fromWeb(res.body as any);
  body.on("data", (c: Buffer) => {
    got += c.length;
    if (total) process.stdout.write(`\r  ${((got / total) * 100).toFixed(0)}% of ${(total / 1e6).toFixed(0)} MB`);
  });
  await pipeline(body, createWriteStream(dest + ".part"));
  execFileSync("mv", [dest + ".part", dest]);
  console.log("");
}

// 1. global image (21600 x 10800, ~500 m per pixel)
const globalSrc = opt("--source") ?? join(CACHE, `${stem}21600x10800.jpg`);
if (!opt("--source")) await download(BASE + `${stem}21600x10800.jpg`, globalSrc);

// 2. world overview, 4096 x 2048
console.log("world overview …");
ff(["-i", globalSrc, "-vf", `scale=4096:2048:flags=lanczos,${GRADE}`, "-q:v", "3", join(OUT, "world.jpg")]);

// 3. medium tiles: 30° x 30°, 1800 px (60 px per degree), 6 rows x 12 columns
console.log("medium tiles …");
for (let r = 0; r < 6; r++) {
  const lat0 = 90 - r * 30;
  const parts: string[] = [`[0:v]crop=iw:ih/6:0:ih*${r}/6,split=12${Array.from({ length: 12 }, (_, c) => `[s${c}]`).join("")}`];
  const maps: string[] = [];
  for (let c = 0; c < 12; c++) {
    const lon0 = -180 + c * 30;
    parts.push(`[s${c}]crop=iw/12:ih:iw*${c}/12:0,scale=1800:1800:flags=lanczos,${GRADE}[o${c}]`);
    maps.push("-map", `[o${c}]`, "-q:v", "3", join(OUT, "mid", `${lon0}_${lat0}.jpg`));
  }
  ff(["-i", globalSrc, "-filter_complex", parts.join(";"), ...maps]);
  process.stdout.write(`\r  row ${r + 1}/6`);
}
console.log("");

// 4. optional high-detail tiles: 10° x 10°, 2400 px (240 px per degree), only inside --hi bbox
const hi = opt("--hi");
if (hi) {
  const [w, s, e, n] = hi.split(",").map(Number);
  const want: { lon0: number; lat0: number }[] = [];
  for (let lon0 = -180; lon0 < 180; lon0 += 10)
    for (let lat0 = 90; lat0 > -90; lat0 -= 10) if (lon0 + 10 > w && lon0 < e && lat0 > s && lat0 - 10 < n) want.push({ lon0, lat0 });
  // NASA's 8 source tiles: A–D west→east (90° each), 1 = north, 2 = south
  const groups = new Map<string, { lon0: number; lat0: number }[]>();
  for (const t of want) {
    const col = "ABCD"[Math.floor((t.lon0 + 180) / 90)];
    const row = t.lat0 > 0 ? "1" : "2";
    const k = col + row;
    groups.set(k, [...(groups.get(k) ?? []), t]);
  }
  for (const [k, tiles] of groups) {
    const src = join(CACHE, `${stem}21600x21600.${k}.jpg`);
    await download(BASE + `${stem}21600x21600.${k}.jpg`, src);
    const srcLon0 = -180 + "ABCD".indexOf(k[0]) * 90;
    const srcLat0 = k[1] === "1" ? 90 : 0;
    console.log(`high tiles from ${k} (${tiles.length}) …`);
    const parts = [`[0:v]split=${tiles.length}${tiles.map((_, i) => `[s${i}]`).join("")}`];
    const maps: string[] = [];
    tiles.forEach((t, i) => {
      const x = (t.lon0 - srcLon0) * 240;
      const y = (srcLat0 - t.lat0) * 240;
      parts.push(`[s${i}]crop=2400:2400:${x}:${y},${GRADE}[o${i}]`);
      maps.push("-map", `[o${i}]`, "-q:v", "3", join(OUT, "hi", `${t.lon0}_${t.lat0}.jpg`));
    });
    ff(["-i", src, "-filter_complex", parts.join(";"), ...maps]);
  }
}

// 5. manifest
const list = (d: string) => readdirSync(join(OUT, d)).filter((f) => f.endsWith(".jpg")).map((f) => f.replace(".jpg", ""));
const manifest = {
  source: "NASA Blue Marble Next Generation (public domain)",
  month: mm,
  world: "sat/world.jpg",
  mid: { deg: 30, px: 1800, tiles: list("mid") },
  hi: { deg: 10, px: 2400, tiles: list("hi") },
};
writeFileSync(join("src", "sat-manifest.json"), JSON.stringify(manifest, null, 1));
console.log(`Done. ${manifest.mid.tiles.length} medium tiles, ${manifest.hi.tiles.length} high tiles. Maps now use satellite imagery.`);
