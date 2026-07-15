'use server'

// src/app/schedule/actions.ts
// Server actions for the schedule page.
//
// After AssignModal Sub-line Detail sprint:
//   getUnassignedOrders now returns per-sub-line fields (widthM, gsm, color, meshType, lengthM, qty)
//   so AssignModal can show structured label and detail panel.

import { prisma } from '@/lib/db'

export async function getUnassignedOrders() {
  const orders = await prisma.productionOrder.findMany({
    where: {
      status: { not: 'DONE' },
    },
    select: {
      id: true,
      piNumber: true,
      subLineIndex: true,
      customer: true,
      widthM: true,
      gsm: true,
      color: true,
      meshType: true,
      lengthM: true,
      qty: true,
    },
    // Sort: piNumber ASC → subLineIndex ASC so all sub-lines of a PI group together
    orderBy: [{ piNumber: 'asc' }, { subLineIndex: 'asc' }],
  })
  return orders
}
