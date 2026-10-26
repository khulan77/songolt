"use client";

import { forwardRef, type CSSProperties } from "react";
import { CARD_H, CARD_W, pledgeFontSize } from "@/lib/card";
import { cover, pledge, share } from "@/lib/content";
import Branch from "./Branch";

type Props = { text: string; hasCover: boolean };

// Instagram story-ийн аюулгүй бүс y 250–1620. Дээд 250, доод 300px-д зөвхөн дэвсгэр.
// Блок бүр тогтмол y-тэй тул текст урт байсан ч бусад нь хөдлөхгүй.
const TEXT_W = 860;
const abs = (top: number, height: number, width = CARD_W): CSSProperties => ({
  position: "absolute",
  top,
  height,
  width,
  left: (CARD_W - width) / 2,
});

/** 1080×1920 карт. html-to-image нь энэ node-ийг яг энэ хэмжээгээр зураг болгоно. */
const ShareCard = forwardRef<HTMLDivElement, Props>(function ShareCard(
  { text, hasCover },
  ref,
) {
  const size = pledgeFontSize(text);
  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: CARD_W,
        height: CARD_H,
        overflow: "hidden",
        background:
          "radial-gradient(ellipse 80% 45% at 50% 0%, rgba(231,181,110,0.34), rgba(231,181,110,0.06) 55%, transparent 75%), radial-gradient(ellipse 100% 50% at 50% 100%, #1D2229, transparent 70%), #0B0E13",
        color: "#E8DCC4",
        fontFamily: "var(--font-serif)",
      }}
    >
      {/* Мөчир: y 300–620 */}
      <div data-card="branch" style={abs(300, 320, 832)}>
        <Branch bloomed={6} animated={false} rim="rgba(231,181,110,0.6)" className="block h-full w-full" />
      </div>

      {/* «Миний сонголт» + сонголт: y 660–1240 */}
      <div
        data-card="middle"
        style={{
          ...abs(660, 580, TEXT_W),
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <p style={{ fontStyle: "italic", fontSize: 44, lineHeight: 1.3, color: "#E7B56E", margin: 0 }}>
          {share.cardLabel}
        </p>
        <div style={{ width: 120, height: 2, background: "rgba(231,181,110,0.5)", margin: "36px auto" }} />
        <p
          data-card="pledge"
          style={{
            width: TEXT_W,
            maxWidth: TEXT_W,
            margin: 0,
            fontSize: size,
            // line-clamp-ын overflow:hidden нь «д», «у»-ийн сүүлийг тайрахгүйн тулд зай үлдээнэ
            lineHeight: 1.3,
            padding: "0.1em 0",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 3,
            overflow: "hidden",
          }}
        >
          {pledge.prefix} <span style={{ fontStyle: "italic", color: "#F3E2BF" }}>{text}</span> {pledge.suffix}
        </p>
      </div>

      {/* Хавтас: y 1300–1504 */}
      {hasCover && (
        // html-to-image-д энгийн <img> хэрэгтэй
        // eslint-disable-next-line @next/next/no-img-element
        <img
          data-card="cover"
          src="/cover.png"
          alt={cover.alt}
          width={140}
          height={204}
          style={{ ...abs(1300, 204, 140), borderRadius: 4, boxShadow: "0 20px 44px rgba(0,0,0,0.7)" }}
        />
      )}

      {/* Зохиогч: y 1526–1562 */}
      <p
        data-card="credit"
        style={{ ...abs(1526, 36), margin: 0, fontSize: 30, lineHeight: "36px", textAlign: "center", color: "rgba(232,220,196,0.85)" }}
      >
        {cover.credit}
      </p>
    </div>
  );
});

export default ShareCard;
