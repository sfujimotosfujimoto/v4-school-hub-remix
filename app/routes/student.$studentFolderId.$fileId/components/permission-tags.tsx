import { getStudentEmail } from "~/lib/utils/utils"
import PermissionTag from "./permission-tag"
import type { PermissionGoogle } from "~/types"

export default function PermissionTags({
  permissions,
}: {
  permissions: PermissionGoogle[]
}) {
  const owner = permissions.find((p) => p.role === "owner")
  const student = permissions.find((p) => getStudentEmail(p.emailAddress))
  const others = permissions.filter(
    (p) => p.id !== owner?.id && p.id !== student?.id,
  )
  //  styles
  const h2Style = `mt-4 text-sm font-semibold sm:text-lg`
  const gridStyle = `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3`

  return (
    <>
      <h2 className={` ${h2Style}`}>生徒</h2>
      <div className={`${gridStyle} gap-4`}>
        {student && (
          <PermissionTag permission={student} classes="bg-sfgreen-300" />
        )}
      </div>
      <h2 className={`mt-4 ${h2Style}`}>オーナー</h2>
      <div className={`${gridStyle} gap-4`}>
        {owner && (
          <PermissionTag permission={owner} classes="bg-sfyellow-200" />
        )}
      </div>
      <h2 className={`mt-4 ${h2Style}`}>共有</h2>
      <div className={`${gridStyle} gap-4`}>
        {permissions &&
          others.map((p) => (
            <PermissionTag
              key={p.id}
              permission={p}
              classes={"bg-sfyellow-200"}
            />
          ))}
      </div>
    </>
  )
}
