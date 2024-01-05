import { DriveFilesSchema, DriveFileSchema } from "~/schemas"
import type { DriveFile } from "~/type.d"

// Function to convert date strings to Date objects for specified keys
export function convertDateStringsToDateObjects(
  array: { [key: string]: any }[],
  keys: string[],
) {
  return array.map((object) => {
    const modifiedObject: { [key: string]: any } = { ...object }

    keys.forEach((key: string) => {
      if (object[key]) {
        modifiedObject[key] = new Date(object[key])
      }
    })

    return modifiedObject
  })
}
export function convertAppPropsToDateObjects(array: { [key: string]: any }[]) {
  return array.map((object) => {
    const modifiedObject: { [key: string]: any } = { ...object }

    const appProps = object["appProperties"]
    if (appProps) {
      if (typeof appProps === "string") {
        modifiedObject["appProperties"] = appProps
      } else if (typeof appProps === "object") {
        modifiedObject["appProperties"] = JSON.stringify(appProps)
      } else {
        modifiedObject["appProperties"] = undefined
      }
    }

    return modifiedObject
  })
}

export function convertDriveFiles(
  serializedDriveFiles: { [key: string]: any }[],
): DriveFile[] {
  let objz = convertDateStringsToDateObjects(serializedDriveFiles, [
    "createdTime",
    "modifiedTime",
  ])

  objz = convertAppPropsToDateObjects(objz)

  const res = DriveFilesSchema.safeParse(objz)
  if (!res.success) {
    throw new Error(res.error.message)
  }

  return res.data
}

export function convertDriveFileDatum(serializedDriveFile: {
  [key: string]: any
}): DriveFile {
  const obj = convertDateStringsToDateObjects(
    [serializedDriveFile],
    ["createdTime", "modifiedTime"],
  )
  const res = DriveFileSchema.safeParse(obj.at(0))
  if (!res.success) {
    throw new Error(res.error.message)
  }

  return res.data
}
