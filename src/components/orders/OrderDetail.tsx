'use client'

// src/components/orders/OrderDetail.tsx
// R1 light theme — all state/form/API logic unchanged from S3.
// Only classNames updated: light surface, primary/error buttons, outline-variant dividers.

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function toDateInputValue(iso: string): string { return iso.slice(0, 10) }

// ── Sub-components ────────────────────────────────────────────────────────────

interface FieldProps {
  label: string; required?: boolean; error?: string; children: React.ReactNode; hint?: string
}
function FormField({ label, required, error, children, hint }: FieldProps) {
  return (
    <div className="flex flex-col gap-xs">
      <label className="text-label-sm font-inter font-medium text-on-surface-variant focus-within:text-primary transition-colors">
        {label}{required && <span className="text-error ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-label-sm font-inter text-outline">{hint}</p>}
      {error && (
        <p className="text-label-sm font-inter text-error flex items-center gap-xs" role="alert">
          <span className="material-symbols-outlined text-[14px]">error</span>{error}
        </p>
      )}
    </div>
  )
}

interface ViewFieldProps { label: string; value: React.ReactNode; mono?: boolean }
function ViewField({ label, value, mono }: ViewFieldProps) {
  return (
    <div className="flex flex-col gap-xs">
      <dt className="text-label-sm font-inter font-medium text-secondary uppercase tracking-wider">{label}</dt>
      <dd className={mono ? 'text-type-mono font-mono text-on-surface' : 'text-body-md font-noto text-on-surface'}>
        {value ?? <span className="text-outline italic">—</span>}
      </dd>
    </div>
  )
}

const inputCls = (isNumeric: boolean, hasError: boolean) =>
  [
    'w-full bg-transparent border-[0.5px] rounded px-md py-[10px]',
    'text-on-surface placeholder:text-outline',
    'focus:outline-none focus:border-primary focus:border-b-2 transition-colors',
    isNumeric ? 'font-mono text-type-mono tabular-nums' : 'font-noto text-body-md',
    hasError ? 'border-error' : 'border-outline-variant',
  ].join(' ')

// ── Main component ────────────────────────────────────────────────────────────

interface OrderDetailProps { order: SerializedProductionOrder }

