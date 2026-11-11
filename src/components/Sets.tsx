import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { SetName } from "../schema";
import { DepthScene, RoomLight, hasDepth } from "./Depth";

/**
 * Backgrounds, all drawn in code. Each set has a slow push-in and its own idle motion
 * (drifting clouds, smoke, waves, flags) so nothing sits dead still.
 */
export const Background: React.FC<{ set: SetName }> = ({ set }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const zoom = interpolate(frame, [0, durationInFrames], [1.02, 1.09]);
  const pan = interpolate(frame, [0, durationInFrames], [-14, 14]);
  const Comp = SETS[set];
  const outdoor = OUTDOOR.includes(set);
  if (hasDepth(set)) {
    // layered scene: the parallax inside does the camera work; only a gentle push-in here
    const z = interpolate(frame, [0, durationInFrames], [1.0, 1.04]);
    return (
      <AbsoluteFill style={{ transform: `scale(${z})` }}>
        <svg viewBox="0 0 1920 1080" width="100%" height="100%">
          <DepthScene set={set} f={frame} dur={durationInFrames} />
          <Birds f={frame} />
        </svg>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ transform: `scale(${zoom}) translateX(${pan}px)` }}>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%">
        <Comp f={frame} />
        {outdoor ? <Birds f={frame} night={set === "night-city"} /> : <><Dust f={frame} /><RoomLight /></>}
      </svg>
    </AbsoluteFill>
  );
};

const OUTDOOR: SetName[] = ["pampas", "estancia", "countryside", "plaza", "skyline", "port", "street", "sky", "fields", "desert", "night-city", "village", "sea", "battlefield", "market"];

/** A few birds crossing the sky (bats at night), flapping. */
const Birds: React.FC<{ f: number; night?: boolean }> = ({ f, night }) => (
  <g stroke={night ? "#0e0c14" : "#2b2622"} strokeWidth={5} fill="none" strokeLinecap="round">
    {[0, 1, 2, 3].map((i) => {
      const x = ((f * (2.2 + i * 0.4) + i * 520) % 2300) - 200;
      const y = 120 + i * 45 + Math.sin((f + i * 30) / 18) * 12;
      const flap = Math.sin(f / 3 + i) * 12;
      const s = 0.7 + (i % 2) * 0.35;
      return <path key={i} transform={`translate(${x} ${y}) scale(${s})`} d={`M-22 ${flap} Q-11 -8 0 0 Q11 -8 22 ${flap}`} />;
    })}
  </g>
);

/** Indoor air: a soft shaft of light and dust motes drifting through it. */
const Dust: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <path d="M1180 0 L1520 0 L1060 1080 L620 1080 Z" fill="rgba(255,240,200,0.10)" />
    {Array.from({ length: 22 }).map((_, i) => {
      const x = 760 + ((i * 173) % 640) + Math.sin((f + i * 50) / 40) * 40;
      const y = (i * 97 + f * (0.4 + (i % 3) * 0.2)) % 1080;
      return <circle key={i} cx={x - y * 0.35} cy={y} r={2 + (i % 3)} fill="#fff6dc" opacity={0.35} />;
    })}
  </g>
);

type SetFC = React.FC<{ f: number }>;

const ink = "#2b2622";

const Clouds: React.FC<{ y?: number; f?: number }> = ({ y = 90, f = 0 }) => (
  <g fill="#ffffff" stroke="#c9d3dc" strokeWidth={4}>
    {[160, 620, 1150, 1650].map((x, i) => (
      <path key={x} d={`M${((x + f * (0.4 + i * 0.12)) % 2200) - 140} ${y + (i % 2) * 40} q40 -60 100 -20 q50 -50 110 0 q60 0 50 40 h-260 q-30 -10 0 -20z`} />
    ))}
  </g>
);

const Sky: SetFC = ({ f }) => (
  <>
    <rect width={1920} height={1080} fill="#bcd6ea" />
    <Clouds f={f} />
  </>
);

const Fields: SetFC = ({ f }) => (
  <>
    <rect width={1920} height={1080} fill="#bcd6ea" />
    <Clouds f={f} />
    <Hills y={560} c1="#b9d68a" c2="#a6c972" />
    <Farmhouse x={1460} y={560} s={0.7} f={f} />
    <Tree x={1680} y={570} s={0.75} f={f} />
    <Tree x={1250} y={575} s={0.6} f={f} c="#4f8a33" />
    <Windmill x={300} y={600} f={f} s={0.65} />
    <path d="M0 640 L1920 640 V1080 H0 Z" fill="#c9b45a" />
    {Array.from({ length: 16 }).map((_, i) => (
      <path key={i} d={`M960 640 L${-500 + i * 190} 1080`} stroke="#b39a42" strokeWidth={10} />
    ))}
    {Array.from({ length: 30 }).map((_, i) => {
      const x = (i * 263) % 1920;
      const y = 680 + ((i * 131) % 380);
      const k = 0.5 + (y - 640) / 500;
      return <path key={i} d={`M${x} ${y} l${Math.sin(f / 15 + i) * 3} ${-40 * k} M${x - 8 * k} ${y - 30 * k} l${8 * k} ${-14 * k} l${8 * k} ${14 * k}`} stroke="#9a7a2a" strokeWidth={4} fill="none" />;
    })}
    <Fence y={700} x0={-20} x1={600} />
  </>
);
const Desert: SetFC = ({ f }) => (
  <>
    <rect width={1920} height={1080} fill="#f3cf8f" />
    <circle cx={1500} cy={220} r={90} fill="#fff1b8" />
    <path d="M0 640 Q400 520 800 620 T1920 600 V1080 H0 Z" fill="#e2ae62" stroke={ink} strokeWidth={5} />
    <path d="M0 820 Q500 700 1100 800 T1920 780 V1080 H0 Z" fill="#d49a4c" stroke={ink} strokeWidth={5} />
    {/* mud-brick mosque in the Sahel style */}
    <g transform="translate(260,360)" stroke={ink} strokeWidth={5} fill="#c98a4b">
      <rect x={0} y={120} width={420} height={180} />
      <rect x={160} y={0} width={100} height={300} />
      {[30, 90, 300, 360].map((x) => (
        <rect key={x} x={x} y={80} width={34} height={60} />
      ))}
      {[180, 210, 240].map((x) => (
        <path key={x} d={`M${x} 40 l40 0`} stroke="#6b4423" strokeWidth={6} />
      ))}
      <rect x={185} y={220} width={50} height={80} fill="#5a3d2b" />
    </g>
  </>
);

