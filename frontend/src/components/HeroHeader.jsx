import React, { useState } from 'react';
import { Play, Download, RotateCcw, Copy, Check, Loader2, HardDrive, Cpu, Sparkles } from 'lucide-react';
import { LANGUAGE_CONFIGS } from '../utils/templates.js';

export default function HeroHeader({
  language,
  onSelectLanguage,
  compilerVersions,
  onRun,
  isRunning,
  onDownload,
  onReset,
  onCopy,
  isDraftSaved,
  isDirty
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyClick = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentLangConfig = LANGUAGE_CONFIGS[language] || LANGUAGE_CONFIGS.cpp;
  const currentVersion = compilerVersions[language] || currentLangConfig.defaultVersion;

  return (
    <div className="border-b border-white/[0.06] bg-[#090d16]/95 backdrop-blur-md px-4 sm:px-6 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Language Segmented Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/[0.08] shadow-inner">
            {Object.values(LANGUAGE_CONFIGS).map((item) => {
              const isSelected = language === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectLanguage(item.id)}
                  className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* Compiler Version Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono text-slate-400">
            <Cpu className="w-3 h-3 text-sky-400" />
            <span>{currentVersion}</span>
          </div>

          {/* Local Draft Status */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 pl-2">
            <HardDrive className={`w-3.5 h-3.5 ${isDraftSaved ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="text-[11px]">
              {isDraftSaved ? 'Saved locally' : 'Saving draft...'}
            </span>
            {isDirty && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title="Unsaved changes in active buffer" />
            )}
          </div>
        </div>

        {/* Right: Actions (Copy, Reset, Download, Run) */}
        <div className="flex items-center gap-2">
          {/* Copy Code */}
          <button
            onClick={handleCopyClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 rounded-lg transition-all active:scale-95 shadow-sm"
            title="Copy Source Code to Clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Reset Code */}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 rounded-lg transition-all active:scale-95 shadow-sm"
            title="Reset to starter template"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Download Code */}
          <button
            onClick={onDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-300 hover:text-white bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 hover:border-sky-500/50 rounded-lg transition-all active:scale-95 shadow-sm"
            title="Download Source Code (Ctrl+S)"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Download</span>
          </button>

          {/* Run Code Button */}
          <button
            onClick={onRun}
            disabled={isRunning}
            className="relative group overflow-hidden flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-lg shadow-emerald-500/20 transition-all duration-150"
            title="Execute Program (Ctrl+Enter)"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Code</span>
                <span className="hidden sm:inline-block ml-0.5 px-1 py-0.2 rounded bg-black/25 text-[10px] font-mono opacity-80">
                  Ctrl+↵
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
