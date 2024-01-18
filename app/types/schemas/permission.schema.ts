import { z } from "zod"

export const typeGoogle: readonly [string, ...string[]] = [
  "user",
  "group",
  "unknown",
]

export const roleGoogle: readonly [string, ...string[]] = [
  "owner",
  "writer",
  "reader",
  "commenter",
  "unknown",
]

export const PermissionSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  type: z.enum(["user", "group", "unknown"]),
  emailAddress: z.string(),
  role: z.enum(roleGoogle),
})
