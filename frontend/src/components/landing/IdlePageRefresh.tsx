"use client";

import { useIdlePageRefresh } from "../../hooks/useIdlePageRefresh";

export function IdlePageRefresh() {
  useIdlePageRefresh(5000);
  return null;
}