export default function OrderDetail({ order: initialOrder }: OrderDetailProps) {
  const router = useRouter()
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [currentOrder, setCurrentOrder] = useState<SerializedProductionOrder>(initialOrder)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'error'>('idle')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<UpdateOrderInput, unknown, UpdateOrderOutput>({
      resolver: zodResolver(updateOrderSchema),
    })

  const enterEdit = () => {
    setSaveError(null)
    reset({
      piNumber: currentOrder.piNumber, subLineIndex: currentOrder.subLineIndex,
      customer: currentOrder.customer, orderDate: toDateInputValue(currentOrder.orderDate),
      widthM: currentOrder.widthM, lengthM: currentOrder.lengthM, gsm: currentOrder.gsm,
      color: currentOrder.color, qty: currentOrder.qty,
      uvPct: currentOrder.uvPct != null ? parseFloat(currentOrder.uvPct) : null,
      frFlag: currentOrder.frFlag,
      description: currentOrder.description ?? '', remark: currentOrder.remark ?? '',
      meshType: currentOrder.meshType ?? '',
      needleCount: currentOrder.needleCount ?? undefined,
      beamCount: currentOrder.beamCount ?? undefined,
    })
    setMode('edit')
  }

  const cancelEdit = () => { setSaveError(null); setMode('view') }

  const onSave = async (values: UpdateOrderOutput) => {
    setSaveError(null)
    try {
      const res = await fetch(`/api/orders/${currentOrder.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const json = await res.json()
      if (!res.ok || !json.success) { setSaveError(json.error ?? 'An unknown error occurred.'); return }
      setCurrentOrder(json.order as SerializedProductionOrder)
      setMode('view')
    } catch { setSaveError('Network error — could not reach the server.') }
  }

  const handleDelete = async () => {
    setDeleteStatus('deleting'); setDeleteError(null)
    try {
      const res = await fetch(`/api/orders/${currentOrder.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setDeleteError(json.error ?? 'Could not delete order.'); setDeleteStatus('error'); return
      }
      router.push('/orders')
    } catch { setDeleteError('Network error — could not reach the server.'); setDeleteStatus('error') }
  }

  // ── VIEW mode ──────────────────────────────────────────────────────────────

  if (mode === 'view') {
    return (
      <div className="space-y-lg">
        {/* Action buttons */}
        <div className="flex items-center justify-end gap-sm">
          <button
            id="btn-delete-order"
            onClick={() => { setShowDeleteDialog(true); setDeleteError(null); setDeleteStatus('idle') }}
            className="inline-flex items-center justify-center gap-sm border border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ba1a1a]/10 bg-transparent text-sm font-medium px-4 py-2 h-9 rounded-md transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>Delete
          </button>
          <button
            id="btn-edit-order"
            onClick={enterEdit}
            className="inline-flex items-center justify-center gap-sm border border-primary bg-transparent hover:bg-surface-container text-primary text-sm font-medium px-4 py-2 h-9 rounded-md transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>Edit
          </button>
        </div>

        {/* Core fields */}
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-lg gap-x-xl">
          <ViewField label="PI Number"    value={currentOrder.piNumber}                         mono />
          <ViewField label="Sub-line"     value={currentOrder.subLineIndex}                     />
          <ViewField label="Customer"     value={currentOrder.customer}                         />
          <ViewField label="Order Date"   value={formatDate(currentOrder.orderDate)}            />
          <ViewField label="Width (m)"    value={Number(currentOrder.widthM).toFixed(1)}        mono />
          <ViewField label="Length (m)"   value={Number(currentOrder.lengthM).toLocaleString()} mono />
          <ViewField label="GSM"          value={currentOrder.gsm}                              mono />
          <ViewField label="Color"        value={currentOrder.color}                            />
        </dl>

        {/* Optional fields */}
        {(currentOrder.qty != null || currentOrder.uvPct != null || currentOrder.frFlag ||
          currentOrder.description || currentOrder.remark ||
          currentOrder.meshType || currentOrder.needleCount != null || currentOrder.beamCount != null) && (
          <div className="border-t-[0.5px] border-outline-variant pt-lg">
            <p className="text-label-sm font-inter font-medium text-secondary uppercase tracking-widest mb-md">
              Optional details
            </p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-lg gap-x-xl">
              {currentOrder.qty != null && <ViewField label="Quantity (rolls)" value={currentOrder.qty} mono />}
              {currentOrder.uvPct != null && (
                <ViewField label="UV %" value={`${parseFloat(currentOrder.uvPct).toFixed(2)}%`} mono />
              )}
              <ViewField label="FR Treatment" value={
                currentOrder.frFlag
                  ? <span className="text-[#92400e] font-medium font-inter text-label-md">Required</span>
                  : <span className="text-outline font-inter text-label-md">Not required</span>
              } />
              {currentOrder.description && (
                <div className="sm:col-span-2"><ViewField label="Description" value={currentOrder.description} /></div>
              )}
              {currentOrder.remark && (
                <div className="sm:col-span-2"><ViewField label="Remark" value={currentOrder.remark} /></div>
              )}
            </dl>

            {/* Thông số kỹ thuật */}
            {(currentOrder.meshType || currentOrder.needleCount != null || currentOrder.beamCount != null) && (
              <>
                <p className="text-label-sm font-inter font-semibold text-primary uppercase tracking-widest mt-lg mb-md">
                  Thông số kỹ thuật
                </p>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-lg gap-x-xl">
                  {currentOrder.meshType && (
                    <div className="sm:col-span-2"><ViewField label="Thể loại lưới" value={currentOrder.meshType} /></div>
                  )}
                  {currentOrder.needleCount != null && <ViewField label="Số kim" value={currentOrder.needleCount} mono />}
                  {currentOrder.beamCount  != null && <ViewField label="Số dàn"  value={currentOrder.beamCount}  mono />}
                </dl>
              </>
            )}
          </div>
        )}

        {/* System fields */}
        <div className="border-t-[0.5px] border-outline-variant pt-lg">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-lg gap-x-xl">
            <ViewField label="Status" value={
              <span className="inline-flex items-center px-sm py-xs rounded text-label-sm font-inter font-medium bg-surface-container text-on-surface-variant">
                {currentOrder.status}
              </span>
            } />
            <ViewField label="Order ID"     value={currentOrder.id}                               mono />
            <ViewField label="Created"      value={formatDateTime(currentOrder.createdAt)}        />
            <ViewField label="Last Updated" value={formatDateTime(currentOrder.updatedAt)}        />
          </dl>
        </div>

        {/* Delete dialog */}
        {showDeleteDialog && (
          <div role="dialog" aria-modal="true" aria-labelledby="dialog-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => { if (deleteStatus !== 'deleting') setShowDeleteDialog(false) }} />
            <div className="relative bg-surface-container-lowest border-[0.5px] border-outline-variant rounded-xl p-lg max-w-md w-full shadow-2xl">
              <div className="flex items-start gap-md mb-lg">
                <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px] text-error">warning</span>
                </div>
                <div>
                  <h2 id="dialog-title" className="text-headline-md font-inter font-semibold text-on-surface">
                    Delete this order?
                  </h2>
                  <p className="text-body-md font-noto text-secondary mt-xs">
                    Are you sure you want to delete{' '}
                    <span className="font-mono text-on-surface">{currentOrder.piNumber}</span>
                    {currentOrder.subLineIndex > 0 && ` (line ${currentOrder.subLineIndex})`}?
                    This cannot be undone.
                  </p>
                </div>
              </div>

              {deleteStatus === 'error' && deleteError && (
                <p className="text-label-sm font-inter text-error mb-md bg-error-container border-[0.5px] border-error/30 rounded px-md py-sm">
                  {deleteError}
                </p>
              )}

              <div className="flex justify-end gap-sm">
                <button
                  id="btn-cancel-delete"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={deleteStatus === 'deleting'}
                  className="inline-flex items-center justify-center gap-sm border border-primary bg-transparent hover:bg-surface-container text-primary text-sm font-medium px-4 py-2 h-9 rounded-md transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-delete"
                  onClick={handleDelete}
                  disabled={deleteStatus === 'deleting'}
                  className="inline-flex items-center justify-center gap-sm border border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ba1a1a]/10 bg-transparent text-sm font-medium px-4 py-2 h-9 rounded-md transition-colors disabled:opacity-60"
                >
                  {deleteStatus === 'deleting' ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Deleting…
                    </>
                  ) : 'Confirm Delete'}
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
    <form onSubmit={handleSubmit(onSave)} noValidate className="space-y-lg">
      {saveError && (
        <div role="alert" className="flex items-start gap-sm border border-error/40 bg-error-container rounded-lg px-md py-sm">
          <span className="material-symbols-outlined text-[20px] text-error shrink-0 mt-0.5">error</span>
          <div>
            <p className="text-label-md font-inter font-semibold text-error">Could not save changes</p>
            <p className="text-label-sm font-inter text-on-error-container mt-0.5">{saveError}</p>
          </div>
        </div>
      )}

      {/* Required fields */}
      <section>
        <h2 className="flex items-center gap-sm text-label-sm font-inter font-semibold text-primary uppercase tracking-widest mb-md">
          <span className="material-symbols-outlined text-[16px]">asterisk</span>Required fields
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[24px] gap-y-lg">
          <FormField label="PI Number"   required error={errors.piNumber?.message}>
            <input id="edit-piNumber" type="text" className={inputCls(false, !!errors.piNumber)} {...register('piNumber')} />
          </FormField>
          <FormField label="Sub-line"    required error={errors.subLineIndex?.message} hint="0 = first line">
            <input id="edit-subLineIndex" type="number" min={0} step={1} className={inputCls(true, !!errors.subLineIndex)} {...register('subLineIndex', { valueAsNumber: true })} />
          </FormField>
          <FormField label="Customer"    required error={errors.customer?.message}>
            <input id="edit-customer" type="text" className={inputCls(false, !!errors.customer)} {...register('customer')} />
          </FormField>
          <FormField label="Order Date"  required error={errors.orderDate?.message}>
            <input id="edit-orderDate" type="date" className={inputCls(false, !!errors.orderDate)} {...register('orderDate')} />
          </FormField>
          <FormField label="Width (m)"   required error={errors.widthM?.message}>
            <input id="edit-widthM" type="number" min={0.1} max={20} step={0.1} className={inputCls(true, !!errors.widthM)} {...register('widthM', { valueAsNumber: true })} />
          </FormField>
          <FormField label="Length (m)"  required error={errors.lengthM?.message}>
            <input id="edit-lengthM" type="number" min={1} max={100000} step={1} className={inputCls(true, !!errors.lengthM)} {...register('lengthM', { valueAsNumber: true })} />
          </FormField>
          <FormField label="GSM"         required error={errors.gsm?.message}>
            <input id="edit-gsm" type="number" min={1} max={500} step={1} className={inputCls(true, !!errors.gsm)} {...register('gsm', { valueAsNumber: true })} />
          </FormField>
          <FormField label="Color"       required error={errors.color?.message}>
            <input id="edit-color" type="text" className={inputCls(false, !!errors.color)} {...register('color')} />
          </FormField>
        </div>
      </section>

      {/* Optional fields */}
      <section className="border-t-[0.5px] border-outline-variant pt-lg">
        <h2 className="text-label-sm font-inter font-medium text-secondary uppercase tracking-widest mb-md">
          Optional fields
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[24px] gap-y-lg bg-surface-container-low border-[0.5px] border-outline-variant rounded-lg p-lg">
          <FormField label="Quantity (rolls)" error={errors.qty?.message}>
            <input id="edit-qty" type="number" min={1} step={1} className={inputCls(true, !!errors.qty)} {...register('qty', { setValueAs: (v: string) => (v === '' || v === null) ? null : Number(v) })} />
          </FormField>
          <FormField label="UV %" error={errors.uvPct?.message} hint="0–100">
            <input id="edit-uvPct" type="number" min={0} max={100} step={0.01} className={inputCls(true, !!errors.uvPct)} {...register('uvPct', { setValueAs: (v: string) => (v === '' || v === null) ? null : Number(v) })} />
          </FormField>
          <div className="sm:col-span-2 flex items-center gap-sm">
            <input id="edit-frFlag" type="checkbox" className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer" {...register('frFlag')} />
            <label htmlFor="edit-frFlag" className="text-body-md font-noto text-on-surface cursor-pointer select-none">
              Flame-Retardant (FR) treatment required
            </label>
          </div>
          <div className="sm:col-span-2">
            <FormField label="Description" error={errors.description?.message} hint="Max 200 characters">
              <textarea id="edit-description" rows={2} className={`${inputCls(false, !!errors.description)} resize-none`} {...register('description')} />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField label="Remark" error={errors.remark?.message} hint="Max 200 characters">
              <textarea id="edit-remark" rows={2} className={`${inputCls(false, !!errors.remark)} resize-none`} {...register('remark')} />
            </FormField>
          </div>

          {/* ── Thông số kỹ thuật ─────────────────────────────────── */}
          <div className="sm:col-span-2">
            <p className="text-label-sm font-inter font-semibold text-primary uppercase tracking-widest mb-md">
              Thông số kỹ thuật
            </p>
          </div>
          <div className="sm:col-span-2">
            <FormField label="Thể loại lưới" error={errors.meshType?.message}>
              <input
                id="edit-meshType"
                type="text"
                placeholder="e.g. Dệt kim, Dệt thị…"
                className={inputCls(false, !!errors.meshType)}
                {...register('meshType', { setValueAs: (v: string) => (v === '' ? null : v) })}
              />
            </FormField>
          </div>
          <FormField label="Số kim" error={errors.needleCount?.message}>
            <input
              id="edit-needleCount"
              type="number"
              min={1}
              step={1}
              placeholder="e.g. 28"
              className={inputCls(true, !!errors.needleCount)}
              {...register('needleCount', { setValueAs: (v: string) => (v === '' || v === null) ? null : Number(v) })}
            />
          </FormField>
          <FormField label="Số dàn" error={errors.beamCount?.message}>
            <input
              id="edit-beamCount"
              type="number"
              min={1}
              step={1}
              placeholder="e.g. 4"
              className={inputCls(true, !!errors.beamCount)}
              {...register('beamCount', { setValueAs: (v: string) => (v === '' || v === null) ? null : Number(v) })}
            />
          </FormField>
        </div>
      </section>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-md pt-md border-t-[0.5px] border-outline-variant">
        <button type="button" onClick={cancelEdit} disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-sm border border-primary bg-transparent hover:bg-surface-container text-primary text-sm font-medium px-4 py-2 h-9 rounded-md transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button id="btn-save-changes" type="submit" disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-sm bg-primary text-on-primary text-sm font-medium px-4 py-2 h-9 rounded-md hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
          {isSubmitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Saving…
            </>
          ) : (
            <><span className="material-symbols-outlined text-[18px]">save</span>Save changes</>
          )}
        </button>
      </div>
    </form>
  )
}
