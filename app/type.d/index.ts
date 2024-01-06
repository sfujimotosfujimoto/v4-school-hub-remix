import type { DriveFile, Student, DriveFileMeta } from "."

export type * from "./prisma-types"
export type * from "./google-types"
export type * from "./zod-types"

// export type {
//   Credential as PrismaCredential,
//   // DriveFileData as PrismaDriveFileData,
//   Stats as PrismaStats,
//   User as PrismaUser,
// } from "@prisma/client"

// rexp = refresh token expiry date
export type Payload = {
  email: string
  exp: number
  rexp: number
}

export type Gakunen = "ALL" | "J1" | "J2" | "J3" | "H1" | "H2" | "H3"
export type Hr = "ALL" | "A" | "B" | "C" | "D" | "E" | "F"

export type Task = {
  id: string
  active: boolean
  time: number
  type: "rename" | "move" | "create" | "delete"
  driveFiles?: DriveFile[]
  students?: Student[]
  driveFile?: DriveFile
}

export type DriveFileMove = Pick<DriveFile, "id" | "parents"> & {
  meta: Pick<DriveFileMeta, "destination" | "last">
}
export type DriveFileRename = Pick<DriveFile, "id"> & {
  meta: Pick<DriveFileMeta, "file">
}

export type DriveFileTask = Pick<DriveFile, "id" | "parents"> & {
  meta: DriveFileMeta
}

// export type DriveFileData = Omit<
//   PrismaDriveFileData,
//   "createdTime" | "modifiedTime" | "firstSeen" | "lastSeen" | "appProperties"
// > & {
//   createdTime: number
//   modifiedTime: number
//   firstSeen: number
//   lastSeen: number
//   appProperties: {
//     [key: string]: string | null
//   } | null
// }

// export interface User {
//   id: number
//   first: string
//   last: string
//   email: string
//   picture: string
//   role: Role
//   activated: boolean
//   createdAt: Date
//   updatedAt: Date
//   credential: Credential | null
//   stats: Stats | null
//   student?: Student | null
//   studentGakuseki?: number | null
//   driveFileData?: DriveFileData[] | null
// }

// type Credential = {
//   accessToken: string
//   expiry: number
//   refreshToken: string | null
//   refreshTokenExpiry: number
//   createdAt: Date
// }

// export type Student = {
//   gakuseki: number
//   gakunen: string
//   hr: string
//   hrNo: number
//   last: string
//   first: string
//   sei: string
//   mei: string
//   email: string
//   folderLink?: string | null
//   userId?: number
//   createdAt?: Date
//   expiry?: number
// }
