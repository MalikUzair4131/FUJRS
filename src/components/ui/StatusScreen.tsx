import type { ReactNode } from "react";

/**
 * Full-page state screen — 404, thrown error, loading, or an empty result.
 * One layout so every dead end in the app reads as the same brand, instead of
 * each route inventing its own centred div.
 */
export function StatusScreen({
  icon,
  eyebrow,
  title,
  body,
  actions,
  pulse,
}: {
  /** Material Symbols ligature, e.g. "search_off". */
  icon: string;
  eyebrow?: string;
  title: string;
  body?: ReactNode;
  actions?: ReactNode;
  /** Softly pulses the icon — for loading, not for terminal states. */
  pulse?: boolean;
}) {
  return (
    <div className="max-w-container-max mx-auto flex min-h-[60vh] flex-col items-center justify-center px-margin-mobile md:px-margin-desktop py-24 text-center">
      <span
        aria-hidden="true"
        className={`material-symbols-outlined text-5xl text-outline-variant ${
          pulse ? "animate-pulse motion-reduce:animate-none" : ""
        }`}
      >
        {icon}
      </span>

      {eyebrow && (
        <p className="mt-8 font-body text-label-sm uppercase tracking-widest text-marketplace-bronze">
          {eyebrow}
        </p>
      )}

      <h1 className="mt-3 font-display text-headline-md">{title}</h1>

      {body && (
        <div className="mt-4 max-w-md font-body text-body-md text-on-surface-variant leading-relaxed">
          {body}
        </div>
      )}

      {actions && <div className="mt-10 flex flex-wrap justify-center gap-4">{actions}</div>}
    </div>
  );
}
