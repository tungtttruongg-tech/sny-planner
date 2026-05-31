# CLAUDE.md — SNY Planner Tool
> Ground truth for all AI coding agents (Antigravity, Cursor).
> READ THIS ENTIRE FILE before generating any code.
> If context in this file conflicts with your judgment → this file wins.
> Last updated: 30/5/2026

---

## 0. TL;DR for agent
Build a web app to replace Excel for a PP mesh factory (SNY).
Currently in **M2 — Machine Schedule Functional** sprint.
Phase 1 complete (S0–S5). UI redesigned (R1 Korean minimal light theme).
Bulk paste import built and working.
When in doubt → STOP and ask. Do not guess.

---

## 1. Project & roles
- **Project name:** SNY Planner Tool
- **Client:** SNY VINA — PP mesh factory, Vietnam. Website: snyvina.net.co
- **Vendor:** TESO. **Dev:** Tung — PM + direct builder via Antigravity.
- **Pipeline:** Claude (plan/review) → Antigravity + Gemini 3 Pro (build) → Cursor (review + commit GitHub) → Vercel (deploy)
- **Repo:** https://github.com/tungtttruongg-tech/sny-planner
- **Database:** Neon.tech PostgreSQL (Singapore region)
- **Live URL:** https://sny-planner.vercel.app
- **Tagged:** v1.0-phase1-complete

---

## 2. System goal (TO-BE)
Replace 4 disconnected Excel files with 1 system.
Flow: Sales Order → Production Order → Machine Schedule → Material Planning.

**Phase 1 (DONE):** Endusers enter data into tool. Stop using Excel.
**Current focus:** M2 Machine Schedule — assign orders to machines manually.
**Phase 2 (later):** AI automation, auto-scheduling, formula calculations.

---

## 3. What is already built — DO NOT rebuild

### S0 ✅ Scaffold
- Next.js 14 App Router + TypeScript + Tailwind
- Prisma 5.22.0 + Neon PostgreSQL
- `.env` + `.env.local` with DATABASE_URL

### S1 ✅ Order list
- `src/app/orders/page.tsx` — server component, KPI cards, table
- `src/components/orders/OrderTable.tsx` — search by PI/Customer

### S2 ✅ New order form
- `src/app/orders/new/page.tsx`
- `src/components/orders/NewOrderForm.tsx` — react-hook-form + zod
- `src/app/api/orders/route.ts` — POST handler

### S3 ✅ Order detail
- `src/app/orders/[id]/page.tsx`
- `src/components/orders/OrderDetail.tsx` — VIEW + EDIT + DELETE
- `src/app/api/orders/[id]/route.ts` — GET/PATCH/DELETE

### S4 ✅ Mock pages
- `src/app/schedule/page.tsx` — will be replaced by M2 functional
- `src/app/materials/page.tsx` — MOCK (Phase 2)

### S5 ✅ Excel import
- `src/app/api/orders/import/route.ts` — parse preview
- `src/app/api/orders/import/confirm/route.ts` — full file import
- `src/components/orders/ImportOrdersModal.tsx`
- `src/lib/excel/parseOrderList.ts`

### R1 ✅ UI Redesign (Korean minimal light theme)
- `src/app/layout.tsx` — top nav + side nav structure
- `src/components/layout/TopNav.tsx` — fixed 64px top nav
- `src/components/layout/SideNav.tsx` — fixed 280px side nav, all items → /orders
- `tailwind.config.ts` — full design system tokens
- Light theme: background #fbf9f8, primary navy #002444

### Bulk Paste ✅
- `src/app/orders/bulk/page.tsx` — paste from Excel → preview → import
- `src/app/api/orders/bulk/route.ts` — POST handler
- `src/lib/excel/parsePastedText.ts` — tab-separated parser

### Packages installed (do NOT reinstall)
- next@14.2.35, react, react-dom, typescript, tailwindcss
- prisma@5.22.0, @prisma/client@5.22.0
- react-hook-form@7.x, zod@4.x, @hookform/resolvers
- xlsx (SheetJS), tsx

### package.json build script (DO NOT change)
```
"build": "prisma generate && next build"
```

---

