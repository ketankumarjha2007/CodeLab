import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import http from 'http';
import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import crypto from 'crypto';

import { CONSTANTS } from './config/constants.js';
import { SUPPORTED_LANGUAGES } from './config/languages.js';
import executeRoutes from './routes/executeRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

// ─── Extra PATH for compilers on Windows ──────────────────────────────────────
const extraPaths = [
  'C:\\Program Files\\Microsoft\\jdk-21.0.13.21-hotspot\\bin',
  'C:\\MinGW\\bin'
];
const augmentedPath = [...extraPaths, ...(process.env.PATH || '').split(path.delimiter)]
  .filter(Boolean).join(path.delimiter);

// ─── Unbuffer prelude source code ─────────────────────────────────────────────
// Injected at compile time for C/C++ to force _IONBF (unbuffered) stdout/stderr
// This runs BEFORE main() via GCC's __attribute__((constructor))
// so printf("prompt: ") flushes immediately to the pipe without needing fflush()
const C_PRELUDE = `
#include <stdio.h>
#ifdef __GNUC__
__attribute__((constructor))
static void _cl_unbuf(void){
  setvbuf(stdout,(char*)0,_IONBF,0);
  setvbuf(stderr,(char*)0,_IONBF,0);
}
#endif
`;

const CPP_PRELUDE = `
#include <cstdio>
#include <iostream>
#ifdef __GNUC__
__attribute__((constructor))
static void _cl_unbuf(){
  setvbuf(stdout,(char*)0,_IONBF,0);
  setvbuf(stderr,(char*)0,_IONBF,0);
  std::cout.setf(std::ios::unitbuf);
  std::cerr.setf(std::ios::unitbuf);
}
#endif
`;

// ─── Helper: compile with optional prelude injection ──────────────────────────
async function compileWithPrelude(langConfig, language, tempDir, compileArgs, env) {
  let [cmd, ...args] = compileArgs;

  // Inject unbuffer prelude for C and C++
  if (language === 'c' || language === 'cpp') {
    const prelExt   = language === 'c' ? 'c' : 'cpp';
    const prelName  = `_codelab_prelude.${prelExt}`;
    const prelSrc   = language === 'c' ? C_PRELUDE : CPP_PRELUDE;
    await fs.writeFile(path.join(tempDir, prelName), prelSrc, 'utf-8');

    // Insert prelude file right after the main source file in args
    // e.g. gcc -O2 -std=c17 main.c _codelab_prelude.c -o main -lm
    const srcIdx = args.findIndex(a => a === langConfig.filename);
    if (srcIdx >= 0) {
      args = [...args.slice(0, srcIdx + 1), prelName, ...args.slice(srcIdx + 1)];
    }
  }

  const doCompile = (currentArgs) => new Promise((resolve) => {
    const cp = spawn(cmd, currentArgs, {
      cwd: tempDir, windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PATH: augmentedPath }
    });
    let cout = '', cerr = '';
    cp.stdout.on('data', d => cout += d.toString());
    cp.stderr.on('data', d => cerr += d.toString());
    cp.on('close', code => resolve({ code, cout, cerr }));
    cp.on('error', err => resolve({ code: 1, cout: '', cerr: err.message }));
  });

  let res = await doCompile(args);

  // Fallback for older MinGW GCC 6.x that doesn't know -std=c17/-std=c++17
  if (res.code !== 0 && res.cerr.includes('unrecognized command line option')) {
    const fallbackArgs = args.map(a =>
      a === '-std=c17'  ? '-std=c11'  :
      a === '-std=c++17'? '-std=c++14': a
    );
    res = await doCompile(fallbackArgs);
  }

  return res;
}