const Palace: SetFC = ({ f }) => (
  <>
    {/* Grand colonial hall — deep teal walls, marble columns, gilt ceiling */}
    <rect width={1920} height={1080} fill="#0e1a1a" />
    {/* ceiling coffering — deep recessed panels */}
    {Array.from({ length: 5 }).map((_, r) =>
      Array.from({ length: 8 }).map((__, c) => (
        <rect key={`cof${r}-${c}`} x={c * 240 + 20} y={r * 60 + 10} width={220} height={52}
          fill="#0a1414" stroke="#1a2e2e" strokeWidth={2} />
      ))
    )}
    {/* gilt ceiling band */}
    <rect y={0} width={1920} height={16} fill="#c4932a" />
    <rect y={300} width={1920} height={8} fill="#1e3030" />
    {/* tall arched windows — letting in cool blue-grey daylight */}
    {[320, 760, 1200, 1660].map((x, i) => (
      <g key={`win${i}`}>
        <path d={`M${x - 90} 20 Q${x - 90} -20 ${x} -24 Q${x + 90} -20 ${x + 90} 20 L${x + 90} 660 L${x - 90} 660 Z`}
          fill="#6888a0" stroke="#0a1414" strokeWidth={6} />
        {/* mullion cross */}
        <line x1={x} y1={20} x2={x} y2={660} stroke="#0a1414" strokeWidth={6} />
        <line x1={x - 90} y1={340} x2={x + 90} y2={340} stroke="#0a1414" strokeWidth={6} />
        {/* window light pool on floor */}
        <path d={`M${x - 90} 660 L${x - 160} 1080 L${x + 160} 1080 L${x + 90} 660 Z`}
          fill="rgba(100,140,180,0.08)" />
      </g>
    ))}
    {/* marble columns — between windows */}
    {[180, 540, 920, 1380, 1740].map((x, i) => (
      <g key={`col${i}`}>
        {/* column shaft with subtle veining */}
        <rect x={x - 28} y={16} width={56} height={660} fill="#d4cec4" stroke="#b8b2a8" strokeWidth={3} />
        {[6, 14, 22, 30, 38, 46].map((dx) => (
          <line key={dx} x1={x - 28 + dx} y1={16} x2={x - 28 + dx} y2={676}
            stroke="rgba(0,0,0,0.06)" strokeWidth={1.5} />
        ))}
        {/* marble vein */}
        <path d={`M${x - 20} 60 Q${x + 10} 200 ${x - 8} 400 Q${x + 15} 560 ${x - 5} 650`}
          stroke="rgba(180,170,160,0.4)" strokeWidth={1.5} fill="none" />
        {/* capital */}
        <rect x={x - 38} y={10} width={76} height={16} fill="#c4beb4" stroke="#a8a29a" strokeWidth={3} />
        <rect x={x - 50} y={0} width={100} height={14} fill="#b8b2a8" stroke="#a0988e" strokeWidth={3} />
        {/* base */}
        <rect x={x - 38} y={662} width={76} height={16} fill="#c4beb4" stroke="#a8a29a" strokeWidth={3} />
      </g>
    ))}
    {/* ornate gilt frame on back wall — portrait space */}
    <rect x={830} y={80} width={260} height={320} fill="#0a1414" stroke="#c4932a" strokeWidth={8} rx={4} />
    <rect x={844} y={94} width={232} height={292} fill="#0e1e1e" stroke="#a07820" strokeWidth={4} rx={2} />
    {/* inner portrait silhouette */}
    <ellipse cx={960} cy={180} rx={60} ry={70} fill="#1a2a2a" />
    <rect x={900} y={240} width={120} height={120} fill="#1a2a2a" />
    {/* flag / drape flanking portrait */}
    <path d={`M830 80 Q${810 + Math.sin(f / 24) * 6} 240 820 400`}
      stroke="#8a1a1a" strokeWidth={18} fill="none" />
    <path d={`M1090 80 Q${1110 + Math.sin(f / 22) * 6} 240 1100 400`}
      stroke="#8a1a1a" strokeWidth={18} fill="none" />
    {/* polished marble floor — dark green-black */}
    <rect y={700} width={1920} height={380} fill="#0e1a14" />
    {/* floor tiles with perspective */}
    {Array.from({ length: 8 }).map((_, r) =>
      Array.from({ length: 10 }).map((__, c) => (
        <rect key={`fl${r}${c}`} x={c * 192} y={700 + r * 48} width={190} height={46}
          fill={r % 2 === c % 2 ? "#101e18" : "#0c1612"} stroke="#060e0a" strokeWidth={1} />
      ))
    )}
    {/* column reflections on floor */}
    {[180, 540, 920, 1380, 1740].map((x, i) => (
      <ellipse key={`ref${i}`} cx={x} cy={716} rx={28} ry={8} fill="rgba(212,206,196,0.12)" />
    ))}
    {/* floor–wall shadow */}
    <rect y={690} width={1920} height={22} fill="rgba(0,0,0,0.6)" />
    {/* deep vignette — grand space feels cavernous */}
    <radialGradient id="palaceVig" cx="50%" cy="38%" r="72%">
      <stop offset="15%" stopColor="transparent" />
      <stop offset="100%" stopColor="rgba(0,0,0,0.72)" />
    </radialGradient>
    <rect width={1920} height={1080} fill="url(#palaceVig)" />
  </>
);

const Study: SetFC = ({ f }) => (
  <>
    {/* Scholar's study — mahogany paneled walls, arched window, Persian carpet */}
    <rect width={1920} height={1080} fill="#1a1208" />
    {/* dark wood wall paneling — vertical boards */}
    {Array.from({ length: 16 }).map((_, i) => (
      <rect key={`panel${i}`} x={i * 120} y={0} width={118} height={700}
        fill={i % 2 === 0 ? "#1e1510" : "#1a1208"} stroke="#100c06" strokeWidth={2} />
    ))}
    {/* panel rail — horizontal banding */}
    <rect y={80} width={1920} height={12} fill="#2a1e0e" />
    <rect y={320} width={1920} height={10} fill="#2a1e0e" />
    <rect y={680} width={1920} height={14} fill="#150f06" />
    {/* bookcase left — tall floor to ceiling */}
    <rect x={40} y={40} width={440} height={660} fill="#120e08" stroke="#2a1e0e" strokeWidth={6} />
    {/* shelves */}
    {[0, 1, 2, 3, 4].map((s) => (
      <g key={`sh${s}`}>
        <rect x={40} y={116 + s * 128} width={440} height={10} fill="#3a2810" />
        {Array.from({ length: 11 }).map((_, b) => (
          <rect key={b} x={52 + b * 38} y={30 + s * 128} width={30} height={86} rx={2}
            fill={["#7b2020","#1e3d6b","#4a7b2a","#7b5c20","#5a1a5a","#2a5a4a","#8b4420","#1a3a6b","#6b2a20","#3a6b1a","#7b6020"][b]}
            stroke="#0a0804" strokeWidth={1.5}
          />
        ))}
      </g>
    ))}
    {/* arched window — central, tall */}
    <path d="M820 80 Q820 40 960 40 Q1100 40 1100 80 L1100 580 L820 580 Z"
      fill="#8aafcc" stroke="#1a1208" strokeWidth={10} />
    {/* window light bloom */}
    <radialGradient id="studyLight" cx="50%" cy="30%" r="40%">
      <stop offset="0%" stopColor="rgba(180,210,240,0.18)" />
      <stop offset="100%" stopColor="transparent" />
    </radialGradient>
    <rect width={1920} height={700} fill="url(#studyLight)" />
    {/* window mullions */}
    <line x1={960} y1={40} x2={960} y2={580} stroke="#1a1208" strokeWidth={8} />
    <line x1={820} y1={310} x2={1100} y2={310} stroke="#1a1208" strokeWidth={8} />
    {/* heavy curtains flanking window */}
    <path d={`M790 60 Q${760 + Math.sin(f / 22) * 10} 320 775 590 L820 590 Q${808 + Math.sin(f / 22) * 6} 320 820 60 Z`}
      fill="#1a0808" />
    <path d={`M1100 60 Q${1140 + Math.sin(f / 20) * 10} 320 1150 590 L1920 590 L1920 60 Z`}
      fill="#1a0808" />
    {/* writing desk — dark mahogany */}
    <rect x={500} y={560} width={920} height={120} rx={8} fill="#1e1510" stroke="#2e2010" strokeWidth={5} />
    {/* desk surface leather inlay */}
    <rect x={540} y={520} width={840} height={60} rx={4} fill="#1e2a1e" stroke="#2a3a2a" strokeWidth={3} />
    {/* open book on desk */}
    <path d="M680 520 L720 500 L960 505 L1200 500 L1240 520 Q1200 522 960 517 Q720 522 680 520 Z"
      fill="#f4edd8" stroke="#c8c0a0" strokeWidth={3} />
    <line x1={960} y1={500} x2={960} y2={520} stroke="#c8c0a0" strokeWidth={2} />
    {/* quill pen */}
    <path d="M1060 490 L1140 455" stroke="#c8c0a0" strokeWidth={4} />
    <path d="M1060 490 Q1070 500 1080 510" stroke="#c8c0a0" strokeWidth={3} />
    {/* desk lamp — oil lamp glow */}
    <rect x={1180} y={460} width={12} height={80} fill="#8a6020" />
    <ellipse cx={1186} cy={455} rx={28} ry={12} fill="#c4932a" />
    <radialGradient id="studyLamp" cx="61.8%" cy="42.1%" r="15%">
      <stop offset="0%" stopColor="rgba(230,160,40,0.25)" />
      <stop offset="100%" stopColor="transparent" />
    </radialGradient>
    <rect width={1920} height={700} fill="url(#studyLamp)" />
    {/* bookcase right */}
    <rect x={1440} y={40} width={440} height={660} fill="#120e08" stroke="#2a1e0e" strokeWidth={6} />
    {[0, 1, 2, 3, 4].map((s) => (
      <g key={`shr${s}`}>
        <rect x={1440} y={116 + s * 128} width={440} height={10} fill="#3a2810" />
        {Array.from({ length: 11 }).map((_, b) => (
          <rect key={b} x={1452 + b * 38} y={30 + s * 128} width={30} height={86} rx={2}
            fill={["#5a7b2d","#7b6a2d","#2d5a7b","#7b2d2d","#4a7b6a","#7b4a2d","#2d4a7b","#6a7b2d","#7b2d5a","#2d7b5a","#5a2d7b"][b]}
            stroke="#0a0804" strokeWidth={1.5}
          />
        ))}
      </g>
    ))}
    {/* Persian carpet — deep red with geometric border */}
    <ellipse cx={960} cy={950} rx={800} ry={140} fill="#5a1a1a" />
    <ellipse cx={960} cy={950} rx={700} ry={110} fill="#6b2020" />
    {/* carpet border pattern */}
    {Array.from({ length: 16 }).map((_, i) => (
      <rect key={`cp${i}`} x={180 + i * 100} y={830} width={80} height={18}
        fill={i % 2 === 0 ? "#8b3030" : "#4a1010"} />
    ))}
    {/* floor — dark boards */}
    <rect y={700} width={1920} height={380} fill="#1a1008" />
    {Array.from({ length: 16 }).map((_, i) => (
      <rect key={`fb${i}`} x={i * 120} y={700} width={118} height={380}
        fill={i % 2 === 0 ? "#1e1510" : "#1a1208"} stroke="#100c06" strokeWidth={1} />
    ))}
    {/* floor–wall shadow */}
    <rect y={690} width={1920} height={22} fill="rgba(0,0,0,0.7)" />
    {/* heavy vignette */}
    <radialGradient id="studyVig" cx="50%" cy="38%" r="65%">
      <stop offset="20%" stopColor="transparent" />
      <stop offset="100%" stopColor="rgba(0,0,0,0.75)" />
    </radialGradient>
    <rect width={1920} height={1080} fill="url(#studyVig)" />
  </>
);

