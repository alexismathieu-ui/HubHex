export interface HubHexThemeSettings {
  presetId: string;
  button: string;
  background: string;
  text: string;
}

/** @deprecated Ancien format localStorage */
interface LegacyHubHexThemeSettings {
  presetId?: string;
  accent?: string;
  button?: string;
  background?: string;
  text?: string;
  logo?: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  button: string;
  background: string;
  text: string;
}

export const DEFAULT_THEME: HubHexThemeSettings = {
  presetId: "cyan",
  button: "#06b6d4",
  background: "#06b6d4",
  text: "#67e8f9",
};

export const THEME_PRESETS: ThemePreset[] = [
  { id: "cyan", name: "Cyan HubHex", button: "#06b6d4", background: "#06b6d4", text: "#67e8f9" },
  { id: "violet", name: "Violet", button: "#8b5cf6", background: "#7c3aed", text: "#c4b5fd" },
  { id: "emerald", name: "Emeraude", button: "#10b981", background: "#059669", text: "#6ee7b7" },
  { id: "rose", name: "Rose", button: "#f43f5e", background: "#e11d48", text: "#fda4af" },
  { id: "amber", name: "Ambre", button: "#f59e0b", background: "#d97706", text: "#fcd34d" },
  { id: "sky", name: "Bleu ciel", button: "#0ea5e9", background: "#0284c7", text: "#7dd3fc" },
  { id: "fuchsia", name: "Fuchsia", button: "#d946ef", background: "#c026d3", text: "#f0abfc" },
];

