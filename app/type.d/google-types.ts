export type DriveFile = {
  id: string
  name: string
  mimeType: string
  link?: string
  iconLink: string
  hasThumbnail: boolean
  thumbnailLink?: string
  createdTime?: Date
  modifiedTime?: Date
  webContentLink?: string
  parents?: string[]
  appProperties?: string
  // meta?: DriveFileMeta
}

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

export type Permission = {
  id: string
  displayName: string
  type: "user" | "group"
  emailAddress: string
  role: "owner" | "writer" | "reader"
}

// rexp = refresh token expiry date
export type Payload = {
  email: string
  exp: number
  rexp: number
}

// export type DriveFileMeta = {
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
//   student?: PrismaStudent
//   permissions?: Permission[]
// }
