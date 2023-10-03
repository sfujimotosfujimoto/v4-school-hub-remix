export default function RoleTag({ role }: { role: string }) {
  let color = ""

  switch (role) {
    case "writer": {
      color = "bg-sfgreen-400"
      break
    }
    case "owner": {
      color = "bg-sfred-400"
      break
    }
    case "reader": {
      color = "bg-sfyellow-400"
      break
    }
  }

  return (
    <span
      className={`absolute right-1 top-1 rounded-lg ${color} p-1 text-xs sm:text-sm `}
    >
      {roleToText(role)}
    </span>
  )
}

function roleToText(role: string) {
  switch (role) {
    case "writer": {
      return "編集者"
    }

    case "reader": {
      return "閲覧者"
    }

    case "owner": {
      return "オーナー"
    }
  }
}
