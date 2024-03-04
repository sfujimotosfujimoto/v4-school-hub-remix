import { useNavigate, useNavigation, useParams } from "@remix-run/react"

function setSearchParams2(url: string, key: string, value: string) {
  const _url = new URL(url)
  _url.searchParams.set(key, value ? value : "ALL")
  return _url.search
}

export default function ExtensionPills({
  url,
  extensions,
}: {
  url: string
  extensions: string[]
}) {
  const _url = new URL(url)
  const urlExtension = _url.searchParams.get("extensions")
  const params = useParams()
  const navigation = useNavigation()
  const navigate = useNavigate()

  const isNavigating = navigation.state !== "idle"

  function handleClick(e: React.ChangeEvent<HTMLSelectElement>) {
    const target = e.target as HTMLSelectElement
    const extension = target.value
    if (!extension) return
    navigate({
      pathname: `/student/${params.studentFolderId}`,
      search: setSearchParams2(_url.href, "extensions", extension),
    })
  }

  return (
    <>
      {extensions && (
        <select
          className="w-48 max-w-sm select select-primary select-sm "
          onChange={handleClick}
          disabled={isNavigating}
          value={"ファイルタイプで検索"}
        >
          <option disabled value="ファイルタイプで検索">
            {urlExtension ?? "ファイルタイプで検索"}
          </option>
          <option value={"ALL"}>ALL</option>
          {extensions.sort().map((extension, idx) => (
            <option key={idx} value={extension}>
              {extension}
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
      {extensions &&
        extensions
          .sort()
          .map((ext, idx) => (
            <NavLinkPill
              to={`${setSearchParams(_url.href, "extensions", ext)}`}
              key={ext}
              url={_url}
              baseColor="bg-sky-400"
              hoverColor="sky"
              navSearch={navSearch}
              isNavigating={isNavigating}
              name={ext}
              searchParam="extensions"
            />
          ))}
    </>
  )

*/
