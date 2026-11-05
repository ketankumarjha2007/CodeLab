import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Copy,
  Check,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Terminal
} from 'lucide-react';

/* ─── helpers ───────────────────────────────────────────────── */

/**
 * Merge program output with the stdin values the user provided.
 * Strategy: each time we see a "prompt" line (ends with common
 * delimiters or just any line) followed by a newline, we try
 * to inject the matching stdin token right after it on the same line,
 * so the terminal looks like:
 *
 *   Enter a number: 10
 *   The number is 10
 *
 * This mimics what a real TTY shows when stdin is piped.
 */
function buildDisplayLines(stdout, stdinRaw) {
  if (!stdout) return [];

  const stdinTokens = stdinRaw
    ? stdinRaw.split('\n').map((s) => s.trim()).filter(Boolean)
    : [];

  // Split stdout into raw chars so we can track prompt vs result
  const lines = stdout.split('\n');
  const result = [];
  let tokenIdx = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isLast = i === lines.length - 1;

    // A "prompt line" heuristic: ends with ': ', ': ', '? ' or similar,
    // OR the stdout itself already echoed the token (token appears in line)
    const hasToken = stdinTokens[tokenIdx] !== undefined;
    const tokenAlreadyEchoed =
      hasToken && line.includes(stdinTokens[tokenIdx]);

    if (hasToken && !tokenAlreadyEchoed) {
      // Check if this is a prompt line (ends with certain chars or no newline)
      const looksLikePrompt =
        line.trimEnd().endsWith(':') ||
        line.trimEnd().endsWith('?') ||
        line.trimEnd().endsWith('>') ||
        line.trimEnd().endsWith('=');

      if (looksLikePrompt) {
        // Echo the input token right after the prompt on the same line
        result.push({ type: 'prompt-with-input', prompt: line, input: stdinTokens[tokenIdx] });
        tokenIdx++;
        continue;
      }
    }

    // Normal output line
    if (!isLast || line !== '') {
      result.push({ type: 'output', text: line });
    }
  }

  return result;
}

