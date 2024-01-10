import React from "react"
import { useDriveFilesContext } from "~/context/drive-files-context"
import { useNendoTags } from "~/context/nendos-tags-context"
import type { DriveFile } from "~/types"

export default function NendoButtons({
  baseDriveFiles,
  nendos,
  color, // currentNendo,
  showAll = false,
}: {
  baseDriveFiles: DriveFile[]
  nendos: string[]
  color: string
  showAll?: boolean
}) {
  let newestNendo
  if (!showAll) {
    // get the newest nendo from the nendos set
    newestNendo =
      Array.from(nendos)
        .sort((a, b) => Number(b) - Number(a))
        .filter((n): n is string => n !== null)
        .at(0) ?? "ALL"
  } else {
    newestNendo = "ALL"
  }

  // set the current nendo to the newest nendo
  const [currentNendo] = React.useState(newestNendo ?? "ALL")

  const { nendo, setNendo } = useNendoTags()
  const { driveFilesDispatch } = useDriveFilesContext()
  const [nendosArr, setNendosArr] = React.useState<string[]>([])

  // set driveFiles to baseDriveFiles
  React.useEffect(() => {
    driveFilesDispatch({
      type: "SET_AND_UPDATE_META_SELECTED",
      payload: { driveFiles: baseDriveFiles, selected: true },
    })
  }, [baseDriveFiles, driveFilesDispatch])

  // set nendosArr to the nendos set
  React.useEffect(() => {
    const tmpArr = Array.from(nendos)
      .sort((a, b) => Number(b) - Number(a))
      .filter((n): n is string => n !== null)

    setNendosArr(tmpArr)
    setNendo(currentNendo)
  }, [nendos, currentNendo, setNendo])

  // filter by nendo
  React.useEffect(() => {
    // first set the driveFiles to baseDriveFiles
    driveFilesDispatch({
      type: "SET_AND_UPDATE_META_SELECTED",
      payload: { driveFiles: baseDriveFiles, selected: true },
    })

    if (!showAll) {
      // then filter by nendo
      driveFilesDispatch({
        type: "FILTER_BY_NENDO",
        payload: { nendo: currentNendo, driveFiles: baseDriveFiles },
      })
    }
  }, [baseDriveFiles, currentNendo, driveFilesDispatch, showAll])

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
