import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { IconName } from "../schema";

const ink = "#2b2622";

const Coins: React.FC = () => (
  <g stroke={ink} strokeWidth={5}>
    {[0, 1, 2].map((stack) =>
      Array.from({ length: 4 + stack * 2 }).map((_, i) => (
        <ellipse key={`${stack}-${i}`} cx={60 + stack * 90} cy={300 - i * 22} rx={44} ry={14} fill="#f2c230" />
      )),
    )}
  </g>
);

const Bulb: React.FC = () => (
  <g stroke={ink} strokeWidth={5}>
    <circle cx={150} cy={150} r={130} fill="#fff6c2" opacity={0.6} stroke="none" />
    <circle cx={150} cy={130} r={62} fill="#ffe14d" />
    <rect x={124} y={186} width={52} height={40} rx={6} fill="#9aa0a6" />
  </g>
);

const Question: React.FC = () => (
  <text x={150} y={230} textAnchor="middle" fontSize={260} fontFamily="'Kalam', cursive" fill="#ffe14d" stroke={ink} strokeWidth={6} paintOrder="stroke">
    ?
  </text>
);

const Mound: React.FC = () => (
  <g stroke={ink} strokeWidth={5}>
    <path d="M10 300 Q150 80 290 300 Z" fill="#7a5a3a" />
    <path d="M40 260 Q150 150 260 260" fill="none" stroke="#5d4430" />
    <rect x={0} y={296} width={300} height={24} fill="#6aa0d8" stroke="none" />
  </g>
);

const Crown: React.FC = () => (
  <path d="M40 260 L50 110 L105 190 L150 90 L195 190 L250 110 L260 260 Z" fill="#f2c230" stroke={ink} strokeWidth={8} strokeLinejoin="round" />
);

const Camel: React.FC = () => (
  <g stroke={ink} strokeWidth={6} fill="#c9975a" strokeLinejoin="round">
    <path d="M60 190 Q90 110 130 170 Q160 100 200 170 L215 170 L230 120 L262 112 L270 130 L246 140 L238 200 Q220 215 200 210 L60 210 Z" />
    <path d="M80 210 L76 290 M110 210 L112 290 M180 210 L178 290 M205 208 L210 290" fill="none" />
  </g>
);

const Book: React.FC = () => (
  <g stroke={ink} strokeWidth={6} strokeLinejoin="round">
    <path d="M40 90 Q95 70 150 100 L150 270 Q95 240 40 260 Z" fill="#f4ecd8" />
    <path d="M260 90 Q205 70 150 100 L150 270 Q205 240 260 260 Z" fill="#efe2bf" />
  </g>
);


const Chest: React.FC = () => (
  <g stroke={ink} strokeWidth={6} strokeLinejoin="round">
    <ellipse cx={150} cy={140} rx={120} ry={60} fill="#ffe28a" opacity={0.5} stroke="none" />
    {[[100, 128], [130, 118], [160, 124], [190, 120], [120, 106], [170, 104]].map(([x, y], i) => (
      <ellipse key={i} cx={x} cy={y} rx={22} ry={9} fill="#f2c230" strokeWidth={4} />
    ))}
    <path d="M50 150 L250 150 L240 290 L60 290 Z" fill="#8a5a2b" />
    <path d="M50 150 Q150 60 250 150" fill="#a8713a" />
    <path d="M50 190 L250 190 M150 150 L150 290" stroke="#e0b84a" strokeWidth={10} />
    <rect x={136} y={176} width={28} height={30} rx={4} fill="#e0b84a" />
  </g>
);

const Hourglass: React.FC = () => (
  <g stroke={ink} strokeWidth={6} strokeLinejoin="round">
    <rect x={70} y={30} width={160} height={24} rx={6} fill="#8a5a2b" />
    <rect x={70} y={266} width={160} height={24} rx={6} fill="#8a5a2b" />
    <path d="M90 54 L210 54 Q210 120 160 160 Q210 200 210 266 L90 266 Q90 200 140 160 Q90 120 90 54 Z" fill="#dff1ff" />
    <path d="M110 70 L190 70 Q186 110 150 140 Q114 110 110 70 Z" fill="#e8c27a" strokeWidth={0} />
    <path d="M100 262 Q150 200 200 262 Z" fill="#e8c27a" strokeWidth={0} />
    <path d="M150 150 L150 240" stroke="#e8c27a" strokeWidth={5} strokeDasharray="6 8" />
  </g>
);

