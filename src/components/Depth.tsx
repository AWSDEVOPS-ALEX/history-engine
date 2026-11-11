import React from "react";
import { interpolate } from "remotion";
import type { SetName } from "../schema";

/**
 * Depth backgrounds. Each outdoor set is built from layers — sky, far, mid, near — with a lit sky,
 * a sun, shaded objects, cast shadows and atmospheric haze. The camera drifts sideways and the
 * layers slide at different speeds (parallax), so the flat 2D characters stand in a scene that feels
 * deep, the way Ethos's painted backgrounds do.
 */
const ink = "#2b2622";
const SUN = { x: 1460, y: 230 };

type L = { k: number; node: React.ReactNode }; // k = parallax: 0 still, 1 = moves with the camera
type DepthFC = (f: number) => { sky?: [string, string, string]; layers: L[]; haze?: number; ground?: number; night?: boolean };

/* ---------------- shared shaded pieces ---------------- */

const Sky: React.FC<{ c: [string, string, string]; f: number; night?: boolean }> = ({ c, f, night }) => (
  <>
    <defs>
      <linearGradient id="dsky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={c[0]} />
        <stop offset="62%" stopColor={c[1]} />
        <stop offset="100%" stopColor={c[2]} />
      </linearGradient>
      <radialGradient id="dsun">
        <stop offset="0%" stopColor={night ? "rgba(230,236,255,0.9)" : "rgba(255,248,220,1)"} />
        <stop offset="18%" stopColor={night ? "rgba(200,210,255,0.35)" : "rgba(255,226,160,0.55)"} />
        <stop offset="100%" stopColor="rgba(255,220,150,0)" />
      </radialGradient>
      <linearGradient id="dcloud" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#d9e2ec" />
      </linearGradient>
    </defs>
    <rect width={1920} height={1080} fill="url(#dsky)" />
    <circle cx={SUN.x} cy={SUN.y} r={520} fill="url(#dsun)" />
    <circle cx={SUN.x} cy={SUN.y} r={night ? 46 : 58} fill={night ? "#eef1ff" : "#fff6dc"} />
    {[0, 1, 2, 3].map((i) => {
      const x = ((i * 560 + f * (0.25 + i * 0.08)) % 2500) - 300;
      const y = 120 + (i % 2) * 70;
      return (
        <g key={i} transform={`translate(${x} ${y}) scale(${0.8 + (i % 3) * 0.25})`} opacity={night ? 0.25 : 0.95}>
          <path d="M0 40 q10 -50 70 -40 q30 -50 100 -20 q60 -20 80 30 q40 0 40 30 z" fill="url(#dcloud)" />
          <path d="M0 40 h290 q-20 14 -60 14 h-180 q-40 0 -50 -14 z" fill="#c7d2de" opacity={0.7} />
        </g>
      );
    })}
  </>
);