/* ─── Status config ─────────────────────────────────────────── */
const STATUS_CFG = {
  Accepted: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', dot: 'bg-emerald-400', label: 'Accepted' },
  'Compilation Error': { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/25', dot: 'bg-amber-400', label: 'Compile Error' },
  'Runtime Error': { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/25', dot: 'bg-rose-400', label: 'Runtime Error' },
  'Time Limit Exceeded': { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/25', dot: 'bg-orange-400', label: 'Time Limit' },
  'Output Limit Exceeded': { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/25', dot: 'bg-orange-400', label: 'Output Limit' },
  'Internal Error': { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/25', dot: 'bg-rose-400', label: 'Error' }
};

/* ─── Main Component ─────────────────────────────────────────── */
export default function TerminalPanel({
  result,
  isRunning,
  stdin,
  onStdinChange,
  onClearOutput,
  onRun
}) {
  const [copiedOutput, setCopiedOutput] = useState(false);
  const outputEndRef = useRef(null);
  const stdinRef = useRef(null);

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (result && outputEndRef.current) {
      outputEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result]);

  const handleCopyOutput = useCallback(async () => {
    const text = [result?.stdout, result?.stderr ? `\n${result.stderr}` : ''].join('').trim();
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedOutput(true);
    setTimeout(() => setCopiedOutput(false), 1800);
  }, [result]);

  const handleClearAll = useCallback(() => {
    onClearOutput();
    onStdinChange('');
  }, [onClearOutput, onStdinChange]);

  const statusCfg = result ? (STATUS_CFG[result.status] || STATUS_CFG['Internal Error']) : null;
  const displayLines = result ? buildDisplayLines(result.stdout || '', stdin || '') : [];
  const hasOutput = result && (result.stdout || result.stderr);

  return (
    <div className="flex flex-col h-full bg-[#070a12] border border-[#1e2638] rounded-xl overflow-hidden shadow-2xl">

      {/* ── Panel Header ── */}
      <div className="h-10 shrink-0 bg-[#0d1120] border-b border-[#1e2638] px-4 flex items-center justify-between select-none">
        {/* Left: Traffic lights + title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57] shadow-[0_0_6px_rgba(255,95,87,0.6)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e] shadow-[0_0_6px_rgba(254,188,46,0.6)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840] shadow-[0_0_6px_rgba(40,200,64,0.6)]" />
          </div>
          <div className="h-4 w-px bg-[#1e2638]" />
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs font-semibold text-slate-200 tracking-wide">Output</span>
          </div>
          {/* Status pill */}
          {!isRunning && statusCfg && (
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono border ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
              {result?.executionTimeMs !== undefined && (
                <span className="text-slate-400 font-normal pl-1 border-l border-white/10">
                  {result.executionTimeMs}ms
                </span>
              )}
            </div>
          )}
          {isRunning && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono border bg-sky-500/10 border-sky-500/25 text-sky-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              Running...
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopyOutput}
            disabled={!hasOutput}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Copy output"
          >
            {copiedOutput ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleClearAll}
            disabled={!result && !stdin}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Clear output"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Scrollable Body: Output + Input ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Output area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 font-mono text-[13px] leading-relaxed">

          {/* Idle state */}
          {!isRunning && !result && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center select-none">
              <div className="w-12 h-12 rounded-2xl bg-[#0e1422] border border-[#1e2638] flex items-center justify-center shadow-lg">
                <Terminal className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-medium">Ready to execute</p>
                <p className="text-slate-600 text-xs mt-0.5">
                  Press <kbd className="px-1 py-0.5 bg-[#1a2232] border border-[#2a374f] rounded text-sky-400 font-mono text-[10px]">Ctrl+Enter</kbd> or click <span className="text-emerald-400 font-semibold">Run Code</span>
                </p>
              </div>
            </div>
          )}

          {/* Running state */}
          {isRunning && (
            <div className="flex flex-col gap-2 py-2">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-mono">
                <ChevronRight className="w-3 h-3 text-emerald-400" />
                <span className="text-slate-300">./main</span>
                {stdin && <span className="text-slate-500">&lt; [stdin]</span>}
              </div>
              <div className="flex items-center gap-2.5 text-sm text-sky-400 py-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Compiling and running your code...</span>
              </div>
            </div>
          )}

          {/* Results */}
          {!isRunning && result && (
            <div className="space-y-1">
              {/* Command line echo */}
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500 pb-2 mb-1 border-b border-[#1e2638]/50">
                <ChevronRight className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-slate-300">./main</span>
                {stdin && <span className="text-slate-500">&lt; [stdin: {stdin.trim().split('\n').length} line{stdin.trim().split('\n').length !== 1 ? 's' : ''}]</span>}
              </div>

              {/* Stdout – Programiz inline style */}
              {result.stdout && (
                <div className="whitespace-pre-wrap break-words text-slate-100">
                  {displayLines.map((line, i) => {
                    if (line.type === 'prompt-with-input') {
                      return (
                        <div key={i}>
                          <span>{line.prompt}</span>
                          <span className="text-emerald-300 font-semibold"> {line.input}</span>
                        </div>
                      );
                    }
                    return <div key={i}>{line.text || '\u00a0'}</div>;
                  })}
                </div>
              )}

              {/* Stderr */}
              {result.stderr && (
                <div className="mt-3 pt-2 border-t border-[#1e2638]/50">
                  <div className="flex items-center gap-1.5 text-[11px] text-rose-400 font-semibold mb-1.5 uppercase tracking-wide">
                    <AlertCircle className="w-3 h-3" />
                    Error / Stderr
                  </div>
                  <pre className="text-rose-300 text-[12px] whitespace-pre-wrap break-words bg-rose-500/5 border border-rose-500/15 rounded-lg p-3">
                    {result.stderr}
                  </pre>
                </div>
              )}

              {/* No output at all */}
              {!result.stdout && !result.stderr && (
                <div className="text-slate-500 italic text-xs py-2">
                  Program exited with no output.
                </div>
              )}

              <div ref={outputEndRef} />
            </div>
          )}
        </div>

        {/* ── Stdin Input Section (Programiz-style pre-run input) ── */}
        <div className="shrink-0 border-t border-[#1e2638] bg-[#0a0e1a]">
          {/* Section header */}
          <div className="px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-slate-500" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Standard Input (stdin)
              </span>
              {stdin && (
                <span className="text-[10px] font-mono text-slate-500 bg-[#131924] border border-[#232b3a] px-1.5 py-0.5 rounded-full">
                  {stdin.trim().split('\n').length} line{stdin.trim().split('\n').length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {stdin && (
              <button
                onClick={() => onStdinChange('')}
                className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors font-mono"
                title="Clear input"
              >
                clear
              </button>
            )}
          </div>

          {/* Textarea for pre-run stdin */}
          <div className="relative px-3 pb-3">
            <textarea
              ref={stdinRef}
              value={stdin}
              onChange={(e) => onStdinChange(e.target.value)}
              placeholder={'Enter program input here...\nExample: 10 20 (for scanf / cin / Scanner)'}
              rows={3}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              className="w-full bg-[#070a12] border border-[#1e2638] hover:border-[#2a374f] focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/20 rounded-lg px-3 py-2.5 text-xs font-mono text-slate-200 placeholder-slate-600 outline-none resize-none transition-colors leading-relaxed"
              onKeyDown={(e) => {
                // Ctrl+Enter runs the code
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  onRun(stdin);
                }
              }}
            />
            <div className="absolute bottom-6 right-6 flex items-center gap-1.5">
              <span className="text-[9px] font-mono text-slate-600">
                {stdin ? `${stdin.length} chars` : 'Ctrl+Enter to run'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