const STORAGE_KEY = "hubhex_theme";

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function toHex(r: number, g: number, b: number): string {
  const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

function mix(hex: string, target: { r: number; g: number; b: number }, amount: number): string {
  const source = parseHex(hex);
  if (!source) {
    return DEFAULT_THEME.button;
  }
  const ratio = Math.max(0, Math.min(1, amount));
  return toHex(
    source.r + (target.r - source.r) * ratio,
    source.g + (target.g - source.g) * ratio,
    source.b + (target.b - source.b) * ratio,
  );
}

function withAlpha(hex: string, alpha: number): string {
  const rgb = parseHex(hex);
  if (!rgb) {
    return `rgba(6, 182, 212, ${alpha})`;
  }
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function applyButtonVars(root: HTMLElement, hex: string): void {
  root.style.setProperty("--hubhex-accent", hex);
  root.style.setProperty("--hubhex-accent-hover", mix(hex, { r: 255, g: 255, b: 255 }, 0.18));
  root.style.setProperty("--hubhex-accent-border", withAlpha(hex, 0.45));
  root.style.setProperty("--hubhex-accent-muted", withAlpha(hex, 0.14));
  root.style.setProperty("--hubhex-accent-glow", withAlpha(hex, 0.28));
  root.style.setProperty("--hubhex-accent-on", mix(hex, { r: 2, g: 6, b: 23 }, 0.92));
}

function applyTextVars(root: HTMLElement, hex: string): void {
  root.style.setProperty("--hubhex-accent-text", hex);
  root.style.setProperty("--hubhex-accent-soft", mix(hex, { r: 255, g: 255, b: 255 }, 0.28));
  root.style.setProperty("--hubhex-logo-text", hex);
  root.style.setProperty("--hubhex-logo-glow", withAlpha(hex, 0.18));
}

function applyBackgroundVars(root: HTMLElement, hex: string): void {
  const bgSecondary = mix(hex, { r: 52, g: 211, b: 153 }, 0.35);

  root.style.setProperty("--hubhex-bg", hex);
  root.style.setProperty("--hubhex-bg-soft", mix(hex, { r: 255, g: 255, b: 255 }, 0.55));
  root.style.setProperty("--hubhex-bg-border", withAlpha(hex, 0.45));
  root.style.setProperty("--hubhex-bg-grid", withAlpha(hex, 0.4));
  root.style.setProperty("--hubhex-bg-grid-fine", withAlpha(bgSecondary, 0.35));
  root.style.setProperty("--hubhex-bg-glow-1", withAlpha(hex, 0.24));
  root.style.setProperty("--hubhex-bg-glow-2", withAlpha(bgSecondary, 0.2));
  root.style.setProperty("--hubhex-bg-glow-3", withAlpha(hex, 0.16));
  root.style.setProperty("--hubhex-bg-scan", withAlpha(hex, 0.3));
  root.style.setProperty("--hubhex-bg-gradient-top", withAlpha(hex, 0.25));
  root.style.setProperty("--hubhex-bg-spotlight", withAlpha(hex, 0.14));
}

export function isValidAccent(hex: string): boolean {
  return parseHex(hex) !== null;
}

export function normalizeTheme(
  settings: Partial<HubHexThemeSettings | LegacyHubHexThemeSettings> | null,
): HubHexThemeSettings {
  if (!settings) {
    return DEFAULT_THEME;
  }

  const preset = THEME_PRESETS.find((item) => item.id === settings.presetId);
  const legacyAccent =
    "accent" in settings && settings.accent && isValidAccent(settings.accent)
      ? settings.accent
      : null;

  const button =
    settings.button && isValidAccent(settings.button)
      ? settings.button
      : legacyAccent ?? preset?.button ?? DEFAULT_THEME.button;

  const background =
    settings.background && isValidAccent(settings.background)
      ? settings.background
      : legacyAccent ?? preset?.background ?? DEFAULT_THEME.background;

  const legacyText =
    ("text" in settings && settings.text && isValidAccent(settings.text) ? settings.text : null) ??
    ("logo" in settings && settings.logo && isValidAccent(settings.logo) ? settings.logo : null);

  const text =
    legacyText ??
    (legacyAccent ? mix(legacyAccent, { r: 255, g: 255, b: 255 }, 0.55) : preset?.text ?? DEFAULT_THEME.text);

  return {
    presetId: settings.presetId === "custom" ? "custom" : preset?.id ?? DEFAULT_THEME.presetId,
    button,
    background,
    text,
  };
}

export function applyThemeToElement(
  element: HTMLElement,
  settings: HubHexThemeSettings,
): void {
  const theme = normalizeTheme(settings);

  applyButtonVars(element, theme.button);
  applyTextVars(element, theme.text);
  applyBackgroundVars(element, theme.background);

  element.dataset.hubhexTheme = theme.presetId;
}

/** Theme par defaut (cyan) sur :root — pages publiques accueil / connexion / inscription */
export function applyThemeToDocument(settings: HubHexThemeSettings): void {
  if (typeof document === "undefined") {
    return;
  }

  applyThemeToElement(document.documentElement, settings);

  if (normalizeTheme(settings).presetId === DEFAULT_THEME.presetId) {
    delete document.documentElement.dataset.hubhexTheme;
  }
}

export function resetPublicTheme(): void {
  applyThemeToDocument(DEFAULT_THEME);
}

function storageKeyForUser(userId: number | string): string {
  return `${STORAGE_KEY}_${userId}`;
}

export function loadStoredTheme(userId?: number | string | null): HubHexThemeSettings {
  if (typeof window === "undefined" || userId == null) {
    return DEFAULT_THEME;
  }

  try {
    const raw = localStorage.getItem(storageKeyForUser(userId));
    if (!raw) {
      return DEFAULT_THEME;
    }
    return normalizeTheme(JSON.parse(raw) as Partial<HubHexThemeSettings>);
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveStoredTheme(settings: HubHexThemeSettings, userId?: number | string | null): void {
  if (typeof window === "undefined" || userId == null) {
    return;
  }

  const payload = JSON.stringify(normalizeTheme(settings));
  localStorage.setItem(storageKeyForUser(userId), payload);
  // Ancien format global (partage entre comptes) — ne plus utiliser.
  localStorage.removeItem(STORAGE_KEY);
}

export type ThemeColorKey = "button" | "background" | "text";

export function updateThemeColor(
  current: HubHexThemeSettings,
  key: ThemeColorKey,
  hex: string,
): HubHexThemeSettings {
  if (!isValidAccent(hex)) {
    return current;
  }
  return normalizeTheme({
    ...current,
    presetId: "custom",
    [key]: hex,
  });
}
