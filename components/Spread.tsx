"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Leaf } from "./Page";

type Flip = { from: string[]; to: string[]; dir: 1 | -1; id: number };

type Props = {
  /** Үргэлж [зүүн, баруун] — утсан дээр ч нээлттэй ном */
  pages: string[];
  /** Номын доторх дараалал — эргэх чиглэлийг тодорхойлно */
  order: number;
  renderPage: (id: string | undefined) => ReactNode;
  desktop: boolean;
  /** Утсан дээр камер аль хуудсыг харж байгаа */
  focus: "left" | "right";
  reduced: boolean;
  canBack: boolean;
  canForward: boolean;
  onBack: () => void;
  onForward: () => void;
  backLabel: string;
  forwardLabel: string;
};

export default function Spread({
  pages,
  order,
  renderPage,
  desktop,
  focus,
  reduced,
  canBack,
  canForward,
  onBack,
  onForward,
  backLabel,
  forwardLabel,
}: Props) {
  const key = pages.join("|");
  const [st, setSt] = useState<{ key: string; order: number; shown: string[]; flip: Flip | null }>(
    { key, order, shown: pages, flip: null },
  );

  // Props өөрчлөгдөхөд render дотроо төлөв тохируулна (effect-гүй).
  // setSt-ийн дараа энэ render үргэлжилдэг тул хуучин `st` биш шинэ утгыг ашиглана.
  let view = st;
  if (st.key !== key) {
    const from = st.flip ? st.flip.to : st.shown;
    const canFlip = !reduced;
    view = {
      key,
      order,
      shown: canFlip ? from : pages,
      flip: canFlip
        ? { from, to: pages, dir: order >= st.order ? 1 : -1, id: (st.flip?.id ?? 0) + 1 }
        : null,
    };
    setSt(view);
  }

  const done = useCallback(() => {
    setSt((s) => (s.flip ? { ...s, shown: s.flip.to, flip: null } : s));
  }, []);

  const { flip } = view;

  // Шинэ хуудас руу focus шилжүүлнэ (keyboard хэрэглэгчид)
  const settledRef = useRef<HTMLDivElement>(null);
  const settledKey = flip ? null : `${view.shown.join("|")}:${desktop ? "" : focus}`;
  useEffect(() => {
    if (settledKey) settledRef.current?.focus({ preventScroll: true });
  }, [settledKey]);

  // Утсан дээр харагдахгүй байгаа хуудсыг идэвхгүй болгоно (Tab очихгүй)
  const leftInert = !!flip || (!desktop && focus === "right");
  const rightInert = !!flip || (!desktop && focus === "left");

  const paperCls = "paper absolute top-0 h-full w-1/2";
  const L = flip ? (flip.dir === 1 ? flip.from[0] : flip.to[0]) : view.shown[0];
  const R = flip ? (flip.dir === 1 ? flip.to[1] : flip.from[1]) : view.shown[1];

  const pagesEl = reduced ? (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={key}
        ref={settledRef}
        tabIndex={-1}
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className={`${paperCls} paper-left left-0 rounded-l-sm`} inert={leftInert}>
          {renderPage(pages[0])}
        </div>
        <div className={`${paperCls} paper-right right-0 rounded-r-sm`} inert={rightInert}>
          {renderPage(pages[1])}
        </div>
        <Spine />
      </motion.div>
    </AnimatePresence>
  ) : (
    <div ref={settledRef} tabIndex={-1} className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
      <div className={`${paperCls} paper-left left-0 rounded-l-sm`} inert={leftInert}>
        {renderPage(L)}
      </div>
      <div className={`${paperCls} paper-right right-0 rounded-r-sm`} inert={rightInert}>
        {renderPage(R)}
      </div>
      {flip &&
        (flip.dir === 1 ? (
          <Leaf
            key={flip.id}
            className="left-1/2 w-1/2"
            frontClass="paper paper-right"
            backClass="paper paper-left"
            front={renderPage(flip.from[1])}
            back={renderPage(flip.to[0])}
            from={0}
            to={-180}
            origin="left"
            onDone={done}
          />
        ) : (
          <Leaf
            key={flip.id}
            className="left-0 w-1/2"
            frontClass="paper paper-left"
            backClass="paper paper-right"
            front={renderPage(flip.from[0])}
            back={renderPage(flip.to[1])}
            from={0}
            to={180}
            origin="right"
            onDone={done}
          />
        ))}
      <Spine />
    </div>
  );

  if (desktop) {
    return (
      <div className="relative h-(--ph) w-[calc(var(--pw)*2)]" style={{ perspective: 2000 }}>
        <BookBoard />
        {pagesEl}
        {!flip && canBack && (
          <button type="button" className="curl curl-left curl-hint" onClick={onBack} aria-label={backLabel} />
        )}
        {!flip && canForward && (
          <button
            type="button"
            className="curl curl-right curl-hint"
            onClick={onForward}
            aria-hidden
            tabIndex={-1}
          />
        )}
      </div>
    );
  }

  // ───────── Утас: нээлттэй ном, камер хуудас хооронд гулсана ─────────
  return (
    <MobileViewport
      focus={focus}
      canBack={canBack}
      canForward={canForward}
      onBack={onBack}
      onForward={onForward}
      backLabel={backLabel}
      forwardLabel={forwardLabel}
      flipping={!!flip}
    >
      <BookBoard />
      {pagesEl}
    </MobileViewport>
  );
}

