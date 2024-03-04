import { FolderIcon } from "~/components/icons"

export default function ToFolderBtn({ parentId }: { parentId: string }) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      href={`https://drive.google.com/drive/folders/${parentId}`}
      className={`  h-full rounded-lg bg-sfgreen-400 px-2 py-1 shadow-md transition-all duration-500  hover:-translate-y-1 hover:bg-sfgreen-300`}
    >
      <div className="flex items-center justify-center">
        <FolderIcon className="w-6 h-6 mr-2" />
        フォルダへ
      </div>
    </a>
  )
}
