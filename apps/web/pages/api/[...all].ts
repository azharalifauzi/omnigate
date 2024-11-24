/**
 * NOTE:
 * You maybe wondering why we're using pages api inside app router,
 * this is only used in DEV mode for redirecting all /api route related to Backend server.
 *
 * The reason we're not using rewrite options in next config is due to
 * rewrite options is not supporting websocket and streaming response.
 *
 * In PRODUCTION you should use something like nginx or traefik
 * to redirect all /api route to Backend server.
 */

import { createProxyMiddleware } from 'http-proxy-middleware'
import { NextApiRequest, NextApiResponse } from 'next'
import { env } from '~/env'

const proxy = createProxyMiddleware({
  target: env.BACKEND_URL,
  secure: false,
})

export const config = {
  api: {
    // Enable `externalResolver` option in Next.js
    externalResolver: true,
    bodyParser: false,
  },
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  proxy(req, res, (err) => {
    if (err) {
      throw err
    }

    throw new Error(
      `Request '${req.url}' is not proxied! We should never reach here!`,
    )
  })
}
