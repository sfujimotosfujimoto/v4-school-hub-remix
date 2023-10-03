import { useDriveFilesContext } from "~/context/drive-files-context"

export default function FileCount() {
  const { driveFiles } = useDriveFilesContext()
  return (
    <div
      data-name="file count"
      className="absolute right-12 top-2 ml-1 inline-block"
    >
      <span className="text-md rounded-md bg-slate-300 px-2 py-1">
        {driveFiles.length} files
      </span>
    </div>
  )
}
