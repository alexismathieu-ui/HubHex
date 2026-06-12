"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef } from "react";
import type { editor } from "monaco-editor";

import "../../lib/depots/monacoSetup";
import { registerKeywordCompletions } from "../../lib/depots/monacoKeywordCompletions";

const Editor = dynamic(() => import("@monaco-editor/react").then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#1e1e1e] text-sm text-slate-500">
      Chargement de l&apos;editeur...
    </div>
  ),
});

interface CursorPosition {
  line: number;
  column: number;
}

interface MonacoEditorPaneProps {
  path?: string;
  value: string;
  language: string;
  tabSize?: number;
  onChange?: (value: string) => void;
  onSave?: () => void;
  onCursorChange?: (position: CursorPosition) => void;
  wordWrap: boolean;
  fontSize: number;
  showMinimap: boolean;
  readOnly?: boolean;
}

export function MonacoEditorPane({
  path,
  value,
  language,
  tabSize = 2,
  onChange,
  onSave,
  onCursorChange,
  wordWrap,
  fontSize,
  showMinimap,
  readOnly = false,
}: MonacoEditorPaneProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
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
      lineNumbers: "on" as const,
      minimap: { enabled: showMinimap },
      scrollBeyondLastLine: false,
      wordWrap: (wordWrap ? "on" : "off") as "on" | "off",
      tabSize,
      insertSpaces: true,
      detectIndentation: true,
      formatOnPaste: true,
      formatOnType: false,
      bracketPairColorization: { enabled: true },
      renderWhitespace: "selection" as const,
      smoothScrolling: true,
      cursorBlinking: "smooth" as const,
      cursorSmoothCaretAnimation: "on" as const,
      padding: { top: 8, bottom: 8 },
      scrollbar: {
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
      },
      suggestOnTriggerCharacters: true,
      quickSuggestions: {
        other: true,
        comments: false,
        strings: true,
      },
      wordBasedSuggestions: "currentDocument" as const,
      suggest: {
        showKeywords: true,
        showSnippets: true,
        showFunctions: true,
        showMethods: true,
        showConstructors: true,
        preview: true,
      },
      parameterHints: { enabled: true },
      tabCompletion: "on" as const,
      folding: true,
      glyphMargin: true,
      guides: {
        bracketPairs: true,
        indentation: true,
      },
    }),
    [readOnly, fontSize, showMinimap, wordWrap, tabSize],
  );

  useEffect(() => {
    const mountedEditor = editorRef.current;
    const monaco = monacoRef.current;
    const model = mountedEditor?.getModel();
    if (!mountedEditor || !monaco || !model) {
      return;
    }
    if (model.getLanguageId() !== language) {
      monaco.editor.setModelLanguage(model, language);
    }
    model.updateOptions({ tabSize, insertSpaces: true });
  }, [language, tabSize]);

  const handleBeforeMount = (monaco: typeof import("monaco-editor")) => {
    registerKeywordCompletions(monaco);
  };

  const handleMount = (mountedEditor: editor.IStandaloneCodeEditor, monaco: typeof import("monaco-editor")) => {
    editorRef.current = mountedEditor;
    monacoRef.current = monaco;

    const model = mountedEditor.getModel();
    if (model && model.getLanguageId() !== language) {
      monaco.editor.setModelLanguage(model, language);
    }
    model?.updateOptions({ tabSize, insertSpaces: true });

    mountedEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSaveRef.current?.();
    });

    mountedEditor.addCommand(
      monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
      () => {
        void mountedEditor.getAction("editor.action.formatDocument")?.run();
      },
    );

    mountedEditor.onDidChangeCursorPosition((event) => {
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
      beforeMount={handleBeforeMount}
      onMount={handleMount}
      options={options}
    />
  );
}
