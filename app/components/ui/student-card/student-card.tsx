import type { Role } from "@prisma/client"
import clsx from "clsx"
import { RenewIcon, TimeIcon } from "~/components/icons"
import {
  dateFormat,
  parseAppProperties,
  parseTags,
  stripText,
} from "~/lib/utils"
import type { DriveFile } from "~/types"
import CheckBox from "./checkbox"

export default function StudentCard({
  driveFile,
  role,
  thumbnailSize = "small",
  size = "big",
  isNavigating = false,
}: {
  driveFile: DriveFile
  role: Role
  thumbnailSize?: "small" | "big"
  size?: "small" | "big"
  isNavigating?: boolean
}) {
  let tags = null
  let nendo = null
  if (driveFile.appProperties) {
    let appProps = parseAppProperties(driveFile.appProperties)
    tags = appProps.tags ? parseTags(appProps.tags) : null
    nendo = appProps.nendo
  }

  return (
    <>
      <div
        data-name="StudentCard.tsx"
        className={clsx(`card bg-sfgreen-400 shadow-lg lg:card-side`, {
          "transition-all duration-500 hover:-translate-y-1 hover:bg-sfgreen-300":
            size === "big",
          "opacity-40": isNavigating,
        })}
      >
        {/* <!-- CHECKBOX --> */}
        <CheckBox driveFile={driveFile} role={role} />
        <div
          className={`card-body ${
            size === "small" ? "p-2 sm:p-4" : "p-6 sm:p-10"
          }`}
        >
          <h2 className={`card-title ${size === "small" ? "text-sm" : ""}`}>
            {stripText(driveFile.name)}
          </h2>

          {/* NENDO & TAGS */}
          <div className="tags flex flex-wrap gap-2">
            {nendo && (
              <span
                className={`rounded-lg bg-slate-200  px-2 py-1 text-xs font-bold sm:text-sm`}
              >
                {nendo}
              </span>
            )}
            {tags &&
              tags.map((tag) => (
                <span
                  key={tag}
                  className={`text-ellipsis rounded-lg bg-slate-200 px-2 py-1 text-xs font-bold sm:text-sm`}
                >
                  {tag}
                </span>
              ))}
          </div>

          {/* EXTENSION ICON */}
          <div className="flex items-center justify-center gap-2">
            <img
              src={driveFile.iconLink}
              alt="icon"
              width="0"
              height="0"
              className={`${size === "small" ? "h-3 w-3" : "h-5 w-5"}`}
            />
            <p className={`${size === "small" ? "text-xs" : "text-sm"}`}>
              {driveFile.mimeType}
            </p>
          </div>

          {size === "big" && (
            <div className="flex gap-4">
              <div className="flex items-center gap-1">
                <TimeIcon className="h-3 w-4" />
                <span>
                  {driveFile.createdTime
                    ? dateFormat(driveFile.createdTime.toISOString())
                    : ""}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <RenewIcon className="h-3 w-3" />
                <span>
                  {driveFile.modifiedTime
                    ? dateFormat(driveFile.modifiedTime.toISOString())
                    : ""}
                </span>
              </div>
            </div>
          )}

          {driveFile && size === "big" && (
            <figure className="!rounded-2xl">
              {/* {driveFile.hasThumbnail &&
                driveFile.thumbnailLink &&
                !checkGoogleMimeType(driveFile) && ( */}
              {driveFile.thumbnailLink && (
                <img
                  className="object-contain"
                  width={thumbnailSize === "small" ? "300" : "1000"}
                  height={thumbnailSize === "small" ? "300" : "1000"}
                  src={
                    thumbnailSize === "small"
                      ? driveFile.thumbnailLink
                      : driveFile.thumbnailLink?.split("=")[0]
                  }
                  alt={driveFile.name}
                  referrerPolicy="no-referrer"
                />
              )}
            </figure>
          )}

          {driveFile.meta?.studentFolder && size === "small" && (
            <div className="flex items-center gap-2 text-sm">
              <div>
                <h3 className="font-bold">TO:</h3>
              </div>
              <div className="rounded-md bg-sky-500 px-2 py-1 text-white">
                <a
                  href={driveFile.meta.studentFolder.folderLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  <h3>{driveFile.meta.studentFolder.name}</h3>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* </a> */}
    </>
  )
}

/*
import { RenewIcon, TimeIcon } from "~/components/icons"
import { checkGoogleMimeType, dateFormat, stripText } from "~/lib/utils"

import type { DriveFile } from "~/types"
import { NavLink } from "@remix-run/react"

export default function StudentCard({
  driveFileDatum,
  thumbnailSize = "small",
  size = "big",
}: {
  driveFileDatum: DriveFile
  thumbnailSize?: "small" | "big"
  size?: "small" | "big"
}) {
  return (
    <>
      <div
        data-name="StudentCard"
        className={`card bg-sfgreen-200 shadow-lg lg:card-side ${
          size === "big"
            ? "l transition-all duration-500 hover:-translate-y-1 hover:bg-sfred-50"
            : null
        }`}
      >
        <div
          className={`card-body p-6 sm:p-10  ${
            size === "small" ? "p-2 sm:p-4" : "p-6 sm:p-10"
          }`}
        >
          <h2 className={`card-title ${size === "small" ? "text-sm" : null}`}>
            {stripText(driveFileDatum.name)}
          </h2>
          <div className="flex items-center justify-center gap-2">
            <img
              src={driveFileDatum.iconLink}
              alt="icon"
              className={` ${size === "small" ? "h-3 w-3" : "h-5 w-5"}`}
            />
            <p className={`${size === "small" ? "text-xs" : "text-sm"}`}>
              {driveFileDatum.mimeType}
            </p>
          </div>

          {size === "big" && (
            <div className="flex gap-4">
              <div className="flex items-center gap-1">
                <TimeIcon className="h-3 w-4" />
                <span>
                  {dateFormat(driveFileDatum.createdTime || "") || ""}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <RenewIcon className="h-3 w-3" />
                <span>
                  {dateFormat(driveFileDatum.modifiedTime || "") || ""}
                </span>
              </div>
            </div>
          )}
          {driveFileDatum && size === "big" && (
            <figure className="!rounded-2xl">
              {driveFileDatum.hasThumbnail &&
                !checkGoogleMimeType(driveFileDatum) && (
                  <img
                    className="object-contain"
                    src={
                      thumbnailSize === "small"
                        ? driveFileDatum.thumbnailLink
                        : driveFileDatum.thumbnailLink?.split("=")[0]
                    }
                    alt={driveFileDatum.name}
                    referrerPolicy="no-referrer"
                  />
                )}
            </figure>
          )}
          {driveFileDatum.studentFolder && size === "small" && (
            <div className="flex items-center gap-2 text-sm">
              <h3 className="font-bold">TO:</h3>
              <div className="rounded-md bg-sky-500 px-2 py-1 text-white transition-all duration-500 lg:card-side hover:bg-sky-400">
                {driveFileDatum.studentFolder.folderLink && (
                  <NavLink
                    to={driveFileDatum.studentFolder.folderLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <h3>{driveFileDatum.studentFolder.name}</h3>
                  </NavLink>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
*/
