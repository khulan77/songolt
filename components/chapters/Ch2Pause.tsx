"use client";

import { motion } from "framer-motion";
import { pause } from "@/lib/content";
import { useHold } from "@/lib/useHold";
import { useIdle } from "@/lib/useIdle";
import { Frame, HintGesture, HoldRing, Prompt, type ChapterProps } from "./parts";

const THRESHOLDS = [0.18, 0.48, 0.78];

/** Бүлэг II: тохиолдол ба хариу үйлдлийн хоорондох зайг барьж тэлнэ */
export default function Ch2Pause({ done, onDone, reduced, compact }: ChapterProps) {
  const { progress, holding, complete: held, bind } = useHold({
    duration: 3000,
    onComplete: onDone,
    initialDone: done,
    disabled: reduced,
  });
  const complete = held || done;
  const [idle, poke] = useIdle(6000, !complete && !holding);
  const p = complete ? 1 : progress;
  const maxGap = compact ? 196 : 236;
  const gap = 8 + p * maxGap;

  return (
    <Frame
      {...(reduced ? {} : bind)}
      onPointerDownCapture={poke}
      tabIndex={reduced || complete ? -1 : 0}
      role={reduced || complete ? undefined : "button"}
      aria-label={reduced || complete ? undefined : pause.prompt}
      className={`flex h-full min-h-80 w-full flex-col items-center justify-center bg-[linear-gradient(180deg,#1f252d,#161a20)] px-5 py-6 ${complete || reduced ? "" : "cursor-pointer"}`}
      style={reduced ? undefined : bind.style}
    >
      <div className="relative flex w-full max-w-80 flex-col items-stretch">
        <div className="rounded-[4px] bg-paper px-4 py-3.5 text-center font-serif text-[17px] text-ink shadow-[0_8px_20px_-10px_rgba(0,0,0,0.7)]">
          {pause.event}
        </div>

        {/* Хоорондох зай */}
        <div className="relative flex flex-col items-center justify-start gap-2.5 overflow-hidden pt-3" style={{ height: gap }}>
          {pause.responses.map((r, i) => (
            <motion.p
              key={i}
              className="px-2 text-center font-serif text-[15px] italic leading-[1.4] text-gold md:text-[16px]"
              initial={false}
              animate={{ opacity: p >= THRESHOLDS[i] ? 1 : 0, y: p >= THRESHOLDS[i] ? 0 : 6 }}
              transition={{ duration: 0.5 }}
            >
              {r}
            </motion.p>
          ))}
        </div>

        <motion.div
          className="rounded-[4px] bg-[rgba(224,98,63,0.16)] px-4 py-3.5 text-center font-serif text-[17px] italic text-[#f0a184] shadow-[inset_0_0_0_1px_rgba(224,98,63,0.45)]"
          animate={
            complete
              ? { opacity: 0.22, x: 0, filter: "blur(1.2px)" }
              : reduced
                ? { opacity: 1 }
                : { x: [0, -1.2, 1, -0.8, 0], opacity: 1, filter: "blur(0px)" }
          }
          transition={complete ? { duration: 1.2 } : { duration: 0.45, repeat: Infinity, repeatDelay: 0.25 }}
        >
          {pause.automatic}
        </motion.div>

        {/* «Дараад барь» — хоёр картын дунд */}
        {!complete && !reduced && (
          <motion.div
            className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-full bg-[#161a20]/90 py-1.5 pl-1.5 pr-4 ring-1 ring-gold/30"
            style={{ top: "50%" }}
            animate={{ opacity: p > 0.06 ? 0 : 1 }}
            transition={{ duration: 0.25 }}
          >
            <HoldRing progress={p} size={40}>
              <span className="size-2 rounded-full bg-gold" />
            </HoldRing>
            <Prompt idle={idle} className="text-gold">
              {pause.prompt}
            </Prompt>
            <HintGesture show={idle} gesture="hold" className="left-1.5 top-1.5" />
          </motion.div>
        )}
      </div>

      {/* Барих явц */}
      {!complete && !reduced && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2"
          animate={{ opacity: p > 0.06 ? 1 : 0 }}
        >
          <HoldRing progress={p} size={34} />
        </motion.div>
      )}
    </Frame>
  );
}
