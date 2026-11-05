import { useEffect } from 'react';

export function useKeyboardShortcuts({
  onRun,
  onDownload,
  onEscape
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      const isCtrlOrMeta = event.ctrlKey || event.metaKey;

      // Ctrl + Enter -> Run Code
      if (isCtrlOrMeta && event.key === 'Enter') {
        event.preventDefault();
        onRun?.();
        return;
      }

      // Ctrl + S or Ctrl + Shift + S -> Download source code
      if (isCtrlOrMeta && (event.key === 's' || event.key === 'S')) {
        event.preventDefault(); // Stop native browser "Save HTML Page" dialog
        onDownload?.();
        return;
      }

      // Escape key -> Close modals / popovers
      if (event.key === 'Escape') {
        onEscape?.();
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRun, onDownload, onEscape]);
}
