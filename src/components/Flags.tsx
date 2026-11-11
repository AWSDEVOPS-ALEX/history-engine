import React from "react";

/** National flags drawn in code (public-domain designs), on a 90×60 box with its top-left at 0,0. */
export type FlagCode = "ar" | "gb" | "us" | "ca" | "fr" | "de" | "it" | "es" | "br" | "cn" | "jp" | "sg" | "my" | "id" | "in" | "tw";

const W = 90;
const H = 60;

const Star: React.FC<{ x: number; y: number; r: number; rot?: number; fill: string }> = ({ x, y, r, rot = 0, fill }) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = ((i * 36 - 90 + rot) * Math.PI) / 180;
    const rr = i % 2 ? r * 0.4 : r;
    return `${x + Math.cos(a) * rr},${y + Math.sin(a) * rr}`;
  }).join(" ");
  return <polygon points={pts} fill={fill} />;
};

export const FlagArt: React.FC<{ code: FlagCode }> = ({ code }) => {
  switch (code) {
    case "ar":
      return (
        <>
          <rect width={W} height={H} fill="#74acdf" />
          <rect y={H / 3} width={W} height={H / 3} fill="#ffffff" />
          <circle cx={W / 2} cy={H / 2} r={7} fill="#f6b40e" stroke="#85340a" strokeWidth={1} />
        </>
      );
    case "gb":
      return (
        <>
          <rect width={W} height={H} fill="#012169" />
          <path d={`M0 0 L${W} ${H} M${W} 0 L0 ${H}`} stroke="#fff" strokeWidth={12} />
          <path d={`M0 0 L${W} ${H} M${W} 0 L0 ${H}`} stroke="#c8102e" strokeWidth={4} />
          <path d={`M${W / 2} 0 V${H} M0 ${H / 2} H${W}`} stroke="#fff" strokeWidth={18} />
          <path d={`M${W / 2} 0 V${H} M0 ${H / 2} H${W}`} stroke="#c8102e" strokeWidth={10} />
        </>
      );
    case "us":
      return (
        <>
          {Array.from({ length: 13 }).map((_, i) => <rect key={i} y={(i * H) / 13} width={W} height={H / 13 + 0.5} fill={i % 2 ? "#ffffff" : "#b22234"} />)}
          <rect width={W * 0.42} height={(H * 7) / 13} fill="#3c3b6e" />
          {Array.from({ length: 20 }).map((_, i) => <circle key={i} cx={4 + (i % 5) * 7.5} cy={4 + Math.floor(i / 5) * 7.5} r={1.4} fill="#fff" />)}
        </>
      );
    case "ca":
      return (
        <>
          <rect width={W} height={H} fill="#ffffff" />
          <rect width={W / 4} height={H} fill="#d52b1e" />
          <rect x={(W * 3) / 4} width={W / 4} height={H} fill="#d52b1e" />
          <path d="M45 12 L49 22 L55 19 L53 32 L60 26 L60 31 L56 35 L58 38 L49 38 L47 48 L43 48 L41 38 L32 38 L34 35 L30 31 L30 26 L37 32 L35 19 L41 22 Z" fill="#d52b1e" />
        </>
      );
    case "fr":
      return (
        <>
          <rect width={W / 3} height={H} fill="#0055a4" />
          <rect x={W / 3} width={W / 3} height={H} fill="#ffffff" />
          <rect x={(W * 2) / 3} width={W / 3} height={H} fill="#ef4135" />
        </>
      );
    case "de":
      return (
        <>
          <rect width={W} height={H / 3} fill="#000000" />
          <rect y={H / 3} width={W} height={H / 3} fill="#dd0000" />
          <rect y={(H * 2) / 3} width={W} height={H / 3} fill="#ffce00" />
        </>
      );
    case "it":
      return (
        <>
          <rect width={W / 3} height={H} fill="#009246" />
          <rect x={W / 3} width={W / 3} height={H} fill="#ffffff" />
          <rect x={(W * 2) / 3} width={W / 3} height={H} fill="#ce2b37" />
        </>
      );
    case "es":
      return (
        <>
          <rect width={W} height={H} fill="#aa151b" />
          <rect y={H / 4} width={W} height={H / 2} fill="#f1bf00" />
        </>
      );
    case "br":
      return (
        <>
          <rect width={W} height={H} fill="#009c3b" />
          <path d={`M${W / 2} 6 L${W - 8} ${H / 2} L${W / 2} ${H - 6} L8 ${H / 2} Z`} fill="#ffdf00" />
          <circle cx={W / 2} cy={H / 2} r={13} fill="#002776" />
          <path d={`M${W / 2 - 13} ${H / 2 - 2} Q${W / 2} ${H / 2 - 7} ${W / 2 + 13} ${H / 2 + 3}`} stroke="#fff" strokeWidth={2.5} fill="none" />
        </>
      );
    case "cn":
      return (
        <>
          <rect width={W} height={H} fill="#de2910" />
          <Star x={15} y={15} r={9} fill="#ffde00" />
          {[[30, 6], [36, 12], [36, 21], [30, 27]].map(([x, y], i) => <Star key={i} x={x} y={y} r={3} rot={i * 20} fill="#ffde00" />)}
        </>
      );
    case "jp":
      return (
        <>
          <rect width={W} height={H} fill="#ffffff" />
          <circle cx={W / 2} cy={H / 2} r={18} fill="#bc002d" />
        </>
      );
    case "sg": {
      // Red over white; crescent + 5-pointed star ring on red half
      const cx = 22, cy = 30, cr = 12;
      const starRing = Array.from({ length: 5 }, (_, i) => {
        const a = (i * 72 - 90) * Math.PI / 180;
        return [cx + 26 + Math.cos(a) * 10, cy + Math.sin(a) * 10] as [number, number];
      });
      const starPath = (sx: number, sy: number, r: number) =>
        Array.from({ length: 10 }, (_, i) => {
          const a = (i * 36 - 90) * Math.PI / 180;
          const rr = i % 2 ? r * 0.4 : r;
          return `${sx + Math.cos(a) * rr},${sy + Math.sin(a) * rr}`;
        }).join(" ");
      return (
        <>
          <rect width={W} height={H} fill="#ef3340" />
          <rect y={H / 2} width={W} height={H / 2} fill="#ffffff" />
          {/* crescent */}
          <circle cx={cx} cy={cy} r={cr} fill="#ffffff" />
          <circle cx={cx + 5} cy={cy} r={cr * 0.78} fill="#ef3340" />
          {/* 5 stars */}
          {starRing.map(([sx, sy], i) => (
            <polygon key={i} points={starPath(sx, sy, 4.5)} fill="#ffffff" />
          ))}
        </>
      );
    }
    case "my": {
      // 14 red-and-white stripes; blue canton with crescent + 14-point star
      const stripes = Array.from({ length: 14 }, (_, i) => (
        <rect key={i} y={(i * H) / 14} width={W} height={H / 14 + 0.5} fill={i % 2 === 0 ? "#cc0001" : "#ffffff"} />
      ));
      const starPath14 = (sx: number, sy: number) => Array.from({ length: 28 }, (_, i) => {
        const a = (i * (360 / 28) - 90) * Math.PI / 180;
        const r = i % 2 === 0 ? 7 : 3.2;
        return `${sx + Math.cos(a) * r},${sy + Math.sin(a) * r}`;
      }).join(" ");
      return (
        <>
          {stripes}
          <rect width={W * 0.5} height={(H * 7) / 14} fill="#010066" />
          <circle cx={18} cy={H * 0.25} r={8} fill="#fc0" />
          <circle cx={22} cy={H * 0.25} r={6.4} fill="#010066" />
          <polygon points={starPath14(36, H * 0.25)} fill="#fc0" />
        </>
      );
    }
    case "id":
      return (
        <>
          <rect width={W} height={H / 2} fill="#ce1126" />
          <rect y={H / 2} width={W} height={H / 2} fill="#ffffff" />
        </>
      );
    case "in":
      return (
        <>
          <rect width={W} height={H / 3} fill="#ff9933" />
          <rect y={H / 3} width={W} height={H / 3} fill="#ffffff" />
          <rect y={(H * 2) / 3} width={W} height={H / 3} fill="#138808" />
          <circle cx={W / 2} cy={H / 2} r={8} fill="#000080" />
        </>
      );
    case "tw":
      // Red field, blue canton top-left with white sun
      return (
        <>
          <rect width={W} height={H} fill="#fe0000" />
          <rect width={W * 0.5} height={H / 2} fill="#000095" />
          <circle cx={W * 0.25} cy={H / 4} r={9} fill="#ffffff" />
          <circle cx={W * 0.25} cy={H / 4} r={5.5} fill="#000095" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * 30 - 90) * Math.PI / 180;
            const r1 = 9, r2 = 12;
            return (
              <line key={i}
                x1={W * 0.25 + Math.cos(a) * r1} y1={H / 4 + Math.sin(a) * r1}
                x2={W * 0.25 + Math.cos(a) * r2} y2={H / 4 + Math.sin(a) * r2}
                stroke="#ffffff" strokeWidth={1.8}
              />
            );
          })}
        </>
      );
  }
};

