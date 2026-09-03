import { escapeJsonLd } from '@/lib/seo/seo'

/**
 * Renders a JSON-LD structured-data block as an inline `<script>` tag.
 * Data is passed as a plain object; the server component serializes it once,
 * keeping the payload static and optimizable. Every string value is escaped
 * first so seller-controlled fields (product/store name, description, brand)
 * can never break out of the `<script>` element into executable HTML.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(escapeJsonLd(data)),
      }}
    />
  )
}
