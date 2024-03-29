import { getSchoolYear } from "./lib/utils/utils"

export const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
]

export const LOG_LEVEL = "info"

export const KYOUKAS = ["英語", "数学", "国語", "HR"]
export const YEAR_NAMES = ["2024", "2023", "2022", "2021", "2020", "2019"]
export const SUBFOLDER_NAMES = [...KYOUKAS, ...YEAR_NAMES]

export const QUERY_FILES_FIELDS =
  "nextPageToken, files(id,name,mimeType,webViewLink,thumbnailLink,hasThumbnail,iconLink,createdTime,modifiedTime,webContentLink,parents,appProperties,capabilities)"
export const QUERY_FILE_FIELDS =
  "id,name,mimeType,webViewLink,thumbnailLink,hasThumbnail,iconLink,createdTime,modifiedTime,webContentLink,parents,appProperties,capabilities"
export const QUERY_PERMISSION_FIELDS =
  "permissions(id,type,emailAddress,role,displayName)"

export const NENDO = getSchoolYear(Date.now())

export const CHUNK_SIZE = 7

export const SESSION_MAX_AGE = 60 * 60 * 24 * 14 // 14 days
export const CACHE_MAX_AGE = 60 * 10 // 10 minutes

export const REFRESH_EXPIRY = 1000 * 60 * 60 * 24 * 14 // 14 days
export const DEV_EXPIRY = 1000 * 15
export const DEV_REFERSH_EXPIRY = 1000 * 30