/** Haze band at the horizon: far things fade into the sky colour. */
const Haze: React.FC<{ y: number; amount?: number; color?: string }> = ({ y, amount = 0.38, color = "#eef5fa" }) => (
  <>
    <defs>
      <linearGradient id={`haze${y}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity={0} />
        <stop offset="70%" stopColor={color} stopOpacity={amount} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
    <rect x={-200} y={y - 220} width={2320} height={300} fill={`url(#haze${y})`} />
  </>
);

const Shadow: React.FC<{ x: number; y: number; w: number }> = ({ x, y, w }) => <ellipse cx={x - w * 0.35} cy={y} rx={w} ry={w * 0.13} fill="rgba(20,30,10,0.22)" />;

export const Tree3D: React.FC<{ x: number; y: number; s?: number; f: number; c?: string }> = ({ x, y, s = 1, f, c = "#5f9a3c" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Shadow x={0} y={0} w={130} />
    <path d="M-14 0 L-9 -100 L9 -100 L14 0 Z" fill="#7a5233" stroke={ink} strokeWidth={4} />
    <path d="M2 0 L4 -100 L9 -100 L14 0 Z" fill="#5e3e26" />
    <g transform={`rotate(${Math.sin(f / 40 + x) * 1.2} 0 -100)`} stroke={ink} strokeWidth={4}>
      <circle cx={-60} cy={-130} r={56} fill={c} />
      <circle cx={60} cy={-135} r={58} fill={c} />
      <circle cx={0} cy={-180} r={78} fill={c} />
    </g>
    <g transform={`rotate(${Math.sin(f / 40 + x) * 1.2} 0 -100)`}>
      <circle cx={-48} cy={-112} r={40} fill="rgba(20,50,10,0.28)" />
      <circle cx={-20} cy={-150} r={46} fill="rgba(20,50,10,0.18)" />
      <circle cx={30} cy={-205} r={34} fill="rgba(255,255,210,0.28)" />
      <circle cx={70} cy={-150} r={26} fill="rgba(255,255,210,0.22)" />
    </g>
  </g>
);

/** A house with two visible faces and a two-plane roof, lit from the right. */
export const House3D: React.FC<{ x: number; y: number; s?: number; f: number; wall?: string; roof?: string; smoke?: boolean }> = ({ x, y, s = 1, f, wall = "#f1e6cf", roof = "#b5532f", smoke = true }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} stroke={ink} strokeWidth={4} strokeLinejoin="round">
    <Shadow x={-40} y={6} w={210} />
    {/* side (in shade) */}
    <path d="M-120 0 L-200 -30 L-200 -150 L-120 -120 Z" fill={wall} />
    <path d="M-120 0 L-200 -30 L-200 -150 L-120 -120 Z" fill="rgba(40,30,20,0.28)" stroke="none" />
    {/* front (lit) */}
    <rect x={-120} y={-120} width={240} height={120} fill={wall} />
    {/* roof planes */}
    <path d="M-120 -120 L0 -215 L-80 -245 L-200 -150 Z" fill={roof} />
    <path d="M-120 -120 L0 -215 L-80 -245 L-200 -150 Z" fill="rgba(30,15,5,0.3)" stroke="none" />
    <path d="M-140 -110 L0 -220 L140 -110 Z" fill={roof} />
    <path d="M0 -220 L140 -110 L100 -110 Z" fill="rgba(255,240,200,0.25)" stroke="none" />
    <rect x={-22} y={-70} width={44} height={70} fill="#6b4a2f" />
    {[-80, 50].map((wx) => (
      <g key={wx}>
        <rect x={wx} y={-95} width={34} height={34} fill="#8fc3e6" />
        <path d={`M${wx + 4} ${-92} l12 0 l-12 14 z`} fill="rgba(255,255,255,0.7)" stroke="none" />
      </g>
    ))}
    <rect x={60} y={-210} width={22} height={50} fill="#c98a4b" />
    {smoke
      ? [0, 1, 2].map((k) => {
          const q = (f / 50 + k / 3) % 1;
          return <circle key={k} cx={71 + Math.sin(q * 6) * 10 - q * 30} cy={-215 - q * 120} r={8 + q * 20} fill="rgba(240,240,240,0.5)" opacity={1 - q} stroke="none" />;
        })
      : null}
  </g>
);

const Windpump: React.FC<{ x: number; y: number; f: number; s?: number }> = ({ x, y, f, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} stroke={ink} strokeWidth={4}>
    <Shadow x={0} y={0} w={70} />
    <path d="M-36 0 L-5 -280 L5 -280 L36 0 M-27 -80 L27 -80 M-18 -170 L18 -170" fill="none" />
    <g transform={`translate(0 -290) rotate(${f * 1.4})`}>
      {Array.from({ length: 12 }).map((_, i) => (
        <path key={i} d="M0 0 L-10 -72 L10 -72 Z" fill={i % 2 ? "#e6e6e6" : "#c4c9cf"} transform={`rotate(${i * 30})`} />
      ))}
      <circle r={12} fill="#9aa0a6" />
    </g>
  </g>
);

const Cow: React.FC<{ x: number; y: number; s?: number; f: number; c?: string }> = ({ x, y, s = 1, f, c = "#5a3d2b" }) => (
  <g transform={`translate(${x + Math.sin(f / 80 + x) * 6} ${y}) scale(${s})`} stroke={ink} strokeWidth={4}>
    <Shadow x={0} y={64} w={80} />
    <path d="M-40 30 L-40 64 M40 30 L40 64 M-18 30 L-18 64 M18 30 L18 64" />
    <ellipse cx={0} cy={0} rx={68} ry={38} fill={c} />
    <ellipse cx={8} cy={12} rx={50} ry={20} fill="rgba(0,0,0,0.15)" stroke="none" />
    <circle cx={-68} cy={-8 + Math.sin(f / 18 + x) * 5} r={22} fill={c} />
  </g>
);

const GroundGrad: React.FC<{ id: string; far: string; near: string }> = ({ id, far, near }) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={far} />
      <stop offset="100%" stopColor={near} />
    </linearGradient>
  </defs>
);

const GrassTufts: React.FC<{ y0: number; f: number; n?: number }> = ({ y0, f, n = 50 }) => (
  <g stroke="#4f7f2e" strokeWidth={4} strokeLinecap="round" fill="none">
    {Array.from({ length: n }).map((_, i) => {
      const x = (i * 331) % 2100 - 90;
      const y = y0 + ((i * 197) % (1080 - y0));
      const k = 0.6 + (y - y0) / 500;
      const sway = Math.sin(f / 24 + i) * 3;
      return <path key={i} d={`M${x} ${y} q${(-4 + sway) * k} ${-20 * k} ${(-8 + sway) * k} ${-32 * k} M${x + 8 * k} ${y} q${(2 + sway) * k} ${-24 * k} ${(6 + sway) * k} ${-36 * k} M${x + 16 * k} ${y} q${(6 + sway) * k} ${-18 * k} ${(12 + sway) * k} ${-28 * k}`} />;
    })}
  </g>
);

const Fence3D: React.FC<{ y: number; x0: number; x1: number }> = ({ y, x0, x1 }) => (
  <g stroke={ink} strokeWidth={4}>
    <path d={`M${x0} ${y - 30} L${x1} ${y - 30} M${x0} ${y - 62} L${x1} ${y - 62}`} stroke="#8a5a2b" strokeWidth={8} />
    {Array.from({ length: Math.ceil((x1 - x0) / 130) + 1 }).map((_, i) => (
      <g key={i}>
        <rect x={x0 + i * 130 - 8} y={y - 84} width={16} height={84} fill="#a8743f" />
        <rect x={x0 + i * 130 - 8} y={y - 84} width={6} height={84} fill="rgba(0,0,0,0.25)" stroke="none" />
      </g>
    ))}
  </g>
);

/** A city block face with a visible side wall that turns towards the vanishing point. */
const Building3D: React.FC<{ x: number; w: number; h: number; base: number; c: string; vx?: number; floors?: number }> = ({ x, w, h, base, c, vx = 960, floors = 3 }) => {
  const sideW = Math.max(-90, Math.min(90, (vx - (x + w / 2)) * 0.12));
  const sx = sideW > 0 ? x + w : x;
  return (
    <g stroke={ink} strokeWidth={4} strokeLinejoin="round">
      <path d={`M${sx} ${base} L${sx + sideW} ${base - 14} L${sx + sideW} ${base - h + 10} L${sx} ${base - h} Z`} fill={c} />
      <path d={`M${sx} ${base} L${sx + sideW} ${base - 14} L${sx + sideW} ${base - h + 10} L${sx} ${base - h} Z`} fill="rgba(30,25,40,0.3)" stroke="none" />
      <rect x={x} y={base - h} width={w} height={h} fill={c} />
      <rect x={x - 6} y={base - h - 14} width={w + 12} height={18} fill="#e9e1cf" />
      {Array.from({ length: floors }).map((_, r) =>
        Array.from({ length: Math.max(1, Math.floor(w / 110)) }).map((__, k) => {
          const wx = x + 30 + k * ((w - 60) / Math.max(1, Math.floor(w / 110)));
          const wy = base - h + 40 + r * ((h - 80) / floors);
          return (
            <g key={`${r}${k}`}>
              <rect x={wx} y={wy} width={52} height={78} rx={24} fill="#5c7894" />
              <path d={`M${wx + 6} ${wy + 30} l14 -16 l0 30 z`} fill="rgba(255,255,255,0.4)" stroke="none" />
              <path d={`M${wx - 8} ${wy + 84} L${wx + 60} ${wy + 84}`} strokeWidth={6} />
            </g>
          );
        }),
      )}
      {/* light from the right, shade on the left of each face */}
      <rect x={x} y={base - h} width={w * 0.35} height={h} fill="rgba(40,30,50,0.1)" stroke="none" />
    </g>
  );
};

/* ---------------- the sets ---------------- */

const pampas: DepthFC = (f) => ({
  sky: ["#3f93ea", "#b8dcf6", "#f6e7c8"],
  haze: 560,
  layers: [
    { k: 0.12, node: <path d="M-200 560 Q400 520 960 548 T2120 540 V700 H-200 Z" fill="#b8ce8a" /> },
    { k: 0.12, node: <><House3D x={520} y={566} s={0.32} f={f} /><Windpump x={640} y={570} f={f} s={0.35} /><Tree3D x={300} y={562} s={0.3} f={f} /></> },
    { k: 0.4, node: <><GroundGrad id="pg" far="#a9c76c" near="#6f9e3c" /><path d="M-300 600 Q700 580 2200 620 V1100 H-300 Z" fill="url(#pg)" /><Tree3D x={1520} y={650} s={1.1} f={f} c="#4f8a33" /><Cow x={980} y={690} s={0.5} f={f} c="#f1e6cf" /><Cow x={1120} y={705} s={0.55} f={f} /></> },
    { k: 1, node: <><Cow x={420} y={800} s={0.9} f={f} /><Fence3D y={1010} x0={-200} x1={760} /><GrassTufts y0={760} f={f} /></> },
  ],
});

const estancia: DepthFC = (f) => ({
  sky: ["#3f93ea", "#bfdff6", "#f8e6c4"],
  haze: 600,
  layers: [
    { k: 0.1, node: <path d="M-200 600 Q300 470 700 560 T1500 520 T2200 560 V700 H-200 Z" fill="#9db7c9" /> },
    { k: 0.25, node: <path d="M-200 620 Q500 560 1000 600 T2200 590 V760 H-200 Z" fill="#a9c97c" /> },
    { k: 0.5, node: <><GroundGrad id="eg" far="#9fc368" near="#6a9a3a" /><path d="M-300 640 Q900 610 2200 650 V1100 H-300 Z" fill="url(#eg)" /><path d="M800 1100 Q900 840 1080 660" stroke="#d6b47e" strokeWidth={120} fill="none" /><Tree3D x={250} y={690} s={1.05} f={f} /><House3D x={1180} y={680} s={1.05} f={f} wall="#f4ead2" roof="#a8452a" /><Tree3D x={1620} y={680} s={1.15} f={f} c="#4f8a33" /><Windpump x={560} y={720} f={f} s={0.7} /></> },
    { k: 1, node: <><Fence3D y={900} x0={-200} x1={560} /><Fence3D y={920} x0={1320} x1={2140} /><GrassTufts y0={780} f={f} n={40} /></> },
  ],
});

const countryside: DepthFC = (f) => ({
  sky: ["#3f93ea", "#bfdef6", "#f3e4c6"],
  haze: 520,
  layers: [
    { k: 0.06, node: <><path d="M-200 540 L250 340 L520 470 L860 300 L1220 470 L1560 360 L2200 540 Z" fill="#a8bccd" /><path d="M250 340 L320 380 L280 400 L330 430 M860 300 L930 350 L890 370 M1560 360 L1620 400" stroke="#f4f7fa" strokeWidth={14} fill="none" strokeLinecap="round" /></> },
    { k: 0.2, node: <path d="M-200 560 Q300 470 700 540 T1500 500 T2200 540 V720 H-200 Z" fill="#a4c47a" /> },
    { k: 0.45, node: <><GroundGrad id="cg" far="#9cc066" near="#6a9a3a" /><path d="M-300 600 Q800 560 2200 610 V1100 H-300 Z" fill="url(#cg)" /><path d="M-200 900 Q500 760 900 820 T2200 740" stroke="#4f97cf" strokeWidth={80} fill="none" /><path d={`M${-200 + ((f * 0.6) % 80)} 900 Q500 760 900 820 T2200 740`} stroke="rgba(255,255,255,0.45)" strokeWidth={5} strokeDasharray="30 50" fill="none" /><House3D x={420} y={660} s={0.65} f={f} /><House3D x={1400} y={620} s={0.55} f={f + 20} wall="#efe0c4" roof="#8a5a2b" />{[160, 250, 1580, 1680, 1780].map((x, i) => <Tree3D key={x} x={x} y={650 + (i % 2) * 20} s={0.62} f={f} c={i % 2 ? "#4f8a33" : "#5f9a3c"} />)}</> },
    { k: 1, node: <GrassTufts y0={800} f={f} n={36} /> },
  ],
});

const fields: DepthFC = (f) => ({
  sky: ["#3f93ea", "#bfdef6", "#f6e6c4"],
  haze: 600,
  layers: [
    { k: 0.15, node: <><path d="M-200 600 Q400 540 960 580 T2200 560 V700 H-200 Z" fill="#b6cf8a" /><House3D x={1460} y={600} s={0.55} f={f} /><Tree3D x={1660} y={604} s={0.55} f={f} /><Tree3D x={1250} y={606} s={0.45} f={f} c="#4f8a33" /><Windpump x={300} y={620} f={f} s={0.55} /></> },
    {
      k: 0.6,
      node: (
        <>
          <GroundGrad id="fg" far="#d8c46e" near="#b48f36" />
          <path d="M-300 640 L2220 640 V1100 H-300 Z" fill="url(#fg)" />
          {Array.from({ length: 18 }).map((_, i) => (
            <path key={i} d={`M960 640 L${-700 + i * 190} 1100`} stroke="rgba(120,90,20,0.35)" strokeWidth={9} />
          ))}
          {Array.from({ length: 36 }).map((_, i) => {
            const x = (i * 263) % 2100 - 90;
            const y = 680 + ((i * 131) % 380);
            const k = 0.5 + (y - 640) / 480;
            return <path key={i} d={`M${x} ${y} l${Math.sin(f / 26 + i) * 3} ${-42 * k} M${x - 8 * k} ${y - 32 * k} l${8 * k} ${-14 * k} l${8 * k} ${14 * k}`} stroke="#8a6a1e" strokeWidth={4} fill="none" />;
          })}
        </>
      ),
    },
    { k: 1, node: <Fence3D y={720} x0={-200} x1={620} /> },
  ],
});

const street: DepthFC = (f) => ({
  sky: ["#4a9cec", "#c8e3f6", "#f4e6cc"],
  haze: 300,
  layers: [
    { k: 0.08, node: <>{[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={i * 330 - 60} y={300 - (i % 3) * 40} width={260} height={300} fill="#b9c4cc" />)}</> },
    {
      k: 0.45,
      node: (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <Building3D key={i} x={i * 420 - 80} w={380} h={560 + (i % 2) * 40} base={770} c={["#e8d9bd", "#d9c3a0", "#efe2c8", "#d6c6b0", "#e4cfae"][i]} />
          ))}
        </>
      ),
    },
    {
      k: 1,
      node: (
        <>
          <GroundGrad id="sg" far="#9c9893" near="#7d7975" />
          <rect x={-300} y={770} width={2520} height={330} fill="url(#sg)" />
          <path d="M-300 770 L2220 770" stroke={ink} strokeWidth={5} />
          {Array.from({ length: 14 }).map((_, i) => <path key={i} d={`M960 770 L${-1100 + i * 300} 1100`} stroke="rgba(0,0,0,0.08)" strokeWidth={4} />)}
          {[0, 1, 2, 3].map((i) => <path key={i} d={`M-300 ${820 + i * 70} L2220 ${820 + i * 70}`} stroke="rgba(0,0,0,0.06)" strokeWidth={3} />)}
          {[160, 960, 1760].map((x) => (
            <g key={x} stroke={ink} strokeWidth={5}>
              <ellipse cx={x - 50} cy={772} rx={70} ry={8} fill="rgba(0,0,0,0.2)" stroke="none" />
              <path d={`M${x} 770 L${x} 460`} />
              <rect x={x - 22} y={420} width={44} height={46} rx={8} fill="#ffe28a" />
              <circle cx={x} cy={443} r={60} fill="rgba(255,230,150,0.25)" stroke="none" />
            </g>
          ))}
        </>
      ),
    },
  ],
});

