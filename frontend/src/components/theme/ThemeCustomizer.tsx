"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useTheme } from "../../context/ThemeContext";
import {
  applyThemeToElement,
  isValidAccent,
  THEME_PRESETS,
  updateThemeColor,
  type ThemeColorKey,
} from "../../lib/theme/theme";
import { AppButton } from "../ui/AppButton";

const COLOR_SECTIONS: Array<{
  key: ThemeColorKey;
  title: string;
  description: string;
}> = [
  {
    key: "button",
    title: "Boutons",
    description: "Fond des boutons principaux, navigation active, bordures accentuees.",
  },
  {
    key: "background",
    title: "Fond anime",
    description: "Grille, code defilant, halo au survol de la souris.",
  },
  {
    key: "text",
    title: "Textes accent",
    description:
      "HubHex, liens, titres //, chemins depot, labels actifs et tous les textes colores.",
  },
];

interface ThemeCustomizerPanelProps {
  onClose?: () => void;
}

export function ThemeCustomizerPanel({ onClose }: ThemeCustomizerPanelProps) {
  const { theme, setTheme, resetTheme } = useTheme();

  const applyPreset = (preset: (typeof THEME_PRESETS)[number]) => {
    setTheme({
      presetId: preset.id,
      button: preset.button,
      background: preset.background,
      text: preset.text,
    });
  };

  const applyColor = (key: ThemeColorKey, hex: string) => {
    if (!isValidAccent(hex)) {
      return;
    }
    setTheme(updateThemeColor(theme, key, hex));
  };

  const isPresetActive = (preset: (typeof THEME_PRESETS)[number]) =>
    theme.presetId === preset.id &&
    theme.button === preset.button &&
    theme.background === preset.background &&
    theme.text === preset.text;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div>
        <h2 id="theme-modal-title" className="font-display text-xl font-semibold text-slate-50">
          Personnaliser le theme
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Regle boutons, fond et textes separement. Enregistre localement sur cet appareil.
        </p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Palettes completes</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              title={preset.name}
              aria-label={`Theme ${preset.name}`}
              aria-pressed={isPresetActive(preset)}
              onClick={() => applyPreset(preset)}
              className={`group flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all duration-300 hover:-translate-y-0.5 ${
                isPresetActive(preset)
                  ? "border-[color:var(--hubhex-accent-border)] bg-[color:var(--hubhex-accent-muted)] text-accent"
                  : "border-slate-700/60 bg-slate-950/60 text-slate-300 hover:border-slate-500"
              }`}
            >
              <span className="flex -space-x-1" aria-hidden>
                <span
                  className="h-5 w-5 rounded-full border border-white/20"
                  style={{ backgroundColor: preset.button }}
                />
                <span
                  className="h-5 w-5 rounded-full border border-white/20"
                  style={{ backgroundColor: preset.background }}
                />
                <span
                  className="h-5 w-5 rounded-full border border-white/20"
                  style={{ backgroundColor: preset.text }}
                />
              </span>
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
        {COLOR_SECTIONS.map((section) => (
          <ThemeColorSection
            key={`${section.key}-${theme[section.key]}`}
            title={section.title}
            description={section.description}
            value={theme[section.key]}
            onChange={(hex) => applyColor(section.key, hex)}
          />
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <ThemePreviewSwatch label="Bouton" className="bg-accent text-[color:var(--hubhex-accent-on)]" />
        <ThemePreviewSwatch
          label="Fond / survol"
          className="text-[color:var(--hubhex-bg-soft)]"
          style={{
            backgroundImage: `linear-gradient(var(--hubhex-bg-grid) 1px, transparent 1px), linear-gradient(90deg, var(--hubhex-bg-grid) 1px, transparent 1px)`,
            backgroundSize: "16px 16px",
            backgroundColor: "rgb(2 6 23 / 0.8)",
            borderColor: "var(--hubhex-bg-border)",
          }}
        />
        <ThemePreviewSwatch label="Texte accent" className="text-accent font-display font-semibold" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-700/50 pt-4">
        <AppButton variant="ghost" onClick={resetTheme}>
          Reinitialiser
        </AppButton>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-500">
            {theme.presetId === "custom"
              ? "Personnalise"
              : THEME_PRESETS.find((p) => p.id === theme.presetId)?.name}
          </span>
          {onClose ? (
            <AppButton variant="primary" onClick={onClose}>
              Fermer
            </AppButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface ThemeCustomizerTriggerProps {
  className?: string;
  label?: string;
}

const MODAL_CLOSE_MS = 240;

export function ThemeCustomizerTrigger({
  className = "",
  label = "Personnaliser le theme",
}: ThemeCustomizerTriggerProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const modalPanelRef = useRef<HTMLDivElement>(null);

  const closeModal = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, MODAL_CLOSE_MS);
  }, []);

  const openModal = useCallback(() => {
    setClosing(false);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !closing) {
        closeModal();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mounted, closing, closeModal]);

  useEffect(() => {
    if (mounted && modalPanelRef.current) {
      applyThemeToElement(modalPanelRef.current, theme);
    }
  }, [mounted, theme]);

  const modal =
    mounted && typeof document !== "undefined"
      ? createPortal(
          <div
            className={`hubhex-modal-backdrop${closing ? " hubhex-modal-backdrop--closing" : ""} fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md sm:p-6`}
            role="presentation"
            onClick={closing ? undefined : closeModal}
          >
            <div
              ref={modalPanelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="theme-modal-title"
              className={`hubhex-modal-panel hubhex-app-theme${closing ? " hubhex-modal-panel--closing" : ""} max-h-[min(92vh,880px)] w-full max-w-5xl overflow-x-hidden overflow-y-auto rounded-2xl border border-slate-600/50 bg-slate-900/95 p-6 shadow-2xl shadow-black/60 backdrop-blur-xl sm:p-8`}
              onClick={(event) => event.stopPropagation()}
            >
              <ThemeCustomizerPanel onClose={closeModal} />
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <AppButton
        type="button"
        variant="secondary"
        className={className}
        onClick={openModal}
        aria-haspopup="dialog"
        aria-expanded={mounted}
      >
        {label}
      </AppButton>
      {modal}
    </>
  );
}

function ThemeColorSection({
  title,
  description,
  value,
  onChange,
}: {
  title: string;
  description: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const [hexInput, setHexInput] = useState(value);

  const syncChange = (hex: string) => {
    setHexInput(hex);
    onChange(hex);
  };

  return (
    <div className="flex h-full min-w-0 flex-col rounded-xl border border-slate-700/50 bg-slate-950/50 p-5">
      <div className="min-h-[5.5rem] text-center">
        <h3 className="font-display text-sm font-semibold text-slate-200">{title}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{description}</p>
      </div>

      <div className="mt-auto flex items-center justify-center gap-3 pt-4">
        <input
          type="color"
          value={isValidAccent(hexInput) ? hexInput : value}
          onChange={(event) => syncChange(event.target.value)}
          className="size-11 shrink-0 cursor-pointer rounded-lg border border-slate-700 bg-slate-950 p-1"
          aria-label={`Couleur ${title}`}
        />
        <input
          type="text"
          value={hexInput}
          onChange={(event) => {
            const next = event.target.value;
            setHexInput(next);
            if (isValidAccent(next)) {
              onChange(next);
            }
          }}
          maxLength={7}
          placeholder="#06b6d4"
          className="hubhex-input w-[7.5rem] shrink-0 text-center font-mono text-xs sm:w-28"
        />
      </div>
    </div>
  );
}

function ThemePreviewSwatch({
  label,
  className = "",
  style,
}: {
  label: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-lg border border-slate-700/50 px-3 py-4 text-center text-sm font-medium ${className}`}
      style={style}
    >
      {label}
    </div>
  );
}
