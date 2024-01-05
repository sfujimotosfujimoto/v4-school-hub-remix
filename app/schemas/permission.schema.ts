import { z } from "zod"

export const PermissionsSchema = z.array(
  z.object({
    id: z.string(),
    displayName: z.string(),
    type: z.enum(["user", "group"]),
    emailAddress: z.string(),
    role: z.enum(["owner", "writer", "reader"]),
  }),
)
