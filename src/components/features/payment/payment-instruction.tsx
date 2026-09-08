'use client'

import { useEffect, useState } from 'react'
import { Copy, Check, Clock, Landmark, AlertCircle } from 'lucide-react'
import { formatIDR } from '@/utils/cn'
import { toast } from '@/components/providers/toast-provider'

interface PaymentInstructionProps {
  bankName: string
  accountNumber: string
  accountName: string
  subtotal: number
  discount: number
  shippingFee: number
  uniqueCode: number
  totalWithUnique: number
  total: number
  orderId: string
  paymentDeadlineHours: number
  createdAt: string
}

function useCountdown(deadline: string) {
  const [remaining, setRemaining] = useState(() => {
    const diff = new Date(deadline).getTime() - Date.now()
    return Math.max(0, diff)
  })

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = new Date(deadline).getTime() - Date.now()
      setRemaining(Math.max(0, diff))
    }, 1000)
    return () => clearInterval(timer)
  }, [deadline])

  const hours = Math.floor(remaining / 3600000)
  const minutes = Math.floor((remaining % 3600000) / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)

  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
    expired: remaining <= 0,
  }
}

export function PaymentInstruction({
  bankName,
  accountNumber,
  accountName,
  subtotal,
  discount,
  shippingFee,
  uniqueCode,
  totalWithUnique,
  total,
  orderId,
  paymentDeadlineHours,
  createdAt,
}: PaymentInstructionProps) {
  const deadline = new Date(
    new Date(createdAt).getTime() + paymentDeadlineHours * 3600000
  ).toISOString()

  const { hours, minutes, seconds, expired } = useCountdown(deadline)
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      toast.success(`${label} disalin!`)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      toast.error('Gagal menyalin.')
    }
  }

  const CopyButton = ({ text, label }: { text: string; label: string }) => (
    <button
      type="button"
      onClick={() => copyToClipboard(text, label)}
      className="ml-2 inline-flex items-center gap-1 rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-brand-600 dark:hover:bg-neutral-800"
      title={`Salin ${label}`}
    >
      {copied === label ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  )

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      {/* Countdown */}
      <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-950/40">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          <Clock className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          {expired ? 'Pembayaran Kedaluwarsa' : 'Selesaikan Pembayaran Sebelum'}
        </div>
        {!expired && (
          <div className="flex items-center gap-1 font-mono text-lg font-bold tabular-nums text-brand-700 dark:text-brand-300">
            <span className="rounded-lg bg-brand-50 px-2 py-1 dark:bg-brand-950">{hours}</span>
            <span>:</span>
            <span className="rounded-lg bg-brand-50 px-2 py-1 dark:bg-brand-950">{minutes}</span>
            <span>:</span>
            <span className="rounded-lg bg-brand-50 px-2 py-1 dark:bg-brand-950">{seconds}</span>
          </div>
        )}
      </div>

      {expired ? (
        <div className="flex flex-col items-center gap-3 p-8 text-center">
          <AlertCircle className="h-10 w-10 text-rose-500" />
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Batas waktu pembayaran telah berakhir.
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Pesanan Anda akan dibatalkan otomatis. Silakan buat pesanan baru.
          </p>
        </div>
      ) : (
        <div className="space-y-5 p-5">
          {/* Bank details */}
          <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              <Landmark className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              Transfer ke Rekening Warungpedia
            </div>
            <dl className="mt-3 space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-neutral-500 dark:text-neutral-400">Bank</dt>
                <dd className="flex items-center font-semibold text-neutral-900 dark:text-neutral-100">
                  {bankName}
                  <CopyButton text={bankName} label="Nama bank" />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-neutral-500 dark:text-neutral-400">No. Rekening</dt>
                <dd className="flex items-center font-mono font-bold text-neutral-900 dark:text-neutral-100">
                  {accountNumber}
                  <CopyButton text={accountNumber} label="No. rekening" />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-neutral-500 dark:text-neutral-400">Atas Nama</dt>
                <dd className="flex items-center font-semibold text-neutral-900 dark:text-neutral-100">
                  {accountName}
                  <CopyButton text={accountName} label="Atas nama" />
                </dd>
              </div>
            </dl>
          </div>

          {/* Amount breakdown */}
          <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Rincian Pembayaran
            </div>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between text-neutral-600 dark:text-neutral-300">
                <dt>Subtotal</dt>
                <dd>{formatIDR(subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <dt>Diskon</dt>
                  <dd>-{formatIDR(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-neutral-600 dark:text-neutral-300">
                <dt>Ongkir</dt>
                <dd>{shippingFee === 0 ? 'Gratis' : formatIDR(shippingFee)}</dd>
              </div>
              <div className="flex justify-between border-t border-neutral-100 pt-2 text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
                <dt>Total</dt>
                <dd>{formatIDR(total)}</dd>
              </div>
              <div className="flex justify-between text-neutral-600 dark:text-neutral-300">
                <dt>Kode Unik</dt>
                <dd className="font-mono font-bold text-brand-600 dark:text-brand-400">
                  {uniqueCode}
                </dd>
              </div>
              <div className="flex justify-between border-t border-neutral-100 pt-2 text-base font-bold text-neutral-900 dark:border-neutral-800 dark:text-neutral-50">
                <dt>Total Transfer</dt>
                <dd className="text-brand-700 dark:text-brand-300">
                  {formatIDR(totalWithUnique)}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => copyToClipboard(String(totalWithUnique), 'Total transfer')}
              className="mt-3 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Salin Total Transfer
            </button>
          </div>

          {/* Instructions */}
          <div className="rounded-xl bg-neutral-50 p-4 text-xs leading-relaxed text-neutral-600 dark:bg-neutral-950/40 dark:text-neutral-400">
            <p className="font-semibold text-neutral-800 dark:text-neutral-200">
              Cara Pembayaran:
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>Transfer sejumlah <b>{formatIDR(totalWithUnique)}</b> ke rekening di atas.</li>
              <li>Masukkan <b>kode unik {uniqueCode}</b> sebagai bagian dari nominal transfer.</li>
              <li>Simpan bukti transfer Anda.</li>
              <li>Pesanan akan diproses setelah pembayaran terverifikasi oleh admin.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
