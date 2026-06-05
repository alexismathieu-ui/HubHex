import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: boolean;
}

export function StatCard({ label, value, hint, accent = false }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-950/70 p-4 backdrop-blur-sm transition-all duration-300 hover:border-[color:var(--hubhex-accent-border)]">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <div
        className={`mt-1 text-2xl font-bold ${accent ? "text-accent" : "text-slate-100"}`}
      >
        {value}
      </div>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}
