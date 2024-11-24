import React from 'react'
import OrganizationFeature from './client'
import { getServerSideUserObject } from '~/utils/auth'
import { AUTH_ROUTE_CONFIG } from '~/configs/auth'
import { notFound } from 'next/navigation'

const Page = () => {
  const { getPermission } = getServerSideUserObject()

  const isGranted = getPermission(
    AUTH_ROUTE_CONFIG['/admin/organizations'].permissions,
  )

  if (!isGranted) {
    return notFound()
  }

  return <OrganizationFeature />
}

export default Page
