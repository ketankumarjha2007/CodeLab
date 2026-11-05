import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-400 shrink-0" />
  };

  const borderColors = {
    success: 'border-emerald-500/30 bg-emerald-950/80',
    warning: 'border-amber-500/30 bg-amber-950/80',
    error: 'border-rose-500/30 bg-rose-950/80',
    info: 'border-sky-500/30 bg-sky-950/80'
  };

  return (
    <div className="fixed top-14 right-6 z-50 max-w-sm animate-in fade-in slide-in-from-top-4 duration-200">
      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border backdrop-blur-md shadow-2xl text-slate-100 ${borderColors[toast.type] || borderColors.info}`}>
        {icons[toast.type] || icons.info}
        <p className="text-sm font-medium flex-1 pr-2">{toast.message}</p>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-1"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
