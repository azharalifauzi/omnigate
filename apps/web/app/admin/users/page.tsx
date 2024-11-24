import React from 'react'
import UserFeature from './client'
import { getServerSideUserObject } from '~/utils/auth'
import { notFound } from 'next/navigation'
import { AUTH_ROUTE_CONFIG } from '~/configs/auth'

const Page = () => {
  const { getPermission } = getServerSideUserObject()

  const isGranted = getPermission(AUTH_ROUTE_CONFIG['/admin/users'].permissions)

  if (!isGranted) {
    return notFound()
  }

  return <UserFeature />
}

export default Page
