"use client";

import { useEffect, useState } from "react";

import { getDisplayName, getUserAvatarUrl } from "../../lib/auth/userDisplay";
import type { User } from "../../types/hubhex";

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-20 w-20 text-xl",
  xl: "h-28 w-28 text-3xl",
} as const;

type AvatarSize = keyof typeof SIZE_CLASSES;

interface UserAvatarProps {
  user: Partial<User> & { username?: string; has_avatar?: boolean };
  size?: AvatarSize | string;
  previewSrc?: string | null;
  className?: string;
}

export function UserAvatar({
  user,
  size = "md",
  previewSrc,
  className = "",
}: UserAvatarProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const sizeClass = SIZE_CLASSES[size as AvatarSize] || SIZE_CLASSES.md;
  const avatarUrl =
    previewSrc ||
    getUserAvatarUrl(user?.username, user?.has_avatar, user?.profile_updated_at);
  const label = getDisplayName(user) || user?.username || "?";
  const initial = (label[0] || "?").toUpperCase();

  useEffect(() => {
    setLoadFailed(false);
  }, [avatarUrl]);

  if (avatarUrl && !loadFailed) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full border border-violet-800/60 object-cover ${className}`}
        onError={() => setLoadFailed(true)}
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
