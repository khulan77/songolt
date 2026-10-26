"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { day } from "@/lib/content";
import { useIdle } from "@/lib/useIdle";
import { HintGesture, type ChapterProps } from "./parts";

/** Бүлэг VI: нэг өдрийн таван жижиг сонголт */
export default function Ch6Day({ done, onDone, reduced, compact }: ChapterProps) {
  const [litState, setLit] = useState<boolean[]>(() => day.moments.map(() => done));
  const lit = done ? day.moments.map(() => true) : litState;
  const all = lit.every(Boolean);
  const [idle, poke] = useIdle(6000, !all && !reduced);
  const next = lit.indexOf(false);

  const light = (i: number) => {
    if (lit[i] || reduced) return;
    poke();
    const n = lit.map((v, k) => v || k === i);
    setLit(n);
    if (n.every(Boolean)) onDone();
  };

  return (
    <div className="flex h-full w-full flex-col">
      <h4 className={`font-serif ${compact ? "text-[19px]" : "text-[21px]"} leading-[1.35] text-ink`}>{day.title}</h4>
      <ol className="relative mt-5 flex flex-1 flex-col justify-between gap-3">
        {/* Өдрийн шугам */}
        <motion.span
          aria-hidden
          className="absolute bottom-3 left-[calc(3.5rem+11px)] top-3 w-0.5 rounded-full"
          initial={false}
          animate={{
            backgroundColor: all ? "#B8863F" : "rgba(90,74,58,0.28)",
            boxShadow: all ? "0 0 10px rgba(231,181,110,0.7)" : "0 0 0 rgba(0,0,0,0)",
          }}
          transition={{ duration: 1.2 }}
        />
        {day.moments.map((m, i) => (
          <li key={m.time} className="relative flex items-start gap-3">
            <span className="w-11 shrink-0 pt-0.5 text-right font-sans text-[13px] tabular-nums text-ink-soft">{m.time}</span>
            <button
              type="button"
              onClick={() => light(i)}
              disabled={lit[i] || reduced}
              aria-pressed={lit[i]}
              aria-label={m.time}
              className="relative z-10 grid size-6 shrink-0 place-items-center rounded-full disabled:cursor-default"
            >
              <motion.span
                className="block size-4 rounded-full border-2"
                initial={false}
                animate={
                  lit[i]
                    ? { backgroundColor: "#E7B56E", borderColor: "#B8863F", boxShadow: "0 0 14px 4px rgba(231,181,110,0.65)", scale: 1.15 }
                    : { backgroundColor: "#E8DCC4", borderColor: "#5A4A3A", boxShadow: "0 0 0 0 rgba(0,0,0,0)", scale: 1 }
                }
                transition={{ type: "spring", stiffness: 260, damping: 16 }}
              />
              {i === next && <HintGesture show={idle} gesture="tap" className="inset-0 -m-2.5" />}
            </button>
            <motion.p
              aria-hidden={!lit[i]}
              className={`flex-1 font-serif ${compact ? "text-[16px]" : "text-[17px]"} italic leading-[1.45] text-ink`}
              initial={false}
              animate={{ opacity: lit[i] ? 1 : 0, x: lit[i] ? 0 : -6 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {m.text}
            </motion.p>
          </li>
        ))}
      </ol>
    </div>
  );
}