const plaza: DepthFC = (f) => ({
  sky: ["#4a9cec", "#c8e3f6", "#f4e6cc"],
  haze: 260,
  layers: [
    {
      k: 0.35,
      node: (
        <g stroke={ink} strokeWidth={5} strokeLinejoin="round">
          <path d="M1560 680 L1640 660 L1640 290 L1560 260 Z" fill="#cf8f8b" />
          <rect x={360} y={260} width={1200} height={420} fill="#e7a3a0" />
          <rect x={360} y={260} width={420} height={420} fill="rgba(80,30,30,0.08)" stroke="none" />
          <rect x={760} y={170} width={400} height={510} fill="#e9aaa6" />
          <path d="M740 180 L960 90 L1180 180 Z" fill="#d48c88" />
          <path d="M960 90 L1180 180 L1100 180 Z" fill="rgba(255,240,220,0.3)" stroke="none" />
          <rect x={890} y={520} width={140} height={160} rx={60} fill="#7a4a3a" />
          {Array.from({ length: 8 }).map((_, i) => (
            <g key={i}>
              <rect x={400 + i * 145} y={320} width={60} height={110} rx={28} fill="#f6e1c8" />
              <rect x={400 + i * 145} y={340} width={60} height={20} fill="rgba(0,0,0,0.08)" stroke="none" />
            </g>
          ))}
          <path d="M360 260 L1560 260" strokeWidth={14} />
        </g>
      ),
    },
    {
      k: 1,
      node: (
        <>
          <GroundGrad id="plg" far="#e3d6b8" near="#c8b68e" />
          <rect x={-300} y={680} width={2520} height={420} fill="url(#plg)" />
          {Array.from({ length: 12 }).map((_, i) => <path key={i} d={`M${-400 + i * 240} 1100 L960 680`} stroke="rgba(120,100,60,0.25)" strokeWidth={4} />)}
          <ellipse cx={1180} cy={700} rx={700} ry={26} fill="rgba(60,30,20,0.12)" />
          <g stroke={ink} strokeWidth={5}>
            <ellipse cx={150} cy={762} rx={70} ry={10} fill="rgba(0,0,0,0.18)" stroke="none" />
            <rect x={180} y={520} width={60} height={240} fill="#f4f1ea" />
            <rect x={180} y={520} width={22} height={240} fill="rgba(0,0,0,0.12)" stroke="none" />
            <path d="M170 520 L210 440 L250 520 Z" fill="#f4f1ea" />
          </g>
          {[90, 1700, 1840].map((x, i) => (
            <g key={x} stroke={ink} strokeWidth={5}>
              <ellipse cx={x - 40} cy={762} rx={80} ry={10} fill="rgba(0,0,0,0.18)" stroke="none" />
              <path d={`M${x} 760 Q${x + 10} 600 ${x} 460`} strokeWidth={14} stroke="#7a5233" fill="none" />
              {[-60, -20, 20, 60].map((a) => <path key={a} d={`M${x} 460 q${a} ${-30 + Math.sin(f / 30 + i) * 4} ${a * 2} 30`} stroke="#4f8a33" strokeWidth={14} fill="none" strokeLinecap="round" />)}
            </g>
          ))}
        </>
      ),
    },
  ],
});

