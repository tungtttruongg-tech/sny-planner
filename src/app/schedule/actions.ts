'use server'

import { prisma } from '@/lib/db'

export async function getUnassignedOrders() {
  const orders = await prisma.productionOrder.findMany({
    where: { assignment: null },
    select: { id: true, piNumber: true, customer: true },
    orderBy: { createdAt: 'desc' }
  });
  return orders;
}
