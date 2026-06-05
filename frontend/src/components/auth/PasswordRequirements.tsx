"use client";

import {
  evaluatePasswordRules,
  isPasswordStrong,
  PASSWORD_RULES,
} from "../../lib/auth/passwordPolicy";

interface PasswordRequirementsProps {
  password: string;
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  if (!password) {
    return null;
  }

  const results = evaluatePasswordRules(password);
  const allValid = isPasswordStrong(password);

  return (
    <ul
      className="mt-2 space-y-1 rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-2.5 text-xs"
      aria-live="polite"
    >
      {PASSWORD_RULES.map((rule) => {
        const valid = results[rule.id];
        return (
          <li
            key={rule.id}
            className={`flex items-center gap-2 transition-colors ${
              valid ? "text-emerald-400" : "text-slate-500"
            }`}
          >
            <span aria-hidden className="w-3 shrink-0 text-center font-mono">
              {valid ? "✓" : "○"}
            </span>
            <span>{rule.label}</span>
          </li>
        );
      })}
      {allValid ? (
        <li className="mt-1 border-t border-slate-800/80 pt-2 text-emerald-300">
          Mot de passe suffisamment robuste.
        </li>
      ) : null}
    </ul>
  );
}
