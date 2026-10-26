"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { dance } from "@/lib/content";
import { useHold } from "@/lib/useHold";
import { useIdle } from "@/lib/useIdle";
import { Frame, HintGesture, HoldRing, Prompt, type ChapterProps } from "./parts";

// Гурван байрлал: зогсох → гараа дээш → арабеск (градус, цагийн зүүний дагуу +)
const POSES = [
  { armL: 14, armR: -14, leg: 0 },
  { armL: 158, armR: -158, leg: 0 },
  { armL: 100, armR: -80, leg: -80 },
];

const SPRING = { type: "spring" as const, stiffness: 70, damping: 14 };

/**
 * Мөч (гар/хөл) нь (x,y) цэгээс эргэнэ. Framer SVG-д transform-box: fill-box хэрэглэдэг тул
 * үл үзэгдэх тэгш хэмтэй хайрцгаар эргэх цэгийг bbox-ийн яг төвд байлгана.
 */
function Limb({ x, y, rotate, reach, children }: { x: number; y: number; rotate: number; reach: number; children: React.ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <motion.g animate={{ rotate }} transition={SPRING}>
        <rect x={-reach} y={-reach} width={reach * 2} height={reach * 2} fill="none" stroke="none" />
        {children}
      </motion.g>
    </g>
  );
}

/** Бүлэг III: хүйтэн хоосон өрөөнд нүдээ аниад дотоод тайзаа төсөөлнө */
export default function Ch3Dance({ done, onDone, reduced }: ChapterProps) {
  const { progress, holding, complete: held, bind } = useHold({
    duration: 3000,
    onComplete: onDone,
    initialDone: done,
    disabled: reduced,
  });
  const complete = held || done;
  const [idle, poke] = useIdle(6000, !complete && !holding);
  const p = complete ? 1 : progress;

  // Барьж байх үед байрлал солигдоно; тавибал зогсох байрлал руу буцна
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!holding) return;
    const t = setInterval(() => setStep((s) => s + 1), 850);
    return () => clearInterval(t);
  }, [holding]);
  const pose = complete ? POSES[1] : holding && p > 0.12 ? POSES[1 + (step % 2)] : POSES[0];

  return (
    <Frame
      {...(reduced ? {} : bind)}
      onPointerDownCapture={poke}
      tabIndex={reduced || complete ? -1 : 0}
      role={reduced || complete ? undefined : "button"}
      aria-label={reduced || complete ? undefined : dance.prompt}
      className={`h-full min-h-80 w-full bg-[linear-gradient(180deg,#2b323b,#1b2027)] ${complete || reduced ? "" : "cursor-pointer"}`}
      style={reduced ? undefined : bind.style}
    >
      {/* Дулаан тайзны өнгө */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          opacity: p,
          background: "radial-gradient(ellipse 80% 60% at 50% 30%, #6b4424, #3a2414 60%, #1e130b)",
        }}
      />
      {/* Тайзны гэрэл */}
      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-[92%] w-[70%] -translate-x-1/2"
        style={{
          opacity: 0.25 + p * 0.65,
          background: `linear-gradient(180deg, ${p > 0.5 ? "rgba(255,226,170,0.55)" : "rgba(200,215,230,0.35)"}, transparent 85%)`,
          clipPath: "polygon(42% 0, 58% 0, 100% 100%, 0 100%)",
          transition: "background 0.6s",
        }}
      />
      {/* Улаан хөшиг */}
      {(["left", "right"] as const).map((side) => (
        <div
          key={side}
          aria-hidden
          className={`absolute inset-y-0 ${side === "left" ? "left-0" : "right-0"}`}
          style={{
            width: `${p * 24}%`,
            background:
              "repeating-linear-gradient(90deg, #6e1616 0 10px, #8f2222 10px 18px, #5a1010 18px 24px)",
            boxShadow: side === "left" ? "8px 0 18px rgba(0,0,0,0.5)" : "-8px 0 18px rgba(0,0,0,0.5)",
          }}
        />
      ))}
      {/* Шал */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[16%]" style={{ background: `linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,${0.5 - p * 0.2}))` }} />

      {/* Балетчны силуэт */}
      <svg viewBox="0 0 100 160" className="absolute bottom-[9%] left-1/2 h-[58%] -translate-x-1/2" aria-hidden overflow="visible">
        <g
          fill="#0b0e13"
          stroke={p > 0.4 ? "rgba(231,181,110,0.55)" : "rgba(200,215,230,0.25)"}
          strokeWidth={0.8}
        >
          {/* Хөл: тулгуур хөл + ташаанаас эргэх хөл */}
          <path d="M45.5 74 L45.8 140 L48.4 140 L50.2 75Z" />
          <Limb x={52} y={75} rotate={pose.leg} reach={66}>
            <path d="M-2 0 L0.4 65 L3 65 L2.6 -1Z" />
          </Limb>
          {/* Их бие, банзал, толгой */}
          <path d="M46 34 Q50 31 54 34 L53 52 Q50 56 47 52Z M50 52 Q55 60 54 70 L46 70 Q45 60 50 52Z" />
          <ellipse cx="50" cy="72" rx="21" ry="5.5" />
          <circle cx="50" cy="22" r="7" />
          <path d="M48 28 L52 28 L51.5 33 L48.5 33Z" />
          {/* Гар: мөрнөөс эргэнэ */}
          <Limb x={46} y={36} rotate={pose.armL} reach={27}>
            <path d="M0 0 Q-2 14 -3 26" fill="none" strokeWidth={3} stroke="#0b0e13" strokeLinecap="round" />
          </Limb>
          <Limb x={54} y={36} rotate={pose.armR} reach={27}>
            <path d="M0 0 Q2 14 3 26" fill="none" strokeWidth={3} stroke="#0b0e13" strokeLinecap="round" />
          </Limb>
        </g>
      </svg>

      {!complete && !reduced && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 p-4 text-center">
            <Prompt idle={idle} className="text-paper/85">
              {dance.prompt}
            </Prompt>
          </div>
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2">
            <HoldRing progress={p} size={44}>
              <span className="size-2 rounded-full bg-gold" />
            </HoldRing>
            <HintGesture show={idle} gesture="hold" className="inset-0" />
          </div>
        </>
      )}
    </Frame>
  );
}
