import { describe, expect, test } from "bun:test";
import { chapters, PRISON_KEYS, type PrisonKey } from "./content";
import { scoreAnswers } from "./scoring";

describe("scoreAnswers", () => {
  test("хоосон бол null", () => {
    expect(scoreAnswers([])).toBeNull();
  });

  test("хамгийн олон сонгогдсон нь хожно", () => {
    expect(scoreAnswers(["fear", "memory", "fear", "guilt", "belief"])).toBe(
      "fear",
    );
  });

  test("тэнцвэл хамгийн сүүлд сонгосон нь хожно", () => {
    // memory ×2, fear ×2 — fear сүүлд сонгогдсон
    expect(scoreAnswers(["memory", "fear", "memory", "guilt", "fear"])).toBe(
      "fear",
    );
    // memory ×2, fear ×2 — memory сүүлд сонгогдсон
    expect(scoreAnswers(["fear", "memory", "fear", "guilt", "memory"])).toBe(
      "memory",
    );
    // бүгд 1 удаа — хамгийн сүүлийнх
    expect(
      scoreAnswers(["memory", "unforgiven", "guilt", "belief", "others"]),
    ).toBe("others");
  });

  test("олонх нь эрт сонгогдсон ч сүүлийн ганцаас хүчтэй", () => {
    expect(scoreAnswers(["guilt", "guilt", "fear", "memory", "others"])).toBe(
      "guilt",
    );
  });

  test("бодит бүлгүүдээр 6 үр дүн бүгд гарах боломжтой", () => {
    const reached = new Set<PrisonKey>();
    const walk = (i: number, picked: PrisonKey[]) => {
      if (i === chapters.length) {
        reached.add(scoreAnswers(picked)!);
        return;
      }
      for (const c of chapters[i].choices) walk(i + 1, [...picked, c.key]);
    };
    walk(0, []);
    expect([...reached].sort()).toEqual([...PRISON_KEYS].sort());
  });

  test("бүлэг бүр яг 4 хариулттай, түлхүүрүүд хүчинтэй", () => {
    expect(chapters).toHaveLength(5);
    for (const ch of chapters) {
      expect(ch.choices).toHaveLength(4);
      for (const c of ch.choices) expect(PRISON_KEYS).toContain(c.key);
    }
  });
});
