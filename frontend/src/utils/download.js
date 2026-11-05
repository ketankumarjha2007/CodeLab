import { LANGUAGE_CONFIGS } from './templates.js';

/**
 * Download source code directly using Blob & Object URL without any server roundtrip
 */
export function downloadSourceCode(language, code) {
  const config = LANGUAGE_CONFIGS[language] || { filename: 'code.txt' };
  const filename = config.filename;

  const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();

  // Clean up element and revoke URL to prevent memory leaks
  document.body.removeChild(anchor);
  setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 100);

  return filename;
}
