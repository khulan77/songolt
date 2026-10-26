"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Цаасан дээрх бэхэн товч */
export function InkButton({ children, className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-7 py-3 font-sans text-[16px] tracking-wide text-paper shadow-[0_6px_18px_-8px_rgba(42,32,24,0.8)] transition-[transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-[#3a2c20] active:translate-y-0 ${className}`}
    >
      {children}
    </button>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 font-sans text-[12px] uppercase tracking-[0.16em] text-ink-soft">{children}</p>
  );
}

export function PageInner({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`page-scroll flex h-full flex-col px-6 py-7 sm:px-8 md:px-10 md:py-11 ${className}`}>
      {children}
    </div>
  );
}

/** Хуудасны хийсвэр чимэглэл: гэрэл ба сүүдэр */
export function LightMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 24" className={`h-5 w-16 ${className}`} aria-hidden>
      <defs>
        <radialGradient id="lm" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#B8863F" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#B8863F" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="40" cy="12" rx="38" ry="10" fill="url(#lm)" opacity="0.35" />
      <circle cx="40" cy="12" r="3" fill="#B8863F" />
      <path d="M8 12 H30 M50 12 H72" stroke="#5A4A3A" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}
