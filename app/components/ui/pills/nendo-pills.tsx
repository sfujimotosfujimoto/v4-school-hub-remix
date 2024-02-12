import { useNavigate, useNavigation, useParams } from "@remix-run/react"

function setSearchParams2(url: string, key: string, value: string) {
  const _url = new URL(url)
  _url.searchParams.set(key, value ? value : "ALL")
  return _url.search
}
export default function NendoPills({
  url,
  nendos,
}: {
  url: string
  nendos: string[]
}) {
  const _url = new URL(url)
  const urlNendo = _url.searchParams.get("nendo")
  const params = useParams()
  const navigation = useNavigation()
  const navigate = useNavigate()
  const isNavigating = navigation.state !== "idle"

  function handleClick(e: React.ChangeEvent<HTMLSelectElement>) {
    const target = e.target as HTMLSelectElement
    const nendo = target.value
    if (!nendo) return
    navigate({
      pathname: `/student/${params.studentFolderId}`,
      search: setSearchParams2(_url.href, "nendo", nendo),
    })
  }

  return (
    <>
      {nendos && (
        <select
          className="select select-primary select-sm w-48 max-w-sm "
          onChange={handleClick}
          disabled={isNavigating}
          value={"年度で検索"}
        >
          <option disabled value={"年度で検索"}>
            {urlNendo ?? "年度で検索"}
          </option>
          {nendos
            .sort((a, b) => Number(b) - Number(a))
            .map((nendo, idx) => (
              <option key={idx} value={nendo}>
                {nendo}
              </option>
            ))}
        </select>
      )}
    </>
  )
}
