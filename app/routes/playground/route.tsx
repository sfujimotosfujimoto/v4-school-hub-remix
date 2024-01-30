import { Form } from "@remix-run/react"

export default function PlaygroundPage() {
  return (
    <div
      data-name="playground/route.tsx"
      className="flex h-full flex-col items-center justify-center"
    >
      <div className="mb-4 flex border-b-4 border-sfred-400 text-4xl font-semibold decoration-sfred-400 underline-offset-4">
        <h2>Playground</h2>
      </div>
      <Form method="post" className="p-0" action="/admin/rename2?index">
        <button
          type="submit"
          className={`btn btn-error btn-xs  border-0 shadow-md hover:bg-opacity-70`}
        >
          RENAME2
        </button>
      </Form>
    </div>
  )
}
