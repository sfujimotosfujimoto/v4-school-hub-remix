import React from "react"

export default function Tags({
  tags,
  color = "bg-slate-200",
}: {
  tags: string[]
  color?: string
}) {
  return (
    <div className="flex gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className={`rounded-lg ${color} px-2 py-1 text-xs font-bold sm:text-sm`}
        >
          {tag}
        </span>
      ))}
    </div>
  )
}
