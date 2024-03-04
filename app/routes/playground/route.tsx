import { NavLinkButton } from "~/components/buttons/button"

export default function PlaygroundPage() {
  return (
    <div
      data-name="playground/route.tsx"
      className="flex flex-col items-center justify-center h-full"
    >
      <div className="flex mb-4 text-4xl font-semibold border-b-4 border-sfred-400 decoration-sfred-400 underline-offset-4">
        <h2>Playground</h2>
      </div>
      <NavLinkButton to="/admin/rename2">RENAME2</NavLinkButton>
    </div>
  )
}