const skyline: DepthFC = (f) => ({
  sky: ["#4597e6", "#c4e0f5", "#f1e3cc"],
  haze: 520,
  layers: [
    { k: 0.08, node: <>{Array.from({ length: 14 }).map((_, i) => <rect key={i} x={i * 150 - 60} y={700 - 200 - ((i * 97) % 220)} width={120} height={200 + ((i * 97) % 220)} fill="#aebccb" />)}</> },
    {
      k: 0.35,
      node: (
        <>
          {Array.from({ length: 9 }).map((_, i) => {
            const h = 300 + ((i * 137) % 260);
            const x = i * 230 - 80;
            return (
              <g key={i} stroke={ink} strokeWidth={4}>
                <rect x={x} y={700 - h} width={180} height={h} fill={["#c9d4dd", "#b7c3cc", "#d9cfc0", "#aebfcc"][i % 4]} />
                <rect x={x} y={700 - h} width={60} height={h} fill="rgba(40,50,70,0.15)" stroke="none" />
                {Array.from({ length: Math.floor(h / 60) }).map((_, r) => <path key={r} d={`M${x + 20} ${720 - h + r * 60} L${x + 160} ${720 - h + r * 60}`} stroke="#8aa4ba" strokeWidth={10} />)}
              </g>
            );
          })}
          <g stroke={ink} strokeWidth={5}>
            <path d="M930 700 L945 250 L960 220 L975 250 L990 700 Z" fill="#f4f1ea" />
            <path d="M960 220 L975 250 L990 700 L960 700 Z" fill="rgba(0,0,0,0.1)" stroke="none" />
          </g>
        </>
      ),
    },
    {
      k: 1,
      node: (
        <>
          <GroundGrad id="kg" far="#8c8985" near="#6e6b68" />
          <rect x={-300} y={700} width={2520} height={400} fill="url(#kg)" />
          {Array.from({ length: 8 }).map((_, i) => <rect key={i} x={((i * 260 + f * 3) % 2400) - 240} y={880} width={120} height={14} fill="#f4f1ea" />)}
          {[0, 1, 2].map((i) => {
            const x = ((f * (3 + i) + i * 700) % 2600) - 340;
            return (
              <g key={i} transform={`translate(${x} ${800 + i * 70})`} stroke={ink} strokeWidth={4}>
                <ellipse cx={-30} cy={16} rx={110} ry={12} fill="rgba(0,0,0,0.25)" stroke="none" />
                <rect x={-90} y={-50} width={180} height={50} rx={10} fill={["#e0a526", "#b23a2a", "#4f6d8f"][i]} />
                <rect x={-60} y={-80} width={110} height={34} rx={8} fill={["#e0a526", "#b23a2a", "#4f6d8f"][i]} />
                <rect x={-50} y={-74} width={40} height={22} fill="#bfe0f4" />
                <circle cx={-50} cy={4} r={16} fill="#2b2622" />
                <circle cx={50} cy={4} r={16} fill="#2b2622" />
              </g>
            );
          })}
        </>
      ),
    },
  ],
});

