import React from "react";
import { useCurrentFrame } from "remotion";
import type { CharacterSpec, Pose } from "../schema";

/**
 * Cartoon puppet. One rig builds every person in the show: the mascot,
 * kings, merchants, soldiers. Drawn in a 300x620 box, feet at the bottom.
 * `mouth` is 0 (closed) to 1 (wide open), driven by the voice.
 */
export const Character: React.FC<{
  spec: CharacterSpec;
  pose?: Pose;
  mouth?: number;
  height?: number; // px
  flip?: boolean;
  seed?: number;
  talking?: boolean; // gestures and head movement while this character speaks
}> = ({ spec, pose = "talk", mouth = 0, height = 520, flip = false, seed = 0, talking = false }) => {
  const frame = useCurrentFrame();
  const skin = spec.skin ?? "#e9c9a3";
  const robe = spec.robe ?? "#3f6f8f";
  const trim = spec.trim ?? "#d9b44a";
  const ink = "#2b2622";
  const sw = 5;
  const bob = Math.sin((frame + seed * 13) / 14) * 2.5;
  const blink = (frame + seed * 37) % 110 < 4;

  // Arm end points (shoulders at 112,300 and 188,300)
  const arms: Record<Pose, [number, number, number, number]> = {
    talk: [78, 410, 222, 410],
    point: [78, 410, 282, 285],
    angry: [70, 250, 230, 250],
    confused: [78, 410, 245, 245],
    happy: [60, 230, 240, 230],
    shrug: [55, 300, 245, 300],
  };
  let [lx, ly, rx, ry] = arms[pose];
  // talking: the free hand gestures in slow loops, the other arm sways a little
  const g = (frame + seed * 17) / 9;
  if (talking && (pose === "talk" || pose === "confused" || pose === "shrug")) {
    rx += Math.sin(g) * 22 + 18;
    ry += -Math.abs(Math.sin(g * 0.7)) * 70 - 20;
  } else if (talking && pose === "point") {
    ry += Math.sin(g * 1.3) * 10;
  }
  if (talking) ly += Math.sin(g * 0.5) * 6;
  const tilt = talking ? Math.sin(g * 0.6) * 4 : Math.sin((frame + seed * 5) / 40) * 1.2;

  const browY = 142;
  const brows =
    pose === "angry"
      ? [<path key="l" d={`M112 ${browY - 8} L140 ${browY + 4}`} />, <path key="r" d={`M188 ${browY - 8} L160 ${browY + 4}`} />]
      : pose === "confused"
        ? [<path key="l" d={`M114 ${browY} L138 ${browY}`} />, <path key="r" d={`M162 ${browY - 14} Q175 ${browY - 22} 188 ${browY - 12}`} />]
        : [<path key="l" d={`M114 ${browY - 2} Q126 ${browY - 8} 138 ${browY - 2}`} />, <path key="r" d={`M162 ${browY - 2} Q174 ${browY - 8} 186 ${browY - 2}`} />];

  const m = Math.max(0, Math.min(1, mouth));
  const mouthEl =
    m > 0.08 ? (
      <ellipse cx={150} cy={203} rx={13 + m * 4} ry={4 + m * 13} fill="#7a1f1f" stroke={ink} strokeWidth={4} />
    ) : pose === "happy" ? (
      <path d="M134 198 Q150 214 166 198" fill="none" stroke={ink} strokeWidth={4} strokeLinecap="round" />
    ) : pose === "angry" ? (
      <path d="M136 206 Q150 198 164 206" fill="none" stroke={ink} strokeWidth={4} strokeLinecap="round" />
    ) : (
      <path d="M138 203 L162 203" stroke={ink} strokeWidth={4} strokeLinecap="round" />
    );

  const hatColor = spec.hatColor ?? "#5a3d2b";
  const hat = (() => {
    switch (spec.hat) {
      case "crown":
        return <path d="M100 112 L104 62 L127 90 L150 52 L173 90 L196 62 L200 112 Z" fill="#f2c230" stroke={ink} strokeWidth={sw} strokeLinejoin="round" />;
      case "turban":
        return (
          <g>
            <ellipse cx={150} cy={100} rx={80} ry={44} fill={hatColor} stroke={ink} strokeWidth={sw} />
            <path d="M80 104 Q150 70 220 100 M86 86 Q150 56 214 84" fill="none" stroke={ink} strokeWidth={3} opacity={0.5} />
            <circle cx={150} cy={90} r={9} fill={trim} stroke={ink} strokeWidth={3} />
          </g>
        );
      case "cap":
        return <path d="M84 118 Q88 58 150 54 Q212 58 216 118 Z" fill={hatColor} stroke={ink} strokeWidth={sw} />;
      case "tallhat":
        return (
          <g>
            <rect x={104} y={22} width={92} height={92} rx={8} fill={hatColor} stroke={ink} strokeWidth={sw} />
            <rect x={78} y={106} width={144} height={16} rx={8} fill={hatColor} stroke={ink} strokeWidth={sw} />
          </g>
        );
      case "hood":
        return <path d="M70 200 Q60 70 150 56 Q240 70 230 200 Q220 120 150 112 Q80 120 70 200 Z" fill={hatColor} stroke={ink} strokeWidth={sw} />;
      case "helmet":
        return (
          <g>
            <path d="M82 124 Q84 52 150 48 Q216 52 218 124 Z" fill="#b9bec6" stroke={ink} strokeWidth={sw} />
            <path d="M150 48 L150 124" stroke={ink} strokeWidth={3} />
          </g>
        );
      case "brim":
        return (
          <g>
            <ellipse cx={150} cy={112} rx={104} ry={20} fill={hatColor} stroke={ink} strokeWidth={sw} />
            <path d="M98 112 Q100 56 150 54 Q200 56 202 112 Z" fill={hatColor} stroke={ink} strokeWidth={sw} />
            <path d="M100 98 Q150 106 200 98" stroke={trim} strokeWidth={7} fill="none" />
          </g>
        );
      case "peaked":
        return (
          <g>
            <path d="M86 112 Q84 70 150 62 Q216 70 214 112 Z" fill={hatColor} stroke={ink} strokeWidth={sw} />
            <path d="M88 110 L212 110" stroke={trim} strokeWidth={8} />
            <path d="M92 116 Q60 124 70 132 Q120 132 150 120 Z" fill="#1e1a17" />
            <circle cx={150} cy={88} r={9} fill={trim} stroke={ink} strokeWidth={3} />
          </g>
        );
      case "mitre":
        return <path d="M108 116 L114 40 Q150 10 186 40 L192 116 Z" fill="#f4f0e4" stroke={ink} strokeWidth={sw} />;
      default:
        return null;
    }
  })();

  const beard =
    spec.beard === "long" ? (
      <path d="M96 180 Q100 290 150 300 Q200 290 204 180 Q176 222 150 224 Q124 222 96 180 Z" fill={spec.beardColor ?? "#4a3628"} stroke={ink} strokeWidth={sw} />
    ) : spec.beard === "short" ? (
      <path d="M100 186 Q108 250 150 254 Q192 250 200 186 Q176 222 150 224 Q124 222 100 186 Z" fill={spec.beardColor ?? "#4a3628"} stroke={ink} strokeWidth={sw} />
    ) : null;

  const prop = (() => {
    const hx = rx;
    const hy = ry;
    switch (spec.prop) {
      case "lantern":
        return (
          <g transform={`translate(${hx - 22},${hy})`}>
            <path d="M22 0 L22 14" stroke={ink} strokeWidth={4} />
            <rect x={4} y={14} width={36} height={50} rx={6} fill="#ffe28a" stroke={ink} strokeWidth={sw} />
            <circle cx={22} cy={40} r={30} fill="#ffd54a" opacity={0.25 + 0.08 * Math.sin(frame / 5)} />
            <path d="M4 26 L40 26 M4 52 L40 52" stroke={ink} strokeWidth={3} />
          </g>
        );
      case "staff":
        return <path d={`M${hx} ${hy - 160} L${hx} ${hy + 190}`} stroke="#6b4423" strokeWidth={9} strokeLinecap="round" />;
      case "scroll":
        return (
          <g transform={`translate(${hx - 14},${hy - 40}) rotate(15)`}>
            <rect x={0} y={0} width={30} height={80} rx={6} fill="#efe2bf" stroke={ink} strokeWidth={4} />
          </g>
        );
      case "sword":
        return <path d={`M${hx} ${hy} L${hx + 10} ${hy - 150}`} stroke="#c9ced6" strokeWidth={10} strokeLinecap="round" />;
      case "coin":
        return <circle cx={hx} cy={hy - 10} r={18} fill="#f2c230" stroke={ink} strokeWidth={4} />;
      default:
        return null;
    }
  })();

  const w = (height * 300) / 620;
  return (
    <svg viewBox="0 0 300 620" width={w} height={height} style={{ overflow: "visible", transform: flip ? "scaleX(-1)" : undefined }}>
      <g transform={`translate(0 ${bob})`} strokeLinecap="round" strokeLinejoin="round">
        {/* legs */}
        <path d="M132 470 L124 590 M168 470 L176 590" stroke={ink} strokeWidth={sw} fill="none" />
        {spec.sandals ? (
          <g stroke={ink} strokeWidth={3}>
            <path d="M98 598 Q100 584 122 586 Q134 590 132 598 Z" fill="#8a5a2b" />
            <path d="M168 598 Q166 584 188 586 Q202 590 202 598 Z" fill="#8a5a2b" />
            <path d="M112 586 L122 576 M184 586 L176 576" />
          </g>
        ) : (
          <>
            <ellipse cx={116} cy={594} rx={18} ry={8} fill={ink} />
            <ellipse cx={184} cy={594} rx={18} ry={8} fill={ink} />
          </>
        )}
        {/* robe */}
        <path d="M118 262 Q150 250 182 262 L206 478 Q150 492 94 478 Z" fill={robe} stroke={ink} strokeWidth={sw} />
        <path d="M150 262 L150 480" stroke={trim} strokeWidth={6} />
        <path d="M100 462 Q150 476 200 462" stroke={trim} strokeWidth={6} fill="none" />
        {spec.pattern === "stripes" ? (
          <g stroke={trim} strokeWidth={5} fill="none">
            <path d="M98 440 Q150 454 202 440" />
            <path d="M101 422 Q150 436 199 422" stroke={spec.belt ?? "#7a3b2e"} />
          </g>
        ) : spec.pattern === "diamonds" ? (
          <g fill={trim} stroke={ink} strokeWidth={2}>
            {[110, 132, 154, 176, 196].map((x) => (
              <path key={x} d={`M${x} 436 l9 -10 l9 10 l-9 10 Z`} transform={`translate(-9 0)`} />
            ))}
          </g>
        ) : null}
        {spec.belt ? <path d="M108 372 Q150 384 192 372" stroke={spec.belt} strokeWidth={14} fill="none" /> : null}
        {spec.belt ? <rect x={140} y={366} width={20} height={18} rx={3} fill="#e0b84a" stroke={ink} strokeWidth={3} /> : null}
        {spec.satchel ? (
          <g stroke={ink} strokeWidth={4} strokeLinejoin="round">
            <path d="M122 268 L196 400" stroke="#6b4423" strokeWidth={9} fill="none" />
            <path d="M176 388 L224 384 L228 438 Q204 448 180 440 Z" fill="#9a6a3a" />
            <path d="M176 388 L226 384 L224 406 Q200 412 178 408 Z" fill="#7a5132" />
            <rect x={186} y={364} width={12} height={28} rx={5} fill="#efe2bf" transform="rotate(-12 192 378)" />
            <rect x={202} y={360} width={12} height={30} rx={5} fill="#efe2bf" transform="rotate(8 208 375)" />
          </g>
        ) : null}
        {/* staff in the left hand (drawn before the arm so the hand grips it) */}
        {spec.staff && spec.staff !== "none" ? (
          <g strokeLinecap="round">
            <path d={`M${lx} ${ly - 250} L${lx} ${Math.min(604, ly + 190)}`} stroke={ink} strokeWidth={15} />
            <path d={`M${lx} ${ly - 250} L${lx} ${Math.min(604, ly + 190)}`} stroke="#8a5a2b" strokeWidth={9} />
            <path d={`M${lx - 3} ${ly - 200} L${lx - 3} ${ly + 120}`} stroke="#a8713a" strokeWidth={2} />
            {[ly - 222, ly - 40, ly + 60].map((y, k) => (
              <rect key={k} x={lx - 9} y={y} width={18} height={9} rx={3} fill="#e0b84a" stroke={ink} strokeWidth={3} />
            ))}
            {spec.staff === "chronicler" ? (
              <g>
                {/* carved crook */}
                <path d={`M${lx} ${ly - 250} Q${lx} ${ly - 300} ${lx - 34} ${ly - 298} Q${lx - 62} ${ly - 292} ${lx - 56} ${ly - 262}`} fill="none" stroke={ink} strokeWidth={15} />
                <path d={`M${lx} ${ly - 250} Q${lx} ${ly - 300} ${lx - 34} ${ly - 298} Q${lx - 62} ${ly - 292} ${lx - 56} ${ly - 262}`} fill="none" stroke="#8a5a2b" strokeWidth={9} />
                <circle cx={lx} cy={ly - 252} r={10} fill="#e0b84a" stroke={ink} strokeWidth={3} />
                {/* hanging lantern, swinging */}
                <g transform={`rotate(${Math.sin((frame + seed * 11) / 11) * 8} ${lx - 56} ${ly - 262})`}>
                  <path d={`M${lx - 56} ${ly - 262} L${lx - 56} ${ly - 244}`} stroke={ink} strokeWidth={3} />
                  <circle cx={lx - 56} cy={ly - 214} r={36} fill="#ffd54a" opacity={0.22 + 0.08 * Math.sin(frame / 5)} />
                  <path d={`M${lx - 72} ${ly - 244} L${lx - 40} ${ly - 244} L${lx - 44} ${ly - 236} L${lx - 68} ${ly - 236} Z`} fill="#5a3d2b" stroke={ink} strokeWidth={3} />
                  <rect x={lx - 70} y={ly - 236} width={28} height={40} rx={5} fill="#ffe28a" stroke={ink} strokeWidth={4} />
                  <path d={`M${lx - 56} ${ly - 230} Q${lx - 62} ${ly - 216} ${lx - 56} ${ly - 206} Q${lx - 62} ${ly - 216} ${lx - 56} ${ly - 230} Z`} fill="#f07a1a" />
                  <rect x={lx - 72} y={ly - 196} width={32} height={7} rx={2} fill="#5a3d2b" stroke={ink} strokeWidth={3} />
                </g>
                {/* cloth ribbon tied below the crook */}
                <path d={`M${lx} ${ly - 236} q${22 + Math.sin(frame / 6) * 6} 14 ${30 + Math.sin(frame / 6) * 8} 44`} stroke="#b23a2a" strokeWidth={8} fill="none" />
              </g>
            ) : null}
          </g>
        ) : null}
        {/* arms */}
        <path d={`M112 300 L${lx} ${ly}`} stroke={ink} strokeWidth={sw} fill="none" />
        <path d={`M188 300 L${rx} ${ry}`} stroke={ink} strokeWidth={sw} fill="none" />
        <circle cx={lx} cy={ly} r={8} fill={skin} stroke={ink} strokeWidth={4} />
        <circle cx={rx} cy={ry} r={8} fill={skin} stroke={ink} strokeWidth={4} />
        {prop}
        {/* head */}
        <g transform={`rotate(${tilt} 150 250)`}>
        {spec.hat === "hood" ? hat : null}
        <circle cx={150} cy={170} r={70} fill={skin} stroke={ink} strokeWidth={sw} />
        {spec.bun && spec.hair ? <circle cx={150} cy={92} r={30} fill={spec.hair} stroke={ink} strokeWidth={4} /> : null}
        {spec.hair && spec.hat !== "hood" ? (
          <path d="M82 160 Q84 100 150 98 Q216 100 218 160 Q200 124 150 122 Q100 124 82 160 Z" fill={spec.hair} stroke={ink} strokeWidth={4} />
        ) : null}
        {beard}
        <g stroke={ink} strokeWidth={4} fill="none">{brows}</g>
        {blink ? (
          <path d="M118 166 L136 166 M164 166 L182 166" stroke={ink} strokeWidth={4} />
        ) : (
          <g fill={ink}>
            <circle cx={127} cy={166} r={7} />
            <circle cx={173} cy={166} r={7} />
          </g>
        )}
        {spec.glasses ? (
          <g fill="none" stroke={ink} strokeWidth={4}>
            <circle cx={127} cy={166} r={17} />
            <circle cx={173} cy={166} r={17} />
            <path d="M144 166 L156 166" />
          </g>
        ) : null}
        {mouthEl}
        {spec.hat !== "hood" ? hat : null}
        </g>
      </g>
    </svg>
  );
};
