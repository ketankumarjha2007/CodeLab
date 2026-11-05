import React, {
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';

import Navbar from '../components/Navbar.jsx';
import CodeEditor from '../components/CodeEditor.jsx';
import InteractiveTerminal from '../components/InteractiveTerminal.jsx';
import ResizableSplit from '../components/ResizableSplit.jsx';
import Toast from '../components/Toast.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import ShortcutsModal from '../components/ShortcutsModal.jsx';
import SettingsModal from '../components/SettingsModal.jsx';

import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts.js';
import { useInteractiveExecution } from '../hooks/useInteractiveExecution.js';
import { downloadSourceCode } from '../utils/download.js';
import { STARTER_TEMPLATES, LANGUAGE_CONFIGS } from '../utils/templates.js';
import { Code2, Terminal } from 'lucide-react';

const DEFAULT_SETTINGS = {
  fontSize: 14,
  tabSize: 4,
  wordWrap: 'on',
  minimap: false,
  autoSave: true
};

// Compiler version badge data (shown in navbar, fetched from backend health API)
const API_BASE = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `http://${window.location.hostname}:5000/api`
    : '/api'
);

function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const show = useCallback((message, type = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type });
    timerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const close = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  return { toast, show, close };
}

export default function MainPage() {
  const [language, setLanguage] = useLocalStorage('codelab-language', 'cpp');
  const [codeDrafts, setCodeDrafts] = useLocalStorage('codelab-drafts', {});
  const [settings, setSettings] = useLocalStorage('codelab-settings', DEFAULT_SETTINGS);
  const [theme, setTheme] = useLocalStorage('codelab-theme', 'dark');
  const [isDirty, setIsDirty] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(true);
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  const [splitKey, setSplitKey] = useState(0);
  const [mobileTab, setMobileTab] = useState('editor');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [pendingLanguageSwitch, setPendingLanguageSwitch] = useState(null);
  const [compilerVersions, setCompilerVersions] = useState({});

  const { toast, show: showToast, close: closeToast } = useToast();

  // ── Interactive execution via WebSocket ──────────────────────
  const {
    output,
    status: execStatus,
    exitInfo,
    isRunning,
    run,
    sendInput,
    kill,
    clear: clearTerminal
  } = useInteractiveExecution();

  const code = codeDrafts[language] ?? STARTER_TEMPLATES[language] ?? '';

  // Load compiler versions
  useEffect(() => {
    fetch(`${API_BASE}/languages`)
      .then(r => r.json())
      .then(data => {
        const v = {};
        data.languages?.forEach(l => { v[l.id] = l.version; });
        setCompilerVersions(v);
      })
      .catch(() => {});
  }, []);

  // Auto-save draft
  const saveTimerRef = useRef(null);
  const handleCodeChange = useCallback((newCode) => {
    setCodeDrafts(prev => ({ ...prev, [language]: newCode }));
    setIsDirty(true);
    setIsDraftSaved(false);
    if (settings.autoSave) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        setIsDraftSaved(true);
        setIsDirty(false);
      }, 500);
    }
  }, [language, setCodeDrafts, settings.autoSave]);

  // Language switching
  const handleSelectLanguage = useCallback((newLang) => {
    if (newLang === language) return;
    const hasUserCode = codeDrafts[language] &&
      codeDrafts[language] !== STARTER_TEMPLATES[language] &&
      codeDrafts[language].trim().length > 0;
    if (hasUserCode) {
      setPendingLanguageSwitch(newLang);
    } else {
      setLanguage(newLang);
      clearTerminal();
      setIsDirty(false);
      setIsDraftSaved(true);
    }
  }, [language, codeDrafts, setLanguage, clearTerminal]);

  const confirmLanguageSwitch = useCallback(() => {
    if (pendingLanguageSwitch) {
      setLanguage(pendingLanguageSwitch);
      clearTerminal();
      setIsDirty(false);
      setIsDraftSaved(true);
    }
    setPendingLanguageSwitch(null);
  }, [pendingLanguageSwitch, setLanguage, clearTerminal]);

  // Reset
  const handleReset = useCallback(() => {
    const template = STARTER_TEMPLATES[language];
    setCodeDrafts(prev => ({ ...prev, [language]: template }));
    setIsDirty(false);
    setIsDraftSaved(true);
    showToast('Code reset to template.', 'info');
  }, [language, setCodeDrafts, showToast]);

  // Run code — sends to WebSocket backend
  const handleRun = useCallback(() => {
    if (isRunning) return;
    if (!code.trim()) {
      showToast('The editor is empty. Write some code first.', 'warning');
      return;
    }
    setMobileTab('terminal');
    run(language, code);
  }, [isRunning, code, language, run, showToast]);

  // Toast on exit
  useEffect(() => {
    if (exitInfo) {
      if (exitInfo.status === 'Accepted') {
        showToast(`Finished in ${exitInfo.executionTimeMs}ms`, 'success');
      } else if (exitInfo.status !== 'Killed') {
        showToast(exitInfo.status, 'error');
      }
    }
  }, [exitInfo, showToast]);

  // Download / Copy
  const handleDownload = useCallback(() => {
    const filename = downloadSourceCode(language, code);
    showToast(`Downloaded ${filename}`, 'success');
  }, [language, code, showToast]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      showToast('Code copied to clipboard.', 'success');
    } catch {
      showToast('Failed to copy.', 'error');
    }
  }, [code, showToast]);

  // Layout
  const handleResetLayout = useCallback(() => {
    setSplitKey(prev => prev + 1);
    showToast('Layout reset.', 'info');
  }, [showToast]);

  const handleUpdateSettings = useCallback((updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, [setSettings]);

  const handleResetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    showToast('Settings reset to defaults.', 'info');
  }, [setSettings, showToast]);

  // Theme
  const handleToggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      document.documentElement.classList.toggle('light', next === 'light');
      return next;
    });
  }, [setTheme]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  // Escape key
  const handleEscape = useCallback(() => {
    if (showShortcuts) { setShowShortcuts(false); return; }
    if (showSettings) { setShowSettings(false); return; }
    if (pendingLanguageSwitch) { setPendingLanguageSwitch(null); return; }
    if (isEditorFullscreen) { setIsEditorFullscreen(false); return; }
  }, [showShortcuts, showSettings, pendingLanguageSwitch, isEditorFullscreen]);

  useKeyboardShortcuts({
    onRun: handleRun,
    onDownload: handleDownload,
    onEscape: handleEscape
  });

  // ── Terminal props (shared between mobile/desktop) ───────────
  const terminalProps = {
    output,
    status: execStatus,
    exitInfo,
    isRunning,
    onSendInput: sendInput,
    onKill: kill,
    onClear: clearTerminal
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${theme === 'light' ? 'bg-[#f6f8fa] text-slate-900' : 'bg-[#07090f] text-slate-100'}`}>

      {/* Top Bar */}
      <Navbar
        language={language}
        onSelectLanguage={handleSelectLanguage}
        compilerVersions={compilerVersions}
        onRun={handleRun}
        isRunning={isRunning}
        onDownload={handleDownload}
        onReset={handleReset}
        onCopy={handleCopy}
        isDraftSaved={isDraftSaved}
        isDirty={isDirty}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenShortcuts={() => setShowShortcuts(true)}
        onOpenSettings={() => setShowSettings(true)}
        onResetLayout={handleResetLayout}
      />

      {/* Mobile Tab Switcher */}
      <div className="flex md:hidden items-center justify-around bg-[#0d1120] border-b border-[#1e2638] shrink-0 z-20">
        <button
          onClick={() => setMobileTab('editor')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            mobileTab === 'editor'
              ? 'text-white border-sky-400'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          Editor
        </button>
        <button
          onClick={() => setMobileTab('terminal')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            mobileTab === 'terminal'
              ? 'text-white border-sky-400'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Output
          {output.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />}
        </button>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 overflow-hidden p-2 gap-2">

        {/* Desktop Split */}
        <div className="hidden md:flex h-full gap-0">
          <ResizableSplit
            key={`split-${splitKey}`}
            direction="horizontal"
            initialSizes={[60, 40]}
            minSizes={[25, 22]}
          >
            <div className="h-full pr-1">
              <CodeEditor
                language={language}
                code={code}
                onChange={handleCodeChange}
                settings={settings}
                theme={theme}
                isFullscreen={isEditorFullscreen}
                onToggleFullscreen={() => setIsEditorFullscreen(v => !v)}
              />
            </div>
            <div className="h-full pl-1">
              <InteractiveTerminal {...terminalProps} />
            </div>
          </ResizableSplit>
        </div>

        {/* Mobile */}
        <div className="flex md:hidden flex-col h-full overflow-hidden">
          {mobileTab === 'editor' ? (
            <div className="h-full">
              <CodeEditor
                language={language}
                code={code}
                onChange={handleCodeChange}
                settings={settings}
                theme={theme}
                isFullscreen={isEditorFullscreen}
                onToggleFullscreen={() => setIsEditorFullscreen(v => !v)}
              />
            </div>
          ) : (
            <div className="h-full">
              <InteractiveTerminal {...terminalProps} />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <SettingsModal
        isOpen={showSettings}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetSettings={handleResetSettings}
        onClose={() => setShowSettings(false)}
      />
      <ConfirmModal
        isOpen={!!pendingLanguageSwitch}
        title="Switch Language?"
        message={`You have written code in ${LANGUAGE_CONFIGS[language]?.name}. Switching to ${LANGUAGE_CONFIGS[pendingLanguageSwitch]?.name} will preserve your code as a draft. Proceed?`}
        confirmText="Switch Language"
        cancelText="Cancel"
        danger={false}
        onConfirm={confirmLanguageSwitch}
        onCancel={() => setPendingLanguageSwitch(null)}
      />
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
