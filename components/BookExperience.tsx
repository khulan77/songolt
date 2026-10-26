"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Fragment, useCallback, useEffect, useReducer, useSyncExternalStore, type ReactNode } from "react";
import { disableSound, enableSound, playPageTurn } from "@/lib/audio";
import { chapters, cover, ending, intro, pledge, share, ui } from "@/lib/content";
import { incrementPledges } from "@/lib/counter";
import Branch from "./Branch";
import ChapterShell from "./chapters/ChapterShell";
import Cover from "./Cover";
import EndingView from "./EndingView";
import GoldDust from "./GoldDust";
import { EASE_BOOK } from "./Page";
import PledgeView from "./PledgeView";
import RibbonProgress from "./RibbonProgress";
import ShareView from "./ShareView";
import SoundToggle from "./SoundToggle";
import Spread from "./Spread";
import { InkButton, LightMark, PageInner } from "./ui";

// ───────── Төлөв ─────────

type Screen =
  | { name: "cover" }
  | { name: "intro" }
  | { name: "chapter"; index: number }
  | { name: "ending" }
  | { name: "pledge" }
  | { name: "share" };

type State = {
  screen: Screen;
  /** Бүлэг бүрийн үйлдэл дууссан эсэх — цэцэг бүрт нэг */
  completed: boolean[];
  text: string;
  placeholder: number;
  warning: boolean;
  count: number | null;
  sound: boolean;
};

type Action =
  | { type: "OPEN" }
  | { type: "START" }
  | { type: "COMPLETE"; index: number }
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "TO_PLEDGE"; placeholder: number }
  | { type: "TEXT"; text: string }
  | { type: "WARN" }
  | { type: "SHARE" }
  | { type: "COUNT"; count: number | null }
  | { type: "SOUND"; on: boolean }
  | { type: "RESTART" };

const initial: State = {
  screen: { name: "cover" },
  completed: chapters.map(() => false),
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
      return sc.name === "intro" ? { ...s, screen: { name: "chapter", index: 0 } } : s;
    case "COMPLETE":
      if (s.completed[a.index]) return s;
      return { ...s, completed: s.completed.map((v, i) => v || i === a.index) };
    case "NEXT":
      if (sc.name !== "chapter" || !s.completed[sc.index]) return s;
      return {
        ...s,
        screen: sc.index < chapters.length - 1 ? { name: "chapter", index: sc.index + 1 } : { name: "ending" },
      };
    case "BACK":
      if (sc.name === "chapter")
        return { ...s, screen: sc.index === 0 ? { name: "intro" } : { name: "chapter", index: sc.index - 1 } };
      if (sc.name === "ending") return { ...s, screen: { name: "chapter", index: chapters.length - 1 } };
      if (sc.name === "pledge") return { ...s, warning: false, screen: { name: "ending" } };
      if (sc.name === "share") return { ...s, screen: { name: "pledge" } };
      return s;
    case "TO_PLEDGE":
      return sc.name === "ending" ? { ...s, placeholder: a.placeholder, screen: { name: "pledge" } } : s;
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
  if (sc.name === "intro") return 0;
  if (sc.name === "chapter") return 1 + sc.index;
  if (sc.name === "pledge") return 20;
  return -1;
}

/** Үргэлж хоёр нүүр. Утсан дээр нэг хуудсанд багтах агуулгыг баруун талд нь нийлүүлнэ. */
function pagesOf(sc: Screen, desktop: boolean): string[] {
  switch (sc.name) {
    case "intro":
      return desktop ? ["intro-l", "intro-r"] : ["endpaper", "intro"];
    case "chapter":
      return desktop ? [`ch${sc.index}-l`, `ch${sc.index}-r`] : ["endpaper", `ch${sc.index}`];
    case "pledge":
      return desktop ? ["pledge-l", "pledge-r"] : ["endpaper", "pledge"];
    default:
      return [];
  }
}

/** Хуудасны дугаар (номын мэдрэмж) */
function folioOf(id: string): number | undefined {
  const ch = /^ch(\d)(-l|-r)?$/.exec(id);
  if (ch) return 3 + Number(ch[1]) * 2 + (ch[2] === "-l" ? 0 : 1);
  return ({ "intro-l": 1, "intro-r": 2, intro: 2, "pledge-l": 15, "pledge-r": 16, pledge: 16 } as Record<string, number>)[id];
}

// ───────── Media query ─────────

function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    // Серверт утасны хувилбар; framer-ийн useReducedMotion нь hydration үед зөрдөг тул өөрсдөө
    () => false,
  );
}

