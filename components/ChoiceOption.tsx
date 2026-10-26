"use client";

import { motion } from "framer-motion";

type Props = {
  index: number;
  text: string;
  selected: boolean;
  locked: boolean;
  onSelect: () => void;
};

// Гараар зурсан мэт, үзүүр нь давхацсан дугуй
const CIRCLE =
  "M15 3.2 C 22 2.6, 27 8, 26.8 15.2 C 26.6 22.4, 21.4 27, 14.6 26.8 C 7.6 26.6, 3 21.6, 3.2 14.6 C 3.4 8, 8.4 3.4, 16.4 3.6";
// Бэхний толбо
const BLOT =
  "M15 4.5 C 21 4, 25.6 8.6, 25.4 15 C 25.2 21.6, 20.6 25.8, 14.6 25.5 C 8.4 25.2, 4.4 20.8, 4.6 14.6 C 4.8 8.6, 9 5, 15 4.5Z";

export default function ChoiceOption({ index, text, selected, locked, onSelect }: Props) {
  const idle = !selected && !locked;
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        disabled={locked}
        aria-pressed={selected}
        aria-keyshortcuts={String(index + 1)}
        className={`group relative flex w-full items-center gap-3.5 rounded-[4px] px-3.5 py-3 text-left font-serif text-[18px] italic leading-[1.45] transition-[background-color,box-shadow,color,opacity,transform] duration-300 md:text-[19px] ${
          selected
            ? "bg-[rgba(224,98,63,0.09)] text-ink shadow-[inset_0_0_0_1.5px_rgba(176,72,40,0.55)]"
            : locked
              ? "text-ink-soft opacity-45"
              : "cursor-pointer bg-[rgba(255,251,242,0.38)] text-ink shadow-[inset_0_0_0_1px_rgba(90,74,58,0.22),0_1px_0_rgba(90,74,58,0.12)] hover:-translate-y-px hover:bg-[rgba(255,251,242,0.7)] hover:shadow-[inset_0_0_0_1px_rgba(184,134,63,0.75),0_6px_14px_-8px_rgba(60,40,20,0.45)] active:translate-y-0"
        }`}
      >
        <span aria-hidden className="relative grid size-7.5 shrink-0 place-items-center">
          <svg viewBox="0 0 30 30" className="absolute inset-0 size-full overflow-visible">
            <motion.path
              d={BLOT}
              fill="var(--petal)"
              initial={false}
              animate={selected ? { scale: 1, opacity: 1 } : { scale: 0.2, opacity: 0 }}
              transition={selected ? { type: "spring", stiffness: 320, damping: 14 } : { duration: 0.2 }}
              style={{ transformOrigin: "15px 15px" }}
            />
            <path
              d={CIRCLE}
              pathLength={1}
              fill="none"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeDasharray="1 1"
              className={`transition-[stroke-dashoffset,stroke] duration-500 ease-out ${
                selected
                  ? "stroke-[#8a3a22] [stroke-dashoffset:0]"
                  : idle
                    ? "stroke-ink-soft [stroke-dashoffset:0.18] group-hover:stroke-gold-deep group-hover:[stroke-dashoffset:0] group-focus-visible:[stroke-dashoffset:0]"
                    : "stroke-ink-soft [stroke-dashoffset:0.18]"
              }`}
            />
          </svg>
          <span
            className={`relative font-sans text-[13px] not-italic tabular-nums transition-colors duration-300 ${
              selected ? "text-paper" : "text-ink-soft group-hover:text-ink"
            }`}
          >
            {index + 1}
          </span>
        </span>
        <motion.span
          className="flex-1"
          animate={selected ? { opacity: [1, 0.55, 1] } : { opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {text}
        </motion.span>
      </button>
    </li>
  );
}
