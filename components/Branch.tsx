"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import {
  BRANCH_H,
  BRANCH_W,
  STEM,
  THORN_PATH,
  TWIGS,
  petalPath,
} from "@/lib/branch";

type Props = {
  /** Хэдэн өргөс цэцэг болсон (0–6) */
  bloomed: number;
  orientation?: "horizontal" | "vertical";
  /** Салхинд ганхах (үр дүнгийн хуудас) */
  sway?: boolean;
  /** false бол ямар ч хөдөлгөөнгүй (хуваалцах карт) */
  animated?: boolean;
  /** Мөчрийн ирмэгийн алтлаг гэрэл */
  rim?: string;
  className?: string;
  label?: string;
};

// Санамсаргүй мэт боловч hydration-д тогтвортой фаз
const SWAY = [
  { duration: 3.4, delay: 0.2 },
  { duration: 4.6, delay: 1.1 },
  { duration: 3.9, delay: 0.6 },
  { duration: 4.2, delay: 1.7 },
  { duration: 3.1, delay: 0.9 },
  { duration: 4.0, delay: 0.4 },
];

const SPARKS = 8;

export default function Branch({
  bloomed,
  orientation = "horizontal",
  sway = false,
  animated = true,
  rim = "rgba(231,181,110,0.42)",
  className,
  label,
}: Props) {
  const reduced = useReducedMotion();
  const motionOn = animated && !reduced;
  const vertical = orientation === "vertical";
  const viewBox = vertical
    ? `0 0 ${BRANCH_H} ${BRANCH_W}`
    : `0 0 ${BRANCH_W} ${BRANCH_H}`;

  return (
    <svg
      viewBox={viewBox}
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      overflow="visible"
    >
      <g
        transform={vertical ? `translate(0 ${BRANCH_W}) rotate(-90)` : undefined}
      >
        {[STEM, ...TWIGS.map((t) => t.path)].map((d, i) => (
          <g key={i}>
            <path
              d={d}
              fill="none"
              stroke={rim}
              strokeWidth={i === 0 ? 7.5 : 6}
              strokeLinecap="round"
            />
            <path
              d={d}
              fill="none"
              stroke="var(--thorn, #1A1A1C)"
              strokeWidth={i === 0 ? 5 : 3.6}
              strokeLinecap="round"
            />
          </g>
        ))}
        {TWIGS.map((t, i) => (
          <g key={i} transform={`translate(${t.tip[0]} ${t.tip[1]})`}>
            <Knot
              open={i < bloomed}
              petals={t.petals}
              index={i}
              motionOn={motionOn}
              sway={sway && motionOn}
              rim={rim}
            />
          </g>
        ))}
      </g>
    </svg>
  );
}

function Knot({
  open,
  petals,
  index,
  motionOn,
  sway,
  rim,
}: {
  open: boolean;
  petals: number;
  index: number;
  motionOn: boolean;
  sway: boolean;
  rim: string;
}) {
  // Энэ сесс дотор дэлбэрсэн бол оч цацруулна (mount үед аль хэдийн нээлттэй бол үгүй)
  const [prevOpen, setPrevOpen] = useState(open);
  const [burst, setBurst] = useState(0);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setBurst((b) => b + 1);
  }

  const spin = index * 13;
  const thornT = motionOn ? { duration: 0.3, ease: "easeIn" as const } : { duration: 0 };

  return (
    <>
      <motion.g
        initial={false}
        animate={open ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={thornT}
      >
        <path d={THORN_PATH} fill="none" stroke={rim} strokeWidth={5.5} strokeLinecap="round" />
        <path
          d={THORN_PATH}
          fill="none"
          stroke="var(--thorn, #1A1A1C)"
          strokeWidth={3.2}
          strokeLinecap="round"
        />
      </motion.g>

      <motion.g
        initial={false}
        animate={
          open
            ? { scale: 1, rotate: 0, opacity: 1 }
            : { scale: 0, rotate: -20, opacity: 0 }
        }
        transition={
          motionOn
            ? open
              ? {
                  delay: 0.22,
                  scale: { type: "spring", stiffness: 260, damping: 11, mass: 0.8 },
                  rotate: { type: "spring", stiffness: 120, damping: 14 },
                  opacity: { duration: 0.15, delay: 0.22 },
                }
              : { duration: 0.25 }
            : { duration: 0 }
        }
      >
        <motion.g
          animate={sway ? { rotate: [-4, 4, -4] } : { rotate: 0 }}
          transition={
            sway
              ? {
                  duration: SWAY[index].duration,
                  delay: SWAY[index].delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : { duration: 0.6 }
          }
        >
          {Array.from({ length: petals }, (_, k) => (
            <path
              key={`o${k}`}
              d={petalPath(22)}
              fill="var(--petal, #E0623F)"
              transform={`rotate(${(360 / petals) * k + spin})`}
            />
          ))}
          {Array.from({ length: petals }, (_, k) => (
            <path
              key={`i${k}`}
              d={petalPath(12)}
              fill="#F08A5D"
              transform={`rotate(${(360 / petals) * k + 180 / petals + spin})`}
            />
          ))}
          <circle r={4.5} fill="var(--gold, #E7B56E)" />
        </motion.g>
      </motion.g>

      {motionOn && burst > 0 && (
        <g key={burst}>
          {Array.from({ length: SPARKS }, (_, k) => {
            const a = (k / SPARKS) * Math.PI * 2 + index;
            const dist = 30 + ((k * 7) % 4) * 6;
            return (
              <motion.circle
                key={k}
                r={k % 2 ? 1.8 : 2.4}
                fill="var(--gold, #E7B56E)"
                initial={{ cx: 0, cy: 0, opacity: 0 }}
                animate={{
                  cx: Math.cos(a) * dist,
                  cy: Math.sin(a) * dist,
                  opacity: [0, 1, 0],
                }}
                transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              />
            );
          })}
        </g>
      )}
    </>
  );
}
