# Changelog

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

## [2026-05-07] — WBS restructure: budget floor deferred to post-AI phase

**Status:** Complete
**What changed:** Removed tasks 3.2 (client-side minimum viable cost calculator)
and 3.3 (budget input validation) from Phase 3. The floor value cannot be
meaningfully computed client-side before the AI is implemented — any hardcoded
gram or litre constants would be guesses, not data. Both tasks have been
rewritten as Phase 6.5 (tasks 6.5.1–6.5.3), sitting after the AI response
parser (6.3) in the dependency chain. The AI will return a
minimum_viable_weekly_cost field as part of every response; that figure becomes
the budget floor. The weeklyBudget field in ParametersPanel remains a free input
until Phase 6.5 is complete. Note: the minimum viable floor must be expressed in currency (e.g. PKR 1,200 / week) — not in grams, litres, or any other physical unit. The AI calculates the cheapest sufficient basket and returns its total cost in the dataset's local currency. Physical quantities are internal to the AI's reasoning and never surfaced as the floor value.
**Files modified:** WBS.md, changelog.md
**Firestore collections affected:** none
**Test result:** N/A — documentation change only
**Next task:** 4.1 Provision Oracle Cloud Always Free ARM instance

## [2026-05-07] — 3.1 Parameters panel UI

**Status:** Complete
**What changed:** Created src/components/ParametersPanel/ParametersPanel.jsx and
src/components/ParametersPanel/OptionGroup.jsx. ParametersPanel is a fully
controlled component with five fields: people count (number input, min 1),
meal frequency (radio group: 1_bulk / 2_meals / 3_meals), weekly budget
(number input, validation deferred to 3.2–3.3), dietary exclusions (free text),
and language (radio group: en / ur / ps). Panel is gated in App.jsx on
selectedDataset !== null — invisible until a city is selected, disappears if
selection is cleared. params state added to App.jsx with shape
{ peopleCount, mealFrequency, weeklyBudget, dietaryExclusions, language };
lifted via value/onChange. ParametersPanel.jsx split from OptionGroup.jsx to
stay within the 100-line limit.
**Files modified:** src/components/ParametersPanel/ParametersPanel.jsx (created),
src/components/ParametersPanel/OptionGroup.jsx (created), src/App.jsx (modified),
changelog.md
**Firestore collections affected:** none
**Test result:** Pass — panel hidden on load, appears on city select, all five
fields update params state correctly, panel disappears on country clear
**Next task:** 3.2 Client-side minimum viable weekly cost calculator

## [2026-05-07] — 2.4 Dataset loader service

**Status:** Complete
**What changed:** Created src/services/datasetService.js with a single exported function getDatasetForLocation(countryCode, citySlug) that looks up the selected city's full JSON dataset from the pre-built locationData index. Added selectedDataset state to App.jsx, driven by a useEffect that calls the service whenever locationSelection changes. selectedDataset is passed down to CountryCitySelector as a prop, ready for consumption in Phase 3. App.jsx never accesses getLocationIndex() directly for dataset lookup — all access is through the service.
**Files modified:** src/services/datasetService.js (created), src/App.jsx (modified), changelog.md
**Firestore collections affected:** none
**Test result:** Pass — selectedDataset logs null on load, null on country-only selection, and the full 295-ingredient Islamabad dataset object on city selection
**Next task:** 3.1 Build parameters panel UI — people, meal frequency, budget, exclusions, language

## [2026-05-07] — 2.3 Build country → city selector UI component

**Status:** Complete  
**What changed:** Created a controlled CountryCitySelector component that renders two dropdowns — country first, then city (disabled until a country is chosen). City options populate only for the selected country. Component is driven by locationSelection state in App.jsx ({ countryCode, citySlug }). Selecting a new country resets citySlug to null. Data discovery uses Vite's import.meta.glob over data/**/*.json at build time — no filesystem reads at runtime. Path parsing extracts countryCode from the folder name and citySlug from the filename. Labels prefer json.meta.country and json.meta.city, falling back to uppercased code and title-cased slug. Index is built in src/services/locationData.js and exported via getLocationIndex(). Note: cityDataByKey was exported by Cursor despite the scope amendment — it is harmless but will be formally adopted in task 2.4.  
**Files modified:** src/components/CountryCitySelector.jsx (created), src/services/locationData.js (created), src/App.jsx (modified), changelog.md  
**Firestore collections affected:** none  
**Test result:** Pass — country dropdown renders, city dropdown enables on country select, Islamabad appears under Pakistan, no app errors in console  
**Next task:** 2.4 Dataset loader service — fetch selected city JSON, expose to app state

## [2026-05-07] — 2.2 Build Islamabad seed dataset (/data/pk/islamabad.json)

**Status:** Complete
**What changed:** Created the Islamabad, Pakistan seed dataset at data/pk/islamabad.json. The file contains 295 ingredients across 12 categories: baking (32), condiments (54), dairy (13), frozen (14), fruit (28), grains (27), legumes (14), meat (11), nuts (4), oils (13), spices (57), vegetables (28). Prices are sourced from islamabadgrocery.store and normalised to a consistent per-unit basis (100g, 100ml, 1L, dozen, loaf, or piece depending on the ingredient). Extended categories beyond the base schema to include baking, frozen, nuts, and condiments as permitted by the design doc. Replaces the data/pk/.gitkeep placeholder from task 2.1.
**Files modified:** data/pk/islamabad.json (created), data/pk/.gitkeep (deleted), changelog.md
**Firestore collections affected:** none
**Test result:** Pass — valid JSON, all meta fields present, all 295 ingredients have required keys, no zero or null prices, 12 categories confirmed
**Next task:** 2.3 Build country → city selector UI component

## [2026-05-07] — 2.1 Define and document the city JSON schema

**Status:** Complete
**What changed:** Created the /data/ folder structure and a SCHEMA.md file documenting the city dataset format that contributors must follow. The schema defines the meta block (country, city, currency, currency_symbol, last_updated, contributor) and the ingredients array (name, category, unit, price_per_unit). Created /data/pk/ with a .gitkeep to track the folder in Git ahead of the Islamabad seed dataset in task 2.2.
**Files modified:** data/SCHEMA.md (created), data/pk/.gitkeep (created), changelog.md
**Firestore collections affected:** none
**Test result:** Pass — folder structure confirmed, SCHEMA.md created with correct content
**Next task:** 2.2 Build Islamabad seed dataset (/data/pk/islamabad.json)

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