const village: DepthFC = (f) => ({
  sky: ["#3f93ea", "#bfdef6", "#f6e4c2"],
  haze: 560,
  layers: [
    { k: 0.15, node: <path d="M-200 600 Q480 520 960 580 T2200 560 V720 H-200 Z" fill="#a9c97c" /> },
    { k: 0.5, node: <><GroundGrad id="vg" far="#9cc066" near="#6a9a3a" /><path d="M-300 620 Q900 600 2200 640 V1100 H-300 Z" fill="url(#vg)" /><path d="M760 1100 Q900 820 980 640" stroke="#c9a46a" strokeWidth={90} fill="none" />{[[260, 640], [620, 660], [1300, 650], [1620, 640]].map(([x, y], i) => <House3D key={i} x={x} y={y} s={0.7} f={f + i * 20} wall="#e8c9a0" roof="#d9b56a" />)}</> },
    { k: 1, node: <GrassTufts y0={760} f={f} n={36} /> },
  ],
});


const port: DepthFC = (f) => ({
  sky: ["#4a9cec", "#c8e3f6", "#f4e6cc"],
  haze: 520,
  layers: [
    { k: 0.08, node: <path d="M-200 520 Q600 505 1300 515 T2200 512 V540 H-200 Z" fill="#9fb2c2" /> },
    {
      k: 0.3,
      node: (
        <>
          <defs>
            <linearGradient id="dsea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5b8fbf" />
              <stop offset="100%" stopColor="#2c5f92" />
            </linearGradient>
          </defs>
          <rect x={-300} y={520} width={2520} height={260} fill="url(#dsea)" />
          {Array.from({ length: 4 }).map((_, r) => (
            <path key={r} d={Array.from({ length: 12 }).map((__, c) => `M${((c * 220 + f * (0.5 + r * 0.2)) % 2500) - 300} ${560 + r * 50} q40 -14 80 0`).join(" ")} stroke="rgba(255,255,255,0.4)" strokeWidth={4} fill="none" />
          ))}
          <ellipse cx={1050} cy={650} rx={480} ry={22} fill="rgba(10,30,60,0.35)" />
          <ShipMid f={f} />
        </>
      ),
    },
    {
      k: 1,
      node: (
        <>
          <GroundGrad id="dock" far="#a98660" near="#7d5c3c" />
          <path d="M-300 760 L2220 760 L2220 1100 L-300 1100 Z" fill="url(#dock)" />
          {Array.from({ length: 20 }).map((_, i) => <path key={i} d={`M${-300 + i * 140} 760 L${-700 + i * 190} 1100`} stroke="rgba(60,40,20,0.35)" strokeWidth={4} />)}
          <path d="M-300 760 L2220 760" stroke={ink} strokeWidth={6} />
          <g stroke={ink} strokeWidth={7} fill="none">
            <path d="M240 790 L240 250 L540 250 M240 330 L320 250" />
            <path d={`M500 250 L500 ${420 + Math.sin(f / 40) * 30}`} strokeWidth={4} />
          </g>
          <rect x={450} y={420 + Math.sin(f / 40) * 30} width={100} height={70} fill="#c98a4b" stroke={ink} strokeWidth={5} />
          {[[70, 700], [150, 700], [110, 630], [1700, 705], [1780, 705]].map(([x, y], i) => (
            <g key={i} stroke={ink} strokeWidth={5}>
              <ellipse cx={x + 10} cy={y + 82} rx={60} ry={8} fill="rgba(0,0,0,0.25)" stroke="none" />
              <rect x={x} y={y} width={80} height={80} fill="#c98a4b" />
              <path d={`M${x} ${y} l18 -14 l80 0 l-18 14 z`} fill="#dba465" />
              <path d={`M${x + 80} ${y} l18 -14 l0 80 l-18 14 z`} fill="#9a6532" />
            </g>
          ))}
        </>
      ),
    },
  ],
});

