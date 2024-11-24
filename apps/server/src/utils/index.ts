import { z } from 'zod'

export function isEmail(email: string) {
  return z.string().email().safeParse(email).success
}