const NightCity: SetFC = ({ f }) => (
  <>
    <rect width={1920} height={1080} fill="#221d2e" />
    <circle cx={1600} cy={160} r={60} fill="#f2ecd2" />
    {Array.from({ length: 10 }).map((_, i) => (
      <g key={i}>
        <path d={`M${i * 200} 900 L${i * 200} ${420 + (i % 3) * 60} l100 -120 l100 120 L${i * 200 + 200} 900 Z`} fill="#30293d" stroke="#1a1622" strokeWidth={6} />
        {[0, 1, 2].map((w) => (
          <rect key={w} x={i * 200 + 40 + w * 45} y={520 + ((i + w) % 3) * 80} width={26} height={38} fill="#f0b350" />
        ))}
      </g>
    ))}
    <rect y={900} width={1920} height={180} fill="#1a1622" />
  </>
);


const Smoke: React.FC<{ x: number; y: number; f: number }> = ({ x, y, f }) => (
  <g fill="rgba(240,240,240,0.55)">
    {[0, 1, 2].map((k) => {
      const q = ((f / 40 + k / 3) % 1);
      return <circle key={k} cx={x + Math.sin(q * 6) * 10} cy={y - q * 120} r={10 + q * 22} opacity={1 - q} />;
    })}
  </g>
);

const Village: SetFC = ({ f }) => (
  <>
    <rect width={1920} height={1080} fill="#bcd6ea" />
    <Clouds f={f} />
    <path d="M0 600 Q480 520 960 580 T1920 560 V1080 H0 Z" fill="#9cc46a" stroke={ink} strokeWidth={5} />
    <rect y={760} width={1920} height={320} fill="#86b05a" />
    <path d="M760 1080 Q900 820 980 640" stroke="#c9a46a" strokeWidth={90} fill="none" />
    {[[260, 520], [620, 560], [1260, 540], [1580, 520]].map(([x, y], i) => (
      <g key={i} transform={`translate(${x},${y})`} stroke={ink} strokeWidth={5} strokeLinejoin="round">
        <rect x={-90} y={0} width={180} height={140} fill="#c98a4b" />
        <path d="M-120 10 L0 -110 L120 10 Z" fill="#d9b56a" />
        <rect x={-24} y={60} width={48} height={80} fill="#5a3d2b" />
        <Smoke x={50} y={-70} f={f + i * 30} />
      </g>
    ))}
  </>
);

const Sea: SetFC = ({ f }) => (
  <>
    <rect width={1920} height={1080} fill="#bcd6ea" />
    <Clouds f={f} />
    <rect y={560} width={1920} height={520} fill="#2f6fb5" />
    {Array.from({ length: 6 }).map((_, r) => (
      <path key={r} d={Array.from({ length: 12 }).map((__, c) => `M${((c * 180 + f * (1 + r * 0.3)) % 2100) - 100} ${620 + r * 75} q30 -18 60 0`).join(" ")} stroke="rgba(255,255,255,0.55)" strokeWidth={5} fill="none" />
    ))}
    {[0, 1].map((k) => {
      const x = ((f * 2.4 + k * 1100) % 2400) - 300;
      const lift = Math.sin(f / 16 + k) * 14;
      return (
        <path key={`w${k}`} d={`M${x - 260} 1080 Q${x - 120} ${930 + lift} ${x} ${880 + lift} Q${x + 90} ${850 + lift} ${x + 120} ${900 + lift} Q${x + 60} ${905 + lift} ${x + 40} ${945 + lift} Q${x + 160} 1000 ${x + 260} 1080 Z`} fill="#2a63a6" stroke="#f4f4f4" strokeWidth={8} strokeLinejoin="round" />
      );
    })}
    <g transform={`translate(${900 + Math.sin(f / 30) * 20} ${600 + Math.sin(f / 12) * 8}) rotate(${Math.sin(f / 15) * 2})`} stroke={ink} strokeWidth={6} strokeLinejoin="round">
      <path d="M-260 40 L260 40 L190 160 L-190 160 Z" fill="#8a5a2b" />
      <path d="M0 40 L0 -360 M-120 40 L-120 -260" />
      <path d="M8 -340 Q200 -200 8 -40 Z" fill="#f4ecd8" />
      <path d="M-112 -240 Q20 -150 -112 -20 Z" fill="#efe2bf" />
      <path d={`M0 -360 L${70 + Math.sin(f / 5) * 8} -340 L0 -320`} fill="#b23a2a" />
    </g>
  </>
);

