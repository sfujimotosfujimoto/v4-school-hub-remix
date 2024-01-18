import type { drive_v3 } from "googleapis"

export type ActionTypeGoogle = {
  ok: boolean
  intent: "search" | "execute" | "undo" | "undo-csv"
  type: "move" | "rename" | "rename-csv" | "property" | "delete"
  error?: string
  data?:
    | {
        sourceFolder?: drive_v3.Schema$File
        driveFiles: { [key: string]: any }[]
        errorFiles?: { [key: string]: any }[]
      }
    | { files: drive_v3.Schema$File[] }
}

export interface PersonGoogle {
  last: string
  first: string
  email: string
  picture: string
}

export type PermissionGoogle = {
  id: string
  displayName: string
  type: "user" | "group" | "unknown"
  emailAddress: string
  role: "owner" | "writer" | "reader" | "commenter" | "unknown"
}

// export type DriveFileGoogle = {
//   id: string
//   name: string
//   mimeType: string
//   link?: string
//   iconLink: string
//   hasThumbnail: boolean
//   thumbnailLink?: string
//   createdTime?: Date
//   modifiedTime?: Date
//   webContentLink?: string
//   parents?: string[]
//   appProperties?: string
//   meta?: DriveFileMetaGoogle
//   permissions?: PermissionGoogle[]
// }

// export type TokensGoogle = {
//   access_token: string
//   scope: string
//   token_type: string
//   expiry_date: number
//   id_token?: string
//   refresh_token?: string
// }

// export type StudentGoogle = {
//   gakuseki: number
//   gakunen: string
//   hr: string
//   hrNo: number
//   last: string
//   first: string
//   sei: string
//   mei: string
//   email: string
//   folderLink: string | null
// }

// export interface UserBase extends PersonGoogle {
//   exp: number
// }

// rexp = refresh token expiry date
// export type Payload = {
//   email: string
//   exp: number
//   rexp: number
// }

// export type DriveFileMetaGoogle = {
//   selected?: boolean
//   studentFolder?: {
//     folderLink?: string
//     folderId?: string
//     name?: string
//   }
//   destination?: {
//     folderId?: string
//     name?: string
//   }
//   last?: {
//     folderId?: string
//   }
//   file?: {
//     segments?: string[]
//     name?: string
//     formerName?: string
//     studentEmail?: string
//     tags?: string
//     nendo?: string
//   }
//   student?: StudentGoogle
//   permissions?: PermissionGoogle[]
// }
