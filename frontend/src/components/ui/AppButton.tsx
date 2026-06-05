import type { ButtonHTMLAttributes, ReactNode } from "react";

type AppButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: AppButtonVariant;
}

const VARIANT_CLASSES: Record<AppButtonVariant, string> = {
  primary:
    "bg-accent font-display font-semibold text-[color:var(--hubhex-accent-on)] shadow-lg shadow-[color:var(--hubhex-accent-glow)] hover:bg-[color:var(--hubhex-accent-hover)] hover:-translate-y-0.5",
  secondary:
    "border border-slate-600/80 bg-slate-900/50 font-display font-semibold text-slate-200 backdrop-blur-sm hover:border-[color:var(--hubhex-accent-border)] hover:bg-slate-900/90",
  ghost:
    "border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-slate-100",
  danger:
    "border border-rose-800/60 bg-rose-950/30 text-rose-200 hover:border-rose-600",
};

export function AppButton({
  children,
  variant = "secondary",
  className = "",
  type = "button",
  ...props
}: AppButtonProps) {
  return (
    <button
      type={type}
      className={`rounded-lg px-4 py-2 text-sm transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[color:var(--hubhex-accent)] disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
