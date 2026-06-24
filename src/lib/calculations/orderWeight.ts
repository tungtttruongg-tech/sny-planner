// src/lib/calculations/orderWeight.ts
// Server + client safe — pure calculation, no Prisma imports.
// Implements Case A formula: qtySqm × gsm / 1000

export interface OrderWeightInput {
  orderType: string
  widthM: number
  lengthM: number
  gsm: number
  qty?: number | null
  rollLength?: number | null
  pieceLength?: number | null
}

export interface OrderWeightResult {
  totalMeters: number
  qtySqm: number
  totalWeightKgs: number
}

/**
 * Tính diện tích và trọng lượng đơn hàng.
 *
 * orderType = "meters"  → totalMeters = lengthM
 * orderType = "rolls"   → totalMeters = qty × rollLength
 * orderType = "pieces"  → totalMeters = qty × pieceLength
 *
 * qtySqm         = widthM × totalMeters
 * totalWeightKgs = qtySqm × gsm / 1000
 */
export function calculateOrderWeight(input: OrderWeightInput): OrderWeightResult {
  let totalMeters: number

  if (
    input.orderType === 'rolls' &&
    input.qty != null && input.qty > 0 &&
    input.rollLength != null && input.rollLength > 0
  ) {
    totalMeters = input.qty * Number(input.rollLength)
  } else if (
    input.orderType === 'pieces' &&
    input.qty != null && input.qty > 0 &&
    input.pieceLength != null && input.pieceLength > 0
  ) {
    totalMeters = input.qty * Number(input.pieceLength)
  } else {
    totalMeters = input.lengthM
  }

  const qtySqm         = input.widthM * totalMeters
  const totalWeightKgs = (qtySqm * input.gsm) / 1000

  return { totalMeters, qtySqm, totalWeightKgs }
}
