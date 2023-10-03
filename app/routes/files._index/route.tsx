import { LogoIcon } from "~/components/icons"
import GakunenButtons from "~/components/ui/buttons/gakunen-buttons"
import HrButtons from "~/components/ui/buttons/hr-buttons"

import { NavLink } from "@remix-run/react"

import { useGakunen } from "../student/route"

export default function FilesPage() {
  const { gakunen, setGakunen, hr, setHr } = useGakunen()
  return (
    <div
      data-name="files._index"
      className="flex h-full flex-col items-center justify-center"
    >
      <div
        id="__border-wrapper"
        className="m-4 rounded-2xl border-2 border-sfgreen-400 p-4 shadow-lg"
      >
        <div
          id="__flex-wrapper"
          className="flex flex-col items-center justify-center gap-4"
        >
          <h1 className="text-base font-medium underline decoration-sfred-300 decoration-2 underline-offset-8 sm:text-xl">
            学年を選ぶ
          </h1>
          <GakunenButtons setGakunen={setGakunen} gakunen={gakunen} />
          <h1 className="text-base font-medium underline decoration-sfred-300 decoration-2 underline-offset-8 sm:text-xl">
            クラスを選ぶ
          </h1>
          <HrButtons setHr={setHr} hr={hr} />

          <NavLink
            to={`/files/${gakunen}/${hr}`}
            className={`btn btn-success w-36 shadow-lg  ${
              gakunen === "ALL" || hr === "ALL" ? "btn-disabled" : null
            }`}
          >
            <LogoIcon className="h-7 w-4" />
            <span className=" ml-2 sm:ml-4 sm:inline">GO</span>
          </NavLink>
        </div>
      </div>
    </div>
  )
}
