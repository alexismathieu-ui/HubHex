import { API_BASE_URL } from "../apiBaseUrl";
import type { User } from "../../types/hubhex";

export function getDisplayName(user: Partial<User> | null | undefined): string {
  if (!user) {
    return "";
  }
  const pseudo = user.display_name?.trim();
  if (pseudo) {
    return pseudo;
  }
  return user.username || "";
}

export function getUserAvatarUrl(
  username: string | undefined,
  hasAvatar: boolean | undefined,
  cacheKey?: string | null,
): string | null {
  if (!username || !hasAvatar) {
    return null;
  }
  const base = `${API_BASE_URL}/users/${encodeURIComponent(username)}/avatar`;
  if (!cacheKey) {
    return base;
  }
  return `${base}?v=${encodeURIComponent(String(cacheKey))}`;
}

export function getStatusLabel(user: Partial<User> | null | undefined): string {
  if (!user) {
    return "";
  }
  return user.status_emoji?.trim() || "";
}
