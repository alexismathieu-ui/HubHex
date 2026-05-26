import type { ReactNode } from "react";

import type { User } from "./hubhex";

export interface ProfileFormState {
  username: string;
  email: string;
  display_name: string;
  status_message: string;
  status_emoji: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  clearAvatar: boolean;
  pendingAvatar: PendingAvatar | null;
}

export interface PendingAvatar {
  mime: string;
  base64: string;
  previewUrl?: string;
}

export type ProfileMessageTone = "neutral" | "success" | "error";

export interface ProfilePatchBody {
  username?: string;
  email?: string;
  display_name?: string | null;
  status_message?: string | null;
  status_emoji?: string | null;
  currentPassword?: string;
  newPassword?: string;
  clear_avatar?: boolean;
  avatar_base64?: string;
  avatar_mime?: string;
}

export interface ProfilePatchResult {
  errors: string[];
  body: ProfilePatchBody | null;
}

export interface FieldLabelProps {
  children: ReactNode;
  hint?: string;
}

export type { User };
