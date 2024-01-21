import { useNavigation } from "@remix-run/react"
import { NavLinkPill } from "~/components/buttons/button"
import { setSearchParams } from "~/lib/utils/utils"

export default function TagPills({
  url,
  tags,
}: {
  url: string
  tags: string[]
}) {
  const _url = new URL(url)
  // const currentTag = _url.searchParams.get("tags")
  const navigate = useNavigation()

  const isNavigating = navigate.state !== "idle"
  const navSearch = navigate.location?.search

  return (
    <>
      {tags.map((t) => (
        <NavLinkPill
          to={`${setSearchParams(_url.href, "tags", t)}`}
          key={t}
          url={_url}
          baseColor="bg-sfgreen-400"
          hoverColor="sfgreen"
          navSearch={navSearch}
          isNavigating={isNavigating}
          name={t}
          searchParam="tags"
        />
      ))}
    </>
  )
}
