"use client";

import { useEffect, useState } from "react";

const TASKS = [
  { column: "todo", title: "configurer_api()" },
  { column: "in_progress", title: "landing_page()" },
  { column: "done", title: "schema_pg()" },
] as const;

export function KanbanPreviewWindow() {
  const [activeIndex, setActiveIndex] = useState(1);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % TASKS.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, [isHovered]);

  return (
    <div
      className="hubhex-kanban-window group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-hidden
    >
      <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-cyan-500/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

      <div className="hubhex-kanban-float relative rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6 shadow-xl shadow-black/40 backdrop-blur-md transition-all duration-500 group-hover:-translate-y-1 group-hover:border-cyan-600/50 group-hover:shadow-[0_20px_50px_-12px_rgba(34,211,238,0.25)]">
        <div className="flex items-center gap-2 border-b border-slate-700/80 pb-4">
          <span className="size-2.5 rounded-full bg-red-500/80 transition-transform duration-300 group-hover:scale-125 group-hover:bg-red-400" />
          <span className="size-2.5 rounded-full bg-amber-500/80 transition-transform duration-300 delay-75 group-hover:scale-125 group-hover:bg-amber-400" />
          <span className="size-2.5 rounded-full bg-emerald-500/80 transition-transform duration-300 delay-150 group-hover:scale-125 group-hover:bg-emerald-400" />
          <span className="ml-2 font-mono text-xs text-cyan-400/90">
            <span className="text-slate-500">~/</span>
            votre-compte/mon-depot
            <span className="hubhex-kanban-cursor ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 bg-cyan-400/80" />
          </span>
        </div>

        <ul className="mt-4 space-y-3 font-mono text-sm">
          {TASKS.map((task, index) => {
            const isActive = activeIndex === index;
            return (
              <li
                key={task.column}
                className={`flex justify-between rounded-lg px-3 py-2 transition-all duration-500 ease-out ${
                  isActive
                    ? "translate-x-1 scale-[1.02] bg-cyan-950/50 ring-1 ring-cyan-500/60 shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                    : "bg-slate-950/50 opacity-75 group-hover:opacity-90"
                } hover:translate-x-1.5 hover:bg-slate-900/80 hover:opacity-100`}
              >
                <span
                  className={`transition-colors duration-500 ${
                    isActive
                      ? "text-cyan-400"
                      : task.column === "done"
                        ? "text-slate-600"
                        : "text-slate-500"
                  }`}
                >
                  {task.column}
                </span>
                <span
                  className={`transition-colors duration-500 ${
                    isActive
                      ? "text-cyan-50"
                      : task.column === "done"
                        ? "text-slate-500"
                        : "text-slate-300"
                  }`}
                >
                  {task.title}
                </span>
              </li>
            );
          })}
        </ul>

        <p className="mt-4 text-center font-mono text-xs text-slate-500 transition-colors duration-300 group-hover:text-cyan-500/70">
          /* apercu Kanban */
        </p>

        <div className="absolute right-4 top-4 font-mono text-[10px] text-emerald-400/0 transition-all duration-500 group-hover:text-emerald-400/80">
          ● live
        </div>
      </div>
    </div>
  );
}
