"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, type ReactNode } from "react";

export const EASE_BOOK = [0.22, 1, 0.36, 1] as const;

type LeafProps = {
  front: ReactNode;
  back: ReactNode;
  from: number;
  to: number;
  /** Эргэх тэнхлэг: "left" = зүүн ирмэг (нуруу зүүн талд) */
  origin: "left" | "right";
  className?: string;
  frontClass?: string;
  backClass?: string;
  duration?: number;
  /** Утсан дээр камер холдсоны дараа эргэж эхэлнэ */
  delay?: number;
  fadeOut?: boolean;
  onDone: () => void;
};

/** Нэг хуудас (2 нүүртэй) CSS 3D-ээр эргэнэ. Дотоод агуулга нь идэвхгүй хуулбар. */
export function Leaf({
  front,
  back,
  from,
  to,
  origin,
  className = "",
  frontClass = "",
  backClass = "",
  duration = 0.95,
  delay = 0,
  fadeOut = false,
  onDone,
}: LeafProps) {
  const rot = useMotionValue(from);
  // Хуудас өргөгдөхөд сүүдэр өтгөрч, хэвтэхэд арилна
  const shade = useTransform(rot, (v) => Math.sin((Math.abs(v) * Math.PI) / 180) * 0.4);
  const opacity = useTransform(rot, (v) => {
    if (!fadeOut) return 1;
    const p = Math.abs(v - from) / Math.abs(to - from);
    return p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3;
  });

  useEffect(() => {
    const controls = animate(rot, to, { duration, delay, ease: EASE_BOOK, onComplete: onDone });
    return () => controls.stop();
    // Нэг удаа л эргэнэ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spineSide = origin === "left" ? "to right" : "to left";

  return (
    <motion.div
      className={`absolute top-0 h-full ${className}`}
      style={{
        rotateY: rot,
        opacity,
        transformOrigin: `${origin} center`,
        transformStyle: "preserve-3d",
        zIndex: 20,
      }}
      aria-hidden
      inert
    >
      <div
        className={`absolute inset-0 overflow-hidden ${frontClass}`}
        style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
      >
        {front}
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: shade,
            background: `linear-gradient(${spineSide}, rgba(30,20,10,0.55), rgba(30,20,10,0.1) 60%, rgba(255,245,225,0.15))`,
          }}
        />
      </div>
      <div
        className={`absolute inset-0 overflow-hidden ${backClass}`}
        style={{
          transform: "rotateY(180deg)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        {back}
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: shade,
            background: `linear-gradient(${origin === "left" ? "to left" : "to right"}, rgba(30,20,10,0.55), rgba(30,20,10,0.08) 60%, transparent)`,
          }}
        />
      </div>
    </motion.div>
  );
}
