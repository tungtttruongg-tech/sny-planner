'use server'

import { prisma } from '@/lib/db'

export async function getUnassignedOrders() {
  const orders = await prisma.productionOrder.findMany({
    // Lấy đơn chưa có máy nào — dùng cho dropdown AssignModal
    where: { assignments: { none: {} } },
    select: { id: true, piNumber: true, customer: true },
    orderBy: { createdAt: 'desc' }
  });
  return orders;
}
