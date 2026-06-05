import type { ReactNode } from "react";

interface AppCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  highlight?: boolean;
}

export function AppCard({
  children,
  className = "",
  hover = false,
  highlight = false,
}: AppCardProps) {
  return (
    <div
      className={`rounded-xl border bg-slate-900/55 p-5 backdrop-blur-sm ${
        highlight
          ? "border-[color:var(--hubhex-accent-border)] bg-gradient-to-br from-[color:var(--hubhex-accent-muted)] to-slate-900/70"
          : "border-slate-700/50"
      } ${
        hover
          ? "transition-all duration-300 hover:-translate-y-0.5 hover:border-[color:var(--hubhex-accent-border)] hover:bg-slate-900/80 hover:shadow-lg hover:shadow-[color:var(--hubhex-accent-glow)]"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
