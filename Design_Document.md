# AI Grocery Planner — Design Document v1.1
*Finalised: 2026-05-07*

---

## 1. Purpose

A free, open-source web tool that takes a city-specific grocery price dataset, calculates the minimum viable weekly food cost, and generates a personalised meal plan with recipes, a shopping list, and a full cost breakdown. Powered entirely by self-hosted open source AI. Zero API costs, zero hosting costs, no rate limits.

---

## 2. The Core Problem

Grocery costs vary dramatically by location. A meal plan optimised for Dubai is useless in Islamabad. Existing tools either ignore local pricing entirely or require paid APIs. This tool grounds every recommendation in real, community-sourced local prices so the output is economically meaningful — the AI knows mutton is expensive in Peshawar and plans accordingly.

---

## 3. Architecture

```
User Browser
     │
     ▼
Firebase Hosting
(React frontend — static, free forever)
     │
     ▼
Google Cloud Run
(API layer — auth, queuing, translation, business logic)
(Free: 2M requests/month, always free)
     │
     ▼
Oracle Cloud ARM Instance
(Ollama + Qwen3-30B-A3B — inference only)
(Free: 4 OCPUs, 24GB RAM, always free)
     │
     ▼
Firebase Firestore
(Session + meal plan storage — free tier)
```

**Key principle:** The Oracle instance does one thing only — run the model. All user-facing logic lives in Cloud Run. Users never talk to Oracle directly.

---

## 4. How It Works — User Flow

1. User selects **country → city** from a dropdown populated by available JSON datasets
2. App calculates and displays the **minimum viable weekly grocery cost** for that city
3. User sets:
   - Number of people
   - Meal frequency (1 bulk meal/day, 2 meals, or 3 meals)
   - Weekly budget (at or above the calculated minimum)
   - Dietary exclusions (free text)
   - Preferred language (English, Urdu — Pashto best effort via translation)
4. Frontend sends request to Cloud Run
5. Cloud Run queues the request, translates any non-English parameters if needed, forwards to Oracle
6. Oracle runs Qwen3-30B-A3B with thinking mode enabled, returns structured JSON
7. Cloud Run translates the output if needed via Google Translate API, returns to frontend
8. Frontend parses the JSON and renders it as a clean UI — shopping list, recipe cards, cost breakdown. The user never sees raw JSON at any point.

---

## 5. Serving Size Logic

This is the core calculation the AI must get right.

```
Total servings = people × meals_per_day × days (default 7)

Bulk meal (covers breakfast, lunch, and dinner for the day):
  Servings per recipe = people × 3

Examples:
  1 person,  bulk meal, 7 days  → 7 recipes, each yields 3 servings
  2 people,  bulk meal, 7 days  → 7 recipes, each yields 6 servings
  4 people,  3 meals,   7 days  → 21 recipes, each yields 4 servings
```

The AI is explicitly instructed never to output symbolic quantities like "1 potato" or "a handful of rice." All quantities must be scaled to the actual number of servings required.

---

## 6. Minimum Cost Calculation and Economies of Scale

The app calculates the minimum viable weekly cost entirely client-side from the dataset — taking the cheapest ingredients in sufficient quantities to sustain one person for one week, then multiplying by the number of people.

**The per-person minimum never changes.** What changes with group size is what the total budget unlocks:

- 1 person at 125 PKR/week can only buy small retail quantities of the cheapest staples
- 6 people at 750 PKR/week have the same 125 PKR per person minimum, but the larger total unlocks bulk quantities and higher quality ingredients that a single person could not justify purchasing alone

The app computes the total, shows it to the user as the minimum floor, and the user sets their actual budget at or above that figure.

That single total number is passed into the AI prompt. The AI does not need to know how the minimum was calculated or anything about economies of scale. It simply works with what the total budget unlocks from the ingredient list.

**Prompt structure:**

```
Generate 7 recipes for [total_budget] or less using the ingredient
dataset provided. This is for [n] people. 7 recipes total, one per
day, not exceeding [total_budget] combined.
```

No currency is mentioned in the prompt. The dataset already has all prices in the local currency so there is no ambiguity.

---

## 7. Language Handling

| Language | UI | AI Output |
|----------|----|-----------|
| English  | ✅ Native | ✅ Native from model |
| Urdu     | ✅ Google Translate | ✅ Google Translate post-processing |
| Pashto   | ✅ Google Translate | ⚠️ Best effort via Google Translate |

The AI generates everything in English. Google Translate API handles all language conversion on the Cloud Run layer. This keeps the model prompt clean and maximises recipe quality — translation is a post-processing concern, not an AI concern.

