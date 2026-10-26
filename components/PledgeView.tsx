"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useId } from "react";
import { pledge } from "@/lib/content";
import { InkButton, LightMark, PageInner } from "./ui";

type Props = {
  part: "left" | "right" | "all";
  value: string;
  placeholder: string;
  warning: boolean;
  onChange: (v: string) => void;
  onSubmit: () => void;
};

export default function PledgeView({ part, value, placeholder, warning, onChange, onSubmit }: Props) {
  const id = useId();

  const title = (
    <>
      <LightMark className="mb-5" />
      <h2 className="font-serif text-[28px] leading-[1.3] text-ink md:text-[32px]">{pledge.title}</h2>
    </>
  );

  const form = (
    <form
      noValidate
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label htmlFor={id} className="block font-serif text-[22px] italic text-ink md:text-[24px]">
        {pledge.prefix}
      </label>
      <textarea
        id={id}
        value={value}
        rows={2}
        maxLength={pledge.maxLength}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        aria-describedby={`${id}-hint`}
        aria-invalid={warning || undefined}
        onChange={(e) => onChange(e.target.value.replace(/\n/g, " "))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit();
          }
        }}
        className="mt-2 w-full resize-none border-0 border-b-2 border-dashed border-ink-soft/60 bg-transparent px-1 pb-1 font-serif text-[22px] italic leading-[1.5] text-ink outline-none focus-visible:outline-none placeholder:text-ink-soft/55 focus:border-solid focus:border-gold-deep md:text-[24px]"
        style={{
          backgroundImage: "linear-gradient(transparent calc(1.5em - 1px), rgba(90,74,58,0.35) 1.5em)",
          backgroundSize: "100% 1.5em",
        }}
      />
      <p className="mt-2 text-right font-serif text-[22px] italic text-ink md:text-[24px]">{pledge.suffix}</p>
      <div className="mt-1 flex items-center justify-between font-sans text-[13px] text-ink-soft">
        <span id={`${id}-hint`} role="status" aria-live="polite" className="min-h-5">
          <AnimatePresence>
            {warning && (
              <motion.span
                key="w"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[#8a3a22]"
              >
                {pledge.emptyWarning}
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <span aria-hidden className="tabular-nums">
          {value.length}/{pledge.maxLength}
        </span>
      </div>
      <div className="mt-auto pt-8">
        <InkButton type="submit">{pledge.cta}</InkButton>
      </div>
    </form>
  );

  if (part === "left") return <PageInner className="justify-center">{title}</PageInner>;
  if (part === "right") return <PageInner className="justify-center">{form}</PageInner>;
  return (
    <PageInner>
      {title}
      <div className="mt-9 flex flex-1 flex-col">{form}</div>
    </PageInner>
  );
}
