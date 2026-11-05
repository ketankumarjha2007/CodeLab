import React from 'react';
import { Terminal, Trash2, Copy, Check, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export default function InputPanel({ stdin, onChange, onClear, isCollapsed, onToggleCollapse }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (stdin) {
      navigator.clipboard.writeText(stdin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const setPreset = (val) => {
    onChange(val);
  };

  return (
    <div className={`flex flex-col bg-[#07090e] border border-white/[0.08] rounded-2xl overflow-hidden transition-all shadow-xl ${isCollapsed ? 'h-10' : 'h-full min-h-[140px]'}`}>
      {/* Panel Header */}
      <div className="h-10 bg-[#0a0e1a]/95 border-b border-white/[0.06] px-3.5 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
          <span className="text-xs font-semibold text-slate-200 tracking-wide">STANDARD INPUT</span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">(stdin)</span>
        </div>

        <div className="flex items-center gap-1.5">
          {!isCollapsed && (
            <div className="hidden sm:flex items-center gap-1 mr-2 text-[11px] text-slate-400">
              <span className="text-[10px] uppercase text-slate-400 mr-1">Presets:</span>
              <button
                onClick={() => setPreset('10 20')}
                className="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-300 font-mono text-[10px] transition-colors"
                title="Input two numbers"
              >
                10 20
              </button>
              <button
                onClick={() => setPreset("Hello CodeLab\nLine 2\nLine 3")}
                className="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-300 font-mono text-[10px] transition-colors"
                title="Multiline input"
              >
                Multiline
              </button>
            </div>
          )}

          {!isCollapsed && stdin && (
            <>
              <button
                onClick={handleCopy}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors"
                title="Copy input to clipboard"
                aria-label="Copy input"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onClear}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/[0.06] rounded-md transition-colors"
                title="Clear input"
                aria-label="Clear input"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors"
            title={isCollapsed ? 'Expand input panel' : 'Collapse input panel'}
            aria-label="Toggle collapse"
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Input textarea */}
      {!isCollapsed && (
        <div className="flex-1 flex flex-col p-3 relative">
          <textarea
            value={stdin}
            onChange={(e) => onChange(e.target.value)}
            placeholder={"Enter program input (stdin) here...\nExample: 10 20 (or multiline values for scanf / cin / input() / Scanner)"}
            className="flex-1 w-full bg-transparent text-slate-200 font-mono text-xs leading-relaxed resize-none focus:outline-none placeholder-slate-400/80 caret-sky-400"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label="Standard input (stdin) for your program"
          />
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-[10px] font-mono text-slate-400">
            <span>{stdin ? `${stdin.length} chars` : 'Empty input'}</span>
            <span>Passed via STDIN stream</span>
          </div>
        </div>
      )}
    </div>
  );
}
