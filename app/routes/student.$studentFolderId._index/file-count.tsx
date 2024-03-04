import type { DriveFile } from "~/types"

export default function FileCount({
  driveFiles,
}: {
  driveFiles?: DriveFile[] | null
}) {
  return (
    <>
      {driveFiles && (
        <div data-name="file count" className="inline-block ml-1">
          <span className="px-2 py-1 rounded-md text-md bg-slate-300">
            {driveFiles.length} files
          </span>
        </div>
      )}
    </>
  )
}