const Battlefield: SetFC = ({ f }) => (
  <>
    <rect width={1920} height={1080} fill="#d9c7a8" />
    <rect width={1920} height={1080} fill="rgba(120,60,30,0.15)" />
    <path d="M0 620 Q500 560 960 610 T1920 590 V1080 H0 Z" fill="#8f9a5a" stroke={ink} strokeWidth={5} />
    {[300, 820, 1400].map((x, i) => (
      <g key={x}>
        <Smoke x={x} y={600} f={f + i * 25} />
        <Smoke x={x + 60} y={610} f={f + i * 25 + 15} />
      </g>
    ))}
    {[[160, 560, "#b23a2a"], [1760, 560, "#2d5a7b"]].map(([x, y, c], i) => (
      <g key={i} transform={`translate(${x},${y})`} stroke={ink} strokeWidth={5}>
        <path d="M0 0 L0 -220" strokeWidth={8} />
        <path d={`M0 -220 Q${60} ${-210 + Math.sin(f / 6 + i) * 10} ${120} -220 L120 -150 Q60 ${-140 + Math.sin(f / 6 + i) * 10} 0 -150 Z`} fill={c as string} />
      </g>
    ))}
  </>
);

const Market: SetFC = ({ f }) => (
  <>
    <rect width={1920} height={1080} fill="#f3d79f" />
    <path d="M0 640 H1920 V1080 H0 Z" fill="#d6aa66" stroke={ink} strokeWidth={5} />
    {[0, 1, 2, 3].map((i) => (
      <g key={i} transform={`translate(${180 + i * 450},380)`} stroke={ink} strokeWidth={5} strokeLinejoin="round">
        <path d={`M-170 0 L170 0 L150 ${60 + Math.sin(f / 10 + i) * 4} L-150 ${60 + Math.sin(f / 10 + i) * 4} Z`} fill={["#b23a2a", "#2f7f7a", "#e0b84a", "#4f6d8f"][i]} />
        <path d="M-150 60 L-150 300 M150 60 L150 300" />
        <rect x={-150} y={220} width={300} height={80} fill="#8a5a2b" />
        {[-100, -40, 20, 80].map((x, k) => (
          <circle key={k} cx={x} cy={205} r={22} fill={["#f2c230", "#f4f1ea", "#e07b1f", "#7a3b2e"][(k + i) % 4]} />
        ))}
      </g>
    ))}
  </>
);

const Wall: React.FC<{ color: string; floor: string }> = ({ color, floor }) => (
  <>
    <rect width={1920} height={1080} fill={color} />
    <rect y={700} width={1920} height={380} fill={floor} />
    <rect y={690} width={1920} height={16} fill="rgba(0,0,0,0.18)" />
  </>
);

const Shop: SetFC = ({ f }) => (
  <>
    {/* Dark colonial shophouse — espresso walls, terracotta floor */}
    <rect width={1920} height={1080} fill="#2a1f14" />
    {/* ceiling beam grid */}
    {[0, 1, 2, 3].map((i) => (
      <rect key={`cb${i}`} x={i * 500} y={0} width={28} height={700} fill="#1a1008" />
    ))}
    <rect x={0} y={70} width={1920} height={30} fill="#1a1008" />
    {/* warm pendant lamp pools of light */}
    {[320, 760, 1200, 1660].map((x, i) => (
      <g key={`lamp${i}`}>
        <ellipse cx={x} cy={80} rx={40} ry={16} fill="#e0a030" opacity={0.9} />
        <line x1={x} y1={0} x2={x} y2={80} stroke="#5a3d1a" strokeWidth={6} />
        {/* warm cone of light on floor */}
        <path d={`M${x - 20} 96 L${x - 300} 700 L${x + 300} 700 L${x + 20} 96 Z`} fill="rgba(230,160,40,0.07)" />
      </g>
    ))}
    {/* left wall — tall dark shelving unit */}
    <rect x={80} y={80} width={680} height={620} fill="#1e1409" stroke="#3a2810" strokeWidth={6} />
    {[0, 1, 2, 3].map((r) => (
      <g key={`shelf${r}`}>
        <rect x={80} y={148 + r * 148} width={680} height={12} fill="#4a3018" />
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={i} x={100 + i * 82} y={68 + r * 148} width={68} height={80} rx={4}
            fill={["#8b2020", "#1e4d3a", "#c4932a", "#2d4a6e", "#6b3d1a", "#3a5b2a", "#7a4f1e", "#1e3d6b"][(i + r) % 8]}
            stroke="#0a0804" strokeWidth={2} opacity={0.9}
          />
        ))}
      </g>
    ))}
    {/* counter — dark wood with brass edge */}
    <rect x={900} y={560} width={940} height={180} fill="#1e1409" stroke="#7a5a1a" strokeWidth={6} />
    <rect x={900} y={555} width={940} height={18} fill="#c4932a" />
    {/* small produce bowls on counter */}
    {[960, 1080, 1200, 1340].map((x, i) => (
      <g key={`bowl${i}`}>
        <ellipse cx={x} cy={548} rx={48} ry={16} fill={["#b23a2a","#e0a030","#3a7a2a","#c4932a"][i]} stroke="#1a1008" strokeWidth={3} />
        <ellipse cx={x} cy={544} rx={40} ry={12} fill={["#d44a3a","#f0c040","#4a9a3a","#d4a34a"][i]} />
      </g>
    ))}
    {/* chalkboard sign */}
    <rect x={1540} y={100} width={320} height={240} rx={8} fill="#1a2a1a" stroke="#4a3018" strokeWidth={8} />
    <rect x={1555} y={115} width={290} height={210} rx={4} fill="#1e301e" />
    <text x={1700} y={190} textAnchor="middle" fontSize={36} fontFamily="'Kalam', cursive" fill="#e8e0c0">TODAY&apos;S</text>
    <text x={1700} y={238} textAnchor="middle" fontSize={36} fontFamily="'Kalam', cursive" fill="#e8e0c0">PRICES</text>
    <path d="M1570 260 L1830 260" stroke="#c8c0a0" strokeWidth={3} opacity={0.6} />
    {/* terracotta tiled floor */}
    <rect y={700} width={1920} height={380} fill="#6b3a24" />
    {Array.from({ length: 8 }).map((_, r) =>
      Array.from({ length: 12 }).map((__, c) => (
        <rect key={`t${r}${c}`} x={c * 170} y={700 + r * 50} width={164} height={44}
          fill={r % 2 === c % 2 ? "#7a4030" : "#6b3824"} stroke="#3a1e10" strokeWidth={2} />
      ))
    )}
    {/* floor–wall shadow */}
    <rect y={690} width={1920} height={22} fill="rgba(0,0,0,0.5)" />
    {/* subtle vignette overlay */}
    <radialGradient id="shopVig" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stopColor="transparent" />
      <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
    </radialGradient>
    <rect width={1920} height={1080} fill="url(#shopVig)" />
  </>
);

