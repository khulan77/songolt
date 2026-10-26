"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Leaf } from "./Page";

type Flip = { from: string[]; to: string[]; dir: 1 | -1; id: number };

// Утсан дээр зүүн хуудас нуруунаасаа хол руу хазайж, нээлттэй ном шиг харагдана
const TILT = -70;
const tiltStyle = (tilted: boolean) => ({
  transformOrigin: "right center",
  transform: `rotateY(${tilted ? TILT : 0}deg)`,
  transition: "transform 0.7s var(--ease-book)",
});

function useViewportWidth() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("resize", cb);
      return () => window.removeEventListener("resize", cb);
    },
    () => window.innerWidth,
    () => 390,
  );
}

type Props = {
  /** Үргэлж [зүүн, баруун] — утсан дээр ч нээлттэй ном */
  pages: string[];
  /** Номын доторх дараалал — эргэх чиглэлийг тодорхойлно */
  order: number;
  renderPage: (id: string | undefined) => ReactNode;
  desktop: boolean;
  reduced: boolean;
  canBack: boolean;
  canForward: boolean;
  onBack: () => void;
  onForward: () => void;
  backLabel: string;
};

export default function Spread({
  pages,
  order,
  renderPage,
  desktop,
  reduced,
  canBack,
  canForward,
  onBack,
  onForward,
  backLabel,
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

  // Утас: ном анх нээгдэхэд болон хуудас эргэх үед камер холдож бүтэн дэлгээтэй номыг харуулна
  const mobile3d = !desktop && !reduced;
  const [introZoom, setIntroZoom] = useState(mobile3d);
  useEffect(() => {
    if (!introZoom) return;
    const t = setTimeout(() => setIntroZoom(false), 1100);
    return () => clearTimeout(t);
  }, [introZoom]);
  const zoomed = mobile3d && (introZoom || !!flip);
  const tilted = !desktop && !zoomed;

  // Шинэ хуудас руу focus шилжүүлнэ (keyboard хэрэглэгчид)
  const settledRef = useRef<HTMLDivElement>(null);
  const settledKey = flip ? null : view.shown.join("|");
  useEffect(() => {
    if (settledKey) settledRef.current?.focus({ preventScroll: true });
  }, [settledKey]);

  // Утсан дээр зүүн хуудас зөвхөн чимэглэл — Tab очихгүй
  const leftInert = !!flip || !desktop;
  const rightInert = !!flip;

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
        <LeftSlot mobile={!desktop} tilted={tilted} inert={leftInert}>
          {renderPage(pages[0])}
        </LeftSlot>
        <div className={`${paperCls} paper-right right-0 rounded-r-sm`} inert={rightInert}>
          {renderPage(pages[1])}
        </div>
        <Spine />
      </motion.div>
    </AnimatePresence>
  ) : (
    <div ref={settledRef} tabIndex={-1} className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
      <LeftSlot mobile={!desktop} tilted={tilted} inert={leftInert}>
        {renderPage(L)}
      </LeftSlot>
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
            delay={mobile3d ? 0.4 : 0}
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
            delay={mobile3d ? 0.4 : 0}
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

  // ───────── Утас: нээлттэй ном. Баруун хуудсыг уншина, зүүн нь хазайж харагдана ─────────
  return (
    <MobileViewport
      zoomed={zoomed}
      canBack={canBack}
      onBack={onBack}
      backLabel={backLabel}
      flipping={!!flip}
    >
      <BookBoard half="right" />
      {pagesEl}
    </MobileViewport>
  );
}

/** Утасны «камер»: амрах үед баруун хуудас дэлгэцийг дүүргэнэ, zoomed үед бүтэн дэлгээтэй ном багтана */
function MobileViewport({
  children,
  zoomed,
  canBack,
  onBack,
  backLabel,
  flipping,
}: {
  children: ReactNode;
  zoomed: boolean;
  canBack: boolean;
  onBack: () => void;
  backLabel: string;
  flipping: boolean;
}) {
  const touch = useRef<{ x: number; y: number } | null>(null);
  const vw = useViewportWidth();
  const pw = Math.min(vw - 76, 440); // .book-vars --pw-тэй ижил
  const restX = vw - 16 - pw * 2;
  const scale = Math.min(1, (vw - 28) / (pw * 2 + 24));
  const zoomX = (vw - pw * 2 * scale) / 2;

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
        // Баруун тийш шудрах = өмнөх хуудас
        if (dx > 60 && Math.abs(dy) < Math.abs(dx) * 0.6 && canBack) onBack();
      }}
    >
      {/* Камер нь 2D (x, scale) — 3D нь зөвхөн идэвхгүй зүүн хуудас ба эргэх хуудсанд, touch-д нөлөөлөхгүй */}
      <motion.div
        className="relative h-(--ph) w-[calc(var(--pw)*2)]"
        style={{ perspective: 1200, originX: 0, originY: 0.5 }}
        initial={false}
        animate={zoomed ? { x: zoomX, scale } : { x: restX, scale: 1 }}
        transition={{ duration: zoomed ? 0.5 : 0.75, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>

      {/* Зүүн хуудас дээр дарахад өмнөх хуудас */}
      {!flipping && canBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          className="absolute inset-y-4 left-0 z-30 flex w-[calc(100vw-16px-var(--pw))] items-center justify-center"
        >
          <motion.svg
            viewBox="0 0 12 20"
            className="h-5 w-3 text-gold"
            aria-hidden
            animate={{ x: [0, -3, 0], opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <path d="M9 2 L3 10 L9 18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        </button>
      )}
    </div>
  );
}

/** Зүүн хуудас. Утсан дээр нуруунаасаа хазайх тул хавтасны хагасыг хамт авч хазайна */
function LeftSlot({ mobile, tilted, inert, children }: { mobile: boolean; tilted: boolean; inert: boolean; children: ReactNode }) {
  if (!mobile)
    return (
      <div className="paper paper-left absolute left-0 top-0 h-full w-1/2 rounded-l-sm" inert={inert}>
        {children}
      </div>
    );
  return (
    <div className="absolute left-0 top-0 h-full w-1/2" style={tiltStyle(tilted)} inert={inert}>
      <BookBoard half="left" />
      <div className="paper paper-left absolute inset-0 rounded-l-sm">{children}</div>
    </div>
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

/** Номын хатуу хавтасны ирмэг + ширээн дээрх сүүдэр. Утсан дээр хоёр хагасаар (зүүн нь хазайна) */
function BookBoard({ half }: { half?: "left" | "right" }) {
  const inset =
    half === "left"
      ? "-left-3 right-0 -inset-y-2.5 rounded-l-md"
      : half === "right"
        ? "left-1/2 -right-3 -inset-y-2.5 rounded-r-md"
        : "-inset-x-3 -inset-y-2.5 rounded-md";
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute ${inset}`}
      style={{
        background: "linear-gradient(180deg, #2a2420, #15110e)",
        boxShadow: "0 40px 80px -20px rgba(0,0,0,0.85), 0 10px 30px rgba(0,0,0,0.5)",
      }}
    >
      {/* Цаасан хуудсуудын ирмэг */}
      <div
        className={`absolute inset-y-1.5 ${half === "left" ? "left-2 right-0" : half === "right" ? "left-0 right-2" : "inset-x-2"} rounded-sm`}
        style={{
          background: "repeating-linear-gradient(180deg, var(--paper-edge) 0 1px, #b5a585 1px 2px)",
        }}
      />
    </div>
  );
}
