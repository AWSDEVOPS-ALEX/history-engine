import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, Series, continueRender, delayRender, staticFile, useVideoConfig } from "remotion";
import type { Episode as EpisodeT } from "./schema";
import { segmentFrames } from "./schema";
import { SegmentView } from "./SegmentView";
import { Atmosphere } from "./components/Atmosphere";
import "./theme";
import { hasFile } from "./components/Crowd";

export const Episode: React.FC<{ episode: EpisodeT }> = ({ episode }) => {
  const { fps } = useVideoConfig();
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle));
  }, [handle]);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Series>
        {episode.segments.map((seg, i) => (
          <Series.Sequence key={seg.id} durationInFrames={segmentFrames(seg, fps)} name={`${seg.id} · ${seg.speaker}`}>
            <SegmentView seg={seg} ep={episode} idx={i} />
          </Series.Sequence>
        ))}
      </Series>
      {episode.music && hasFile(episode.music) ? <Audio src={staticFile(episode.music)} volume={episode.musicVolume ?? 0.07} loop /> : null}
      <Atmosphere />
    </AbsoluteFill>
  );
};
