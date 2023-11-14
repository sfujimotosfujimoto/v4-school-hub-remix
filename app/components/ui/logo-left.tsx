import { Link, useNavigation } from "@remix-run/react"

import { LogoIcon, LogoTextIcon } from "../icons"

export default function LogoLeft() {
  let navigation = useNavigation()

  let loading = navigation.state !== "idle"
  return (
    <div
      data-name="LogoLeft"
      className="mr-6 flex flex-1 flex-shrink-0 items-center "
    >
      <Link to="/" aria-label="Go home" className="mr-2">
        <LogoIcon
          className={`h-7 w-8 ease-in-out sm:h-12 ${
            loading && "animate-bounce"
          }`}
        />
      </Link>
      <Link to="/" aria-label="Go home" className="mr-2">
        <LogoTextIcon className="hidden h-10 w-20 sm:block" />
      </Link>
    </div>
  )
}
