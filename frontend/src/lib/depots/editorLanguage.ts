/** Associe un nom de fichier a un langage Monaco (comme VS Code). */
const EXT_TO_LANGUAGE: Record<string, string> = {
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  json: "json",
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  sass: "scss",
  less: "less",
  md: "markdown",
  mdx: "markdown",
  xml: "xml",
  svg: "xml",
  yaml: "yaml",
  yml: "yaml",
  sql: "sql",
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  cs: "csharp",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  h: "cpp",
  hpp: "cpp",
  c: "c",
  php: "php",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  ps1: "powershell",
  dockerfile: "dockerfile",
  env: "ini",
  gitignore: "plaintext",
  txt: "plaintext",
};

export function languageFromFileName(fileName: string): string {
  if (!fileName) {
    return "plaintext";
  }
  const lower = fileName.toLowerCase();
  if (lower === "dockerfile") {
    return "dockerfile";
  }
  if (lower.endsWith(".env") || lower === ".env") {
    return "ini";
  }
  const dot = lower.lastIndexOf(".");
  if (dot === -1) {
    return "plaintext";
  }
  const ext = lower.slice(dot + 1);
  return EXT_TO_LANGUAGE[ext] || "plaintext";
}

export function fileIconLabel(fileName: string): string {
  const lang = languageFromFileName(fileName);
  const icons: Record<string, string> = {
    javascript: "JS",
    typescript: "TS",
    json: "{}",
    html: "<>",
    css: "#",
    markdown: "Md",
    python: "Py",
    sql: "SQL",
    shell: "$",
    plaintext: "·",
  };
  return icons[lang] || lang.slice(0, 2).toUpperCase();
}
