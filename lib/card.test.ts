import { expect, test } from "bun:test";
import { pledgeFontSize } from "./card";

test("сонголтын текстийн уртаар фонт багасна", () => {
  expect(pledgeFontSize("Аз")).toBe(96);
  expect(pledgeFontSize("а".repeat(12))).toBe(96);
  expect(pledgeFontSize("а".repeat(13))).toBe(76);
  expect(pledgeFontSize("өөртөө зөөлөн хандахыг")).toBe(76); // 22
  expect(pledgeFontSize("а".repeat(24))).toBe(76);
  expect(pledgeFontSize("а".repeat(25))).toBe(56);
  expect(pledgeFontSize("x".repeat(48))).toBe(56);
  // Өмнөх/хойд зайг тоолохгүй
  expect(pledgeFontSize("   Аз   ")).toBe(96);
});
