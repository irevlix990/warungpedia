import { z } from 'zod'

/** Validates an analytics period query (`?range=7d|30d|90d`). */
export const analyticsRangeSchema = z.object({
  range: z.enum(['7d', '30d', '90d'], {
    message: 'Rentang waktu tidak valid.',
  }),
})
