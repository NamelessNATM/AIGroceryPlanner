# AI Grocery Planner — Work Breakdown Structure
*Last updated: 2026-05-07*

---

## Stack Reference (Authoritative)

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) + Tailwind CSS |
| Frontend hosting | Firebase Hosting |
| Database | Firebase Firestore |
| Auth | Firebase Auth (anonymous) |
| API layer | Google Cloud Run — queuing, translation, Oracle proxy |
| AI inference | Oracle Cloud ARM + Ollama + Qwen3-30B-A3B (Q4_K_M) |
| Translation | Google Translate API |
| City data | Community JSON in `/data/` |

> **Infrastructure note:** The frontend never talks to Oracle directly. All requests go Frontend → Cloud Run → Oracle. Cloud Run handles queuing (max 2 concurrent), Google Translate post-processing, and authentication. Oracle runs one workload only: Ollama serving Qwen3-30B-A3B with thinking mode enabled.

---

## Status Key

| Symbol | Meaning |
|--------|---------|
| ✅ | Complete and tested |
| 🔄 | In progress |
| ⬜ | Not started |
| 🚫 | Cut — will not be implemented |

---

## Phase 0 — Project Foundation

| # | Task | Status | Notes |
|---|------|--------|-------|
| 0.1 | Static landing shell at `groceries.streamfuse.app` (`index.html`) | ✅ | Released in v0.1.0 |
| 0.2 | Project docs — `README.md`, `STANDALONE_REPO.md`, `.gitignore` | ✅ | Released in v0.1.0 |
| 0.3 | `changelog.md` created in repo root | ✅ | Released in v0.1.0 |

---

## Phase 1 — Frontend Scaffold

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Scaffold Vite + React + Tailwind CSS project | ✅ | Replaces static `index.html` as the app entry point |
| 1.2 | Connect Firebase — initialise app, Firestore, and Auth config | ✅ | Config from `.env`; no hardcoded keys |
| 1.3 | Anonymous Firebase Auth session on app load | 🚫 | Cut — app is a free public tool with no sensitive data; Firestore will use open rules instead of per-user scoping |
| 1.4 | `.env.example` documenting all required env vars | ✅ | `VITE_CLOUD_RUN_URL`, `VITE_FIREBASE_*`, `VITE_GOOGLE_TRANSLATE_API_KEY` |

---

## Phase 2 — City Data Layer

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Define and document the city JSON schema | ✅ | `meta` block + `ingredients` array per Design Doc §8.1 |
| 2.2 | Build Islamabad, Pakistan seed dataset (`/data/pk/islamabad.json`) | ⬜ | Vegetables, grains, legumes, meat, dairy, oils, spices — all costed |
| 2.3 | Build country → city selector UI component | ⬜ | Dropdown populated dynamically from available JSON files |
| 2.4 | Dataset loader service — fetch selected city JSON, expose to app state | ⬜ | Lives in `src/services/datasetService.js` |

---

## Phase 3 — Parameters Panel

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Build parameters panel UI — people, meal frequency, budget, exclusions, language | ⬜ | Three meal frequency options: bulk (1/day), 2/day, 3/day |
| 3.2 | Client-side minimum viable weekly cost calculator | ⬜ | Cheapest sufficient quantities × people count; displayed as budget floor |
| 3.3 | Budget input validation — enforce minimum floor, reject values below it | ⬜ | Inline error state on the budget field |

---

## Phase 4 — Oracle Cloud Inference Server

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Provision Oracle Cloud Always Free ARM instance | ⬜ | Shape: VM.Standard.A1.Flex; 4 OCPUs, 24GB RAM, 200GB storage; Ubuntu 24.04 aarch64 |
| 4.2 | Install Ollama and pull Qwen3-30B-A3B | ⬜ | `ollama run qwen3:30b-a3b`; Q4_K_M quantisation; ~17GB loaded; thinking mode on |
| 4.3 | Build thin Express auth server on Oracle instance | ⬜ | Validates shared secret from Cloud Run; forwards validated requests to Ollama locally; rejects all other traffic |
| 4.4 | Firewall rules — restrict inbound to Cloud Run IP range only | ⬜ | No public access to Ollama or Express server |
| 4.5 | Oracle keepalive cron job | ⬜ | Runs every 6 hours; keeps CPU above 20% idle threshold to prevent Oracle instance reclamation |

---

## Phase 5 — Cloud Run API Layer

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Scaffold Cloud Run service (Node/Express) | ⬜ | Deployed to Google Cloud Run free tier (2M requests/month) |
| 5.2 | Request queue middleware — max 2 concurrent requests to Oracle | ⬜ | ~20 lines of Express middleware; RAM budget at 2 concurrent: ~20GB of 24GB |
| 5.3 | Queue position + estimated wait response | ⬜ | Returned to frontend while request is queued; user sees position number and ETA |
| 5.4 | Oracle proxy — forward validated requests to Oracle Express auth server | ⬜ | Attaches shared secret header; forwards structured prompt; returns raw JSON response |
| 5.5 | Google Translate post-processing — translate English AI output to Urdu or Pashto | ⬜ | Applied after Oracle response, before returning to frontend; English requests skip this step |
| 5.6 | Cache check — read Firestore cache before queuing any Oracle request | ⬜ | Cache hit bypasses queue entirely and returns instantly |

