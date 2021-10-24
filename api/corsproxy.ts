import { VercelRequest, VercelResponse } from '@vercel/node';
import fetch, { Request, Response } from 'cross-fetch';

// We support the GET, POST, HEAD, and OPTIONS methods from any origin,
// and allow any header on requests. These headers must be present
// on all responses to all CORS preflight requests. In practice, this means
// all responses to OPTIONS requests.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Max-Age": "86400",
}

async function handleRequest(request: VercelRequest) {
  const { url: apiUrl } = request.query;
  const url = new URL(request.url ?? PROXY_ENDPOINT, `http://${request.headers.host ?? 'vercel.com'}`)
  if (!apiUrl) {
    return new Response(null, { status: 400, statusText: 'param "url" not defined' })
  }

  // Rewrite request to point to API url. This also makes the request mutable
  // so we can add the correct Origin header to make the API server think
  // that this request isn't cross-site.
  const newRequest = new Request(apiUrl as string, request as any)
  newRequest.headers.set("Origin", new URL(apiUrl as string).origin)
  let response = await fetch(newRequest)

  // Recreate the response so we can modify the headers
  response = new Response(response.body, response)

  // Set CORS headers
  response.headers.set("Access-Control-Allow-Origin", url.origin)

  // Append to/Add Vary header so browser will cache response correctly
  response.headers.append("Vary", "Origin")

  return response
}

function handleOptions(request: VercelRequest) {
  // Make sure the necessary headers are present
  // for this to be a valid pre-flight request
  const headers = request.headers;
  if (
    headers["origin"] !== null &&
    headers["access-control-request-method"] !== null &&
    headers["access-control-request-headers"] !== null
  ) {
    // Handle CORS pre-flight request.
    // If you want to check or reject the requested method + headers
    // you can do that here.
    const respHeaders = {
      ...corsHeaders,
      // Allow all future content Request headers to go back to browser
      // such as Authorization (Bearer) or X-Client-Name-Version
      "Access-Control-Allow-Headers": request.headers["access-control-request-headers"] ?? '*',
    }

    return new Response(null, {
      headers: respHeaders,
    })
  }
  else {
    // Handle standard OPTIONS request.
    // If you want to allow other HTTP Methods, you can do that here.
    return new Response(null, {
      headers: {
        Allow: "GET, HEAD, POST, OPTIONS",
      },
    })
  }
}

const PROXY_ENDPOINT = "/api/corsproxy/"

export default (request: VercelRequest, response: VercelResponse) => {
  const { url: apiUrl } = request.query;

  if (request.method === "OPTIONS") {
    // Handle CORS preflight requests
    const res = handleOptions(request)
    const headers = {} as any
    res.headers.forEach((value, key) => {
      headers[key] = value
    })
    response.writeHead(res.status, res.statusText, headers)
    response.send(res.body)
  }
  else if (
    request.method === "GET" ||
    request.method === "HEAD" ||
    request.method === "POST"
  ) {
    // Handle requests to the API server
    handleRequest(request).then(async (res) => {
      const headers = {} as any
      res.headers.forEach((value, key) => {
        headers[key] = value
      })
      response.writeHead(res.status, res.statusText, headers)
      response.json(await res.json())
    })
  }
  else {
    response.status(400).send('bad request')
  }
};