/**
 * Detection du langage Monaco a partir du nom / chemin de fichier (comme VS Code).
 */

const EXT_TO_LANGUAGE: Record<string, string> = {
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  vue: "html",
  svelte: "html",
  json: "json",
  jsonc: "json",
  html: "html",
  htm: "html",
  xhtml: "html",
  css: "css",
  scss: "scss",
  sass: "scss",
  less: "less",
  md: "markdown",
  mdx: "markdown",
  xml: "xml",
  xsd: "xml",
  xsl: "xml",
  svg: "xml",
  yaml: "yaml",
  yml: "yaml",
  sql: "sql",
  psql: "sql",
  py: "python",
  pyw: "python",
  ipynb: "json",
  rb: "ruby",
  erb: "ruby",
  go: "go",
  mod: "go",
  rs: "rust",
  java: "java",
  jsp: "java",
  kt: "kotlin",
  kts: "kotlin",
  cs: "csharp",
  csx: "csharp",
  fs: "fsharp",
  fsx: "fsharp",
  vb: "vb",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  h: "cpp",
  hpp: "cpp",
  hh: "cpp",
  hxx: "cpp",
  inl: "cpp",
  c: "c",
  hls: "c",
  php: "php",
  phtml: "php",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  fish: "shell",
  ps1: "powershell",
  psm1: "powershell",
  bat: "bat",
  cmd: "bat",
  dockerfile: "dockerfile",
  tf: "hcl",
  hcl: "hcl",
  lua: "lua",
  r: "r",
  swift: "swift",
  dart: "dart",
  ex: "elixir",
  exs: "elixir",
  clj: "clojure",
  cljs: "clojure",
  scala: "scala",
  gql: "graphql",
  graphql: "graphql",
  proto: "protobuf",
  toml: "ini",
  ini: "ini",
  cfg: "ini",
  conf: "ini",
  properties: "ini",
  env: "ini",
  gitignore: "plaintext",
  dockerignore: "plaintext",
  txt: "plaintext",
  log: "plaintext",
  csv: "plaintext",
};

/** Extensions composees (ex. fichier.test.tsx). */
const COMPOUND_EXTENSIONS: [string, string][] = [
  [".d.ts", "typescript"],
  [".test.ts", "typescript"],
  [".spec.ts", "typescript"],
  [".test.tsx", "typescript"],
  [".spec.tsx", "typescript"],
  [".test.js", "javascript"],
  [".spec.js", "javascript"],
  [".test.jsx", "javascript"],
  [".spec.jsx", "javascript"],
];

const FILENAME_TO_LANGUAGE: Record<string, string> = {
  dockerfile: "dockerfile",
  makefile: "makefile",
  gnumakefile: "makefile",
  cmakelists: "cmake",
  cmakeliststxt: "cmake",
  ".gitignore": "plaintext",
  ".dockerignore": "plaintext",
  ".env": "ini",
  ".env.local": "ini",
  ".env.development": "ini",
  ".env.production": "ini",
};

const LANGUAGE_TAB_SIZE: Record<string, number> = {
  csharp: 4,
  java: 4,
  kotlin: 4,
  python: 4,
  go: 4,
  rust: 4,
  php: 4,
  c: 4,
  cpp: 4,
  fsharp: 4,
  vb: 4,
  makefile: 4,
  cmake: 4,
};

const LANGUAGE_LABEL: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  csharp: "C#",
  cpp: "C++",
  c: "C",
  fsharp: "F#",
  vb: "Visual Basic",
  shell: "Shell",
  powershell: "PowerShell",
  plaintext: "Texte brut",
  markdown: "Markdown",
};

function baseName(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  const slash = normalized.lastIndexOf("/");
  return slash === -1 ? normalized : normalized.slice(slash + 1);
}

export function languageFromFileName(filePath: string): string {
  if (!filePath?.trim()) {
    return "plaintext";
  }

  const name = baseName(filePath).toLowerCase();
  const fileKey = name.replace(/\./g, "");

  if (FILENAME_TO_LANGUAGE[name]) {
    return FILENAME_TO_LANGUAGE[name];
  }
  if (FILENAME_TO_LANGUAGE[fileKey]) {
    return FILENAME_TO_LANGUAGE[fileKey];
  }

  const lowerPath = filePath.toLowerCase();
  for (const [suffix, lang] of COMPOUND_EXTENSIONS) {
    if (lowerPath.endsWith(suffix)) {
      return lang;
    }
  }

  if (name.endsWith(".env") || name.startsWith(".env.")) {
    return "ini";
  }

  const dot = name.lastIndexOf(".");
  if (dot === -1) {
    return "plaintext";
  }

  const ext = name.slice(dot + 1);
  return EXT_TO_LANGUAGE[ext] || "plaintext";
}

export function tabSizeForLanguage(language: string): number {
  return LANGUAGE_TAB_SIZE[language] ?? 2;
}

export function languageDisplayLabel(language: string): string {
  return LANGUAGE_LABEL[language] || language;
}

export function fileIconLabel(filePath: string): string {
  const lang = languageFromFileName(filePath);
  const icons: Record<string, string> = {
    javascript: "JS",
    typescript: "TS",
    csharp: "C#",
    cpp: "C++",
    c: "C",
    fsharp: "F#",
    json: "{}",
    html: "<>",
    css: "#",
    markdown: "Md",
    python: "Py",
    java: "Jv",
    kotlin: "Kt",
    go: "Go",
    rust: "Rs",
    sql: "SQL",
    shell: "$",
    powershell: "PS",
    php: "PHP",
    ruby: "Rb",
    swift: "Sw",
    dart: "Da",
    plaintext: "·",
  };
  return icons[lang] || lang.slice(0, 2).toUpperCase();
}