// ───────── Компонент ─────────

type Props = { hasCover: boolean; hasAudio: boolean };

export default function BookExperience({ hasCover, hasAudio }: Props) {
  const [s, dispatch] = useReducer(reducer, initial);
  const desktop = useMedia("(min-width: 768px)");
  const reduced = useMedia("(prefers-reduced-motion: reduce)");

  const { screen } = s;
  const bloomed = s.completed.filter(Boolean).length;
  const inBook = screen.name === "intro" || screen.name === "chapter" || screen.name === "pledge";

  // Хуудас солигдох бүрт эргэх чимээ (дуу асаалттай үед л тоглоно)
  const screenKey = JSON.stringify(screen);
  useEffect(() => {
    if (screenKey !== JSON.stringify(initial.screen)) playPageTurn();
  }, [screenKey]);

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

  const canBack = screen.name === "chapter" || screen.name === "ending" || screen.name === "pledge";
  const canForward = screen.name === "intro" || (screen.name === "chapter" && s.completed[screen.index]);

  const back = useCallback(() => dispatch({ type: "BACK" }), []);
  const forward = useCallback(() => {
    if (screen.name === "intro") dispatch({ type: "START" });
    else if (screen.name === "chapter") dispatch({ type: "NEXT" });
  }, [screen]);

  // Keyboard: ← → хуудас. Бүлгийн үйлдэл нь өөрсдийн товч дээр (Space/Enter барих, ↑ шудрах)
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
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canBack, canForward, back, forward, screen]);

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
        : screen.name === "ending"
          ? ending.title
          : screen.name === "pledge"
            ? pledge.title
            : screen.name === "share"
              ? share.title
              : "";

  // ───────── Хуудасны агуулга ─────────

  const renderContent = (id: string): ReactNode => {
    if (id === "endpaper") return <Endpaper bloomed={bloomed} />;

    if (id.startsWith("intro")) {
      const title = <h1 className="font-serif text-[32px] leading-[1.2] text-ink md:text-[40px]">{intro.title}</h1>;
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

    const ch = /^ch(\d)(-l|-r)?$/.exec(id);
    if (ch) {
      const i = Number(ch[1]);
      return (
        <ChapterShell
          index={i}
          part={ch[2] === "-l" ? "left" : ch[2] === "-r" ? "right" : "all"}
          done={s.completed[i]}
          onDone={() => dispatch({ type: "COMPLETE", index: i })}
          onNext={() => dispatch({ type: "NEXT" })}
          reduced={reduced}
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

  // id-аар key өгч, нэг slot-д өөр хуудас орж ирэхэд өмнөх хуудасны state үлдэхгүй
  const renderPage = (id: string | undefined): ReactNode => {
    if (!id) return null;
    const folio = folioOf(id);
    return (
      <Fragment key={id}>
        {renderContent(id)}
        {folio !== undefined && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-2.5 text-center font-serif text-[12px] italic text-ink-soft"
          >
            {folio}
          </span>
        )}
      </Fragment>
    );
  };

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
            {canBack && (
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
                <RibbonProgress done={bloomed} />
              </div>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {screen.name === "cover" && (
            <motion.div key="cover" className="h-full" exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
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
                bloomed={bloomed}
                sway={screen.name === "pledge"}
                label={ui.branchAlt}
                className="h-18 w-auto shrink-0 md:mb-6 md:h-24 min-[1100px]:hidden"
              />
              <div className="relative -mx-4 md:mx-0">
                <Spread
                  pages={pagesOf(screen, desktop)}
                  order={orderOf(screen)}
                  renderPage={renderPage}
                  desktop={desktop}
                  reduced={reduced}
                  canBack={canBack}
                  canForward={canForward}
                  onBack={back}
                  onForward={forward}
                  backLabel={ui.back}
                />
              </div>
              <Branch
                bloomed={bloomed}
                sway={screen.name === "pledge"}
                orientation="vertical"
                className="hidden h-[min(72vh,620px)] w-auto shrink-0 min-[1100px]:block"
              />
            </motion.div>
          )}

          {screen.name === "ending" && (
            <motion.div
              key="ending"
              className="h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fade}
            >
              <EndingView hasCover={hasCover} reduced={reduced} onNext={toPledge} />
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
                text={s.text.trim()}
                hasCover={hasCover}
                count={s.count}
                onRestart={() => dispatch({ type: "RESTART" })}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </MotionConfig>
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
