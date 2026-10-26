"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useCallback, useEffect, useReducer, useRef, useSyncExternalStore, type ReactNode } from "react";
import { disableSound, enableSound, playPageTurn } from "@/lib/audio";
import { chapters, cover, intro, pledge, results, share, ui, type PrisonKey } from "@/lib/content";
import { incrementPledges } from "@/lib/counter";
import { scoreAnswers } from "@/lib/scoring";
import Branch from "./Branch";
import ChoiceOption from "./ChoiceOption";
import Cover from "./Cover";
import GoldDust from "./GoldDust";
import { EASE_BOOK } from "./Page";
import PledgeView from "./PledgeView";
import ResultView from "./ResultView";
import RibbonProgress from "./RibbonProgress";
import ShareView from "./ShareView";
import SoundToggle from "./SoundToggle";
import Spread from "./Spread";
import { InkButton, LightMark, PageInner } from "./ui";

// ───────── Төлөв ─────────

type Screen =
  | { name: "cover" }
  | { name: "intro" }
  | { name: "chapter"; index: number; side: "story" | "question" }
  | { name: "result"; side: "left" | "right" }
  | { name: "pledge" }
  | { name: "share" };

type State = {
  screen: Screen;
  /** Бүлэг бүрт сонгосон хариултын индекс */
  picks: number[];
  /** Сонгогдоод «хатаж» буй хариулт (дахин дарахыг хориглоно) */
  pending: number | null;
  text: string;
  placeholder: number;
  warning: boolean;
  count: number | null;
  sound: boolean;
};

type Action =
  | { type: "OPEN" }
  | { type: "START" }
  | { type: "CONTINUE" }
  | { type: "SELECT"; choice: number }
  | { type: "COMMIT" }
  | { type: "NEXT" }
  | { type: "BACK"; desktop: boolean }
  | { type: "TO_PLEDGE"; placeholder: number }
  | { type: "TEXT"; text: string }
  | { type: "WARN" }
  | { type: "SHARE" }
  | { type: "COUNT"; count: number | null }
  | { type: "SOUND"; on: boolean }
  | { type: "RESTART" };

const initial: State = {
  screen: { name: "cover" },
  picks: [],
  pending: null,
  text: "",
  placeholder: 0,
  warning: false,
  count: null,
  sound: false,
};

function reducer(s: State, a: Action): State {
  const sc = s.screen;
  switch (a.type) {
    case "OPEN":
      return sc.name === "cover" ? { ...s, screen: { name: "intro" } } : s;
    case "START":
      return sc.name === "intro"
        ? { ...s, picks: [], screen: { name: "chapter", index: 0, side: "story" } }
        : s;
    case "CONTINUE":
      if (sc.name === "chapter" && sc.side === "story") return { ...s, screen: { ...sc, side: "question" } };
      if (sc.name === "result" && sc.side === "left") return { ...s, screen: { ...sc, side: "right" } };
      return s;
    case "SELECT":
      if (sc.name !== "chapter" || s.pending !== null || s.picks[sc.index] !== undefined) return s;
      return { ...s, pending: a.choice, screen: { ...sc, side: "question" } };
    case "COMMIT":
      if (sc.name !== "chapter" || s.pending === null) return s;
      return { ...s, picks: [...s.picks.slice(0, sc.index), s.pending] };
    case "NEXT":
      if (sc.name !== "chapter" || s.picks[sc.index] === undefined) return s;
      return {
        ...s,
        pending: null,
        screen:
          sc.index < chapters.length - 1
            ? { name: "chapter", index: sc.index + 1, side: "story" }
            : { name: "result", side: "left" },
      };
    case "BACK": {
      if (s.pending !== null) return s;
      const toQuestion = (i: number): State => ({
        ...s,
        picks: s.picks.slice(0, i),
        screen: { name: "chapter", index: i, side: a.desktop ? "story" : "question" },
      });
      if (sc.name === "chapter") {
        if (!a.desktop && sc.side === "question") return { ...s, screen: { ...sc, side: "story" } };
        return sc.index === 0 ? { ...s, picks: [], screen: { name: "intro" } } : toQuestion(sc.index - 1);
      }
      if (sc.name === "result") {
        if (!a.desktop && sc.side === "right") return { ...s, screen: { ...sc, side: "left" } };
        return toQuestion(chapters.length - 1);
      }
      if (sc.name === "pledge") return { ...s, warning: false, screen: { name: "result", side: "right" } };
      if (sc.name === "share") return { ...s, screen: { name: "pledge" } };
      return s;
    }
    case "TO_PLEDGE":
      return sc.name === "result" ? { ...s, placeholder: a.placeholder, screen: { name: "pledge" } } : s;
    case "TEXT":
      return { ...s, text: a.text.slice(0, pledge.maxLength), warning: false };
    case "WARN":
      return { ...s, warning: true };
    case "SHARE":
      return sc.name === "pledge" ? { ...s, warning: false, screen: { name: "share" } } : s;
    case "COUNT":
      return { ...s, count: a.count };
    case "SOUND":
      return { ...s, sound: a.on };
    case "RESTART":
      return { ...initial, sound: s.sound, screen: { name: "intro" } };
  }
}

