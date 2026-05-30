# CLAUDE.md — SNY Planner Tool
> Ground truth for all AI coding agents (Antigravity, Cursor).
> READ THIS ENTIRE FILE before generating any code.
> If context in this file conflicts with your judgment → this file wins.
> Last updated: 30/5/2026

---

## 0. TL;DR for agent
Build a web app to replace Excel for a PP mesh factory (SNY).
Currently in **Sprint S3** — order detail page: view mode, edit mode via pencil icon, delete with confirmation.
Phase 1 goal = endusers enter data into the tool instead of Excel. NO automation. NO calculations yet.
All business formulas are defined but NOT implemented in Phase 1.
When in doubt → STOP and ask. Do not guess.

---

## 1. Project & roles
- **Project name:** SNY Planner Tool
- **Client:** SNY VINA — PP mesh (lưới nhựa HDPE) factory, Vietnam. Website: snyvina.net.co
- **Vendor:** TESO. **Dev:** Tung — PM managing TESO, also direct builder via Antigravity.
- **Pipeline:** Claude (plan/review) → Antigravity + Gemini 3 Pro (build) → Cursor (review + commit GitHub) → Vercel (deploy)
- **Repo:** https://github.com/tungtttruongg-tech/sny-planner
- **Database:** Neon.tech PostgreSQL (project: sny-planner, region: Singapore)
- **Live URL:** https://sny-planner.vercel.app
- **MVP purpose:** Reference for TESO production version + direct handover to SNY endusers.

---

## 2. System goal (TO-BE)
Replace 4 disconnected Excel files with 1 system.
Flow: Sales Order → Production Order → Machine Schedule → Material Planning.

**Phase 1 goal (current):** Endusers stop using Excel. Enter data into tool. Get familiar.
**Phase 2 goal (later):** AI reads historical data entered in Phase 1. Automates calculations.

DO NOT build Phase 2 features in Phase 1. No AI suggestions, no auto-scheduling, no formula automation.

---

## 3. What is already built — DO NOT rebuild

### S0 ✅ — Scaffold
- Next.js 14 App Router + TypeScript + Tailwind
- Prisma 5.22.0 + Neon PostgreSQL connected
- Basic nav shell: Orders / Schedule (MOCK) / Materials (MOCK)
- `.env` + `.env.local` configured with DATABASE_URL

### S1 ✅ — Order list
- `src/app/orders/page.tsx` — server component, fetches all orders via Prisma
- `src/components/orders/OrderTable.tsx` — client component, 7-column table + live search
- Search by PI Number OR Customer simultaneously
- Shows "Showing X of Y orders" count

### S2 ✅ — New order form
- `src/app/orders/new/page.tsx` — new order page
- `src/components/orders/NewOrderForm.tsx` — form with react-hook-form + zod
- `src/app/api/orders/route.ts` — POST handler, saves to DB
- `src/lib/validations/order.ts` — Zod schemas (createOrderSchema)
- On success: green banner + auto-clear form after 2 seconds
- Duplicate PI + sub-line handled with clear error message
- "New Order" button in list links to /orders/new

### Packages installed (do NOT reinstall)
- next@14.2.35, react, react-dom, typescript, tailwindcss
- prisma@5.22.0, @prisma/client@5.22.0
- react-hook-form@7.x, zod@4.x, @hookform/resolvers@3.x
- tsx (for seed runner)

### package.json build script
```
"build": "prisma generate && next build"
```
This is required for Vercel. DO NOT change it.

---

## 4. Current scope — Phase 1 only

### What endusers need to enter per order (7 core fields)

| # | Field | Type | Notes |
|---|---|---|---|
| 1 | PI Number | Text | Unique order ID e.g. "PI-2026-001" |
| 2 | Sub-line | Int | Default 1. Same PI can have multiple sub-lines |
| 3 | Customer | Text | Customer name |
| 4 | Order Date | Date | |
| 5 | Width (m) | Decimal | e.g. 4.0 |
| 6 | Length (m) | Decimal | e.g. 12000 |
| 7 | GSM | Integer | e.g. 165 |
| 8 | Color | Text | e.g. "BLACK" |

### Optional fields (in DB, enter when available)
- qty (Int), uvPct (Decimal), frFlag (Boolean), description (String), remark (String)

### Important: 1 PI can have multiple sub-lines
Unique key: `[piNumber, subLineIndex]`

### Modules
| Module | Phase 1 status | Notes |
|---|---|---|
| M1 — Production Orders | **FUNCTIONAL** | CRUD complete after S3 |
| M2 — Machine Schedule | **MOCK ONLY** | Grid display, no real logic |
| M3 — Materials | **MOCK ONLY** | Static display, no real logic |

M2 and M3 MUST show label: `MOCK — NO CALCULATION LOGIC YET`

---

## 5. Business formulas (defined but NOT implemented in Phase 1)
DO NOT implement these now. Phase 2 only.

```
qtySqm         = qty × widthM × lengthM
totalWeightKgs = qtySqm × gsm / 1000
yarnPerBeam    = (widthCm × lossFactor × needles × looms) / 2.54 / beamCount
meterPerBeam   = kg × 9,000,000 / yarnCount / denier
kgPerBeam      = meter × yarnCount × denier / 9,000,000
```

---

## 6. Database schema (current — Prisma 5.22.0 on Neon.tech)

