import React, {
  useRef, useState, useEffect, useLayoutEffect, useCallback
} from 'react';
import {
  Terminal, Copy, Check, Trash2, Loader2, Square, ChevronRight
} from 'lucide-react';

/* ─── Status badge config ───────────────────────────────────────────────────── */
const STATUS_CFG = {
  'Accepted':              { dot: 'bg-emerald-400', text: 'text-emerald-400', border: 'border-emerald-500/25', bg: 'bg-emerald-500/10' },
  'Compilation Error':     { dot: 'bg-amber-400',   text: 'text-amber-400',   border: 'border-amber-500/25',   bg: 'bg-amber-500/10'   },
  'Runtime Error':         { dot: 'bg-rose-400',     text: 'text-rose-400',    border: 'border-rose-500/25',    bg: 'bg-rose-500/10'    },
  'Time Limit Exceeded':   { dot: 'bg-orange-400',   text: 'text-orange-400',  border: 'border-orange-500/25',  bg: 'bg-orange-500/10'  },
  'Output Limit Exceeded': { dot: 'bg-orange-400',   text: 'text-orange-400',  border: 'border-orange-500/25',  bg: 'bg-orange-500/10'  },
  'Internal Error':        { dot: 'bg-rose-400',     text: 'text-rose-400',    border: 'border-rose-500/25',    bg: 'bg-rose-500/10'    },
  'Killed':                { dot: 'bg-slate-400',    text: 'text-slate-400',   border: 'border-slate-500/25',   bg: 'bg-slate-500/10'   }
};

/**
 * Split a raw output string (which may contain \x1b[stderr] markers) into
 * an array of { type: 'stdout'|'stderr', text: string } segments for rendering.
 * We use \x1b[stderr] as an internal marker (not a real ANSI escape).
 */
function parseSegments(raw) {
  if (!raw) return [];
  const parts = raw.split('\x1b[stderr]');
  const result = [];
  // First part is always stdout
  if (parts[0]) result.push({ type: 'stdout', text: parts[0] });
  // Remaining parts alternate: each preceded by a stderr marker
  for (let i = 1; i < parts.length; i++) {
    if (parts[i]) result.push({ type: 'stderr', text: parts[i] });
  }
  return result;
}

