"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const SPOTLIGHT_RADIUS = 340;

const CODE_LINES = [
  "import express from 'express'",
  "await pool.query(sql)",
  "export async function GET()",
  "POST /api/auth/login",
  "type Project = { id: number }",
  "const slug = kebabCase(title)",
  "npm run dev",
  "refreshToken.rotate()",
  "CREATE TABLE users",
  "KanbanColumn.done",
  "monaco.editor.create()",
  "graph.addEdge(a, b)",
  "JWT.sign({ userId })",
  "visibility: 'public'",
  "template.apply(id)",
  "bcrypt.hash(pwd, 12)",
  "useEffect(() => {}, [])",
  "return <AppNav />",
  "SELECT * FROM projects",
  "docker compose up -d",
];

function CodeScrollColumn({
  lines,
  className,
}: {
  lines: string[];
  className: string;
}) {
  const doubled = useMemo(() => [...lines, ...lines], [lines]);

  return (
    <div className={`flex min-w-[9rem] shrink-0 flex-col gap-3 ${className}`}>
      {doubled.map((line, index) => (
        <span
          key={`${line}-${index}`}
          className="whitespace-nowrap font-mono text-[11px] leading-tight text-[color:var(--hubhex-bg-soft)] opacity-50"
        >
          {line}
        </span>
      ))}
    </div>
  );
}

interface CodeAnimatedBackgroundProps {
  /** Variante plus discrete pour l'espace connecte */
  subdued?: boolean;
}

/**
 * Fond slate par defaut ; au survol, zone illuminee avec grille + code qui defile.
 * RAF actif uniquement quand le spot est visible (perf navigation pages publiques).
 */
export function CodeAnimatedBackground({ subdued = false }: CodeAnimatedBackgroundProps) {
  const [spot, setSpot] = useState({ x: -9999, y: -9999 });
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef({ x: -9999, y: -9999 });
  const currentRef = useRef({ x: -9999, y: -9999 });
  const visibleRef = useRef(false);
  const pageVisibleRef = useRef(true);

  const columns = useMemo(() => {
    const count = subdued ? 5 : 7;
    return Array.from({ length: count }, (_, i) => {
      const offset = i * 3;
      const rotated = [...CODE_LINES.slice(offset), ...CODE_LINES.slice(0, offset)];
      return rotated;
    });
  }, [subdued]);

  const stopAnimation = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const animate = useCallback(() => {
    if (!visibleRef.current || !pageVisibleRef.current) {
      stopAnimation();
      return;
    }

    const cur = currentRef.current;
    const tgt = targetRef.current;
    const ease = 0.14;
    const nx = cur.x + (tgt.x - cur.x) * ease;
    const ny = cur.y + (tgt.y - cur.y) * ease;
    currentRef.current = { x: nx, y: ny };
    setSpot({ x: nx, y: ny });
    rafRef.current = requestAnimationFrame(animate);
  }, [stopAnimation]);

  const startAnimation = useCallback(() => {
    if (rafRef.current != null) {
      return;
    }
    rafRef.current = requestAnimationFrame(animate);
  }, [animate]);

  useEffect(() => {
    visibleRef.current = visible;
    if (visible && pageVisibleRef.current) {
      startAnimation();
    } else {
      stopAnimation();
    }
  }, [visible, startAnimation, stopAnimation]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setVisible(true);
      setSpot({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      return;
    }

    const onPointer = (x: number, y: number) => {
      targetRef.current = { x, y };
      setVisible(true);
    };

    const onMove = (event: MouseEvent) => onPointer(event.clientX, event.clientY);

    const onTouch = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) {
        onPointer(touch.clientX, touch.clientY);
      }
    };

    const onLeave = () => setVisible(false);

    const onVisibility = () => {
      pageVisibleRef.current = !document.hidden;
      if (document.hidden) {
        stopAnimation();
      } else if (visibleRef.current) {
        startAnimation();
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopAnimation();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [startAnimation, stopAnimation]);

  const radius = subdued ? SPOTLIGHT_RADIUS * 0.75 : SPOTLIGHT_RADIUS;
  const mask = visible
    ? `radial-gradient(circle ${radius}px at ${spot.x}px ${spot.y}px, black 0%, rgba(0,0,0,0.55) 55%, transparent 100%)`
    : "radial-gradient(circle 0px at 50% 50%, transparent, transparent)";

  const pausedClass = visible ? "" : "hubhex-techno-paused";
  const layerOpacity = subdued ? 0.72 : 1;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-slate-950" />

      <div
        className={`absolute inset-0 transition-opacity duration-300 ease-out ${pausedClass}`}
        style={{
          opacity: visible ? layerOpacity : 0,
          WebkitMaskImage: mask,
          maskImage: mask,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 90% 70% at 50% 50%, var(--hubhex-bg-glow-1) 0%, transparent 55%),
              radial-gradient(ellipse 60% 50% at 80% 20%, var(--hubhex-bg-glow-2) 0%, transparent 50%),
              radial-gradient(ellipse 50% 40% at 15% 85%, var(--hubhex-bg-glow-3) 0%, transparent 45%),
              linear-gradient(180deg, #0f172a 0%, #020617 100%)
            `,
          }}
        />

        <div
          className="hubhex-techno-grid-scroll absolute -inset-[88px] opacity-90"
          style={{
            backgroundImage: `
              linear-gradient(var(--hubhex-bg-grid) 1px, transparent 1px),
              linear-gradient(90deg, var(--hubhex-bg-grid) 1px, transparent 1px)
            `,
            backgroundSize: "44px 44px",
          }}
        />
        <div
          className="hubhex-techno-grid-fine-scroll absolute -inset-[44px] opacity-50 mix-blend-screen"
          style={{
            backgroundImage: `
              linear-gradient(var(--hubhex-bg-grid-fine) 1px, transparent 1px),
              linear-gradient(90deg, var(--hubhex-bg-grid-fine) 1px, transparent 1px)
            `,
            backgroundSize: "11px 11px",
          }}
        />

        <div className="absolute inset-0 overflow-hidden opacity-70">
          <div className="absolute -top-[10%] left-0 flex h-[220%] w-full justify-around gap-2 px-2">
            {columns.map((lines, index) => (
              <div
                key={index}
                className={
                  index % 2 === 0 ? "hubhex-techno-code-scroll" : "hubhex-techno-code-scroll-slow"
                }
              >
                <CodeScrollColumn lines={lines} className="" />
              </div>
            ))}
          </div>
        </div>

        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div
            className="hubhex-techno-scan-line absolute left-0 h-[40%] w-full"
            style={{
              background:
                "linear-gradient(to bottom, transparent, var(--hubhex-bg-scan), transparent)",
            }}
          />
        </div>

        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgb(2 6 23 / 0.4), transparent, var(--hubhex-bg-gradient-top))",
          }}
        />
      </div>

      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: visible ? (subdued ? 0.55 : 0.85) : 0,
          background: `radial-gradient(circle ${radius * 0.65}px at ${spot.x}px ${spot.y}px, var(--hubhex-bg-spotlight) 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}