/** Mid-distance steamship for the port. */
const ShipMid: React.FC<{ f: number }> = ({ f }) => (
  <g transform={`translate(1050 ${600 + Math.sin(f / 20) * 4}) scale(0.95)`} stroke={ink} strokeWidth={6} strokeLinejoin="round">
    {[-70, 90].map((sx, k) =>
      Array.from({ length: 7 }).map((_, j) => {
        const q = (f / 90 + j / 7 + k * 0.3) % 1;
        return <circle key={`${k}${j}`} cx={sx + q * 160} cy={-230 - q * 330} r={16 + q * 60} fill="#3a3535" opacity={0.75 * (1 - q * 0.8)} stroke="none" />;
      }),
    )}
    <path d="M-420 -40 L420 -40 L360 90 L-380 90 Z" fill="#26232a" />
    <path d="M-420 -40 L420 -40 L414 -10 L-414 -10 Z" fill="#b23a2a" />
    {Array.from({ length: 12 }).map((_, i) => <circle key={i} cx={-330 + i * 58} cy={30} r={9} fill="#f2d27a" strokeWidth={3} />)}
    <rect x={-300} y={-110} width={560} height={70} fill="#efe2bf" />
    <rect x={-300} y={-110} width={560} height={22} fill="rgba(0,0,0,0.12)" stroke="none" />
    {[-100, 60].map((x) => (
      <g key={x}>
        <rect x={x} y={-230} width={60} height={120} fill="#b23a2a" />
        <rect x={x} y={-230} width={22} height={120} fill="rgba(0,0,0,0.2)" stroke="none" />
        <rect x={x} y={-230} width={60} height={22} fill="#26232a" />
      </g>
    ))}
    <path d="M-330 -110 L-330 -330 M290 -110 L290 -330 M-330 -330 L290 -330" fill="none" strokeWidth={5} />
  </g>
);

