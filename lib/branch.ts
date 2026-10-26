// Мөчрийн геометр (хэвтээ, 520×200 координат). Branch.tsx болон OG зураг хуваалцана.

export const BRANCH_W = 520;
export const BRANCH_H = 200;

export const STEM =
  "M8 132 C 70 118, 120 142, 190 126 S 300 104, 360 98 S 460 74, 512 58";

export type Twig = { path: string; tip: [number, number]; petals: number };

export const TWIGS: Twig[] = [
  { path: "M52 124 Q 62 94, 82 66", tip: [82, 66], petals: 5 },
  { path: "M128 130 Q 138 154, 158 170", tip: [158, 170], petals: 6 },
  { path: "M206 122 Q 214 90, 236 58", tip: [236, 58], petals: 7 },
  { path: "M286 108 Q 300 138, 322 156", tip: [322, 156], petals: 5 },
  { path: "M366 94 Q 378 64, 402 40", tip: [402, 40], petals: 6 },
  { path: "M446 76 Q 462 102, 486 116", tip: [486, 116], petals: 7 },
];

/** Өргөст утасны «X» зангилаа (0,0 төвтэй) */
export const THORN_PATH =
  "M-11 -9 L11 9 M-11 9 L11 -9 M-4 -2 Q0 -6 4 -2 Q0 2 -4 -2";

export function petalPath(r: number) {
  const a = r * 0.42;
  return `M0 0 C ${a} ${-r * 0.3}, ${a} ${-r * 0.92}, 0 ${-r} C ${-a} ${-r * 0.92}, ${-a} ${-r * 0.3}, 0 0Z`;
}

/** Статик SVG мөр (OG зураг, favicon гэх мэтэд) — бүх цэцэг дэлбэрсэн. */
export function bloomedBranchSvg(opts: { rim?: string } = {}) {
  const rim = opts.rim ?? "rgba(231,181,110,0.45)";
  const flowers = TWIGS.map(({ tip: [x, y], petals }, i) => {
    const outer = Array.from({ length: petals }, (_, k) =>
      `<path d="${petalPath(22)}" fill="#E0623F" transform="rotate(${(360 / petals) * k + i * 13})"/>`,
    ).join("");
    const inner = Array.from({ length: petals }, (_, k) =>
      `<path d="${petalPath(12)}" fill="#F08A5D" transform="rotate(${(360 / petals) * k + 180 / petals + i * 13})"/>`,
    ).join("");
    return `<g transform="translate(${x} ${y})">${outer}${inner}<circle r="4.5" fill="#E7B56E"/></g>`;
  }).join("");
  const lines = [STEM, ...TWIGS.map((t) => t.path)]
    .map(
      (d) =>
        `<path d="${d}" fill="none" stroke="${rim}" stroke-width="7" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#1A1A1C" stroke-width="4.5" stroke-linecap="round"/>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BRANCH_W} ${BRANCH_H}" width="${BRANCH_W}" height="${BRANCH_H}">${lines}${flowers}</svg>`;
}
