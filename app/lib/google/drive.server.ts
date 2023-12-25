import { google } from "googleapis"

import type { drive_v3, sheets_v4 } from "googleapis"
import type { DriveFile, Permission, Student } from "~/types"

import { logger } from "~/logger"
import { QUERY_FILES_FIELDS, QUERY_FILE_FIELDS } from "../config"
import { getFolderId, getGakusekiFromString } from "../utils"

import { getClient } from "./google.server"
import { getStudentDataWithAccessToken } from "./sheets.server"

/**
 * Create a Google Drive Query with given folderId
 * - "trashed=false"
 * - "[folderId] in parents"
 */
export function queryFolderId(folderId: string): string | null {
  const outputQuery = []

  outputQuery.push("trashed=false")

  outputQuery.push(`'${folderId.trim()}' in parents`)

  if (!outputQuery) return null

  return outputQuery.join(" and ")
}

/**
 * Create a Google Drive Query with given folderId for multiple students
 * used in `files.$gakunen.$hr._index
 */
export function queryMultipleStudentsAndFilename(
  students: Student[],
  gakunen: string,
  hr: string,
  q: string[],
): string {
  const filteredStudentData = students.filter((sd) => {
    return sd.gakunen === gakunen && sd.hr === hr
  })
  const folderLinks = filteredStudentData
    .map((sd) => {
      if (!sd || !sd.folderLink) return null
      return getFolderId(sd.folderLink)
    })
    .filter((f): f is string => f !== null)
  logger.debug(
    `✅ queryMultipleStudentsAndFilename: folderLinks: ${folderLinks.length}`,
  )

  const folderQuery = folderLinks
    .slice(0, 170)
    .map((f) => `'${f}' in parents`)
    .join(" or ")

  // TODO: fullText to name
  const qQuery = q.map((item) => `name contains '${item}'`).join(" and ")

  if (qQuery) {
    return `(${folderQuery}) and (${qQuery}) and trashed = false`
  } else {
    return `(${folderQuery}) and trashed = false`
  }
}

// to get sampled students to create segments
// using module % 4 === 0 to supress the number of students to search for
// because the file name segments are almost all the same for most students
// so just sampling some will be enough
/**
 * Create a Google Drive Query
 * Sampled students to get segments out of file names
 * used in `files.$gakunen.$hr
 */
export function querySampledStudent(
  students: Student[],
  gakunen: string,
  hr: string,
): string {
  let filteredStudentData: Student[] = []
  const FILTER_NUM = 4

  if (students.length < FILTER_NUM) {
    filteredStudentData = [...students]
  } else {
    students.forEach((sd) => {
      // sampling some students to get segments out of file names
      if (
        sd.gakunen === gakunen &&
        sd.hr === hr &&
        sd.hrNo % FILTER_NUM === 0
      ) {
        filteredStudentData.push(sd)
      }
    })
  }

  const folderLinks = filteredStudentData
    .map((sd) => {
      if (!sd || !sd.folderLink) return null
      return getFolderId(sd.folderLink)
    })
    .filter((f): f is string => f !== null)

  // create query from the folderLinks
  const folderQuery = folderLinks
    .slice()
    .map((f) => `'${f}' in parents`)
    .join(" or ")

  if (!folderQuery) return ""

  return `(${folderQuery}) and trashed = false`
}

/**
 * Convert File[] to DriveFileData[]
 */
export function mapFilesToDriveFiles(
  files: drive_v3.Schema$File[],
): DriveFile[] {
  const driveFiles: DriveFile[] = files.map((d) => {
    return mapFilesToDriveFile(d)
  })

  return driveFiles
}

