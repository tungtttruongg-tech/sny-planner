'use client'

// src/components/orders/OrderDetail.tsx
// Client component — VIEW and EDIT modes for a single production order.
// Props: order (serialized, from server component).

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  updateOrderSchema,
  type UpdateOrderInput,
  type UpdateOrderOutput,
} from '@/lib/validations/order'
import type { SerializedProductionOrder } from '@/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Convert ISO datetime string to YYYY-MM-DD for <input type="date"> */
function toDateInputValue(iso: string): string {
  return iso.slice(0, 10)
}

// ── Shared sub-components ─────────────────────────────────────────────────

interface FieldProps {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  hint?: string
}

function FormField({ label, required, error, children, hint }: FieldProps) {
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
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

interface ViewFieldProps {
  label: string
  value: React.ReactNode
  mono?: boolean
}

function ViewField({ label, value, mono }: ViewFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</dt>
      <dd className={`text-sm text-slate-200 ${mono ? 'font-mono' : ''}`}>
        {value ?? <span className="text-slate-600 italic">—</span>}
      </dd>
    </div>
  )
}

const inputCls = (hasError: boolean) =>
  [
    'w-full bg-slate-800 border rounded-lg px-3 py-2 text-sm text-slate-200',
    'placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-colors',
    hasError
      ? 'border-red-500/70 focus:ring-red-500'
      : 'border-slate-700 focus:ring-blue-500',
  ].join(' ')

// ── Main component ────────────────────────────────────────────────────────────

interface OrderDetailProps {
  order: SerializedProductionOrder
}

