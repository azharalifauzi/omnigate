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
    <>
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
      <div className="my-4 text-gray-500 text-sm">Or</div>
      <Button
        variant="secondary"
        className="w-full"
        onClick={() => window.open('/api/v1/auth/sign-in/google', '_self')}
      >
        <svg
          viewBox="0 0 48 48"
          xmlns="http://www.w3.org/2000/svg"
          className="!w-5 !h-5"
        >
          <path
            fill="#FFC107"
            d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
	c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24
	c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
          ></path>
          <path
            fill="#FF3D00"
            d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657
	C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
          ></path>
          <path
            fill="#4CAF50"
            d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36
	c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
          ></path>
          <path
            fill="#1976D2"
            d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571
	c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
          ></path>
        </svg>
        Continue with Google
      </Button>
    </>
  )
}

export default SignupForm
