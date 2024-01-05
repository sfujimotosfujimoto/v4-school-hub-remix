import React from "react"
import { useDriveFilesContext } from "~/context/drive-files-context"
import { useNendoTags } from "~/context/nendos-tags-context"

import type { DriveFile } from "~/type.d"

export default function TagButtons({
  baseDriveFiles,
  tags,
  color,
}: {
  baseDriveFiles: DriveFile[]
  tags: string[]
  color: string
}) {
  const { driveFilesDispatch } = useDriveFilesContext()
  const { tag, setTag } = useNendoTags()

  React.useEffect(() => {
    setTag("ALL")
  }, [setTag])

  return (
    <div data-name="TagsButtons.tsx" className={`flex flex-wrap gap-2`}>
      <button
        onClick={() => {
          driveFilesDispatch({
            type: "SET_AND_UPDATE_META_SELECTED",
            payload: { driveFiles: baseDriveFiles, selected: true },
          })
          setTag("ALL")
        }}
        className={` ${
          tag === "ALL" ? "tag-active" : ""
        } btn btn-xs border-none shadow-md ${color}   font-bold duration-300 hover:-translate-y-[1px] hover:bg-sfgreen-300`}
      >
        ALL
      </button>
      {Array.from(tags).map((t) => (
        <button
          key={t}
          onClick={() => {
            driveFilesDispatch({
              type: "FILTER_BY_TAG",
              payload: { tag: t, driveFiles: baseDriveFiles },
            })
            setTag(t)
          }}
          className={`${
            t === tag ? "tag-active" : ""
          } btn btn-xs border-none shadow-md ${color}   font-bold duration-300 hover:-translate-y-[1px] hover:bg-sfgreen-200 `}
        >
          {t}
        </button>
      ))}
    </div>
  )
}
