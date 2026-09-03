/**
 * Internationalization configuration.
 *
 * Initial locales: id (default) and en. The architecture supports adding
 * more locales by extending the LOCALES list and adding a dictionary.
 * UI strings must go through translation keys rather than being hardcoded.
 */

export const LOCALES = ['id', 'en'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'id'

export const localeNames: Record<Locale, string> = {
  id: 'Bahasa Indonesia',
  en: 'English',
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}
