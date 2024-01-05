import type { Role } from "@prisma/client"
import { useDriveFilesContext } from "~/context/drive-files-context"

import type { DriveFile } from "~/type.d"

export default function CheckBox({
  driveFile,
  role,
}: {
  driveFile: DriveFile
  role: Role
}) {
  const { driveFilesDispatch } = useDriveFilesContext()

  return (
    <>
      {role === "ADMIN" || role === "SUPER" ? (
        <input
          onClick={(e) => {
            e.stopPropagation()
            driveFilesDispatch({
              type: "SET_CHECK",
              payload: { id: driveFile.id, checked: e.currentTarget.checked },
            })
          }}
          readOnly
          type="checkbox"
          checked={driveFile.meta?.selected}
          className="checkbox-info checkbox checkbox-lg absolute -right-1 -top-1 self-end border-none bg-slate-300 shadow-md"
        />
      ) : null}
    </>
  )
}
