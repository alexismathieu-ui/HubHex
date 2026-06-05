import type { ReactNode } from "react";

import { HubHexLogo } from "../layout/HubHexLogo";
import { PublicPageShell } from "../layout/PublicPageShell";

interface AuthPageChromeProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthPageChrome({ title, subtitle, children, footer }: AuthPageChromeProps) {
  return (
    <PublicPageShell>
      <main className="flex min-h-screen flex-col px-4 py-8 md:py-10">
        <div className="mx-auto w-full max-w-md flex-1">
          <div className="mb-6 flex min-h-14 items-center">
            <HubHexLogo href="/" size={48} className="shrink-0" />
          </div>

          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-50">{title}</h1>
          {subtitle ? <p className="mt-2 text-slate-400">{subtitle}</p> : null}

          <div className={subtitle ? "mt-8" : "mt-6"}>{children}</div>

          {footer ? <div className="mt-6 text-center text-sm text-slate-400">{footer}</div> : null}
        </div>
      </main>
    </PublicPageShell>
  );
}
