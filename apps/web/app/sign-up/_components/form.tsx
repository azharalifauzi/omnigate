'use client'

import { Button } from '@repo/ui/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/ui/form'
import { Input } from '@repo/ui/components/ui/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import React from 'react'
import { useMutation } from '@tanstack/react-query'
import { client, unwrapResponse } from '~/utils/fetcher'
import { z } from 'zod'
import { useRouter } from 'next/navigation'

const formSchema = z.object({
  email: z.string({ message: 'Email is required' }).email('Email is invalid'),
  name: z.string({ message: 'Full name is required' }),
})

type Data = z.infer<typeof formSchema>

const SignupForm = () => {
  const form = useForm<Data>({
    resolver: zodResolver(formSchema),
  })
  const { control, handleSubmit } = form
  const router = useRouter()

  const submitMutation = useMutation({
    mutationFn: async (data: Data) => {
      const res = client.api.v1.auth['sign-up'].$post({
        json: data,
      })

      const { data: user } = await unwrapResponse(res)

      router.push(`/verify-otp?token=${user.otpToken}`)
    },
  })

  async function onSubmit(data: Data) {
    submitMutation.mutate(data)
  }

  return (
    <Form {...form}>
      <form className="grid gap-4 w-full" onSubmit={handleSubmit(onSubmit)}>
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button disabled={submitMutation.isPending} className="mt-1">
          {submitMutation.isPending ? 'Loading...' : 'Create your account'}
        </Button>
      </form>
    </Form>
  )
}

export default SignupForm
