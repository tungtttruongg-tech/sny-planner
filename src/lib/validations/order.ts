// src/lib/validations/order.ts
// Zod v4 validation schema for creating a new ProductionOrder.
// Used on BOTH client (react-hook-form resolver) and server (API route).

import { z } from 'zod'

export const createOrderSchema = z.object({
  // ── Required fields ────────────────────────────────────────────────────────
  piNumber: z
    .string()
    .min(1, 'PI Number is required')
    .max(50, 'PI Number must be 50 characters or fewer')
    .transform((v) => v.trim()),

  subLineIndex: z
    .number()
    .int('Sub-line must be a whole number')
    .min(0, 'Sub-line must be 0 or greater')
    .default(1),

  customer: z
    .string()
    .min(1, 'Customer is required')
    .max(100, 'Customer must be 100 characters or fewer')
    .transform((v) => v.trim()),

  orderDate: z
    .string()
    .min(1, 'Order date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Order date must be a valid date (YYYY-MM-DD)'),

  widthM: z
    .number()
    .gt(0, 'Width must be greater than 0')
    .max(20, 'Width must be 20 m or less'),

  lengthM: z
    .number()
    .gt(0, 'Length must be greater than 0')
    .max(100_000, 'Length must be 100,000 m or less'),

  gsm: z
    .number()
    .int('GSM must be a whole number')
    .gt(0, 'GSM must be greater than 0')
    .max(500, 'GSM must be 500 or less'),

  color: z
    .string()
    .min(1, 'Color is required')
    .max(50, 'Color must be 50 characters or fewer')
    .transform((v) => v.trim().toUpperCase()),

  // ── Optional fields ────────────────────────────────────────────────────────
  qty: z
    .number()
    .int('Quantity must be a whole number')
    .gt(0, 'Quantity must be greater than 0')
    .nullable()
    .optional(),

  uvPct: z
    .number()
    .min(0, 'UV% must be between 0 and 100')
    .max(100, 'UV% must be between 0 and 100')
    .nullable()
    .optional(),

  frFlag: z.boolean().default(false),

  description: z
    .string()
    .max(200, 'Description must be 200 characters or fewer')
    .transform((v) => v.trim())
    .nullable()
    .optional(),

  remark: z
    .string()
    .max(200, 'Remark must be 200 characters or fewer')
    .transform((v) => v.trim())
    .nullable()
    .optional(),

  // Technical specs
  meshType: z
    .string()
    .max(100, 'Thể loại lưới must be 100 characters or fewer')
    .transform((v) => v.trim())
    .nullable()
    .optional(),

  needleCount: z
    .number()
    .int('Số kim must be a whole number')
    .positive('Số kim must be positive')
    .nullable()
    .optional(),

  beamCount: z
    .number()
    .int('Số dàn must be a whole number')
    .positive('Số dàn must be positive')
    .nullable()
    .optional(),
})

/** TypeScript type inferred from the Zod schema input (before transforms). */
export type CreateOrderInput = z.input<typeof createOrderSchema>

/** TypeScript type after Zod transforms (e.g. trim, toUpperCase applied). */
export type CreateOrderOutput = z.output<typeof createOrderSchema>

// ── Update schema (PATCH) ──────────────────────────────────────────────────
// All fields optional — allows partial updates. Same validation rules as create.

export const updateOrderSchema = z.object({
  piNumber: z
    .string()
    .min(1, 'PI Number is required')
    .max(50, 'PI Number must be 50 characters or fewer')
    .transform((v) => v.trim())
    .optional(),

  subLineIndex: z
    .number()
    .int('Sub-line must be a whole number')
    .min(0, 'Sub-line must be 0 or greater')
    .optional(),

  customer: z
    .string()
    .min(1, 'Customer is required')
    .max(100, 'Customer must be 100 characters or fewer')
    .transform((v) => v.trim())
    .optional(),

  orderDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Order date must be a valid date (YYYY-MM-DD)')
    .optional(),

  widthM: z
    .number()
    .gt(0, 'Width must be greater than 0')
    .max(20, 'Width must be 20 m or less')
    .optional(),

  lengthM: z
    .number()
    .gt(0, 'Length must be greater than 0')
    .max(100_000, 'Length must be 100,000 m or less')
    .optional(),

  gsm: z
    .number()
    .int('GSM must be a whole number')
    .gt(0, 'GSM must be greater than 0')
    .max(500, 'GSM must be 500 or less')
    .optional(),

  color: z
    .string()
    .min(1, 'Color is required')
    .max(50, 'Color must be 50 characters or fewer')
    .transform((v) => v.trim().toUpperCase())
    .optional(),

  qty: z
    .number()
    .int('Quantity must be a whole number')
    .gt(0, 'Quantity must be greater than 0')
    .nullable()
    .optional(),

  uvPct: z
    .number()
    .min(0, 'UV% must be between 0 and 100')
    .max(100, 'UV% must be between 0 and 100')
    .nullable()
    .optional(),

  frFlag: z.boolean().optional(),

  description: z
    .string()
    .max(200, 'Description must be 200 characters or fewer')
    .transform((v) => v.trim())
    .nullable()
    .optional(),

  remark: z
    .string()
    .max(200, 'Remark must be 200 characters or fewer')
    .transform((v) => v.trim())
    .nullable()
    .optional(),

  // Technical specs
  meshType: z
    .string()
    .max(100, 'Thể loại lưới must be 100 characters or fewer')
    .transform((v) => v.trim())
    .nullable()
    .optional(),

  needleCount: z
    .number()
    .int('Số kim must be a whole number')
    .positive('Số kim must be positive')
    .nullable()
    .optional(),

  beamCount: z
    .number()
    .int('Số dàn must be a whole number')
    .positive('Số dàn must be positive')
    .nullable()
    .optional(),
})

/** Input type for PATCH (before transforms). */
export type UpdateOrderInput = z.input<typeof updateOrderSchema>

/** Output type for PATCH (after transforms). */
export type UpdateOrderOutput = z.output<typeof updateOrderSchema>
