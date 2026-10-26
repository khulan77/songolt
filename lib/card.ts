// Хуваалцах картын (1080×1920) байрлал. Instagram story-ийн аюулгүй бүс: y 250–1620.

export const CARD_W = 1080;
export const CARD_H = 1920;
export const SAFE_TOP = 250;
export const SAFE_BOTTOM = 1620;

/** Сонголтын текстийн урт → фонтын хэмжээ (px) */
export function pledgeFontSize(text: string): number {
  const n = [...text.trim()].length;
  if (n <= 12) return 96;
  if (n <= 24) return 76;
  return 56;
}
