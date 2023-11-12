import { useNavigation } from "@remix-run/react"
import LogoLeft from "./logo-left"
import NavRight from "./nav-right"

export default function Navigation() {
  const { state } = useNavigation()
  return (
    <header
      data-name="Navigation"
      className={`navbar sticky top-0 z-10 w-screen border-b border-stone-200 transition-colors sm:border-0 ${
        state === "loading"
          ? "bg-slate-800 bg-opacity-20 "
          : "bg-white bg-opacity-90 "
      }`}
    >
      <LogoLeft />
      <NavRight />
    </header>
  )
}
