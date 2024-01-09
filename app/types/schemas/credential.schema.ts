import { z } from "zod"

export const CredentialSchema = z.object({
  accessToken: z.string(),
  expiry: z.date(),
  refreshToken: z.string().nullable(),
  refreshTokenExpiry: z.date(),
  createdAt: z.date(),
  userId: z.number(),
})
