"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * Tiroir navigation mobile — glisse depuis la droite, fond floute, fermeture animee.
 */
export function MobileNavDrawer({ open, onClose, title = "Menu", children }: MobileNavDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setClosing(false);
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
    if (visible) {
      setClosing(true);
      const timer = window.setTimeout(() => {
        setVisible(false);
        setClosing(false);
        document.body.style.overflow = "";
      }, 260);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [open, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, onClose]);

  if (!mounted || !visible) {
    return null;
  }

  return createPortal(
    <div
      className={`hubhex-drawer-backdrop fixed inset-0 z-[80] lg:hidden${closing ? " hubhex-drawer-backdrop--closing" : ""}`}
      role="presentation"
      onClick={onClose}
    >
      <aside
        className={`hubhex-drawer-panel absolute right-0 top-0 flex h-full w-[min(88vw,320px)] flex-col border-l border-slate-700/60 bg-slate-950/95 shadow-2xl shadow-black/50 backdrop-blur-xl${closing ? " hubhex-drawer-panel--closing" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-700/50 px-5 py-4">
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-slate-300">
            {title}
          </p>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-cyan-200"
            onClick={onClose}
          >
            Fermer
          </button>
        </header>
        <nav className="hubhex-drawer-links flex flex-1 flex-col gap-1 overflow-y-auto p-4" aria-label={title}>
          {children}
        </nav>
      </aside>
    </div>,
    document.body,
  );
}