/* ─── Component ─────────────────────────────────────────────────────────────── */
export default function InteractiveTerminal({
  output,       // string — entire terminal output (stdout + echoed stdin + stderr)
  status,       // 'idle'|'compiling'|'running'|'done'|'error'
  exitInfo,     // { code, status, executionTimeMs }
  isRunning,
  onSendInput,
  onKill,
  onClear
}) {
  const [inputValue, setInputValue] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef  = useRef(null);
  const bottomRef = useRef(null);

  // Auto-scroll to bottom
  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [output, inputValue]);

  // Auto-focus input field when program starts running
  useEffect(() => {
    if (status === 'running') inputRef.current?.focus();
  }, [status]);

  // Click anywhere on terminal body → focus input
  const handleBodyClick = useCallback(() => {
    if (isRunning) inputRef.current?.focus();
  }, [isRunning]);

  // Enter key sends input line to process
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSendInput(inputValue);
      setInputValue('');
    }
  }, [inputValue, onSendInput]);

  const handleCopy = useCallback(async () => {
    if (!output.trim()) return;
    // Strip internal stderr markers for clipboard
    const clean = output.replace(/\x1b\[stderr\]/g, '');
    await navigator.clipboard.writeText(clean);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [output]);

  const statusCfg = exitInfo ? (STATUS_CFG[exitInfo.status] || STATUS_CFG['Internal Error']) : null;
  const segments  = parseSegments(output);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#070a12] border border-slate-200 dark:border-[#1e2638] rounded-xl overflow-hidden shadow-sm dark:shadow-2xl transition-colors">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="h-10 shrink-0 bg-slate-50 dark:bg-[#0d1120] border-b border-slate-200 dark:border-[#1e2638] px-4 flex items-center justify-between select-none transition-colors">
        {/* Left: dots + title + status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57] shadow-[0_0_6px_rgba(255,95,87,0.5)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e] shadow-[0_0_6px_rgba(254,188,46,0.5)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840] shadow-[0_0_6px_rgba(40,200,64,0.5)]" />
          </div>
          <div className="h-4 w-px bg-slate-200 dark:bg-[#1e2638]" />
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Output</span>
          </div>

          {/* Status pills */}
          {status === 'compiling' && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono border bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/25 text-sky-600 dark:text-sky-400">
              <Loader2 className="w-3 h-3 animate-spin" /> Compiling...
            </span>
          )}
          {status === 'running' && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono border bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/25 text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Running
            </span>
          )}
          {(status === 'done' || status === 'error') && statusCfg && (
            <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono border ${statusCfg.bg} ${statusCfg.border} ${statusCfg.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {exitInfo.status}
              {exitInfo.executionTimeMs > 0 && (
                <span className="font-normal text-slate-500 dark:text-slate-400 pl-1 border-l border-slate-300 dark:border-white/10">
                  {exitInfo.executionTimeMs}ms
                </span>
              )}
            </span>
          )}
        </div>

        {/* Right: Stop / Copy / Clear */}
        <div className="flex items-center gap-1">
          {isRunning && (
            <button
              onClick={onKill}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-rose-500 dark:text-rose-400 hover:text-white hover:bg-rose-500 rounded-lg transition-colors border border-rose-200 dark:border-rose-500/20"
              title="Stop"
            >
              <Square className="w-3 h-3 fill-current" /> Stop
            </button>
          )}
          <button
            onClick={handleCopy}
            disabled={!output}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors disabled:opacity-30"
            title="Copy output"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClear}
            disabled={!output && status === 'idle'}
            className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors disabled:opacity-30"
            title="Clear"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Terminal Body ───────────────────────────────────────────────────── */}
      <div
        onClick={handleBodyClick}
        className="flex-1 overflow-y-auto px-4 py-3 font-mono text-[13px] leading-relaxed cursor-text bg-slate-50/50 dark:bg-transparent"
      >
        {/* Idle placeholder */}
        {status === 'idle' && !output && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center select-none pointer-events-none">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#0e1422] border border-slate-200 dark:border-[#1e2638] flex items-center justify-center shadow-sm dark:shadow-none">
              <Terminal className="w-5 h-5 text-slate-400 dark:text-slate-600" />
            </div>
            <div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium font-sans">Ready to execute</p>
              <p className="text-slate-400 dark:text-slate-600 text-xs mt-1 font-sans">
                Press{' '}
                <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-[#1a2232] border border-slate-200 dark:border-[#2a374f] rounded text-sky-600 dark:text-sky-400 font-mono text-[10px]">Ctrl+Enter</kbd>
                {' '}or click <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Run</span>
              </p>
            </div>
          </div>
        )}

        {/* Compiling or Starting up (no output yet) */}
        {!output && isRunning && (
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 py-2">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span className="text-sm font-sans">
              {status === 'compiling' ? 'Compiling code...' : 'Running program...'}
            </span>
          </div>
        )}

        {/* Output area: rendered as inline spans so stdout + echoed input appear on same line */}
        {output && (
          <div>
            {/* Command label */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 pb-2 mb-1 border-b border-slate-200 dark:border-[#1e2638]/40 select-none">
              <ChevronRight className="w-3 h-3 text-emerald-500 shrink-0" />
              <span className="text-slate-600 dark:text-slate-400">./program</span>
            </div>

            <div className="whitespace-pre-wrap break-words">
              {segments.map((seg, i) =>
                seg.type === 'stderr'
                  ? <span key={i} className="text-rose-500 dark:text-rose-400 font-medium">{seg.text}</span>
                  : <span key={i} className="text-slate-800 dark:text-slate-100">{seg.text}</span>
              )}

              {/* Inline input cursor — appears ONLY when running and waiting for input */}
              {isRunning && (
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-transparent border-none outline-none font-mono text-[13px] text-emerald-600 dark:text-emerald-400 font-semibold caret-emerald-500 dark:caret-emerald-400 p-0 m-0 leading-relaxed min-w-[2ch] align-baseline inline"
                  style={{ width: `${Math.max(inputValue.length + 1, 2)}ch` }}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  autoComplete="off"
                  autoFocus
                />
              )}
            </div>
          </div>
        )}

        {/* Exit footer */}
        {(status === 'done' || status === 'error') && exitInfo && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-200 dark:border-[#1e2638]/40 text-[11px] text-slate-500 select-none font-sans">
            <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-600 shrink-0" />
            <span>Process exited —</span>
            <span className={statusCfg?.text || 'text-slate-600 dark:text-slate-400'}>{exitInfo.status}</span>
            {exitInfo.executionTimeMs > 0 && <span>· {exitInfo.executionTimeMs}ms</span>}
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
