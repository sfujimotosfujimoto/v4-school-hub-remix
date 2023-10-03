import Papa from "papaparse"

import type { DriveFile, DriveFileMove, DriveFileTask, Task } from "~/types"

// receive File and return array of objects
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

export function parseCsvObjToDriveFileRename(
  csvObjs: { [key: string]: any }[],
) {
  const tmps: DriveFile[] = []

  csvObjs.forEach((d) => {
    const keys = Object.keys(d) as (keyof typeof d)[]

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

export function parseCsvObjToDriveFileMove(csvObjs: { [key: string]: any }[]) {
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

// @note csv/index.ts
export function convertDriveFileToCsv(df: DriveFile[], type: Task["type"]) {
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
function parseDriveFileToObj(df: DriveFile) {
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
