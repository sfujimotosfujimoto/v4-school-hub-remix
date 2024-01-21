import { useRenameCsvPageContext } from "~/lib/admin/rename-csv/_index/context/rename-csv-page-context"

export default function SourceFolderHeader() {
  const { renameCsvPage } = useRenameCsvPageContext()
  const sourceFolderName = renameCsvPage.sourceFolder?.name

  if (!sourceFolderName) return null
  return (
    <div className="mt-4 flex cursor-default items-center justify-start p-1">
      <p>変更元フォルダ名：</p>
      <p className="rounded-md bg-sky-300 px-2 py-1 text-sm">
        {sourceFolderName}
      </p>
    </div>
  )
}
