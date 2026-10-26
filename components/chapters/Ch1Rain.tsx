"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { rain } from "@/lib/content";
import { useIdle } from "@/lib/useIdle";
import { Frame, HintGesture, Prompt, type ChapterProps } from "./parts";

type Drop = { x: number; y: number; len: number; v: number; push: number };

// Дусал хажуу тийш шилжих ч бороо зогсохгүй
function pushDrops(drops: Drop[], x: number, dir: number, radius = 130) {
  for (const d of drops) {
    const dist = Math.abs(d.x - x);
    if (dist < radius) d.push += dir * (1 - dist / radius) * 6;
  }
}
function scatterDrops(drops: Drop[]) {
  for (const d of drops) d.push += (Math.random() - 0.5) * 10;
}

/** Бүлэг I: бороог зогсоох гэж оролдоход зогсохгүй. Гэрлээ асаахад өрөө дулаарна. */
export default function Ch1Rain({ done, onDone, reduced, compact }: ChapterProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drops = useRef<Drop[]>([]);
  const litRef = useRef(done);
  const [attempts, setAttempts] = useState(0);
  const [litState, setLit] = useState(done);
  const lit = litState || done;
  const [idle, poke] = useIdle(6000, !lit);
  const [lightIdle, pokeLight] = useIdle(6000, !lit);
  const showLight = !lit && (attempts >= 3 || idle);

  useEffect(() => {
    litRef.current = lit;
  }, [lit]);

  // Бороо: canvas + rAF. Харагдахгүй үед зогсоно.
  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!frame || !canvas || !ctx) return;
    const count = compact ? 80 : 140;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = frame.clientWidth;
      h = frame.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (drops.current.length !== count) {
        drops.current = Array.from({ length: count }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          len: 8 + Math.random() * 14,
          v: 0.35 + Math.random() * 0.45,
          push: 0,
        }));
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(frame);

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1.1;
      ctx.lineCap = "round";
      ctx.strokeStyle = litRef.current ? "rgba(246,214,160,0.55)" : "rgba(170,190,210,0.5)";
      ctx.beginPath();
      for (const d of drops.current) {
        d.y += d.v * dt;
        d.x += d.push * dt * 0.06;
        d.push *= Math.pow(0.94, dt / 16);
        if (d.y > h + 20) {
          d.y = -20 - Math.random() * 40;
          d.x = Math.random() * w;
        }
        if (d.x < -10) d.x += w + 20;
        if (d.x > w + 10) d.x -= w + 20;
        const slant = d.push * 0.9 - 1.5;
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + slant, d.y + d.len);
      }
      ctx.stroke();
    };

    if (reduced) {
      draw(0);
      return () => ro.disconnect();
    }

    let raf = 0;
    let visible = true;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;
      draw(dt);
      raf = requestAnimationFrame(loop);
    };
    const run = () => {
      cancelAnimationFrame(raf);
      if (visible && !document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      run();
    });
    io.observe(canvas);
    document.addEventListener("visibilitychange", run);
    run();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", run);
    };
  }, [compact, reduced]);

  const last = useRef<{ x: number } | null>(null);
  const attempt = () => {
    if (lit) return;
    poke();
    pokeLight();
    setAttempts((n) => n + 1);
  };

  const turnOn = () => {
    if (lit) return;
    setLit(true);
    onDone();
  };

  return (
    <Frame
      ref={frameRef}
      className="h-full min-h-60 w-full bg-[linear-gradient(180deg,#151a22,#0d1016)]"
      style={{ touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
      role="group"
      aria-label={rain.prompt}
      onPointerDown={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        last.current = { x: e.clientX - r.left };
        pushDrops(drops.current, e.clientX - r.left, Math.random() > 0.5 ? 1 : -1);
        attempt();
      }}
      onPointerMove={(e) => {
        if (!last.current) return;
        const r = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - r.left;
        pushDrops(drops.current, x, Math.sign(x - last.current.x) || 1, 90);
        last.current = { x };
      }}
      onPointerUp={() => (last.current = null)}
      onPointerCancel={() => (last.current = null)}
    >
      {/* Дулаан гэрэл: бороо орсоор, харин өрөө гэрэлтэнэ */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        initial={false}
        animate={{ opacity: lit ? 1 : 0 }}
        transition={{ duration: reduced ? 0.3 : 1.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 85% 88%, rgba(231,181,110,0.55), rgba(184,134,63,0.25) 45%, rgba(60,40,20,0.15) 75%), linear-gradient(180deg, rgba(60,42,24,0.6), rgba(40,26,14,0.5))",
        }}
      />
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />

      {!lit && (
        <div className="pointer-events-none absolute inset-x-0 top-0 p-4 text-center">
          <Prompt idle={idle && attempts === 0} className="text-paper/85">
            {rain.prompt}
          </Prompt>
        </div>
      )}

      {/* Keyboard-оор оролдох */}
      {!lit && (
        <button
          type="button"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-12 focus:rounded focus:bg-black/60 focus:px-3 focus:py-1 focus:text-[13px] focus:text-paper"
          onClick={() => {
            scatterDrops(drops.current);
            attempt();
          }}
        >
          {rain.prompt}
        </button>
      )}

      {showLight && (
        <motion.button
          type="button"
          onClick={turnOn}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute bottom-3 right-3 z-10 flex items-center gap-2.5 rounded-full py-2 pl-3 pr-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.span
            aria-hidden
            className="block size-3.5 rounded-full bg-gold"
            animate={reduced ? {} : { boxShadow: ["0 0 6px 2px rgba(231,181,110,0.5)", "0 0 18px 6px rgba(231,181,110,0.85)", "0 0 6px 2px rgba(231,181,110,0.5)"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="font-serif text-[16px] italic text-gold">{rain.or}</span>
          <HintGesture show={lightIdle} gesture="tap" className="-left-1 top-1/2 -translate-y-1/2" />
        </motion.button>
      )}
    </Frame>
  );
}
