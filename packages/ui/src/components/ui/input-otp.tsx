'use client'

import * as React from 'react'
import { OTPInput, OTPInputContext } from 'input-otp'
import { Dot } from 'lucide-react'

import {
  REGEXP_ONLY_CHARS,
  REGEXP_ONLY_DIGITS,
  REGEXP_ONLY_DIGITS_AND_CHARS,
} from 'input-otp'

import { cn } from '@repo/ui/lib/utils'

const InputOTP = ({
  className,
  containerClassName,
  ...props
}: React.ComponentPropsWithRef<typeof OTPInput>) => (
  <OTPInput
    containerClassName={cn(
      'flex items-center gap-2 has-[:disabled]:opacity-50',
      containerClassName,
    )}
    className={cn('disabled:cursor-not-allowed', className)}
    {...props}
  />
)
InputOTP.displayName = 'InputOTP'

const InputOTPGroup = ({
  className,
  ...props
}: React.ComponentPropsWithRef<'div'>) => (
  <div className={cn('flex items-center', className)} {...props} />
)
InputOTPGroup.displayName = 'InputOTPGroup'

const InputOTPSlot = ({
  index,
  className,
  ...props
}: React.ComponentPropsWithRef<'div'> & { index: number }) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index] ?? {}

  return (
    <div
      className={cn(
        'relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md',
        isActive && 'z-10 ring-2 ring-ring ring-offset-background',
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  )
}
InputOTPSlot.displayName = 'InputOTPSlot'

const InputOTPSeparator = ({
  ...props
}: React.ComponentPropsWithRef<'div'>) => (
  <div role="separator" {...props}>
    <Dot />
  </div>
)
InputOTPSeparator.displayName = 'InputOTPSeparator'

export {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
  REGEXP_ONLY_CHARS,
  REGEXP_ONLY_DIGITS,
  REGEXP_ONLY_DIGITS_AND_CHARS,
}
