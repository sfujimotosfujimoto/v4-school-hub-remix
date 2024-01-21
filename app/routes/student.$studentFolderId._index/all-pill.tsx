import { useNavigation } from "@remix-run/react"
import { NavLinkPill } from "~/components/buttons/button"

export default function AllPill({
  url,
  studentFolderId,
}: {
  url: string
  studentFolderId: string
}) {
  const _url = new URL(url)

  const navigate = useNavigation()

  const isNavigating = navigate.state !== "idle"
  const navSearch = navigate.location?.search
  return (
    <NavLinkPill
      to={`/student/${studentFolderId}`}
      url={_url}
      hoverColor="sfred"
      baseColor="bg-sfred-400"
      navSearch={navSearch}
      isNavigating={isNavigating}
      name={"ALL"}
      searchParam="nendo"
    />
  )
}