const battlefield: DepthFC = (f) => ({
  sky: ["#8a9bb0", "#d4c9b6", "#e8d2ae"],
  haze: 560,
  layers: [
    { k: 0.1, node: <path d="M-200 560 Q400 480 900 540 T2200 520 V700 H-200 Z" fill="#a7a58a" /> },
    {
      k: 0.45,
      node: (
        <>
          <GroundGrad id="bg" far="#b7a77c" near="#8a7a52" />
          <path d="M-300 600 Q900 570 2200 610 V1100 H-300 Z" fill="url(#bg)" />
          {[300, 1300, 1700].map((x, i) =>
            Array.from({ length: 6 }).map((_, j) => {
              const q = (f / 80 + j / 6 + i * 0.2) % 1;
              return <circle key={`${i}${j}`} cx={x + q * 120} cy={620 - q * 360} r={20 + q * 70} fill="#6f6a66" opacity={0.5 * (1 - q)} />;
            }),
          )}
          <g stroke={ink} strokeWidth={5}>
            <path d="M100 720 L100 560" />
            <path d={`M100 560 L${200} ${575 + Math.sin(f / 10) * 8} L100 610 Z`} fill="#b23a2a" />
          </g>
        </>
      ),
    },
    { k: 1, node: <GrassTufts y0={800} f={f} n={30} /> },
  ],
});

