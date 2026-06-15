"use client";

import { useEffect, useRef } from "react";

const ACTIVITY_EVENTS = ["mousemove", "keydown", "scroll", "touchstart", "click"] as const;

/** Recharge la page apres une periode d'inactivite (accueil marketing). */
export function useIdlePageRefresh(idleMs = 20_000): void {
  const idleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const resetTimer = () => {
      if (idleTimerRef.current != null) {
        window.clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = window.setTimeout(() => {
        window.location.reload();
      }, idleMs);
    };

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, resetTimer, { passive: true });
    }
    resetTimer();

    return () => {
      if (idleTimerRef.current != null) {
        window.clearTimeout(idleTimerRef.current);
      }
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, resetTimer);
      }
    };
  }, [idleMs]);
}
