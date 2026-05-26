"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef } from "react";

const Editor = dynamic(() => import("@monaco-editor/react").then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#1e1e1e] text-sm text-slate-500">
      Chargement de l&apos;editeur...
    </div>
  ),
});

export function MonacoEditorPane({
  path,
  value,
  language,
  onChange,
  onSave,
  onCursorChange,
  wordWrap,
  fontSize,
  showMinimap,
  readOnly = false,
}) {
  const editorRef = useRef(null);
  const onSaveRef = useRef(onSave);
  const onChangeRef = useRef(onChange);
  const onCursorRef = useRef(onCursorChange);
  onSaveRef.current = onSave;
  onChangeRef.current = onChange;
  onCursorRef.current = onCursorChange;

  const options = useMemo(
    () => ({
      readOnly,
      automaticLayout: true,
      fontSize,
      fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', Consolas, monospace",
      fontLigatures: true,
      lineNumbers: "on",
      minimap: { enabled: showMinimap },
      scrollBeyondLastLine: false,
      wordWrap: wordWrap ? "on" : "off",
      tabSize: 2,
      insertSpaces: true,
      detectIndentation: true,
      bracketPairColorization: { enabled: true },
      renderWhitespace: "selection",
      smoothScrolling: true,
      cursorBlinking: "smooth",
      cursorSmoothCaretAnimation: "on",
      padding: { top: 8, bottom: 8 },
      scrollbar: {
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
      },
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      folding: true,
      glyphMargin: true,
      guides: {
        bracketPairs: true,
        indentation: true,
      },
    }),
    [readOnly, fontSize, showMinimap, wordWrap],
  );

  const handleMount = (editor, monaco) => {
    editorRef.current = editor;

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSaveRef.current?.();
    });

    editor.onDidChangeCursorPosition((event) => {
      onCursorRef.current?.({
        line: event.position.lineNumber,
        column: event.position.column,
      });
    });
  };

  return (
    <Editor
      height="100%"
      path={path}
      language={language}
      value={value}
      theme="vs-dark"
      onChange={(next) => onChangeRef.current?.(next ?? "")}
      onMount={handleMount}
      options={options}
    />
  );
}
