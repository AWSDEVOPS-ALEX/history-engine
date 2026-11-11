import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { SANS } from "../theme";
import { wordStarts } from "../timing";

const MAX_CHARS = 44;

/** Groups words into caption lines of up to ~44 characters, preferring breaks after punctuation. */
const lines = (words: string[]) => {
  const out: number[][] = [];
  let cur: number[] = [];
  let len = 0;
  words.forEach((w, i) => {
    if (cur.length && len + w.length + 1 > MAX_CHARS) {
      out.push(cur);
      cur = [];
      len = 0;
    }
    cur.push(i);
    len += w.length + 1;
    if (/[.,!?;:]$/.test(w) && len > MAX_CHARS * 0.55) {
      out.push(cur);
      cur = [];
      len = 0;
    }
  });
  if (cur.length) out.push(cur);
  return out;
};

/**
 * Burned-in captions in plain type, two lines at a time on black boxes (like Ethos), with the word
 * being spoken lit in gold.
 */
export const Subtitles: React.FC<{ text: string; seconds: number }> = ({ text, seconds }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { words, starts } = wordStarts(text, seconds);
  const now = frame / fps;
  let wi = 0;
  for (let i = 0; i < starts.length; i++) if (now >= starts[i]) wi = i;
  const ls = lines(words);
  const li = ls.findIndex((l) => l.includes(wi));
  const page = Math.floor(Math.max(0, li) / 2) * 2; // show lines in pairs
  const shown = ls.slice(page, page + 2);

  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 56, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, pointerEvents: "none" }}>
      {shown.map((l, k) => (
        <div key={k} style={{ background: "rgba(0,0,0,0.82)", padding: "4px 16px 6px", borderRadius: 6, fontFamily: SANS, fontWeight: 600, fontSize: 42, lineHeight: 1.2, color: "#fff" }}>
          {l.map((i, j) => (
            <span key={i} style={{ color: i === wi ? "#ffd34d" : "#ffffff" }}>
              {j ? " " : ""}
              {words[i]}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};
