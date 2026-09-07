'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react'

interface DateTimePickerProps {
  name: string
  label: string
  defaultValue?: string | null
  error?: string
  required?: boolean
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function formatLocalDatetime(year: number, month: number, day: number, hour: number, minute: number): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const offset = -new Date().getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const offH = pad(Math.floor(Math.abs(offset) / 60))
  const offM = pad(Math.abs(offset) % 60)
  return `${year}-${pad(month + 1)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00${sign}${offH}:${offM}`
}

export function DateTimePicker({
  name,
  label,
  defaultValue,
  error,
  required,
}: DateTimePickerProps) {
  const now = new Date()
  const initDate = defaultValue ? new Date(defaultValue) : null

  const [year, setYear] = useState(initDate?.getFullYear() ?? now.getFullYear())
  const [month, setMonth] = useState(initDate?.getMonth() ?? now.getMonth())
  const [day, setDay] = useState(initDate?.getDate() ?? null)
  const [hour, setHour] = useState(initDate?.getHours() ?? 0)
  const [minute, setMinute] = useState(initDate?.getMinutes() ?? 0)
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'calendar' | 'time'>('calendar')
  const panelRef = useRef<HTMLDivElement>(null)

  const selectedDate = day !== null ? new Date(year, month, day, hour, minute) : null

  const hiddenValue = day !== null
    ? formatLocalDatetime(year, month, day, hour, minute)
    : ''

  // Close on outside click
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      setOpen(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, handleClickOutside])

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  const selectDay = (d: number) => {
    setDay(d)
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const displayText = selectedDate
    ? selectedDate.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  return (
    <div className="relative" ref={panelRef}>
      <input type="hidden" name={name} value={hiddenValue} />

      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setView('calendar') }}
        className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-sm text-left transition-colors
          ${error
            ? 'border-danger-400 focus:border-danger-500 focus:ring-danger-500/20'
            : 'border-neutral-200 hover:border-neutral-300 focus:border-brand-500 focus:ring-brand-500/20 dark:border-neutral-700 dark:hover:border-neutral-600'
          }
          ${displayText
            ? 'text-neutral-900 dark:text-neutral-100'
            : 'text-neutral-400 dark:text-neutral-500'
          }
          bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2`}
      >
        <Calendar className="h-4 w-4 shrink-0 text-neutral-400" />
        <span className="flex-1 truncate">{displayText || 'Pilih tanggal & waktu...'}</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-[320px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
            {view === 'calendar' ? (
              <>
                <button
                  type="button"
                  onClick={prevMonth}
                  className="rounded-lg p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {MONTHS[month]} {year}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="rounded-lg p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            ) : (
              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Pilih Waktu
              </span>
            )}
            <button
              type="button"
              onClick={() => setView((v) => (v === 'calendar' ? 'time' : 'calendar'))}
              className="absolute right-4 rounded-lg p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
              title={view === 'calendar' ? 'Pilih waktu' : 'Pilih tanggal'}
            >
              {view === 'calendar' ? <Clock className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
            </button>
          </div>

          {/* Calendar View */}
          {view === 'calendar' && (
            <div className="px-4 pb-3">
              {/* Day names */}
              <div className="grid grid-cols-7 gap-1 pt-2">
                {DAYS.map((d) => (
                  <div
                    key={d}
                    className="py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for offset */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1
                  const isSelected = day === d
                  const isToday =
                    d === now.getDate() &&
                    month === now.getMonth() &&
                    year === now.getFullYear()

                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => selectDay(d)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors
                        ${isSelected
                          ? 'bg-brand-600 text-white shadow-sm'
                          : isToday
                            ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                            : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                        }`}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Time View */}
          {view === 'time' && (
            <div className="px-4 pb-4 pt-3">
              <div className="flex items-center justify-center gap-4">
                {/* Hour */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setHour((h) => (h + 1) % 24)}
                    className="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                  >
                    <ChevronLeft className="h-4 w-4 rotate-[-90deg]" />
                  </button>
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800">
                    <span className="text-lg font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                      {String(hour).padStart(2, '0')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHour((h) => (h + 23) % 24)}
                    className="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                  >
                    <ChevronLeft className="h-4 w-4 rotate-90" />
                  </button>
                  <span className="text-[10px] font-semibold uppercase text-neutral-400 dark:text-neutral-500">Jam</span>
                </div>

                <span className="mt-[-14px] text-lg font-bold text-neutral-300 dark:text-neutral-600">:</span>

                {/* Minute */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setMinute((m) => (m + 5) % 60)}
                    className="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                  >
                    <ChevronLeft className="h-4 w-4 rotate-[-90deg]" />
                  </button>
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800">
                    <span className="text-lg font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                      {String(minute).padStart(2, '0')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMinute((m) => (m + 55) % 60)}
                    className="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                  >
                    <ChevronLeft className="h-4 w-4 rotate-90" />
                  </button>
                  <span className="text-[10px] font-semibold uppercase text-neutral-400 dark:text-neutral-500">Menit</span>
                </div>
              </div>

              {/* Quick time presets */}
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {[
                  { label: '00:00', h: 0, m: 0 },
                  { label: '08:00', h: 8, m: 0 },
                  { label: '12:00', h: 12, m: 0 },
                  { label: '17:00', h: 17, m: 0 },
                  { label: '23:59', h: 23, m: 59 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => { setHour(preset.h); setMinute(preset.m) }}
                    className="rounded-lg border border-neutral-200 px-2.5 py-1 text-[11px] font-medium text-neutral-600 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-brand-950 dark:hover:text-brand-300"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-2.5 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => {
                setYear(now.getFullYear())
                setMonth(now.getMonth())
                setDay(now.getDate())
                setHour(now.getHours())
                setMinute(Math.floor(now.getMinutes() / 5) * 5)
              }}
              className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-300"
            >
              Sekarang
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setDay(null); setOpen(false) }}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Hapus
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700"
              >
                Pilih
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
