import Papa from "papaparse"

import type { DriveFile, DriveFileMove, DriveFileTask, Task } from "~/type.d"

// readCsvFileToObj reads csv file and returns an array of objects
// the first line is header
// the rest of the lines are data
// the header is trimmed
// the data is trimmed
// the data is converted to object
// the object keys are trimmed
// the object keys that are empty or starts with _ are deleted
// the object values are trimmed
export async function readCsvFileToObj(
  file: File,
): Promise<{ [key: string]: string }[]> {
  const data = (await parseFile(file, (data) => data)) as string

  // read csv file
  // skip lines that are empty
  // trim header
  // save data as object
  let objs = Papa.parse(data, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h: string) => h.trim(),
  }).data as { [key: string]: string }[]

  // delete columns that are blank string or starts with _
  objs = objs.map((d) => {
    const keys = Object.keys(d)

    const tmp: { [key: string]: string } = {}
    keys.forEach((key) => {
      if (key === "" || key.startsWith("_")) return
      tmp[key] = d[key]
    })
    return tmp
  })

  return objs
}

// parseCsvObjToDriveFileRename converts csv object to DriveFile[]
// csv object is an array of objects
// the first object is header
// the rest of the objects are data
// the header is trimmed
// the data is trimmed
// the data is converted to object
// the object keys are trimmed
// the object keys that are empty or starts with _ are deleted
// the object values are trimmed
// the object is converted to DriveFile
// the DriveFile is saved to DriveFile[]
export function parseCsvObjToDriveFileRename(
  csvObjs: { [key: string]: any }[],
): DriveFile[] {
  const tmps: DriveFile[] = []

  // convert csv object to DriveFile[]
  csvObjs.forEach((d) => {
    const keys = Object.keys(d) as (keyof typeof d)[]

    // create a DriveFile
    const tmp = {
      id: "",
      name: "",
      mimeType: "",
      hasThumbnail: false,
      link: "",
      iconLink: "",
      meta: {
        file: {
          name: undefined,
          formerName: undefined,
        },
      },
    }

    keys.forEach((key) => {
      if (key === "id") {
        tmp.id = d[key]
      }
      if (key === "name") {
        tmp.meta.file.name = d[key]
      }
      if (key === "formerName") {
        tmp.meta.file.formerName = d[key]
      }
    })

    if (tmp.id && tmp.meta.file.name && tmp.meta.file.formerName) tmps.push(tmp)
  })

  return tmps
}

// parseCsvObjToDriveFileMove converts csv object to DriveFileMove[]
// csv object is an array of objects
// the first object is header
// the rest of the objects are data
// the header is trimmed
// the data is trimmed
// the data is converted to object
// the object keys are trimmed
// the object keys that are empty or starts with _ are deleted
// the object values are trimmed
// the object is converted to DriveFileMove
// the DriveFileMove is saved to DriveFileMove[]
export function parseCsvObjToDriveFileMove(
  csvObjs: { [key: string]: any }[],
): DriveFileMove[] {
  const tmps: DriveFileMove[] = []

  csvObjs.forEach((d) => {
    const keys = Object.keys(d) as (keyof typeof d)[]

    const tmp = {
      id: "",
      parents: [""],
      meta: {
        destination: {
          folderId: undefined,
          name: undefined,
        },
        last: {
          folderId: undefined,
        },
      },
    }

    keys.forEach((key) => {
      const value = d[key]
      if (key === "id") {
        tmp.id = value
      }
      if (key === "parentId") {
        tmp.parents = [value]
      }
      if (key === "lastFolderId") {
        tmp.meta.last.folderId = value
      }
      if (key === "folderId") {
        tmp.meta.destination.folderId = value
      }
    })

    if (
      tmp.id &&
      tmp.parents &&
      tmp.meta.last.folderId &&
      tmp.meta.destination.folderId
    )
      tmps.push(tmp)
  })

  return tmps
}

// convertDriveFileToCsv converts DriveFile[] to csv
// DriveFile[] is an array of DriveFile
// DriveFile is an object
// DriveFile has id, parents, meta
// DriveFile.meta has file, destination, last
// DriveFile.meta.file has name, formerName
// DriveFile.meta.destination has folderId, name
// DriveFile.meta.last has folderId
// csv is a string
// csv is created from DriveFile[]
export function convertDriveFileToCsv(
  df: DriveFile[],
  type: Task["type"],
): string | undefined {
  const objs: DriveFileTask[] = df.map((d) => {
    return parseDriveFileToObj(d)
  })

  if (type === "rename") {
    const header = ["id", "formerName", "name"]

    const rows = objs.map((d) => {
      const id = d.id
      const formerName = d.meta?.file?.formerName
      const name = d.meta?.file?.name
      return [id, formerName, name]
    })

    rows.unshift(header)
    const csv = Papa.unparse(rows)
    return csv
  } else if (type === "move") {
    const header = ["id", "parentId", "lastFolderId", "folderId"]

    const rows = objs.map((d) => {
      const id = d.id
      const lastFolderId = d.meta.last?.folderId
      const folderId = d.meta.destination?.folderId
      const parentId = d.parents?.at(0)
      return [id, parentId, lastFolderId, folderId]
    })

    rows.unshift(header)
    const csv = Papa.unparse(rows)
    return csv
  }
}

// receive DriveFile and strip it down to  {"id": ..., "meta": file: ...} object
function parseDriveFileToObj(df: DriveFile): DriveFileTask {
  let tmp: DriveFileTask = {
    id: "",
    parents: [],
    meta: {},
  }
  const keys = Object.keys(df) as (keyof typeof df)[]
  keys.forEach((key) => {
    if (key === "id") {
      tmp[key] = df[key]
    }
    if (key === "parents") {
      tmp[key] = df[key]
    }
    if (key === "meta") {
      tmp = {
        ...tmp,
        meta: df[key] || {},
      }
    }
  })
  return tmp
}

export async function parseFile(file: File, func: (data: string) => string) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader()
    fileReader.onload = (event) => {
      const result = event?.target?.result as string
      resolve(func(result))
    }
    fileReader.onerror = (error) => reject(error)
    fileReader.readAsText(file)
  })
}
