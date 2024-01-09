import { z } from "zod"

export const CredentialSchema = z.object({
  accessToken: z.string(),
  expiry: z.date(),
  // expiry: z.string().datetime(),
  refreshToken: z.string().nullable(),
  refreshTokenExpiry: z.date(),
  // refreshTokenExpiry: z.string().datetime(),
  createdAt: z.date(),
  // createdAt: z.string().datetime(),
  // createdAt: z
  //   .string()
  //   .or(z.date())
  //   .transform((arg) => new Date(arg)),
  userId: z.number(),
})
