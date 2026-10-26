"use client";

import { resultLabels, type Result } from "@/lib/content";
import { InkButton, Label, LightMark, PageInner } from "./ui";

type Props = {
  result: Result;
  part: "left" | "right" | "all";
  onNext: () => void;
  /** Утсан дээр зүүн нүүрнээс баруун руу шилжих */
  onContinue?: () => void;
  continueLabel?: string;
};

export default function ResultView({ result, part, onNext, onContinue, continueLabel }: Props) {
  const head = (
    <>
      <LightMark className="mb-5" />
      <h2 className="font-serif text-[30px] leading-[1.22] text-ink md:text-[34px]">
        {result.title}
      </h2>
      <div className="mt-7">
        <Label>{resultLabels.moment}</Label>
        <p className="font-serif text-[17px] italic leading-[1.65] text-ink md:text-[18px]">
          {result.moment}
        </p>
      </div>
    </>
  );

  const body = (
    <>
      <p className="font-serif text-[20px] leading-[1.55] text-ink md:text-[22px]">
        {result.reflection}
      </p>
      <div className="mt-7 border-l-2 border-gold-deep/70 pl-4">
        <Label>{resultLabels.step}</Label>
        <p className="font-serif text-[17px] leading-[1.65] text-ink md:text-[18px]">{result.step}</p>
      </div>
      <div className={part === "all" ? "mt-auto pt-8" : "mt-10"}>
        <InkButton onClick={onNext}>{resultLabels.cta}</InkButton>
        <p className="mt-5 font-sans text-[13px] leading-[1.5] text-ink-soft">
          {resultLabels.disclaimer}
        </p>
      </div>
    </>
  );

  if (part === "left")
    return (
      <PageInner className="justify-center">
        {head}
        {onContinue && (
          <div className="mt-10">
            <InkButton onClick={onContinue}>{continueLabel}</InkButton>
          </div>
        )}
      </PageInner>
    );
  if (part === "right") return <PageInner className="justify-center">{body}</PageInner>;
  return (
    <PageInner>
      {head}
      <div className="mt-8 flex flex-1 flex-col">{body}</div>
    </PageInner>
  );
}
