export default function LoadingIcon({
  size = 4,
  color = "text-gray-800",
  opacity = "opacity-20",
}: {
  size?: number
  color?: string
  opacity?: string
}) {
  return (
    <span
      className={`inline-block w-${size} h-${size} animate-spin rounded-full border-[3px] border-current border-t-transparent ${color} ${opacity} `}
      role="status"
      aria-label="loading"
    >
      <span className="sr-only">Loading...</span>
    </span>
  )
}
