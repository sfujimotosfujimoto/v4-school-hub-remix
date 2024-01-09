import { z } from "zod"
import { DriveFileMetaSchema } from "."

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

export const DriveFileMovesSchema = z.array(DriveFileMoveSchema)

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
