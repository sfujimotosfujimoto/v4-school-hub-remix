import type { DriveFile } from "~/type.d"
import { Link } from "@remix-run/react"

import StudentCard from "./student-card"

import type { Role } from "@prisma/client"

export default function StudentCards({
  driveFiles,
  role,
  size = "big",
}: {
  driveFiles: DriveFile[]
  role: Role
  size?: "small" | "big"
}) {
  return (
    <div
      id="StudentCards.tsx"
      className="grid grid-cols-1 gap-4 px-2 pt-4 outline-sfgreen-200 md:grid-cols-2 xl:grid-cols-3"
    >
      {driveFiles &&
        driveFiles.map((d: DriveFile) => {
          if (d.parents && d.parents?.length > 0) {
            return (
              <Link
                prefetch="intent"
                key={d.id}
                id="_StudentCard"
                to={`/student/${d.parents[0]}/${d.id}`}
              >
                <StudentCard driveFile={d} size={size} role={role} />
              </Link>
            )
          } else {
            return (
              <Link prefetch="intent" key={d.id} id="_StudentCard" to={`/`}>
                <StudentCard driveFile={d} size={size} role={role} />
              </Link>
            )
          }
        })}
    </div>
  )
}

/*
import type { DriveFile } from "~/types"
import { Link } from "@remix-run/react"
import StudentCard from "./student-card"

export default function StudentCards({
  driveFiles,
  size = "big",
}: {
  driveFiles: DriveFile[]
  size?: "small" | "big"
}) {
  return (
    <div
      data-name="_StudentCards"
      className="grid grid-cols-1 gap-4 pt-4 outline-sfgreen-200 md:grid-cols-2 xl:grid-cols-3"
    >
      {size === "big"
        ? driveFiles &&
          driveFiles.map((d: DriveFile) => {
            if (d.parents && d.parents?.length > 0) {
              return (
                <Link
                  key={d.id}
                  data-name="StudentCard"
                  to={`/student/${d.parents[0]}/${d.id}`}
                  rel="noreferrer"
                >
                  <StudentCard driveFileDatum={d} size={size} />
                </Link>
              )
            } else {
              return (
                <Link
                  key={d.id}
                  data-name="StudentCard"
                  to={`/`}
                  rel="noreferrer"
                >
                  <StudentCard key={d.id} driveFileDatum={d} size={size} />
                </Link>
              )
            }
          })
        : driveFiles &&
          driveFiles.map((d: DriveFile) => {
            if (d.parents && d.parents?.length > 0) {
              return <StudentCard key={d.id} driveFileDatum={d} size={size} />
            } else {
              return <StudentCard key={d.id} driveFileDatum={d} size={size} />
            }
          })}
    </div>
  )
}

*/
