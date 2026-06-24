'use client'

// src/components/orders/NewOrderForm.tsx
// R1 light theme — all react-hook-form logic unchanged.
// Only classNames updated: light inputs, Inter/Noto typography, primary buttons.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createOrderSchema,
  type CreateOrderInput,
  type CreateOrderOutput,
} from '@/lib/validations/order'
import { calculateOrderWeight } from '@/lib/calculations/orderWeight'

// ── Reusable field wrapper ────────────────────────────────────────────────────

interface FieldProps {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  hint?: string
}

function Field({ label, required, error, children, hint }: FieldProps) {
  return (
    <div className="flex flex-col gap-xs">
      <label className="text-label-sm font-inter font-medium text-on-surface-variant focus-within:text-primary transition-colors">
        {label}
        {required && <span className="text-error ml-1" aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-label-sm font-inter text-outline">{hint}</p>
      )}
      {error && (
        <p className="text-label-sm font-inter text-error flex items-center gap-xs" role="alert">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </p>
      )}
    </div>
  )
}

// ── Input class builder ───────────────────────────────────────────────────────

const inputCls = (isNumeric: boolean, hasError: boolean) =>
  [
    'w-full bg-transparent border-[0.5px] rounded px-md py-[10px]',
    'text-on-surface placeholder:text-outline',
    'focus:outline-none focus:border-primary focus:border-b-2 transition-colors',
    isNumeric ? 'font-mono text-type-mono tabular-nums' : 'font-noto text-body-md',
    hasError ? 'border-error' : 'border-outline-variant',
  ].join(' ')

// ── Main component ────────────────────────────────────────────────────────────

