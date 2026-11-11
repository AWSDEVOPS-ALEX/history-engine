import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Background, BigSmoke, Steamship } from "./Sets";
import { Character } from "./Character";
import { CrowdLayer, extra } from "./Crowd";
import { MapToken } from "./MapIcons";
import { Icon, isCardIcon } from "./Icons";
import { HAND_BOLD, outlineCss } from "../theme";
import { FlagArt } from "./Flags";
import type { IconName, MapIcon, SetName, Visual } from "../schema";

/**
 * Action scenes: small animated set-pieces that act out a line of the script instead of
 * illustrating it with a static icon. Each is drawn in code on a 1920×1080 stage.
 */
type ActionV = Extract<Visual, { kind: "action" }>;

const ink = "#2b2622";
const ease = (k: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3);

const Soft: React.FC<{ set: SetName; blur?: number }> = ({ set, blur = 3 }) => (
  <AbsoluteFill style={{ filter: `blur(${blur / 2}px) saturate(1.05)`, transform: "scale(1.02)" }}>
    <Background set={set} />
  </AbsoluteFill>
);

/**
 * DarkStage — pure black data-viz backdrop, Paper Billions style.
 * No scene image. The numbers and charts are the whole story.
 */
const DarkStage: React.FC<{ accent?: string }> = ({ accent = "#e74c3c" }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#0a0a0f" }}>
      {/* Very subtle radial glow so it isn't dead flat */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${accent}18 0%, transparent 70%)`,
          opacity: interpolate(f, [0, 12], [0, 1], { extrapolateRight: "clamp" }),
        }}
      />
      {/* Faint grid — matches blueprint aesthetic */}
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ position: "absolute", opacity: 0.04 }}>
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 192} y1={0} x2={i * 192} y2={1080} stroke="#fff" strokeWidth={1} />
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 180} x2={1920} y2={i * 180} stroke="#fff" strokeWidth={1} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

const Token: React.FC<{ icon: IconName | MapIcon; x: number; y: number; s: number; step?: number }> = ({ icon, x, y, s, step = 0 }) =>
  isCardIcon(icon) ? (
    <g transform={`translate(${x} ${y}) scale(${s / 2.6})`}>
      <foreignObject x={-160} y={-170} width={320} height={340}>
        <div style={{ position: "relative", width: 320, height: 340 }}>
          <Icon name={icon as IconName} x={50} y={50} scale={0.7} anim="none" />
        </div>
      </foreignObject>
    </g>
  ) : (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <MapToken icon={icon as MapIcon} step={step} />
    </g>
  );

const Caption: React.FC<{ x: number; y: number; text: string; size?: number; color?: string; at?: number }> = ({ x, y, text, size = 60, color = "#fff", at = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const df = frame - at * fps;
  if (df < 0) return null;
  // smooth cubic ease-out scale pop — no spring overshoot
  const raw = Math.min(df / 16, 1);
  const k = 1 - Math.pow(1 - raw, 3);
  return (
    <div style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: `translate(-50%,-50%) scale(${k})`, ...outlineCss(size, color), fontSize: size, whiteSpace: "nowrap" }}>{text}</div>
  );
};

/* ---------------- train ---------------- */
const Train: React.FC<{ v: ActionV }> = ({ v }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const dir = v.reverse ? -1 : 1;
  const x0 = interpolate(f, [0, durationInFrames], dir > 0 ? [-900, 1500] : [2800, 400]);
  const cars = 4;
  return (
    <AbsoluteFill>
      <Background set={v.bg ?? "pampas"} />
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ position: "absolute" }}>
        <rect x={0} y={842} width={1920} height={16} fill="#6b5a4a" />
        {Array.from({ length: 40 }).map((_, i) => <rect key={i} x={i * 50} y={836} width={24} height={30} fill="#7a5233" />)}
        <rect x={0} y={826} width={1920} height={8} fill="#9aa0a6" stroke={ink} strokeWidth={2} />
        <g transform={`translate(${x0} 0) scale(${dir} 1)`} stroke={ink} strokeWidth={6} strokeLinejoin="round">
          <BigSmoke x={170} y={560} f={f} scale={0.9} />
          {/* locomotive */}
          <rect x={20} y={640} width={260} height={150} rx={20} fill="#2b2b33" />
          <rect x={180} y={570} width={130} height={220} rx={10} fill="#b23a2a" />
          <rect x={210} y={600} width={70} height={60} fill="#f2d27a" />
          <rect x={140} y={580} width={44} height={70} fill="#2b2b33" />
          <path d="M20 790 L-30 820 L20 820 Z" fill="#9aa0a6" />
          {[70, 170, 260].map((wx) => (
            <g key={wx} transform={`translate(${wx} 806) rotate(${f * 12 * dir})`}>
              <circle r={36} fill="#3a3a44" />
              <path d="M-30 0 L30 0 M0 -30 L0 30" stroke="#9aa0a6" strokeWidth={5} />
            </g>
          ))}
          {/* wagons */}
          {Array.from({ length: cars }).map((_, i) => {
            const wx = -330 - i * 330;
            return (
              <g key={i}>
                <rect x={wx} y={680} width={300} height={110} rx={8} fill={["#8a5a2b", "#a8743f"][i % 2]} />
                <path d={`M${wx + 300} 740 L${wx + 330} 740`} />
                {v.cargo === "cattle" ? (
                  [0, 1, 2].map((k) => (
                    <g key={k} transform={`translate(${wx + 60 + k * 90} 660) scale(1.1)`}>
                      <MapToken icon="cattle" step={f * 0.2 + k} />
                    </g>
                  ))
                ) : v.cargo === "flag" ? (
                  <path d={`M${wx + 150} 680 L${wx + 150} 590 M${wx + 150} 590 L${wx + 230} ${600 + Math.sin(f / 5 + i) * 6} L${wx + 150} 620`} fill="#74acdf" />
                ) : (
                  <path d={`M${wx + 10} 680 Q${wx + 150} 600 ${wx + 290} 680 Z`} fill="#e0b84a" />
                )}
                {[60, 240].map((o) => (
                  <g key={o} transform={`translate(${wx + o} 806) rotate(${f * 12 * dir})`}>
                    <circle r={30} fill="#3a3a44" />
                    <path d="M-24 0 L24 0" stroke="#9aa0a6" strokeWidth={5} />
                  </g>
                ))}
              </g>
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------- voyage ---------------- */
const Voyage: React.FC<{ v: ActionV }> = ({ v }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const dir = v.reverse ? -1 : 1;
  const x = interpolate(f, [0, durationInFrames], dir > 0 ? [-300, 1500] : [2200, 420]);
  return (
    <AbsoluteFill>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%">
        <defs>
          <linearGradient id="vsky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8fbfe6" />
            <stop offset="100%" stopColor="#d9ecf7" />
          </linearGradient>
          <linearGradient id="vsea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2f6fb5" />
            <stop offset="100%" stopColor="#173f78" />
          </linearGradient>
        </defs>
        <rect width={1920} height={1080} fill="url(#vsky)" />
        {[200, 900, 1500].map((cx, i) => (
          <ellipse key={cx} cx={(cx + f * (0.5 + i * 0.2)) % 2200 - 100} cy={140 + i * 50} rx={130} ry={40} fill="#fff" opacity={0.9} />
        ))}
        <rect y={560} width={1920} height={520} fill="url(#vsea)" />
        <g transform={`translate(${x} 0) scale(${dir} 1)`}>
          {v.cargo === "empty" ? null : null}
          <Steamship x={0} y={600} f={f} s={0.9} />
          <path d={`M-420 690 Q-700 ${700 + Math.sin(f / 8) * 6} -1000 700`} stroke="rgba(255,255,255,0.6)" strokeWidth={10} fill="none" />
        </g>
        {Array.from({ length: 5 }).map((_, r) => (
          <path
            key={r}
            d={Array.from({ length: 12 }).map((__, c) => `M${((c * 190 - f * (2 + r * 0.6)) % 2300 + 2300) % 2300 - 200} ${720 + r * 75} q35 -22 70 0`).join(" ")}
            stroke="rgba(255,255,255,0.55)"
            strokeWidth={6}
            fill="none"
          />
        ))}
        {[0, 1].map((k) => {
          const wx = ((f * 3 + k * 1200) % 2600) - 340;
          const lift = Math.sin(f / 14 + k) * 16;
          return (
            <path key={k} d={`M${wx - 300} 1080 Q${wx - 140} ${920 + lift} ${wx} ${870 + lift} Q${wx + 100} ${840 + lift} ${wx + 140} ${895 + lift} Q${wx + 70} ${900 + lift} ${wx + 50} ${940 + lift} Q${wx + 180} 1000 ${wx + 300} 1080 Z`} fill="#245aa0" stroke="#f4f4f4" strokeWidth={9} strokeLinejoin="round" />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------- money rain ---------------- */
const MoneyRain: React.FC<{ v: ActionV }> = ({ v }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Background set={v.bg ?? "street"} />
      <CrowdLayer v={{ kind: "crowd", set: v.bg ?? "street", action: "cheer", n: 8, seed: 5 }} />
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ position: "absolute" }}>
        {Array.from({ length: 34 }).map((_, i) => {
          const x = (i * 211) % 1920 + Math.sin(f / 12 + i) * 40;
          const y = ((f * (2.6 + (i % 5) * 0.5) + i * 157) % 1300) - 150;
          const r = Math.sin(f / 14 + i) * 30;
          const flip = Math.abs(Math.cos(f / 12 + i));
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${0.6 + flip * 0.6} 1)`}>
              <rect x={-44} y={-22} width={88} height={44} rx={4} fill={v.item === "dollar" ? "#7fae7a" : "#8fb8d6"} stroke={ink} strokeWidth={3} />
              <circle r={11} fill="none" stroke={ink} strokeWidth={3} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------- printing press ---------------- */
