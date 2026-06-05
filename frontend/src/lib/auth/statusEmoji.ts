const EMOJI_PRESETS = ["🟢", "🟡", "🔴", "💤", "🚀", "📚", "☕", "🎧", "💻", "✨"] as const;

/** Garde au plus un emoji (premier grapheme etendu). */
export function normalizeStatusEmoji(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  const segments = [...new Intl.Segmenter().segment(trimmed)].map((part) => part.segment);
  return segments[0] ?? "";
}

export { EMOJI_PRESETS };
