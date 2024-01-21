import { useNavigation } from "@remix-run/react"
import { NavLinkPill } from "~/components/buttons/button"
import { setSearchParams } from "~/lib/utils/utils"

export default function NendoPills({
  url,
  nendos,
}: {
  url: string
  nendos: string[]
}) {
  const _url = new URL(url)
  // const currentNendo = _url.searchParams.get("nendo")

  const navigate = useNavigation()

  const isNavigating = navigate.state !== "idle"
  const navSearch = navigate.location?.search
  return (
    <>
      {nendos.map((_nendo) => (
        <NavLinkPill
          to={`${setSearchParams(_url.href, "nendo", _nendo)}`}
          key={_nendo}
          url={_url}
          baseColor="bg-sfred-300"
          hoverColor={"sfred"}
          navSearch={navSearch}
          isNavigating={isNavigating}
          name={_nendo}
          searchParam="nendo"
        />
      ))}
    </>
  )
}