const Press: React.FC<{ v: ActionV }> = ({ v }) => {
  const f = useCurrentFrame();
  const beat = (f % 22) / 22;
  const down = beat < 0.35 ? beat / 0.35 : 1 - (beat - 0.35) / 0.65;
  const pile = Math.min(14, Math.floor(f / 16));
  return (
    <AbsoluteFill>
      <Soft set={v.bg ?? "factory"} />
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ position: "absolute" }}>
        <ellipse cx={760} cy={900} rx={380} ry={40} fill="rgba(0,0,0,0.25)" />
        <g stroke={ink} strokeWidth={8} strokeLinejoin="round">
          <rect x={460} y={260} width={70} height={640} fill="#6b4a2f" />
          <rect x={990} y={260} width={70} height={640} fill="#6b4a2f" />
          <rect x={430} y={220} width={660} height={80} rx={10} fill="#8a5a2b" />
          <rect x={700} y={120} width={120} height={120} rx={14} fill="#9aa0a6" />
          <path d={`M760 300 L760 ${380 + down * 160}`} strokeWidth={26} stroke="#5a5f66" />
          <rect x={560} y={380 + down * 160} width={400} height={70} rx={8} fill="#7a7f87" />
          <rect x={520} y={700} width={480} height={90} rx={8} fill="#c98a4b" />
          <rect x={560} y={680} width={400} height={24} fill="#8fb8d6" />
          <rect x={430} y={790} width={660} height={110} rx={10} fill="#5a3d2b" />
        </g>
        {/* notes flying out */}
        {Array.from({ length: 10 }).map((_, i) => {
          const q = ((f + i * 8) % 80) / 80;
          const x = 1000 + q * 520;
          const y = 690 - Math.sin(q * Math.PI) * 300 + q * 120;
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${q * 380 + i * 30})`} opacity={1 - q * 0.2}>
              <rect x={-50} y={-25} width={100} height={50} rx={4} fill="#8fb8d6" stroke={ink} strokeWidth={3} />
              <circle r={12} fill="none" stroke={ink} strokeWidth={3} />
            </g>
          );
        })}
        {Array.from({ length: pile }).map((_, i) => (
          <rect key={i} x={1430 + (i % 2) * 14} y={880 - i * 22} width={220} height={22} rx={4} fill="#8fb8d6" stroke={ink} strokeWidth={4} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------- price tag ---------------- */
const PriceTag: React.FC<{ v: ActionV }> = ({ v }) => {
  const f = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const from = v.from ?? 0;
  const to = v.to ?? 130000;
  const k = interpolate(f, [6, durationInFrames - 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const val = Math.round(from + (to - from) * ease(k));

  // Snap-in: number slams in hard on frame 6
  const entryK = ease(Math.min((f - 2) / 10, 1));
  const scale = interpolate(f, [2, 14], [2.4, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Colour shifts from white → red as the number climbs
  const redAmount = k;
  const r = Math.round(255);
  const g = Math.round(255 * (1 - redAmount * 0.7));
  const b_c = Math.round(255 * (1 - redAmount * 0.85));
  const numColor = `rgb(${r},${g},${b_c})`;

  const fmt = (n: number): string => {
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    return n.toLocaleString("en-US");
  };

  return (
    <AbsoluteFill>
      <DarkStage accent="#e74c3c" />
      {/* Thin horizontal stripe — context label */}
      {v.item ? (
        <div style={{
          position: "absolute", top: 220, left: 0, right: 0, textAlign: "center",
          fontFamily: HAND_BOLD, fontWeight: 700, fontSize: 56,
          color: "rgba(255,255,255,0.55)", letterSpacing: "0.12em", textTransform: "uppercase",
          opacity: entryK,
        }}>
          {v.item}
        </div>
      ) : null}

      {/* BIG counter — the whole visual */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 0,
        opacity: entryK,
        transform: `scale(${scale})`,
      }}>
        {/* Prefix / currency line */}
        {v.prefix ? (
          <div style={{
            fontFamily: HAND_BOLD, fontWeight: 800, fontSize: 72,
            color: "rgba(255,255,255,0.6)", letterSpacing: "0.04em",
          }}>
            {v.prefix}
          </div>
        ) : null}

        {/* The main number */}
        <div style={{
          fontFamily: HAND_BOLD, fontWeight: 900,
          fontSize: fmt(val).length > 8 ? 160 : 200,
          color: numColor,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          textShadow: `0 0 80px rgba(231,76,60,${k * 0.6})`,
        }}>
          {fmt(val)}
        </div>

        {/* Suffix */}
        {v.suffix ? (
          <div style={{
            fontFamily: HAND_BOLD, fontWeight: 700, fontSize: 68,
            color: "rgba(255,255,255,0.65)", letterSpacing: "0.08em", marginTop: 8,
          }}>
            {v.suffix}
          </div>
        ) : null}
      </div>

      {/* Red accent line that grows as number climbs */}
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ position: "absolute" }}>
        <line
          x1={960 - k * 400} y1={700} x2={960 + k * 400} y2={700}
          stroke="#e74c3c" strokeWidth={6} strokeLinecap="round"
          opacity={k * 0.8}
        />
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------- bar chart ---------------- */
const Bars: React.FC<{ v: ActionV }> = ({ v }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bars = v.bars ?? [];
  const max = Math.max(...bars.map((b) => b.value), 1);
  // Responsive bar width: fewer bars → wider; more bars → narrower
  const n = Math.max(1, bars.length);
  const chartW = 1200;
  const gap = Math.min(40, 20 + (5 - n) * 8);
  const w = Math.min(220, (chartW - gap * (n + 1)) / n);
  const accent = bars[0]?.color ?? "#e74c3c";
  // Find the bar with the top value to highlight it
  const topIdx = bars.reduce((best, b, i) => (b.value > bars[best].value ? i : best), 0);

  // Format value compactly
  const fmt = (val: number): string => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 10_000) return `${(val / 1_000).toFixed(0)}K`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
    return `${Math.round(val * 10) / 10}`;
  };

  // Layout constants — adjusted so labels never clip the bottom edge
  // Angled labels need ~180px below baseline; horizontal need ~80px
  const needsAngledLabels = n >= 4;
  const BASE_Y = needsAngledLabels ? 680 : 720;   // axis baseline
  const TOP_Y  = 230;                              // top of tallest bar (kept below title ~y112)
  const BAR_H  = BASE_Y - TOP_Y;                  // max bar height px

  return (
    <AbsoluteFill>
      <DarkStage accent={accent} />
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ position: "absolute" }}>
        {/* Axis lines */}
        <line x1={300} y1={BASE_Y} x2={1620} y2={BASE_Y} stroke="rgba(255,255,255,0.22)" strokeWidth={3} />
        <line x1={300} y1={BASE_Y} x2={300} y2={TOP_Y - 20} stroke="rgba(255,255,255,0.22)" strokeWidth={3} />
        {/* Horizontal guide lines */}
        {[0.25, 0.5, 0.75, 1].map((frac) => (
          <line key={frac} x1={300} y1={BASE_Y - frac * BAR_H} x2={1620} y2={BASE_Y - frac * BAR_H}
            stroke="rgba(255,255,255,0.07)" strokeWidth={2} />
        ))}

        {bars.map((b, i) => {
          const k = ease(spring({ frame: f - 6 - i * 10, fps, config: { damping: 24, stiffness: 90 } }));
          const h = (b.value / max) * BAR_H * k;
          // Centre bars in the chart area
          const chartW2 = 1300;
          const totalUsed = n * w + (n - 1) * gap;
          const startX = 320 + (chartW2 - totalUsed) / 2;
          const x = startX + i * (w + gap);
          const isTop = i === topIdx;
          const barColor = b.color ?? "#e74c3c";
          // Stack from the bar top upward: bar → gap → flag → gap → value label
          // Everything anchors off the bar top; we work upward so nothing collides.
          const barTopY  = BASE_Y - h;           // top edge of the bar
          const flagGap  = 10;                   // space between bar top and flag bottom
          const flagH    = 62;                   // visible height of flag badge (matches rect height={62})
          const valSize  = isTop ? 66 : 54;
          const valGap   = 10;                   // space between flag top and value label baseline

          // Flag: anchored flagGap below bar top (i.e. flagY = top of the flag rect)
          const rawFlagY = barTopY - flagGap - flagH;
          const flagY    = Math.min(rawFlagY, TOP_Y + 4);   // never below the bar top; push up if bar very tall

          // Value label: always above the flag (or above bar when no flag)
          const rawValY  = b.flag && k > 0.3
            ? flagY - valGap                    // baseline sits valGap above flag top
            : barTopY - 20;                     // no flag: just above bar top
          const valY     = Math.min(rawValY, TOP_Y + valSize * 0.75);  // clamp within chart area

          return (
            <g key={i}>
              {/* Bar body */}
              <rect x={x} y={BASE_Y - h} width={w} height={h} rx={8}
                fill={barColor} opacity={0.92}
              />
              {/* Bright top edge */}
              {h > 4 && (
                <rect x={x} y={BASE_Y - h} width={w} height={Math.min(6, h)} rx={4}
                  fill={isTop ? "#fff" : "rgba(255,255,255,0.4)"}
                />
              )}
              {/* Flag badge above bar */}
              {b.flag && k > 0.3 ? (
                <g transform={`translate(${x + w / 2 - 40} ${flagY})`}>
                  <rect x={-4} y={-4} width={88} height={62} rx={6}
                    fill="#fff" stroke="rgba(0,0,0,0.5)" strokeWidth={3} />
                  <FlagArt code={b.flag} />
                </g>
              ) : null}
              {/* Value label above bar */}
              {k > 0.5 && !v.hideValues ? (
                <text x={x + w / 2} y={valY}
                  textAnchor="middle" fontFamily={HAND_BOLD} fontWeight={700}
                  fontSize={isTop ? 66 : 54}
                  fill={isTop ? "#ffd34d" : "#ffffff"}
                  stroke="#0a0a0f" strokeWidth={8} paintOrder="stroke">
                  {`${fmt(b.value)}${v.suffix ?? ""}`}
                </text>
              ) : null}
              {/* Bar label — always angled for n≥4 so text never overlaps */}
              {needsAngledLabels ? (
                <text
                  x={x + w / 2} y={BASE_Y + 12}
                  textAnchor="end"
                  fontFamily={HAND_BOLD} fontWeight={700}
                  fontSize={Math.min(40, 160 / n)}
                  fill="rgba(255,255,255,0.85)"
                  stroke="#0a0a0f" strokeWidth={5} paintOrder="stroke"
                  transform={`rotate(-40 ${x + w / 2} ${BASE_Y + 12})`}>
                  {b.label}
                </text>
              ) : (
                <text x={x + w / 2} y={BASE_Y + 52}
                  textAnchor="middle" fontFamily={HAND_BOLD} fontWeight={700}
                  fontSize={Math.min(50, 320 / Math.max(1, bars.map(bb => bb.label.length).reduce((a,c) => a + c, 0) / n))}
                  fill="rgba(255,255,255,0.85)"
                  stroke="#0a0a0f" strokeWidth={6} paintOrder="stroke">
                  {b.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {/* Headline label */}
      {v.item ? (
        <div style={{
          position: "absolute", top: 56, left: 0, right: 0, textAlign: "center",
          fontFamily: HAND_BOLD, fontWeight: 800, fontSize: 56,
          color: "rgba(255,255,255,0.65)", letterSpacing: "0.08em", textTransform: "uppercase",
        }}>
          {v.item}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/* ---------------- scales ---------------- */
const Scales: React.FC<{ v: ActionV }> = ({ v }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const target = v.tilt ?? 0;
  const a = target * spring({ frame: f - 10, fps, config: { damping: 26, stiffness: 28 } }) + Math.sin(f / 28) * (target === 0 ? 5 : 0.8);
  const rad = (a * Math.PI) / 180;
  const L = 400;
  const pan = (side: -1 | 1) => ({ x: 960 + side * L * Math.cos(rad), y: 400 + side * L * Math.sin(rad) });
  const lp = pan(-1);
  const rp = pan(1);

  // Colour: left pan glows warmer, right cooler — or red on the low side
  const leftHeavy = target < -3;
  const rightHeavy = target > 3;
  const panFill = (side: "left" | "right") => {
    if (side === "left" && leftHeavy) return "#e74c3c22";
    if (side === "right" && rightHeavy) return "#e74c3c22";
    return "rgba(255,255,255,0.06)";
  };

  return (
    <AbsoluteFill>
      <DarkStage accent="#f1c40f" />
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ position: "absolute" }}>
        {/* Beam glow */}
        <line x1={lp.x} y1={lp.y} x2={rp.x} y2={rp.y}
          stroke="rgba(241,196,15,0.15)" strokeWidth={40} strokeLinecap="round" />

        <g stroke="rgba(255,255,255,0.7)" strokeWidth={6} strokeLinejoin="round">
          {/* Post */}
          <line x1={960} y1={380} x2={960} y2={860} stroke="rgba(255,255,255,0.4)" strokeWidth={12} />
          {/* Base */}
          <path d="M830 870 L1090 870 L1050 840 L870 840 Z" fill="rgba(255,255,255,0.15)" />
          {/* Beam */}
          <line x1={lp.x} y1={lp.y} x2={rp.x} y2={rp.y} stroke="#f1c40f" strokeWidth={14} />
          <circle cx={960} cy={400} r={20} fill="#f1c40f" />

          {/* Pans */}
          {[{ p: lp, side: "left" }, { p: rp, side: "right" }].map(({ p, side }) => (
            <g key={side}>
              <path d={`M${p.x} ${p.y} L${p.x - 110} ${p.y + 180} M${p.x} ${p.y} L${p.x + 110} ${p.y + 180}`}
                stroke="rgba(255,255,255,0.4)" strokeWidth={3} />
              {/* Pan shape */}
              <path d={`M${p.x - 140} ${p.y + 180} Q${p.x} ${p.y + 260} ${p.x + 140} ${p.y + 180}`}
                fill={panFill(side as "left" | "right")} stroke="#f1c40f" strokeWidth={6} />
            </g>
          ))}
        </g>

        {/* Icons in pans */}
        {v.left ? <Token icon={v.left.icon} x={lp.x} y={lp.y + 130} s={1.5} step={f * 0.3} /> : null}
        {v.right ? <Token icon={v.right.icon} x={rp.x} y={rp.y + 130} s={1.5} step={f * 0.3} /> : null}
      </svg>

      {/* Pan labels — clamped so they never fall off-screen at steep tilts */}
      {v.left?.label ? (
        <div style={{
          position: "absolute",
          left: Math.max(120, Math.min(1800, lp.x)),
          top: Math.max(60, Math.min(900, lp.y + 310)),
          transform: "translate(-50%, 0)",
          fontFamily: HAND_BOLD, fontWeight: 700, fontSize: 54,
          color: leftHeavy ? "#e74c3c" : "#ffffff",
          textShadow: "0 2px 12px rgba(0,0,0,0.9)",
          whiteSpace: "nowrap",
        }}>
          {v.left.label}
        </div>
      ) : null}
      {v.right?.label ? (
        <div style={{
          position: "absolute",
          left: Math.max(120, Math.min(1800, rp.x)),
          top: Math.max(60, Math.min(900, rp.y + 310)),
          transform: "translate(-50%, 0)",
          fontFamily: HAND_BOLD, fontWeight: 700, fontSize: 54,
          color: rightHeavy ? "#e74c3c" : "#ffffff",
          textShadow: "0 2px 12px rgba(0,0,0,0.9)",
          whiteSpace: "nowrap",
        }}>
          {v.right.label}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/* ---------------- fence (corralito) ---------------- */
const Fence: React.FC<{ v: ActionV }> = ({ v }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const posts = 14;
  return (
    <AbsoluteFill>
      <Soft set={v.bg ?? "bank"} />
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ position: "absolute" }}>
        <ellipse cx={960} cy={780} rx={430} ry={120} fill="rgba(0,0,0,0.2)" />
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={i} x={830 + (i % 3) * 20} y={740 - i * 26} width={240} height={26} rx={4} fill="#7fae7a" stroke={ink} strokeWidth={4} />
        ))}
        {Array.from({ length: posts }).map((_, i) => {
          const ang = (i / posts) * Math.PI * 2;
          const x = 960 + Math.cos(ang) * 420;
          const y = 760 + Math.sin(ang) * 120;
          const k = spring({ frame: f - 8 - i * 4, fps, config: { damping: 28, stiffness: 90 } });
          return (
            <g key={i} transform={`translate(${x} ${y}) scale(1 ${k})`} stroke={ink} strokeWidth={5}>
              <rect x={-12} y={-190} width={24} height={190} fill="#a8743f" />
              <path d="M-12 -190 L0 -214 L12 -190 Z" fill="#a8743f" />
            </g>
          );
        })}
        {f > 8 + posts * 3 ? (
          <g fill="none" stroke="#8a5a2b" strokeWidth={10} opacity={interpolate(f, [8 + posts * 3, 20 + posts * 3], [0, 1], { extrapolateRight: "clamp" })}>
            <ellipse cx={960} cy={640} rx={420} ry={120} />
            <ellipse cx={960} cy={700} rx={420} ry={120} />
          </g>
        ) : null}
      </svg>
      {[0, 1].map((i) => (
        <div key={i} style={{ position: "absolute", left: i ? 1580 : 200, bottom: 40, transform: `translateX(-50%) translateY(${Math.sin(f / 5 + i) * 6}px)` }}>
          <Character spec={extra(90 + i * 7)} pose={Math.floor(f / 12 + i) % 2 ? "angry" : "point"} height={480} flip={i === 1} />
        </div>
      ))}
    </AbsoluteFill>
  );
};

/* ---------------- helicopter ---------------- */
const Helicopter: React.FC<{ v: ActionV }> = ({ v }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const k = interpolate(f, [durationInFrames * 0.25, durationInFrames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const x = 960 + k * k * 700;
  const y = 240 - k * 300 + Math.sin(f / 6) * 4;
  const blade = Math.cos(f * 1.6);
  return (
    <AbsoluteFill>
      <Background set={v.bg ?? "plaza"} />
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ position: "absolute" }}>
        <g transform={`translate(${x} ${y}) rotate(${-k * 12}) scale(1.2)`} stroke={ink} strokeWidth={6} strokeLinejoin="round">
          <path d="M-120 -10 Q-120 -80 -20 -80 L60 -80 Q120 -70 120 0 Q110 40 40 40 L-80 40 Q-120 40 -120 -10 Z" fill="#3c5a3a" />
          <path d="M100 -40 L300 -50 L300 -30 L110 -10" fill="#3c5a3a" />
          <path d="M290 -80 L300 -40 L310 -80 Z" fill="#3c5a3a" />
          <path d="M-60 -60 Q-90 -40 -80 0 L-20 0 L-20 -60 Z" fill="#a9d4ee" />
          <path d="M-80 70 L80 70 M-50 40 L-60 70 M50 40 L60 70" />
          <path d="M0 -80 L0 -110" />
          <path d={`M${-240 * blade} -112 L${240 * blade} -112`} strokeWidth={10} />
        </g>
        {f < 40 ? (
          <g fill="rgba(240,230,210,0.6)">
            {Array.from({ length: 6 }).map((_, i) => <circle key={i} cx={960 + (i - 2.5) * 70} cy={260 + Math.sin(f / 3 + i) * 10} r={30 + f * 0.6} opacity={1 - f / 40} />)}
          </g>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------- chainsaw ---------------- */
const Chainsaw: React.FC<{ v: ActionV }> = ({ v }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const cut = interpolate(f, [12, durationInFrames * 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fall = interpolate(f, [durationInFrames * 0.6, durationInFrames * 0.85], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sx = 1500 - cut * 760;
  return (
    <AbsoluteFill>
      <Soft set={v.bg ?? "plaza"} />
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ position: "absolute" }}>
        <g stroke={ink} strokeWidth={6}>
          {Array.from({ length: 9 }).map((_, i) => (
            <rect key={i} x={620} y={860 - (i + 1) * 50} width={680} height={50} rx={4} fill={i % 2 ? "#efe2bf" : "#f7f0dc"} />
          ))}
          <g transform={`translate(${fall * 220} ${fall * 120}) rotate(${fall * 24} 1300 410)`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <rect key={i} x={620} y={410 - (i + 1) * 50} width={680} height={50} rx={4} fill={i % 2 ? "#efe2bf" : "#f7f0dc"} />
            ))}
          </g>
        </g>
        <text x={960} y={720} textAnchor="middle" fontFamily={HAND_BOLD} fontWeight={700} fontSize={90} fill="#c0392b" stroke={ink} strokeWidth={4} paintOrder="stroke">{v.item ?? "SPENDING"}</text>
        {cut > 0 && cut < 1
          ? Array.from({ length: 12 }).map((_, i) => (
              <circle key={i} cx={sx - 40 + Math.sin(f + i) * 60} cy={420 + ((f * 9 + i * 40) % 300)} r={6} fill="#e0b84a" />
            ))
          : null}
        <g transform={`translate(${sx} ${410 + Math.sin(f * 0.8) * 3}) scale(-5 5)`}>
          <MapToken icon="chainsaw" step={f} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------- crash board ---------------- */
const Crash: React.FC<{ v: ActionV }> = ({ v }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const pts = v.cycle
    ? [[0, 0.75], [0.08, 0.82], [0.16, 0.86], [0.22, 0.35], [0.3, 0.5], [0.38, 0.62], [0.44, 0.2], [0.52, 0.38], [0.6, 0.55], [0.66, 0.15], [0.74, 0.32], [0.82, 0.48], [0.88, 0.12], [1, 0.22]]
    : [[0, 0.3], [0.1, 0.38], [0.2, 0.45], [0.3, 0.55], [0.4, 0.62], [0.5, 0.72], [0.58, 0.8], [0.66, 0.55], [0.74, 0.3], [0.84, 0.18], [1, 0.08]];
  const k = interpolate(f, [5, durationInFrames * 0.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shown = pts.filter((p) => p[0] <= k);
  const X = (t: number) => 380 + t * 1160;
  const Y = (v2: number) => 820 - v2 * 560;
  const last = shown[shown.length - 1];
  const crashed = v.cycle ? false : k > 0.62;
  const lastDown = v.cycle && shown.length > 1 && shown[shown.length - 1][1] < shown[shown.length - 2][1];
  return (
    <AbsoluteFill>
      <DarkStage accent={crashed ? "#e74c3c" : "#27ae60"} />
      <AbsoluteFill style={{ background: crashed ? "rgba(60,10,10,0.3)" : "transparent" }} />
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ position: "absolute" }}>
        <rect x={280} y={160} width={1360} height={720} rx={24} fill="#111820" stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
        {Array.from({ length: 6 }).map((_, i) => <path key={i} d={`M330 ${280 + i * 100} L1590 ${280 + i * 100}`} stroke="#1e2a3a" strokeWidth={2} />)}
        <polyline points={shown.map((p) => `${X(p[0])},${Y(p[1])}`).join(" ")} fill="none" stroke={crashed || lastDown ? "#ff4d3d" : "#5fe08a"} strokeWidth={12} strokeLinejoin="round" strokeLinecap="round" />
        {last ? <circle cx={X(last[0])} cy={Y(last[1])} r={16} fill={crashed ? "#ff4d3d" : "#5fe08a"} /> : null}
        <text x={400} y={260} fontFamily={HAND_BOLD} fontWeight={700} fontSize={54} fill="#e8eef5">{v.item ?? "STOCKS"}</text>
        {crashed
          ? Array.from({ length: 14 }).map((_, i) => {
              const q = ((f + i * 9) % 60) / 60;
              return <rect key={i} x={(i * 137) % 1920} y={-60 + q * 1200} width={70} height={90} fill="#f4ecd8" stroke={ink} strokeWidth={3} transform={`rotate(${q * 300 + i * 20} ${(i * 137) % 1920 + 35} ${-15 + q * 1200})`} />;
            })
          : null}
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------- soldiers marching ---------------- */
const SOLDIER = { skin: "#e0b48c", robe: "#5b6b3a", trim: "#3a4a28", hat: "helmet" as const, hatColor: "#4a5a30", belt: "#3a2a1e" };
const March: React.FC<{ v: ActionV }> = ({ v }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const dir = v.reverse ? -1 : 1;
  const x0 = interpolate(f, [0, durationInFrames], dir > 0 ? [-700, 900] : [2600, 1000]);
  return (
    <AbsoluteFill>
      <Background set={v.bg ?? "street"} />
      {Array.from({ length: 6 }).map((_, i) => {
        const x = x0 - i * 230 * dir;
        const step = Math.abs(Math.sin(f / 6 + (i % 2) * 1.5)) * 10;
        return (
          <div key={i} style={{ position: "absolute", left: x, bottom: 70 + (i % 2) * 30, transform: `translate(-50%, ${-step}px)` }}>
            <Character spec={SOLDIER} pose={i === 0 ? "point" : "talk"} height={i % 2 ? 420 : 470} flip={dir < 0} />
          </div>
        );
      })}
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ position: "absolute" }}>
        <g transform={`translate(${x0 + 60 * dir} 420)`} stroke={ink} strokeWidth={6}>
          <path d="M0 0 L0 300" strokeWidth={10} />
          <path d={`M0 0 L${130 * dir} ${20 + Math.sin(f / 5) * 10} L0 70 Z`} fill="#74acdf" />
          <path d={`M0 23 L${130 * dir} ${43 + Math.sin(f / 5) * 10}`} stroke="#fff" strokeWidth={18} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------- loop / cycle ---------------- */
const Loop: React.FC<{ v: ActionV }> = ({ v }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = v.items ?? [];
  const n = Math.max(1, items.length);
  const R = 330;
  const active = Math.floor(f / (fps * 1.4)) % n;
  return (
    <AbsoluteFill>
      <DarkStage accent="#f1c40f" />
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ position: "absolute" }}>
        <g transform={`rotate(${f * 0.3} 960 520)`}>
          <circle cx={960} cy={520} r={R} fill="none" stroke="#fff" strokeWidth={10} strokeDasharray="40 30" />
          {Array.from({ length: n }).map((_, i) => {
            const a = ((i + 0.5) / n) * Math.PI * 2 - Math.PI / 2;
            const x = 960 + Math.cos(a) * R;
            const y = 520 + Math.sin(a) * R;
            return <path key={i} d="M-24 -20 L24 0 L-24 20 Z" fill="#ffd34d" stroke={ink} strokeWidth={5} transform={`translate(${x} ${y}) rotate(${(a * 180) / Math.PI + 90})`} />;
          })}
        </g>
        {items.map((it, i) => {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2;
          const x = 960 + Math.cos(a) * R;
          const y = 520 + Math.sin(a) * R;
          const pop = spring({ frame: f - i * 6, fps, config: { damping: 26, stiffness: 90 } });
          const on = i === active;
          return (
            <g key={i} transform={`translate(${x} ${y}) scale(${pop * (on ? 1.18 : 1)})`}>
              <circle r={110} fill={on ? "rgba(241,196,15,0.18)" : "rgba(255,255,255,0.07)"} stroke={on ? "#f1c40f" : "rgba(255,255,255,0.3)"} strokeWidth={on ? 8 : 4} />
              <Token icon={it.icon} x={0} y={-6} s={1.3} step={f * 0.3} />
            </g>
          );
        })}
      </svg>
      {items.map((it, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        const x = 960 + Math.cos(a) * (R + 10);
        const y = 520 + Math.sin(a) * R + 150;
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)",
            fontFamily: HAND_BOLD, fontWeight: 700, fontSize: 48,
            color: i === active ? "#f1c40f" : "rgba(255,255,255,0.7)",
            textShadow: "0 2px 8px rgba(0,0,0,0.9)",
            whiteSpace: "nowrap",
          }}>
            {it.label}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------------- harvest ---------------- */
const Harvest: React.FC<{ v: ActionV }> = ({ v }) => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const x = interpolate(f, [0, durationInFrames], [-300, 1700]);
  return (
    <AbsoluteFill>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%">
        <rect width={1920} height={1080} fill="#b4d6ef" />
        <ellipse cx={(300 + f) % 2200} cy={140} rx={140} ry={40} fill="#fff" />
        <ellipse cx={(1300 + f * 0.7) % 2200} cy={200} rx={110} ry={34} fill="#fff" />
        <path d="M0 520 Q960 480 1920 520 V1080 H0 Z" fill="#7fb04a" />
        {Array.from({ length: 9 }).map((_, r) => (
          <g key={r}>
            {Array.from({ length: 26 }).map((__, c) => {
              const cx = c * 80 + (r % 2) * 40;
              const cy = 560 + r * 60;
              if (cx < x - 40 && cy > 700) return <rect key={c} x={cx - 18} y={cy - 4} width={36} height={8} fill="#c9b45a" />;
              const sway = Math.sin(f / 12 + c + r) * 3;
              return <path key={c} d={`M${cx} ${cy} q${sway} -26 ${-10 + sway} -40 M${cx} ${cy} q${sway} -24 ${12 + sway} -38`} stroke="#3f7a2a" strokeWidth={6} fill="none" />;
            })}
          </g>
        ))}
        <g transform={`translate(${x} 860)`} stroke={ink} strokeWidth={7} strokeLinejoin="round">
          <rect x={-220} y={-200} width={300} height={160} rx={16} fill="#3f8a3a" />
          <rect x={-60} y={-320} width={150} height={130} rx={12} fill="#3f8a3a" />
          <rect x={-40} y={-300} width={110} height={80} fill="#a9d4ee" />
          <rect x={80} y={-120} width={180} height={70} fill="#e0b84a" />
          {Array.from({ length: 6 }).map((_, i) => <path key={i} d={`M${100 + i * 28} -120 L${100 + i * 28} -50`} />)}
          <path d="M-220 -180 L-320 -260 L-300 -280 L-200 -210" fill="#3f8a3a" />
          <g transform={`translate(-150 -30) rotate(${f * 8})`}>
            <circle r={60} fill="#2b2b33" />
            <path d="M-50 0 L50 0 M0 -50 L0 50" stroke="#9aa0a6" strokeWidth={6} />
          </g>
          <g transform={`translate(30 -20) rotate(${f * 10})`}>
            <circle r={40} fill="#2b2b33" />
          </g>
        </g>
        <g fill="rgba(220,200,150,0.5)">
          {Array.from({ length: 6 }).map((_, i) => <circle key={i} cx={x - 260 - i * 40} cy={820 - ((f + i * 8) % 40) * 3} r={20 + i * 6} />)}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------- ballot ---------------- */
const Ballot: React.FC<{ v: ActionV }> = ({ v }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Soft set={v.bg ?? "plaza"} />
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ position: "absolute" }}>
        <ellipse cx={960} cy={880} rx={330} ry={30} fill="rgba(0,0,0,0.25)" />
        <g stroke={ink} strokeWidth={8} strokeLinejoin="round">
          <path d="M680 560 L1240 560 L1200 880 L720 880 Z" fill="#f4f1ea" />
          <rect x={660} y={520} width={600} height={60} rx={8} fill="#74acdf" />
          <rect x={860} y={538} width={200} height={20} rx={6} fill="#2b2622" />
        </g>
        <text x={960} y={760} textAnchor="middle" fontFamily={HAND_BOLD} fontWeight={700} fontSize={80} fill="#2b2622">{v.item ?? "VOTE"}</text>
        {[0, 1, 2].map((i) => {
          const q = ((f - i * 20) % 60) / 60;
          if (f < i * 20) return null;
          const y = 120 + q * 430;
          return (
            <g key={i} opacity={q > 0.92 ? 0 : 1} transform={`translate(${960 + (i - 1) * 40} ${y}) rotate(${(1 - q) * (i - 1) * 20})`} stroke={ink} strokeWidth={5}>
              <rect x={-80} y={-110} width={160} height={110} fill="#fffbe8" />
              <path d="M-50 -70 l25 25 l50 -50" stroke="#2f7f7a" strokeWidth={10} fill="none" />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------- vault ---------------- */
const Vault: React.FC<{ v: ActionV }> = ({ v }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const open = spring({ frame: f - 14, fps, config: { damping: 28, stiffness: 40 } });
  return (
    <AbsoluteFill>
      <DarkStage accent="#27ae60" />
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ position: "absolute" }}>
        {/* Outer glow ring */}
        <circle cx={960} cy={520} r={380} fill="rgba(39,174,96,0.06)" />
        <circle cx={960} cy={520} r={340} fill="#1e2630" stroke="rgba(255,255,255,0.15)" strokeWidth={10} />
        <circle cx={960} cy={520} r={300} fill="#1e2228" />
        {Array.from({ length: 10 }).map((_, i) => (
          <rect key={i} x={760 + (i % 2) * 24} y={720 - i * 40} width={400} height={40} rx={4} fill={v.item === "pesos" ? "#8fb8d6" : "#7fae7a"} stroke={ink} strokeWidth={4} opacity={open} />
        ))}
        <g transform={`translate(${960 - 300 * open * 1.6} 520) scale(${1 - open * 0.75} 1)`}>
          <circle r={300} fill="#9aa0a6" stroke={ink} strokeWidth={10} />
          <circle r={220} fill="#b7bcc2" stroke={ink} strokeWidth={6} />
          <g transform={`rotate(${f * 4})`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <path key={i} d="M0 0 L0 -150" stroke={ink} strokeWidth={14} strokeLinecap="round" transform={`rotate(${i * 60})`} />
            ))}
            <circle r={40} fill="#e0b84a" stroke={ink} strokeWidth={6} />
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------- mattress ---------------- */
const Mattress: React.FC<{ v: ActionV }> = ({ v }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lift = spring({ frame: f - 16, fps, config: { damping: 28, stiffness: 40 } });
  return (
    <AbsoluteFill>
      <Soft set="home" blur={2} />
      <svg viewBox="0 0 1920 1080" width="100%" height="100%" style={{ position: "absolute" }}>
        <g stroke={ink} strokeWidth={8} strokeLinejoin="round">
          <rect x={460} y={560} width={60} height={340} fill="#8a5a2b" />
          <rect x={1400} y={620} width={60} height={280} fill="#8a5a2b" />
          <rect x={480} y={760} width={960} height={70} fill="#a8743f" />
          {Array.from({ length: 12 }).map((_, i) => (
            <rect key={i} x={540 + (i % 6) * 140} y={720 - Math.floor(i / 6) * 34} width={130} height={36} rx={4} fill="#7fae7a" opacity={lift} />
          ))}
          <g transform={`rotate(${lift * 16} 1440 730)`}>
            <rect x={500} y={690} width={940} height={80} rx={20} fill="#f4f1ea" />
            <path d="M560 730 L1380 730" stroke="#9fc3d9" strokeWidth={10} strokeDasharray="30 20" />
            <rect x={540} y={650} width={200} height={50} rx={20} fill="#fff" />
          </g>
        </g>
      </svg>
      <div style={{ position: "absolute", left: 300, bottom: 40, transform: "translateX(-50%)" }}>
        <Character spec={{ skin: "#e8c4a0", robe: "#7a3b5a", trim: "#e0b84a", hair: "#c9c9c9", bun: true, glasses: true }} pose={lift > 0.5 ? "happy" : "talk"} height={560} />
      </div>
    </AbsoluteFill>
  );
};

const MAP: Record<ActionV["name"], React.FC<{ v: ActionV }>> = {
  train: Train,
  voyage: Voyage,
  moneyrain: MoneyRain,
  press: Press,
  pricetag: PriceTag,
  bars: Bars,
  scales: Scales,
  fence: Fence,
  helicopter: Helicopter,
  chainsaw: Chainsaw,
  crash: Crash,
  march: March,
  loop: Loop,
  harvest: Harvest,
  ballot: Ballot,
  vault: Vault,
  mattress: Mattress,
};

export const ActionScene: React.FC<{ v: ActionV }> = ({ v }) => {
  const C = MAP[v.name];
  return C ? <C v={v} /> : null;
};
