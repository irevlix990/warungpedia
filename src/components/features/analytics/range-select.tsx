'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Select } from '@/components/ui'

export function RangeSelect({
  value,
  labels,
  className,
}: {
  value: string
  labels: { last7: string; last30: string; last90: string }
  className?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  return (
    <Select
      value={value}
      className={className}
      onChange={(e) => router.push(`${pathname}?range=${e.target.value}`)}
    >
      <option value="7d">{labels.last7}</option>
      <option value="30d">{labels.last30}</option>
      <option value="90d">{labels.last90}</option>
    </Select>
  )
}
