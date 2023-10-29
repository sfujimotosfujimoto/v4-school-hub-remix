import LogoLeft from "./logo-left"
import NavRight from "./nav-right"

export default function Navigation() {
  return (
    <header
      data-name="Navigation"
      className="navbar sticky top-0 z-10 w-screen border-b border-stone-200 bg-white bg-opacity-90 sm:border-0"
    >
      <LogoLeft />
      <NavRight />
    </header>
  )
}
