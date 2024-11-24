import React from 'react'
import SignupForm from './_components/form'
import Link from 'next/link'

const Page = () => {
  return (
    <div className="w-full px-10 max-w-lg mx-auto h-screen flex items-center flex-col justify-center">
      <div className="font-bold text-2xl mb-8 -mt-8 w-full">
        Register your account
      </div>
      <SignupForm />
      <div className="text-sm mt-12">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-500">
          Sign in
        </Link>
      </div>
    </div>
  )
}

export default Page
