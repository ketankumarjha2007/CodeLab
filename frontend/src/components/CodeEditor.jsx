import React, { useRef, useState, useEffect } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { Maximize2, Minimize2, FileCode, CheckCircle2, ChevronRight } from 'lucide-react';
import { LANGUAGE_CONFIGS } from '../utils/templates.js';

// Bundle monaco-editor locally so it never needs external CDN or gets blocked by CSP
loader.config({ monaco });

export default function CodeEditor({
  language,
  code,
  onChange,
  settings,
  theme,
  isFullscreen,
  onToggleFullscreen
}) {
  const editorRef = useRef(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [lineCount, setLineCount] = useState(1);

  useEffect(() => {
    setLineCount(code.split('\n').length);
  }, [code]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({
        line: e.position.lineNumber,
        col: e.position.column
      });
    });

    // High-end Cyber Obsidian theme
    monaco.editor.defineTheme('codelab-cyber', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: '38bdf8', fontStyle: 'bold' },
        { token: 'string', foreground: '34d399' },
        { token: 'number', foreground: 'fbbf24' },
        { token: 'type', foreground: '818cf8' },
        { token: 'function', foreground: '60a5fa' },
        { token: 'operator', foreground: '94a3b8' }
      ],
      colors: {
        'editor.background': '#070a12',
        'editor.foreground': '#f1f5f9',
        'editorLineNumber.foreground': '#334155',
        'editorLineNumber.activeForeground': '#38bdf8',
        'editor.lineHighlightBackground': '#0f172a50',
        'editorCursor.foreground': '#38bdf8',
        'editorIndentGuide.background': '#1e293b40',
        'editorIndentGuide.activeBackground': '#38bdf850',
        'editor.selectionBackground': '#38bdf825'
      }
    });

    monaco.editor.setTheme(theme === 'dark' ? 'codelab-cyber' : 'vs');
  };

  useEffect(() => {
    if (editorRef.current) {
      const monaco = window.monaco;
      if (monaco?.editor) {
        monaco.editor.setTheme(theme === 'dark' ? 'codelab-cyber' : 'vs');
      }
    }
  }, [theme]);

  const currentConfig = LANGUAGE_CONFIGS[language] || LANGUAGE_CONFIGS.cpp;
  const monacoLanguage = currentConfig.monacoLanguage || 'plaintext';
  const filename = currentConfig.filename || 'main';

  // Language badge dot
  const langDotColors = {
    c: 'bg-cyan-400',
    cpp: 'bg-blue-400',
    java: 'bg-amber-400',
    python: 'bg-emerald-400'
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-[#0a0e17] border border-slate-200 dark:border-[#1e2638] rounded-xl overflow-hidden select-none shadow-sm dark:shadow-2xl transition-colors ${isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : ''}`}>
      {/* Editor Tab Bar */}
      <div className="h-10 bg-slate-50 dark:bg-[#0e1422] border-b border-slate-200 dark:border-[#1e2638] px-3.5 flex items-center justify-between transition-colors">
        {/* Active Tab */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-[#070a12] border-t-2 border-t-sky-500 dark:border-t-sky-400 border-x border-slate-200 dark:border-[#1e2638] rounded-t-lg text-xs font-mono text-slate-800 dark:text-slate-200 shadow-sm">
            <span className={`w-2 h-2 rounded-full ${langDotColors[language] || 'bg-sky-400'}`} />
            <span className="font-bold">{filename}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-400 pl-2">
            <span>src</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400">{filename}</span>
          </div>
        </div>

        {/* Right Tab controls */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400/90 uppercase tracking-wider px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 hidden sm:inline">
            {currentConfig.name}
          </span>
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a2336] rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-[#2a374f]"
            title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Full Screen Editor'}
            aria-label="Toggle full screen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Monaco Container */}
      <div className="flex-1 min-h-[300px] relative select-text">
        <Editor
          height="100%"
          language={monacoLanguage}
          value={code}
          onChange={(value) => onChange(value || '')}
          onMount={handleEditorDidMount}
          theme={theme === 'dark' ? 'codelab-cyber' : 'vs'}
          options={{
            fontSize: settings.fontSize || 14,
            tabSize: settings.tabSize || 4,
            wordWrap: settings.wordWrap || 'on',
            minimap: { enabled: settings.minimap ?? false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace",
            fontLigatures: true,
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            padding: { top: 14, bottom: 14 }
          }}
          loading={
            <div className="flex items-center justify-center h-full text-slate-400 text-xs font-mono gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
              Initializing Editor...
            </div>
          }
        />
      </div>

      {/* Editor Status Bar */}
      <div className="h-6 bg-slate-50 dark:bg-[#0c101a] border-t border-slate-200 dark:border-[#1e2638] px-3.5 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 select-none transition-colors">
        <div className="flex items-center gap-4">
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span className="hidden sm:inline">Lines: {lineCount}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>UTF-8</span>
          <span>{settings.tabSize || 4} Spaces</span>
          <span className="text-sky-600 dark:text-sky-400 font-semibold">{currentConfig.defaultVersion}</span>
        </div>
      </div>
    </div>
  );
}
