# CLAUDE.md — SNY Planner Tool
> Ground truth for all AI coding agents (Antigravity, Cursor).
> READ THIS ENTIRE FILE before generating any code.
> If context in this file conflicts with your judgment → this file wins.
> Last updated: 30/5/2026

---

## 0. TL;DR for agent
Build a web app to replace Excel for a PP mesh factory (SNY).
Currently in **Sprint S0** — scaffold only: project structure + database schema + basic UI shell.
Phase 1 goal = endusers enter data into the tool instead of Excel. NO automation. NO calculations yet.
All business formulas are defined but NOT implemented in Phase 1.
When in doubt → STOP and ask. Do not guess.

---

## 1. Project & roles
- **Project name:** SNY Planner Tool
- **Client:** SNY — PP mesh factory, Vietnam (40 weaving machines + Extruder yarn lines)
- **Vendor:** TESO. **Dev:** Tung — PM managing TESO, also direct builder via Antigravity.
- **Pipeline:** Claude (plan/review) → Antigravity + Gemini 3 Pro (build) → Cursor (review + commit GitHub) → Vercel (deploy)
- **Repo:** GitHub (SNY email account). **Database:** Neon.tech (PostgreSQL, SNY email account).
- **MVP purpose:** Reference for TESO production version + direct handover to SNY endusers.

---

## 2. System goal (TO-BE)
Replace 4 disconnected Excel files with 1 system.
Flow: Sales Order → Production Order → Machine Schedule → Material Planning.

**Phase 1 goal (current):** Endusers stop using Excel. Enter data into tool. Get familiar.
**Phase 2 goal (later):** AI reads historical data entered in Phase 1. Automates calculations.

DO NOT build Phase 2 features in Phase 1. No AI suggestions, no auto-scheduling, no formula automation.

---

## 3. Current scope — Phase 1 only

### What endusers need to enter per order (7 core fields)
These are the ONLY required fields for Phase 1 data entry:

| # | Field | Type | Notes |
|---|---|---|---|
| 1 | PI Number | Text | Unique order ID e.g. "Landmasters20-1" |
| 2 | Customer | Text | Customer name |
| 3 | Order Date | Date | |
| 4 | Width (m) | Decimal | e.g. 4.0 |
| 5 | Length (m) | Decimal | e.g. 50.0 |
| 6 | GSM | Integer | e.g. 165 |
| 7 | Color | Text | e.g. "BLACK", "DARK GREEN" |

### Optional fields (enter when available)
- Quantity (rolls)
- UV percentage
- FR flag (yes/no)
- Loading Date
- Description / Item
- Gauge & Denier
- Remark

### Technical fields (entered by technical team only, not planner)
- Mesh type (loại lưới)
- Needle count (số kim)
- Number of frames/dàn (số dàn)
- Other technical specs per order

### Important: 1 PI can have multiple sub-lines
A single PI Number (e.g. "Landmasters20-1") can have multiple product lines:
- Sub-line 1: green mesh 4m × 50m
- Sub-line 2: black mesh 2m × 100m
The unique key is: `[piNumber, subLineIndex]`

### Modules
| Module | Phase 1 status | Notes |
|---|---|---|
| M1 — Production Orders | **FUNCTIONAL** | CRUD 7 core fields + optional fields |
| M2 — Machine Schedule | **MOCK ONLY** | Grid display, no real logic |
| M3 — Materials | **MOCK ONLY** | Static display, no real logic |

M2 and M3 MUST show label: `MOCK — NO CALCULATION LOGIC YET`

---

## 4. Business formulas (defined but NOT implemented in Phase 1)
These formulas are confirmed by SNY. They will be implemented in Phase 2.
DO NOT implement them now. Document them here for reference only.

```
// Auto-calculated fields (Phase 2 only)
qtySqm         = qty × widthM × lengthM
totalWeightKgs = qtySqm × gsm / 1000

// Work Order formulas (Phase 2 only)
yarnPerBeam    = (widthCm × lossFactor × needles × looms) / 2.54 / beamCount
meterPerBeam   = kg × 9,000,000 / yarnCount / denier
kgPerBeam      = meter × yarnCount × denier / 9,000,000
```
Note: `widthCm = widthM × 100`. 1 inch = 2.54cm = 8 needles.

---

## 5. Database schema (PostgreSQL via Prisma on Neon.tech)

```prisma
model ProductionOrder {
  id           String   @id @default(cuid())
  piNumber     String
  subLineIndex Int      @default(1)
  customer     String
  orderDate    DateTime
  widthM       Decimal
  lengthM      Decimal
  gsm          Int
  color        String

  // Optional fields
  qty          Int?
  uvPct        Decimal?
  frFlag       Boolean  @default(false)
  loadingDate  DateTime?
  description  String?
  item         String?
  gaugeDenier  String?
  remark       String?

  // Technical fields (entered by technical team)
  meshType     String?
  needleCount  Int?
  frameCount   Int?
  techSpecs    String?  // JSON string for other technical specs

  // Audit
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([piNumber, subLineIndex])
}
```

Rules:
- Use `Decimal` for all quantity/measurement fields. NEVER `Float` (rounding errors).
- Unique key: `[piNumber, subLineIndex]`
- NO auth model in Phase 1

---

