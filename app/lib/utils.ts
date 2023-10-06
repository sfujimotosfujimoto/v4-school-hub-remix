import type { DriveFile, RawUser, Student, User } from "~/types"

export function filterStudentDataByGakunen(
  gakunen: string,
  hr: string,
  studentData: Student[],
): Student[] {
  if (gakunen === "ALL" && hr === "ALL") {
    return studentData
  } else if (gakunen === "ALL") {
    return studentData.filter((sd) => sd.hr === hr)
  } else if (hr === "ALL") {
    return studentData.filter((sd) => sd.gakunen === gakunen)
  } else {
    return studentData.filter((sd) => sd.gakunen === gakunen && sd.hr === hr)
  }
}

export function getStudentEmail(email: string): string | null {
  const regex = RegExp(
    /(b[0-9]{5,}@seig-boys.jp|samples[0-9]{2}@seig-boys.jp)/,
    // /(b[0-9]{5,}@seig-boys.jp|samples[0-9]{2}@seig-boys.jp|s-tamaki@seig-boys.jp)/
  )

  const matches = email.match(regex)

  if (!matches) return null
  return matches[0]
}

export function getFolderId(folderUrl: string): string | null {
  if (!folderUrl) return null
  const output = String(folderUrl).split("/").at(-1)
  if (!output) return null
  return output
}

// used in student.$studentFolderId.tsx
export function filterSegments(
  segments: string[],
  student?: Student | null,
): string[] {
  const regex = RegExp(
    `${student?.last}|${student?.first}|${student?.gakuseki}|([ABCDE]+\\d+)|([ABCDE]組\\d+番)|^\\d+$|pdf|png|jpg|jpeg`,
    "g",
  )

  return segments.filter((seg) => !seg.match(regex))
}

export function filterStudentNameSegments(
  driveFileData: DriveFile[],
  studentData: Student[],
): string[] {
  let studentLastNameRegex = studentData.map((sd) => sd.last).join("|")
  let studentFirstNameRegex = studentData.map((sd) => sd.first).join("|")

  let segments = Array.from(
    new Set(driveFileData?.map((d) => d.name.split(/[-_.]/)).flat()),
  )

  const regex = RegExp(
    `${studentLastNameRegex}|${studentFirstNameRegex}|(\\d{7})|([ABCDE]+\\d+)|([ABCDE]組\\d+番)|^\\d+$|pdf|png|jpg|jpeg`,
    "g",
  )

  return segments.filter((seg) => !seg.match(regex))
}

export function dateFormat(dateString: string): string {
  const date = new Date(dateString)

  const output = new Intl.DateTimeFormat("ja", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)

  return output
}

export function checkGoogleMimeType(driveFileDatum: DriveFile): boolean {
  const regex = RegExp(/^application\/vnd\.google-apps.*/)

  const matches = driveFileDatum.mimeType.match(regex)

  if (matches) return true
  else return false
}

export function checkValidSeigEmail(email: string): boolean {
  const regex = RegExp(
    /([a-z]{1,}-[a-z]{1,}@seig-boys.jp)/,
    // /(b[0-9]{5,}@seig-boys.jp|samples[0-9]{2}@seig-boys.jp|s-tamaki@seig-boys.jp)/
  )

  // use regex to get student address
  const matches = email.match(regex)
  if (matches) {
    return true
  } else {
    return false
  }
}

export function getIdFromUrl(url: string): string | undefined {
  const match = url.match(/[\w-_]{30,}/)
  return match ? match[0] : undefined
}

/**
 * getGakusekiFromString
 */
export function getGakusekiFromString(filename: string): number | null {
  // Define the regular expression with a named pattern
  const rgx =
    /([JH][1-3]_[A-F][0-9]{1,2}_(?<gakuseki1>\d{7})_)|(?<gakuseki2>\d{7})/g

  // Use the exec() method to extract the named pattern
  const result = rgx.exec(filename)

  // Check if a match is found and extract the named pattern
  if (!result?.groups) return null
  const p1 = result.groups.gakuseki1
  const p2 = result.groups.gakuseki2

  const extracted = p1 || p2 || null

  if (!extracted) return null
  return Number(extracted)
}

// export function getGakusekiFromPermissions(permissions?: Permission[]) {
//   if (!permissions) return null
//   const emails = permissions
//     .map((p) => {
//       if (p.type === "user" && ["owner", "writer", "reader"].includes(p.role)) {
//         return p.emailAddress
//       } else {
//         return null
//       }
//     })
//     .filter((e): e is string => e !== null)

//   const gakusekis = emails
//     .map((e) => {
//       return getGakusekiFromEmail(e)
//     })
//     .filter((e): e is number => e !== null)

//   return gakusekis.at(0) || null
// }

// function getGakusekiFromEmail(email: string): number | null {
//   try {
//     const gakusekiParts = email.split("@")
//     const gakuseki = gakusekiParts[0].replace("b", "")

//     const gakusekiNumber = Number(gakuseki)

//     if (gakusekiNumber === 0 || isNaN(gakusekiNumber)) return null

//     return gakusekiNumber
//   } catch (error) {
//     return null
//   }
// }

export function formatDate(date: Date, locals = "ja-JP"): string {
  const formatter = Intl.DateTimeFormat(locals, {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Tokyo",
  })

  return formatter.format(date)
  // return formatter.format(new Date(date))
}

export function stripText(name: string): string | null {
  const regex = /^([0-9]{1,8}_)/g
  const str = name.replace(regex, "")
  if (str) return str
  return null
}

export function rawUserToUser(rawUser: RawUser): User {
  let stats = null
  if (rawUser.stats) {
    stats = {
      count: rawUser.stats.count,
      lastVisited: new Date(rawUser.stats.lastVisited),
    }
  }

  const tUser: User = {
    ...rawUser,
    createdAt: rawUser?.createdAt ? new Date(rawUser.createdAt) : new Date(),
    updatedAt: rawUser?.updatedAt ? new Date(rawUser.updatedAt) : new Date(),
    stats,
  }
  return tUser
}

export function rawUsersToUsers(rawUsers: RawUser[]): User[] {
  return rawUsers.map((rawUser) => rawUserToUser(rawUser))
}

export function parseTags(genres: string) {
  return genres.split(",").map((g) => g.trim())
}

/**
 * getSchoolYear
 */
export function getSchoolYear(now: number): number {
  const d = new Date(now)

  if (d.getMonth() + 1 <= 3) {
    return d.getFullYear() - 1
  } else {
    return d.getFullYear()
  }
}

export function arrayIntoChunks<T>(arr: T[], chunkSize: number) {
  const res = []
  while (arr && arr.length > 0) {
    const chunk = arr.splice(0, chunkSize)
    res.push(chunk)
  }
  return res
}

export function createURLFromId(id: string) {
  return `https://drive.google.com/drive/folders/${id}`
}
