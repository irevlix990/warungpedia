'use client'

import * as React from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import {
  PROVINCES,
  getRegenciesByProvince,
  getDistricts,
  getVillages,
  resolveProvinceId,
  resolveCityId,
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
  /** Initial values (existing data). */
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

/** Split `"id|name"` into { id, name }. Falls back to raw as id. */
function splitIdName(raw: string): { id: string; name: string } {
  const idx = raw.indexOf('|')
  if (idx === -1) return { id: raw, name: '' }
  return { id: raw.slice(0, idx), name: raw.slice(idx + 1) }
}

/**
 * Cascading Indonesian address selector: Province → City → District → Village.
 *
 * Province & city come from bundled data; district & village are fetched
 * on-demand from the emsifa API. Selecting a province filters the city list,
 * selecting a city loads its districts, etc.
 *
 * Each hidden input emits `"id|name"` so the consumer can store both the
 * machine-readable ID and the human-readable display name.
 */
export function CascadingAddressSelect({
  names,
  value,
  labels,
  className,
}: CascadingAddressSelectProps) {
  const initProvince = splitIdName(value?.province ?? '')
  const initCity = splitIdName(value?.city ?? '')
  const initDistrict = splitIdName(value?.district ?? '')
  const initVillage = splitIdName(value?.village ?? '')

  // When the DB stores plain names (no "|"), reverse-resolve to IDs.
  const resolvedProvinceId =
    initProvince.id && !initProvince.name
      ? resolveProvinceId(initProvince.id) || initProvince.id
      : initProvince.id
  const resolvedCityId =
    initCity.id && !initCity.name
      ? resolveCityId(initCity.id) || initCity.id
      : initCity.id

  const [province, setProvince] = React.useState(resolvedProvinceId)
  const [city, setCity] = React.useState(resolvedCityId)
  const [district, setDistrict] = React.useState(initDistrict.id)
  const [village, setVillage] = React.useState(initVillage.id)

  // Display names (emitted alongside IDs)
  const [provinceName, setProvinceName] = React.useState(
    initProvince.name || initProvince.id
  )
  const [cityName, setCityName] = React.useState(
    initCity.name || initCity.id
  )
  const [districtName, setDistrictName] = React.useState(
    initDistrict.name || initDistrict.id
  )
  const [villageName, setVillageName] = React.useState(
    initVillage.name || initVillage.id
  )

  const [districts, setDistricts] = React.useState<District[]>([])
  const [villages, setVillages] = React.useState<Village[]>([])
  const [loadingDistricts, setLoadingDistricts] = React.useState(
    Boolean(resolvedCityId)
  )
  const [loadingVillages, setLoadingVillages] = React.useState(
    Boolean(initDistrict.id)
  )

  const cities = province ? getRegenciesByProvince(province) : []

  // Pre-load districts when initialized with a city value (edit mode)
  React.useEffect(() => {
    if (resolvedCityId) {
      getDistricts(resolvedCityId).then((data) => {
        setDistricts(data)
        setLoadingDistricts(false)
        // Auto-resolve district name if not provided
        if (initDistrict.id && !initDistrict.name) {
          const match = data.find((d) => d.id === initDistrict.id)
          if (match) setDistrictName(match.name)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Also pre-load villages when initialized with a district value
  React.useEffect(() => {
    if (initDistrict.id) {
      getVillages(initDistrict.id).then((data) => {
        setVillages(data)
        setLoadingVillages(false)
        if (initVillage.id && !initVillage.name) {
          const match = data.find((v) => v.id === initVillage.id)
          if (match) setVillageName(match.name)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleProvince = (raw: string) => {
    const { id, name } = splitIdName(raw)
    setProvince(id)
    setProvinceName(name)
    setCity('')
    setCityName('')
    setDistrict('')
    setDistrictName('')
    setVillage('')
    setVillageName('')
    setDistricts([])
    setVillages([])
  }

  const handleCity = async (raw: string) => {
    const { id, name } = splitIdName(raw)
    setCity(id)
    setCityName(name)
    setDistrict('')
    setDistrictName('')
    setVillage('')
    setVillageName('')
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

  const handleDistrict = async (raw: string) => {
    const { id, name } = splitIdName(raw)
    setDistrict(id)
    setDistrictName(name)
    setVillage('')
    setVillageName('')
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

  const handleVillage = (raw: string) => {
    const { id, name } = splitIdName(raw)
    setVillage(id)
    setVillageName(name)
  }

  const enc = (id: string, name: string) => (id ? `${id}|${name}` : '')

  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}>
      {/* Province */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {labels.province}
        </label>
        <div className="relative">
          <select
            value={enc(province, provinceName)}
            onChange={(e) => handleProvince(e.target.value)}
            className={selectClass}
          >
            <option value="">— Pilih Provinsi —</option>
            {PROVINCES.map((p) => (
              <option key={p.id} value={`${p.id}|${p.name}`}>
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
            value={enc(city, cityName)}
            onChange={(e) => handleCity(e.target.value)}
            disabled={!province}
            className={selectClass}
          >
            <option value="">— Pilih Kota/Kabupaten —</option>
            {cities.map((c) => (
              <option key={c.id} value={`${c.id}|${c.name}`}>
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
            value={enc(district, districtName)}
            onChange={(e) => handleDistrict(e.target.value)}
            disabled={!city || loadingDistricts}
            className={selectClass}
          >
            <option value="">
              {loadingDistricts ? 'Memuat...' : '— Pilih Kecamatan —'}
            </option>
            {districts.map((d) => (
              <option key={d.id} value={`${d.id}|${d.name}`}>
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
            value={enc(village, villageName)}
            onChange={(e) => handleVillage(e.target.value)}
            disabled={!district || loadingVillages}
            className={selectClass}
          >
            <option value="">
              {loadingVillages ? 'Memuat...' : '— Pilih Kelurahan/Desa —'}
            </option>
            {villages.map((v) => (
              <option key={v.id} value={`${v.id}|${v.name}`}>
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

      {/* Hidden inputs — emit "id|name" for each level */}
      <input type="hidden" name={names.province} value={enc(province, provinceName)} />
      <input type="hidden" name={names.city} value={enc(city, cityName)} />
      <input type="hidden" name={names.district} value={enc(district, districtName)} />
      <input type="hidden" name={names.village} value={enc(village, villageName)} />
    </div>
  )
}