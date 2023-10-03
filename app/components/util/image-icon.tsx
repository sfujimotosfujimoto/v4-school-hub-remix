// import Image from "next/image"

export default function ImageIcon({
  src,
  alt,
  width = 30,
  height = 30,
  ...rest
}: {
  src: string
  alt: string
  width?: number
  height?: number
}) {
  return (
    <img
      className="rounded-full"
      src={src}
      alt={alt}
      width={width}
      height={height}
    />
  )
}
