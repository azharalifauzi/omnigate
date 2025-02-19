import React from 'react'
import OrganizationDetailFeature from './client'
import { getUserServerSession } from '~/utils/server'
import { AUTH_ROUTE_CONFIG } from '~/configs/auth'
import { notFound } from 'next/navigation'

const Page = async () => {
  const { getPermission } = await getUserServerSession()

  const isGranted = getPermission(
    AUTH_ROUTE_CONFIG['/admin/organizations/[id]'].permissions,
  )

  if (!isGranted) {
    return notFound()
  }

  return <OrganizationDetailFeature />
}

export default Page
