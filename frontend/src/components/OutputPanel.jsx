import React, { useState } from 'react';
import { Terminal, AlertTriangle, Trash2, Copy, Check, Clock, Cpu, ChevronDown, ChevronUp, CheckCircle2, ShieldCheck, Flame } from 'lucide-react';

const STATUS_CONFIGS = {
  'Accepted': {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
  },
  'Compilation Error': {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
  },
  'Runtime Error': {
    text: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    icon: <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
  },
  'Time Limit Exceeded': {
    text: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)]',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    icon: <Clock className="w-4 h-4 text-orange-400 shrink-0" />
  },
  'Output Limit Exceeded': {
    text: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)]',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    icon: <Flame className="w-4 h-4 text-orange-400 shrink-0" />
  },
  'Queue Full': {
    text: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    icon: <AlertTriangle className="w-4 h-4 text-purple-400 shrink-0" />
  },
  'Internal Error': {
    text: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    icon: <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
  }
};

export default function OutputPanel({
  result,
  isRunning,
  onClear,
  isCollapsed,
  onToggleCollapse
}) {
  const [activeTab, setActiveTab] = useState('output');
  const [copied, setCopied] = useState(false);

  const hasResult = result !== null;
  const statusCfg = hasResult ? (STATUS_CONFIGS[result.status] || STATUS_CONFIGS['Internal Error']) : null;

  const outputText = hasResult ? result.stdout : '';
  const errorText = hasResult ? result.stderr : '';
  const hasErrors = errorText.trim().length > 0;
  const hasOutput = outputText.trim().length > 0;

  const handleCopy = async () => {
    const textToCopy = activeTab === 'output' ? outputText : errorText;
    if (textToCopy) {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`flex flex-col bg-[#07090e] border border-white/[0.08] rounded-2xl overflow-hidden transition-all shadow-xl ${isCollapsed ? 'h-10' : 'h-full min-h-[160px]'}`}>
      {/* Panel Header */}
      <div className="h-10 bg-[#0a0e1a]/95 border-b border-white/[0.06] px-3.5 flex items-center justify-between shrink-0 select-none">
        {/* Terminal Tabs */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('output')}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'output'
                ? 'bg-white/[0.08] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            <span>Output</span>
            {hasOutput && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />}
          </button>

          <button
            onClick={() => setActiveTab('errors')}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'errors'
                ? 'bg-white/[0.08] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Errors</span>
            {hasErrors && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />}
          </button>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          {hasResult && !isCollapsed && (
            <>
              <button
                onClick={handleCopy}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors"
                title="Copy terminal content"
                aria-label="Copy output"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onClear}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/[0.06] rounded-md transition-colors"
                title="Clear output"
                aria-label="Clear output"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors"
            title={isCollapsed ? 'Expand output' : 'Collapse output'}
            aria-label="Toggle collapse"
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Panel Body */}
      {!isCollapsed && (
        <div className="flex flex-col flex-1 overflow-hidden relative">
          {/* Status Bar */}
          {hasResult && !isRunning && statusCfg && (
            <div className={`flex items-center justify-between gap-3 px-4 py-2 border-b border-white/[0.06] ${statusCfg.bg}`}>
              <div className="flex items-center gap-2">
                {statusCfg.icon}
                <span className={`text-xs font-bold tracking-wide ${statusCfg.text}`}>
                  {result.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                {result.executionTimeMs !== undefined && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/30 border border-white/5">
                    <Clock className="w-3 h-3 text-sky-400" />
                    <span>{result.executionTimeMs} ms</span>
                  </span>
                )}
                {result.engine && (
                  <span className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/30 border border-white/5 text-[11px]">
                    <ShieldCheck className="w-3 h-3 text-indigo-400" />
                    <span>{result.engine}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Running State */}
          {isRunning && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 p-8">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-sky-500/20 border-t-sky-400 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-sky-400 animate-ping opacity-60" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-200">Executing code...</p>
                <p className="text-xs text-slate-400 mt-0.5">Isolated sandbox worker is compiling & running</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isRunning && !hasResult && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 p-8">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-slate-400">
                <Terminal className="w-6 h-6 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-300">Ready to execute</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Press <kbd className="px-1.5 py-0.5 bg-white/[0.06] border border-white/10 rounded text-[11px] font-mono text-slate-300">Ctrl + Enter</kbd> or click <strong>Run Code</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Output Content */}
          {!isRunning && hasResult && (
            <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed selection:bg-sky-500/30">
              {activeTab === 'output' && (
                <pre className="text-slate-100 whitespace-pre-wrap break-words font-mono">
                  {outputText || (
                    <span className="text-slate-400 italic">
                      {result.status === 'Accepted'
                        ? 'Program completed successfully with empty standard output.'
                        : 'No standard output produced.'}
                    </span>
                  )}
                </pre>
              )}

              {activeTab === 'errors' && (
                <pre className={`whitespace-pre-wrap break-words font-mono ${errorText ? 'text-rose-300' : 'text-slate-400 italic'}`}>
                  {errorText || 'No diagnostic errors or warnings detected.'}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
