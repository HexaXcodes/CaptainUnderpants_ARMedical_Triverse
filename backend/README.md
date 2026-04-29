# AR Medical Assistant — Backend v1.1

Backend for WebAR-powered intelligent medical care assistant.

## What's new in v1.1

- 🛡️ **Helmet** for security headers
- 📊 **Morgan** request logger (every API call printed)
- ⏱️ **Rate limiting**: 200/min global, 30/min for AI, 10/min for auth
- 💾 **Persistent cache** (`node-cache`) — LLM responses + workflow JSON, with TTL
- 🔁 **Retry + exponential backoff** for OpenAI calls (handles transient failures)
- ⏰ **15s timeout** on OpenAI — AR UI never hangs
- ✅ **Input validation** with `express-validator` on auth routes
- 🧹 **Async handler wrapper** — no more try/catch boilerplate
- 🚦 **Graceful shutdown** on SIGTERM/SIGINT
- 🛟 **Crash protection** — unhandled rejections logged, process stays alive

## Quick Start

```bash
npm install
npm run dev
```

Server runs on `http://localhost:5000`.

## Environment (.env)

```
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/ar_medical?retryWrites=true&w=majority
JWT_SECRET=replace_with_long_random_string
OPENAI_API_KEY=sk-proj-your-key-here
NODE_ENV=development
```

> No OpenAI key? Fallback returns hand-tuned medical explanations. Demo still works.
> No MongoDB? Auth/user routes will fail; Quick Start AR + LLM (no login) still works.

## API Endpoints

### Health
- `GET /` → server status

### Auth (`/api/auth`) — rate limited 10/min
| Method | Path | Body | Auth |
|---|---|---|---|
| POST | `/register` | `{ name, email, password }` | — |
| POST | `/login` | `{ email, password }` | — |
| GET | `/me` | — | Bearer |

### User (`/api/user`)
| Method | Path | Body | Auth |
|---|---|---|---|
| GET | `/profile` | — | Bearer |
| PUT | `/medical-info` | `{ age, gender, conditions:[], medications:[], allergies:[] }` | Bearer |

### Workflow (`/api/workflow`) — cached 24h
| Method | Path | Body | Auth |
|---|---|---|---|
| GET | `/` | — | — |
| POST | `/detect` | `{ workflowId, markerHint? }` | — |
| GET | `/:id/:severity` | — | — |

IDs: `wound_care`, `burn_care`, `cpr`. Severities: `mild`, `moderate`, `severe`.

### AI (`/api/ai`) — rate limited 30/min, cached 1h
| Method | Path | Body | Auth |
|---|---|---|---|
| POST | `/explain` | `{ workflowName, severity, step }` | optional |
| POST | `/summary` | `{ workflowName, severity }` | optional |

Responses include `cached: true` if served from cache, `fallback: true` if OpenAI failed.

### Upload (`/api/upload`)
| Method | Path | Body | Auth |
|---|---|---|---|
| POST | `/report` | multipart with `report` file | Bearer |
| GET | `/reports` | — | Bearer |

PDF/DOC/DOCX/TXT/JPG/PNG. Max 10MB.

## Frontend cheat sheet

```js
const BASE = 'http://localhost:5000/api';

// Login
const r = await fetch(`${BASE}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { token } = await r.json();
localStorage.setItem('token', token);

// AR detect
const detect = await fetch(`${BASE}/workflow/detect`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ workflowId: 'wound_care', markerHint: 'mild' })
});

// Explain a step
const explain = await fetch(`${BASE}/ai/explain`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`
  },
  body: JSON.stringify({
    workflowName: 'Wound Care',
    severity: 'mild',
    step: { id: 1, title: 'Wash your hands', instruction: 'Wash with soap...' }
  })
});
```

## ngrok (phone demo)

```bash
ngrok http 5000
```

Use HTTPS URL as frontend's API base. Camera permissions only work over HTTPS.
