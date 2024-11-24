'use client'

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  REGEXP_ONLY_DIGITS,
} from '@repo/ui/components/ui/input-otp'
import { toast } from '@repo/ui/components/ui/sonner'
import { useMutation } from '@tanstack/react-query'
import { useQueryState } from 'nuqs'
import React from 'react'
import { match } from 'ts-pattern'
import { client, unwrapResponse } from '~/utils/fetcher'

const VerifyOtpForm = () => {
  const [token] = useQueryState('token')

  const verifyOtp = useMutation({
    mutationFn: async (otp: string) => {
      const res = client.api.v1.auth['verify-otp'].$post({
        json: {
          otp,
          otpToken: token ?? '',
        },
      })

      await unwrapResponse(res)
      window.open('/admin', '_self')
    },
  })

  const resendOtp = useMutation({
    mutationFn: async () => {
      const res = client.api.v1.auth['resend-otp'].$post({
        json: {
          otpToken: token ?? '',
        },
      })

      await unwrapResponse(res)
      toast('Otp has been sent, please check your email.')
    },
  })

  return (
    <div className="max-w-72 mx-auto h-screen flex flex-col justify-center">
      <div className="text-xl font-semibold mb-2 -mt-10">Verification Code</div>
      <div className="text-gray-500 mb-10 max-w-72 text-sm">
        We have sent the verification code to your email address
      </div>
      <InputOTP
        pattern={REGEXP_ONLY_DIGITS}
        maxLength={6}
        autoFocus
        onChange={(value) => {
          if (value.length === 6) {
            verifyOtp.mutate(value)
          }
        }}
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <div className="text-gray-500 mt-4 max-w-72 text-xs">
        Didn't receive code?{' '}
        <button onClick={() => resendOtp.mutate()} className="text-blue-500">
          {match(resendOtp.isPending)
            .with(true, () => 'Sending...')
            .otherwise(() => 'Resend code')}
        </button>
      </div>
    </div>
  )
}

export default VerifyOtpForm
