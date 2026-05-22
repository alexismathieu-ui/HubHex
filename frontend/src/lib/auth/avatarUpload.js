const MAX_AVATAR_BYTES = 512 * 1024;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function readAvatarFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("Aucun fichier selectionne."));
      return;
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      reject(new Error("Format accepte : JPEG, PNG, WebP ou GIF."));
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      reject(new Error("Image trop volumineuse (max 512 Ko)."));
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
        mime: file.type,
        base64: result.slice(comma + 1),
        previewUrl: result,
      });
    };
    reader.onerror = () => reject(new Error("Lecture de l'image impossible."));
    reader.readAsDataURL(file);
  });
}
