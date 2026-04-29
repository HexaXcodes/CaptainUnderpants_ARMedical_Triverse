# NovaCare — Frontend

WebAR-powered intelligent medical assistant. This is the **functional** web app shell — login, dashboard, profile, uploads, scenario picker, and AR launch. The marketing landing page is built separately in Spline. The AR scene itself is built by the AR teammate and drops into `src/components/workflow/ARScene.jsx`.

## Stack

- Vite + React 18
- React Router v6
- TailwindCSS v3
- Lucide React icons
- Pure fetch for API (no axios — keeps bundle small)

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173.

By default the app talks to `http://localhost:5000/api`. To override (e.g., when using cloudflared/ngrok), create `.env.local`:

```
VITE_API_BASE=https://your-backend-tunnel.trycloudflare.com/api
```

Restart dev server after changing.

## Folder structure

```
src/
├── components/
│   ├── auth/            AuthLayout (login/register split-screen)
│   ├── common/          Card, Spinner, ErrorMsg, SeverityBadge
│   ├── dashboard/       StatTile, MedicalInfoForm
│   ├── layout/          Navbar, PageShell
│   ├── upload/          UploadDropzone
│   └── workflow/        ARScene (placeholder), StepOverlay,
│                        WorkflowCard, SeveritySelector
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── UploadReport.jsx
│   ├── WorkflowSelect.jsx
│   └── ARExperience.jsx
├── services/
│   ├── api.js           ★ single source of truth for API_BASE
│   ├── authService.js
│   ├── workflowService.js
│   └── aiService.js
├── context/
│   ├── AuthContext.jsx
│   └── WorkflowContext.jsx
├── hooks/
│   └── useStepExplanation.js
├── routes/
│   └── ProtectedRoute.jsx
├── App.jsx
└── main.jsx
```

## Routes

| Path | Auth | Page |
|---|---|---|
| `/login` | public | Login |
| `/register` | public | Register |
| `/workflow` | public | Pick a scenario |
| `/ar` | public | AR experience (requires picked scenario in context) |
| `/dashboard` | required | User profile + medical info |
| `/upload` | required | Upload medical reports |

## API contract

All API URLs are centralized in `src/services/api.js`. **Never hardcode URLs anywhere else.**

| Service | Method | Endpoint |
|---|---|---|
| `authService.register` | POST | `/auth/register` |
| `authService.login` | POST | `/auth/login` |
| `authService.me` | GET | `/auth/me` |
| `authService.getProfile` | GET | `/user/profile` |
| `authService.updateMedicalInfo` | PUT | `/user/medical-info` |
| `workflowService.list` | GET | `/workflow` |
| `workflowService.detect` | POST | `/workflow/detect` |
| `workflowService.get` | GET | `/workflow/:id/:severity` |
| `workflowService.uploadReport` | POST | `/upload/report` |
| `workflowService.listReports` | GET | `/upload/reports` |
| `aiService.explainStep` | POST | `/ai/explain` |
| `aiService.scenarioSummary` | POST | `/ai/summary` |

JWT is stored in `localStorage` under key `token`, attached as `Authorization: Bearer <token>` automatically by `apiFetch`.

## AR integration (for the AR engineer)

The AR module is a **single replaceable component**: `src/components/workflow/ARScene.jsx`.

The contract is:

```jsx
<ARScene
  workflow={selectedWorkflow}    // { id, name }
  severity={selectedSeverity}    // 'mild' | 'moderate' | 'severe'
  currentStep={currentStep}      // 0-indexed
  steps={activeScenario.steps}   // full step array
  onMarkerFound={fn}             // (markerId) => void
  onStepComplete={fn}            // (stepIndex) => void
/>
```

To integrate AR.js + A-Frame:

1. Add the AR.js + A-Frame scripts to `index.html` (or load dynamically in `ARScene.jsx`)
2. Replace the body of `ARScene` with the `<a-scene>` markup
3. Wire your marker-detected handler to call `props.onMarkerFound(markerId)`
4. Keep the prop signature unchanged — everything else (state, navigation, UI overlay) is already wired

`src/pages/ARExperience.jsx` already reads from `WorkflowContext` and renders the overlay on top of `<ARScene />` — so the AR engineer only touches one file.

## Design system

**Aesthetic:** Clean Glass Brutalism — frosted cards, thick black borders, hard offset shadows.

**Tokens** (in `tailwind.config.js`):

- `primary`: `#55B0DD`
- `accent`: `#91C0FA`
- `ink`: `#0A0F14` (border + text)
- `bone`: `#F4F1EA` (bg)
- `urgent`: `#FF4D4D` (severe / emergency)

**Reusable utility classes** (in `src/index.css`):

- `card-glass` / `card-glass-sm` — frosted card with thick border + offset shadow
- `btn-primary` / `btn-ghost` / `btn-danger` — three button variants with shadow-lift hover
- `input-field` — bordered input
- `chip` — small mono-uppercase pill
- `label-display` — section labels

**Fonts:** Space Grotesk (display) + Inter (body) + JetBrains Mono (mono accents).

## What's left for tomorrow

- Wire AR.js into `ARScene.jsx`
- Add real marker detection callback
- (Optional) tune StepOverlay positioning to leave more camera room
- (Optional) build the Spline-based marketing landing as a separate route

## Demo runbook

1. Backend: `cd backend && npm run dev`
2. Tunnel backend (optional, only if running frontend on different network): `cloudflared tunnel --url http://localhost:5000`
3. Frontend: `cd frontend && npm run dev`
4. Tunnel frontend: `cloudflared tunnel --url http://localhost:5173`
5. Open the frontend tunnel URL on your phone