const Bank: SetFC = () => (
  <>
    {/* Classical bank interior — cool marble walls, brass & dark timber */}
    <rect width={1920} height={1080} fill="#e8e4de" />
    {/* marble vein texture on walls — faint diagonal paths */}
    {Array.from({ length: 18 }).map((_, i) => (
      <path key={`mv${i}`}
        d={`M${-200 + i * 140} 0 Q${i * 140 + 60} 300 ${-100 + i * 140} 700`}
        stroke="rgba(180,172,160,0.3)" strokeWidth={1.5} fill="none"
      />
    ))}
    {/* classical columns */}
    {[120, 420, 720, 1020, 1320, 1620, 1820].map((x, i) => (
      <g key={`col${i}`}>
        <rect x={x} y={40} width={48} height={660} fill="#ddd8d0" stroke="#b8b0a4" strokeWidth={3} />
        {/* column flutes */}
        {[6, 14, 22, 30, 38].map((dx) => (
          <line key={dx} x1={x + dx} y1={40} x2={x + dx} y2={700} stroke="rgba(0,0,0,0.08)" strokeWidth={2} />
        ))}
        {/* capital */}
        <rect x={x - 10} y={35} width={68} height={20} fill="#c8c0b4" stroke="#b0a898" strokeWidth={3} />
        <rect x={x - 20} y={22} width={88} height={18} fill="#b8b0a4" stroke="#a8a098" strokeWidth={3} />
      </g>
    ))}
    {/* frieze band at top */}
    <rect y={0} width={1920} height={35} fill="#c8c2b8" stroke="#b0a898" strokeWidth={4} />
    {/* teller counter — dark mahogany with brass cage */}
    <rect x={0} y={520} width={1920} height={30} fill="#8a7050" />
    <rect x={0} y={550} width={1920} height={200} fill="#5a3d22" stroke="#2a1a0a" strokeWidth={4} />
    {/* brass teller cages */}
    {[200, 580, 960, 1340, 1720].map((x, i) => (
      <g key={`cage${i}`}>
        <rect x={x - 150} y={320} width={300} height={230} fill="rgba(220,200,120,0.08)" stroke="#c4932a" strokeWidth={5} />
        {/* cage grid */}
        {[-100, -60, -20, 20, 60, 100].map((dx) => (
          <line key={dx} x1={x + dx} y1={320} x2={x + dx} y2={550} stroke="#c4932a" strokeWidth={2.5} opacity={0.6} />
        ))}
        {[380, 440, 500].map((y) => (
          <line key={y} x1={x - 150} y1={y} x2={x + 150} y2={y} stroke="#c4932a" strokeWidth={2.5} opacity={0.6} />
        ))}
        {/* teller window opening */}
        <rect x={x - 100} y={470} width={200} height={80} fill="rgba(220,210,180,0.15)" />
      </g>
    ))}
    {/* overhead sign board */}
    <rect x={660} y={60} width={600} height={80} rx={8} fill="#2d1e0a" stroke="#c4932a" strokeWidth={5} />
    <text x={960} y={118} textAnchor="middle" fontSize={52} fontFamily="Georgia, serif" fill="#c4932a" letterSpacing={8}>BANK</text>
    {/* polished granite floor — dark grey with reflective sheen */}
    <rect y={700} width={1920} height={380} fill="#2a2a2e" />
    {Array.from({ length: 8 }).map((_, r) =>
      Array.from({ length: 10 }).map((__, c) => (
        <rect key={`gf${r}${c}`} x={c * 192} y={700 + r * 48} width={188} height={44}
          fill={r % 2 === c % 2 ? "#2e2e34" : "#262628"} stroke="#1a1a1e" strokeWidth={1} />
      ))
    )}
    {/* floor shadow */}
    <rect y={690} width={1920} height={22} fill="rgba(0,0,0,0.5)" />
    {/* subtle vignette */}
    <radialGradient id="bankVig" cx="50%" cy="50%" r="80%">
      <stop offset="20%" stopColor="transparent" />
      <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
    </radialGradient>
    <rect width={1920} height={1080} fill="url(#bankVig)" />
  </>
);

const Home: SetFC = ({ f }) => (
  <>
    {/* Dark-toned apartment living room — charcoal walls, warm parquet, ambient window light */}
    <rect width={1920} height={1080} fill="#1e1e28" />
    {/* tall wainscoting panels */}
    {Array.from({ length: 8 }).map((_, i) => (
      <rect key={`wp${i}`} x={80 + i * 230} y={300} width={202} height={380} rx={4}
        fill="#222230" stroke="#2e2e40" strokeWidth={3} />
    ))}
    {/* dado rail */}
    <rect y={295} width={1920} height={12} fill="#2a2a3a" stroke="#3a3a50" strokeWidth={3} />
    {/* picture rail near ceiling */}
    <rect y={80} width={1920} height={8} fill="#2a2a3a" />
    {/* large window — soft diffused daylight glow */}
    <rect x={1300} y={110} width={440} height={540} rx={6} fill="#6090b8" stroke="#2a2a3a" strokeWidth={8} />
    {/* window light bloom radiating inward */}
    <radialGradient id="winLight" cx="70%" cy="35%" r="55%">
      <stop offset="0%" stopColor="rgba(140,190,230,0.22)" />
      <stop offset="100%" stopColor="transparent" />
    </radialGradient>
    <rect width={1920} height={700} fill="url(#winLight)" />
    {/* window panes cross */}
    <line x1={1520} y1={110} x2={1520} y2={650} stroke="#2a2a3a" strokeWidth={8} />
    <line x1={1300} y1={380} x2={1740} y2={380} stroke="#2a2a3a" strokeWidth={8} />
    {/* curtain left side — heavy fabric with folds */}
    <path d={`M1270 90 Q${1240 + Math.sin(f / 25) * 6} 300 1255 660 L1295 660 Q${1282 + Math.sin(f / 25) * 4} 300 1300 90 Z`}
      fill="#1a0808" stroke="#120606" strokeWidth={3} />
    {/* curtain fold highlights */}
    <path d={`M1278 90 Q${1255 + Math.sin(f / 25) * 5} 280 1262 640`}
      stroke="#2a1010" strokeWidth={4} fill="none" />
    {/* curtain right side */}
    <path d={`M1740 90 Q${1770 + Math.sin(f / 22) * 7} 320 1760 660 L1920 660 L1920 90 Z`}
      fill="#1a0808" stroke="#120606" strokeWidth={3} />
    {/* sofa — deep charcoal three-seater */}
    <rect x={180} y={570} width={860} height={180} rx={18} fill="#2a2a3a" stroke="#3a3a50" strokeWidth={5} />
    {/* sofa back */}
    <rect x={180} y={500} width={860} height={80} rx={12} fill="#252535" stroke="#3a3a50" strokeWidth={5} />
    {/* sofa cushions */}
    {[200, 460, 720].map((x, i) => (
      <rect key={`cush${i}`} x={x} y={520} width={220} height={60} rx={8}
        fill="#2e2e42" stroke="#3e3e55" strokeWidth={3} />
    ))}
    {/* sofa legs */}
    {[200, 980].map((x) => (
      <rect key={`leg${x}`} x={x} y={745} width={30} height={40} rx={4} fill="#1a1a26" />
    ))}
    {/* left arm chair silhouette */}
    <rect x={40} y={560} width={180} height={190} rx={12} fill="#222232" stroke="#303045" strokeWidth={4} />
    <rect x={40} y={510} width={180} height={60} rx={8} fill="#1e1e2e" stroke="#303045" strokeWidth={4} />
    {/* side table with warm lamp */}
    <rect x={1070} y={570} width={180} height={180} rx={8} fill="#1a1208" stroke="#2a1e0e" strokeWidth={4} />
    {/* lamp base */}
    <rect x={1140} y={500} width={16} height={70} fill="#8a6020" />
    {/* lamp shade */}
    <path d="M1100 480 L1120 510 L1196 510 L1216 480 Z" fill="#e0a030" stroke="#c08020" strokeWidth={3} />
    {/* warm lamp glow pool */}
    <ellipse cx={1148} cy={520} rx={80} ry={20} fill="rgba(230,160,40,0.18)" />
    <radialGradient id="lampGlow" cx="59.8%" cy="47.2%" r="20%">
      <stop offset="0%" stopColor="rgba(230,160,40,0.15)" />
      <stop offset="100%" stopColor="transparent" />
    </radialGradient>
    <rect width={1920} height={700} fill="url(#lampGlow)" />
    {/* framed picture on wall */}
    <rect x={120} y={120} width={240} height={160} fill="#181820" stroke="#3a3a50" strokeWidth={6} />
    <rect x={130} y={130} width={220} height={140} fill="#2a2838" />
    {/* parquet wood floor */}
    <rect y={700} width={1920} height={380} fill="#3a2810" />
    {Array.from({ length: 12 }).map((_, c) => (
      <g key={`pq${c}`}>
        {Array.from({ length: 5 }).map((__, r) => (
          <rect key={r} x={c * 160} y={700 + r * 76} width={158} height={74}
            fill={c % 2 === r % 2 ? "#3e2c14" : "#382814"} stroke="#2a1e0a" strokeWidth={1.5} />
        ))}
      </g>
    ))}
    {/* floor–wall shadow */}
    <rect y={690} width={1920} height={22} fill="rgba(0,0,0,0.6)" />
    {/* room vignette — heavy corners */}
    <radialGradient id="homeVig" cx="50%" cy="40%" r="75%">
      <stop offset="30%" stopColor="transparent" />
      <stop offset="100%" stopColor="rgba(0,0,0,0.65)" />
    </radialGradient>
    <rect width={1920} height={1080} fill="url(#homeVig)" />
  </>
);

