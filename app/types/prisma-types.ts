import type { z } from "zod"
import type { CredentialSchema, StatsSchema, UserSchema } from "~/types/schemas"

export type {
  Credential as CredentialPrisma,
  Stats as StatsPrisma,
  User as UserPrisma,
} from "@prisma/client"

// type inferred from zod schemas
export type User = z.infer<typeof UserSchema>
export type Credential = z.infer<typeof CredentialSchema>
export type Stats = z.infer<typeof StatsSchema>

// export type ProviderUser = Pick<User, "id" | "role" | "email" | "picture">

// export type UserPrismaWithAll = Omit<UserPrisma, "oldId"> & {
//   credential: Credential | null
//   stats: Stats | null
//   student?: Student | null
// }

// type PrismaCredential = {
//   accessToken: string
//   expiry: bigint
//   refreshToken: string | null
//   refreshTokenExpiry: bigint
//   createdAt: Date
// }
