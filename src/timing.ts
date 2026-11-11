/**
 * When each word of a line is spoken, estimated from word length across the clip. Shared by the
 * subtitles and by "shots", which switch the picture on a given word.
 */
const weight = (w: string) => w.replace(/[^\p{L}\p{N}]/gu, "").length + 2.5;

export const wordStarts = (text: string, seconds: number) => {
  const words = text.split(/\s+/).filter(Boolean);
  const total = words.reduce((a, w) => a + weight(w), 0) || 1;
  const speak = Math.max(0.5, seconds - 0.35);
  const starts: number[] = [];
  let acc = 0;
  for (const w of words) {
    starts.push((acc / total) * speak);
    acc += weight(w);
  }
  return { words, starts };
};
