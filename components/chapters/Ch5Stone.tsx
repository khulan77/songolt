"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { stone } from "@/lib/content";
import { useIdle } from "@/lib/useIdle";
import { Frame, HintGesture, Prompt, type ChapterProps } from "./parts";

const GROUND = 22; // доод талаас %
const START = 30;
const END = 72;

/** Бүлэг V: өнгөрсний чулууг хаяхгүй, газарт тавина. Тэр хуудсан дээр үлдэнэ. */
export default function Ch5Stone({ done, onDone, reduced }: ChapterProps) {
  const [droppedState, setDropped] = useState(done);
  const dropped = droppedState || done;
  const [idle, poke] = useIdle(6000, !dropped);

  // Хүний байрлал (%) — чулуу үүрч байхад хамт хөдөлнө
  const px = useMotionValue(done ? END : START);
  const [dropAt, setDropAt] = useState(done ? 30 : START);
  const personLeft = useTransform(px, (v) => `${v}%`);
  // Чулуу үүрч байхад хүний мөрөн дээр (бага зэрэг ард)
  const carriedLeft = useTransform(px, (v) => `calc(${v}% - 20px)`);

  useEffect(() => {
    if (reduced && !dropped) return;
    const c = dropped
      ? animate(px, END, { duration: reduced ? 0 : 3.4, ease: [0.22, 1, 0.36, 1] })
      : animate(px, 44, { duration: 30, ease: "linear" });
    return () => c.stop();
  }, [dropped, reduced, px]);

  const drop = () => {
    if (dropped) return;
    setDropAt(px.get());
    setDropped(true);
    setTimeout(onDone, reduced ? 0 : 500);
  };

  const legSwing = dropped ? 0.7 : 1.9;

  return (
    <Frame className="h-full min-h-72 w-full bg-[linear-gradient(180deg,#d9ccb0,#cfc09f)]" onPointerDownCapture={poke}>
      {/* Газар */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 bg-[#b9a982]" style={{ height: `${GROUND}%` }} />
      <div aria-hidden className="absolute inset-x-0 h-px bg-ink/40" style={{ bottom: `${GROUND}%` }} />

      {!dropped && !reduced && (
        <div className="pointer-events-none absolute inset-x-0 top-0 p-4 text-center">
          <Prompt idle={idle} className="text-ink">
            {stone.prompt}
          </Prompt>
        </div>
      )}

      {/* Хүн */}
      <motion.div
        aria-hidden
        className="absolute w-14 -translate-x-1/2"
        style={{ left: personLeft, bottom: `${GROUND}%` }}
        animate={reduced ? {} : { y: [0, dropped ? -2 : -1, 0] }}
        transition={{ duration: legSwing / 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 40 72" className="block w-full overflow-visible">
          <motion.g
            initial={false}
            animate={{ rotate: dropped ? 0 : 30 }}
            transition={{ type: "spring", stiffness: 60, damping: 12, delay: dropped ? 0.3 : 0 }}
            style={{ transformOrigin: "50% 100%" }}
            fill="#2a2018"
          >
            <circle cx="20" cy="9" r="6" />
            <path d="M16 17 Q20 15 24 17 L23 46 L17 46Z" />
            <path d="M18 20 Q12 30 14 40" stroke="#2a2018" strokeWidth="3" fill="none" strokeLinecap="round" />
          </motion.g>
          {[0, 1].map((k) => (
            <motion.path
              key={k}
              d="M20 46 L20 72"
              stroke="#2a2018"
              strokeWidth="3.4"
              strokeLinecap="round"
              animate={reduced ? {} : { rotate: k ? [16, -16, 16] : [-16, 16, -16] }}
              transition={{ duration: legSwing, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "50% 0%" }}
            />
          ))}
        </svg>
      </motion.div>

      {/* Чулуу */}
      <motion.button
        type="button"
        disabled={dropped}
        aria-label={dropped ? stone.label : `${stone.label} — ${stone.prompt}`}
        className="absolute z-10 grid h-11 w-17 -translate-x-1/2 touch-none select-none place-items-center rounded-[46%_54%_40%_60%/55%_48%_52%_45%] bg-[linear-gradient(160deg,#9a9a96,#6e6e6b)] font-serif text-[12px] italic text-paper shadow-[inset_-4px_-6px_10px_rgba(0,0,0,0.25),0_6px_10px_-4px_rgba(0,0,0,0.35)] disabled:cursor-default"
        style={
          dropped
            ? { left: `calc(${dropAt}% - 34px)`, bottom: `${GROUND}%` }
            : { left: carriedLeft, bottom: `calc(${GROUND}% + 56px)` }
        }
        drag={dropped || reduced ? false : "y"}
        dragConstraints={{ top: 0, bottom: 40 }}
        dragElastic={0.2}
        dragSnapToOrigin
        onDragStart={poke}
        onDragEnd={(_, info) => {
          if (info.offset.y > 24) drop();
        }}
        onClick={drop}
        initial={false}
        animate={dropped ? { rotate: -4 } : { rotate: 8 }}
        transition={{ type: "spring", stiffness: 140, damping: 16 }}
      >
        {stone.label}
        {!dropped && <HintGesture show={idle} gesture="drag-down" className="-bottom-2 left-1/2 -translate-x-1/2" />}
      </motion.button>

      {/* Чулууны хажууд ургах ногоо */}
      <motion.svg
        aria-hidden
        viewBox="0 0 24 30"
        className="absolute h-8 w-6 origin-bottom"
        style={{ left: `calc(${dropAt}% + 12px)`, bottom: `${GROUND}%` }}
        initial={false}
        animate={{ scaleY: dropped ? 1 : 0, opacity: dropped ? 1 : 0 }}
        transition={{ duration: reduced ? 0 : 1.2, delay: dropped && !done ? 1 : 0, ease: [0.22, 1, 0.36, 1] }}
      >
        <path d="M12 30 Q12 18 12 10" stroke="#4f7a3a" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M12 18 Q4 16 3 8 Q10 9 12 16Z" fill="#6a9a4a" />
        <path d="M12 13 Q20 11 21 3 Q14 4 12 11Z" fill="#7cae56" />
      </motion.svg>
    </Frame>
  );
}
