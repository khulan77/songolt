"use client";

import { forwardRef } from "react";
import { cover, pledge, share } from "@/lib/content";
import Branch from "./Branch";

type Props = { prisonTitle: string; text: string; hasCover: boolean };

/** 1080×1920 карт. html-to-image нь энэ node-ийг яг энэ хэмжээгээр зураг болгоно. */
const ShareCard = forwardRef<HTMLDivElement, Props>(function ShareCard(
  { prisonTitle, text, hasCover },
  ref,
) {
  return (
    <div
      ref={ref}
      style={{
        width: 1080,
        height: 1920,
        background:
          "radial-gradient(ellipse 80% 45% at 50% 0%, rgba(231,181,110,0.34), rgba(231,181,110,0.06) 55%, transparent 75%), radial-gradient(ellipse 100% 50% at 50% 100%, #1D2229, transparent 70%), #0B0E13",
        color: "#E8DCC4",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "150px 96px 110px",
        boxSizing: "border-box",
        fontFamily: "var(--font-serif)",
      }}
    >
      <Branch bloomed={5} animated={false} rim="rgba(231,181,110,0.6)" className="block h-[331px] w-[860px]" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center" }}>
        <p style={{ fontStyle: "italic", fontSize: 44, color: "#E7B56E", margin: 0, letterSpacing: "0.01em" }}>
          {prisonTitle}
        </p>
        <div style={{ width: 120, height: 2, background: "rgba(231,181,110,0.5)", margin: "44px auto" }} />
        <p style={{ fontSize: 80, lineHeight: 1.3, margin: 0 }}>
          {pledge.prefix}{" "}
          <span style={{ fontStyle: "italic", color: "#F3E2BF" }}>{text}</span> {pledge.suffix}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
        {hasCover && (
          // html-to-image-д энгийн <img> хэрэгтэй
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/cover.png"
            alt={cover.alt}
            width={180}
            height={263}
            style={{ width: 180, height: 263, borderRadius: 4, boxShadow: "0 24px 50px rgba(0,0,0,0.7)" }}
          />
        )}
        <p style={{ fontSize: 34, margin: 0, color: "rgba(232,220,196,0.85)" }}>{cover.credit}</p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 32, margin: "36px 0 0", color: "#E7B56E", letterSpacing: "0.06em" }}>
          {share.tags}
        </p>
      </div>
    </div>
  );
});

export default ShareCard;
