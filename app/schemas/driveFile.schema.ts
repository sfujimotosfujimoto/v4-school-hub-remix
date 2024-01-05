import { z } from "zod"
import { PermissionsSchema } from "./permission.schema"
import { StudentSchema } from "./student.schema"

export const DriveFileMetaSchema = z.object({
  selected: z.boolean().optional(),
  studentFolder: z
    .object({
      folderLink: z.string().optional(),
      // folderId: z.string().optional(),
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
  link: z.string().optional(),
  iconLink: z.string(),
  hasThumbnail: z.boolean(),
  thumbnailLink: z.string().optional(),
  createdTime: z.date(),
  // createdTime: z.string().datetime(),
  // createdTime: z
  //   .string()
  //   .or(z.date())
  //   .transform((arg) => new Date(arg))
  //   .optional(),
  modifiedTime: z.date(),
  // modifiedTime: z.string().datetime(),
  // modifiedTime: z
  //   .string()
  //   .or(z.date())
  //   .transform((arg) => new Date(arg))
  //   .optional(),
  webContentLink: z.string().optional(),
  parents: z.array(z.string()),
  appProperties: z.record(z.string(), z.string()).optional(),
  meta: DriveFileMetaSchema.optional(),
})

export const DriveFilesSchema = z.array(DriveFileSchema)
