import type React from "react";
import "@fontsource/patrick-hand/400.css";
import "@fontsource/kalam/400.css";
import "@fontsource/kalam/700.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/800.css";

export const HAND = "'Patrick Hand', 'Kalam', cursive";
export const SANS = "'Inter', 'Helvetica Neue', Arial, sans-serif";
export const HAND_BOLD = "'Kalam', 'Patrick Hand', cursive";

/** On-screen writing: bold hand font, white fill, thick dark outline, soft shadow. Readable on any background. */
export const outlineCss = (size: number, color = "#ffffff"): React.CSSProperties => ({
  fontFamily: HAND_BOLD,
  fontWeight: 700,
  color,
  WebkitTextStroke: `${Math.max(5, size / 9)}px #1e1a17`,
  paintOrder: "stroke fill",
  textShadow: `0 ${Math.round(size / 16)}px 0 rgba(0,0,0,0.35)`,
  lineHeight: 1.15,
});

export const C = {
  gray: "#bdbdbd",
  ink: "#2b2622",
  white: "#f7f4ee",
  gold: "#e0a526",
  orange: "#e07b1f",
  ocean: "#1d4f9c",
  land: "#5d7d3e",
  parchment: "#efe2bf",
  wood: "#8a5a2b",
  badge: "rgba(40,40,48,0.78)",
};