## 4. Database schema (current)

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
  qty          Int?
  uvPct        Decimal?  @db.Decimal(5,2)
  frFlag       Boolean   @default(false)
  description  String?
  remark       String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  @@unique([piNumber, subLineIndex])
}
```

**Next schema addition for M2:**
```prisma
model MachineAssignment {
  id          String   @id @default(cuid())
  machineId   String   // "M-001" to "M-040"
  orderId     String
  startDate   DateTime
  endDate     DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  order       ProductionOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
  @@unique([machineId, startDate])
}
```

---

## 5. Tech stack (fixed — do NOT change)
- **Framework:** Next.js 14 App Router + TypeScript
- **Styling:** Tailwind CSS (custom design tokens in tailwind.config.ts)
- **Database:** PostgreSQL (Neon.tech) + Prisma 5.22.0
- **Form:** react-hook-form + zod v4
- **Deploy:** Vercel (auto-deploy from GitHub main)
- **Fonts:** Inter + Noto Sans KR + Material Symbols Outlined (via Google Fonts link in layout.tsx)
- **NO auth in Phase 1**

---

## 6. Design system (R1 — Korean minimal light theme)

### Key colors
```
primary: "#002444"          // navy
primary-container: "#1b3a5c"
on-primary: "#ffffff"
background: "#fbf9f8"       // warm white
surface: "#fbf9f8"
surface-container-lowest: "#ffffff"
surface-container-low: "#f6f3f2"
surface-container: "#f0eded"
on-surface: "#1b1c1c"
secondary: "#5e5e5e"
outline-variant: "#c3c6cf"
error: "#ba1a1a"
```

### Layout
- Top nav: fixed, 64px height, `bg-surface`
- Side nav: fixed left, 280px width, starts at top 64px
- Main content: `pl-[280px] pt-[64px]`
- Material Symbols icons: `<span className="material-symbols-outlined">icon_name</span>`

---

## 7. Current sprint — M2 Machine Schedule Functional

### Business rules (confirmed)
- 40 machines: M-001 to M-040 (fixed, no DB table)
- Each slot = 1 machine × 1 day
- Each slot: max 1 order
- Assignment: orderId + machineId + startDate + endDate
- 1 order → 1 machine at a time
- Planner assigns manually — no auto-scheduling

### What to build
1. Add `MachineAssignment` model to schema → `npx prisma db push`
2. API: GET/POST `/api/assignments` + DELETE `/api/assignments/[id]`
3. Schedule page: 40×days grid, click cell → assign/view modal
4. Remove MOCK banner — this is now real
5. AssignModal: select order + end date → save
6. DetailModal: view assignment → remove

### Prompt file
`ANTIGRAVITY_PROMPT_M2.md` already written and ready to paste into Antigravity.

---

## 8. Project folder structure

```
sny-planner/
├── CLAUDE.md
├── .env / .env.local        ← DATABASE_URL (both needed)
├── package.json             ← build: "prisma generate && next build"
├── prisma/schema.prisma
├── src/
│   ├── app/
│   │   ├── orders/          ← list, new, [id], bulk
│   │   ├── schedule/        ← M2 (currently mock, building functional)
│   │   ├── materials/       ← MOCK
│   │   └── api/
│   │       ├── orders/      ← DO NOT MODIFY existing routes
│   │       └── assignments/ ← NEW for M2
│   ├── components/
│   │   ├── layout/          ← TopNav.tsx, SideNav.tsx
│   │   ├── orders/          ← OrderTable, NewOrderForm, OrderDetail, ImportOrdersModal
│   │   └── schedule/        ← NEW: AssignModal.tsx, DetailModal.tsx
│   └── lib/
│       ├── db.ts
│       ├── validations/order.ts
│       └── excel/           ← parseOrderList.ts, parsePastedText.ts
```

---

## 9. Sprint history

| Sprint | Status |
|---|---|
| S0 Scaffold | ✅ Done |
| S1 Order list | ✅ Done |
| S2 New order form | ✅ Done |
| S3 Order detail | ✅ Done |
| S4 M2/M3 mock | ✅ Done |
| S5 Excel import | ✅ Done |
| R1 UI redesign | ✅ Done |
| Bulk paste import | ✅ Done |
| **M2 Machine Schedule** | ⏳ CURRENT |
| M3 Materials functional | ⏳ Phase 2 |
| AI automation | ⏳ Phase 2 |

---

## 10. OUT OF SCOPE — refuse even if asked
- ❌ Auth / login / roles (Phase 2)
- ❌ Auto-calculate formulas (Phase 2)
- ❌ AI scheduling suggestions (Phase 2)
- ❌ M3 real inventory logic (Phase 2)
- ❌ Bulk delete / bulk edit
- ❌ Real-time / websockets
- ❌ Mobile responsive (desktop-first)
- ❌ Multi-tenancy

---

## 11. Code rules (hard)
1. Every npm package must be REAL. Mark `[UNVERIFIED]` if unsure.
2. NEVER hardcode secrets. Use `.env` or `.env.local`.
3. NEVER use absolute paths.
4. NEVER swallow errors silently.
5. Files > 150 lines → split.
6. Business logic comments in Vietnamese. Boilerplate in English.
7. Zod validation on both client AND server.
8. Query via Prisma only. NO raw SQL string concat.
9. NEVER `dangerouslySetInnerHTML` with user input.
10. NEVER delete files or DB without Tung's confirmation.

---

## 12. When to STOP and ask Tung
1. Spec is ambiguous
2. Need new npm package — list URL first
3. About to modify existing API routes in `src/app/api/orders/`
4. Any `rm`, `delete`, `drop`, `truncate` command
5. Test fails twice

Format:
```
[STOP] Reason: [specific]
I need to know: [max 3 questions]
My recommendation: [option A / option B]
```