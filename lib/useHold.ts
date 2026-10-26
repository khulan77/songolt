"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

type Options = {
  /** Бүрэн барих хугацаа (мс) */
  duration: number;
  onComplete: () => void;
  /** Аль хэдийн дууссан бол 1-ээс эхэлнэ */
  initialDone?: boolean;
  disabled?: boolean;
  /** Эрт тавихад буцах хурд (барихаас хэд дахин хурдан) */
  decay?: number;
};

/**
 * Дараад барих механик: pointer + Space/Enter. Эрт тавибал явц буцаж хумигдана.
 * Утсан дээр контекст цэс, текст сонголтоос сэргийлнэ.
 */
export function useHold({ duration, onComplete, initialDone = false, disabled = false, decay = 1.6 }: Options) {
  const [progress, setProgress] = useState(initialDone ? 1 : 0);
  const [holding, setHolding] = useState(false);
  const [complete, setComplete] = useState(initialDone);
  const p = useRef(initialDone ? 1 : 0);
  const done = useRef(onComplete);
  useEffect(() => {
    done.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (complete || (!holding && p.current <= 0)) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - last, 64);
      last = now;
      p.current = Math.max(0, Math.min(1, p.current + (holding ? dt : -dt * decay) / duration));
      setProgress(p.current);
      if (p.current >= 1) {
        setComplete(true);
        setHolding(false);
        done.current();
        return;
      }
      if (holding || p.current > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [holding, complete, duration, decay]);

  const start = useCallback(() => {
    if (!disabled && !complete) setHolding(true);
  }, [disabled, complete]);
  const stop = useCallback(() => setHolding(false), []);

  const bind = {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      e.currentTarget.setPointerCapture?.(e.pointerId);
      start();
    },
    onPointerUp: stop,
    onPointerCancel: stop,
    onLostPointerCapture: stop,
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if ((e.key === " " || e.key === "Enter") && !e.repeat) {
        e.preventDefault();
        start();
      }
    },
    onKeyUp: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === " " || e.key === "Enter") stop();
    },
    onBlur: stop,
    style: {
      touchAction: "none",
      userSelect: "none",
      WebkitUserSelect: "none",
      WebkitTouchCallout: "none",
    } as const,
  };

  return { progress, holding, complete, bind };
}
