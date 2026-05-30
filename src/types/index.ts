// src/types/index.ts
// Shared TypeScript types for SNY Planner.
// ProductionOrder types are derived from the Prisma schema so they stay
// in sync automatically — no manual duplication of field definitions.

import type { Prisma } from '@prisma/client'

/**
 * Full ProductionOrder as returned by Prisma (Date objects for timestamps,
 * Prisma.Decimal for uvPct).
 * Use this type inside Server Components where native types are fine.
 */
export type ProductionOrder = Prisma.ProductionOrderGetPayload<object>

/**
 * Serialized version of ProductionOrder safe to pass from a Server Component
 * to a Client Component as props. All non-plain-object types are converted:
 *   - Date fields → ISO string
 *   - Prisma.Decimal (uvPct) → string | null  (Decimal serialises as string over JSON)
 */
export type SerializedProductionOrder = Omit<
  ProductionOrder,
  'orderDate' | 'createdAt' | 'updatedAt' | 'uvPct'
> & {
  orderDate: string
  createdAt: string
  updatedAt: string
  uvPct: string | null
}
