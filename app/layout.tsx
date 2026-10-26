import type { Metadata, Viewport } from "next";
import { PT_Sans, PT_Serif } from "next/font/google";
import { meta } from "@/lib/content";
import "./globals.css";

// Ө ө Ү ү нь cyrillic-ext (U+0460–052F) дотор байдаг
const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
  // Зөвхөн 400 (normal + italic) — preload-ыг цөөн байлгаж LCP-г хурдасгана
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const ptSans = PT_Sans({
  variable: "--font-pt-sans",
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3000"),
  ),
  title: meta.title,
  description: meta.description,
  openGraph: {
    title: meta.title,
    description: meta.description,
    locale: "mn_MN",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: meta.title, description: meta.description },
};

export const viewport: Viewport = {
  themeColor: "#0B0E13",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="mn" className={`${ptSerif.variable} ${ptSans.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
