import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/server.js';

let server;
let baseUrl = 'http://localhost:5000';

test.before(async () => {
  // If a server is already running on 5000, test against it
  try {
    const res = await fetch('http://localhost:5000/api/health');
    if (res.ok) {
      baseUrl = 'http://localhost:5000';
      return;
    }
  } catch {
    // start on ephemeral port
  }

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://localhost:${server.address().port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('API: GET /api/health returns health info', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
  assert.ok(data.service.includes('CodeLab'));
  assert.ok(data.queue);
});

test('API: GET /api/languages returns 4 supported languages', async () => {
  const res = await fetch(`${baseUrl}/api/languages`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.languages.length, 4);
  const ids = data.languages.map(l => l.id);
  assert.ok(ids.includes('c'));
  assert.ok(ids.includes('cpp'));
  assert.ok(ids.includes('java'));
  assert.ok(ids.includes('python'));
});

test('API: POST /api/execute rejects missing language', async () => {
  const res = await fetch(`${baseUrl}/api/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'print(1)' })
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.stderr, /language/);
});

test('API: POST /api/execute rejects unsupported language', async () => {
  const res = await fetch(`${baseUrl}/api/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: 'rust', code: 'fn main() {}' })
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.stderr, /Invalid language/);
});

test('API: POST /api/execute rejects empty code', async () => {
  const res = await fetch(`${baseUrl}/api/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: 'python', code: '   ' })
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.stderr, /cannot be empty/);
});

test('API: POST /api/execute runs valid Python code via API', async () => {
  const res = await fetch(`${baseUrl}/api/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: 'python',
      code: 'print("API Execution OK")',
      stdin: ''
    })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'Accepted');
  assert.match(data.stdout, /API Execution OK/);
});
