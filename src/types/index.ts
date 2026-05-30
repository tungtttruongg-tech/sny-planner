// src/types/index.ts
// Shared TypeScript types for SNY Planner.
// ProductionOrder types are derived from the Prisma schema so they stay
// in sync automatically — no manual duplication of field definitions.

import type { Prisma } from '@prisma/client'

/**
 * Full ProductionOrder as returned by Prisma (Date objects for timestamps).
 * Use this type inside Server Components where Date objects are fine.
 */
export type ProductionOrder = Prisma.ProductionOrderGetPayload<object>

/**
 * Serialized version of ProductionOrder safe to pass from a Server Component
 * to a Client Component as props. All Date fields are converted to ISO strings
 * to avoid Next.js hydration warnings about non-plain objects.
 */
export type SerializedProductionOrder = Omit<
  ProductionOrder,
  'orderDate' | 'createdAt' | 'updatedAt'
> & {
  orderDate: string
  createdAt: string
  updatedAt: string
}
