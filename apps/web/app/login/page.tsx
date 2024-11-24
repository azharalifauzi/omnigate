import React from 'react'
import LoginForm from './_components/form'
import Link from 'next/link'

const Page = () => {
  return (
    <div className="w-full px-10 max-w-lg mx-auto h-screen flex items-center flex-col justify-center">
      <div className="font-bold text-2xl mb-8 -mt-8 w-full">
        Hi friend, Welcome back!
      </div>
      <LoginForm />
      <div className="text-sm mt-12">
        Don't have account yet?{' '}
        <Link href="/sign-up" className="text-blue-500">
          Sign up
        </Link>
      </div>
    </div>
  )
}

export default Page
