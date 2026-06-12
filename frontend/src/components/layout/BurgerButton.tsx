"use client";

interface BurgerButtonProps {
  open: boolean;
  onClick: () => void;
  className?: string;
}

/** Bouton hamburger anime (3 barres → croix). */
export function BurgerButton({ open, onClick, className = "" }: BurgerButtonProps) {
  return (
    <button
      type="button"
      className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-900/60 text-slate-200 transition hover:border-cyan-600/50 hover:text-cyan-100 focus-visible:ring-2 focus-visible:ring-cyan-400 ${className}`}
      onClick={onClick}
      aria-expanded={open}
      aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
    >
      <span className={`hubhex-burger-icon${open ? " hubhex-burger-icon--open" : ""}`} aria-hidden>
        <span className="hubhex-burger-line" />
        <span className="hubhex-burger-line" />
        <span className="hubhex-burger-line" />
      </span>
    </button>
  );
}
