const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const MIME_ALIASES = {
  "image/jpg": "image/jpeg",
};

const ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function normalizeMime(type) {
  return MIME_ALIASES[type] || type;
}

export function readAvatarFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("Aucun fichier selectionne."));
      return;
    }
    const mime = normalizeMime(file.type);
    if (!mime || !ALLOWED_MIMES.has(mime)) {
      reject(new Error("Format accepte : JPEG, PNG, WebP ou GIF."));
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      reject(new Error("Image trop volumineuse (max 2 Mo)."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      if (comma === -1) {
        reject(new Error("Lecture de l'image impossible."));
        return;
      }
      resolve({
        mime,
        base64: result.slice(comma + 1),
        previewUrl: result,
      });
    };
    reader.onerror = () => reject(new Error("Lecture de l'image impossible."));
    reader.readAsDataURL(file);
  });
}
