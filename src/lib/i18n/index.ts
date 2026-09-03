import type { Locale } from '@/config/i18n'
import { id, type IdDictionary } from './dictionaries/id'
import { en } from './dictionaries/en'

const dictionaries: Record<Locale, IdDictionary> = {
  id,
  en,
}

/** Returns the translation dictionary for a locale (defaults to Indonesian). */
export function getDictionary(locale: Locale = 'id'): IdDictionary {
  return dictionaries[locale]
}

export type { IdDictionary }
