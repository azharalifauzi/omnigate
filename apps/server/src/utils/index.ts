import { z } from 'zod'

export function isEmail(email: string) {
  return z.string().email().safeParse(email).success
}

export async function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}