// ─── Express app ──────────────────────────────────────────────────────────────
const app = express();
app.use(helmet());
app.use(cors({
  origin: CONSTANTS.CLIENT_ORIGIN,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use('/api', healthRoutes);
app.use('/api', executeRoutes);
app.get('/', (req, res) => res.json({ name: 'CodeLab Compiler API', status: 'running' }));
app.use(errorHandler);

// ─── HTTP Server ──────────────────────────────────────────────────────────────
const httpServer = http.createServer(app);

// ─── WebSocket Server — Interactive Execution ─────────────────────────────────
const wss = new WebSocketServer({ server: httpServer, path: '/ws/execute' });

wss.on('connection', (ws) => {
  let proc      = null;
  let tempDir   = null;
  let killTimer = null;
  let resetIdleTimer = null;
  let totalOut  = 0;
  const MAX_OUT = 256 * 1024;

  const send = (obj) => {
    try { if (ws.readyState === 1) ws.send(JSON.stringify(obj)); }
    catch { /* ignore */ }
  };

  const cleanup = async () => {
    if (killTimer) clearTimeout(killTimer);
    if (proc) { try { proc.kill('SIGKILL'); } catch { /* ignore */ } proc = null; }
    if (tempDir) { try { await fs.rm(tempDir, { recursive: true, force: true }); } catch { /* ignore */ } tempDir = null; }
  };

  ws.on('message', async (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    // ── RUN ───────────────────────────────────────────────────────────────────
    if (msg.type === 'run') {
      await cleanup();
      totalOut = 0;

      const { language, code } = msg;
      const langConfig = SUPPORTED_LANGUAGES[language];
      if (!langConfig) {
        send({ type: 'stderr', data: `Unsupported language: ${language}` });
        send({ type: 'exit', code: 1, status: 'Internal Error', executionTimeMs: 0 });
        return;
      }

      const runId = crypto.randomUUID();
      tempDir = path.join(os.tmpdir(), `codelab-ws-${runId}`);

      try {
        await fs.mkdir(tempDir, { recursive: true });
        await fs.writeFile(path.join(tempDir, langConfig.filename), code, 'utf-8');

        const isWin = os.platform() === 'win32';

        // ── Compile ──────────────────────────────────────────────────────────
        if (langConfig.compileCmd) {
          send({ type: 'status', data: 'compiling' });

          const res = await compileWithPrelude(
            langConfig, language, tempDir, langConfig.compileCmd,
            { ...process.env, PATH: augmentedPath }
          );

          if (res.code !== 0) {
            send({ type: 'stderr', data: res.cerr || res.cout || 'Compilation failed.' });
            send({ type: 'exit', code: res.code, status: 'Compilation Error', executionTimeMs: 0 });
            await cleanup();
            return;
          }
        }

        // ── Spawn ─────────────────────────────────────────────────────────────
        send({ type: 'status', data: 'running' });

        let [execCmd, ...execArgs] = (isWin && langConfig.windowsRunCmd)
          ? langConfig.windowsRunCmd
          : langConfig.runCmd;

        // Windows: resolve .exe path
        if (isWin && (execCmd === './main' || execCmd === 'main.exe')) {
          execCmd = path.join(tempDir, 'main.exe');
        }

        proc = spawn(execCmd, execArgs, {
          cwd: tempDir, windowsHide: true,
          stdio: ['pipe', 'pipe', 'pipe'],
          env: {
            ...process.env,
            PATH: augmentedPath,
            PYTHONIOENCODING: 'utf-8',
            LC_ALL: 'en_US.UTF-8'
          }
        });

        const startTime = Date.now();
        const IDLE_TIMEOUT_MS = 60000; // 60s idle timeout per input step

        resetIdleTimer = () => {
          if (killTimer) clearTimeout(killTimer);
          killTimer = setTimeout(() => {
            send({ type: 'stderr', data: '\n[Session Timed Out due to inactivity — 60s idle]' });
            send({ type: 'exit', code: -1, status: 'Time Limit Exceeded', executionTimeMs: Date.now() - startTime });
            cleanup();
          }, IDLE_TIMEOUT_MS);
        };

        // Start initial idle timer
        resetIdleTimer();

        proc.stdout.on('data', (chunk) => {
          resetIdleTimer(); // User program produced output, keep alive
          const text = chunk.toString('utf8');
          totalOut += text.length;
          if (totalOut > MAX_OUT) {
            send({ type: 'stderr', data: '\n[Output Limit Exceeded]' });
            send({ type: 'exit', code: -1, status: 'Output Limit Exceeded', executionTimeMs: Date.now() - startTime });
            cleanup(); return;
          }
          send({ type: 'stdout', data: text });
        });

        proc.stderr.on('data', (chunk) => {
          resetIdleTimer();
          const text = chunk.toString('utf8');
          totalOut += text.length;
          send({ type: 'stderr', data: text });
        });

        proc.on('error', (err) => {
          clearTimeout(killTimer);
          send({ type: 'stderr', data: `Failed to start process: ${err.message}` });
          send({ type: 'exit', code: 1, status: 'Internal Error', executionTimeMs: 0 });
          cleanup();
        });

        proc.on('close', (code) => {
          clearTimeout(killTimer);
          const ms = Date.now() - startTime;
          send({ type: 'exit', code, status: code === 0 ? 'Accepted' : 'Runtime Error', executionTimeMs: ms });
          proc = null;
          cleanup();
        });

      } catch (err) {
        send({ type: 'stderr', data: `Server error: ${err.message}` });
        send({ type: 'exit', code: 1, status: 'Internal Error', executionTimeMs: 0 });
        await cleanup();
      }
    }

    // ── STDIN (user typed a line) ─────────────────────────────────────────────
    if (msg.type === 'stdin') {
      if (proc && proc.stdin && !proc.stdin.destroyed) {
        resetIdleTimer?.(); // User gave input, refresh timer so menu-driven programs can run indefinitely!
        try { proc.stdin.write((msg.data || '') + '\n', 'utf8'); }
        catch { /* broken pipe, ignore */ }
      }
    }

    // ── KILL ─────────────────────────────────────────────────────────────────
    if (msg.type === 'kill') {
      await cleanup();
      send({ type: 'exit', code: -1, status: 'Killed', executionTimeMs: 0 });
    }
  });

  ws.on('close', cleanup);
  ws.on('error', cleanup);
});

// ─── Start ────────────────────────────────────────────────────────────────────
httpServer.listen(CONSTANTS.PORT, () => {
  console.log(`[CodeLab] HTTP → http://localhost:${CONSTANTS.PORT}`);
  console.log(`[CodeLab] WS   → ws://localhost:${CONSTANTS.PORT}/ws/execute`);
});
httpServer.on('error', (err) => {
  if (err.code !== 'EADDRINUSE') console.error('[CodeLab Server Error]:', err);
});

export { app, httpServer as server };
export default app;
