import { API_BASE_URL } from "../apiBaseUrl";

export function getDisplayName(user) {
  if (!user) {
    return "";
  }
  const pseudo = user.display_name?.trim();
  if (pseudo) {
    return pseudo;
  }
  return user.username || "";
}

export function getUserAvatarUrl(username, hasAvatar, cacheKey) {
  if (!username || !hasAvatar) {
    return null;
  }
  const base = `${API_BASE_URL}/users/${encodeURIComponent(username)}/avatar`;
  if (!cacheKey) {
    return base;
  }
  return `${base}?v=${encodeURIComponent(String(cacheKey))}`;
}

export function getStatusLabel(user) {
  if (!user) {
    return "";
  }
  const emoji = user.status_emoji?.trim() || "";
  const message = user.status_message?.trim() || "";
  if (emoji && message) {
    return `${emoji} ${message}`;
  }
  return emoji || message;
}
