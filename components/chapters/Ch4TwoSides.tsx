"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { sides } from "@/lib/content";
import { useIdle } from "@/lib/useIdle";
import { Frame, HintGesture, Prompt, type ChapterProps } from "./parts";

type Phase = 0 | 1 | 2 | 3; // 0: зүүн, 1: + баруун, 2: + асуулт, 3: шийдэгдсэн

// Үсгүүдийн задрах чиглэл (тогтвортой, hydration-д аюулгүй)
const scatter = (i: number) => ({
  x: Math.sin(i * 2.3) * 70,
  y: -40 - ((i * 37) % 60),
  rotate: ((i * 53) % 140) - 70,
});

/** Бүлэг IV: тохиолдсон зүйл ба дотор үлдсэн газар. «Яагаад би?» → «Одоо яах вэ?» */
export default function Ch4TwoSides({ done, onDone, reduced, compact }: ChapterProps) {
  const [phase, setPhase] = useState<Phase>(done ? 3 : reduced ? 2 : 0);
  const [idle, poke] = useIdle(6000, phase === 2 && !done);
  const solved = phase === 3 || done;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // «Энэ чиний буруу биш» эхэлж, илүү удаан харагдана
  useEffect(() => {
    if (done || reduced) return;
    const t = timers.current;
    t.push(setTimeout(() => setPhase((p) => (p < 1 ? 1 : p)), 2600));
    t.push(setTimeout(() => setPhase((p) => (p < 2 ? 2 : p)), 5200));
    return () => t.forEach(clearTimeout);
  }, [done, reduced]);

  const solve = () => {
    if (phase !== 2 || done) return;
    setPhase(3);
    timers.current.push(setTimeout(onDone, reduced ? 0 : 1500));
  };

  const fs = compact ? "text-[15px]" : "text-[16px]";
  const before = Array.from(sides.before);
  const after = Array.from(sides.after);

  return (
    <Frame className="flex h-full min-h-90 w-full flex-col bg-[#14181e]">
      <div className="grid flex-1 grid-cols-2">
        {/* Зүүн: тохиолдсон зүйл — бараан, хөдөлгөөнгүй */}
        <motion.div
          className="flex flex-col justify-center gap-2.5 bg-[#101318] p-4"
          initial={done || reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
        >
          <h4 className={`font-serif ${compact ? "text-[16px]" : "text-[18px]"} leading-[1.3] text-paper`}>{sides.leftTitle}</h4>
          <p className={`font-serif ${fs} italic leading-[1.5] text-paper/90`}>{sides.leftBody}</p>
        </motion.div>

        {/* Баруун: дотор үлдсэн газар — бүдэг, тор шиг зураастай */}
        <motion.div
          className="relative flex flex-col justify-center gap-2.5 border-l border-gold/25 bg-[#252b33] p-4"
          initial={false}
          animate={{ opacity: phase >= 1 || solved ? 1 : 0 }}
          transition={{ duration: 1.4 }}
        >
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: "repeating-linear-gradient(90deg, transparent 0 18px, rgba(10,12,16,0.55) 18px 21px)" }}
            initial={false}
            animate={{ opacity: solved ? 0 : 1 }}
            transition={{ duration: 1.2, delay: solved ? 0.6 : 0 }}
          />
          <h4 className={`relative font-serif ${compact ? "text-[16px]" : "text-[18px]"} leading-[1.3] text-paper/80`}>{sides.rightTitle}</h4>
          <p className={`relative font-serif ${fs} italic leading-[1.5] text-paper/75`}>{sides.rightBody}</p>
        </motion.div>
      </div>

      {/* «Яагаад би?» → «Одоо яах вэ?» */}
      <motion.div
        className="relative flex h-[38%] min-h-36 flex-col items-center justify-center border-t border-gold/20"
        initial={false}
        animate={{ opacity: phase >= 2 || solved ? 1 : 0 }}
        transition={{ duration: 0.9 }}
      >
        <motion.button
          type="button"
          disabled={phase !== 2 || solved}
          aria-label={solved ? sides.after : phase === 2 ? `${sides.before} — ${sides.prompt}` : undefined}
          className="relative cursor-grab touch-none select-none px-4 py-2 font-serif text-[40px] leading-none text-paper active:cursor-grabbing disabled:cursor-default md:text-[46px]"
          drag={phase === 2 && !solved && !reduced ? "y" : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.55}
          onDragStart={poke}
          onDragEnd={(_, info) => {
            if (info.offset.y < -60 || info.velocity.y < -500) solve();
          }}
          onClick={solve}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              solve();
            }
          }}
        >
          <span aria-hidden className="relative block">
            <span className="flex justify-center">
              {before.map((ch, i) => (
                <motion.span
                  key={`b${i}`}
                  className="inline-block whitespace-pre"
                  initial={false}
                  animate={solved ? { ...scatter(i), opacity: 0 } : { x: 0, y: 0, rotate: 0, opacity: 1 }}
                  transition={{ duration: reduced ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  {ch}
                </motion.span>
              ))}
            </span>
            <AnimatePresence>
              {solved && (
                <span className="absolute inset-0 flex justify-center text-gold">
                  {after.map((ch, i) => (
                    <motion.span
                      key={`a${i}`}
                      className="inline-block whitespace-pre"
                      initial={done || reduced ? false : { ...scatter(i + 5), opacity: 0 }}
                      animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.55 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {ch}
                    </motion.span>
                  ))}
                </span>
              )}
            </AnimatePresence>
          </span>
        </motion.button>
        {phase === 2 && !solved && !reduced && (
          <div className="relative mt-3">
            <Prompt idle={idle} className="text-gold/90">
              ↑ {sides.prompt}
            </Prompt>
            <HintGesture show={idle} gesture="swipe-up" className="-top-14 left-1/2 -translate-x-1/2" />
          </div>
        )}
      </motion.div>
    </Frame>
  );
}
