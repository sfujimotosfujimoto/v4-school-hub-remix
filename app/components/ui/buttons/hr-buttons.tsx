import type { Hr } from "~/type.d"
import type { Role } from "@prisma/client"

export default function HrButtons({
  hr,
  setHr,
  role = "USER",
}: {
  hr: Hr
  setHr: React.Dispatch<React.SetStateAction<Hr>>
  role?: Role
}) {
  return (
    <ul className={`join border-none bg-sfyellow-200 font-bold`}>
      <HrButton hr={hr} hrBase="ALL" setHr={setHr} />
      <HrButton hr={hr} hrBase="A" setHr={setHr} />
      <HrButton hr={hr} hrBase="B" setHr={setHr} />
      <HrButton hr={hr} hrBase="C" setHr={setHr} />
      <HrButton hr={hr} hrBase="D" setHr={setHr} />
      <HrButton hr={hr} hrBase="E" setHr={setHr} />

      {role === "SUPER" && <HrButton hr={hr} hrBase="F" setHr={setHr} />}
    </ul>
  )
}

function HrButton({
  hr,
  hrBase,
  setHr,
}: {
  hr: Hr
  hrBase: Hr
  setHr: React.Dispatch<React.SetStateAction<Hr>>
}) {
  const bgColor = `!bg-sfgreen-200`
  return (
    <li>
      <button
        className={`${
          hrBase === hr ? bgColor : ""
        } btn join-item btn-sm lg:btn-md`}
        onClick={() => {
          setHr(() => hrBase)
        }}
      >
        {hrBase}
      </button>
    </li>
  )
}
