import React, { useState } from 'react';
import {
  Play,
  Download,
  RotateCcw,
  Copy,
  Check,
  Loader2,
  Sliders,
  Keyboard,
  Moon,
  Sun,
  LayoutTemplate,
  Cpu
} from 'lucide-react';
import { LANGUAGE_CONFIGS } from '../utils/templates.js';
import Logo from './Logo.jsx';

/* ── Language accent colours ──────────────────────────────────── */
const LANG_ACCENT = {
  c:      { dot: '#22d3ee', glow: 'rgba(34,211,238,0.7)'   },
  cpp:    { dot: '#60a5fa', glow: 'rgba(96,165,250,0.7)'   },
  java:   { dot: '#fbbf24', glow: 'rgba(251,191,36,0.7)'   },
  python: { dot: '#34d399', glow: 'rgba(52,211,153,0.7)'   }
};

export default function Navbar({
  language,
  onSelectLanguage,
  compilerVersions,
  onRun,
  isRunning,
  onDownload,
  onReset,
  onCopy,
  isDraftSaved,
  isDirty,
  theme,
  onToggleTheme,
  onOpenShortcuts,
  onOpenSettings,
  onResetLayout
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const currentVersion = compilerVersions[language] || LANGUAGE_CONFIGS[language]?.defaultVersion || '';

  return (
    <header className="h-[52px] min-h-[52px] shrink-0 bg-white dark:bg-[#0b0f1a] border-b border-slate-200 dark:border-[#1a2236] px-3 sm:px-5 flex items-center justify-between z-30 select-none shadow-sm dark:shadow-none transition-colors">

      {/* ── LEFT: Logo + Language switcher + version ── */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <Logo />

        <div className="hidden md:block h-5 w-px bg-slate-200 dark:bg-[#1e2638]" />

        {/* Language pill group */}
        <nav className="flex items-center bg-slate-100 dark:bg-[#111827] p-0.5 rounded-lg border border-slate-200 dark:border-[#1e2638]" aria-label="Language">
          {Object.values(LANGUAGE_CONFIGS).map((item) => {
            const isSelected = language === item.id;
            const accent = LANG_ACCENT[item.id] || { dot: '#94a3b8', glow: 'rgba(148,163,184,0.5)' };
            return (
              <button
                key={item.id}
                onClick={() => onSelectLanguage(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all duration-150 ${
                  isSelected
                    ? 'bg-white dark:bg-[#1c2a3e] text-slate-800 dark:text-white shadow-sm border border-slate-200/60 dark:border-transparent'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/[0.04]'
                }`}
                title={`Switch to ${item.name}`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    background: accent.dot,
                    boxShadow: isSelected ? `0 0 7px ${accent.glow}` : 'none'
                  }}
                />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Compiler version badge */}
        {currentVersion && (
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-[#1e2638]">
            <Cpu className="w-3 h-3 text-sky-500" />
            <span>{currentVersion}</span>
          </div>
        )}
      </div>

      {/* ── CENTER: Run button ── */}
      <div className="flex items-center shrink-0">
        <button
          onClick={onRun}
          disabled={isRunning}
          className={`relative flex items-center gap-2 px-4 sm:px-5 py-2 text-xs font-bold text-white rounded-lg transition-all duration-150 shadow-lg select-none whitespace-nowrap ${
            isRunning
              ? 'bg-emerald-700/50 cursor-not-allowed opacity-70 shadow-none'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-95'
          }`}
          title="Execute Code (Ctrl + Enter)"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Running...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run</span>
              <kbd className="hidden sm:inline-flex px-1.5 py-0.5 ml-1 rounded bg-black/20 border border-white/20 text-[10px] font-mono text-emerald-100 whitespace-nowrap items-center">
                Ctrl+↵
              </kbd>
            </>
          )}
        </button>
      </div>

      {/* ── RIGHT: Utility actions ── */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        {/* Copy */}
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
          title="Copy Source Code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
          title="Reset to Starter Template"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        {/* Download */}
        <button
          onClick={onDownload}
          className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-200 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 border border-sky-200 dark:border-sky-500/30 rounded-lg transition-colors"
          title="Download File"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Save</span>
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-[#1e2638] mx-1 hidden sm:block" />

        {/* Reset Layout */}
        {onResetLayout && (
          <button
            onClick={onResetLayout}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors hidden md:inline-flex"
            title="Reset Split Layout"
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Shortcuts */}
        <button
          onClick={onOpenShortcuts}
          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
          title="Keyboard Shortcuts"
        >
          <Keyboard className="w-3.5 h-3.5" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
          title="Editor Settings"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-indigo-500" />
          )}
        </button>

        {/* Save indicator */}
        <div
          className="hidden xl:flex items-center gap-1.5 ml-1 pl-2.5 border-l border-slate-200 dark:border-[#1e2638] text-[11px] text-slate-500 dark:text-slate-400"
          title={isDirty ? 'Unsaved changes' : 'Saved locally'}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isDirty ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
          <span>{isDirty ? 'Unsaved' : 'Saved'}</span>
        </div>
      </div>
    </header>
  );
}