/** Номын доторх дараалал — хуудас эргэх чиглэлд */
function orderOf(sc: Screen): number {
  switch (sc.name) {
    case "cover":
      return -1;
    case "intro":
      return 0;
    case "chapter":
      return 1 + sc.index;
    case "result":
      return 20;
    case "pledge":
      return 21;
    case "share":
      return 22;
  }
}

/** Үргэлж хоёр нүүр. Утсан дээр нэг хуудсанд багтах ёстой агуулгыг баруун талд нь нийлүүлнэ. */
function pagesOf(sc: Screen, desktop: boolean): string[] {
  switch (sc.name) {
    case "intro":
      return desktop ? ["intro-l", "intro-r"] : ["endpaper", "intro"];
    case "chapter":
      return [`ch${sc.index}-story`, `ch${sc.index}-q`];
    case "result":
      return ["result-l", "result-r"];
    case "pledge":
      return desktop ? ["pledge-l", "pledge-r"] : ["endpaper", "pledge"];
    default:
      return [];
  }
}

/** Утсан дээр камер аль хуудсыг харах */
function focusOf(sc: Screen): "left" | "right" {
  if (sc.name === "chapter") return sc.side === "story" ? "left" : "right";
  if (sc.name === "result") return sc.side;
  return "right";
}

/** Хуудасны дугаар (номын мэдрэмж) */
function folioOf(id: string): number | undefined {
  const ch = /^ch(\d)-(story|q)$/.exec(id);
  if (ch) return 3 + Number(ch[1]) * 2 + (ch[2] === "q" ? 1 : 0);
  return (
    { "intro-l": 1, "intro-r": 2, intro: 2, "result-l": 13, "result-r": 14, "pledge-l": 15, "pledge-r": 16, pledge: 16 } as Record<string, number>
  )[id];
}

// ───────── Media query ─────────

const DESKTOP_Q = "(min-width: 768px)";
function subscribeDesktop(cb: () => void) {
  const m = window.matchMedia(DESKTOP_Q);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}
const useDesktop = () =>
  useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_Q).matches,
    () => false,
  );

// framer-ийн useReducedMotion нь hydration үед серверээс зөрдөг тул өөрсдөө
const REDUCED_Q = "(prefers-reduced-motion: reduce)";
function subscribeReduced(cb: () => void) {
  const m = window.matchMedia(REDUCED_Q);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}
const useReduced = () =>
  useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_Q).matches,
    () => false,
  );

// ───────── Компонент ─────────

type Props = { hasCover: boolean; hasAudio: boolean };

