/**
 * One command to preview an episode in Remotion Studio with your voice:
 *   npm run preview -- episodes/ep01-argentina.json
 * It re-attaches the voice clips you already made (free: no Fish Audio call unless a clip is new),
 * then opens Studio on that episode.
 */
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const file = process.argv[2] ?? "episodes/ep01-argentina.json";
execFileSync("npx", ["tsx", "scripts/voice.ts", file], { stdio: "inherit" });
mkdirSync("out", { recursive: true });
writeFileSync("out/preview-props.json", JSON.stringify({ episode: JSON.parse(readFileSync(file, "utf8")) }));
console.log("Opening Studio — click 'Episode' on the left.");
spawn("npx", ["remotion", "studio", "--props=out/preview-props.json"], { stdio: "inherit" });
