import React from "react"
import { TimeIcon } from "~/components/icons"
import { MoveTypeContext } from "~/context/move-type-context"
import { dateFormat } from "~/lib/utils"

import type { MoveType } from "~/types"

export default function MoveCard({ moveType }: { moveType: MoveType }) {
  const { getAllItems, setUndoMoveType } = React.useContext(MoveTypeContext)

  const [, setMoveTypes] = React.useState<MoveType[] | null>(null)

  React.useEffect(() => {
    const tmp = getAllItems()
    if (tmp) setMoveTypes(tmp)
  }, [getAllItems, setMoveTypes])

  function handleClick(e: React.MouseEvent<HTMLElement, MouseEvent>) {
    e.stopPropagation()
    setUndoMoveType(moveType)
  }

  let blob = new Blob([JSON.stringify(moveType.data)], {
    type: "application/json",
  })

  return (
    <div
      data-name="MoveCard"
      className="card bg-sfyellow-100 shadow-lg transition-all duration-500 lg:card-side hover:-translate-y-1 hover:bg-sfred-50"
      onClick={handleClick}
    >
      <div className={`card-body p-2 sm:p-4`}>
        <h2 className={`card-title text-sm`}>
          <TimeIcon className="h-3 w-4" />
          <span>
            {dateFormat(new Date(moveType.data.time).toLocaleString()) || ""}
          </span>
        </h2>

        <div className="flex items-center gap-2 text-sm">
          <div>
            <h3 className="font-bold">TO:</h3>
          </div>
          {moveType.data && (
            <div className="rounded-md bg-sfgreen-300 px-2 py-1">
              <a
                href={URL.createObjectURL(blob)}
                download={`SCHOOL-HUB_ファイル移動_${dateFormat(
                  new Date(moveType.data.time).toLocaleString(),
                )}.json`}
              >
                ダウンロード
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