function MobileViewport({
  children,
  focus,
  canBack,
  canForward,
  onBack,
  onForward,
  backLabel,
  forwardLabel,
  flipping,
}: {
  children: ReactNode;
  focus: "left" | "right";
  canBack: boolean;
  canForward: boolean;
  onBack: () => void;
  onForward: () => void;
  backLabel: string;
  forwardLabel: string;
  flipping: boolean;
}) {
  const touch = useRef<{ x: number; y: number } | null>(null);
  const peekBack = !flipping && canBack && focus === "right";
  const peekForward = !flipping && canForward && focus === "left";

  return (
    <div
      className="relative w-screen overflow-clip py-4"
      onTouchStart={(e) => {
        const t = e.touches[0];
        touch.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e) => {
        const s = touch.current;
        touch.current = null;
        if (!s) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - s.x;
        const dy = t.clientY - s.y;
        if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
        // Баруун тийш шудрах = өмнөх, зүүн тийш = дараагийнх (зөвхөн хариулт шаардлагагүй үед)
        if (dx > 0 && canBack) onBack();
        else if (dx < 0 && canForward) onForward();
      }}
    >
      <div
        className="relative h-(--ph) w-[calc(var(--pw)*2)]"
        // Камер нь хавтгай translate: preserve-3d + rotateY нь touch-ийн hit-test-ийг эвддэг.
        // perspective энд байгаа тул хуудас эргэлт 3D хэвээр.
        style={{
          perspective: 1600,
          transform: focus === "left" ? "translateX(var(--pan-l))" : "translateX(var(--pan-r))",
          transition: "transform 1s var(--ease-book) 0.08s",
        }}
      >
        {children}
      </div>

      {/* Цухуйсан хуудасны ирмэг — дарахад тэр тийш шилжинэ */}
      {peekBack && <PeekButton side="left" label={backLabel} onClick={onBack} />}
      {peekForward && <PeekButton side="right" label={forwardLabel} onClick={onForward} />}
    </div>
  );
}

function PeekButton({ side, label, onClick }: { side: "left" | "right"; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`absolute inset-y-4 z-30 flex w-[calc((100vw-var(--pw))/2+6px)] items-center justify-center ${side === "left" ? "left-0" : "right-0"}`}
    >
      <motion.svg
        viewBox="0 0 12 20"
        className="h-5 w-3 text-gold-deep"
        aria-hidden
        animate={{ x: side === "left" ? [0, -3, 0] : [0, 3, 0], opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d={side === "left" ? "M9 2 L3 10 L9 18" : "M3 2 L9 10 L3 18"}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.svg>
    </button>
  );
}

/** Нурууны хотгор: хоёр хуудас нийлэх газрын гүн сүүдэр */
function Spine() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-10 -translate-x-1/2"
      style={{
        background:
          "linear-gradient(90deg, transparent, rgba(60,40,20,0.18) 40%, rgba(40,25,10,0.42) 50%, rgba(60,40,20,0.18) 60%, transparent)",
      }}
    />
  );
}

/** Номын хатуу хавтасны ирмэг + ширээн дээрх сүүдэр */
function BookBoard() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -inset-x-3 -inset-y-2.5 rounded-md"
      style={{
        background: "linear-gradient(180deg, #2a2420, #15110e)",
        boxShadow: "0 40px 80px -20px rgba(0,0,0,0.85), 0 10px 30px rgba(0,0,0,0.5)",
      }}
    >
      {/* Цаасан хуудсуудын ирмэг */}
      <div
        className="absolute inset-x-2 inset-y-1.5 rounded-sm"
        style={{
          background: "repeating-linear-gradient(180deg, var(--paper-edge) 0 1px, #b5a585 1px 2px)",
        }}
      />
    </div>
  );
}
