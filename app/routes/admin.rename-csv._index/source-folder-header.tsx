import { useRenameCsvPageContext } from "~/lib/admin/rename-csv/_index/context/rename-csv-page-context"

export default function SourceFolderHeader() {
  const { renameCsvPage } = useRenameCsvPageContext()
  const sourceFolderName = renameCsvPage.sourceFolder?.name

  if (!sourceFolderName) return null
  return (
    <div className="flex items-center justify-start p-1 mt-4 cursor-default">
      <p>変更元フォルダ名：</p>
      <p className="px-2 py-1 text-sm rounded-md bg-sky-300">
        {sourceFolderName}
      </p>
    </div>
  )
}
