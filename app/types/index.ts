import type { DriveFile, Student, DriveFileMeta } from "."
import type { drive_v3 } from "googleapis"

export type * from "./prisma-types"
export type * from "./google-types"
export type * from "./zod-types"

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

export type DriveFileTask = Pick<DriveFile, "id" | "parents"> & {
  meta: DriveFileMeta
}

// used for transfering data for admin actions
export type ActionResponse = {
  successFiles: drive_v3.Schema$File[]
  errorFiles: drive_v3.Schema$File[]
}

// export type DriveFileRename = Pick<DriveFile, "id"> & {
//   meta: Pick<DriveFileMeta, "file">
// }

// // rexp = refresh token expiry date
// export type Payload = {
//   email: string
//   exp: number
//   rexp: number
// }
