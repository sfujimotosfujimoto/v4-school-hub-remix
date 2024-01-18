import { z } from "zod"

export const PermissionSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  type: z.enum(["user", "group", "unknown"]),
  emailAddress: z.string(),
  role: z.enum(["owner", "writer", "reader", "commenter", "unknown"]),
})
