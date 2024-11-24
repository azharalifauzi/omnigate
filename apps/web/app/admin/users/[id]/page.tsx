import React from 'react'
import UserProfile from './client'
import { getServerSideUserObject } from '~/utils/auth'
import { AUTH_ROUTE_CONFIG } from '~/configs/auth'
import { notFound } from 'next/navigation'

const Page = () => {
  const { getPermission } = getServerSideUserObject()

  const isGranted = getPermission(
    AUTH_ROUTE_CONFIG['/admin/users/[id]'].permissions,
  )

  if (!isGranted) {
    return notFound()
  }

  return <UserProfile />
}

export default Page
