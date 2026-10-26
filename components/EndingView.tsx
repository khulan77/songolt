"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { cover, ending, ui } from "@/lib/content";
import Branch from "./Branch";
import { EASE_BOOK } from "./Page";

type Props = { hasCover: boolean; reduced: boolean; onNext: () => void };

/** Бүрэн цэцэглэсэн мөчир — номын төгсгөл */
export default function EndingView({ hasCover, reduced, onNext }: Props) {
  const rise = (i: number) => ({
    initial: reduced ? false : ({ opacity: 0, y: 10 } as const),
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, delay: reduced ? 0 : 0.6 + i * 0.5, ease: EASE_BOOK },
  });

  return (
    <div className="page-scroll flex h-full flex-col items-center px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-16 text-center">
      <div className="my-auto flex w-full max-w-xl flex-col items-center">
        <Branch bloomed={6} sway label={ui.branchAlt} className="h-auto w-[min(86vw,520px)]" />
        {hasCover && (
          <motion.div {...rise(0)} className="mt-4">
            <Image
              src="/cover.png"
              alt={cover.alt}
              width={544}
              height={794}
              sizes="84px"
              className="h-auto w-21 rounded-sm shadow-[0_18px_40px_-10px_rgba(0,0,0,0.9)]"
            />
          </motion.div>
        )}
        <motion.p {...rise(1)} className="mt-8 font-serif text-[19px] italic leading-[1.6] text-paper md:text-[21px]">
          {ending.line1}
        </motion.p>
        <motion.p {...rise(2)} className="mt-3 max-w-md font-serif text-[17px] leading-[1.65] text-paper/80 md:text-[18px]">
          {ending.line2}
        </motion.p>
        <motion.h1 {...rise(3)} className="mt-9 font-serif text-[30px] leading-[1.25] text-gold md:text-[38px]">
          {ending.title}
        </motion.h1>
        <motion.div {...rise(4)} className="mt-8">
          <button
            type="button"
            onClick={onNext}
            className="min-h-12 rounded-full bg-gold px-8 font-sans text-[16px] text-bg-deep shadow-[0_8px_30px_-8px_rgba(231,181,110,0.6)] transition-transform hover:-translate-y-0.5"
          >
            {ending.cta}
          </button>
        </motion.div>
        <motion.p {...rise(5)} className="mt-8 max-w-sm font-sans text-[13px] leading-[1.5] text-paper/60">
          {ending.disclaimer}
        </motion.p>
      </div>
    </div>
  );
}
