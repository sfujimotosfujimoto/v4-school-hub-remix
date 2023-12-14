export function serverErrorResponse(message: string) {
  throw new Response(message, {
    status: 500,
  })
}
