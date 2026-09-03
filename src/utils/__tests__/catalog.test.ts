import { describe, expect, it } from 'vitest'
import type { Category } from '@/types/catalog'
import {
  childrenOf,
  groupByParent,
  hasChildren,
  topLevelCategories,
} from '@/utils/catalog'

function makeCategory(partial: Partial<Category> & { id: string }): Category {
  return {
    slug: partial.id,
    name: partial.id,
    description: null,
    parentId: null,
    imageUrl: null,
    sortOrder: 0,
    isActive: true,
    ...partial,
  } as Category
}

const fixtures: Category[] = [
  makeCategory({ id: 'a', slug: 'a', sortOrder: 20 }),
  makeCategory({ id: 'b', slug: 'b', sortOrder: 10 }),
  makeCategory({ id: 'a-1', slug: 'a-1', parentId: 'a', sortOrder: 1 }),
  makeCategory({ id: 'a-2', slug: 'a-2', parentId: 'a', sortOrder: 2 }),
  makeCategory({ id: 'b-1', slug: 'b-1', parentId: 'b', sortOrder: 1 }),
]

describe('catalog tree helpers', () => {
  const grouped = groupByParent(fixtures)

  it('groups categories by parent id (null = roots)', () => {
    expect(grouped.get(null)?.map((c) => c.id).sort()).toEqual(['a', 'b'])
    expect(grouped.get('a')?.map((c) => c.id)).toEqual(['a-1', 'a-2'])
    expect(grouped.get('b')?.map((c) => c.id)).toEqual(['b-1'])
    expect(grouped.get('missing')).toBeUndefined()
  })

  it('returns root categories sorted by sortOrder', () => {
    expect(topLevelCategories(grouped).map((c) => c.id)).toEqual(['b', 'a'])
  })

  it('returns empty roots when nothing is top-level', () => {
    const onlyChildren = fixtures.filter((c) => c.parentId !== null)
    expect(topLevelCategories(groupByParent(onlyChildren))).toEqual([])
  })

  it('returns children for a category ordered by sortOrder', () => {
    expect(childrenOf(grouped, 'a').map((c) => c.id)).toEqual(['a-1', 'a-2'])
    expect(childrenOf(grouped, 'b').map((c) => c.id)).toEqual(['b-1'])
  })

  it('reports whether a category has children', () => {
    expect(hasChildren(grouped, 'a')).toBe(true)
    expect(hasChildren(grouped, 'a-1')).toBe(false)
  })
})