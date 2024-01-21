import type { DriveFile, Hr } from "~/types"

const rx1 =
  /((中学|高校)\d?(年)?)?.*(?<hr>[a-fA-F])組([\s-_])?(?<hrNo>[0-9]{1,2})番/

const rx2 =
  /[jJhH中高]?\d?(?<hr>[a-fA-F])[\s_　-]?(?<hrNo>\d{1,2})([\s_-]|\.|$)/

const rxArr = [rx1, rx2]
// const rxArr = [rx1, rx2, rx3, rx4]

export function getHrAndHrNoFromString(filename: string) {
  // let match: { hr?: Hr; hrNo?: string } = { hr: undefined, hrNo: undefined }
  for (let rx of rxArr) {
    const match = rx.exec(filename)
    const hrValue = match?.groups?.hr // "D"
    const hrNoValue = match?.groups?.hrNo // "9"

    if (hrValue && hrNoValue) {
      return {
        hr: hrValue.toUpperCase() as Hr,
        hrNo: Number(hrNoValue),
      }
    }
  }
  return {
    hr: undefined,
    hrNo: undefined,
  }
}

const extensions = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "m4a",
]

// getExtensions adds segments to df.meta.file.segments
export function getExtensions(df: DriveFile) {
  // get ex. "pdf", "document"
  const ext =
    extensions
      .map((ext) => {
        const match = df.name.match(new RegExp(`\\.${ext}$`))
        if (match) return match.at(-1)
        else return null
      })
      .filter((a) => a)[0] ?? null

  // get name without extension
  const nameNoExt = ext ? df.name.replace(ext, "") : df.name

  // get segments from name
  const segments = Array.from(new Set(nameNoExt.split(/[-_.]/)))
  df.meta = {
    ...df.meta,
    file: {
      ...df.meta?.file,
      segments,
    },
  }

  // get joined segments
  const joinedSegments = segments.join("_")

  return {
    ext,
    segments,
    joinedSegments,
  }
}

/*

  // get file extension

  






*/
