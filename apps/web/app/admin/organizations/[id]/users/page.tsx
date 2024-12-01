import React from 'react'
import OrganizationUserList from './client'
import { getUserServerSession } from '~/utils/server'
import { AUTH_ROUTE_CONFIG } from '~/configs/auth'
import { notFound } from 'next/navigation'

const Page = () => {
  const { getPermission } = getUserServerSession()

  const isGranted = getPermission(
    AUTH_ROUTE_CONFIG['/admin/organizations/[id]/users'].permissions,
  )

  if (!isGranted) {
    return notFound()
  }

  return <OrganizationUserList />
}

export default Page
