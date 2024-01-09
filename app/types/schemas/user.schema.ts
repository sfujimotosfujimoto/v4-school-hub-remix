import { z } from "zod"
import { CredentialSchema, StatsSchema } from "."

export const UserSchema = z.object({
  id: z.number(),
  first: z.string(),
  last: z.string(),
  email: z.string(),
  picture: z.string(),
  role: z.enum(["USER", "MODERATOR", "ADMIN", "SUPER"]),
  activated: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  credential: CredentialSchema.pick({
    accessToken: true,
    expiry: true,
    refreshToken: true,
    refreshTokenExpiry: true,
    createdAt: true,
  }).nullable(),
  stats: StatsSchema.pick({
    count: true,
    lastVisited: true,
  }).nullable(),
  // driveFileData: DriveFileDataSchema.omit({
  //   userId: true,
  // }).array(),
})

export const UsersSchema = z.array(UserSchema)
