"use client";

import { useIdlePageRefresh } from "../../hooks/useIdlePageRefresh";

export function IdlePageRefresh() {
  useIdlePageRefresh(20_000);
  return null;
}
