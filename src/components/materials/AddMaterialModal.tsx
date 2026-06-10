'use client'

// src/components/materials/AddMaterialModal.tsx
// Modal for adding a new material. Local state only — no react-hook-form needed.

import { useState } from 'react'

interface Props {
  onAdded: () => void
  onClose: () => void
}

// ── Serialized shape returned by POST /api/materials ─────────────────────────
interface SerializedMaterial {
  id: string
  name: string
  currentStock: string
  minThreshold: string
  unit: string
  note: string | null
  createdAt: string
  updatedAt: string
}

export default function AddMaterialModal({ onAdded, onClose }: Props) {
  const [name, setName]               = useState('')
  const [currentStock, setCurrentStock] = useState('')
  const [minThreshold, setMinThreshold] = useState('')
  const [note, setNote]               = useState('')
  const [error, setError]             = useState('')
  const [isLoading, setIsLoading]     = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Client-side validation
    const stock = parseFloat(currentStock)
    const threshold = parseFloat(minThreshold)
    if (isNaN(stock) || stock < 0) { setError('Tồn kho phải là số không âm'); return }
    if (isNaN(threshold) || threshold < 0) { setError('Ngưỡng tối thiểu phải là số không âm'); return }

    setIsLoading(true)
    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          currentStock: stock,
          minThreshold: threshold,
          unit: 'kg',
          note: note.trim() || null,
        }),
      })

      const data = await res.json() as { success: boolean; error?: string; material?: SerializedMaterial }
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Không thể thêm nguyên liệu.')
        return
      }

      onAdded()
      onClose()
    } catch {
      setError('Lỗi mạng — không thể kết nối máy chủ.')
    } finally {
      setIsLoading(false)
    }
  }

  const inputCls = (hasError?: boolean) =>
    [
      'w-full h-10 px-3 rounded-lg border-[0.5px] bg-surface text-on-surface text-sm',
      'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors',
      hasError ? 'border-error' : 'border-outline',
    ].join(' ')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-xl shadow-lg w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b-[0.5px] border-outline-variant flex justify-between items-center">
          <h3 className="text-base font-inter font-semibold text-on-surface">Add material</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Error banner */}
          {error && (
            <div className="p-3 rounded-lg bg-[#FFF8E7] border border-[#F59E0B] text-[#92400E] text-sm">
              {error}
            </div>
          )}

          {/* Tên nguyên liệu */}
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">
              Tên nguyên liệu <span className="text-error">*</span>
            </label>
            <input
              id="add-material-name"
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. MF, UV 4%, Tái chế, FR, IR"
              className={inputCls()}
            />
          </div>

          {/* Tồn kho + Ngưỡng tối thiểu (side by side) */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-secondary mb-1">
                Tồn kho hiện tại (kg) <span className="text-error">*</span>
              </label>
              <input
                id="add-material-stock"
                type="number"
                required
                min={0}
                step={0.01}
                value={currentStock}
                onChange={e => setCurrentStock(e.target.value)}
                placeholder="e.g. 500"
                className={inputCls()}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-secondary mb-1">
                Ngưỡng tối thiểu (kg) <span className="text-error">*</span>
              </label>
              <input
                id="add-material-threshold"
                type="number"
                required
                min={0}
                step={0.01}
                value={minThreshold}
                onChange={e => setMinThreshold(e.target.value)}
                placeholder="e.g. 200"
                className={inputCls()}
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Ghi chú</label>
            <input
              id="add-material-note"
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ghi chú tuỳ chọn…"
              className={inputCls()}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center border border-primary bg-transparent hover:bg-surface-container text-primary text-sm font-medium px-4 py-2 h-9 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center bg-primary text-on-primary text-sm font-medium px-4 py-2 h-9 rounded-md hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {isLoading ? 'Đang lưu…' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