/** A flag on a pole, waving gently. Origin = foot of the pole. */
export const FlagPole: React.FC<{ code: FlagCode; f: number; s?: number }> = ({ code, f, s = 1 }) => {
  const wave = Math.sin(f / 9) * 4;
  const id = `fc${code}`;
  return (
    <g transform={`scale(${s})`}>
      <ellipse cx={0} cy={2} rx={16} ry={5} fill="rgba(0,0,0,0.35)" />
      <path d="M0 0 L0 -150" stroke="#2b2622" strokeWidth={6} strokeLinecap="round" />
      <circle cx={0} cy={-152} r={6} fill="#e0b84a" stroke="#2b2622" strokeWidth={2} />
      <defs>
        <clipPath id={id}>
          <path d={`M0 0 Q22 ${-wave} 45 0 T90 ${wave} L90 ${60 + wave} Q68 ${60 + wave * 2} 45 60 T0 60 Z`} />
        </clipPath>
      </defs>
      <g transform="translate(3 -146)">
        <g clipPath={`url(#${id})`}>
          <FlagArt code={code} />
          <rect width={W} height={H + 10} fill="rgba(0,0,0,0.08)" transform={`translate(${45 + wave * 3} 0)`} />
        </g>
        <path d={`M0 0 Q22 ${-wave} 45 0 T90 ${wave} L90 ${60 + wave} Q68 ${60 + wave * 2} 45 60 T0 60 Z`} fill="none" stroke="#2b2622" strokeWidth={2.5} />
      </g>
    </g>
  );
};