function mapFilesToDriveFile(file: drive_v3.Schema$File): DriveFile {
  const permissions = convertPermissions(file.permissions)

  return {
    id: file.id || "",
    name: file.name || "",
    mimeType: file.mimeType || "",
    link: file.webViewLink || "",
    iconLink: file.iconLink || "",
    hasThumbnail: file.hasThumbnail || false,
    thumbnailLink: file.thumbnailLink || undefined,
    createdTime: file.createdTime || undefined,
    modifiedTime: file.modifiedTime || undefined,
    webContentLink: file.webContentLink || undefined,
    parents: file.parents || undefined,
    appProperties: file.appProperties || undefined,
    permissions: permissions,
  }
}

function convertPermissions(
  permissions: drive_v3.Schema$Permission[] | undefined,
): Permission[] | undefined {
  if (!permissions) return undefined

  return permissions.map((p) => {
    let type_: "user" | "group" | "unknown" = "unknown"
    if (isType(p.type)) {
      type_ = p.type
    }
    let role: "owner" | "writer" | "reader" | "unknown" = "unknown"
    if (isRole(p.role)) {
      role = p.role
    }

    return {
      id: p.id || "",
      displayName: p.displayName || "",
      type: type_,
      emailAddress: p.emailAddress || "",
      role: role,
    }
  })
}

function isType(x: unknown): x is "user" | "group" {
  return ["user", "group"].includes(x as string)
}
function isRole(x: unknown): x is "owner" | "writer" | "reader" {
  return ["owner", "writer", "reader"].includes(x as string)
}

/**
 * getDriveFilesWithStudentFolder get files in Google Drive
 */
export async function getDriveFilesWithStudentFolder(
  drive: drive_v3.Drive,
  sheets: sheets_v4.Sheets,
  query: string,
): Promise<DriveFile[] | null> {
  logger.debug(`✅ getDriveFilesWithStudentFolder:`)
  const studentData = await getStudentDataWithAccessToken(sheets)

  const files: drive_v3.Schema$File[] = await execFilesList(drive, query)

  console.log(`file`, files[0])

  if (!files) return null

  const driveFileData = mapFilesToDriveFiles(files)

  driveFileData?.forEach((d) => {
    const gakuseki = getGakusekiFromString(d.name)
    const student = studentData.find((sd) => sd.gakuseki === gakuseki)

    // set studentFolder
    if (student && d.meta) {
      d.meta.studentFolder = {}
      d.meta.studentFolder.folderLink = student.folderLink || undefined
      d.meta.studentFolder.name = `${student.gakuseki}_${student.last}_${student.first}_SEIGフォルダ`
    }

    // set last Folder
    d.meta = {}
    d.meta.last = {}
    d.meta.last.folderId = d.parents?.at(0)
  })

  return driveFileData
}

/**
 * getDriveFiles get files in Google Drive
 */
export async function getDriveFiles(
  drive: drive_v3.Drive,
  query: string,
): Promise<DriveFile[] | null> {
  logger.debug(`✅ getDriveFiles:`)

  if (!query || query === "") return null

  let files: drive_v3.Schema$File[] = await execFilesList(drive, query)

  if (!files) return null

  return mapFilesToDriveFiles(files)
}

/**
 * call Permissions API
 */
export async function execPermissions(
  drive: drive_v3.Drive,
  fileId: string,
): Promise<Permission[]> {
  const fields = "permissions(id,type,emailAddress,role,displayName)"
  try {
    const list = await drive.permissions.list({
      fileId,
      fields,
    })
    const permissions = list.data.permissions as Permission[]

    return permissions
  } catch (error) {
    console.error(error)
    return []
  }
}

/**
 * Get Folder metadata by folder id
 */
export async function getFileById(
  drive: drive_v3.Drive,
  fileId: string,
): Promise<drive_v3.Schema$File> {
  const file = await drive.files.get({
    fileId: fileId,
    fields: QUERY_FILE_FIELDS,
  })

  return file.data
}

/**
 * # getDrive()
 * - gets Drive instance
 */
export async function getDrive(
  accessToken: string,
): Promise<drive_v3.Drive | null> {
  const client = await getClient(accessToken)

  if (client) {
    const drive = google.drive({
      version: "v3",
      auth: client,
    })
    return drive
  }
  return null
}

