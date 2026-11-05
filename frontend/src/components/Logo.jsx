import React from 'react';

export default function Logo() {
  return (
    <div className="flex items-center gap-2 select-none cursor-pointer group shrink-0">
      {/* Icon Mark */}
      <div className="relative">
        {/* Glow halo */}
        <div className="absolute -inset-1 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-xl blur-[8px] opacity-40 group-hover:opacity-70 transition-opacity duration-300" />
        {/* Icon container */}
        <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-[#0f1e3a] to-[#050a18] border border-sky-500/30 flex items-center justify-center shadow-lg">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* < bracket */}
            <path d="M7 5L2 10L7 15" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {/* > bracket */}
            <path d="M13 5L18 10L13 15" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {/* / slash */}
            <path d="M11.5 3.5L8.5 16.5" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
          </svg>
        </div>
      </div>

      {/* Wordmark */}
      <div className="flex items-baseline gap-0.5">
        <span className="text-[15px] font-extrabold tracking-tight text-slate-800 dark:text-white leading-none">
          Code
        </span>
        <span className="text-[15px] font-extrabold tracking-tight leading-none bg-gradient-to-r from-sky-500 to-teal-500 dark:from-sky-400 dark:to-teal-400 bg-clip-text text-transparent">
          Lab
        </span>
        <span className="text-[9px] font-bold font-mono tracking-widest text-sky-600 dark:text-sky-500/80 ml-1 pb-0.5 uppercase">
          IDE
        </span>
      </div>
    </div>
  );
}
