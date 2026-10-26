"use client";

import { motion } from "framer-motion";
import { ui } from "@/lib/content";

/** Номын тууз — 5 хэсэгтэй, хариулт бүрт нэг хэсэг алтлаг болно. */
export default function RibbonProgress({ done, total = 5 }: { done: number; total?: number }) {
  return (
    <div
      role="progressbar"
      aria-label={ui.progress}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-valuetext={`${done} / ${total}`}
      className="flex w-3.5 flex-col items-stretch gap-0.75"
    >
      {Array.from({ length: total }, (_, i) => (
        <motion.span
          key={i}
          className="block h-3.5 rounded-[1px]"
          initial={false}
          animate={{
            backgroundColor: i < done ? "#E7B56E" : "rgba(232,220,196,0.16)",
            boxShadow: i < done ? "0 0 8px rgba(231,181,110,0.55)" : "0 0 0 rgba(0,0,0,0)",
          }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
      {/* Туузны сэрээтэй үзүүр */}
      <svg viewBox="0 0 14 8" className="block h-2 w-full" aria-hidden>
        <path
          d="M0 0 H14 V8 L7 3 L0 8Z"
          fill={done >= total ? "#E7B56E" : "rgba(232,220,196,0.16)"}
        />
      </svg>
    </div>
  );
}
