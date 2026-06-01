import type { ReactNode } from "react";

import { CodeAnimatedBackground } from "../background/CodeAnimatedBackground";

interface PublicPageShellProps {
  children: ReactNode;
}

/** Enveloppe accueil / auth : fond slate + effet techno au survol souris */
export function PublicPageShell({ children }: PublicPageShellProps) {
  return (
    <div className="relative isolate min-h-screen text-slate-100">
      <CodeAnimatedBackground />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
