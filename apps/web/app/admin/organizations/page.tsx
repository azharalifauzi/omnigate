import React from 'react'
import OrganizationFeature from './client'
import { getUserServerSession } from '~/utils/server'
import { AUTH_ROUTE_CONFIG } from '~/configs/auth'
import { notFound } from 'next/navigation'

const Page = () => {
  const { getPermission } = getUserServerSession()

  const isGranted = getPermission(
    AUTH_ROUTE_CONFIG['/admin/organizations'].permissions,
  )

  if (!isGranted) {
    return notFound()
  }

  return <OrganizationFeature />
}

export default Page
