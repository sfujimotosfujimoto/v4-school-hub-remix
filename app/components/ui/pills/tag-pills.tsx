import { useNavigate, useNavigation, useParams } from "@remix-run/react"

function setSearchParams2(url: string, key: string, value: string) {
  const _url = new URL(url)
  _url.searchParams.set(key, value ? value : "ALL")
  return _url.search
}

export default function TagPills({
  url,
  tags,
}: {
  url: string
  tags: string[]
}) {
  const _url = new URL(url)
  const urlTag = _url.searchParams.get("tags")
  const params = useParams()
  const navigation = useNavigation()
  const navigate = useNavigate()

  const isNavigating = navigation.state !== "idle"
  // const navSearch = navigate.location?.search

  function handleClick(e: React.ChangeEvent<HTMLSelectElement>) {
    const target = e.target as HTMLSelectElement
    const tag = target.value
    if (!tag) return
    navigate({
      pathname: `/student/${params.studentFolderId}`,
      search: setSearchParams2(_url.href, "tags", tag),
    })
  }

  return (
    <>
      {tags && (
        <select
          className="select select-primary select-sm w-48 max-w-sm "
          onChange={handleClick}
          disabled={isNavigating}
          value={"タグで検索"}
        >
          <option disabled value={"タグで検索"}>
            {urlTag ?? "タグで検索"}
          </option>
          {tags.sort().map((segment, idx) => (
            <option key={idx} value={segment}>
              {segment}
            </option>
          ))}
        </select>
      )}
    </>
  )
}

/*
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

*/
