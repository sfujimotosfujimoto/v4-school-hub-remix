import type { Role } from "@prisma/client"
import type { drive_v3 } from "googleapis"

export type Tokens = {
  access_token: string
  scope: string
  token_type: string
  expiry_date: number
  id_token?: string
  refresh_token?: string
}

export interface Person {
  last: string
  first: string
  email: string
  picture: string
}

export interface UserBase extends Person {
  exp: number
}

export type Gakunen = "ALL" | "J1" | "J2" | "J3" | "H1" | "H2" | "H3"
export type Hr = "ALL" | "A" | "B" | "C" | "D" | "E" | "F"

export interface User {
  id: number
  first: string
  last: string
  email: string
  picture: string
  role: Role
  activated: boolean
  createdAt: Date
  updatedAt: Date
  credential: {
    accessToken: string
    expiry: number
    refreshToken: string | null
    refreshTokenExpiry: number
    createdAt: Date
  } | null
  stats: {
    count: number
    lastVisited: Date
  } | null
}

export interface RawUser {
  id: number
  first: string
  last: string
  email: string
  picture: string
  role: Role
  activated: boolean
  createdAt: string
  updatedAt: string
  credential: {
    accessToken: string
    expiry: number
    refreshToken: string | null
    refreshTokenExpiry: number
    createdAt: Date
  } | null
  stats: {
    count: number
    lastVisited: string
  } | null
}

export interface PrismaUser {
  id: number
  first: string
  last: string
  email: string
  picture: string
  role: Role
  activated: boolean
  createdAt: Date
  updatedAt: Date
  credential: {
    accessToken: string
    expiry: bigint
    refreshToken: string | null
    refreshTokenExpiry: bigint
    createdAt: Date
  } | null
  stats: {
    count: number
    lastVisited: Date
  } | null
}

export type DriveFile = {
  id: string
  name: string
  mimeType: string
  link: string
  iconLink: string
  hasThumbnail: boolean
  thumbnailLink?: string
  createdTime?: string
  modifiedTime?: string
  webContentLink?: string
  parents?: string[]
  appProperties?: {
    [key: string]: string | null
  }
  permissions?: Permission[] | undefined
  meta?: DriveFileMeta
}

export type DriveFileMeta = {
  selected?: boolean
  studentFolder?: {
    folderLink?: string
    folderId?: string
    name?: string
  }
  destination?: {
    folderId?: string
    name?: string
  }
  last?: {
    folderId?: string
  }
  file?: {
    segments?: string[]
    name?: string
    formerName?: string
    studentEmail?: string
    tags?: string
    nendo?: string
  }
  student?: Student
  permissions?: Permission[]
}

export type MoveDataType = {
  active: boolean
  time: number
  driveFileData?: DriveFile[]
}

export type MoveType = {
  id: string
  data: MoveDataType
}

export type Student = {
  gakuseki: number
  gakunen: string
  hr: string
  hrNo: number
  last: string
  first: string
  sei: string
  mei: string
  email: string
  folderLink: string | null
}

export type Permission = {
  id: string
  displayName: string
  type: "user" | "group" | "unknown"
  emailAddress: string
  role: "owner" | "writer" | "reader" | "unknown"
}

export type State = "idle" | "success" | "loading" | "error"

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

// rexp = refresh token expiry date
export type Payload = {
  email: string
  exp: number
  rexp: number
}

export type ActionType = {
  ok: boolean
  type: string
  error?: string
  data?:
    | {
        sourceFolder: drive_v3.Schema$File
        driveFiles: DriveFile[]
      }
    | { files: drive_v3.Schema$File[] }
}
