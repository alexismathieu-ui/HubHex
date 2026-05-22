const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

export function validateUsername(username) {
  const value = username.trim();
  if (value.length < 2) {
    return "Le nom d'utilisateur doit contenir au moins 2 caracteres.";
  }
  if (value.length > 50) {
    return "Le nom d'utilisateur ne peut pas depasser 50 caracteres.";
  }
  if (!USERNAME_PATTERN.test(value)) {
    return "Lettres, chiffres, tirets et underscores uniquement.";
  }
  return null;
}

export function validateEmail(email) {
  const value = email.trim();
  if (!value) {
    return "L'email est requis.";
  }
  if (value.length > 255) {
    return "Email trop long.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "Format d'email invalide.";
  }
  return null;
}

export function validateDisplayName(displayName) {
  if (displayName.length > 80) {
    return "Le pseudo ne peut pas depasser 80 caracteres.";
  }
  return null;
}

export function validateStatusMessage(message) {
  if (message.length > 120) {
    return "Le statut ne peut pas depasser 120 caracteres.";
  }
  return null;
}

export function validateStatusEmoji(emoji) {
  if (emoji.length > 12) {
    return "Emoji de statut trop long.";
  }
  return null;
}

export function validateNewPassword(password) {
  if (password.length < 8) {
    return "Le mot de passe doit contenir au moins 8 caracteres.";
  }
  if (password.length > 100) {
    return "Le mot de passe est trop long.";
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Le mot de passe doit inclure au moins une lettre et un chiffre.";
  }
  return null;
}

export function buildProfilePatchBody(form, currentUser) {
  const body = {};
  const errors = [];

  const trimmedUsername = form.username.trim();
  const trimmedEmail = form.email.trim().toLowerCase();
  const wantsPasswordChange =
    form.currentPassword.trim() ||
    form.newPassword.trim() ||
    form.confirmPassword.trim();
  const emailChanging = trimmedEmail !== currentUser.email.toLowerCase();
  const usernameChanging = trimmedUsername !== currentUser.username;

  if (usernameChanging) {
    const usernameError = validateUsername(trimmedUsername);
    if (usernameError) {
      errors.push(usernameError);
    } else {
      body.username = trimmedUsername;
    }
  }

  if (emailChanging) {
    const emailError = validateEmail(form.email);
    if (emailError) {
      errors.push(emailError);
    } else if (!form.currentPassword.trim()) {
      errors.push("Indique ton mot de passe actuel pour changer d'email.");
    } else {
      body.email = form.email.trim();
      body.currentPassword = form.currentPassword;
    }
  }

  if (wantsPasswordChange) {
    if (!form.currentPassword.trim()) {
      errors.push("Indique ton mot de passe actuel pour le changer.");
    }
    if (!form.newPassword.trim()) {
      errors.push("Indique un nouveau mot de passe.");
    } else {
      const passwordError = validateNewPassword(form.newPassword);
      if (passwordError) {
        errors.push(passwordError);
      }
    }
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      errors.push("La confirmation du nouveau mot de passe ne correspond pas.");
    }
    if (
      form.currentPassword.trim() &&
      form.newPassword.trim() &&
      form.newPassword === form.confirmPassword &&
      !validateNewPassword(form.newPassword)
    ) {
      body.currentPassword = form.currentPassword;
      body.newPassword = form.newPassword;
    }
  }

  const trimmedDisplayName = form.display_name.trim();
  const currentDisplayName = (currentUser.display_name || "").trim();
  if (trimmedDisplayName !== currentDisplayName) {
    const displayError = validateDisplayName(trimmedDisplayName);
    if (displayError) {
      errors.push(displayError);
    } else {
      body.display_name = trimmedDisplayName || null;
    }
  }

  const trimmedStatusMessage = form.status_message.trim();
  const currentStatusMessage = (currentUser.status_message || "").trim();
  if (trimmedStatusMessage !== currentStatusMessage) {
    const statusError = validateStatusMessage(trimmedStatusMessage);
    if (statusError) {
      errors.push(statusError);
    } else {
      body.status_message = trimmedStatusMessage || null;
    }
  }

  const trimmedStatusEmoji = form.status_emoji.trim();
  const currentStatusEmoji = (currentUser.status_emoji || "").trim();
  if (trimmedStatusEmoji !== currentStatusEmoji) {
    const emojiError = validateStatusEmoji(trimmedStatusEmoji);
    if (emojiError) {
      errors.push(emojiError);
    } else {
      body.status_emoji = trimmedStatusEmoji || null;
    }
  }

  if (form.clearAvatar) {
    body.clear_avatar = true;
  } else if (form.pendingAvatar?.base64) {
    body.avatar_base64 = form.pendingAvatar.base64;
    body.avatar_mime = form.pendingAvatar.mime;
  }

  if (errors.length > 0) {
    return { errors, body: null };
  }

  if (Object.keys(body).length === 0) {
    return { errors: ["Aucune modification detectee."], body: null };
  }

  return { errors: [], body };
}