Pashto is a low-resource language. No current model handles it reliably. Google Translate provides best-effort output. Users can switch to English or Urdu from the results page at any time via a visible language toggle.

**Google Translate API free tier:** 500,000 characters/month. A full meal plan is roughly 3,000–4,000 characters — approximately 125–165 full generations per month before any cost.

---

## 8. Data Architecture

### 8.1 Dataset Format

Each city is a single JSON file. Path convention: `/data/{country_code}/{city_slug}.json`

Seed dataset: `/data/pk/islamabad.json`

```json
{
  "meta": {
    "country": "Pakistan",
    "city": "Islamabad",
    "currency": "PKR",
    "currency_symbol": "₨",
    "last_updated": "2026-05-07",
    "contributor": "NamelessNATM"
  },
  "ingredients": [
    {
      "name": "Potatoes",
      "category": "vegetables",
      "unit": "kg",
      "price_per_unit": 100
    },
    {
      "name": "Cumin seeds",
      "category": "spices",
      "unit": "100g",
      "price_per_unit": 60
    }
  ]
}
```

Categories include but are not limited to: `vegetables`, `fruit`, `meat`, `dairy`, `grains`, `legumes`, `spices`, `oils`. Spices are included in the dataset and costed like any other ingredient — no assumptions are made about what the user already has at home.

### 8.2 Community Contribution Model

The `/data/` folder in the GitHub repo is the canonical source of all city datasets. Anyone can contribute a new city by submitting a JSON file following the schema above. The city dropdown is dynamically populated from whatever JSON files exist at build time. Islamabad, Pakistan is the seed dataset.

### 8.3 Firestore Collections

```
/sessions/{sessionId}
  ingredients : [ { name, price, unit, qty } ]
  params      : { people, meals, budget, language, exclusions }
  city        : string
  country     : string
  createdAt   : Timestamp

/mealPlans/{planId}
  sessionId   : string
  meals       : [
    {
      name                : string,
      description         : string,
      ingredients_used    : [ { name, qty, unit, cost } ],
      total_cost          : number,
      cost_per_serving    : number,
      servings            : number,
      instructions        : string
    }
  ]
  shopping_list : [ { name, qty, unit, total_cost } ]
  cost_summary  : {
    total_weekly         : number,
    per_day              : number,
    per_person_per_day   : number,
    minimum_possible     : number
  }
  generatedAt : Timestamp
  language    : string
```

---

## 9. AI Infrastructure

### 9.1 Oracle Cloud Instance

```
Provider  :  Oracle Cloud Always Free
Shape     :  VM.Standard.A1.Flex
OCPUs     :  4 (ARM Ampere A1)
RAM       :  24 GB
Storage   :  200 GB
Bandwidth :  10 TB/month outbound
Cost      :  Free forever
```

The instance runs only:
- Ubuntu 24.04 (aarch64)
- Ollama
- Qwen3-30B-A3B (Q4_K_M, ~17GB loaded)
- A thin Express auth server that validates requests from Cloud Run and forwards to Ollama locally

Firewall rules restrict inbound traffic to Cloud Run's IP range only. No public access to Ollama.

### 9.2 Model

```
Model         :  Qwen3-30B-A3B
Quantisation  :  Q4_K_M
RAM (weights) :  ~17 GB
RAM per req   :  ~1.5 GB (KV cache)
Thinking mode :  ON for all recipe generation
Licence       :  Apache 2.0
Ollama cmd    :  ollama run qwen3:30b-a3b
```

**Why Qwen3-30B-A3B:**
- Largest model that fits comfortably in 24GB RAM with headroom for concurrent KV cache
- Mixture of Experts architecture — 30B total parameters, 3B active per token — best quality available at this hardware tier
- Thinking mode reasons through ingredient combinations, budget constraints, and portion scaling before producing output, which directly improves recipe quality
- Apache 2.0 licence — fully open source, no restrictions

### 9.3 Concurrency and Queuing

The Cloud Run API layer maintains a request queue. Maximum 2 requests process simultaneously on the Oracle instance to stay safely within RAM limits:

```
Model weights       :  ~17.0 GB
2× KV cache         :  ~3.0 GB
Total at 2 req      :  ~20.0 GB
Headroom remaining  :  ~4.0 GB
```

Additional requests receive a queue position number and an estimated wait time. This is approximately 20 lines of Express middleware on the Cloud Run layer.

### 9.4 Oracle Instance Keepalive

