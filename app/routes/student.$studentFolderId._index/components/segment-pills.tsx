import { useNavigation } from "@remix-run/react"

import { NavLinkPill } from "~/components/buttons/button"

function setSearchParams(url: string, key: string, value: string) {
  const _url = new URL(url)
  _url.searchParams.set(key, value ? value : "ALL")
  return _url.href
}

export default function SegmentPills({
  url,
  segments,
}: {
  url: string
  segments: string[]
}) {
  const _url = new URL(url)
  // const currentSegment = _url.searchParams.get("segments")

  const navigate = useNavigation()

  const isNavigating = navigate.state !== "idle"
  const navSearch = navigate.location?.search

  return (
    <>
      {segments &&
        segments
          .sort()
          .map((segment, idx) => (
            <NavLinkPill
              to={`${setSearchParams(_url.href, "segments", segment)}`}
              key={idx}
              url={_url}
              baseColor="bg-sfyellow-200"
              hoverColor="sfyellow"
              navSearch={navSearch}
              isNavigating={isNavigating}
              name={segment}
              searchParam="segments"
            />
          ))}
    </>
  )
}
