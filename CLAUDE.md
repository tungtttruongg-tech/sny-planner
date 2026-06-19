# CLAUDE.md — SNY Planner Tool
> Ground truth for all AI coding agents (Antigravity, Cursor).
> READ THIS ENTIRE FILE before generating any code.
> If context in this file conflicts with your judgment → this file wins.
> Last updated: 18/06/2026

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
**Current focus:** Material transaction tracking + Excel import. Next = Auth (NextAuth.js v5) + Work Order formulas.
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

### Multi-machine assignment ✅
- 1 order can run on multiple machines simultaneously (orderId no longer `@unique`).
- `allocatedMeters` field tracks meters per assignment — default 50/50 split.
- OrderDetail page shows "MÁY ĐANG CHẠY" section listing all assignments.
- `AssignFromOrderModal` pre-fills `allocatedMeters` with `order.lengthM / 2`.

### Schedule DetailModal — full order details ✅
- Clicking an assigned cell shows: Width, Length, GSM, Color, MB Code, Qty, Mesh Type, Needle Count, Eyelet, Eyelet Color, Allocated Meters.

### M3 ✅ Materials functional
- CRUD inventory, low stock alerts, summary cards.
- Status badge: **"Chưa đặt ngưỡng"** (grey) when `minThreshold` is null.

### Material Transaction system ✅
- `src/components/materials/AddTransactionModal.tsx` — manual IN/OUT entry with optional MB% field.
- `src/components/materials/TransactionHistoryModal.tsx` — history per material, delete per row.
- `src/app/api/materials/[id]/transactions/route.ts` — GET history, POST new transaction (atomic stock update).
- `src/app/api/materials/[id]/transactions/[txId]/route.ts` — DELETE (reverses stock impact atomically).

### Material Excel Import ✅
- `src/lib/excel/parseMaterialReport.ts` — parses SNY daily HDPE/MB report (FIRST STOCK | IN | HDPE BROKEN | OUT TAPE | REJECT | OUT USING | LAST STOCK).
- `src/components/materials/ImportMaterialReportModal.tsx` — 3-step: upload .xlsx → preview matched/new → confirm.
- `src/app/api/materials/import-transactions/route.ts` — preview only, no DB write.
- `src/app/api/materials/import-transactions/confirm/route.ts` — creates `MaterialTransaction` records, sets `currentStock = lastStock` (file is source of truth), auto-creates unmatched materials with `minThreshold = null`.

### Order type variants ✅
- `NewOrderForm` and `OrderDetail` edit mode support 3 order types with conditional fields:
  - `"meters"`: shows `lengthM` as "Tổng mét".
  - `"rolls"`: shows `qty` (cuộn) + `rollLength` (mét/cuộn), auto-calculates total.
  - `"pieces"`: shows `qty` (tấm) + `pieceLength` (chiều dài tấm), auto-calculates total.

### Eyelet tracking ✅
- `hasEyelet` checkbox + conditional `eyeletColor` field in `NewOrderForm` and `OrderDetail` edit mode.
- Shown in Schedule `DetailModal` when `hasEyelet = true`.

### MB Code field ✅
- `mbCode` text field after Color in order forms — for masterbatch color code tracking (e.g. MYD4501A, 7079, LS309315).

### UX Polish ✅
- Redirect to detail after order creation.
- No top nav tabs.
- Side nav: Production, Schedule, Materials active; Reports, Settings disabled with Phase 2 pill.
- Table row hover states + empty state messages throughout.
- Modal backdrop click to close.

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
  lengthM      Float    // order length in metres (or calculated total for rolls/pieces)
  gsm          Int      // grams per square metre (e.g. 165)
  color        String   // e.g. "BLACK", "WHITE"
  mbCode       String?  // M\u00e3 Masterbatch m\u00e0u \u2014 e.g. "MYD4501A", "7079", "LS309315"

  // Optional order details
  qty          Int?                  // quantity in rolls or pieces
  uvPct        Decimal?  @db.Decimal(5, 2) // UV treatment percentage 0-100
  frFlag       Boolean   @default(false)   // flame-retardant treatment
  description  String?               // free-text order description
  remark       String?               // free-text internal remark

  // Technical specs
  meshType     String?               // Th\u1ec3 lo\u1ea1i l\u01b0\u1edbi
  needleCount  Int?                  // S\u1ed1 kim
  beamCount    Int?                  // S\u1ed1 d\u00e0n

  // Ki\u1ec3u \u0111\u01a1n h\u00e0ng \u2014 x\u00e1c \u0111\u1ecbnh c\u00e1ch t\u00ednh t\u1ed5ng m\u00e9t
  orderType    String   @default("meters")
  // "meters" = t\u1ed5ng m\u00e9t tr\u1ef1c ti\u1ebfp (lengthM)
  // "rolls"  = qty \u00d7 rollLength
  // "pieces" = qty \u00d7 pieceLength

  rollLength   Decimal? @db.Decimal(10, 2) // m\u00e9t/cu\u1ed9n \u2014 ch\u1ec9 d\u00f9ng khi orderType = "rolls"
  pieceLength  Decimal? @db.Decimal(10, 2) // chi\u1ec1u d\u00e0i t\u1ea5m (m) \u2014 ch\u1ec9 d\u00f9ng khi orderType = "pieces"

  // Eyelet \u2014 ph\u1ee5 ki\u1ec7n khoen tr\u00ean s\u1ea3n ph\u1ea9m l\u01b0\u1edbi
  hasEyelet    Boolean  @default(false)  // C\u00f3 eyelet kh\u00f4ng
  eyeletColor  String?                   // M\u00e0u eyelet

  // Workflow status
  status       String   @default("PENDING") // PENDING | IN_PRODUCTION | DONE | CANCELLED

  // dataSource tracking for AI training data quality:
  // "manual" = KH nh\u1eadp tay th\u1eadt \u2192 d\u00f9ng cho AI training
  // "import" = Excel/bulk paste \u2192 d\u00f9ng cho AI training
  // "seed" = demo data do TESO t\u1ea1o \u2192 KH\u00d4NG d\u00f9ng cho AI training
  dataSource   String   @default("manual")

  // Relations \u2014 1 \u0111\u01a1n h\u00e0ng c\u00f3 th\u1ec3 ch\u1ea1y tr\u00ean nhi\u1ec1u m\u00e1y song song
  assignments  MachineAssignment[]

  // Timestamps
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([piNumber, subLineIndex])
  @@index([piNumber])
  @@index([orderDate])
  @@map("production_orders")
}

