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
};

export function translateProfileApiMessage(message: string | undefined): string | undefined {
  if (!message || typeof message !== "string") {
    return message;
  }
  return API_MESSAGE_FR[message] || message;
}
