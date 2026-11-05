import React from 'react';
import { Sliders, X, RotateCcw, Type, Indent, WrapText, Map, HardDrive } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  settings,
  onUpdateSettings,
  onResetSettings,
  onClose
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#0a0e1a] border border-slate-200 dark:border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 transition-colors"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between bg-slate-50 dark:bg-black/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Editor Preferences</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Customized locally in your browser storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] rounded-lg transition-colors"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings rows */}
        <div className="p-6 space-y-4">
          {/* Font Size */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Type className="w-4 h-4 text-sky-400" />
              <label className="text-xs font-medium text-slate-200">Editor Font Size</label>
            </div>
            <select
              value={settings.fontSize}
              onChange={(e) => onUpdateSettings({ fontSize: Number(e.target.value) })}
              className="bg-black/40 border border-white/10 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500"
            >
              {[12, 13, 14, 15, 16, 18, 20].map((size) => (
                <option key={size} value={size} className="bg-slate-900">{size} px</option>
              ))}
            </select>
          </div>

          {/* Tab Size */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Indent className="w-4 h-4 text-indigo-400" />
              <label className="text-xs font-medium text-slate-200">Tab Width</label>
            </div>
            <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-lg p-0.5">
              {[2, 4].map((size) => (
                <button
                  key={size}
                  onClick={() => onUpdateSettings({ tabSize: size })}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    settings.tabSize === size
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {size} spaces
                </button>
              ))}
            </div>
          </div>

          {/* Word Wrap */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <WrapText className="w-4 h-4 text-teal-400" />
              <label className="text-xs font-medium text-slate-200">Word Wrapping</label>
            </div>
            <button
              onClick={() => onUpdateSettings({ wordWrap: settings.wordWrap === 'on' ? 'off' : 'on' })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                settings.wordWrap === 'on'
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-black/30 text-slate-400 border-white/10'
              }`}
            >
              {settings.wordWrap === 'on' ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Minimap */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Map className="w-4 h-4 text-amber-400" />
              <label className="text-xs font-medium text-slate-200">Code Minimap</label>
            </div>
            <button
              onClick={() => onUpdateSettings({ minimap: !settings.minimap })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                settings.minimap
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-black/30 text-slate-400 border-white/10'
              }`}
            >
              {settings.minimap ? 'Shown' : 'Hidden'}
            </button>
          </div>

          {/* Auto Save Locally */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            <div className="flex items-start gap-2.5">
              <HardDrive className="w-4 h-4 text-emerald-400 mt-0.5" />
              <div>
                <label className="text-xs font-medium text-slate-200 block">Auto-save drafts locally</label>
                <span className="text-[10px] text-slate-400">Stores code drafts in localStorage</span>
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ autoSave: !settings.autoSave })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                settings.autoSave
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-black/30 text-slate-400 border-white/10'
              }`}
            >
              {settings.autoSave ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-black/40 border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
          <button
            onClick={onResetSettings}
            className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-200/80 dark:bg-white/[0.08] hover:bg-slate-300 dark:hover:bg-white/[0.14] rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