model Material {
  id           String   @id @default(cuid())
  name         String   // e.g. "MF", "UV 4%", "T\u00e1i ch\u1ebf", "FR", "IR"
  currentStock Decimal  @db.Decimal(10, 2)  // kg hi\u1ec7n c\u00f3
  minThreshold Decimal? @db.Decimal(10, 2)  // ng\u01b0\u1ee1ng t\u1ed1i thi\u1ec3u c\u1ea3nh b\u00e1o \u2014 null = ch\u01b0a \u0111\u1eb7t ng\u01b0\u1ee1ng
  unit         String   @default("kg")
  note         String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  transactions MaterialTransaction[]

  @@map("materials")
}

model MachineAssignment {
  id        String   @id @default(cuid())
  machineId String   // e.g. "M-001" to "M-040"

  // orderId is NOT @unique \u2014 1 order can have multiple machine assignments (parallel production)
  orderId   String
  order     ProductionOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)

  // S\u1ed1 m\u00e9t ph\u00e2n c\u00f4ng cho m\u00e1y n\u00e0y (optional, d\u00f9ng khi chia \u0111\u01a1n)
  allocatedMeters Decimal? @db.Decimal(10, 2)

  startDate DateTime
  endDate   DateTime

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([machineId, startDate])
  @@map("machine_assignments")
}

model MaterialTransaction {
  id         String   @id @default(cuid())
  materialId String
  material   Material @relation(fields: [materialId], references: [id], onDelete: Cascade)

  // txType valid values:
  // "in"         = nh\u1eadp kho
  // "out_using"  = xu\u1ea5t s\u1eed d\u1ee5ng s\u1ea3n xu\u1ea5t
  // "out_broken" = xu\u1ea5t h\u1ecfng (HDPE BROKEN)
  // "out_tape"   = xu\u1ea5t l\u00e0m b\u0103ng keo (OUT TAPE)
  // "out_reject" = xu\u1ea5t reject
  txType     String

  quantityKg Decimal  @db.Decimal(10, 2)   // s\u1ed1 kg
  txDate     DateTime                       // ng\u00e0y giao d\u1ecbch
  mbPct      Decimal? @db.Decimal(5, 2)    // % MB tr\u00ean 1 t\u1ea5n nh\u1ef1a (ch\u1ec9 d\u00f9ng cho lo\u1ea1i MB)
  orderId    String?                        // link \u0111\u01a1n h\u00e0ng n\u1ebfu c\u00f3 (optional)
  note       String?

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([materialId])
  @@index([txDate])
  @@map("material_transactions")
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
│   │       ├── orders/      ← CRUD + import + bulk
│   │       ├── materials/   ← CRUD + [id]/transactions/ + import-transactions/
│   │       └── assignments/ ← schedule CRUD
│   ├── components/
│   │   ├── layout/          ← TopNav.tsx, SideNav.tsx
│   │   ├── orders/          ← OrderTable, NewOrderForm, OrderDetail, ImportOrdersModal
│   │   ├── materials/       ← MaterialsTable, AddMaterialModal, EditMaterialModal,
│   │   │                       AddTransactionModal, TransactionHistoryModal,
│   │   │                       ImportMaterialReportModal
│   │   └── schedule/        ← AssignModal.tsx, DetailModal.tsx, AssignFromOrderModal.tsx
│   ├── lib/
│   │   ├── db.ts
│   │   ├── validations/order.ts
│   │   └── excel/           ← parseOrderList.ts, parsePastedText.ts, parseMaterialReport.ts
│   └── types/index.ts       ← SerializedProductionOrder, ParsedOrder
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
| Multi-machine assignment | ✅ Done |
| Order type variants (rolls/pieces/meters) | ✅ Done |
| MB Code + Eyelet fields | ✅ Done |
| Material Transaction system | ✅ Done |
| Material Excel Import | ✅ Done |

## 9. Next sprints

| Sprint | Task | Status |
|---|---|---|
| Extruder tracking | Theo dõi sản lượng máy kéo sợi theo ngày | ⏳ Chờ Dung confirm scope |
| Work Order formula | Tính số ngày hoàn thành dựa trên sản lượng/ngày | ⏳ Chờ Dung confirm công thức |
| Auth | NextAuth.js v5 — 3 roles: Admin/Planner/Viewer | ⏳ Next |
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