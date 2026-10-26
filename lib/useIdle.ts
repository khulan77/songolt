"use client";

import { useCallback, useEffect, useState } from "react";

/** `ms` хугацаанд үйлдэлгүй бол true. poke() дуудах бүрт дахин тоолно. */
export function useIdle(ms: number, active: boolean): [boolean, () => void] {
  const [idle, setIdle] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setIdle(true), ms);
    return () => clearTimeout(t);
  }, [ms, active, tick]);

  const poke = useCallback(() => {
    setIdle(false);
    setTick((n) => n + 1);
  }, []);

  return [idle && active, poke];
}
