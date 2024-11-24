import { type Context } from 'hono'
import { type StatusCode } from 'hono/utils/http-status'

type Data<T> = T extends null | undefined ? null : T

export const generateJsonResponse = <T>(
  c: Context,
  data?: T,
  statusCode: StatusCode = 200,
  message = 'OK'
) =>
  c.json(
    {
      statusCode,
      message,
      data: (data ?? null) as Data<T>,
    },
    statusCode
  )
