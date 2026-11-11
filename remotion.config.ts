import { Config } from "@remotion/cli/config";

Config.setEntryPoint("./src/index.ts");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95); // near-lossless frames
Config.setCrf(16); // less compression in the final MP4
// Set to your CPU core count for faster renders, e.g. Config.setConcurrency(8);
// If Remotion can't download its own headless Chrome on your machine, point it at Chrome:
if (process.env.REMOTION_CHROME) Config.setBrowserExecutable(process.env.REMOTION_CHROME);
