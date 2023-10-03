import React from "react"
import { useDriveFilesContext } from "~/context/drive-files-context"
import { useNendoTags } from "~/context/nendos-tags-context"

import type { DriveFile } from "~/types"

export default function NendoButtons({
  baseDriveFiles,
  nendos,
  color, // currentNendo,
}: {
  baseDriveFiles: DriveFile[]
  nendos: string[]
  color: string
}) {
  // get the newest nendo from the nendos set
  let newestNendo =
    Array.from(nendos)
      .sort((a, b) => Number(b) - Number(a))
      .filter((n): n is string => n !== null)
      .at(0) ?? "ALL"

  const [currentNendo] = React.useState(newestNendo ?? "ALL")

  const { nendo, setNendo } = useNendoTags()
  const { driveFilesDispatch } = useDriveFilesContext()
  const [nendosArr, setNendosArr] = React.useState<string[]>([])

  React.useEffect(() => {
    driveFilesDispatch({
      type: "SET_AND_UPDATE_META_SELECTED",
      payload: { driveFiles: baseDriveFiles, selected: true },
    })
  }, [baseDriveFiles, driveFilesDispatch])

  React.useEffect(() => {
    const tmpArr = Array.from(nendos)
      .sort((a, b) => Number(b) - Number(a))
      .filter((n): n is string => n !== null)

    setNendosArr(tmpArr)
    setNendo(currentNendo)
  }, [nendos, currentNendo, setNendo])

  React.useEffect(() => {
    driveFilesDispatch({
      type: "SET_AND_UPDATE_META_SELECTED",
      payload: { driveFiles: baseDriveFiles, selected: true },
    })
    driveFilesDispatch({
      type: "FILTER_BY_NENDO",
      payload: { nendo: currentNendo, driveFiles: baseDriveFiles },
    })
  }, [baseDriveFiles, currentNendo, driveFilesDispatch])

  return (
    <div data-name="NendoButtons.tsx" className={`flex gap-2`}>
      <button
        onClick={() => {
          driveFilesDispatch({
            type: "SET_AND_UPDATE_META_SELECTED",
            payload: { driveFiles: baseDriveFiles, selected: true },
          })
          setNendo("ALL")
        }}
        className={` ${
          nendo === "ALL" ? "nendo-active" : ""
        } btn btn-xs border-none shadow-md ${color}   font-bold duration-300 hover:-translate-y-[1px] hover:bg-sfred-200`}
      >
        ALL
      </button>
      {nendosArr.map((_nendo) => (
        <button
          key={_nendo}
          onClick={() => {
            driveFilesDispatch({
              type: "FILTER_BY_NENDO",
              payload: { nendo: _nendo, driveFiles: baseDriveFiles },
            })
            setNendo(_nendo)
          }}
          className={`${
            _nendo === nendo ? "nendo-active" : ""
          } btn btn-xs border-none shadow-md ${color}   font-bold duration-300 hover:-translate-y-[1px] hover:bg-sfred-200`}
        >
          {_nendo}
        </button>
      ))}
    </div>
  )
}
