"use client";

import { useEffect, useRef } from "react";

type Mote = { x: number; y: number; vx: number; vy: number; r: number; a: number; tw: number };
type Spark = { x: number; y: number; vx: number; vy: number; born: number };

const MOTES = 26;
const MAX_SPARKS = 16;
const SPARK_LIFE = 800;

/** Хөвөх алтан тоосонцор + desktop-д курсорын араас оч. reduced-motion үед render хийгдэхгүй. */
export default function GoldDust() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const motes: Mote[] = Array.from({ length: MOTES }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.08,
      vy: -0.04 - Math.random() * 0.1,
      r: 0.6 + Math.random() * 1.4,
      a: 0.15 + Math.random() * 0.4,
      tw: Math.random() * Math.PI * 2,
    }));
    const sparks: Spark[] = [];
    let lastSpark = 0;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastSpark < 45) return;
      lastSpark = now;
      if (sparks.length >= MAX_SPARKS) sparks.shift();
      sparks.push({
        x: e.clientX,
        y: e.clientY,
        vx: (Math.random() - 0.5) * 0.4,
        vy: 0.15 + Math.random() * 0.35,
        born: now,
      });
    };
    if (finePointer) window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", resize);

    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - prev, 50);
      prev = now;
      ctx.clearRect(0, 0, w, h);

      for (const m of motes) {
        m.x += m.vx * dt * 0.06;
        m.y += m.vy * dt * 0.06;
        m.tw += dt * 0.0012;
        if (m.y < -10) {
          m.y = h + 10;
          m.x = Math.random() * w;
        }
        if (m.x < -10) m.x = w + 10;
        if (m.x > w + 10) m.x = -10;
        ctx.globalAlpha = m.a * (0.6 + 0.4 * Math.sin(m.tw));
        ctx.fillStyle = "#E7B56E";
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        const age = now - s.born;
        if (age > SPARK_LIFE) {
          sparks.splice(i, 1);
          continue;
        }
        s.x += s.vx * dt * 0.06;
        s.y += s.vy * dt * 0.06;
        const life = 1 - age / SPARK_LIFE;
        ctx.globalAlpha = life * 0.9;
        ctx.fillStyle = "#F3CD8E";
        ctx.shadowColor = "#E7B56E";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.6 * life + 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
      raf = document.hidden ? 0 : requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onVis = () => {
      if (!document.hidden && !raf) {
        prev = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-50 h-full w-full" />;
}
