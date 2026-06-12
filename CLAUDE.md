# CLAUDE.md — SNY Planner Tool
> Ground truth for all AI coding agents (Antigravity, Cursor).
> READ THIS ENTIRE FILE before generating any code.
> If context in this file conflicts with your judgment → this file wins.
> Last updated: 10/06/2026

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
**Current focus:** NONE — Phase 1 complete. Next = Auth (NextAuth.js v5) + Work Order formulas.
**Phase 2 (later):** AI automation, auto-scheduling, formula calculations, alerts.

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
- Replaced by real pages in M2/M3

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

### M2 ✅ Machine Schedule functional
- Grid 40×days, assign/edit/remove, overlap check UTC+7.
- `AssignFromOrderModal`: assign from order detail page.

### M3 ✅ Materials functional
- CRUD inventory, low stock alerts, summary cards.

### UX Polish ✅
- Redirect to detail after order creation.
- No top nav tabs.
- Side nav: Production, Schedule, Materials active; Reports, Settings disabled with Phase 2 pill.

### Navigation (current state)
- **Top nav:** logo + Phase 1 badge + bell + avatar only (NO tabs)
- **Side nav:** Production(`/orders`), Schedule(`/schedule`), Materials(`/materials`), Reports(disabled), Settings(disabled)

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
  id           String   @id @default(cuid())

  // PI = Proforma Invoice — the primary order identifier at SNY
  piNumber     String
  // Sub-line index within a PI (0-based). A PI can have multiple fabric specs.
  subLineIndex Int      @default(0)

  // Order info
  customer     String
  orderDate    DateTime

  // Fabric specs
  widthM       Float    // roll width in metres (e.g. 4.0)
  lengthM      Float    // order length in metres
  gsm          Int      // grams per square metre (e.g. 165)
  color        String   // e.g. "BLACK", "WHITE"

  // Optional order details (added S2)
  qty          Int?                  // quantity in rolls
  uvPct        Decimal?  @db.Decimal(5, 2) // UV treatment percentage 0-100
  frFlag       Boolean   @default(false)   // flame-retardant treatment
  description  String?               // free-text order description
  remark       String?               // free-text internal remark

  // Technical specs (added M3)
  meshType     String?               // Thể loại lưới
  needleCount  Int?                  // Số kim
  beamCount    Int?                  // Số dàn

  // Workflow status
  status       String   @default("PENDING") // PENDING | IN_PRODUCTION | DONE | CANCELLED

  // dataSource tracking for AI training data quality:
  // "manual" = KH nhập tay thật → dùng cho AI training
  // "import" = Excel/bulk paste → dùng cho AI training
  // "seed" = demo data do TESO tạo → KHÔNG dùng cho AI training
  dataSource   String   @default("manual")

  // Relations
  assignment   MachineAssignment?

  // Timestamps
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Composite unique constraint: one PI can have many sub-lines but each (PI, subLine) is unique
  @@unique([piNumber, subLineIndex])
  @@index([piNumber])
  @@index([orderDate])
  @@map("production_orders")
}

model Material {
  id           String   @id @default(cuid())
  name         String   // e.g. "MF", "UV 4%", "Tái chế", "FR", "IR"
  currentStock Decimal  @db.Decimal(10, 2)  // kg hiện có
  minThreshold Decimal  @db.Decimal(10, 2)  // ngưỡng tối thiểu cảnh báo
  unit         String   @default("kg")
  note         String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("materials")
}

model MachineAssignment {
  id        String   @id @default(cuid())
  machineId String   // e.g. "M-001" to "M-040"
  
  orderId   String   @unique
  order     ProductionOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  startDate DateTime
  endDate   DateTime

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([machineId, startDate])
  @@map("machine_assignments")
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

## 7. Project folder structure

```
sny-planner/
├── CLAUDE.md
├── .env / .env.local        ← DATABASE_URL (both needed)
├── package.json             ← build: "prisma generate && next build"
├── prisma/schema.prisma
├── src/
│   ├── app/
│   │   ├── orders/          ← list, new, [id], bulk
│   │   ├── schedule/        ← M2 functional
│   │   ├── materials/       ← M3 functional
│   │   └── api/
│   │       ├── orders/      
│   │       ├── materials/   
│   │       └── assignments/ 
│   ├── components/
│   │   ├── layout/          ← TopNav.tsx, SideNav.tsx
│   │   ├── orders/          ← OrderTable, NewOrderForm, OrderDetail, ImportOrdersModal
│   │   ├── materials/       ← MaterialsTable, AddMaterialModal, EditMaterialModal
│   │   └── schedule/        ← AssignModal.tsx, DetailModal.tsx, AssignFromOrderModal.tsx
│   └── lib/
│       ├── db.ts
│       ├── validations/order.ts
│       └── excel/           ← parseOrderList.ts, parsePastedText.ts
```

---

## 8. Sprint history

| Sprint | Status |
|---|---|
| S0 Scaffold | ✅ Done |
| S1 Order list | ✅ Done |
| S2 New order form | ✅ Done |
| S3 Order detail | ✅ Done |
| S4 Mock pages | ✅ Done |
| S5 Excel import | ✅ Done |
| R1 UI redesign | ✅ Done |
| Bulk paste import | ✅ Done |
| M2 Machine Schedule | ✅ Done |
| M3 Materials functional | ✅ Done |
| UX Polish | ✅ Done |

## 9. Next sprints

| Sprint | Task | Status |
|---|---|---|
| Auth | NextAuth.js v5 — 3 roles: Admin/Planner/Viewer | ⏳ Next |
| Work Order | Implement 4 formulas + verification cases A/B/C/D | ⏳ Next |
| Phase 2 AI | AI-1 gợi ý lịch, AI-2 cảnh báo NVL, AI-3 chat tiếng Việt | ⏳ Phase 2 |

---

## 10. OUT OF SCOPE — refuse even if asked
- ❌ Auth / login / roles (Next sprint)
- ❌ Work Order formula calculations (Next sprint)
- ❌ AI scheduling suggestions (Phase 2)
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