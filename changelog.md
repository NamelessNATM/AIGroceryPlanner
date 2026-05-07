# Changelog

## [2026-05-07] — 2.1 Define and document the city JSON schema

**Status:** Complete
**What changed:** Created the /data/ folder structure and a SCHEMA.md file documenting the city dataset format that contributors must follow. The schema defines the meta block (country, city, currency, currency_symbol, last_updated, contributor) and the ingredients array (name, category, unit, price_per_unit). Created /data/pk/ with a .gitkeep to track the folder in Git ahead of the Islamabad seed dataset in task 2.2.
**Files modified:** data/SCHEMA.md (created), data/pk/.gitkeep (created), changelog.md
**Firestore collections affected:** none
**Test result:** Pass — folder structure confirmed, SCHEMA.md created with correct content
**Next task:** 2.2 Build Islamabad seed dataset (/data/pk/islamabad.json)


All notable changes to **AI Grocery Planner** are documented here. This file is mirrored from the StreamFuse monorepo folder `ai_grocery_planner/` to the public repository.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- `WBS.md` — full work breakdown structure covering all 11 phases from project foundation through deployment and QA.
- Vite + React + Tailwind scaffold in `ai_grocery_planner/` with Firebase SDK wired up
  - Firebase config loaded from Vite env (`import.meta.env`) — no secrets committed in source
  - `src/services/firebase.js` initialises Firebase app (and exports configured clients)
  - Firebase Hosting config updated so groceries target serves `ai_grocery_planner/dist`
- Country → city selector populated dynamically from community JSON datasets
- Parameters panel — people count, meal frequency, weekly budget, dietary exclusions, language selection
- Client-side minimum viable weekly cost calculator derived from city dataset prices
- Economies of scale logic — per-person minimum stays fixed, total budget multiplies by people count and is passed to the AI as a single figure
- Islamabad, Pakistan seed dataset JSON (`/data/pk/islamabad.json`) including vegetables, grains, legumes, meat, dairy, oils, and spices
- Oracle Cloud ARM instance running Ollama with Qwen3-30B-A3B (Q4_K_M, thinking mode enabled) — dedicated inference server, no other workloads
- Thin Express auth server on Oracle instance — validates requests from Cloud Run, forwards to Ollama, rejects all other traffic
- Google Cloud Run API layer — request queuing (max 2 concurrent), Google Translate post-processing for Urdu and Pashto, Oracle proxy
- Result caching layer — cache key hashed from city, country, people, meals, budget, exclusions, and dataset last_updated; cache stored in Firestore; stale entries purged nightly
- AI prompt — structured JSON output parsed and rendered by frontend; user never sees raw JSON
- Results display — shopping list table, recipe cards, per-meal and weekly cost breakdown
- Firestore session and meal plan persistence
- Firestore security rules scoped to session owner
- Google Translate integration for Urdu and Pashto output with visible language toggle on results page
- Oracle keepalive cron job running every 6 hours to prevent idle instance reclamation
- Firebase Hosting deployment

## [0.1.0] — 2026-05-07

### Added

- Initial static landing shell at `groceries.streamfuse.app` (`index.html`).
- Project docs: `README.md`, `STANDALONE_REPO.md` (GitHub mirror / subtree workflows).
- `.gitignore` for Firebase debug logs, `.env`, and common build artifacts.

After you tag releases on GitHub, you can add comparison links at the bottom per [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2026-05-07] — Phase 1.4: .env.example

**Status:** Complete
**What changed:** Created .env.example documenting all environment variables required by the project. Covers all seven Firebase config vars currently used in firebase.js, plus VITE_CLOUD_RUN_URL (Phase 3 Cloud Run proxy) and VITE_GOOGLE_TRANSLATE_API_KEY (Phase 7 translation). Each var includes a comment explaining where to find it.
**Files modified:** .env.example (created), WBS.md
**Firestore collections affected:** none
**Test result:** Pass — file present, all vars documented, .env.example confirmed not in .gitignore exclusion (it should be committed; .env should not)
**Next task:** Phase 1.5 — Anonymous Firebase Auth session on app load
