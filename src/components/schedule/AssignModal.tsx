'use client'

import { useState, useEffect } from 'react'
import { getUnassignedOrders } from '@/app/schedule/actions'
import { format } from 'date-fns'

type Order = { id: string; piNumber: string; customer: string }

interface Props {
  isOpen: boolean
  onClose: () => void
  machineId: string
  startDate: Date | null
  onSuccess: () => void
}

export default function AssignModal({ isOpen, onClose, machineId, startDate, onSuccess }: Props) {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [endDate, setEndDate] = useState('')
  const [allocatedMeters, setAllocatedMeters] = useState('')
  const [estimatedDailyOutput, setEstimatedDailyOutput] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      getUnassignedOrders().then(setOrders).catch(console.error)
      if (startDate) {
        setEndDate(format(startDate, 'yyyy-MM-dd'))
      }
      setSelectedOrderId('')
      setAllocatedMeters('')
      setEstimatedDailyOutput('')
      setError('')
    }
  }, [isOpen, startDate])

  if (!isOpen || !startDate) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      console.log('Raw startDate:', startDate)
      console.log('Raw endDate:', endDate)

      // endDate is from <input type="date"> which stores value as YYYY-MM-DD
      const parsedEnd = new Date(endDate)
      
      // startDate is already a Date object, but let's parse its YYYY-MM-DD to avoid time comparison issues
      const parsedStart = new Date(format(startDate, 'yyyy-MM-dd'))

      if (parsedEnd < parsedStart) {
        setError('End Date cannot be before Start Date')
        setIsLoading(false)
        return
      }

      // Format as true ISO strings for Zod validation (.toISOString() outputs '...Z')
      const startISO = new Date(`${format(startDate, 'yyyy-MM-dd')}T00:00:00+07:00`).toISOString()
      const endISO = new Date(`${endDate}T00:00:00+07:00`).toISOString()

      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineId,
          orderId: selectedOrderId,
          startDate: startISO,
          endDate: endISO,
          // Gửi số mét phân công nếu planner có nhập
          ...(allocatedMeters !== '' && { allocatedMeters: Number(allocatedMeters) }),
          // Gửi sản lượng dự kiến nếu planner có nhập
          ...(estimatedDailyOutput !== '' && { estimatedDailyOutput: Number(estimatedDailyOutput) }),
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create assignment')
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl shadow-lg w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-md py-sm border-b-[0.5px] border-outline-variant flex justify-between items-center">
          <h3 className="text-headline-sm font-inter font-semibold text-on-surface">Assign Order</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-md">
          {error && (
            <div className="mb-md p-sm rounded-lg bg-[#FFF8E7] border border-[#F59E0B] text-[#92400E] text-label-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-md">
            <div>
              <label className="block text-label-sm font-medium text-secondary mb-xs">Machine</label>
              <input type="text" disabled value={machineId} className="w-full h-10 px-sm rounded-lg border-[0.5px] border-outline-variant bg-surface-container-lowest text-on-surface-variant font-mono text-type-mono" />
            </div>

            <div>
              <label className="block text-label-sm font-medium text-secondary mb-xs">Order</label>
              <select 
                required
                value={selectedOrderId} 
                onChange={e => setSelectedOrderId(e.target.value)}
                className="w-full h-10 px-sm rounded-lg border-[0.5px] border-outline bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md"
              >
                <option value="">Select an order...</option>
                {orders.map(o => (
                  <option key={o.id} value={o.id}>{o.piNumber} ({o.customer})</option>
                ))}
              </select>
            </div>

            <div className="flex gap-sm">
              <div className="flex-1">
                <label className="block text-label-sm font-medium text-secondary mb-xs">Start Date</label>
                <input type="text" disabled value={format(startDate, 'dd/MM/yyyy')} className="w-full h-10 px-sm rounded-lg border-[0.5px] border-outline-variant bg-surface-container-lowest text-on-surface-variant" />
              </div>
              <div className="flex-1">
                <label className="block text-label-sm font-medium text-secondary mb-xs">End Date</label>
                <input 
                  type="date" 
                  required
                  min={format(startDate, 'yyyy-MM-dd')}
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full h-10 px-sm rounded-lg border-[0.5px] border-outline bg-surface focus:border-primary outline-none" 
                />
              </div>
            </div>

            {/* Số mét phân công */}
            <div>
              <label className="block text-label-sm font-medium text-secondary mb-xs">Số mét phân công</label>
              <input
                type="number"
                min={1}
                step={1}
                value={allocatedMeters}
                onChange={e => setAllocatedMeters(e.target.value)}
                placeholder="e.g. 6000"
                className="w-full h-10 px-sm rounded-lg border-[0.5px] border-outline bg-surface focus:border-primary outline-none font-mono"
              />
            </div>

            {/* Sản lượng dự kiến */}
            <div>
              <label className="block text-label-sm font-medium text-secondary mb-xs">
                Sản lượng dự kiến (m/ngày)
              </label>
              <input
                id="assign-estimatedDailyOutput"
                type="number"
                min={1}
                step={1}
                value={estimatedDailyOutput}
                onChange={e => setEstimatedDailyOutput(e.target.value)}
                placeholder="e.g. 800"
                className="w-full h-10 px-sm rounded-lg border-[0.5px] border-outline bg-surface focus:border-primary outline-none font-mono"
              />
            </div>
          </div>

          <div className="mt-xl flex justify-end gap-sm">
            <button type="button" onClick={onClose} className="inline-flex items-center justify-center gap-sm border border-primary bg-transparent hover:bg-surface-container text-primary text-sm font-medium px-4 py-2 h-9 rounded-md transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="inline-flex items-center justify-center gap-sm bg-primary text-on-primary text-sm font-medium px-4 py-2 h-9 rounded-md hover:bg-primary/90 disabled:opacity-60 transition-colors">
              {isLoading ? 'Saving...' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
