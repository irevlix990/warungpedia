'use client'

import * as React from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import {
  PROVINCES,
  getRegenciesByProvince,
  getDistricts,
  getVillages,
  type District,
  type Village,
} from '@/data/indonesia'
import { cn } from '@/utils/cn'

interface AddressValue {
  province: string
  city: string
  district: string
  village: string
}

interface CascadingAddressSelectProps {
  /** Hidden input names for each level. */
  names: {
    province: string
    city: string
    district: string
    village: string
  }
  /** Initial values (existing store data). */
  value?: Partial<AddressValue>
  /** Labels for each level. */
  labels: {
    province: string
    city: string
    district: string
    village: string
  }
  className?: string
}

const selectClass =
  'h-10 w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 pr-8 text-sm text-neutral-900 shadow-soft focus:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100'

/**
 * Cascading Indonesian address selector: Province → City → District → Village.
 *
 * Province & city come from bundled data; district & village are fetched
 * on-demand from the emsifa API. Selecting a province filters the city list,
 * selecting a city loads its districts, etc.
 */
export function CascadingAddressSelect({
  names,
  value,
  labels,
  className,
}: CascadingAddressSelectProps) {
  const [province, setProvince] = React.useState(value?.province ?? '')
  const [city, setCity] = React.useState(value?.city ?? '')
  const [district, setDistrict] = React.useState(value?.district ?? '')
  const [village, setVillage] = React.useState(value?.village ?? '')

  const [districts, setDistricts] = React.useState<District[]>([])
  const [villages, setVillages] = React.useState<Village[]>([])
  const [loadingDistricts, setLoadingDistricts] = React.useState(
    Boolean(value?.city)
  )
  const [loadingVillages, setLoadingVillages] = React.useState(false)

  const cities = province ? getRegenciesByProvince(province) : []

  // Pre-load districts when initialized with a city value (edit mode)
  React.useEffect(() => {
    if (value?.city) {
      getDistricts(value.city).then((data) => {
        setDistricts(data)
        setLoadingDistricts(false)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleProvince = (id: string) => {
    setProvince(id)
    setCity('')
    setDistrict('')
    setVillage('')
    setDistricts([])
    setVillages([])
  }

  const handleCity = async (id: string) => {
    setCity(id)
    setDistrict('')
    setVillage('')
    setVillages([])
    if (!id) {
      setDistricts([])
      return
    }
    setLoadingDistricts(true)
    try {
      const data = await getDistricts(id)
      setDistricts(data)
    } finally {
      setLoadingDistricts(false)
    }
  }

  const handleDistrict = async (id: string) => {
    setDistrict(id)
    setVillage('')
    if (!id) {
      setVillages([])
      return
    }
    setLoadingVillages(true)
    try {
      const data = await getVillages(id)
      setVillages(data)
    } finally {
      setLoadingVillages(false)
    }
  }

  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}>
      {/* Province */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {labels.province}
        </label>
        <div className="relative">
          <select
            value={province}
            onChange={(e) => handleProvince(e.target.value)}
            className={selectClass}
          >
            <option value="">— Pilih Provinsi —</option>
            {PROVINCES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
        </div>
      </div>

      {/* City / Regency */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {labels.city}
        </label>
        <div className="relative">
          <select
            value={city}
            onChange={(e) => handleCity(e.target.value)}
            disabled={!province}
            className={selectClass}
          >
            <option value="">— Pilih Kota/Kabupaten —</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
        </div>
      </div>

      {/* District */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {labels.district}
        </label>
        <div className="relative">
          <select
            value={district}
            onChange={(e) => handleDistrict(e.target.value)}
            disabled={!city || loadingDistricts}
            className={selectClass}
          >
            <option value="">
              {loadingDistricts ? 'Memuat...' : '— Pilih Kecamatan —'}
            </option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          {loadingDistricts ? (
            <Loader2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-brand-500" />
          ) : (
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          )}
        </div>
      </div>

      {/* Village */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {labels.village}
        </label>
        <div className="relative">
          <select
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            disabled={!district || loadingVillages}
            className={selectClass}
          >
            <option value="">
              {loadingVillages ? 'Memuat...' : '— Pilih Kelurahan/Desa —'}
            </option>
            {villages.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          {loadingVillages ? (
            <Loader2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-brand-500" />
          ) : (
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          )}
        </div>
      </div>

      {/* Hidden inputs — store the selected IDs */}
      <input type="hidden" name={names.province} value={province} />
      <input type="hidden" name={names.city} value={city} />
      <input type="hidden" name={names.district} value={district} />
      <input type="hidden" name={names.village} value={village} />
    </div>
  )
}