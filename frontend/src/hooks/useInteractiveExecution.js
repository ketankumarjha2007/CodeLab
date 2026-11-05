import { useRef, useState, useCallback } from 'react';

// Derive WebSocket URL from the API base or current host
const WS_BASE = (() => {
  const api = import.meta.env.VITE_API_URL;
  if (api) return api.replace(/\/api$/, '').replace(/^http/, 'ws');
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `ws://${window.location.hostname}:5000`;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
})();

/**
 * useInteractiveExecution
 *
 * Manages a WebSocket connection for real-time streaming code execution.
 * Maintains `output` as a single string — stdout, stderr and echoed stdin
 * are all concatenated in order, so prompts and input appear on the same line:
 *
 *   "Enter a number: "   ← flushed by unbuffered stdout
 *   user types "10" + Enter
 *   hook appends "10\n"  ← inline echo on same line as prompt
 *   program outputs "The number is 10\n"
 *
 *   Final output string: "Enter a number: 10\nThe number is 10\n"
 */
export function useInteractiveExecution() {
  const [output, setOutput]   = useState('');   // entire terminal text
  const [status, setStatus]   = useState('idle'); // idle|compiling|running|done|error
  const [exitInfo, setExitInfo] = useState(null); // { code, status, executionTimeMs }
  const wsRef = useRef(null);

  const isRunning = status === 'compiling' || status === 'running';

  // Append text to the output string
  const append = useCallback((text) => {
    setOutput(prev => prev + text);
  }, []);

  // Close any open WebSocket
  const closeWs = useCallback(() => {
    if (wsRef.current) {
      try { wsRef.current.close(); } catch { /* ignore */ }
      wsRef.current = null;
    }
  }, []);

  /** Start a new execution */
  const run = useCallback((language, code) => {
    closeWs();
    setOutput('');
    setExitInfo(null);
    setStatus('compiling');

    const ws = new WebSocket(`${WS_BASE}/ws/execute`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'run', language, code }));
    };

    ws.onmessage = (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }

      switch (msg.type) {
        case 'status':
          setStatus(msg.data === 'compiling' ? 'compiling' : 'running');
          break;

        case 'stdout':
          setStatus(s => s === 'compiling' ? 'running' : s);
          append(msg.data);
          break;

        case 'stderr':
          // Prefix stderr distinctively so the terminal can colour it
          append('\x1b[stderr]' + msg.data);
          break;

        case 'exit':
          setStatus('done');
          setExitInfo({
            code: msg.code,
            status: msg.status || (msg.code === 0 ? 'Accepted' : 'Runtime Error'),
            executionTimeMs: msg.executionTimeMs ?? 0
          });
          wsRef.current = null;
          break;

        case 'error':
          append('\x1b[stderr]' + msg.data);
          setStatus('error');
          setExitInfo({ code: 1, status: 'Internal Error', executionTimeMs: 0 });
          break;

        default: break;
      }
    };

    ws.onerror = () => {
      append('\x1b[stderr]\n[Connection error — is the backend running on port 5000?]\n');
      setStatus('error');
      setExitInfo({ code: 1, status: 'Internal Error', executionTimeMs: 0 });
    };

    ws.onclose = () => {
      if (wsRef.current === ws) wsRef.current = null;
    };
  }, [closeWs, append]);

  /**
   * Send a line of stdin to the running process.
   * Also echoes it into the output string — appended directly after whatever
   * the last stdout text was (which may be a prompt without a trailing newline),
   * so the terminal displays:  "Enter a number: 10\n"
   */
  const sendInput = useCallback((text) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stdin', data: text }));
      // Inline echo: append typed text + newline directly to output
      append(text + '\n');
    }
  }, [append]);

  /** Kill the running process */
  const kill = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'kill' }));
    }
    closeWs();
    setStatus('done');
    setExitInfo(prev => prev ?? { code: -1, status: 'Killed', executionTimeMs: 0 });
  }, [closeWs]);

  /** Clear terminal */
  const clear = useCallback(() => {
    closeWs();
    setOutput('');
    setExitInfo(null);
    setStatus('idle');
  }, [closeWs]);

  return { output, status, exitInfo, isRunning, run, sendInput, kill, clear };
}
