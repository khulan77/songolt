"use client";

import { AnimatePresence, motion } from "framer-motion";
import { toBlob } from "html-to-image";
import { useCallback, useEffect, useRef, useState } from "react";
import { CARD_H, CARD_W } from "@/lib/card";
import { share, ui } from "@/lib/content";
import { EASE_BOOK } from "./Page";
import ShareCard from "./ShareCard";

const FILE_NAME = "songolt-minii-songolt.png";
const REEL_URL = process.env.NEXT_PUBLIC_REEL_URL;

type Props = {
  text: string;
  hasCover: boolean;
  count: number | null;
  onRestart: () => void;
};

async function renderCard(node: HTMLElement): Promise<Blob | null> {
  await document.fonts.ready;
  const opts = { width: CARD_W, height: CARD_H, pixelRatio: 1, cacheBust: true };
  // Safari анхны удаад фонт/зургийг алгасдаг тул эхний дуудлага нь «халаалт»
  await toBlob(node, opts).catch(() => null);
  return toBlob(node, opts);
}

function isIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export default function ShareView({ text, hasCover, count, onRestart }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [modalUrl, setModalUrl] = useState<string | null>(null);

  // Урьдчилсан харагдацыг хүрээндээ багтаана
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / CARD_W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // navigator.share нь хэрэглэгчийн үйлдлийн дотор шууд дуудагдах ёстой тул зургийг урьдчилан бэлдэнэ
  useEffect(() => {
    let alive = true;
    const node = cardRef.current;
    if (!node) return;
    renderCard(node)
      .then((b) => alive && setBlob(b))
      .catch(() => alive && setBlob(null));
    return () => {
      alive = false;
    };
  }, [text]);

  const closeModal = useCallback(() => {
    if (modalUrl) URL.revokeObjectURL(modalUrl);
    setModalUrl(null);
  }, [modalUrl]);

  useEffect(() => {
    if (!modalUrl) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalUrl, closeModal]);

  const getBlob = async (): Promise<Blob | null> => {
    if (blob) return blob;
    if (busy || !cardRef.current) return null;
    setBusy(true);
    const b = await renderCard(cardRef.current).catch(() => null);
    setBusy(false);
    if (b) setBlob(b);
    return b;
  };

  // Татах; iOS дээр татаж чадахгүй тул модалд харуулж удаан дарж хадгалуулна
  const save = (b: Blob) => {
    const url = URL.createObjectURL(b);
    if (isIOS()) {
      setModalUrl(url);
      return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = FILE_NAME;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const download = async () => {
    const b = await getBlob();
    if (b) save(b);
  };

  // Боломжтой бол системийн share sheet (Instagram story руу шууд), үгүй бол татах руу шилжинэ
  const shareStory = async () => {
    const b = await getBlob();
    if (!b) return;
    const file = new File([b], FILE_NAME, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: share.shareTitle });
        return;
      } catch (err) {
        if ((err as DOMException)?.name === "AbortError") return;
      }
    }
    save(b);
  };

  return (
    <div className="page-scroll flex h-full flex-col items-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-16 md:pt-14">
      <h1 className="font-serif text-[30px] text-paper md:text-[34px]">{share.title}</h1>

      <div
        ref={frameRef}
        className="relative mt-5 aspect-[9/16] w-[min(62vw,calc((100dvh-360px)*0.5625),300px)] min-w-40 shrink-0 overflow-hidden rounded-xl shadow-[0_30px_70px_-20px_rgba(0,0,0,0.9),0_0_0_1px_rgba(231,181,110,0.18)] md:w-[min(300px,calc((100vh-340px)*0.5625))]"
      >
        <div style={{ width: CARD_W, height: CARD_H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <ShareCard ref={cardRef} text={text} hasCover={hasCover} />
        </div>
      </div>

      <div className="mt-6 flex w-full max-w-sm flex-col gap-3">
        <button
          type="button"
          onClick={shareStory}
          aria-busy={busy}
          className="min-h-12 w-full rounded-full bg-gold px-6 font-sans text-[16px] text-bg-deep shadow-[0_8px_30px_-8px_rgba(231,181,110,0.6)] transition-transform hover:-translate-y-0.5"
        >
          {share.story}
        </button>
        <p className="text-center font-sans text-[14px] leading-[1.55] text-paper/80">{share.storyHint}</p>
        <div className="mt-1 flex gap-3">
          <button
            type="button"
            onClick={download}
            aria-busy={busy}
            className="min-h-12 flex-1 rounded-full border border-gold/50 px-4 font-sans text-[15px] text-gold transition-colors hover:border-gold"
          >
            {share.download}
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="min-h-12 flex-1 rounded-full border border-paper/30 px-4 font-sans text-[15px] text-paper transition-colors hover:border-gold hover:text-gold"
          >
            {share.restart}
          </button>
        </div>
      </div>

      {REEL_URL && (
        <a
          href={REEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 font-sans text-[15px] text-gold underline decoration-gold/40 underline-offset-4 hover:decoration-gold"
        >
          {share.reel}
        </a>
      )}

      {count !== null && (
        <p className="mt-3 text-center font-serif text-[15px] italic text-gold/90">{share.counter(count)}</p>
      )}

      <AnimatePresence>
        {modalUrl && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={share.longPress}
            className="fixed inset-0 z-70 flex flex-col items-center justify-center gap-4 bg-black/85 p-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_BOOK }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={modalUrl}
              alt={share.title}
              className="max-h-[70dvh] w-auto rounded-lg shadow-2xl [-webkit-touch-callout:default]"
            />
            <p className="text-center font-sans text-[16px] text-paper">{share.longPress}</p>
            <button
              type="button"
              autoFocus
              onClick={closeModal}
              className="min-h-11 rounded-full border border-paper/30 px-6 font-sans text-paper"
            >
              {ui.close}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
