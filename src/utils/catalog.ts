/**
 * Pure helpers for working with the flat category rows returned by the
 * catalog service. Wrapped / imported by pages and components; kept free of
 * I/O so they can be unit-tested.
 */
import type { Category } from '@/types/catalog'

/** Groups categories by their parent id (null = root). */
export function groupByParent(
  categories: Category[]
): Map<string | null, Category[]> {
  const grouped = new Map<string | null, Category[]>()
  for (const category of categories) {
    const list = grouped.get(category.parentId) ?? []
    list.push(category)
    grouped.set(category.parentId, list)
  }
  return grouped
}

/** Root (top-level) categories from a grouped map, sorted by sortOrder. */
export function topLevelCategories(
  grouped: Map<string | null, Category[]>
): Category[] {
  return sortByOrder(grouped.get(null) ?? [])
}

/** Direct children of a given category id, sorted by sortOrder. */
export function childrenOf(
  grouped: Map<string | null, Category[]>,
  parentId: string
): Category[] {
  return sortByOrder(grouped.get(parentId) ?? [])
}

/** True when a category has one or more children in the grouped map. */
export function hasChildren(
  grouped: Map<string | null, Category[]>,
  categoryId: string
): boolean {
  return (grouped.get(categoryId)?.length ?? 0) > 0
}

function sortByOrder(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => a.sortOrder - b.sortOrder)
}