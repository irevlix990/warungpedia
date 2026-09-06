/**
 * Indonesian administrative regions (provinces + regencies).
 *
 * Data source: emsifa/api-wilayah-indonesia (Kemendagri official data).
 * Provinces and regencies are bundled locally for instant dropdowns.
 * Districts and villages are fetched on-demand from the same API.
 */

import provincesRaw from './provinces.json'
import regenciesRaw from './regencies.json'

export interface Province {
  id: string
  name: string
}

export interface Regency {
  id: string
  provinceId: string
  name: string
}

export interface District {
  id: string
  name: string
}

export interface Village {
  id: string
  name: string
  postalCode?: string
}

interface ProvinceRaw {
  id: string
  name: string
}

interface RegencyRaw {
  id: string
  name: string
}

const provincesData = (provincesRaw as { data: ProvinceRaw[] }).data
const regenciesData = regenciesRaw as RegencyRaw[]

export const PROVINCES: Province[] = provincesData.map((p) => ({
  id: p.id,
  name: p.name,
}))

export const REGENCIES: Regency[] = regenciesData.map((r) => ({
  id: r.id,
  provinceId: r.id.split('.')[0],
  name: r.name,
}))

/** Regencies (cities/kabupaten) belonging to a province. */
export function getRegenciesByProvince(provinceId: string): Regency[] {
  return REGENCIES.filter((r) => r.provinceId === provinceId)
}

/** Resolve a province ID to its display name. */
export function resolveProvinceName(id: string): string {
  return PROVINCES.find((p) => p.id === id)?.name ?? id
}

/** Resolve a regency/city ID to its display name. */
export function resolveCityName(id: string): string {
  const regency = getRegenciesByProvince(id.split('.')[0]).find(
    (r) => r.id === id
  )
  return regency?.name ?? id
}

/** Districts for a regency — fetched on-demand from the API. */
export async function getDistricts(regencyId: string): Promise<District[]> {
  const res = await fetch(
    `https://www.emsifa.com/api-wilayah-indonesia/v2/districts/${regencyId}.json`,
    { next: { revalidate: 86400 } }
  )
  if (!res.ok) return []
  const json = (await res.json()) as { data: { id: string; name: string }[] }
  return json.data.map((d) => ({ id: d.id, name: d.name }))
}

/** Villages/kelurahan for a district — fetched on-demand from the API. */
export async function getVillages(districtId: string): Promise<Village[]> {
  const res = await fetch(
    `https://www.emsifa.com/api-wilayah-indonesia/v2/villages/${districtId}.json`,
    { next: { revalidate: 86400 } }
  )
  if (!res.ok) return []
  const json = (await res.json()) as {
    data: { id: string; name: string; postal_code?: string }[]
  }
  return json.data.map((v) => ({
    id: v.id,
    name: v.name,
    postalCode: v.postal_code,
  }))
}