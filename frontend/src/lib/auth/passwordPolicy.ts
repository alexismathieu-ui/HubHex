export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: "8 caracteres minimum",
    test: (password) => password.length >= 8,
  },
  {
    id: "lower",
    label: "Une lettre minuscule",
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "upper",
    label: "Une lettre majuscule",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "digit",
    label: "Un chiffre",
    test: (password) => /[0-9]/.test(password),
  },
  {
    id: "symbol",
    label: "Un caractere special (!@#$…)",
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

export function evaluatePasswordRules(password: string): Record<string, boolean> {
  return Object.fromEntries(
    PASSWORD_RULES.map((rule) => [rule.id, rule.test(password)]),
  );
}

export function isPasswordStrong(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

export function validatePasswordPolicy(password: string): string | null {
  if (password.length > 100) {
    return "Le mot de passe est trop long.";
  }
  if (!isPasswordStrong(password)) {
    return "Le mot de passe ne respecte pas tous les criteres de securite.";
  }
  return null;
}
