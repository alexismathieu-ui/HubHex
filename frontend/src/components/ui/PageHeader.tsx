import type { ReactNode } from "react";

interface PageHeaderProps {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ kicker, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {kicker ? (
          <p className="font-mono text-sm font-medium uppercase tracking-wider text-accent">
            {kicker}
          </p>
        ) : null}
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-50 md:text-4xl">
          {title}
        </h1>
        {description ? <p className="mt-2 max-w-2xl text-slate-400">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
