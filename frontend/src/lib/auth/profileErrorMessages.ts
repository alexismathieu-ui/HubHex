const API_MESSAGE_FR: Record<string, string> = {
  "User not found.": "Utilisateur introuvable.",
  "Current password is incorrect.": "Mot de passe actuel incorrect.",
  "Username already used.": "Ce nom d'utilisateur est deja pris.",
  "Email already used.": "Cet email est deja utilise.",
  "No profile data to update.": "Aucune donnee a mettre a jour.",
  "Current and new password are both required to change password.":
    "Le mot de passe actuel et le nouveau sont requis.",
  "Current password is required to change email.":
    "Le mot de passe actuel est requis pour changer d'email.",
  "Username may only contain letters, numbers, underscores and hyphens.":
    "Lettres, chiffres, tirets et underscores uniquement.",
  "Password must include at least one letter and one number.":
    "Le mot de passe doit inclure au moins une lettre et un chiffre.",
  "Password must be at least 8 characters.":
    "Le mot de passe doit contenir au moins 8 caracteres.",
  "Password must include at least one lowercase letter.":
    "Le mot de passe doit inclure au moins une minuscule.",
  "Password must include at least one uppercase letter.":
    "Le mot de passe doit inclure au moins une majuscule.",
  "Password must include at least one number.":
    "Le mot de passe doit inclure au moins un chiffre.",
  "Password must include at least one special character.":
    "Le mot de passe doit inclure au moins un caractere special.",
};

export function translateProfileApiMessage(message: string | undefined): string | undefined {
  if (!message || typeof message !== "string") {
    return message;
  }
  return API_MESSAGE_FR[message] || message;
}
