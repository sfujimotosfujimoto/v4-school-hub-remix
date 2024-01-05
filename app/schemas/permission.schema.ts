import { z } from "zod"

export const PermissionsSchema = z.array(
  z.object({
    id: z.string(),
    displayName: z.string(),
    type: z.string(),
    emailAddress: z.string(),
    role: z.string(),
  }),
)
