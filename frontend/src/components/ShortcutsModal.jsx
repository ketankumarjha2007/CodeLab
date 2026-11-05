import React from 'react';
import { Keyboard, X, Play, Download, Terminal, Search, AlignLeft, ShieldCheck } from 'lucide-react';

export default function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      group: 'Execution & Workflow',
      items: [
        { key: 'Ctrl + Enter', desc: 'Execute program in isolated sandbox', icon: <Play className="w-3.5 h-3.5 text-emerald-400" /> },
        { key: 'Ctrl + S', desc: 'Download current source file', icon: <Download className="w-3.5 h-3.5 text-sky-400" /> },
        { key: 'Ctrl + Shift + S', desc: 'Alternative source download', icon: <Download className="w-3.5 h-3.5 text-sky-400" /> },
        { key: 'Escape', desc: 'Dismiss open dialogs or exit full-screen', icon: <X className="w-3.5 h-3.5 text-slate-400" /> }
      ]
    },
    {
      group: 'Code Editor (Monaco)',
      items: [
        { key: 'Ctrl + /', desc: 'Toggle line comments', icon: <Terminal className="w-3.5 h-3.5 text-indigo-400" /> },
        { key: 'Ctrl + F', desc: 'Find and replace within code', icon: <Search className="w-3.5 h-3.5 text-amber-400" /> },
        { key: 'Alt + Shift + F', desc: 'Auto-format source document', icon: <AlignLeft className="w-3.5 h-3.5 text-cyan-400" /> }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#0a0e1a] border border-slate-200 dark:border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 transition-colors"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between bg-slate-50 dark:bg-black/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Command & Keyboard Shortcuts</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Boost your development efficiency in CodeLab</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] rounded-lg transition-colors"
            aria-label="Close shortcuts modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {shortcutGroups.map((section) => (
            <div key={section.group}>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                {section.group}
              </h4>
              <div className="space-y-1.5">
                {section.items.map((sc) => (
                  <div key={sc.key} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center gap-2.5 text-xs text-slate-200">
                      {sc.icon}
                      <span>{sc.desc}</span>
                    </div>
                    <kbd className="px-2 py-1 text-[11px] font-mono font-medium text-slate-200 bg-black/50 border border-white/10 rounded-lg shadow-sm">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-black/40 border-t border-white/[0.08] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-200 bg-white/[0.08] hover:bg-white/[0.14] rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