const Factory: SetFC = ({ f }) => (
  <>
    <Wall color="#b9b2a6" floor="#6f6a62" />
    {[0, 1, 2, 3].map((i) => (
      <path key={i} d={`M${i * 520 - 40} 260 L${i * 520 + 220} 60 L${i * 520 + 480} 260 Z`} fill="#a39a8c" stroke={ink} strokeWidth={5} />
    ))}
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <rect key={i} x={80 + i * 310} y={300} width={180} height={120} fill="#cfe2ef" stroke={ink} strokeWidth={5} />
    ))}
    <rect x={0} y={600} width={1920} height={60} fill="#3a3a3a" stroke={ink} strokeWidth={5} />
    {Array.from({ length: 12 }).map((_, i) => (
      <circle key={i} cx={((i * 170 + f * 3) % 2000) - 40} cy={630} r={18} fill="#9aa0a6" stroke={ink} strokeWidth={4} />
    ))}
    {Array.from({ length: 6 }).map((_, i) => (
      <rect key={i} x={((i * 340 + f * 3) % 2100) - 120} y={540} width={110} height={60} rx={8} fill="#c98a4b" stroke={ink} strokeWidth={5} />
    ))}
  </>
);


/** Big dark smoke column for steamships and factories: puffs grow and drift as they rise. */
export const BigSmoke: React.FC<{ x: number; y: number; f: number; scale?: number; color?: string }> = ({ x, y, f, scale = 1, color = "#2e2a2a" }) => (
  <g fill={color}>
    {Array.from({ length: 8 }).map((_, k) => {
      const q = (f / 70 + k / 8) % 1;
      return <circle key={k} cx={x + q * 140 * scale + Math.sin(q * 7 + k) * 14} cy={y - q * 360 * scale} r={(16 + q * 70) * scale} opacity={0.85 * (1 - q * 0.8)} />;
    })}
  </g>
);

/** A steamship of the 1880s–1910s: iron hull, two funnels pouring smoke, masts. */
export const Steamship: React.FC<{ x: number; y: number; f: number; s?: number }> = ({ x, y, f, s = 1 }) => (
  <g transform={`translate(${x} ${y + Math.sin(f / 14) * 5 * s}) scale(${s})`} stroke={ink} strokeWidth={6} strokeLinejoin="round">
    <BigSmoke x={-70} y={-220} f={f} scale={0.8} />
    <BigSmoke x={90} y={-220} f={f + 35} scale={0.8} />
    <path d="M-420 -40 L420 -40 L360 90 L-380 90 Z" fill="#26232a" />
    <path d="M-420 -40 L420 -40 L414 -10 L-414 -10 Z" fill="#b23a2a" />
    {Array.from({ length: 12 }).map((_, i) => <circle key={i} cx={-330 + i * 58} cy={30} r={9} fill="#f2d27a" strokeWidth={3} />)}
    <rect x={-300} y={-110} width={560} height={70} fill="#efe2bf" />
    <rect x={-100} y={-230} width={60} height={120} fill="#b23a2a" />
    <rect x={60} y={-230} width={60} height={120} fill="#b23a2a" />
    <rect x={-100} y={-230} width={60} height={22} fill="#26232a" />
    <rect x={60} y={-230} width={60} height={22} fill="#26232a" />
    <path d="M-330 -110 L-330 -330 M290 -110 L290 -330 M-330 -330 L290 -330" fill="none" strokeWidth={5} />
  </g>
);

/** The docks of Buenos Aires: steamship alongside, crane, crates, gangplank. */
const Port: SetFC = ({ f }) => (
  <>
    <rect width={1920} height={1080} fill="#cfe0ec" />
    <Clouds f={f} />
    <rect y={520} width={1920} height={260} fill="#3a6f9e" />
    {Array.from({ length: 3 }).map((_, r) => (
      <path key={r} d={Array.from({ length: 10 }).map((__, c) => `M${((c * 220 + f * (0.8 + r * 0.3)) % 2200) - 120} ${560 + r * 60} q40 -16 80 0`).join(" ")} stroke="rgba(255,255,255,0.5)" strokeWidth={5} fill="none" />
    ))}
    <Steamship x={1000} y={560} f={f} s={1.05} />
    <g stroke={ink} strokeWidth={7} fill="none">
      <path d="M260 780 L260 250 L560 250 M260 330 L340 250" />
      <path d={`M520 250 L520 ${420 + Math.sin(f / 25) * 30}`} strokeWidth={4} />
    </g>
    <rect x={470} y={420 + Math.sin(f / 25) * 30} width={100} height={70} fill="#c98a4b" stroke={ink} strokeWidth={5} />
    <rect y={760} width={1920} height={320} fill="#9a7650" />
    {Array.from({ length: 16 }).map((_, i) => <path key={i} d={`M${i * 130} 760 L${i * 130 - 40} 1080`} stroke="#7d5c3c" strokeWidth={4} />)}
    <path d="M0 760 L1920 760" stroke={ink} strokeWidth={6} />
    {[[90, 680], [160, 680], [120, 610], [1680, 690], [1760, 690]].map(([x, y], i) => (
      <rect key={i} x={x} y={y} width={80} height={80} fill="#c98a4b" stroke={ink} strokeWidth={5} />
    ))}
    <path d="M760 760 L900 620" stroke={ink} strokeWidth={14} />
  </>
);

/** A Buenos Aires avenue: belle-époque facades with balconies, lamps, cobbles. */
const Street: SetFC = ({ f }) => (
  <>
    <rect width={1920} height={1080} fill="#bcd3e4" />
    <Clouds f={f} y={60} />
    {Array.from({ length: 5 }).map((_, i) => {
      const x = i * 400 - 20;
      const c = ["#e8d9bd", "#d9c3a0", "#efe2c8", "#d6c6b0", "#e4cfae"][i];
      return (
        <g key={i} stroke={ink} strokeWidth={5}>
          <rect x={x} y={150 + (i % 2) * 40} width={390} height={620} fill={c} />
          <path d={`M${x - 10} ${150 + (i % 2) * 40} L${x + 400} ${150 + (i % 2) * 40}`} strokeWidth={14} />
          <path d={`M${x + 60} ${150 + (i % 2) * 40} Q${x + 195} ${60 + (i % 2) * 40} ${x + 330} ${150 + (i % 2) * 40} Z`} fill="#6e8a8f" />
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((k) => (
              <g key={`${r}${k}`}>
                <rect x={x + 45 + k * 115} y={230 + (i % 2) * 40 + r * 165} width={70} height={110} rx={30} fill="#5a7590" />
                <path d={`M${x + 35 + k * 115} ${345 + (i % 2) * 40 + r * 165} L${x + 125 + k * 115} ${345 + (i % 2) * 40 + r * 165}`} strokeWidth={6} />
              </g>
            )),
          )}
        </g>
      );
    })}
    <rect y={770} width={1920} height={310} fill="#8d8a86" />
    {Array.from({ length: 40 }).map((_, i) => <path key={i} d={`M${(i % 20) * 100 + (i >= 20 ? 50 : 0)} ${830 + (i >= 20 ? 90 : 0)} q25 -10 50 0`} stroke="#6f6c69" strokeWidth={4} fill="none" />)}
    <path d="M0 770 L1920 770" stroke={ink} strokeWidth={6} />
    {[200, 960, 1720].map((x) => (
      <g key={x} stroke={ink} strokeWidth={6}>
        <path d={`M${x} 770 L${x} 470`} />
        <rect x={x - 22} y={430} width={44} height={46} rx={8} fill="#ffe28a" />
      </g>
    ))}
  </>
);

