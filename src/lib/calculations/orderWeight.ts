// src/lib/calculations/orderWeight.ts
// Server + client safe — pure calculation, no Prisma imports.
// Implements Case A formula: qtySqm × gsm / 1000

export interface OrderWeightInput {
  orderType: string
  widthM?: number | null
  lengthM?: number | null
  gsm?: number | null
  qty?: number | null
  rollLength?: number | null
  pieceLength?: number | null
}

export interface OrderWeightResult {
  totalMeters: number | null
  qtySqm: number | null
  totalWeightKgs: number | null
}

/**
 * Tính diện tích và trọng lượng đơn hàng.
 * Nếu thiếu bất kỳ thông số bắt buộc nào (cho đơn nháp), trả về null cho tất cả giá trị.
 * Tuyệt đối KHÔNG trả về NaN.
 */
export function calculateOrderWeight(input: OrderWeightInput): OrderWeightResult {
  let totalMeters: number | null = null

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
  } else if (input.lengthM != null && input.lengthM > 0) {
    totalMeters = input.lengthM
  }

  if (totalMeters == null || isNaN(totalMeters) || totalMeters <= 0) {
    return { totalMeters: null, qtySqm: null, totalWeightKgs: null }
  }

  if (input.widthM == null || isNaN(input.widthM) || input.widthM <= 0) {
    return { totalMeters, qtySqm: null, totalWeightKgs: null }
  }

  const qtySqm = input.widthM * totalMeters

  if (input.gsm == null || isNaN(input.gsm) || input.gsm <= 0) {
    return { totalMeters, qtySqm, totalWeightKgs: null }
  }

  const totalWeightKgs = (qtySqm * input.gsm) / 1000

  return { totalMeters, qtySqm, totalWeightKgs }
}