```prisma
model ProductionOrder {
  id           String    @id @default(cuid())
  piNumber     String
  subLineIndex Int       @default(1)
  customer     String
  orderDate    DateTime
  widthM       Decimal
  lengthM      Decimal
  gsm          Int
  color        String

  // Optional fields (added in S2)
  qty          Int?
  uvPct        Decimal?  @db.Decimal(5,2)
  frFlag       Boolean   @default(false)
  description  String?
  remark       String?

  // Audit
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@unique([piNumber, subLineIndex])
}
```

Rules:
- Use `Decimal` for all quantity/measurement fields. NEVER `Float`.
- Unique key: `[piNumber, subLineIndex]`
- NO auth model in Phase 1

---

## 7. Tech stack (fixed — do NOT propose changes)
- **Framework:** Next.js 14 App Router + TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL (Neon.tech) + Prisma 5.22.0
- **Form:** react-hook-form + zod (v4) + @hookform/resolvers
- **Deploy:** Vercel (github auto-deploy on push to main)
- **NO auth in Phase 1**

---

## 8. Project folder structure (current state)

```
sny-planner/
├── CLAUDE.md
├── .env                         ← Has DATABASE_URL (Prisma reads this)
├── .env.local                   ← Also has DATABASE_URL (Next.js reads this)
├── .env.example
├── .gitignore
├── package.json                 ← build: "prisma generate && next build"
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                  ← 5 sample orders
│
├── docs/specs/
│   ├── s0-scaffold.md
│   ├── s1-order-list.md
│   └── s2-new-order-form.md
│
├── src/
│   ├── app/
│   │   ├── page.tsx             ← redirect to /orders
│   │   ├── orders/
│   │   │   ├── page.tsx         ← Order list (S1)
│   │   │   ├── new/page.tsx     ← New order form (S2)
│   │   │   └── [id]/page.tsx    ← Order detail ← BUILD THIS IN S3
│   │   ├── schedule/page.tsx    ← MOCK
│   │   ├── materials/page.tsx   ← MOCK
│   │   └── api/orders/
│   │       ├── route.ts         ← POST (S2)
│   │       └── [id]/route.ts    ← GET/PATCH/DELETE ← BUILD THIS IN S3
│   │
│   ├── components/orders/
│   │   ├── OrderTable.tsx       ← S1 (UPDATE in S3: make rows clickable)
│   │   ├── NewOrderForm.tsx     ← S2
│   │   └── OrderDetail.tsx      ← BUILD THIS IN S3
│   │
│   ├── lib/
│   │   ├── db.ts
│   │   └── validations/order.ts ← createOrderSchema (ADD updateOrderSchema in S3)
│   │
│   └── types/index.ts
```

---

## 9. Sprint plan — Phase 1

| Sprint | Task | Status |
|---|---|---|
| S0 | Scaffold + DB + nav shell | ✅ DONE |
| S1 | Order list + search | ✅ DONE |
| S2 | New order form + save to DB | ✅ DONE |
| **S3** | **Order detail: view + edit + delete** | ⏳ CURRENT |
| S4 | M2 + M3 mock pages | ⏳ |
| S5 | Excel import 20 sample rows | ⏳ |

---

## 10. OUT OF SCOPE — refuse even if asked
- ❌ Auth / login / roles (Phase 2)
- ❌ Auto-calculate qtySqm / totalWeightKgs (Phase 2)
- ❌ Work Order computation (Phase 2)
- ❌ AI scheduling suggestions (Phase 2)
- ❌ M2 / M3 real logic (Phase 2)
- ❌ Statistical reports
- ❌ Real-time / websockets
- ❌ Mobile-first responsive (desktop-first is fine)
- ❌ Migrate all 3,609 historical orders (only 20 sample rows for testing)
- ❌ Multi-tenancy
- ❌ Bulk delete / bulk edit

If asked → add to `docs/backlog-phase2.md`, do NOT build.

---

## 11. Code rules (hard)
1. Every npm package must be REAL. If unsure → mark `[UNVERIFIED]`, ask Tung.
2. NEVER hardcode secrets. Use `.env` or `.env.local`.
3. NEVER use absolute paths. Relative paths + `path.join` only.
4. NEVER swallow errors silently. Every catch must log with context.
5. Files > 150 lines → split.
6. Business logic comments in Vietnamese. Boilerplate in English.
7. Zod validation on both client AND server.
8. Query via Prisma only. NO raw SQL string concat.
9. NEVER `dangerouslySetInnerHTML` with user input.
10. NEVER delete files or drop DB without Tung's confirmation.

---

## 12. When to STOP and ask Tung
1. Any spec is ambiguous — do NOT guess
2. Need to add a new npm package — list it + URL first
3. About to edit `CLAUDE.md`, `schema.prisma`, `.env` — always ask
4. Any command with `rm`, `delete`, `drop`, `truncate` — always ask
5. Test fails twice in a row — stop, don't patch blindly

Format:
```
[STOP] Reason: [specific]
I need to know: [max 3 questions]
My recommendation: [option A / option B]
```

---

## 13. Commit convention
- `[ai-generated]` for Antigravity files
- `[human]` for files Tung wrote manually
- Commit after each sprint
- Tag `v1.0-phase1-complete` when S0–S5 all done