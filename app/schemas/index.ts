import { z } from "zod"

export const PermissionsSchema = z.array(
  z.object({
    id: z.string(),
    displayName: z.string(),
    type: z.string(),
    emailAddress: z.string(),
    role: z.string(),
  }),
)

export const StudentSchema = z.object({
  gakuseki: z.number(),
  gakunen: z.string(),
  hr: z.string(),
  hrNo: z.number(),
  last: z.string(),
  first: z.string(),
  sei: z.string(),
  mei: z.string(),
  email: z.string(),
  folerLink: z.string().optional().nullable(),
})

export const DriveFileMetaSchema = z.object({
  selected: z.boolean().optional(),
  studentFolder: z
    .object({
      folderLink: z.string().optional(),
      folderId: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
  destination: z
    .object({
      folderId: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
  last: z
    .object({
      folderId: z.string().optional(),
    })
    .optional(),
  file: z
    .object({
      segments: z.array(z.string()).optional(),
      name: z.string().optional(),
      formerName: z.string().optional(),
      studentEmail: z.string().optional(),
      tags: z.string().optional(),
      nendo: z.string().optional(),
    })
    .optional(),
  student: StudentSchema.optional(),
  permissions: PermissionsSchema.optional(),
})

export const DriveFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  mimeType: z.string(),
  link: z.string(),
  iconLink: z.string(),
  hasThumbnail: z.boolean(),
  thumbnailLink: z.string().optional(),
  createdTime: z
    .string()
    .or(z.date())
    .transform((arg) => new Date(arg))
    .optional(),
  modifiedTime: z
    .string()
    .or(z.date())
    .transform((arg) => new Date(arg))
    .optional(),
  webContentLink: z.string().optional(),
  parents: z.array(z.string()),
  appProperties: z.record(z.string(), z.string()),
  meta: DriveFileMetaSchema.optional(),
})

export const DriveFilesSchema = z.array(DriveFileSchema)

export const TaskSchema = z.object({
  id: z.string(),
  active: z.boolean(),
  time: z.number(),
  type: z.enum(["rename", "move", "create", "delete"]),
  driveFiles: DriveFilesSchema.optional(),
  students: z.array(StudentSchema).optional(),
  driveFile: DriveFileSchema.optional(),
})

export const DriveFileMoveSchema = z.object({
  id: z.string(),
  parents: z.array(z.string()),
  meta: z.object({
    destination: z
      .object({
        folderId: z.string().optional(),
        name: z.string().optional(),
      })
      .optional(),
    last: z
      .object({
        folderId: z.string().optional(),
      })
      .optional(),
  }),
})

export const DriveFileRenameSchema = z.object({
  id: z.string(),
  meta: z.object({
    file: z
      .object({
        segments: z.array(z.string()).optional(),
        name: z.string().optional(),
        formerName: z.string().optional(),
        studentEmail: z.string().optional(),
        tags: z.string().optional(),
        nendo: z.string().optional(),
      })
      .optional(),
  }),
})
export const DriveFilesRenameSchema = z.array(DriveFileRenameSchema)

export const DriveFileTaskSchema = z.object({
  id: z.string(),
  parents: z.array(z.string()),
  meta: DriveFileMetaSchema,
})

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
  credential: z
    .object({
      accessToken: z.string(),
      expiry: z.number(),
      refreshToken: z.string().nullable(),
      refreshTokenExpiry: z.number(),
      createdAt: z.date(),
    })
    .nullable(),
  stats: z
    .object({
      count: z.number(),
      lastVisited: z.date(),
    })
    .nullable(),
})
