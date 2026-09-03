/** A product review written by a buyer who purchased the product. */
export interface ProductReview {
  id: string
  productId: string
  storeId: string
  userId: string
  orderId: string
  authorName: string
  rating: number
  title: string | null
  body: string
  status: 'ACTIVE' | 'HIDDEN'
  createdAt: string
  updatedAt: string
}

/** Input for creating / updating a product review. */
export interface ReviewInput {
  rating: number
  title?: string | null
  body: string
}

/** A store follow record. */
export interface StoreFollow {
  userId: string
  storeId: string
  createdAt: string
}

/** A named wishlist collection. */
export interface Wishlist {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
}

/** A product inside a wishlist collection. */
export interface WishlistItem {
  wishlistId: string
  productId: string
  notes: string | null
  createdAt: string
}

/** Input for adding a product to a wishlist. */
export interface WishlistItemInput {
  productId: string
  wishlistId?: string | null
  notes?: string | null
}

/** Raw product view event (recommendation foundation). */
export interface ProductView {
  id: number
  userId: string | null
  productId: string
  viewedAt: string
}

/** Product card shape returned by `get_related_products`. */
export interface RelatedProduct {
  productId: string
  slug: string
  name: string
  price: number
  imageUrl: string | null
  reviewsCount: number
  ratingAvg: number
}

/** Denormalized rating aggregate for a product or store. */
export interface RatingAggregate {
  average: number
  count: number
}