Oracle reclaims idle Always Free instances if CPU usage stays below 20% for 7 consecutive days. A lightweight cron job runs on the instance every 6 hours to prevent reclamation. No user impact.

---

## 10. Tech Stack

| Layer | Technology | Cost |
|-------|-----------|------|
| Frontend | React (Vite) + Tailwind CSS | Free |
| Frontend hosting | Firebase Hosting | Free |
| API layer | Google Cloud Run | Free (2M req/month, always free) |
| AI inference | Oracle Cloud ARM + Ollama | Free forever |
| Model | Qwen3-30B-A3B Q4_K_M | Free (Apache 2.0) |
| Database | Firebase Firestore | Free tier |
| Auth | Firebase Auth (anonymous) | Free tier |
| Translation | Google Translate API | Free (500K chars/month) |
| City data | Community JSON in `/data/` | Free |

**Total running cost: $0**

---

## 11. Result Caching

To reduce queue times, generated meal plan JSONs are cached in Firestore. Before any request reaches Oracle, Cloud Run checks whether an identical result already exists.

### 11.1 Cache Key

```
city + country + people + meals_per_day + budget + exclusions + dataset_last_updated
```

All six parameters must match exactly for a cache hit. The `dataset_last_updated` field comes from the city JSON `meta` block.

### 11.2 Cache Flow

```
Request arrives at Cloud Run
     │
     ▼
Hash the cache key
     │
     ▼
Check Firestore for matching hash
     │
     ├── HIT  → return cached result instantly
     │          no queue, no Oracle call, no wait
     │
     └── MISS → queue → Oracle → generate
                → save result to Firestore cache with hash
                → return result to user
```

### 11.3 Cache Invalidation

When a contributor updates a city dataset, the `last_updated` date in the JSON `meta` block changes. This changes the cache key for all future requests for that city — existing cached results automatically miss and fresh results are generated against the new prices.

This ensures a user never receives a meal plan that was costed against outdated prices. If chicken has increased significantly since the last generation, the cached result is not served — a new one is generated using current prices.

A lightweight cron job on Cloud Run purges orphaned cache entries (those whose `dataset_last_updated` no longer matches the current dataset) on a nightly schedule to keep Firestore tidy.

### 11.4 Cache Storage

Cached results are stored in Firestore under a dedicated collection:

```
/cache/{hash}
  meal_plan       : { ... full meal plan JSON ... }
  city            : string
  country         : string
  dataset_version : string  (dataset_last_updated value)
  cached_at       : Timestamp
```

---

## 12. What This Is Not

- It does not scrape live prices — datasets are manually maintained by contributors
- It does not require user accounts for basic use — anonymous sessions are sufficient
- It does not assume spices are on hand — all ingredients including spices are costed from the dataset
- It is not a subscription product — free to use, open source, no paywalled features
- It does not use the AI for translation — translation is a post-processing step via Google Translate
- It does not show users raw JSON — the frontend always renders a clean, human-readable UI

---

## 13. Work Breakdown Structure

| # | Task | Status |
|---|------|--------|
| 1 | Scaffold Vite + React + Tailwind, connect Firebase | ⬜ Not started |
| 2 | Build Islamabad seed dataset JSON | ⬜ Not started |
| 3 | Build country → city selector, load dataset | ⬜ Not started |
| 4 | Build parameters panel (people, meals, budget, exclusions, language) | ⬜ Not started |
| 5 | Client-side minimum cost calculator | ⬜ Not started |
| 6 | Provision Oracle Cloud ARM instance, install Ollama, pull Qwen3-30B-A3B | ⬜ Not started |
| 7 | Build Express auth + queue server on Oracle instance | ⬜ Not started |
| 8 | Build Cloud Run API layer — queuing, translation, Oracle proxy | ⬜ Not started |
| 9 | Implement AI prompt — system prompt, request, parse JSON response | ⬜ Not started |
| 10 | Build result caching layer — hash generation, Firestore cache read/write | ⬜ Not started |
| 11 | Build cache invalidation cron job — purge stale entries nightly | ⬜ Not started |
| 12 | Build results display — shopping list, recipe cards, cost breakdown | ⬜ Not started |
| 13 | Firestore session + meal plan save | ⬜ Not started |
| 14 | Firestore security rules | ⬜ Not started |
| 15 | Google Translate integration — Urdu and Pashto post-processing | ⬜ Not started |
| 16 | Oracle keepalive cron job | ⬜ Not started |
| 17 | Deploy frontend to Firebase Hosting | ⬜ Not started |
| 18 | End-to-end test — full flow, all three languages | ⬜ Not started |