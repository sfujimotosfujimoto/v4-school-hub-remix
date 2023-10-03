import type { MoveType } from "~/types"
import MoveCard from "./move-card"

export default function MoveCards({ moveTypes }: { moveTypes: MoveType[] }) {
  return (
    <div
      data-name="MoveCards"
      className="grid grid-cols-2 gap-4 pt-4 outline-sfgreen-200 md:grid-cols-3 xl:grid-cols-4"
    >
      {moveTypes &&
        moveTypes.map((md: MoveType) => {
          return <MoveCard key={md.id} moveType={md} />
        })}
    </div>
  )
}
