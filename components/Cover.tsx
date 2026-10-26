"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cover } from "@/lib/content";
import Branch from "./Branch";
import { EASE_BOOK } from "./Page";

type Props = {
  hasCover: boolean;
  reduced: boolean;
  onOpen: () => void;
};

export default function Cover({ hasCover, reduced, onOpen }: Props) {
  const [opening, setOpening] = useState(false);
  const [hover, setHover] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rx = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 120, damping: 18 });

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const open = () => {
    if (opening) return;
    if (reduced) {
      onOpen();
      return;
    }
    setOpening(true);
    rx.set(0);
    ry.set(0);
    timer.current = setTimeout(onOpen, 1150);
  };

  const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse" || reduced || opening) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 12); // ±6°
    rx.set(-py * 12);
  };

  const lifted = hover && !opening && !reduced;

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 pb-16">
      <motion.div
        animate={opening ? { scale: 1.15 } : { scale: 1 }}
        transition={{ duration: 1.1, ease: EASE_BOOK }}
      >
        <motion.div
          animate={reduced || opening ? { scale: 1 } : { scale: [1, 1.01, 1] }}
          transition={reduced || opening ? { duration: 0.3 } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{ perspective: 1600 }}
        >
          <motion.button
            type="button"
            onClick={open}
            onPointerMove={onMove}
            onPointerEnter={() => setHover(true)}
            onPointerLeave={() => {
              setHover(false);
              rx.set(0);
              ry.set(0);
            }}
            aria-label={cover.hint}
            className="cover-hover relative block aspect-[544/794] w-[min(64vw,300px,calc(56dvh*0.685))] cursor-pointer rounded-r-md md:w-[min(340px,calc(58vh*0.685))]"
            style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
            animate={{
              y: lifted ? -8 : 0,
              boxShadow: lifted
                ? "0 50px 90px -20px rgba(0,0,0,0.95), 0 0 60px rgba(231,181,110,0.12)"
                : "0 30px 60px -20px rgba(0,0,0,0.85), 0 0 0 rgba(0,0,0,0)",
            }}
            transition={{ duration: 0.6, ease: EASE_BOOK }}
          >
            {/* Хавтасны доорх эхний хуудас */}
            <div className="paper paper-single absolute inset-0 rounded-r-md" aria-hidden />

            <motion.div
              className="absolute inset-0 rounded-r-md"
              style={{ transformOrigin: "left center", transformStyle: "preserve-3d" }}
              animate={opening ? { rotateY: -160 } : { rotateY: 0 }}
              transition={{ duration: 1.1, ease: EASE_BOOK }}
            >
              <div
                className="absolute inset-0 overflow-hidden rounded-r-md"
                style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
              >
                {hasCover ? (
                  <Image
                    src="/cover.png"
                    alt={cover.alt}
                    width={544}
                    height={794}
                    priority
                    sizes="(min-width: 768px) 340px, 64vw"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-[linear-gradient(160deg,#252b33,#12161c)]">
                    <Branch bloomed={0} animated={false} orientation="vertical" className="h-3/4 opacity-80" />
                  </div>
                )}
                {/* Нуруун дахь хотгор */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-linear-to-r from-black/45 to-transparent" />
                <div className="cover-sheen pointer-events-none absolute inset-0" />
              </div>
              <div
                className="absolute inset-0 rounded-l-md bg-[#2a2420]"
                style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
              />
            </motion.div>
          </motion.button>
        </motion.div>
      </motion.div>

      <motion.p
        className="mt-8 text-center font-serif text-[15px] italic text-paper/75"
        animate={{ opacity: opening ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      >
        {cover.credit}
      </motion.p>
      <motion.p
        aria-hidden
        className="absolute bottom-[max(2rem,env(safe-area-inset-bottom))] left-0 right-0 text-center font-sans text-[13px] tracking-[0.12em] text-gold"
        animate={{ opacity: opening ? 0 : [0.55, 1, 0.55] }}
        transition={opening ? { duration: 0.4 } : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        {cover.hint}
      </motion.p>
    </div>
  );
}
