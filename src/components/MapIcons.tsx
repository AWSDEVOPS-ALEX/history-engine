import React from "react";
import type { MapIcon } from "../schema";

const ink = "#2b2622";
const sw = 4;

/** Small map tokens, drawn centred on (0,0) in a ~100px box. `step` animates legs/waves. */
export const MapToken: React.FC<{ icon: MapIcon; step?: number; color?: string }> = ({ icon, step = 0, color }) => {
  const leg = Math.sin(step) * 8;
  switch (icon) {
    case "camel":
      return (
        <g stroke={ink} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
          <path d={`M-22 10 L${-26 + leg} 40 M-10 10 L${-8 - leg} 40 M16 10 L${14 + leg} 40 M26 8 L${28 - leg} 40`} fill="none" />
          <path d="M-34 12 Q-30 -22 -10 -6 Q4 -30 20 -6 L26 -6 L32 -30 L46 -32 L48 -24 L38 -20 L34 8 Q20 16 -34 12 Z" fill="#c9975a" />
          <rect x={-14} y={-14} width={20} height={10} rx={3} fill={color ?? "#b23a2a"} />
        </g>
      );
    case "horse":
      return (
        <g stroke={ink} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
          <path d={`M-22 6 L${-24 + leg} 36 M-12 6 L${-10 - leg} 36 M14 6 L${12 + leg} 36 M24 4 L${26 - leg} 36`} fill="none" />
          <path d="M-30 8 Q-30 -12 -10 -10 L20 -10 L32 -34 L46 -30 L40 -18 L30 4 Q0 14 -30 8 Z" fill="#7a5132" />
          <path d="M-12 -12 L-6 -32 L4 -12" fill={color ?? "#3f6f8f"} />
        </g>
      );
    case "ship": {
      const bob = Math.sin(step * 0.6) * 3;
      return (
        <g transform={`translate(0 ${bob}) rotate(${Math.sin(step * 0.5) * 4})`} stroke={ink} strokeWidth={sw} strokeLinejoin="round">
          <path d="M-42 6 L42 6 L30 26 L-30 26 Z" fill="#8a5a2b" />
          <path d="M0 6 L0 -46" />
          <path d="M2 -44 Q34 -24 2 0 Z" fill={color ?? "#f4ecd8"} />
          <path d="M-2 -40 Q-28 -22 -2 -2 Z" fill={color ?? "#efe2bf"} />
          <path d="M0 -46 L14 -42 L0 -38" fill="#b23a2a" />
        </g>
      );
    }
    case "soldier":
      return (
        <g stroke={ink} strokeWidth={sw} strokeLinecap="round">
          <path d={`M-6 18 L${-8 + leg / 2} 38 M6 18 L${8 - leg / 2} 38`} />
          <rect x={-12} y={-6} width={24} height={26} rx={5} fill={color ?? "#b23a2a"} />
          <circle cx={0} cy={-16} r={12} fill="#d9b48a" />
          <path d="M-13 -20 Q0 -36 13 -20 Z" fill="#9aa0a6" />
          <path d="M16 -40 L16 30" stroke="#6b4423" strokeWidth={5} />
          <path d="M16 -40 L12 -30 L20 -30 Z" fill="#c9ced6" />
        </g>
      );
    case "gold":
      return (
        <g stroke={ink} strokeWidth={sw}>
          {[[-18, 10], [0, 10], [18, 10], [-9, -6], [9, -6], [0, -22]].map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx={12} ry={8} fill="#f2c230" />
          ))}
        </g>
      );
    case "salt":
      return (
        <g stroke={ink} strokeWidth={sw} strokeLinejoin="round">
          <rect x={-30} y={-6} width={60} height={22} fill="#f4f1ea" transform="rotate(-6)" />
          <rect x={-24} y={-26} width={52} height={20} fill="#ffffff" transform="rotate(4)" />
        </g>
      );
    case "crown":
      return <path d="M-30 18 L-28 -16 L-14 2 L0 -26 L14 2 L28 -16 L30 18 Z" fill="#f2c230" stroke={ink} strokeWidth={sw} strokeLinejoin="round" />;
    case "book":
      return (
        <g stroke={ink} strokeWidth={sw} strokeLinejoin="round">
          <path d="M-34 -18 Q-16 -26 0 -14 L0 24 Q-16 14 -34 20 Z" fill="#f4ecd8" />
          <path d="M34 -18 Q16 -26 0 -14 L0 24 Q16 14 34 20 Z" fill="#efe2bf" />
        </g>
      );
    case "mosque":
      return (
        <g stroke={ink} strokeWidth={sw} fill="#c98a4b" strokeLinejoin="round">
          <rect x={-34} y={-4} width={68} height={30} />
          <rect x={-10} y={-40} width={20} height={66} />
          {[-28, -16, 16, 28].map((x) => (
            <path key={x} d={`M${x} -4 L${x} -14`} stroke="#6b4423" />
          ))}
          <path d="M-6 -30 L6 -30 M-6 -20 L6 -20" stroke="#6b4423" />
        </g>
      );
    case "tent":
      return (
        <g stroke={ink} strokeWidth={sw} strokeLinejoin="round">
          <path d="M-32 22 L0 -28 L32 22 Z" fill={color ?? "#e9d9a6"} />
          <path d="M0 -28 L-8 22 L8 22 Z" fill="#5a3d2b" />
        </g>
      );
    case "house":
      return (
        <g stroke={ink} strokeWidth={sw} strokeLinejoin="round">
          <path d="M-26 22 L-26 -4 L26 -4 L26 22 Z" fill="#c98a4b" />
          <path d="M-32 -2 L0 -30 L32 -2 Z" fill="#c9a24a" />
        </g>
      );
    case "swords":
      return (
        <g stroke={ink} strokeWidth={6} strokeLinecap="round">
          <path d="M-26 -26 L24 24 M26 -26 L-24 24" stroke="#c9ced6" strokeWidth={9} />
          <path d="M-26 -26 L24 24 M26 -26 L-24 24" fill="none" strokeWidth={2} />
          <path d="M10 10 L20 0 M-10 10 L-20 0" strokeWidth={6} stroke="#6b4423" />
        </g>
      );
    case "fire": {
      const f = Math.sin(step * 2) * 4;
      return (
        <g stroke={ink} strokeWidth={3} strokeLinejoin="round">
          <path d={`M0 ${-34 - f} Q22 -6 14 14 Q0 26 -14 14 Q-22 -6 0 ${-34 - f} Z`} fill="#f07a1a" />
          <path d={`M0 ${-14 - f / 2} Q10 2 6 12 Q0 18 -6 12 Q-10 2 0 ${-14 - f / 2} Z`} fill="#ffd34d" />
        </g>
      );
    }
    case "scroll":
      return (
        <g stroke={ink} strokeWidth={sw}>
          <rect x={-26} y={-20} width={52} height={40} fill="#efe2bf" />
          <rect x={-32} y={-24} width={10} height={48} rx={5} fill="#8a5a2b" />
          <rect x={22} y={-24} width={10} height={48} rx={5} fill="#8a5a2b" />
        </g>
      );
    case "castle":
      return (
        <g stroke={ink} strokeWidth={sw} strokeLinejoin="round">
          <rect x={-34} y={-10} width={68} height={36} fill="#b9a58a" />
          <rect x={-42} y={-34} width={20} height={60} fill="#c9b59a" />
          <rect x={22} y={-34} width={20} height={60} fill="#c9b59a" />
          {[-42, -32, 22, 32].map((x) => (
            <rect key={x} x={x} y={-42} width={10} height={10} fill="#c9b59a" />
          ))}
          <path d="M-8 26 L-8 6 Q0 -4 8 6 L8 26 Z" fill="#5a3d2b" />
          <path d="M-32 -34 L-32 -56" />
          <path d={`M-32 -56 L${-12 + Math.sin(step) * 3} -50 L-32 -44 Z`} fill={color ?? "#b23a2a"} />
        </g>
      );
    case "flag": {
      const w = Math.sin(step * 0.8) * 6;
      return (
        <g stroke={ink} strokeWidth={sw} strokeLinejoin="round">
          <path d="M-20 34 L-20 -46" strokeWidth={6} />
          <path d={`M-20 -46 Q0 ${-52 + w} 20 -46 T60 -46 L60 -12 Q40 ${-18 - w} 20 -12 T-20 -12 Z`} fill={color ?? "#b23a2a"} />
          <circle cx={-20} cy={-48} r={5} fill="#e0b84a" />
        </g>
      );
    }
    case "cattle":
      return (
        <g stroke={ink} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
          <path d={`M-24 8 L${-26 + leg / 2} 34 M-12 8 L${-10 - leg / 2} 34 M14 8 L${12 + leg / 2} 34 M24 8 L${26 - leg / 2} 34`} fill="none" />
          <rect x={-32} y={-14} width={58} height={28} rx={12} fill="#8a5a2b" />
          <circle cx={-6} cy={-2} r={7} fill="#f4ecd8" stroke="none" />
          <path d="M22 -16 L42 -18 L44 4 L28 8 Z" fill="#8a5a2b" />
          <path d="M28 -18 L24 -28 M40 -18 L44 -28" />
        </g>
      );
    case "wheat":
      return (
        <g stroke={ink} strokeWidth={3} strokeLinejoin="round">
          {[-16, 0, 16].map((x, i) => (
            <g key={i} transform={`rotate(${(i - 1) * 14} ${x} 34)`}>
              <path d={`M${x} 34 L${x} -30`} stroke="#b08a2e" strokeWidth={4} />
              {[-26, -14, -2, 10].map((y) => (
                <g key={y}>
                  <ellipse cx={x - 6} cy={y} rx={5} ry={9} fill="#e8c14a" transform={`rotate(-25 ${x - 6} ${y})`} />
                  <ellipse cx={x + 6} cy={y} rx={5} ry={9} fill="#e8c14a" transform={`rotate(25 ${x + 6} ${y})`} />
                </g>
              ))}
            </g>
          ))}
        </g>
      );
    case "soy":
      return (
        <g stroke={ink} strokeWidth={3}>
          <path d="M-30 10 Q0 -40 30 10 Q0 30 -30 10 Z" fill="#7aa83a" />
          {[-14, 0, 14].map((x) => (
            <circle key={x} cx={x} cy={4} r={8} fill="#d8c27a" />
          ))}
        </g>
      );
    case "train": {
      const puff = (step * 4) % 30;
      return (
        <g stroke={ink} strokeWidth={sw} strokeLinejoin="round">
          <circle cx={-26} cy={-38 - puff} r={8 + puff / 4} fill="#e8e8e8" opacity={1 - puff / 30} />
          <rect x={-40} y={-20} width={50} height={30} rx={4} fill="#2d5a7b" />
          <rect x={-34} y={-38} width={12} height={18} fill="#1e1a17" />
          <rect x={10} y={-30} width={30} height={40} fill="#b23a2a" />
          <rect x={16} y={-24} width={18} height={12} fill="#cfe8ff" />
          <path d="M-44 10 L-52 22 L-40 22 Z" fill="#9aa0a6" />
          {[-30, -10, 26].map((x) => (
            <circle key={x} cx={x} cy={16} r={9} fill="#1e1a17" />
          ))}
        </g>
      );
    }
    case "factory": {
      const puff = (step * 3) % 30;
      return (
        <g stroke={ink} strokeWidth={sw} strokeLinejoin="round">
          <circle cx={26} cy={-52 - puff} r={8 + puff / 3} fill="#d8d8d8" opacity={1 - puff / 30} />
          <rect x={18} y={-44} width={14} height={40} fill="#8a5a2b" />
          <path d="M-36 30 L-36 -6 L-16 -20 L-16 -6 L4 -20 L4 -6 L24 -20 L24 30 Z" fill="#c98a4b" />
          <rect x={-28} y={8} width={10} height={10} fill="#ffe28a" />
          <rect x={-8} y={8} width={10} height={10} fill="#ffe28a" />
        </g>
      );
    }
    case "banknotes":
      return (
        <g stroke={ink} strokeWidth={3} strokeLinejoin="round">
          {[0, 1, 2, 3].map((i) => (
            <g key={i} transform={`translate(${i * 3 - 4} ${-i * 9})`}>
              <rect x={-34} y={0} width={68} height={30} rx={3} fill={color ?? "#9fc49a"} />
              <circle cx={0} cy={15} r={8} fill="none" />
            </g>
          ))}
        </g>
      );
    case "dollar":
      return (
        <g stroke={ink} strokeWidth={3}>
          <rect x={-36} y={-18} width={72} height={36} rx={3} fill="#7fae7a" />
          <text y={11} textAnchor="middle" fontSize={30} fontWeight={700} fill="#1e4a1e" stroke="none" fontFamily="'Kalam', cursive">
            $
          </text>
        </g>
      );
    case "stamp":
      return (
        <g transform="rotate(-12)">
          <rect x={-58} y={-22} width={116} height={44} rx={6} fill="none" stroke="#c0281f" strokeWidth={6} />
          <text y={11} textAnchor="middle" fontSize={30} fontWeight={700} fill="#c0281f" fontFamily="'Kalam', cursive" letterSpacing={3}>
            DEFAULT
          </text>
        </g>
      );
    case "press": {
      const down = Math.abs(Math.sin(step)) * 10;
      return (
        <g stroke={ink} strokeWidth={sw} strokeLinejoin="round">
          <rect x={-40} y={10} width={80} height={24} fill="#5a3d2b" />
          <path d="M-30 10 L-30 -40 M30 10 L30 -40 M-36 -40 L36 -40" stroke="#5a3d2b" strokeWidth={8} />
          <path d={`M0 -40 L0 ${-18 + down}`} />
          <rect x={-24} y={-18 + down} width={48} height={10} fill="#9aa0a6" />
          <rect x={-22} y={0} width={44} height={10} fill="#9fc49a" />
        </g>
      );
    }
    case "chainsaw":
      return (
        <g stroke={ink} strokeWidth={sw} strokeLinejoin="round">
          <rect x={-40} y={-14} width={36} height={28} rx={6} fill="#e07b1f" />
          <path d="M-4 -8 L46 -8 Q54 0 46 8 L-4 8 Z" fill="#c9ced6" />
          <path d="M-36 -14 Q-36 -30 -16 -30 L-10 -14" fill="none" strokeWidth={6} />
        </g>
      );
    case "oil": {
      // Oil barrel — dark barrel with dripping oil
      const drip = Math.abs(Math.sin(step * 0.5)) * 6;
      return (
        <g stroke={ink} strokeWidth={sw} strokeLinejoin="round">
          <ellipse cx={0} cy={-26} rx={28} ry={9} fill="#2c2c2c" />
          <rect x={-28} y={-26} width={56} height={52} fill="#2c2c2c" />
          <ellipse cx={0} cy={26} rx={28} ry={9} fill="#1a1a1a" />
          <line x1={-28} y1={-10} x2={28} y2={-10} stroke="#444" strokeWidth={3} />
          <line x1={-28} y1={6} x2={28} y2={6} stroke="#444" strokeWidth={3} />
          <text x={0} y={4} textAnchor="middle" fontSize={22} fill="#f0a500" stroke="none" fontWeight="bold">OIL</text>
          <path d={`M0 26 Q4 ${32 + drip} 2 ${40 + drip}`} fill="none" stroke="#1a1a1a" strokeWidth={4} />
        </g>
      );
    }
    case "water": {
      // Water drop
      const wave = Math.sin(step * 0.7) * 3;
      return (
        <g stroke={ink} strokeWidth={sw} strokeLinejoin="round">
          <path d={`M0 -40 Q28 ${-10 + wave} 28 14 Q28 42 0 42 Q-28 42 -28 14 Q-28 ${-10 + wave} 0 -40 Z`} fill="#3498db" />
          <ellipse cx={-8} cy={2} rx={8} ry={12} fill="rgba(255,255,255,0.3)" transform="rotate(-20,-8,2)" />
        </g>
      );
    }
    case "diamond": {
      return (
        <g stroke={ink} strokeWidth={sw} strokeLinejoin="round">
          <path d="M0 -44 L32 -16 L0 44 L-32 -16 Z" fill="#74d7ff" />
          <path d="M-32 -16 L0 -44 L32 -16 L0 2 Z" fill="#b8eeff" />
          <path d="M-32 -16 L0 2 L32 -16" fill="none" />
        </g>
      );
    }
    default:
      return null;
  }
};