const DEPTH: Partial<Record<SetName, DepthFC>> = { pampas, estancia, countryside, fields, street, plaza, skyline, village, port, battlefield };
export const hasDepth = (s: SetName) => !!DEPTH[s];

export const DepthScene: React.FC<{ set: SetName; f: number; dur: number }> = ({ set, f, dur }) => {
  const def = DEPTH[set]!(f);
  const t = interpolate(f, [0, Math.max(1, dur)], [-1, 1]);
  const pan = t * 70; // the near layer slides 140 px over the shot; far layers much less
  return (
    <>
      <Sky c={def.sky ?? ["#3f93ea", "#bfdef6", "#f6e6c4"]} f={f} night={def.night} />
      {def.layers.map((l, i) => (
        <React.Fragment key={i}>
          <g transform={`translate(${-pan * l.k} ${Math.abs(t) * -6 * l.k})`}>{l.node}</g>
          {i === 0 && def.haze ? <Haze y={def.haze} /> : null}
        </React.Fragment>
      ))}
      {/* sunlight wash from the upper right, and soft vignette */}
      <defs>
        <radialGradient id="dlight" cx="76%" cy="20%" r="85%">
          <stop offset="0%" stopColor="rgba(255,236,190,0.22)" />
          <stop offset="60%" stopColor="rgba(255,236,190,0)" />
          <stop offset="100%" stopColor="rgba(20,20,40,0.04)" />
        </radialGradient>
      </defs>
      <rect width={1920} height={1080} fill="url(#dlight)" />
    </>
  );
};

/** Indoor rooms: a warm light from the window side, darker corners and floor, for depth. */
export const RoomLight: React.FC = () => (
  <>
    <defs>
      <radialGradient id="roomlight" cx="70%" cy="25%" r="90%">
        <stop offset="0%" stopColor="rgba(255,236,190,0.22)" />
        <stop offset="55%" stopColor="rgba(255,236,190,0)" />
        <stop offset="100%" stopColor="rgba(25,15,10,0.14)" />
      </radialGradient>
      <linearGradient id="roomfloor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(0,0,0,0)" />
        <stop offset="70%" stopColor="rgba(0,0,0,0)" />
        <stop offset="100%" stopColor="rgba(20,10,5,0.12)" />
      </linearGradient>
    </defs>
    <rect width={1920} height={1080} fill="url(#roomlight)" />
    <rect width={1920} height={1080} fill="url(#roomfloor)" />
  </>
);
