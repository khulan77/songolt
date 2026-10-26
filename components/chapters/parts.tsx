"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

export type ChapterProps = {
  done: boolean;
  onDone: () => void;
  reduced: boolean;
  /** Утасны нэг хуудсанд */
  compact: boolean;
};

/** Барих явцын алтлаг тойрог */
export function HoldRing({ progress, size = 56, children }: { progress: number; size?: number; children?: ReactNode }) {
  const r = size / 2 - 3;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(231,181,110,0.25)" strokeWidth={2} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--gold)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
        />
      </svg>
      {children}
    </span>
  );
}

type Gesture = "tap" | "hold" | "swipe-up" | "drag-down";

/** 6 секунд гацвал гарах зөөлөн заавар — текстгүй, хурууны дохио */
export function HintGesture({ show, gesture, className = "" }: { show: boolean; gesture: Gesture; className?: string }) {
  const move =
    gesture === "swipe-up"
      ? { y: [14, -18], opacity: [0, 1, 0] }
      : gesture === "drag-down"
        ? { y: [-10, 22], opacity: [0, 1, 0] }
        : gesture === "hold"
          ? { scale: [1, 0.86, 0.86, 1], opacity: [0.6, 1, 1, 0.6] }
          : { scale: [1, 0.82, 1], opacity: [0.6, 1, 0.6] };
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          aria-hidden
          className={`pointer-events-none absolute z-20 grid place-items-center ${className}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.span
            className="relative grid size-11 place-items-center rounded-full bg-gold/20 ring-1 ring-gold/60"
            animate={move}
            transition={{ duration: gesture === "hold" ? 2.2 : 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="size-3 rounded-full bg-gold shadow-[0_0_12px_rgba(231,181,110,0.9)]" />
          </motion.span>
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/** Гацсан үед зааврын мөрийг зөөлөн анивчуулна */
export function Prompt({ children, idle, className = "" }: { children: ReactNode; idle: boolean; className?: string }) {
  return (
    <motion.p
      className={`font-sans text-[13px] tracking-[0.14em] ${className}`}
      animate={idle ? { opacity: [0.55, 1, 0.55] } : { opacity: 1 }}
      transition={idle ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : { duration: 0.4 }}
    >
      {children}
    </motion.p>
  );
}

/** Цаасан хуудсан дээрх бараан «цонх» */
export function Frame({ children, className = "", ...rest }: React.ComponentProps<"div">) {
  return (
    <div
      {...rest}
      className={`relative overflow-hidden rounded-[6px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.35),0_10px_28px_-14px_rgba(20,12,4,0.8)] ${className}`}
    >
      {children}
    </div>
  );
}
