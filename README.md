# CodeLab — Online Compiler

**Write. Run. Learn.**

A fast, entirely **ad-free**, **login-free** online IDE for C, C++, Java, and Python. Built with React + Monaco Editor on the frontend and a secure Node.js + Docker execution engine on the backend.

---

## ✨ Features

- 🚀 Monaco Editor (VS Code's engine) with syntax highlighting, IntelliSense, code folding, multi-cursor, find/replace
- 🔒 Sandboxed Docker execution (or local compiler fallback for dev)
- 🌐 All four languages: **C (GCC)**, **C++ (G++)**, **Java (OpenJDK 21)**, **Python (CPython 3)**
- 📥 Custom STDIN support
- 💾 Per-language local draft auto-save (localStorage, never uploaded)
- ⬇️ One-click source code download (`.c`, `.cpp`, `.java`, `.py`)
- 📋 Copy code to clipboard
- ↔️ Resizable editor / input / output panels with drag splitters
- ⌨️ Full keyboard shortcuts (`Ctrl+Enter` to run, `Ctrl+S` to download, etc.)
- 🌗 Dark / Light theme toggle
- 🛡️ Rate limiting, input validation, output size limits, execution timeout
- 📱 Responsive design — desktop, tablet, and mobile

---

## 🛠 Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Monaco Editor, Lucide React |
| Backend | Node.js 20+, Express, Helmet, CORS, express-rate-limit |
| Execution | Docker (hardened container) with local compiler fallback |
| Compilers | GCC (C17), G++ (C++17), OpenJDK 21, CPython 3 |

---

## 📋 Prerequisites

- **Node.js 20+** and **npm 10+**
- **Docker Desktop** (Windows/Mac) or Docker Engine (Linux) — for sandboxed execution
- **GCC / G++**, **Python 3** on host — for local dev fallback when Docker is not running
- Java (OpenJDK 21) on host — for Java local fallback

---

## 🚀 Quick Start (Local Development — Windows)

### 1. Clone / navigate to project directory

```bash
cd "Online complier"
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 4. Build the Docker execution image (optional — Docker Desktop required)

```bash
cd ../compiler-engine
docker build -t codelab-runner:latest .
```

### 5. Create backend `.env`

```bash
# In the backend directory, copy the example:
copy .env.example .env
```

Default values work for development:
```
PORT=5000
CLIENT_ORIGIN=*
EXECUTION_MODE=auto        # auto | docker | local
ALLOW_LOCAL_FALLBACK=true  # allow local gcc/python when Docker not running
DOCKER_IMAGE_NAME=codelab-runner:latest
```

### 6. Start the backend

```bash
cd backend
npm start
# → Server running at http://localhost:5000
```

### 7. Start the frontend dev server

```bash
cd frontend
npm run dev
# → http://localhost:3000
```

Open **http://localhost:3000** in your browser — CodeLab is live!

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + Enter` | Run / Execute code |
| `Ctrl + S` | Download source file |
| `Ctrl + Shift + S` | Download source file |
| `Ctrl + /` | Toggle line comment (Monaco) |
| `Ctrl + F` | Find in code (Monaco) |
| `Alt + Shift + F` | Format document (Monaco) |
| `Escape` | Close dialogs / exit fullscreen |

---

## 📡 API Reference

### `GET /api/health`

Returns server status, Docker availability, execution mode, and queue stats.

```json
{
  "status": "ok",
  "service": "CodeLab Online Compiler API",
  "dockerReady": true,
  "executionMode": "auto",
  "queue": { "active": 0, "waiting": 0, "maxConcurrency": 4, "maxWaiting": 20 }
}
```

### `GET /api/languages`

Returns the list of supported languages with metadata.

### `POST /api/execute`

**Request:**
```json
{
  "language": "python",
  "code": "print('Hello!')",
  "stdin": ""
}
```

**Response:**
```json
{
  "status": "Accepted",
  "stdout": "Hello!\n",
  "stderr": "",
  "executionTimeMs": 183,
  "engine": "local-fallback"
}
```

**Possible `status` values:** `Accepted`, `Compilation Error`, `Runtime Error`, `Time Limit Exceeded`, `Output Limit Exceeded`, `Queue Full`, `Internal Error`

---

## 🐳 Docker Execution Engine

The `compiler-engine/Dockerfile` builds a hardened Ubuntu image with GCC, G++, OpenJDK 21, and Python 3.

Every submission runs inside a **disposable container** with:
- `--network none` — no internet access
- `--memory 256m` — 256 MB RAM limit
- `--cpus 1.0` — 1 CPU core limit
- `--pids-limit 64` — prevents fork bombs
- `--read-only` — immutable root filesystem
- `--tmpfs /tmp` — small writable scratch space (no exec, no SUID)
- `--cap-drop ALL` — all Linux capabilities dropped
- `--security-opt no-new-privileges` — no escalation
- Non-root user (UID 1001) inside container

### Build the image

```bash
cd compiler-engine
docker build -t codelab-runner:latest .
```

### Test the image manually

```bash
mkdir testdir
echo 'print("Docker works!")' > testdir/main.py
echo "" > testdir/stdin.txt
docker run --rm --network none --memory 256m --cpus 1 --pids-limit 64 \
  --read-only --tmpfs /tmp:rw,noexec,nosuid,size=64m \
  --cap-drop ALL --security-opt no-new-privileges \
  -v "${PWD}/testdir:/workspace:rw" \
  codelab-runner:latest python
```

---

## 🌐 Production Deployment Guide (Linux VPS)

### Frontend → Vercel

```bash
cd frontend
npm run build
# Deploy the dist/ folder to Vercel via GitHub integration or CLI
```

Set `VITE_API_URL=https://api.yourcodelab.com/api` in Vercel environment variables.

### Backend + Docker Engine → Linux VPS

1. Install Node.js 20+, Docker Engine, GCC, G++, Python 3, OpenJDK 21
2. Clone repo and install backend deps
3. Build Docker image: `docker build -t codelab-runner:latest ./compiler-engine`
4. Set `EXECUTION_MODE=docker` and `ALLOW_LOCAL_FALLBACK=false` in `.env`
5. Use **PM2** or **systemd** to manage the Node.js process

**Reverse proxy with Caddy:**
```
api.yourcodelab.com {
    reverse_proxy localhost:5000
}
```

### Environment variables (production)

```
PORT=5000
CLIENT_ORIGIN=https://yourcodelab.com
EXECUTION_MODE=docker
ALLOW_LOCAL_FALLBACK=false
DOCKER_IMAGE_NAME=codelab-runner:latest
```

---

## 🔒 Security Architecture

| Control | Implementation |
|---|---|
| Docker isolation | Each submission runs in a disposable container |
| Network isolation | `--network none` — containers cannot reach internet |
| Resource limits | 256 MB RAM, 1 CPU, 64 process limit |
| Filesystem isolation | Read-only root, tiny writable tmpfs only |
| Capability dropping | `--cap-drop ALL`, `--security-opt no-new-privileges` |
| Non-root execution | UID 1001 inside container |
| Wall-clock timeout | 5 seconds hard limit, process killed on timeout |
| Output limit | 256 KB max output before truncation |
| Rate limiting | 60 requests/minute/IP |
| Input validation | Language allowlist, code/stdin size limits |
| No eval/exec | All process spawning uses `child_process.spawn` with arg arrays |

> **⚠️ Production Warning:** Docker containers alone do not fully protect against hostile kernel exploits. For public deployment with untrusted code, run the execution engine on a **dedicated isolated Linux host** separate from your database and application servers. Evaluate **gVisor** (`runsc`) or **Kata Containers** for deeper kernel isolation.

---

## 🔧 Troubleshooting

**Backend not starting**
- Check Node.js version: `node --version` (needs 20+)
- Check port 5000 is not in use

**Docker not available**
- The backend automatically falls back to local compiler mode (if `ALLOW_LOCAL_FALLBACK=true`)
- Install Docker Desktop on Windows: https://www.docker.com/products/docker-desktop/

**C/C++ compilation fails locally**
- Make sure `gcc`/`g++` is in your PATH
- On Windows, MinGW (GCC 6.x) works but only supports `-std=c11`/`-std=c++14` — the backend auto-retries with the right flag

**Java not working**
- Install OpenJDK 21: `winget install Microsoft.OpenJDK.21`
- Restart terminal after installation

**Frontend can't connect to backend**
- Ensure backend is running on port 5000
- The Vite dev server proxies `/api` → `localhost:5000` automatically

---

## 📁 Project Structure

```
Online complier/
├── backend/
│   ├── src/
│   │   ├── config/        # constants, language configs
│   │   ├── controllers/   # request handlers
│   │   ├── middleware/    # validation, rate-limiting, error handling
│   │   ├── routes/        # Express routers
│   │   ├── services/      # executor, Docker service, local fallback, queue
│   │   └── server.js      # Express app entry point
│   ├── test/              # Node.js built-in test runner tests
│   ├── .env.example
│   └── package.json
├── compiler-engine/
│   ├── Dockerfile         # Hardened Ubuntu compiler image
│   └── runner.sh          # In-container compilation + execution script
├── frontend/
│   ├── src/
│   │   ├── components/    # Navbar, CodeEditor, InputPanel, OutputPanel, etc.
│   │   ├── hooks/         # useLocalStorage, useKeyboardShortcuts
│   │   ├── pages/         # MainPage (single-page app)
│   │   └── utils/         # templates, download helper
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── .gitignore
└── README.md
```
