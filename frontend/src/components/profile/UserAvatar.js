"use client";

import { getDisplayName, getUserAvatarUrl } from "../../lib/auth/userDisplay";

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-20 w-20 text-xl",
  xl: "h-28 w-28 text-3xl",
};

export function UserAvatar({ user, size = "md", previewSrc, className = "" }) {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const avatarUrl =
    previewSrc ||
    getUserAvatarUrl(user?.username, user?.has_avatar, user?.profile_updated_at);
  const label = getDisplayName(user) || user?.username || "?";
  const initial = (label[0] || "?").toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full border border-violet-800/60 object-cover ${className}`}
      />
    );
  }

  return (
    <span
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full border border-violet-700/50 bg-violet-900/80 font-semibold text-violet-100 ${className}`}
      aria-hidden
    >
      {initial}
    </span>
  );
}