## 6. Tech stack (fixed — do NOT propose changes)
- **Framework:** Next.js 14 App Router + TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL (Neon.tech) + Prisma ORM
- **Form handling:** react-hook-form + zod validation
- **Table:** TanStack Table v8
- **Excel I/O:** SheetJS (xlsx) — for importing existing Excel data
- **Deploy:** Vercel (connected to GitHub, SNY email account)
- **NO auth in Phase 1** — simple open access, add auth in Phase 2

---

## 7. Project folder structure

```
sny-planner/
├── CLAUDE.md                    ← This file. Agent reads first every session.
├── .env.local                   ← Secrets (NEVER commit)
├── .env.example                 ← Template (commit this, no real values)
├── .gitignore
├── package.json
│
├── prisma/
│   ├── schema.prisma            ← DB schema (section 5 above)
│   └── seed.ts                  ← Sample data for testing
│
├── docs/
│   └── specs/                   ← Feature specs from Claude (Stage 1 output)
│       └── m1-data-entry.md     ← Current sprint spec
│
├── src/
│   ├── app/
│   │   ├── page.tsx             ← Home → redirect to /orders
│   │   ├── orders/
│   │   │   ├── page.tsx         ← Order list
│   │   │   ├── new/page.tsx     ← New order form
│   │   │   └── [id]/page.tsx    ← Order detail/edit
│   │   ├── schedule/
│   │   │   └── page.tsx         ← M2 MOCK
│   │   ├── materials/
│   │   │   └── page.tsx         ← M3 MOCK
│   │   └── api/
│   │       └── orders/
│   │           └── route.ts     ← REST API for orders
│   │
│   ├── components/
│   │   ├── orders/              ← M1 components
│   │   │   ├── OrderForm.tsx    ← 7 core fields + optional
│   │   │   └── OrderTable.tsx   ← List with filter/search
│   │   ├── schedule/            ← M2 mock components
│   │   ├── materials/           ← M3 mock components
│   │   └── ui/                  ← Shared UI (Button, Input, etc.)
│   │
│   ├── lib/
│   │   ├── db.ts                ← Prisma client singleton
│   │   ├── validations/
│   │   │   └── order.ts         ← Zod schemas
│   │   └── formulas.ts          ← Business formulas (Phase 2, DO NOT call yet)
│   │
│   └── types/
│       └── index.ts             ← TypeScript types
│
└── public/
```

---

## 8. OUT OF SCOPE — refuse even if asked
- ❌ Auth / login / roles (Phase 2)
- ❌ Auto-calculate qtySqm / totalWeightKgs (Phase 2)
- ❌ Work Order computation (Phase 2)
- ❌ AI scheduling suggestions (Phase 2)
- ❌ M2 / M3 real logic (Phase 2)
- ❌ Statistical reports
- ❌ Real-time / websockets
- ❌ Mobile-first responsive (desktop-first is fine)
- ❌ Migrate all 3,609 historical orders (only import 20 sample rows for testing)
- ❌ Multi-tenancy

If asked for any of above → add to `docs/backlog-phase2.md`, do NOT build.

---

## 9. Code rules (hard)
1. Every npm package must be REAL. If unsure → mark `[UNVERIFIED]`, ask Tung.
2. NEVER hardcode secrets, API keys, connection strings. Use `.env.local` + check `.env.example`.
3. NEVER use absolute paths (`C:\...`, `/Users/...`). Relative paths + `path.join` only.
4. NEVER swallow errors silently. Every catch must log with context.
5. Files > 150 lines → split into smaller files.
6. Business logic comments in Vietnamese. Boilerplate comments in English.
7. Zod validation on both client (form) and server (API route).
8. Query via Prisma only. NO raw SQL string concat.
9. NEVER `dangerouslySetInnerHTML` with user input.
10. NEVER delete files or drop DB without Tung's confirmation.

---

## 10. Sprint plan — Phase 1

| Sprint | Task | Gate |
|---|---|---|
| **S0** | Scaffold: Next.js setup + Prisma schema + Neon connection + folder structure | App runs locally, DB connected |
| **S1** | M1 Order list page: table with search/filter, shows all orders | Can see empty table at /orders |
| **S2** | M1 New order form: 7 core fields + optional fields, save to DB | Can create order, appears in list |
| **S3** | M1 Edit/detail page: view + edit existing order | Can edit order, changes saved |
| **S4** | M2 + M3 mock pages with MOCK label | Pages visible in nav, clearly labeled MOCK |
| **S5** | Excel import: upload .xlsx, parse, preview, confirm import | Can import 20 sample rows from Excel |

Current sprint: **S0**

---

## 11. When to STOP and ask Tung
1. Any spec is ambiguous — do NOT guess
2. Need to add a new npm package — list it + URL first
3. About to edit `CLAUDE.md`, `schema.prisma`, `.env.local` — always ask
4. Any command with `rm`, `delete`, `drop`, `truncate` — always ask
5. Test fails twice in a row — stop, don't patch blindly
6. Task estimate > 1 hour — break it down, re-plan first

Format when stopping:
```
[STOP] Reason: [specific reason]
I need to know: [up to 3 specific questions]
My recommendation: [option A / option B with trade-offs]
```

---

## 12. Commit convention
- Tag `[ai-generated]` for files Antigravity generated
- Tag `[human]` for files Tung wrote manually
- Commit after each sprint that runs successfully
- Tag `v1.0-phase1-complete` when all S0–S5 done
