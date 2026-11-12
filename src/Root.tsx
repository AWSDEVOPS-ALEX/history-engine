import React from "react";
import { Composition } from "remotion";
import { Thumb01 } from "./Thumbnail";
import { Episode } from "./Episode";
import type { Episode as EpisodeT } from "./schema";
import { segmentFrames } from "./schema";
import demo from "../episodes/test-zirostyle.json";
import { Avatar, Banner } from "./Brand";

// The episode JSON is passed as props. To render another episode:
//   npx remotion render Episode out/ep.mp4 --props=episodes/<file>.json
// (scripts/render.ts does this per chapter and joins the parts.)
export const Root: React.FC = () => (
  <>
  <Composition id="Thumb01" component={Thumb01} width={1280} height={720} fps={30} durationInFrames={1} />
  <Composition id="Avatar" component={Avatar} width={800} height={800} fps={30} durationInFrames={1} />
  <Composition id="Banner" component={Banner} width={2560} height={1440} fps={30} durationInFrames={90} />
  <Composition
    id="Episode"
    component={Episode as unknown as React.FC<Record<string, unknown>>}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={300}
    defaultProps={{ episode: demo as unknown as EpisodeT }}
    calculateMetadata={({ props }) => {
      const ep = (props as { episode: EpisodeT }).episode;
      const fps = ep.fps ?? 30;
      // Length comes from the real voice clip durations, never hard-coded.
      const total = ep.segments.reduce((a, s) => a + segmentFrames(s, fps), 0);
      return { durationInFrames: Math.max(1, total), fps };
    }}
  />
  </>
);
