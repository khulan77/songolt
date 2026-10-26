"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { chapters, ui } from "@/lib/content";
import { InkButton, LightMark, PageInner } from "../ui";
import Ch1Rain from "./Ch1Rain";
import Ch2Pause from "./Ch2Pause";
import Ch3Dance from "./Ch3Dance";
import Ch4TwoSides from "./Ch4TwoSides";
import Ch5Stone from "./Ch5Stone";
import Ch6Day from "./Ch6Day";
import type { ChapterProps } from "./parts";

const MECHANICS: ComponentType<ChapterProps>[] = [Ch1Rain, Ch2Pause, Ch3Dance, Ch4TwoSides, Ch5Stone, Ch6Day];

type Props = {
  index: number;
  /** Desktop: зүүн (текст) / баруун (үйлдэл). Утас: бүгд нэг хуудсанд */
  part: "left" | "right" | "all";
  done: boolean;
  onDone: () => void;
  onNext: () => void;
  reduced: boolean;
};

const EASE = [0.22, 1, 0.36, 1] as const;

export default function ChapterShell({ index, part, done, onDone, onNext, reduced }: Props) {
  const c = chapters[index];
  const Mechanic = MECHANICS[index];
  const compact = part === "all";
  // Аль хэдийн дууссан бүлэг рүү буцвал текст шууд харагдана
  const [doneAtMount] = useState(done);
  const animateIn = !doneAtMount && !reduced;
  const textDelay = (i: number) => (animateIn ? 0.5 + i * 0.75 : 0);
  const nextDelay = textDelay(c.lines.length + 1);

  // Утсан дээр текст гарахад хуудсыг доош нь гүйлгэнэ
  const revealRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!done || doneAtMount || !compact) return;
    const t = setTimeout(() => {
      const scroller = revealRef.current?.closest(".page-scroll");
      scroller?.scrollTo({ top: scroller.scrollHeight, behavior: reduced ? "auto" : "smooth" });
    }, 700);
    return () => clearTimeout(t);
  }, [done, doneAtMount, compact, reduced]);

  const label = (
    <p className="font-sans text-[12px] uppercase tracking-[0.2em] text-ink-soft">
      {c.numeral}
    </p>
  );

  const reveal = done && (
    <div ref={revealRef} className="space-y-4">
      {c.lines.map((line, i) => (
        <motion.p
          key={i}
          className="font-serif text-[17px] leading-[1.65] text-ink md:text-[18px]"
          initial={animateIn ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: textDelay(i), ease: EASE }}
        >
          {line}
        </motion.p>
      ))}
      <motion.p
        className="border-l-2 border-gold-deep pl-4 font-serif text-[19px] italic leading-[1.55] text-ink md:text-[20px]"
        initial={animateIn ? { opacity: 0, y: 8 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: textDelay(c.lines.length), ease: EASE }}
      >
        {c.highlight}
      </motion.p>
    </div>
  );

  const next = done && (
    <motion.div
      initial={animateIn ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: nextDelay }}
    >
      <InkButton onClick={onNext}>{ui.nextPage}</InkButton>
    </motion.div>
  );

  // reduced-motion: үйлдлийн оронд энгийн товч
  const skip = reduced && !done && (
    <div>
      <InkButton onClick={onDone}>{ui.continue}</InkButton>
    </div>
  );

  const mechanic = <Mechanic done={done} onDone={onDone} reduced={reduced} compact={compact} />;

  if (part === "left") {
    return (
      <PageInner>
        {label}
        <div className="my-auto py-6">
          <h2 className="font-serif text-[32px] leading-[1.2] text-ink md:text-[34px]">{c.title}</h2>
          <LightMark className="my-5" />
          {reveal}
        </div>
      </PageInner>
    );
  }

  if (part === "right") {
    return (
      <PageInner className="gap-5">
        <div className="flex min-h-0 flex-1">{mechanic}</div>
        {skip}
        <div className="min-h-12">{next}</div>
      </PageInner>
    );
  }

  return (
    <PageInner className="gap-5">
      <div>
        {label}
        <h2 className="mt-2 font-serif text-[28px] leading-[1.2] text-ink">{c.title}</h2>
      </div>
      <div className={c.key === "day" ? "flex" : "flex h-[min(50dvh,380px)] shrink-0"}>{mechanic}</div>
      {skip}
      {reveal}
      {next && <div className="pb-4">{next}</div>}
    </PageInner>
  );
}
