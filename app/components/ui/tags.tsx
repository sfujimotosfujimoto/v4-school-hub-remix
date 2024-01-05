import React from "react"

export default function Tags({
  tags,
  color = "bg-slate-200",
}: {
  tags: string[]
  color?: string
}) {
  return tags.map((tag) => (
    <span
      key={tag}
      className={`rounded-lg ${color} text-ellipsis px-2 py-1 text-xs font-bold sm:text-sm`}
    >
      {tag}
    </span>
  ))
}
