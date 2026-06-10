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
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'saving' | 'success' | 'error'
  >('idle')
  const [apiError, setApiError] = useState<string | null>(null)
  const [showOptional, setShowOptional] = useState(false)

  // useForm<InputType, Context, OutputType> — correct generic for schemas with transforms
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateOrderInput, unknown, CreateOrderOutput>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      subLineIndex: 1,
      frFlag: false,
    },
  })

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

      // ── Success path ──
      setSubmitStatus('success')

      // Auto-clear form after 2 s
      setTimeout(() => {
        reset()
        setShowOptional(false)
      }, 2000)

      // Hide success banner after 3 s
      setTimeout(() => {
        setSubmitStatus('idle')
      }, 3000)
    } catch {
      setApiError('Network error — could not reach the server. Please try again.')
      setSubmitStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-lg">

      {/* ── Global banners ─────────────────────────────────────────────────── */}
      {submitStatus === 'success' && (
        <div
          role="status"
          className="flex items-center gap-sm border border-[#22c55e]/40 bg-[#f0fdf4] rounded-lg px-md py-sm"
        >
          <span className="material-symbols-outlined text-[20px] text-[#15803d]">check_circle</span>
          <p className="text-label-md font-inter font-medium text-[#15803d]">
            Order saved — form will clear in 2 seconds
          </p>
        </div>
      )}

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

          {/* Length */}
          <Field label="Length (m)" required error={errors.lengthM?.message} hint="Order length in metres">
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
          disabled={submitStatus === 'saving' || submitStatus === 'success'}
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
          ) : submitStatus === 'success' ? (
            <>
              <span className="material-symbols-outlined text-[18px]">check</span>
              Saved
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
