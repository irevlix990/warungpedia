/** Public catalog DTO used across services, pages and components. */
export interface Category {
  id: string
  slug: string
  name: string
  description: string | null
  parentId: string | null
  imageUrl: string | null
  sortOrder: number
  isActive: boolean
}