//-------------------------------------------
// PRIVATE FUNCTIONS
//-------------------------------------------
async function execFilesList(drive: drive_v3.Drive, query: string) {
  let count = 0
  let files: drive_v3.Schema$File[] = []
  let nextPageToken = undefined

  const MaxSize = 3000

  do {
    const list: any = await drive.files.list({
      pageSize: 300,
      pageToken: nextPageToken,
      q: query,
      fields: QUERY_FILES_FIELDS,
    })
    if (list.data.files) {
      files = files.concat(list.data.files)
    }
    nextPageToken = list.data.nextPageToken

    logger.debug(
      `✅ execFilesList: files: ${
        files.length
      } files: count: ${count++}, nextPageToken: ${!!nextPageToken}`,
    )
    // if (list.data.nextPageToken) nextPageToken = list.data.nextPageToken
  } while (nextPageToken && files.length < MaxSize)
  // files.forEach((f, idx) => {
  //   logger.debug(`✅ file: ${idx}: ${f.name}`)
  // })
  return files
}

/*


{
  "kind": "drive#file",
  "id": string,
  "name": string,
  "mimeType": string,
  "description": string,
  "starred": boolean,
  "trashed": boolean,
  "explicitlyTrashed": boolean,
  "trashingUser": {
    "kind": "drive#user",
    "displayName": string,
    "photoLink": string,
    "me": boolean,
    "permissionId": string,
    "emailAddress": string
  },
  "trashedTime": datetime,
  "parents": [
    string
  ],
  "properties": {
    (key): string
  },
  "appProperties": {
    (key): string
  },
  "spaces": [
    string
  ],
  "version": long,
  "webContentLink": string,
  "webViewLink": string,
  "iconLink": string,
  "hasThumbnail": boolean,
  "thumbnailLink": string,
  "thumbnailVersion": long,
  "viewedByMe": boolean,
  "viewedByMeTime": datetime,
  "createdTime": datetime,
  "modifiedTime": datetime,
  "modifiedByMeTime": datetime,
  "modifiedByMe": boolean,
  "sharedWithMeTime": datetime,
  "sharingUser": {
    "kind": "drive#user",
    "displayName": string,
    "photoLink": string,
    "me": boolean,
    "permissionId": string,
    "emailAddress": string
  },
  "owners": [
    {
      "kind": "drive#user",
      "displayName": string,
      "photoLink": string,
      "me": boolean,
      "permissionId": string,
      "emailAddress": string
    }
  ],
  "teamDriveId": string,
  "driveId": string,
  "lastModifyingUser": {
    "kind": "drive#user",
    "displayName": string,
    "photoLink": string,
    "me": boolean,
    "permissionId": string,
    "emailAddress": string
  },
  "shared": boolean,
  "ownedByMe": boolean,
  "capabilities": {
    "canAcceptOwnership": boolean,
    "canAddChildren": boolean,
    "canAddFolderFromAnotherDrive": boolean,
    "canAddMyDriveParent": boolean,
    "canChangeCopyRequiresWriterPermission": boolean,
    "canChangeSecurityUpdateEnabled": boolean,
    "canChangeViewersCanCopyContent": boolean,
    "canComment": boolean,
    "canCopy": boolean,
    "canDelete": boolean,
    "canDeleteChildren": boolean,
    "canDownload": boolean,
    "canEdit": boolean,
    "canListChildren": boolean,
    "canModifyContent": boolean,
    "canModifyContentRestriction": boolean,
    "canModifyLabels": boolean,
    "canMoveChildrenOutOfTeamDrive": boolean,
    "canMoveChildrenOutOfDrive": boolean,
    "canMoveChildrenWithinTeamDrive": boolean,
    "canMoveChildrenWithinDrive": boolean,
    "canMoveItemIntoTeamDrive": boolean,
    "canMoveItemOutOfTeamDrive": boolean,
    "canMoveItemOutOfDrive": boolean,
    "canMoveItemWithinTeamDrive": boolean,
    "canMoveItemWithinDrive": boolean,
    "canMoveTeamDriveItem": boolean,
    "canReadLabels": boolean,
    "canReadRevisions": boolean,
    "canReadTeamDrive": boolean,
    "canReadDrive": boolean,
    "canRemoveChildren": boolean,
    "canRemoveMyDriveParent": boolean,
    "canRename": boolean,
    "canShare": boolean,
    "canTrash": boolean,
    "canTrashChildren": boolean,
    "canUntrash": boolean
  },
  "viewersCanCopyContent": boolean,
  "copyRequiresWriterPermission": boolean,
  "writersCanShare": boolean,
  "permissions": [
    permissions Resource
  ],
  "permissionIds": [
    string
  ],
  "hasAugmentedPermissions": boolean,
  "folderColorRgb": string,
  "originalFilename": string,
  "fullFileExtension": string,
  "fileExtension": string,
  "md5Checksum": string,
  "sha1Checksum": string,
  "sha256Checksum": string,
  "size": long,
  "quotaBytesUsed": long,
  "headRevisionId": string,
  "contentHints": {
    "thumbnail": {
      "image": bytes,
      "mimeType": string
    },
    "indexableText": string
  },
  "imageMediaMetadata": {
    "width": integer,
    "height": integer,
    "rotation": integer,
    "location": {
      "latitude": double,
      "longitude": double,
      "altitude": double
    },
    "time": string,
    "cameraMake": string,
    "cameraModel": string,
    "exposureTime": float,
    "aperture": float,
    "flashUsed": boolean,
    "focalLength": float,
    "isoSpeed": integer,
    "meteringMode": string,
    "sensor": string,
    "exposureMode": string,
    "colorSpace": string,
    "whiteBalance": string,
    "exposureBias": float,
    "maxApertureValue": float,
    "subjectDistance": integer,
    "lens": string
  },
  "videoMediaMetadata": {
    "width": integer,
    "height": integer,
    "durationMillis": long
  },
  "isAppAuthorized": boolean,
  "exportLinks": {
    (key): string
  },
  "shortcutDetails": {
    "targetId": string,
    "targetMimeType": string,
    "targetResourceKey": string
  },
  "contentRestrictions": [
    {
      "readOnly": boolean,
      "reason": string,
      "restrictingUser": {
        "kind": "drive#user",
        "displayName": string,
        "photoLink": string,
        "me": boolean,
        "permissionId": string,
        "emailAddress": string
      },
      "restrictionTime": datetime,
      "type": string
    }
  ],
  "labelInfo": {
    "labels": [
      {
        "kind": "drive#label",
        "id": string,
        "revisionId": string,
        "fields": {
          (key): {
            "kind": "drive#labelField",
            "id": string,
            "valueType": string,
            "dateString": [
              date
            ],
            "integer": [
              long
            ],
            "selection": [
              string
            ],
            "text": [
              string
            ],
            "user": [
              {
                "kind": "drive#user",
                "displayName": string,
                "photoLink": string,
                "me": boolean,
                "permissionId": string,
                "emailAddress": string
              }
            ]
          }
        }
      }
    ]
  },
  "resourceKey": string,
  "linkShareMetadata": {
    "securityUpdateEligible": boolean,
    "securityUpdateEnabled": boolean
  }
}



export async function getMe(
	tokens: Tokens
): Promise<drive_v3.Schema$User | null> {
	const drive = await getDrive(tokens)

	if (!drive) return null

	const res = await drive.about.get({
		fields: "user(displayName,photoLink,emailAddress)"
	})

	const user = res.data.user ? res.data.user : null

	return user
}


export function getTokensFromString(tokensString: string) {
	if (!tokensString) return null
	return JSON.parse(tokensString) as Tokens
}


*/
