import type { z } from "zod"
import type {
  CredentialSchema,
  DriveFileDataSchema,
  StatsSchema,
  StudentSchema,
  UserSchema,
} from "~/schemas"

import type {
  User as PrismaUser,
  DriveFileData as PrismaDriveFileData,
} from "@prisma/client"

// type inferred from zod schemas
export type User = z.infer<typeof UserSchema>
export type Student = z.infer<typeof StudentSchema>
export type DriveFileData = z.infer<typeof DriveFileDataSchema>
export type Credential = z.infer<typeof CredentialSchema>
export type Stats = z.infer<typeof StatsSchema>

export type ProviderUser = Pick<User, "id" | "role" | "email" | "picture">

export type PrismaUserWithAll = Omit<PrismaUser, "oldId"> & {
  credential: Credential | null
  stats: Stats | null
  student?: Student | null
  driveFileData?: PrismaDriveFileData[] | null
}

// type PrismaCredential = {
//   accessToken: string
//   expiry: bigint
//   refreshToken: string | null
//   refreshTokenExpiry: bigint
//   createdAt: Date
// }