/* ---------- landscape pieces, reused by the outdoor sets ---------- */

const Tree: React.FC<{ x: number; y: number; s?: number; f: number; c?: string }> = ({ x, y, s = 1, f, c = "#5f9a3c" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} stroke={ink} strokeWidth={5} strokeLinejoin="round">
    <path d="M-12 0 L-8 -90 L8 -90 L12 0 Z" fill="#7a5233" />
    <g transform={`rotate(${Math.sin(f / 30 + x) * 1.5} 0 -90)`}>
      <circle cx={0} cy={-150} r={70} fill={c} />
      <circle cx={-55} cy={-115} r={48} fill={c} />
      <circle cx={55} cy={-115} r={48} fill={c} />
    </g>
  </g>
);

/** The ombú, the lone giant tree of the Pampas: wide umbrella crown on a thick trunk. */
const Ombu: React.FC<{ x: number; y: number; s?: number; f: number }> = ({ x, y, s = 1, f }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} stroke={ink} strokeWidth={6} strokeLinejoin="round">
    <path d="M-60 0 Q-30 -60 -26 -150 L26 -150 Q30 -60 60 0 Z" fill="#7a5233" />
    <path d={`M-260 -150 Q-200 ${-300 + Math.sin(f / 25) * 4} 0 -310 Q200 ${-300 + Math.sin(f / 25) * 4} 260 -150 Q120 -120 0 -135 Q-120 -120 -260 -150 Z`} fill="#4f8a33" />
  </g>
);

const Fence: React.FC<{ y: number; x0?: number; x1?: number }> = ({ y, x0 = 0, x1 = 1920 }) => (
  <g stroke={ink} strokeWidth={5}>
    <path d={`M${x0} ${y - 30} L${x1} ${y - 30} M${x0} ${y - 60} L${x1} ${y - 60}`} stroke="#8a5a2b" strokeWidth={7} />
    {Array.from({ length: Math.ceil((x1 - x0) / 120) + 1 }).map((_, i) => (
      <rect key={i} x={x0 + i * 120 - 7} y={y - 80} width={14} height={80} fill="#a8743f" />
    ))}
  </g>
);

const Farmhouse: React.FC<{ x: number; y: number; s?: number; f: number; wall?: string; roof?: string }> = ({ x, y, s = 1, f, wall = "#f1e6cf", roof = "#b5532f" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} stroke={ink} strokeWidth={5} strokeLinejoin="round">
    <rect x={-130} y={-120} width={260} height={120} fill={wall} />
    <path d="M-160 -110 L0 -200 L160 -110 Z" fill={roof} />
    <rect x={-25} y={-70} width={50} height={70} fill="#6b4a2f" />
    <rect x={-105} y={-90} width={50} height={40} fill="#8fc3e6" />
    <rect x={55} y={-90} width={50} height={40} fill="#8fc3e6" />
    <rect x={80} y={-200} width={26} height={60} fill="#c98a4b" />
    <Smoke x={93} y={-205} f={f} />
  </g>
);

/** Steel wind pump of the estancias, wheel turning. */
const Windmill: React.FC<{ x: number; y: number; f: number; s?: number }> = ({ x, y, f, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} stroke={ink} strokeWidth={5}>
    <path d="M-40 0 L-6 -300 L6 -300 L40 0 M-30 -80 L30 -80 M-20 -170 L20 -170" fill="none" />
    <g transform={`translate(0 -310) rotate(${f * 2})`}>
      {Array.from({ length: 12 }).map((_, i) => (
        <path key={i} d="M0 0 L-12 -80 L12 -80 Z" fill="#d9d9d9" transform={`rotate(${i * 30})`} />
      ))}
      <circle r={14} fill="#9aa0a6" />
    </g>
    <path d="M10 -310 L90 -300 L90 -330 Z" fill="#b23a2a" />
  </g>
);

const Hills: React.FC<{ y: number; c1?: string; c2?: string }> = ({ y, c1 = "#a9cf7a", c2 = "#93bf62" }) => (
  <>
    <path d={`M0 ${y} Q300 ${y - 120} 640 ${y - 30} T1300 ${y - 50} T1920 ${y - 90} V1080 H0 Z`} fill={c1} stroke={ink} strokeWidth={4} />
    <path d={`M0 ${y + 60} Q500 ${y - 20} 980 ${y + 40} T1920 ${y + 20} V1080 H0 Z`} fill={c2} stroke={ink} strokeWidth={4} />
  </>
);

const Grass: React.FC<{ y0: number; f: number; n?: number; c?: string }> = ({ y0, f, n = 60, c = "#5f8f3a" }) => (
  <g stroke={c} strokeWidth={4} strokeLinecap="round" fill="none">
    {Array.from({ length: n }).map((_, i) => {
      const x = (i * 331) % 1920;
      const y = y0 + ((i * 197) % (1080 - y0));
      const sway = Math.sin(f / 18 + i) * 4;
      return <path key={i} d={`M${x} ${y} q${-4 + sway} -20 ${-8 + sway} -30 M${x + 8} ${y} q${2 + sway} -24 ${6 + sway} -34 M${x + 16} ${y} q${6 + sway} -18 ${12 + sway} -26`} />;
    })}
  </g>
);

/* ---------- the new natural environments ---------- */

/** The open Pampas: endless grass to a low horizon, a lone ombú, grazing cattle, a gaucho's fence. */
const Pampas: SetFC = ({ f }) => (
  <>
    <rect width={1920} height={1080} fill="#a9cdea" />
    <Clouds f={f} />
    <path d="M0 560 Q960 530 1920 560 V1080 H0 Z" fill="#b5d27a" />
    <path d="M0 640 Q700 600 1920 660 V1080 H0 Z" fill="#9cc25e" />
    <Ombu x={1500} y={640} s={1} f={f} />
    <Farmhouse x={420} y={585} s={0.45} f={f} />
    <Windmill x={600} y={590} f={f} s={0.5} />
    {[[300, 760, 1], [820, 720, 0.75], [1100, 820, 1.1]].map(([x, y, sc], i) => (
      <g key={i} transform={`translate(${x + Math.sin(f / 60 + i) * 10} ${y}) scale(${sc})`} stroke={ink} strokeWidth={5}>
        <ellipse cx={0} cy={0} rx={70} ry={38} fill={i % 2 ? "#5a3d2b" : "#f1e6cf"} />
        <circle cx={-70} cy={-10 + Math.sin(f / 15 + i) * 6} r={24} fill={i % 2 ? "#5a3d2b" : "#f1e6cf"} />
        <path d="M-40 30 L-40 70 M40 30 L40 70 M-15 30 L-15 70 M15 30 L15 70" />
      </g>
    ))}
    <Fence y={1000} x0={-20} x1={700} />
    <Grass y0={680} f={f} />
  </>
);

