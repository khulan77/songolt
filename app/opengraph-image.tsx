import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { bloomedBranchSvg } from "@/lib/branch";
import { cover, intro } from "@/lib/content";

export const alt = intro.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Satori-д cyrillic-ext (Ө ө Ү ү) агуулсан фонт хэрэгтэй
const serif = readFile(join(process.cwd(), "assets/PTSerif-Regular.ttf"));
const serifItalic = readFile(join(process.cwd(), "assets/PTSerif-Italic.ttf"));

export default async function Image() {
  const branch = `data:image/svg+xml;base64,${Buffer.from(bloomedBranchSvg()).toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(231,181,110,0.32), rgba(11,14,19,0) 70%), #0B0E13",
          color: "#E8DCC4",
          fontFamily: "PT Serif",
          padding: "0 80px",
        }}
      >
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <img src={branch} width={520} height={200} />
        <div style={{ fontSize: 64, lineHeight: 1.2, textAlign: "center", marginTop: 30 }}>{intro.title}</div>
        <div style={{ fontSize: 30, fontStyle: "italic", color: "#E7B56E", marginTop: 28 }}>{cover.credit}</div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "PT Serif", data: await serif, style: "normal", weight: 400 },
        { name: "PT Serif", data: await serifItalic, style: "italic", weight: 400 },
      ],
    },
  );
}
