import nodemailer, { SendMailOptions } from 'nodemailer'
import { env } from '~/env'

export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: {
    user: env.SMTP_USERNAME,
    pass: env.SMTP_PASSWORD,
  },
})

export function sendMail(mailOptions: SendMailOptions) {
  return transporter.sendMail({
    ...mailOptions,
    to: env.NODE_ENV === 'development' ? env.EMAIL_CATCHER : mailOptions.to,
  })
}
