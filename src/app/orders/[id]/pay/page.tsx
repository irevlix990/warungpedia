import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/dal'
import { getOrderById } from '@/services/cart-service'
import { getPaymentBankSettings } from '@/services/payment-settings-service'
import { PaymentInstruction } from '@/components/features/payment/payment-instruction'
import { formatIDR } from '@/utils/cn'

export const metadata: Metadata = {
  title: 'Instruksi Pembayaran | Warungpedia',
}

interface PayPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderPayPage({ params }: PayPageProps) {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')

  const { id } = await params
  const order = await getOrderById(id).catch(() => null)
  if (!order || order.userId !== user.id) notFound()

  // Already paid
  if (order.paidAt || order.status !== 'PENDING') {
    redirect(`/orders/${order.id}`)
  }

  const bankSettings = await getPaymentBankSettings()

  // Generate unique code (3 digits based on order total)
  const uniqueCode = (order.total % 900) + 100 // 100–999
  const totalWithUnique = order.total + uniqueCode

  return (
    <main className="container-wp py-10 max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
        Pembayaran Transfer Bank
      </h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        Selesaikan pembayaran sebelum batas waktu berikut.
      </p>

      <PaymentInstruction
        bankName={bankSettings.bankName}
        accountNumber={bankSettings.accountNumber}
        accountName={bankSettings.accountName}
        subtotal={order.subtotal}
        discount={order.discount}
        shippingFee={order.shippingFee}
        uniqueCode={uniqueCode}
        totalWithUnique={totalWithUnique}
        total={order.total}
        orderId={order.id}
        paymentDeadlineHours={bankSettings.paymentDeadlineHours}
        createdAt={order.createdAt}
      />

      <div className="mt-6 text-center">
        <Link
          href={`/orders/${order.id}`}
          className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300"
        >
          Lihat Detail Pesanan
        </Link>
      </div>
    </main>
  )
}
