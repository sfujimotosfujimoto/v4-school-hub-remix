import { z } from "zod"

export const DriveFileDataSchema = z.object({
  fileId: z.string(),
  name: z.string(),
  mimeType: z.string(),
  iconLink: z.string(),
  hasThumbnail: z.boolean(),
  thumbnailLink: z.string().nullable(),
  webViewLink: z.string().nullable(),
  webContentLink: z.string().nullable(),
  parents: z.array(z.string()),
  appProperties: z.string().nullable(),
  createdTime: z.date(),
  // createdTime: z.string().datetime(),
  // createdTime: z
  //   .string()
  //   .or(z.date())
  //   .transform((arg) => new Date(arg)),
  modifiedTime: z.date(),
  // modifiedTime: z.string().datetime(),
  // modifiedTime: z
  //   .string()
  //   .or(z.date())
  //   .transform((arg) => new Date(arg)),
  views: z.number(),
  firstSeen: z.date(),
  // firstSeen: z.string().datetime(),
  lastSeen: z.date(),
  // lastSeen: z.string().datetime(),
  userId: z.number(),
})

export const DriveFileDatasSchema = z.array(DriveFileDataSchema)
