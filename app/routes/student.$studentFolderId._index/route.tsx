import React from "react"
import { useRouteLoaderData } from "@remix-run/react"
import type { Role } from "@prisma/client"

import type { DriveFile, Student } from "~/types"

// components
import BackButton from "~/components/ui/buttons/back-button"
import StudentCards from "~/components/ui/student-card/student-cards"
import AllCheckButtons from "./components/all-check-buttons"
import FileCount from "./components/file-count"
import NendoButtons from "./components/nendo-buttons"
import Segments from "./components/segments"
import TagButtons from "./components/tag-buttons"
// context
import { useDriveFilesContext } from "~/context/drive-files-context"

/**
 * StudentFolderIndexPage Component
 */
export default function StudentFolderIdIndexPage() {
  const { driveFiles, segments, extensions, nendos, tags, role } =
    useRouteLoaderData("routes/student.$studentFolderId") as unknown as {
      extensions: string[]
      segments: string[]
      driveFiles: DriveFile[] | null
      student: Student | null
      role: Role
      nendos: string[]
      tags: string[]
    }

  const { driveFiles: _driveFiles } = useDriveFilesContext()

  let baseDriveFiles = React.useMemo(() => {
    if (!driveFiles) return []
    return driveFiles
  }, [driveFiles])

  // baseDriveFiles = React.useMemo(() => {
  //   return setSelected(baseDriveFiles ?? [], true)
  // }, [baseDriveFiles])

  // JSX -------------------------
  return (
    <section className="space-y-4">
      {/* BACKBUTTON */}
      <BackButton to="/student" isLink={true} />

      <FileCount />

      <AllCheckButtons role={role} baseDriveFiles={baseDriveFiles} />

      <NendoButtons
        baseDriveFiles={baseDriveFiles}
        nendos={nendos}
        color={"bg-slate-400"}
      />

      <TagButtons
        baseDriveFiles={baseDriveFiles}
        tags={tags}
        color={"bg-slate-400"}
      />

      {/* SEGMENTS */}
      <Segments
        extensions={extensions}
        segments={segments}
        baseDriveFiles={baseDriveFiles}
      />

      {/* STUDENTCARDS */}
      <div className="mb-12 mt-4 overflow-x-auto px-2">
        <StudentCards role={role} driveFiles={_driveFiles} />
      </div>
    </section>
  )
}
