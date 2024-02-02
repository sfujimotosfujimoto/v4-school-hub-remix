import { NavLinkButton } from "~/components/buttons/button"

export default function PlaygroundPage() {
  return (
    <div
      data-name="playground/route.tsx"
      className="flex h-full flex-col items-center justify-center"
    >
      <div className="mb-4 flex border-b-4 border-sfred-400 text-4xl font-semibold decoration-sfred-400 underline-offset-4">
        <h2>Playground</h2>
      </div>
      <NavLinkButton to="/admin/rename2">RENAME2</NavLinkButton>
    </div>
  )
}
