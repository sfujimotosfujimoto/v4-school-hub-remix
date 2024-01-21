import type { PermissionGoogle } from "~/types"
import RoleTag from "./role-tag"
export default function PermissionTag({
  permission,
  classes,
}: {
  permission: PermissionGoogle
  classes: string
}) {
  const textStyle = `text-sm sm:text-base truncate`
  return (
    <div className={`rounded p-4 ${classes} relative`}>
      <div className="flex flex-col place-content-center">
        <span className={`font-semibold ${textStyle}`}>
          {permission.displayName}
        </span>
        <span className={`${textStyle}`}>{permission.emailAddress}</span>
        <RoleTag role={permission.role} />
      </div>
    </div>
  )
}