const Shield: React.FC = () => (
  <g stroke={ink} strokeWidth={7} strokeLinejoin="round">
    <path d="M150 30 L260 70 Q260 220 150 290 Q40 220 40 70 Z" fill="#b23a2a" />
    <path d="M150 60 L232 90 Q230 205 150 258 Q70 205 68 90 Z" fill="#e0b84a" />
    <path d="M150 60 L150 258 M68 140 L232 140" stroke="#b23a2a" strokeWidth={18} />
  </g>
);

const Scales: React.FC = () => (
  <g stroke={ink} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round">
    <path d="M150 40 L150 270 M90 270 L210 270" strokeWidth={10} />
    <path d="M40 90 L260 90" strokeWidth={8} />
    <path d="M60 90 L30 180 M60 90 L90 180 M240 90 L210 180 M240 90 L270 180" strokeWidth={3} />
    <path d="M20 180 Q60 220 100 180 Z" fill="#e0b84a" />
    <path d="M200 180 Q240 220 280 180 Z" fill="#e0b84a" />
    <circle cx={150} cy={40} r={12} fill="#e0b84a" />
  </g>
);

const Bag: React.FC = () => (
  <g stroke={ink} strokeWidth={7} strokeLinejoin="round">
    <path d="M110 90 Q60 150 60 210 Q60 290 150 290 Q240 290 240 210 Q240 150 190 90 Z" fill="#c9975a" />
    <path d="M110 90 L120 50 L180 50 L190 90 Z" fill="#a8713a" />
    <path d="M100 90 L200 90" stroke="#7a3b2e" strokeWidth={12} />
    <text x={150} y={240} textAnchor="middle" fontSize={110} fontFamily="'Kalam', cursive" fontWeight={700} fill="#f2c230" stroke={ink} strokeWidth={5} paintOrder="stroke">$</text>
  </g>
);

const SwordBig: React.FC = () => (
  <g stroke={ink} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round">
    <path d="M150 20 L172 60 L162 220 L138 220 L128 60 Z" fill="#d5dae1" />
    <path d="M150 40 L150 210" stroke="#9aa0a6" strokeWidth={4} />
    <path d="M90 220 L210 220" strokeWidth={22} stroke="#e0b84a" />
    <path d="M90 220 L210 220" strokeWidth={6} />
    <rect x={138} y={230} width={24} height={50} rx={6} fill="#6b4423" />
    <circle cx={150} cy={292} r={14} fill="#e0b84a" />
  </g>
);

const Exclaim: React.FC = () => (
  <text x={150} y={250} textAnchor="middle" fontSize={280} fontFamily="'Kalam', cursive" fontWeight={700} fill="#e0402b" stroke={ink} strokeWidth={8} paintOrder="stroke">
    !
  </text>
);

const Heart: React.FC = () => (
  <path d="M150 270 Q30 180 40 100 Q60 30 150 90 Q240 30 260 100 Q270 180 150 270 Z" fill="#e0402b" stroke={ink} strokeWidth={8} strokeLinejoin="round" />
);

const MAP: Record<IconName, React.FC | null> = {
  coins: Coins,
  bulb: Bulb,
  question: Question,
  mound: Mound,
  crown: Crown,
  camel: Camel,
  book: Book,
  none: null,
  chest: Chest,
  hourglass: Hourglass,
  shield: Shield,
  scales: Scales,
  bag: Bag,
  sword: SwordBig,
  exclaim: Exclaim,
  heart: Heart,
};

export const isCardIcon = (n: string): n is IconName => n in MAP;

export const Icon: React.FC<{ name: IconName; x?: number; y?: number; scale?: number; delay?: number; anim?: string }> = ({ name, x = 50, y = 50, scale = 1, delay = 0, anim = "bob" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const Comp = MAP[name];
  if (!Comp) return null;
  const local = frame - 3 - delay * fps;
  if (local < 0) return null;
  const s = spring({ frame: local, fps, config: { damping: 28, stiffness: 110 } });
  const size = 420 * scale;
  const idle =
    anim === "spin" ? `rotate(${local * 3}deg)` :
    anim === "shake" ? `rotate(${Math.sin(local / 4) * 3}deg)` :
    anim === "pulse" ? `scale(${1 + Math.sin(local / 5) * 0.06})` :
    anim === "none" ? "" : `translateY(${Math.sin(local / 24) * 8}px) rotate(${Math.sin(local / 30) * 2}deg)`;
  return (
    <svg
      viewBox="0 0 300 320"
      width={size}
      height={(size * 320) / 300}
      style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: `translate(-50%,-50%) scale(${s}) ${idle}` }}
    >
      <Comp />
    </svg>
  );
};