export default function BookExperience({ hasCover, hasAudio }: Props) {
  const [s, dispatch] = useReducer(reducer, initial);
  const desktop = useDesktop();
  const reduced = useReduced();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const { screen } = s;
  const keys: PrisonKey[] = s.picks.map((p, i) => chapters[i].choices[p].key);
  const resultKey = scoreAnswers(keys) ?? "memory";
  const result = results[resultKey];
  const inBook = screen.name !== "cover" && screen.name !== "share";

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Хуудас солигдох бүрт эргэх чимээ (дуу асаалттай үед л тоглоно)
  const screenKey = JSON.stringify(screen);
  useEffect(() => {
    if (screenKey !== JSON.stringify(initial.screen)) playPageTurn();
  }, [screenKey]);

  const select = useCallback(
    (choice: number) => {
      if (screen.name !== "chapter" || s.pending !== null || s.picks[screen.index] !== undefined) return;
      dispatch({ type: "SELECT", choice });
      // зураас бүрэн болж бэх хатна (0.4с) → цэцэг дэлбэрнэ → 0.6с → хуудас эргэнэ
      const dry = reduced ? 150 : 400;
      timers.current.push(
        setTimeout(() => dispatch({ type: "COMMIT" }), dry),
        setTimeout(() => dispatch({ type: "NEXT" }), dry + (reduced ? 450 : 1000)),
      );
    },
    [screen, s.pending, s.picks, reduced],
  );

  const submitPledge = useCallback(() => {
    if (!s.text.trim()) {
      dispatch({ type: "WARN" });
      return;
    }
    dispatch({ type: "SHARE" });
    // Зөвхөн тоо — текст хэзээ ч илгээгдэхгүй
    incrementPledges().then((n) => n !== null && dispatch({ type: "COUNT", count: n }));
  }, [s.text]);

  const toPledge = useCallback(
    () => dispatch({ type: "TO_PLEDGE", placeholder: Math.floor(Math.random() * pledge.placeholders.length) }),
    [],
  );

  const canBack =
    s.pending === null &&
    (screen.name === "chapter" || screen.name === "result" || screen.name === "pledge");
  const canForward =
    screen.name === "intro" ||
    screen.name === "result" ||
    (!desktop && screen.name === "chapter" && screen.side === "story");
  const focus = focusOf(screen);

  const back = useCallback(() => dispatch({ type: "BACK", desktop }), [desktop]);
  const forward = useCallback(() => {
    if (screen.name === "intro") dispatch({ type: "START" });
    else if (screen.name === "result") {
      if (!desktop && screen.side === "left") dispatch({ type: "CONTINUE" });
      else toPledge();
    }
    else if (screen.name === "chapter" && !desktop) dispatch({ type: "CONTINUE" });
  }, [screen, desktop, toPledge]);

  // Keyboard: ← → хуудас, 1–4 хариулт
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (e.key === "ArrowLeft" && canBack) {
        e.preventDefault();
        back();
      } else if (e.key === "ArrowRight") {
        if (screen.name === "cover") dispatch({ type: "OPEN" });
        else if (canForward) forward();
      } else if (/^[1-4]$/.test(e.key) && screen.name === "chapter" && (desktop || screen.side === "question")) {
        select(Number(e.key) - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canBack, canForward, back, forward, select, screen, desktop]);

  const toggleSound = useCallback(async () => {
    if (s.sound) {
      disableSound();
      dispatch({ type: "SOUND", on: false });
    } else {
      dispatch({ type: "SOUND", on: true });
      const ok = await enableSound();
      if (!ok) dispatch({ type: "SOUND", on: false });
    }
  }, [s.sound]);

  const announce =
    screen.name === "intro"
      ? intro.title
      : screen.name === "chapter"
        ? ui.chapterLabel(chapters[screen.index])
        : screen.name === "result"
          ? result.title
          : screen.name === "pledge"
            ? pledge.title
            : screen.name === "share"
              ? share.title
              : "";

  // ───────── Хуудасны агуулга ─────────

  const renderPage = (id: string | undefined): ReactNode => {
    if (!id) return null;
    const folio = folioOf(id);
    return (
      <>
        {renderContent(id)}
        {folio !== undefined && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-2.5 text-center font-serif text-[12px] italic text-ink-soft"
          >
            {folio}
          </span>
        )}
      </>
    );
  };

  const renderContent = (id: string): ReactNode => {
    if (id === "endpaper") return <Endpaper bloomed={s.picks.length} />;
    if (id === "intro" || id === "intro-l" || id === "intro-r") {
      const title = (
        <h1 className="font-serif text-[30px] leading-[1.22] text-ink md:text-[36px]">{intro.title}</h1>
      );
      const body = (
        <>
          <p className="font-serif text-[18px] italic leading-[1.65] text-ink md:text-[19px]">{intro.body}</p>
          <div className="mt-8">
            <InkButton onClick={() => dispatch({ type: "START" })}>{intro.cta}</InkButton>
          </div>
        </>
      );
      if (id === "intro-l")
        return (
          <PageInner className="justify-center">
            <LightMark className="mb-6" />
            {title}
          </PageInner>
        );
      if (id === "intro-r") return <PageInner className="justify-center">{body}</PageInner>;
      return (
        <PageInner className="justify-center">
          <LightMark className="mb-6" />
          {title}
          <div className="mt-6">{body}</div>
        </PageInner>
      );
    }

    const ch = /^ch(\d)-(story|q)$/.exec(id);
    if (ch) {
      const i = Number(ch[1]);
      const c = chapters[i];
      const label = (
        <p className="font-sans text-[12px] uppercase tracking-[0.2em] text-ink-soft">
          {c.numeral} · {c.title}
        </p>
      );
      if (ch[2] === "story") {
        return (
          <PageInner>
            {label}
            <div className="my-auto py-6">
              <h2 className="font-serif text-[30px] leading-[1.2] text-ink md:text-[34px]">{c.title}</h2>
              <LightMark className="my-5" />
              <StoryText text={c.story} />
            </div>
            {!desktop && (
              <div className="pt-2">
                <InkButton onClick={() => dispatch({ type: "CONTINUE" })}>{ui.continue}</InkButton>
              </div>
            )}
          </PageInner>
        );
      }
      const picked = screen.name === "chapter" && screen.index === i && s.pending !== null ? s.pending : s.picks[i];
      const locked = picked !== undefined && picked !== null;
      return (
        <PageInner className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute -top-2 right-4 select-none font-serif text-[150px] leading-none text-ink/[0.055] md:text-[180px]"
          >
            {c.numeral}
          </span>
          {label}
          <div className="relative my-auto py-5">
            <h3 className="font-serif text-[23px] leading-[1.38] text-ink md:text-[25px]">{c.question}</h3>
            <div aria-hidden className="mt-4 h-px w-16 bg-gold-deep/60" />
            <ol className="mt-5 space-y-2.5">
              {c.choices.map((o, k) => (
                <ChoiceOption
                  key={k}
                  index={k}
                  text={o.text}
                  selected={picked === k}
                  locked={locked}
                  onSelect={() => select(k)}
                />
              ))}
            </ol>
          </div>
        </PageInner>
      );
    }

    if (id.startsWith("result")) {
      const part = id === "result-l" ? "left" : id === "result-r" ? "right" : "all";
      return (
        <ResultView
          result={result}
          part={part}
          onNext={toPledge}
          onContinue={desktop ? undefined : () => dispatch({ type: "CONTINUE" })}
          continueLabel={ui.continue}
        />
      );
    }

    if (id.startsWith("pledge")) {
      const part = id === "pledge-l" ? "left" : id === "pledge-r" ? "right" : "all";
      return (
        <PledgeView
          part={part}
          value={s.text}
          placeholder={pledge.placeholders[s.placeholder]}
          warning={s.warning}
          onChange={(text) => dispatch({ type: "TEXT", text })}
          onSubmit={submitPledge}
        />
      );
    }
    return null;
  };

  const sway = screen.name === "result" || screen.name === "pledge";
  const fade = { duration: reduced ? 0.4 : 0.9, ease: EASE_BOOK };

  return (
    <MotionConfig reducedMotion="user">
      <main className="scene relative h-dvh w-full overflow-hidden">
        {!reduced && <GoldDust />}
        <div className="grain" aria-hidden />
        <div aria-live="polite" className="sr-only">
          {announce}
        </div>

        {/* Дээд мөр */}
        <header className="absolute inset-x-0 top-0 z-40 flex items-start justify-between px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <div className="min-h-11 min-w-11">
            {inBook && canBack && (
              <button
                type="button"
                onClick={back}
                aria-label={ui.back}
                className="grid size-11 place-items-center rounded-full text-paper/70 transition-colors hover:bg-white/5 hover:text-gold"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                  <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex items-start gap-2">
            {hasAudio && <SoundToggle on={s.sound} onToggle={toggleSound} />}
            {screen.name !== "cover" && (
              <div className="pr-1">
                <RibbonProgress done={s.picks.length} />
              </div>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {screen.name === "cover" && (
            <motion.div
              key="cover"
              className="h-full"
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0.3 : 0.35 }}
            >
              <Cover hasCover={hasCover} reduced={reduced} onOpen={() => dispatch({ type: "OPEN" })} />
            </motion.div>
          )}

          {inBook && (
            <motion.div
              key="book"
              className="book-vars flex h-full flex-col items-center px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-14 md:justify-center md:pt-12 min-[1100px]:flex-row min-[1100px]:gap-10 min-[1100px]:pt-6"
              initial={{ opacity: 0, scale: reduced ? 1 : 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reduced ? 1 : 0.97 }}
              transition={fade}
            >
              <Branch
                bloomed={s.picks.length}
                sway={sway}
                label={ui.branchAlt}
                className="h-18 w-auto shrink-0 md:mb-6 md:h-24 min-[1100px]:hidden"
              />
              <div className="relative -mx-4 md:mx-0">
                <Spread
                  pages={pagesOf(screen, desktop)}
                  order={orderOf(screen)}
                  renderPage={renderPage}
                  desktop={desktop}
                  focus={focus}
                  reduced={reduced}
                  canBack={canBack}
                  canForward={canForward}
                  onBack={back}
                  onForward={forward}
                  backLabel={ui.back}
                  forwardLabel={ui.continue}
                />
              </div>
              <Branch
                bloomed={s.picks.length}
                sway={sway}
                orientation="vertical"
                className="hidden h-[min(72vh,620px)] w-auto shrink-0 min-[1100px]:block"
              />
            </motion.div>
          )}

          {screen.name === "share" && (
            <motion.div
              key="share"
              className="h-full"
              initial={{ opacity: 0, y: reduced ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={fade}
            >
              <ShareView
                prisonTitle={result.title}
                text={s.text.trim()}
                hasCover={hasCover}
                count={s.count}
                onRestart={() => {
                  timers.current.forEach(clearTimeout);
                  dispatch({ type: "RESTART" });
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </MotionConfig>
  );
}

/** Түүхийн текст: үсгээр эхэлбэл том эхний үсэг (drop cap) */
function StoryText({ text }: { text: string }) {
  const first = text[0];
  const drop = /\p{L}/u.test(first);
  return (
    <p className="font-serif text-[18px] italic leading-[1.68] text-ink md:text-[19px]">
      {drop && (
        <span
          aria-hidden
          className="float-left mr-2 mt-1.5 font-serif text-[62px] not-italic leading-[0.8] text-[#7a4f1f]"
        >
          {first}
        </span>
      )}
      {drop ? <span className="sr-only">{first}</span> : null}
      {drop ? text.slice(1) : text}
    </p>
  );
}

/** Номын хавтасны дотор тал (endpaper) — утсан дээрх зүүн нүүр */
function Endpaper({ bloomed }: { bloomed: number }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-8">
      <Branch
        bloomed={bloomed}
        animated={false}
        orientation="vertical"
        rim="rgba(184,134,63,0.35)"
        className="h-[55%] w-auto opacity-45"
      />
      <p className="text-center font-serif text-[14px] italic text-ink-soft">{cover.credit}</p>
    </div>
  );
}
