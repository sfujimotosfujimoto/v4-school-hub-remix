import { useNavigate, useNavigation, useParams } from "@remix-run/react"
import React from "react"

function setSearchParams2(url: string, key: string, value: string) {
  const _url = new URL(url)
  _url.searchParams.set(key, value ? value : "ALL")
  return _url.search
}

export default function SegmentPills({
  url,
  segments,
}: {
  url: string
  segments: string[]
}) {
  const _url = new URL(url)
  const urlSegment = _url.searchParams.get("segments")
  const params = useParams()
  const navigation = useNavigation()
  const navigate = useNavigate()

  // const [currentSegment, setCurrentSegment] = React.useState("None")

  const isNavigating =
    navigation.state !== "idle" && !!navigation.location?.pathname
  // const navSearch = navigation.location?.search

  function handleClick(e: React.ChangeEvent<HTMLSelectElement>) {
    const target = e.target as HTMLSelectElement
    const segment = target.value
    if (!segment) return
    // setCurrentSegment(segment)
    navigate({
      pathname: `/student/${params.studentFolderId}`,
      search: setSearchParams2(_url.href, "segments", segment),
    })
  }

  return (
    <>
      {segments && (
        <select
          className="w-48 max-w-sm select select-primary select-sm "
          onChange={handleClick}
          disabled={isNavigating}
          value={"単語で検索"}
        >
          <option disabled value={"単語で検索"}>
            {urlSegment ?? "単語で検索"}
          </option>
          {segments.sort().map((segment, idx) => (
            <option key={idx} value={segment}>
              {segment}
            </option>
          ))}
        </select>
      )}
    </>
  )
}
// return (
//   <>
//     {segments &&
//       segments
//         .sort()
//         .map((segment, idx) => (
//           <NavLinkPill
//             to={`${setSearchParams(_url.href, "segments", segment)}`}
//             key={idx}
//             url={_url}
//             baseColor="bg-sfyellow-200"
//             hoverColor="sfyellow"
//             navSearch={navSearch}
//             isNavigating={isNavigating}
//             name={segment}
//             searchParam="segments"
//           />
//         ))}
//   </>
// )