export default function OrderDetail({ order: initialOrder }: OrderDetailProps) {
  const router = useRouter()
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [currentOrder, setCurrentOrder] = useState<SerializedProductionOrder>(initialOrder)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'error'>('idle')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // ── Edit form ───────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateOrderInput, unknown, UpdateOrderOutput>({
    resolver: zodResolver(updateOrderSchema),
  })

  // Enter edit mode — reset form to current order values
  const enterEdit = () => {
    setSaveError(null)
    reset({
      piNumber: currentOrder.piNumber,
      subLineIndex: currentOrder.subLineIndex,
      customer: currentOrder.customer,
      orderDate: toDateInputValue(currentOrder.orderDate),
      widthM: currentOrder.widthM,
      lengthM: currentOrder.lengthM,
      gsm: currentOrder.gsm,
      color: currentOrder.color,
      qty: currentOrder.qty,
      uvPct: currentOrder.uvPct != null ? parseFloat(currentOrder.uvPct) : null,
      frFlag: currentOrder.frFlag,
      description: currentOrder.description ?? '',
      remark: currentOrder.remark ?? '',
    })
    setMode('edit')
  }

  const cancelEdit = () => {
    setSaveError(null)
    setMode('view')
  }

  // Save changes via PATCH
  const onSave = async (values: UpdateOrderOutput) => {
    setSaveError(null)
    try {
      const res = await fetch(`/api/orders/${currentOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        setSaveError(json.error ?? 'An unknown error occurred.')
        return
      }

      // The JSON response has Date fields serialised as ISO strings by JSON.stringify
      // and Decimal uvPct as its string representation — already in SerializedProductionOrder shape.
      setCurrentOrder(json.order as SerializedProductionOrder)
      setMode('view')
    } catch {
      setSaveError('Network error — could not reach the server.')
    }
  }

  // Delete order
  const handleDelete = async () => {
    setDeleteStatus('deleting')
    setDeleteError(null)
    try {
      const res = await fetch(`/api/orders/${currentOrder.id}`, { method: 'DELETE' })
      const json = await res.json()

      if (!res.ok || !json.success) {
        setDeleteError(json.error ?? 'Could not delete order.')
        setDeleteStatus('error')
        return
      }

      router.push('/orders')
    } catch {
      setDeleteError('Network error — could not reach the server.')
      setDeleteStatus('error')
    }
  }

  // ── VIEW mode ─────────────────────────────────────────────────────────────

  if (mode === 'view') {
    return (
      <div className="space-y-6">
        {/* Action bar */}
        <div className="flex items-center justify-end gap-2">
          {/* Edit (pencil) */}
          <button
            id="btn-edit-order"
            onClick={enterEdit}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            title="Edit order"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.415.586H9v-2.414a2 2 0 01.586-1.415z" />
            </svg>
            Edit
          </button>

          {/* Delete */}
          <button
            id="btn-delete-order"
            onClick={() => { setShowDeleteDialog(true); setDeleteError(null); setDeleteStatus('idle') }}
            className="inline-flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 hover:text-red-300 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>

        {/* Field grid */}
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          <ViewField label="PI Number" value={currentOrder.piNumber} mono />
          <ViewField label="Sub-line" value={currentOrder.subLineIndex} />
          <ViewField label="Customer" value={currentOrder.customer} />
          <ViewField
            label="Order Date"
            value={formatDate(currentOrder.orderDate)}
          />
          <ViewField label="Width (m)" value={currentOrder.widthM.toFixed(1)} />
          <ViewField label="Length (m)" value={currentOrder.lengthM.toLocaleString()} />
          <ViewField label="GSM" value={currentOrder.gsm} />
          <ViewField label="Color" value={currentOrder.color} />
        </dl>

        {/* Optional fields — only show if any have a value */}
        {(currentOrder.qty != null ||
          currentOrder.uvPct != null ||
          currentOrder.frFlag ||
          currentOrder.description ||
          currentOrder.remark) && (
          <div className="border-t border-slate-800 pt-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Optional details
            </p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              {currentOrder.qty != null && (
                <ViewField label="Quantity (rolls)" value={currentOrder.qty} />
              )}
              {currentOrder.uvPct != null && (
                <ViewField label="UV %" value={`${parseFloat(currentOrder.uvPct).toFixed(2)}%`} />
              )}
              <ViewField
                label="FR Treatment"
                value={
                  currentOrder.frFlag ? (
                    <span className="text-amber-400 font-medium">Required</span>
                  ) : (
                    <span className="text-slate-500">Not required</span>
                  )
                }
              />
              {currentOrder.description && (
                <div className="sm:col-span-2">
                  <ViewField label="Description" value={currentOrder.description} />
                </div>
              )}
              {currentOrder.remark && (
                <div className="sm:col-span-2">
                  <ViewField label="Remark" value={currentOrder.remark} />
                </div>
              )}
            </dl>
          </div>
        )}

        {/* System fields */}
        <div className="border-t border-slate-800 pt-5">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            <ViewField label="Status" value={
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                ${currentOrder.status === 'PENDING' ? 'bg-slate-700 text-slate-300' : ''}
                ${currentOrder.status === 'IN_PRODUCTION' ? 'bg-blue-900/60 text-blue-300' : ''}
                ${currentOrder.status === 'DONE' ? 'bg-emerald-900/60 text-emerald-300' : ''}
                ${currentOrder.status === 'CANCELLED' ? 'bg-red-900/40 text-red-400' : ''}
              `}>
                {currentOrder.status}
              </span>
            } />
            <ViewField label="Order ID" value={currentOrder.id} mono />
            <ViewField label="Created" value={formatDateTime(currentOrder.createdAt)} />
            <ViewField label="Last Updated" value={formatDateTime(currentOrder.updatedAt)} />
          </dl>
        </div>

        {/* Delete confirmation dialog */}
        {showDeleteDialog && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => { if (deleteStatus !== 'deleting') setShowDeleteDialog(false) }}
            />
            {/* Dialog card */}
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <div>
                  <h2 id="dialog-title" className="text-white font-semibold text-base">
                    Delete this order?
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Are you sure you want to delete{' '}
                    <span className="font-mono text-slate-200">{currentOrder.piNumber}</span>
                    {currentOrder.subLineIndex > 0 && ` (line ${currentOrder.subLineIndex + 1})`}?
                    This cannot be undone.
                  </p>
                </div>
              </div>

              {deleteStatus === 'error' && deleteError && (
                <p className="text-xs text-red-400 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {deleteError}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  id="btn-cancel-delete"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={deleteStatus === 'deleting'}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-delete"
                  onClick={handleDelete}
                  disabled={deleteStatus === 'deleting'}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {deleteStatus === 'deleting' ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Deleting…
                    </>
                  ) : (
                    'Confirm Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── EDIT mode ─────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit(onSave)} noValidate className="space-y-8">
      {/* Save error banner */}
      {saveError && (
        <div role="alert" className="flex items-start gap-3 border border-red-500/40 bg-red-500/10 rounded-xl px-5 py-4">
          <span className="text-red-400 text-xl mt-0.5 shrink-0">✕</span>
          <div>
            <p className="text-red-300 font-semibold text-sm">Could not save changes</p>
            <p className="text-red-400/80 text-xs mt-0.5">{saveError}</p>
          </div>
        </div>
      )}

      {/* Required fields */}
      <section>
        <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-blue-500 rounded-full" aria-hidden="true" />
          Required fields
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField label="PI Number" required error={errors.piNumber?.message}>
            <input
              id="edit-piNumber"
              type="text"
              className={inputCls(!!errors.piNumber)}
              {...register('piNumber')}
            />
          </FormField>

          <FormField label="Sub-line" required error={errors.subLineIndex?.message}
            hint="0 = first line of PI, 1 = second, etc.">
            <input
              id="edit-subLineIndex"
              type="number"
              min={0}
              step={1}
              className={inputCls(!!errors.subLineIndex)}
              {...register('subLineIndex', { valueAsNumber: true })}
            />
          </FormField>

          <FormField label="Customer" required error={errors.customer?.message}>
            <input
              id="edit-customer"
              type="text"
              className={inputCls(!!errors.customer)}
              {...register('customer')}
            />
          </FormField>

          <FormField label="Order Date" required error={errors.orderDate?.message}>
            <input
              id="edit-orderDate"
              type="date"
              className={inputCls(!!errors.orderDate)}
              {...register('orderDate')}
            />
          </FormField>

          <FormField label="Width (m)" required error={errors.widthM?.message}>
            <input
              id="edit-widthM"
              type="number"
              min={0.1}
              max={20}
              step={0.1}
              className={inputCls(!!errors.widthM)}
              {...register('widthM', { valueAsNumber: true })}
            />
          </FormField>

          <FormField label="Length (m)" required error={errors.lengthM?.message}>
            <input
              id="edit-lengthM"
              type="number"
              min={1}
              max={100000}
              step={1}
              className={inputCls(!!errors.lengthM)}
              {...register('lengthM', { valueAsNumber: true })}
            />
          </FormField>

          <FormField label="GSM" required error={errors.gsm?.message}>
            <input
              id="edit-gsm"
              type="number"
              min={1}
              max={500}
              step={1}
              className={inputCls(!!errors.gsm)}
              {...register('gsm', { valueAsNumber: true })}
            />
          </FormField>

          <FormField label="Color" required error={errors.color?.message}>
            <input
              id="edit-color"
              type="text"
              className={inputCls(!!errors.color)}
              {...register('color')}
            />
          </FormField>
        </div>
      </section>

      {/* Optional fields */}
      <section>
        <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-slate-600 rounded-full" aria-hidden="true" />
          Optional fields
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border border-slate-800 rounded-xl p-5 bg-slate-900/30">
          <FormField label="Quantity (rolls)" error={errors.qty?.message}>
            <input
              id="edit-qty"
              type="number"
              min={1}
              step={1}
              className={inputCls(!!errors.qty)}
              {...register('qty', {
                setValueAs: (v: string) => (v === '' || v === null) ? null : Number(v),
              })}
            />
          </FormField>

          <FormField label="UV %" error={errors.uvPct?.message} hint="0–100">
            <input
              id="edit-uvPct"
              type="number"
              min={0}
              max={100}
              step={0.01}
              className={inputCls(!!errors.uvPct)}
              {...register('uvPct', {
                setValueAs: (v: string) => (v === '' || v === null) ? null : Number(v),
              })}
            />
          </FormField>

          <div className="sm:col-span-2 flex items-center gap-3">
            <input
              id="edit-frFlag"
              type="checkbox"
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 cursor-pointer"
              {...register('frFlag')}
            />
            <label htmlFor="edit-frFlag" className="text-sm text-slate-300 cursor-pointer select-none">
              Flame-Retardant (FR) treatment required
            </label>
          </div>

          <div className="sm:col-span-2">
            <FormField label="Description" error={errors.description?.message} hint="Max 200 characters">
              <textarea
                id="edit-description"
                rows={2}
                className={`${inputCls(!!errors.description)} resize-none`}
                {...register('description')}
              />
            </FormField>
          </div>

          <div className="sm:col-span-2">
            <FormField label="Remark" error={errors.remark?.message} hint="Max 200 characters">
              <textarea
                id="edit-remark"
                rows={2}
                className={`${inputCls(!!errors.remark)} resize-none`}
                {...register('remark')}
              />
            </FormField>
          </div>
        </div>
      </section>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={cancelEdit}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          id="btn-save-changes"
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {isSubmitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Saving…
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </form>
  )
}
