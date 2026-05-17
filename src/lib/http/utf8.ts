export const UTF8_JSON_CONTENT_TYPE = "application/json; charset=utf-8";

export const UTF8_JSON_HEADERS = {
  Accept: UTF8_JSON_CONTENT_TYPE,
  "Content-Type": UTF8_JSON_CONTENT_TYPE,
} as const;

export function withUtf8JsonHeaders(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers ?? {});
  const body = init.body;
  const isBinaryBody =
    typeof FormData !== "undefined" && body instanceof FormData ||
    typeof Blob !== "undefined" && body instanceof Blob ||
    typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer;

  if (!headers.has("Accept")) {
    headers.set("Accept", UTF8_JSON_CONTENT_TYPE);
  }

  // Never force JSON content type for binary/multipart payloads (e.g. image upload).
  if (body && !isBinaryBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", UTF8_JSON_CONTENT_TYPE);
  }

  return {
    ...init,
    headers,
  };
}

export async function utf8Fetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  return fetch(input, withUtf8JsonHeaders(init));
}

export function jsonUtf8Response(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers ?? {});
  headers.set("Content-Type", UTF8_JSON_CONTENT_TYPE);

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}