---

## Phase 6 — AI Prompt & Response

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | Design and implement AI system prompt | ⬜ | Structured JSON output; no currency mentioned; dataset prices provide implicit currency context |
| 6.2 | Serving size calculation — scale recipe quantities to `people × meals_per_day × 7` | ⬜ | Part of prompt construction; must produce gram/ml quantities, never symbolic amounts like "1 potato" |
| 6.3 | Parse and validate Ollama JSON response on Cloud Run | ⬜ | Strip markdown fences; validate required fields; surface errors to frontend gracefully |

---

## Phase 7 — Result Caching

| # | Task | Status | Notes |
|---|------|--------|-------|
| 7.1 | Implement cache key hash function | ⬜ | Key: `city + country + people + meals_per_day + budget + exclusions + dataset_last_updated` |
| 7.2 | Firestore cache read — check `/cache/{hash}` before queuing Oracle request | ⬜ | Cache hit returns stored meal plan instantly; no queue position needed |
| 7.3 | Firestore cache write — store new result under hash after generation | ⬜ | Includes `dataset_version` field for invalidation |
| 7.4 | Cache invalidation cron job — purge stale entries nightly on Cloud Run | ⬜ | Removes entries whose `dataset_version` no longer matches the city JSON `last_updated` |

---

## Phase 8 — Results Display

| # | Task | Status | Notes |
|---|------|--------|-------|
| 8.1 | Shopping list table component — ingredient, qty, unit, cost per row | ⬜ | Derived from aggregated `ingredients_used` across all meals |
| 8.2 | Recipe card components — name, description, ingredients, instructions, cost badge | ⬜ | One card per day; expandable instructions |
| 8.3 | Cost breakdown panel — total weekly, per day, per person per day, minimum possible | ⬜ | Matches `cost_summary` schema in Design Doc §8.3 |
| 8.4 | Loading state UI — queue position and estimated wait shown while Oracle request is in flight | ⬜ | Polls Cloud Run for queue status; updates in real time |

---

## Phase 9 — Language Support

| # | Task | Status | Notes |
|---|------|--------|-------|
| 9.1 | Google Translate service on Cloud Run — translate Ollama English output to Urdu or Pashto | ⬜ | Post-processing only; AI always generates in English |
| 9.2 | Language toggle on results page — switch between English, Urdu, Pashto without regenerating | ⬜ | Re-translate from cached English result via Cloud Run; no new Oracle call |
| 9.3 | Pashto best-effort disclaimer in UI | ⬜ | Visible note on results page when Pashto is selected |

---

## Phase 10 — Firestore Persistence

| # | Task | Status | Notes |
|---|------|--------|-------|
| 10.1 | Firestore session write — save ingredient list + params to `/sessions/{sessionId}` on generate | ⬜ | `sessionId` tied to anonymous Auth UID |
| 10.2 | Firestore meal plan write — save generated meals to `/mealPlans/{planId}` | ⬜ | Links back to `sessionId` |
| 10.3 | Firestore security rules — scope reads and writes to session owner | ⬜ | All rules in `firestore.rules`; committed alongside collection changes per Rule 8.3 |

---

## Phase 11 — Deployment & QA

| # | Task | Status | Notes |
|---|------|--------|-------|
| 11.1 | Deploy frontend to Firebase Hosting at `groceries.streamfuse.app` | ⬜ | Via monorepo deploy script (`deploy-groceries.sh`) |
| 11.2 | Deploy Cloud Run service | ⬜ | `gcloud run deploy`; confirm free tier limits |
| 11.3 | End-to-end test — full English flow: city select → params → generate → shopping list → recipe cards | ⬜ | Must pass before any phase is considered shippable |
| 11.4 | End-to-end test — queue flow | ⬜ | Submit two requests simultaneously; confirm third request receives queue position and ETA |
| 11.5 | End-to-end test — cache hit flow | ⬜ | Resubmit identical params; confirm Oracle is not called again |
| 11.6 | End-to-end test — Urdu translation flow | ⬜ | Verify Google Translate post-processing and language toggle |
| 11.7 | End-to-end test — budget floor enforcement | ⬜ | Attempt to submit below minimum; confirm rejection |

---

## Dependency Order (Critical Path)

```
0.3 changelog.md
  └── 1.1 Scaffold
        └── 1.2 Firebase connect
              └── 1.3 Anonymous auth
                    ├── 2.3 City selector
                    │     └── 2.4 Dataset loader
                    │           └── 3.1 Params panel
                    │                 └── 3.2 Min cost calc
                    │                       └── [Phase 4 + 5 must be live]
                    │                             └── 6.1 System prompt
                    │                                   └── 6.2 Serving size
                    │                                         └── 6.3 Response parser
                    │                                               ├── 7.1–7.4 Caching
                    │                                               ├── 8.1–8.4 Results display
                    │                                               └── 9.1–9.3 Translation
                    └── 10.1–10.3 Firestore persistence (parallel to Phase 8–9)
                          └── 11.1–11.7 Deployment & QA

Phase 4 (Oracle) and Phase 5 (Cloud Run) can be built in parallel with
Phases 1–3 — they have no frontend dependencies. Both must be live and
talking to each other before Phase 6 can be tested end-to-end.
```