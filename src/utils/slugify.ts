/**
 * Pure slug generator for human-readable public identifiers (store slugs,
 * product slugs in a later phase). Lowercases, strips accents and unsafe
 * characters, and collapses whitespace into single hyphens.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}