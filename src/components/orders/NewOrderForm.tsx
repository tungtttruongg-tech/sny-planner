'use client'

// src/components/orders/NewOrderForm.tsx
// Client component — New Production Order form.
// Uses react-hook-form + zod resolver for client-side validation.
// POSTs to /api/orders, shows success/error banners, auto-clears on success.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createOrderSchema,
  type CreateOrderInput,
  type CreateOrderOutput,
} from '@/lib/validations/order'

// ── Reusable field wrapper ───────────────────────────────────────────────────

interface FieldProps {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  hint?: string
}

function Field({ label, required, error, children, hint }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1" role="alert">
          <svg
            className="w-3 h-3 shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

// ── Shared input class builder ───────────────────────────────────────────────

const inputCls = (hasError: boolean) =>
  [
    'w-full bg-slate-800 border rounded-lg px-3 py-2 text-sm text-slate-200',
    'placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent',
    'transition-colors',
    hasError
      ? 'border-red-500/70 focus:ring-red-500'
      : 'border-slate-700 focus:ring-blue-500',
  ].join(' ')

// ── Main component ───────────────────────────────────────────────────────────

export default function NewOrderForm() {
  const router = useRouter()
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'saving' | 'success' | 'error'
  >('idle')
  const [apiError, setApiError] = useState<string | null>(null)
  const [showOptional, setShowOptional] = useState(false)

  // useForm<InputType, Context, OutputType> — the correct generic signature for
  // schemas with transforms (e.g. .trim(), .toUpperCase()) in @hookform/resolvers v5
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
      setApiError(
        'Network error — could not reach the server. Please try again.',
      )
      setSubmitStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      {/* ── Global banners ──────────────────────────────────────────────── */}
      {submitStatus === 'success' && (
        <div
          role="status"
          className="flex items-center gap-3 border border-emerald-500/40 bg-emerald-500/10 rounded-xl px-5 py-4"
        >
          <span className="text-emerald-400 text-xl shrink-0">✓</span>
          <p className="text-emerald-300 font-semibold text-sm">
            Order saved successfully — form will clear in 2 seconds
          </p>
        </div>
      )}

      {submitStatus === 'error' && apiError && (
        <div
          role="alert"
          className="flex items-start gap-3 border border-red-500/40 bg-red-500/10 rounded-xl px-5 py-4"
        >
          <span className="text-red-400 text-xl mt-0.5 shrink-0">✕</span>
          <div>
            <p className="text-red-300 font-semibold text-sm">
              Could not save order
            </p>
            <p className="text-red-400/80 text-xs mt-0.5">{apiError}</p>
          </div>
        </div>
      )}

      {/* ── Required fields ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <span
            className="w-1.5 h-4 bg-blue-500 rounded-full"
            aria-hidden="true"
          />
          Required fields
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* PI Number */}
          <Field label="PI Number" required error={errors.piNumber?.message}>
            <input
              id="field-piNumber"
              type="text"
              placeholder="e.g. PI-2024-010"
              className={inputCls(!!errors.piNumber)}
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
              className={inputCls(!!errors.subLineIndex)}
              {...register('subLineIndex', { valueAsNumber: true })}
            />
          </Field>

          {/* Customer */}
          <Field label="Customer" required error={errors.customer?.message}>
            <input
              id="field-customer"
              type="text"
              placeholder="e.g. ADIDAS VIETNAM"
              className={inputCls(!!errors.customer)}
              {...register('customer')}
            />
          </Field>

          {/* Order Date */}
          <Field label="Order Date" required error={errors.orderDate?.message}>
            <input
              id="field-orderDate"
              type="date"
              className={inputCls(!!errors.orderDate)}
              {...register('orderDate')}
            />
          </Field>

          {/* Width */}
          <Field
            label="Width (m)"
            required
            error={errors.widthM?.message}
            hint="Roll width in metres, e.g. 4.0"
          >
            <input
              id="field-widthM"
              type="number"
              min={0.1}
              max={20}
              step={0.1}
              placeholder="e.g. 4.0"
              className={inputCls(!!errors.widthM)}
              {...register('widthM', { valueAsNumber: true })}
            />
          </Field>

          {/* Length */}
          <Field
            label="Length (m)"
            required
            error={errors.lengthM?.message}
            hint="Order length in metres"
          >
            <input
              id="field-lengthM"
              type="number"
              min={1}
              max={100000}
              step={1}
              placeholder="e.g. 12000"
              className={inputCls(!!errors.lengthM)}
              {...register('lengthM', { valueAsNumber: true })}
            />
          </Field>

          {/* GSM */}
          <Field
            label="GSM"
            required
            error={errors.gsm?.message}
            hint="Grams per square metre"
          >
            <input
              id="field-gsm"
              type="number"
              min={1}
              max={500}
              step={1}
              placeholder="e.g. 165"
              className={inputCls(!!errors.gsm)}
              {...register('gsm', { valueAsNumber: true })}
            />
          </Field>

          {/* Color */}
          <Field label="Color" required error={errors.color?.message}>
            <input
              id="field-color"
              type="text"
              placeholder="e.g. BLACK"
              className={inputCls(!!errors.color)}
              {...register('color')}
            />
          </Field>
        </div>
      </section>

      {/* ── Optional fields ─────────────────────────────────────────────── */}
      <section>
        <button
          type="button"
          onClick={() => setShowOptional((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors mb-4"
          aria-expanded={showOptional}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${showOptional ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="flex items-center gap-2">
            Optional fields
            <span className="text-xs font-normal text-slate-500">
              (click to {showOptional ? 'hide' : 'show'})
            </span>
          </span>
        </button>

        {showOptional && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border border-slate-800 rounded-xl p-5 bg-slate-900/30">
            {/* Quantity */}
            <Field label="Quantity (rolls)" error={errors.qty?.message}>
              <input
                id="field-qty"
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 5"
                className={inputCls(!!errors.qty)}
                {...register('qty', {
                  setValueAs: (v: string) =>
                    v === '' || v === null ? null : Number(v),
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
                className={inputCls(!!errors.uvPct)}
                {...register('uvPct', {
                  setValueAs: (v: string) =>
                    v === '' || v === null ? null : Number(v),
                })}
              />
            </Field>

            {/* FR Flag — full-width checkbox */}
            <div className="sm:col-span-2 flex items-center gap-3">
              <input
                id="field-frFlag"
                type="checkbox"
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer"
                {...register('frFlag')}
              />
              <label
                htmlFor="field-frFlag"
                className="text-sm text-slate-300 cursor-pointer select-none"
              >
                Flame-Retardant (FR) treatment required
              </label>
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <Field
                label="Description"
                error={errors.description?.message}
                hint="Max 200 characters"
              >
                <textarea
                  id="field-description"
                  rows={2}
                  placeholder="Free-text order description…"
                  className={`${inputCls(!!errors.description)} resize-none`}
                  {...register('description')}
                />
              </Field>
            </div>

            {/* Remark */}
            <div className="sm:col-span-2">
              <Field
                label="Remark"
                error={errors.remark?.message}
                hint="Max 200 characters"
              >
                <textarea
                  id="field-remark"
                  rows={2}
                  placeholder="Internal remark…"
                  className={`${inputCls(!!errors.remark)} resize-none`}
                  {...register('remark')}
                />
              </Field>
            </div>
          </div>
        )}
      </section>

      {/* ── Action buttons ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={() => router.push('/orders')}
          className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          Cancel
        </button>

        <button
          id="btn-save-order"
          type="submit"
          disabled={submitStatus === 'saving' || submitStatus === 'success'}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {submitStatus === 'saving' ? (
            <>
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Saving…
            </>
          ) : submitStatus === 'success' ? (
            <>
              <span>✓</span>
              Saved
            </>
          ) : (
            'Save Order'
          )}
        </button>
      </div>
    </form>
  )
}
