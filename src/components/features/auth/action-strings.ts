import type { IdDictionary } from '@/lib/i18n'

/**
 * Shape of the `auth` dictionary section, exported for client components
 * that need translated strings passed down as props (server → client).
 */
export type DictionaryAuth = IdDictionary['auth']

/** Shape of the `account` dictionary section passed to account client components. */
export type DictionaryAccount = IdDictionary['account']

export type DictionaryCommon = IdDictionary['common']

/** Shape of the `seller` dictionary section passed to seller client components. */
export type DictionarySeller = IdDictionary['seller']

/** Shape of the `admin` dictionary section passed to admin client components. */
export type DictionaryAdmin = IdDictionary['admin']

/** Shape of the `product` dictionary section passed to product client components. */
export type DictionaryProduct = IdDictionary['product']

/** Shape of the `search` dictionary section passed to search client components. */
export type DictionarySearch = IdDictionary['search']

/** Shape of the `cart` dictionary section passed to cart/checkout client components. */
export type DictionaryCart = IdDictionary['cart']

/** Shape of the `finance` dictionary section passed to financial client components. */
export type DictionaryFinance = IdDictionary['finance']

/** Shape of the `shipping` dictionary section passed to shipping/returns client components. */
export type DictionaryShipping = IdDictionary['shipping']

/** Shape of the `communication` dictionary section passed to notification/chat client components. */
export type DictionaryCommunication = IdDictionary['communication']

/** Shape of the `promotions` dictionary section passed to promo client components. */
export type DictionaryPromotions = IdDictionary['promotions']

/** Shape of the `social` dictionary section passed to social client components. */
export type DictionarySocial = IdDictionary['social']
