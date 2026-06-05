"use client";

import { useEffect, useState } from "react";

const COLUMNS = [
  { id: "todo", label: "A faire", accent: "border-slate-600/60", dot: "bg-slate-400" },
  { id: "in_progress", label: "En cours", accent: "border-cyan-500/50", dot: "bg-cyan-400" },
  { id: "done", label: "Termine", accent: "border-emerald-500/40", dot: "bg-emerald-400" },
] as const;

const CARDS = [
  { id: "c1", column: "todo", title: "auth_refresh()", tag: "API", priority: "high" },
  { id: "c2", column: "todo", title: "tests_securite()", tag: "QA", priority: "med" },
  { id: "c3", column: "in_progress", title: "landing_page()", tag: "UI", priority: "high" },
  { id: "c4", column: "in_progress", title: "theme_user()", tag: "UX", priority: "low" },
  { id: "c5", column: "done", title: "schema_pg()", tag: "SQL", priority: "med" },
  { id: "c6", column: "done", title: "monorepo_init()", tag: "INF", priority: "low" },
] as const;

const PRIORITY_STYLES = {
  high: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]",
  med: "bg-amber-400",
  low: "bg-slate-500",
} as const;

type CardId = (typeof CARDS)[number]["id"];

export function KanbanPreviewWindow() {
  const [pulseCardId, setPulseCardId] = useState<CardId>("c3");
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(62);

  useEffect(() => {
    if (isHovered) {
      return;
    }
    const cardIds = CARDS.map((card) => card.id);
    let index = Math.max(0, cardIds.indexOf(pulseCardId));
    const timer = window.setInterval(() => {
      index = (index + 1) % cardIds.length;
      setPulseCardId(cardIds[index]);
      setProgress((value) => (value >= 94 ? 58 : value + 6));
    }, 2400);
    return () => window.clearInterval(timer);
  }, [isHovered, pulseCardId]);

  return (
    <div
      className="hubhex-kanban-window group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-hidden
    >
      <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-cyan-500/15 via-violet-500/10 to-emerald-500/10 opacity-60 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

      <div className="hubhex-kanban-float relative overflow-hidden rounded-2xl border border-slate-600/50 bg-slate-900/90 shadow-2xl shadow-black/50 backdrop-blur-xl transition-all duration-500 group-hover:-translate-y-1.5 group-hover:border-cyan-500/40 group-hover:shadow-[0_24px_60px_-16px_rgba(34,211,238,0.35)]">
        <div className="flex items-center gap-2 border-b border-slate-700/70 bg-slate-950/70 px-4 py-3">
          <span className="size-2.5 rounded-full bg-red-500/90 transition-transform duration-300 group-hover:scale-125" />
          <span className="size-2.5 rounded-full bg-amber-500/90 transition-transform duration-300 delay-75 group-hover:scale-125" />
          <span className="size-2.5 rounded-full bg-emerald-500/90 transition-transform duration-300 delay-150 group-hover:scale-125" />
          <span className="ml-2 font-mono text-xs text-cyan-300/90">
            <span className="text-slate-500">~/</span>
            hubhex/mon-depot
            <span className="hubhex-kanban-cursor ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 bg-cyan-400/90" />
          </span>
          <span className="ml-auto rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
            ● sprint actif
          </span>
        </div>

        <div className="border-b border-slate-800/80 px-4 py-3">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>progression sprint</span>
            <span className="text-cyan-400">{progress}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-cyan-400 to-emerald-400 transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 p-3 sm:gap-3 sm:p-4">
          {COLUMNS.map((column) => {
            const columnCards = CARDS.filter((card) => card.column === column.id);
            return (
              <div
                key={column.id}
                className={`rounded-xl border bg-slate-950/50 p-2 sm:p-2.5 ${column.accent}`}
              >
                <div className="mb-2 flex items-center gap-1.5 px-0.5">
                  <span className={`size-1.5 rounded-full ${column.dot}`} />
                  <span className="font-display text-[10px] font-semibold uppercase tracking-wide text-slate-300 sm:text-xs">
                    {column.label}
                  </span>
                  <span className="ml-auto rounded bg-slate-800/80 px-1.5 py-0.5 font-mono text-[9px] text-slate-500">
                    {columnCards.length}
                  </span>
                </div>
                <ul className="space-y-2">
                  {columnCards.map((card) => {
                    const isActive = pulseCardId === card.id;
                    return (
                      <li
                        key={card.id}
                        className={`rounded-lg border px-2 py-2 transition-all duration-500 sm:px-2.5 ${
                          isActive
                            ? "scale-[1.03] border-cyan-400/60 bg-cyan-950/60 shadow-[0_0_18px_rgba(34,211,238,0.2)]"
                            : "border-slate-700/50 bg-slate-900/70 opacity-90 group-hover:opacity-100"
                        }`}
                      >
                        <div className="flex items-start gap-1.5">
                          <span
                            className={`mt-1 size-1.5 shrink-0 rounded-full ${PRIORITY_STYLES[card.priority]}`}
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={`truncate font-mono text-[10px] sm:text-[11px] ${
                                isActive ? "text-cyan-50" : "text-slate-200"
                              }`}
                            >
                              {card.title}
                            </p>
                            <span className="mt-1 inline-block rounded bg-slate-800/90 px-1.5 py-0.5 font-mono text-[9px] text-slate-500">
                              {card.tag}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-950/50 px-4 py-2.5 font-mono text-[10px] text-slate-500">
          <span>6 taches · glisser-deposer</span>
          <span className="text-cyan-500/70 transition-colors group-hover:text-cyan-400">
            kanban integre
          </span>
        </div>
      </div>
    </div>
  );
}
