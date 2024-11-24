import { createMiddleware } from 'hono/factory'
import chalk from 'chalk'

enum LogPrefix {
  Outgoing = '-->',
  Incoming = '<--',
  Error = 'xxx',
}

const humanize = (times: string[]) => {
  const [delimiter, separator] = [',', '.']

  const orderTimes = times.map((v) =>
    v.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + delimiter),
  )

  return orderTimes.join(separator)
}

const getTime = (start: number) => {
  const delta = Date.now() - start
  return humanize([
    delta < 1000 ? delta + 'ms' : Math.round(delta / 1000) + 's',
  ])
}

const COLOR_STATUS = {
  0: 'yellow',
  1: 'green',
  2: 'green',
  3: 'cyan',
  4: 'yellow',
  5: 'red',
  7: 'blue',
} as const

export const logger = () =>
  createMiddleware(async (c, next) => {
    if (
      /\.(svg|png|jpg|webp|jpeg|js|css|wasm|ico)$/.test(c.req.path) ||
      c.req.path === '/healthcheck'
    ) {
      await next()
      return
    }

    const { method, path } = c.req

    const ip = c.req.header('x-real-ip') || 'anon'

    console.log(LogPrefix.Incoming, method, path, ip)

    const start = Date.now()

    await next()

    const time = getTime(start)

    const statusKey = ((c.res.status / 100) | 0) as keyof typeof COLOR_STATUS
    const colorStatus = COLOR_STATUS[statusKey] || 'green'

    console.log(
      LogPrefix.Outgoing,
      method,
      path,
      chalk[colorStatus](c.res.status),
      ip,
      time,
    )
  })