export default function NewOrderForm() {
  const router = useRouter()
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [apiError, setApiError] = useState<string | null>(null)
  const [showOptional, setShowOptional] = useState(false)

  // useForm<InputType, Context, OutputType> — correct generic for schemas with transforms
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateOrderInput, unknown, CreateOrderOutput>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      subLineIndex: 1,
      frFlag: false,
      orderType: 'meters',
      hasEyelet: false,
    },
  })

  // Kiểu đơn hàng — dùng để hiển thị trường có điều kiện
  const orderType          = watch('orderType')
  const watchedQty         = watch('qty')
  const watchedRollLength  = watch('rollLength')
  const watchedPieceLength = watch('pieceLength')
  const watchedHasEyelet   = watch('hasEyelet')
  const watchedWidthM      = watch('widthM')
  const watchedLengthM     = watch('lengthM')
  const watchedGsm         = watch('gsm')

  // Tính tổng mét ước tính (hiển thị read-only)
  const estimatedTotal = (() => {
    if (orderType === 'rolls' && watchedQty && watchedRollLength) {
      return (Number(watchedQty) * Number(watchedRollLength)).toLocaleString()
    }
    if (orderType === 'pieces' && watchedQty && watchedPieceLength) {
      return (Number(watchedQty) * Number(watchedPieceLength)).toLocaleString()
    }
    return null
  })()

  // Tính trọng lượng ước tính (live)
  const estimatedWeight = (() => {
    const w = Number(watchedWidthM)
    const l = Number(watchedLengthM)
    const g = Number(watchedGsm)
    if (!w || !g) return null
    const { totalWeightKgs } = calculateOrderWeight({
      orderType: orderType ?? 'meters',
      widthM: w,
      lengthM: l,
      gsm: g,
      qty: watchedQty ? Number(watchedQty) : null,
      rollLength: watchedRollLength ? Number(watchedRollLength) : null,
      pieceLength: watchedPieceLength ? Number(watchedPieceLength) : null,
    })
    return totalWeightKgs > 0 ? totalWeightKgs.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) : null
  })()

  const onSubmit = async (values: CreateOrderOutput) => {
    setSubmitStatus('saving')
    setApiError(null)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        setApiError(json.error ?? 'An unknown error occurred.')
        setSubmitStatus('error')
        return
      }

      // ── Success path: redirect to the newly created order ──
      router.push(`/orders/${json.order.id}`)
    } catch {
      setApiError('Network error — could not reach the server. Please try again.')
      setSubmitStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-lg">

      {/* ── Global banners ─────────────────────────────────────────────────── */}
      {submitStatus === 'error' && apiError && (
        <div
          role="alert"
          className="flex items-start gap-sm border border-error/40 bg-error-container rounded-lg px-md py-sm"
        >
          <span className="material-symbols-outlined text-[20px] text-error shrink-0 mt-0.5">error</span>
          <div>
            <p className="text-label-md font-inter font-semibold text-error">Could not save order</p>
            <p className="text-label-sm font-inter text-on-error-container mt-0.5">{apiError}</p>
          </div>
        </div>
      )}

      {/* ── Required fields ─────────────────────────────────────────────────── */}
      <section>
        <h2 className="flex items-center gap-sm text-label-sm font-inter font-semibold text-primary uppercase tracking-widest mb-md">
          <span className="material-symbols-outlined text-[16px]">asterisk</span>
          Required fields
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[24px] gap-y-lg">
          {/* PI Number */}
          <Field label="PI Number" required error={errors.piNumber?.message}>
            <input
              id="field-piNumber"
              type="text"
              placeholder="e.g. PI-2024-010"
              className={inputCls(false, !!errors.piNumber)}
              {...register('piNumber')}
            />
          </Field>

          {/* Sub-line index */}
          <Field
            label="Sub-line"
            required
            error={errors.subLineIndex?.message}
            hint="0 = first line of PI, 1 = second line, etc."
          >
            <input
              id="field-subLineIndex"
              type="number"
              min={0}
              step={1}
              className={inputCls(true, !!errors.subLineIndex)}
              {...register('subLineIndex', { valueAsNumber: true })}
            />
          </Field>

          {/* Customer */}
          <Field label="Customer" required error={errors.customer?.message}>
            <input
              id="field-customer"
              type="text"
              placeholder="e.g. ADIDAS VIETNAM"
              className={inputCls(false, !!errors.customer)}
              {...register('customer')}
            />
          </Field>

          {/* Order Date */}
          <Field label="Order Date" required error={errors.orderDate?.message}>
            <input
              id="field-orderDate"
              type="date"
              className={inputCls(false, !!errors.orderDate)}
              {...register('orderDate')}
            />
          </Field>

          {/* Width */}
          <Field label="Width (m)" required error={errors.widthM?.message} hint="Roll width in metres, e.g. 4.0">
            <input
              id="field-widthM"
              type="number"
              min={0.1}
              max={20}
              step={0.1}
              placeholder="e.g. 4.0"
              className={inputCls(true, !!errors.widthM)}
              {...register('widthM', { valueAsNumber: true })}
            />
          </Field>

          {/* Kiểu đơn hàng */}
          <Field label="Kiểu đơn hàng" required>
            <select
              id="field-orderType"
              className={inputCls(false, false)}
              {...register('orderType')}
            >
              <option value="meters">Theo tổng mét</option>
              <option value="rolls">Theo cuộn (qty × mét/cuộn)</option>
              <option value="pieces">Gia công tấm (qty × chiều dài tấm)</option>
            </select>
          </Field>

          {/* Length — chỉ hiện khi orderType = "meters" */}
          {orderType === 'meters' && (
            <Field label="Tổng mét (m)" required error={errors.lengthM?.message} hint="Tổng chiều dài đơn hàng">
              <input
                id="field-lengthM"
                type="number"
                min={1}
                max={100000}
                step={1}
                placeholder="e.g. 12000"
                className={inputCls(true, !!errors.lengthM)}
                {...register('lengthM', { valueAsNumber: true })}
              />
            </Field>
          )}

          {/* Rolls: số cuộn + mét/cuộn */}
          {orderType === 'rolls' && (
            <>
              <Field label="Số cuộn" required error={errors.qty?.message}>
                <input
                  id="field-qty-rolls"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="e.g. 200"
                  className={inputCls(true, !!errors.qty)}
                  {...register('qty', { valueAsNumber: true })}
                />
              </Field>
              <Field label="Mét/cuộn" required error={errors.rollLength?.message} hint="Số mét mỗi cuộn">
                <input
                  id="field-rollLength"
                  type="number"
                  min={0.1}
                  step={0.01}
                  placeholder="e.g. 50"
                  className={inputCls(true, !!errors.rollLength)}
                  {...register('rollLength', { valueAsNumber: true })}
                />
              </Field>
              {/* Cần trường lengthM ẩn — dùng giá trị tính toán */}
              <input type="hidden" {...register('lengthM', { valueAsNumber: true })} value={estimatedTotal ? Number(estimatedTotal.replace(/,/g, '')) : ''} />
            </>
          )}

          {/* Pieces: số tấm + chiều dài tấm */}
          {orderType === 'pieces' && (
            <>
              <Field label="Số tấm" required error={errors.qty?.message}>
                <input
                  id="field-qty-pieces"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="e.g. 4200"
                  className={inputCls(true, !!errors.qty)}
                  {...register('qty', { valueAsNumber: true })}
                />
              </Field>
              <Field label="Chiều dài tấm (m)" required error={errors.pieceLength?.message}>
                <input
                  id="field-pieceLength"
                  type="number"
                  min={0.01}
                  step={0.01}
                  placeholder="e.g. 2.44"
                  className={inputCls(true, !!errors.pieceLength)}
                  {...register('pieceLength', { valueAsNumber: true })}
                />
              </Field>
              {/* Cần trường lengthM ẩn — dùng giá trị tính toán */}
              <input type="hidden" {...register('lengthM', { valueAsNumber: true })} value={estimatedTotal ? Number(estimatedTotal.replace(/,/g, '')) : ''} />
            </>
          )}

          {/* Tổng mét ước tính (read-only, hiện khi rolls hoặc pieces) */}
          {(orderType === 'rolls' || orderType === 'pieces') && estimatedTotal && (
            <Field label="Tổng mét ước tính">
              <div className="w-full bg-surface-container-low border-[0.5px] border-outline-variant rounded px-md py-[10px] font-mono text-type-mono text-on-surface tabular-nums">
                {estimatedTotal} m
              </div>
            </Field>
          )}

          {/* Trọng lượng ước tính — hiện với mọi orderType khi đủ dữ liệu */}
          {estimatedWeight && (
            <Field label="Trọng lượng ước tính (kg)">
              <div className="w-full bg-surface-container-low border-[0.5px] border-outline-variant rounded px-md py-[10px] font-mono text-type-mono text-on-surface tabular-nums">
                {estimatedWeight} kg
              </div>
            </Field>
          )}

          {/* GSM */}
          <Field label="GSM" required error={errors.gsm?.message} hint="Grams per square metre">
            <input
              id="field-gsm"
              type="number"
              min={1}
              max={500}
              step={1}
              placeholder="e.g. 165"
              className={inputCls(true, !!errors.gsm)}
              {...register('gsm', { valueAsNumber: true })}
            />
          </Field>

          {/* Color */}
          <Field label="Color" required error={errors.color?.message}>
            <input
              id="field-color"
              type="text"
              placeholder="e.g. BLACK"
              className={inputCls(false, !!errors.color)}
              {...register('color')}
            />
          </Field>

          {/* MB Code */}
          <Field label="Mã màu (MB Code)" error={errors.mbCode?.message}>
            <input
              id="field-mbCode"
              type="text"
              placeholder="e.g. MYD4501A"
              className={inputCls(false, !!errors.mbCode)}
              {...register('mbCode', {
                setValueAs: (v: string) => (v === '' ? null : v),
              })}
            />
          </Field>
        </div>
      </section>

      {/* ── Optional fields ──────────────────────────────────────────────────── */}
      <section className="border-t-[0.5px] border-outline-variant pt-lg">
        <button
          type="button"
          onClick={() => setShowOptional((v) => !v)}
          className="flex items-center gap-sm text-label-sm font-inter font-medium text-on-surface-variant hover:text-on-surface transition-colors mb-md"
          aria-expanded={showOptional}
        >
          <span
            className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
              showOptional ? 'rotate-180' : ''
            }`}
          >
            expand_more
          </span>
          Optional fields
          <span className="text-label-sm font-inter text-outline">
            (click to {showOptional ? 'hide' : 'show'})
          </span>
        </button>

        {showOptional && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[24px] gap-y-lg bg-surface-container-low border-[0.5px] border-outline-variant rounded-lg p-lg">
            {/* Quantity */}
            <Field label="Quantity (rolls)" error={errors.qty?.message}>
              <input
                id="field-qty"
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 5"
                className={inputCls(true, !!errors.qty)}
                {...register('qty', {
                  setValueAs: (v: string) => (v === '' || v === null ? null : Number(v)),
                })}
              />
            </Field>

            {/* UV % */}
            <Field label="UV %" error={errors.uvPct?.message} hint="0–100">
              <input
                id="field-uvPct"
                type="number"
                min={0}
                max={100}
                step={0.01}
                placeholder="e.g. 3.50"
                className={inputCls(true, !!errors.uvPct)}
                {...register('uvPct', {
                  setValueAs: (v: string) => (v === '' || v === null ? null : Number(v)),
                })}
              />
            </Field>

            {/* FR Flag */}
            <div className="sm:col-span-2 flex items-center gap-sm">
              <input
                id="field-frFlag"
                type="checkbox"
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                {...register('frFlag')}
              />
              <label
                htmlFor="field-frFlag"
                className="text-body-md font-noto text-on-surface cursor-pointer select-none"
              >
                Flame-Retardant (FR) treatment required
              </label>
            </div>

            {/* Eyelet */}
            <div className="sm:col-span-2 flex items-center gap-sm">
              <input
                id="field-hasEyelet"
                type="checkbox"
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                {...register('hasEyelet')}
              />
              <label
                htmlFor="field-hasEyelet"
                className="text-body-md font-noto text-on-surface cursor-pointer select-none"
              >
                Có eyelet
              </label>
            </div>
            {watchedHasEyelet && (
              <Field label="Màu eyelet" error={errors.eyeletColor?.message}>
                <input
                  id="field-eyeletColor"
                  type="text"
                  placeholder="e.g. SILVER, BLACK"
                  className={inputCls(false, !!errors.eyeletColor)}
                  {...register('eyeletColor', {
                    setValueAs: (v: string) => (v === '' ? null : v),
                  })}
                />
              </Field>
            )}

            {/* Description */}
            <div className="sm:col-span-2">
              <Field label="Description" error={errors.description?.message} hint="Max 200 characters">
                <textarea
                  id="field-description"
                  rows={2}
                  placeholder="Free-text order description…"
                  className={`${inputCls(false, !!errors.description)} resize-none`}
                  {...register('description')}
                />
              </Field>
            </div>

            {/* Remark */}
            <div className="sm:col-span-2">
              <Field label="Remark" error={errors.remark?.message} hint="Max 200 characters">
                <textarea
                  id="field-remark"
                  rows={2}
                  placeholder="Internal remark…"
                  className={`${inputCls(false, !!errors.remark)} resize-none`}
                  {...register('remark')}
                />
              </Field>
            </div>

            {/* ── Thông số kỹ thuật ─────────────────────────────────── */}
            <div className="sm:col-span-2">
              <p className="text-label-sm font-inter font-semibold text-primary uppercase tracking-widest mb-md">
                Thông số kỹ thuật
              </p>
            </div>

            {/* Thể loại lưới */}
            <div className="sm:col-span-2">
              <Field label="Thể loại lưới" error={errors.meshType?.message}>
                <input
                  id="field-meshType"
                  type="text"
                  placeholder="e.g. Dệt kim, Dệt thị…"
                  className={inputCls(false, !!errors.meshType)}
                  {...register('meshType', {
                    setValueAs: (v: string) => (v === '' ? null : v),
                  })}
                />
              </Field>
            </div>

            {/* Số kim */}
            <Field label="Số kim" error={errors.needleCount?.message}>
              <input
                id="field-needleCount"
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 28"
                className={inputCls(true, !!errors.needleCount)}
                {...register('needleCount', {
                  setValueAs: (v: string) => (v === '' || v === null ? null : Number(v)),
                })}
              />
            </Field>

            {/* Số dàn */}
            <Field label="Số dàn" error={errors.beamCount?.message}>
              <input
                id="field-beamCount"
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 4"
                className={inputCls(true, !!errors.beamCount)}
                {...register('beamCount', {
                  setValueAs: (v: string) => (v === '' || v === null ? null : Number(v)),
                })}
              />
            </Field>
          </div>
        )}
      </section>

      {/* ── Action buttons ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-md pt-md border-t-[0.5px] border-outline-variant">
        <button
          type="button"
          onClick={() => router.push('/orders')}
          className="inline-flex items-center justify-center gap-sm border border-primary bg-transparent hover:bg-surface-container text-primary text-sm font-medium px-4 py-2 h-9 rounded-md transition-colors"
        >
          Cancel
        </button>

        <button
          id="btn-save-order"
          type="submit"
          disabled={submitStatus === 'saving'}
          className="inline-flex items-center justify-center gap-sm bg-primary text-on-primary text-sm font-medium px-4 py-2 h-9 rounded-md hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {submitStatus === 'saving' ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Saving…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">save</span>
              Save order
            </>
          )}
        </button>
      </div>
    </form>
  )
}
