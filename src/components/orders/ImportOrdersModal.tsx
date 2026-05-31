'use client'

// src/components/orders/ImportOrdersModal.tsx
// Client component — "Import Excel" trigger button + modal overlay.
// State machine: closed → uploading → preview → confirming → success | error
// After success: calls router.refresh() to reload the order list.

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { ParsedOrder } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

type ModalState =
  | 'closed'
  | 'uploading'
  | 'preview'
  | 'confirming'
  | 'success'
  | 'error'

interface PreviewData {
  rows: ParsedOrder[]
  totalParsed: number
}

interface ConfirmResult {
  imported: number
  skipped: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ImportOrdersModal() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [state, setState] = useState<ModalState>('closed')
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [result, setResult] = useState<ConfirmResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // ── Handlers ────────────────────────────────────────────────────────────────

  const openModal = () => {
    setPreview(null)
    setResult(null)
    setError(null)
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setState('uploading')
  }

  const closeModal = () => {
    setState('closed')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setSelectedFile(f)
    setError(null)
  }

  // Step 1: upload file → get preview
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first.')
      return
    }
    if (!selectedFile.name.toLowerCase().endsWith('.xlsx')) {
      setError('Only .xlsx files are accepted.')
      return
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File must be 10 MB or smaller.')
      return
    }

    setState('uploading') // keep in uploading while fetching
    setError(null)

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const res = await fetch('/api/orders/import', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        setError(json.error ?? 'Could not parse the file.')
        return
      }

      setPreview({ rows: json.preview, totalParsed: json.totalParsed })
      setState('preview')
    } catch {
      setError('Network error — could not reach the server.')
    }
  }

  // Step 2: confirm → save to DB
  const handleConfirm = async () => {
    if (!preview) return
    setState('confirming')
    setError(null)

    try {
      const res = await fetch('/api/orders/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: preview.rows }),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        setError(json.error ?? 'An error occurred while saving.')
        setState('error')
        return
      }

      setResult({ imported: json.imported, skipped: json.skipped })
      setState('success')
      // Refresh server-component data (order list) in background
      router.refresh()
    } catch {
      setError('Network error — could not reach the server.')
      setState('error')
    }
  }

  const handleRetry = () => {
    setError(null)
    setPreview(null)
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setState('uploading')
  }

  // ── Render: trigger button (always visible) ──────────────────────────────────

  return (
    <>
      {/* Trigger button */}
      <button
        id="btn-import-excel"
        onClick={openModal}
        className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
        Import Excel
      </button>

      {/* Modal overlay */}
      {state !== 'closed' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Import Excel orders"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              if (state !== 'confirming') closeModal()
            }}
          />

          {/* Card */}
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <h2 className="text-white font-semibold text-base">Import Excel Orders</h2>
              </div>
              {state !== 'confirming' && (
                <button
                  onClick={closeModal}
                  className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">

              {/* ── UPLOADING STATE ─────────────────────────────────────── */}
              {(state === 'uploading') && (
                <div className="space-y-6">
                  <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center">
                    <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-slate-300 font-medium mb-1">Select your ORDER_LIST .xlsx file</p>
                    <p className="text-slate-500 text-sm mb-4">Only .xlsx files · Max 10 MB</p>
                    <input
                      id="file-import-input"
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-import-input"
                      className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-sm font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      Browse file
                    </label>
                    {selectedFile && (
                      <p className="mt-3 text-sm text-emerald-400 flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {selectedFile.name}
                        <span className="text-slate-500">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                      </p>
                    )}
                  </div>

                  {error && (
                    <div role="alert" className="flex items-start gap-3 border border-red-500/40 bg-red-500/10 rounded-xl px-4 py-3">
                      <span className="text-red-400 shrink-0">✕</span>
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <button onClick={closeModal} className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                      Cancel
                    </button>
                    <button
                      id="btn-parse-file"
                      onClick={handleUpload}
                      disabled={!selectedFile}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
                    >
                      Parse File →
                    </button>
                  </div>
                </div>
              )}

              {/* ── PREVIEW STATE ────────────────────────────────────────── */}
              {state === 'preview' && preview && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                      Showing first{' '}
                      <span className="text-white font-semibold">{preview.rows.length}</span>
                      {' '}of{' '}
                      <span className="text-white font-semibold">{preview.totalParsed}</span>
                      {' '}parsed rows. Review before confirming import.
                    </p>
                    {preview.totalParsed > preview.rows.length && (
                      <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded px-2 py-0.5">
                        Full file will be imported on confirm
                      </span>
                    )}
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-800">
                          {['#', 'PI Number', 'Sub-line', 'Customer', 'Date', 'Width (m)', 'Length (m)', 'GSM', 'Color', 'FR', 'UV%'].map((h) => (
                            <th key={h} className="px-3 py-2 text-left text-slate-400 font-semibold uppercase tracking-wide whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70">
                        {preview.rows.map((row, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900/30'}>
                            <td className="px-3 py-2 text-slate-600 tabular-nums">{idx + 1}</td>
                            <td className="px-3 py-2 font-mono text-slate-200 whitespace-nowrap">{row.piNumber}</td>
                            <td className="px-3 py-2 text-slate-400 text-center">{row.subLineIndex}</td>
                            <td className="px-3 py-2 text-slate-300 whitespace-nowrap max-w-[140px] truncate">{row.customer}</td>
                            <td className="px-3 py-2 text-slate-400 whitespace-nowrap tabular-nums">{formatDate(row.orderDate)}</td>
                            <td className="px-3 py-2 text-slate-300 tabular-nums text-right">{row.widthM}</td>
                            <td className="px-3 py-2 text-slate-300 tabular-nums text-right">{row.lengthM.toLocaleString()}</td>
                            <td className="px-3 py-2 text-slate-300 tabular-nums text-right">{row.gsm}</td>
                            <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{row.color}</td>
                            <td className="px-3 py-2 text-center">
                              {row.frFlag ? (
                                <span className="text-amber-400 font-bold">FR</span>
                              ) : (
                                <span className="text-slate-700">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-400 tabular-nums">
                              {row.uvPct != null ? `${(row.uvPct * 100).toFixed(1)}%` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {error && (
                    <div role="alert" className="flex items-start gap-3 border border-red-500/40 bg-red-500/10 rounded-xl px-4 py-3">
                      <span className="text-red-400 shrink-0">✕</span>
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── CONFIRMING STATE ─────────────────────────────────────── */}
              {state === 'confirming' && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <svg className="w-10 h-10 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <p className="text-slate-300 font-medium">Importing orders…</p>
                  <p className="text-slate-500 text-sm">Please wait, do not close this window.</p>
                </div>
              )}

              {/* ── SUCCESS STATE ────────────────────────────────────────── */}
              {state === 'success' && result && (
                <div className="flex flex-col items-center justify-center py-16 gap-5">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-xl">Import complete!</p>
                    <p className="text-slate-400 text-sm mt-2">
                      <span className="text-emerald-400 font-semibold">{result.imported} rows imported</span>
                      {result.skipped > 0 && (
                        <span className="ml-2 text-slate-500">· {result.skipped} duplicates skipped</span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* ── ERROR STATE ──────────────────────────────────────────── */}
              {state === 'error' && (
                <div className="flex flex-col items-center justify-center py-16 gap-5">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold">Import failed</p>
                    <p className="text-red-400 text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}

            </div>

            {/* Footer buttons */}
            {(state === 'preview' || state === 'success' || state === 'error') && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 shrink-0">
                {state === 'preview' && (
                  <>
                    <button
                      onClick={handleRetry}
                      className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      ← Choose different file
                    </button>
                    <button
                      id="btn-confirm-import"
                      onClick={handleConfirm}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Confirm Import
                    </button>
                  </>
                )}
                {state === 'success' && (
                  <button
                    id="btn-import-done"
                    onClick={closeModal}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors"
                  >
                    Done
                  </button>
                )}
                {state === 'error' && (
                  <>
                    <button onClick={closeModal} className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                      Close
                    </button>
                    <button
                      onClick={handleRetry}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
                    >
                      Try again
                    </button>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </>
  )
}
