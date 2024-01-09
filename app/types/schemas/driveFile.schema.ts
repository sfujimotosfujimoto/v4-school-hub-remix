import { z } from "zod"
import { PermissionSchema } from "./permission.schema"
import { StudentSchema } from "./student.schema"

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
  permissions: z.array(PermissionSchema).optional(),
})

export const DriveFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  mimeType: z.string(),
  link: z.string().optional(),
  iconLink: z.string(),
  hasThumbnail: z.boolean(),
  thumbnailLink: z.string().optional(),
  createdTime: z.date().optional(),
  modifiedTime: z.date().optional(),
  webViewLink: z.string().optional(),
  webContentLink: z.string().optional(),
  parents: z.array(z.string()).optional(),
  appProperties: z.string().optional(),
  meta: DriveFileMetaSchema.optional(),
  permissions: z.array(PermissionSchema).optional(),
})

export const DriveFilesSchema = z.array(DriveFileSchema)
