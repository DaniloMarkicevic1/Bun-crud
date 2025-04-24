export function withGlobalHeaders(res: Response): Response {
  const headers = new Headers(res.headers);

  // Add global headers here
  headers.set("Access-Control-Allow-Origin", "http://localhost:4200");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // You can also add other useful headers here
  headers.set("X-Powered-By", "Bun");

  return new Response(res.body, {
    status: res.status,
    headers,
  });
}