/** An estancia: the ranch house under trees, wind pump, corral and a dirt track. */
const Estancia: SetFC = ({ f }) => (
  <>
    <rect width={1920} height={1080} fill="#b9d6ec" />
    <Clouds f={f} />
    <Hills y={600} />
    <path d="M820 1080 Q900 820 1060 640" stroke="#d2b07a" strokeWidth={110} fill="none" />
    <Tree x={260} y={640} s={1.1} f={f} />
    <Tree x={1640} y={630} s={1.2} f={f} c="#4f8a33" />
    <Tree x={1780} y={660} s={0.9} f={f} />
    <Farmhouse x={1180} y={640} s={1.1} f={f} wall="#f4ead2" roof="#a8452a" />
    <Windmill x={560} y={700} f={f} s={0.8} />
    <Fence y={860} x0={-20} x1={560} />
    <Fence y={880} x0={1300} x1={1940} />
    <Grass y0={740} f={f} n={45} />
  </>
);

/** Rolling countryside: hills, a river, farmhouses and woods. */
const Countryside: SetFC = ({ f }) => (
  <>
    <rect width={1920} height={1080} fill="#b4d4ec" />
    <Clouds f={f} />
    <path d="M0 520 L300 360 L560 500 L860 330 L1200 500 L1520 380 L1920 520 Z" fill="#9db4c8" stroke={ink} strokeWidth={4} />
    <Hills y={580} />
    <path d={`M-20 900 Q500 760 900 820 T1940 740`} stroke="#5aa6dc" strokeWidth={70} fill="none" />
    <path d={`M${-20 + (f % 60)} 900 Q500 760 900 820 T1940 740`} stroke="rgba(255,255,255,0.5)" strokeWidth={5} strokeDasharray="30 50" fill="none" />
    <Farmhouse x={420} y={650} s={0.7} f={f} />
    <Farmhouse x={1380} y={600} s={0.6} f={f + 20} wall="#efe0c4" roof="#8a5a2b" />
    {[180, 260, 1560, 1660, 1760].map((x, i) => <Tree key={x} x={x} y={640 + (i % 2) * 20} s={0.7} f={f} c={i % 2 ? "#4f8a33" : "#5f9a3c"} />)}
    <Grass y0={760} f={f} n={40} />
  </>
);

/** Plaza de Mayo: the pink Casa Rosada, palms, the May Pyramid, pigeons. */
const Plaza: SetFC = ({ f }) => (
  <>
    <rect width={1920} height={1080} fill="#b9d6ec" />
    <Clouds f={f} y={70} />
    <g stroke={ink} strokeWidth={5} strokeLinejoin="round">
      <rect x={360} y={260} width={1200} height={420} fill="#e7a3a0" />
      <rect x={760} y={170} width={400} height={510} fill="#e9aaa6" />
      <path d="M740 180 L960 90 L1180 180 Z" fill="#d48c88" />
      <rect x={890} y={520} width={140} height={160} rx={60} fill="#7a4a3a" />
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x={400 + i * 145 + (i >= 4 ? 260 : 0) - (i >= 4 ? 260 : 0)} y={320} width={60} height={110} rx={28} fill="#f6e1c8" />
      ))}
      <path d="M360 260 L1560 260" strokeWidth={14} />
      <rect x={830} y={240} width={260} height={40} fill="#f6e1c8" />
    </g>
    <rect y={680} width={1920} height={400} fill="#d8c9a8" />
    {Array.from({ length: 10 }).map((_, i) => <path key={i} d={`M${i * 220} 1080 L960 680`} stroke="#c7b690" strokeWidth={4} />)}
    <path d="M0 680 L1920 680" stroke={ink} strokeWidth={5} />
    <g stroke={ink} strokeWidth={5}>
      <rect x={180} y={520} width={60} height={240} fill="#f4f1ea" />
      <path d="M170 520 L210 440 L250 520 Z" fill="#f4f1ea" />
    </g>
    {[90, 1700, 1840].map((x, i) => (
      <g key={x} stroke={ink} strokeWidth={5}>
        <path d={`M${x} 760 Q${x + 10} 600 ${x} 460`} strokeWidth={14} stroke="#7a5233" fill="none" />
        {[-60, -20, 20, 60].map((a) => <path key={a} d={`M${x} 460 q${a} ${-30 + Math.sin(f / 20 + i) * 4} ${a * 2} 30`} stroke="#4f8a33" strokeWidth={14} fill="none" strokeLinecap="round" />)}
      </g>
    ))}
    {[0, 1, 2].map((i) => {
      const x = 600 + i * 260 + Math.sin(f / 9 + i) * 6;
      return <ellipse key={i} cx={x} cy={900 + (i % 2) * 40} rx={16} ry={10} fill="#8a8f99" stroke={ink} strokeWidth={3} />;
    })}
  </>
);

/** Modern Buenos Aires: towers, the Obelisk, a wide avenue with traffic. */
const Skyline: SetFC = ({ f }) => (
  <>
    <rect width={1920} height={1080} fill="#a8cbe6" />
    <Clouds f={f} y={60} />
    {Array.from({ length: 12 }).map((_, i) => {
      const h = 260 + ((i * 137) % 300);
      const x = i * 170 - 40;
      return (
        <g key={i} stroke={ink} strokeWidth={4}>
          <rect x={x} y={700 - h} width={150} height={h} fill={["#c9d4dd", "#b7c3cc", "#d9cfc0", "#aebfcc"][i % 4]} />
          {Array.from({ length: Math.floor(h / 60) }).map((_, r) => (
            <path key={r} d={`M${x + 20} ${720 - h + r * 60} L${x + 130} ${720 - h + r * 60}`} stroke="#8aa4ba" strokeWidth={10} />
          ))}
        </g>
      );
    })}
    <g stroke={ink} strokeWidth={5}>
      <path d="M930 700 L945 250 L960 220 L975 250 L990 700 Z" fill="#f4f1ea" />
    </g>
    <rect y={700} width={1920} height={380} fill="#7d7b78" />
    <path d="M0 700 L1920 700" stroke={ink} strokeWidth={5} />
    {Array.from({ length: 8 }).map((_, i) => <rect key={i} x={((i * 260 + f * 4) % 2200) - 140} y={880} width={120} height={14} fill="#f4f1ea" />)}
    {[0, 1, 2].map((i) => {
      const x = ((f * (5 + i) + i * 700) % 2400) - 240;
      return (
        <g key={i} transform={`translate(${x} ${800 + i * 70})`} stroke={ink} strokeWidth={4}>
          <rect x={-90} y={-50} width={180} height={50} rx={10} fill={["#e0a526", "#b23a2a", "#4f6d8f"][i]} />
          <rect x={-60} y={-80} width={110} height={34} rx={8} fill={["#e0a526", "#b23a2a", "#4f6d8f"][i]} />
          <circle cx={-50} cy={4} r={16} fill="#2b2622" />
          <circle cx={50} cy={4} r={16} fill="#2b2622" />
        </g>
      );
    })}
  </>
);

const SETS: Record<SetName, SetFC> = {
  pampas: Pampas,
  estancia: Estancia,
  countryside: Countryside,
  plaza: Plaza,
  skyline: Skyline,
  port: Port,
  street: Street,
  sky: Sky,
  fields: Fields,
  desert: Desert,
  palace: Palace,
  study: Study,
  "night-city": NightCity,
  village: Village,
  sea: Sea,
  battlefield: Battlefield,
  market: Market,
  shop: Shop,
  bank: Bank,
  home: Home,
  factory: Factory,
};
