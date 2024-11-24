import React from 'react'
import OrganizationUserList from './client'
import { getServerSideUserObject } from '~/utils/auth'
import { AUTH_ROUTE_CONFIG } from '~/configs/auth'
import { notFound } from 'next/navigation'

const Page = () => {
  const { getPermission } = getServerSideUserObject()

  const isGranted = getPermission(
    AUTH_ROUTE_CONFIG['/admin/organizations/[id]/users'].permissions,
  )

  if (!isGranted) {
    return notFound()
  }

  return <OrganizationUserList />
}

export default Page
