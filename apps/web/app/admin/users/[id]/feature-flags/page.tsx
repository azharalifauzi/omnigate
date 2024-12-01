import { getServerSideUserObject } from '~/utils/server'
import RoleFeature from './client'
import { AUTH_ROUTE_CONFIG } from '~/configs/auth'
import { notFound } from 'next/navigation'

const Page = () => {
  const { getPermission } = getServerSideUserObject()

  const isGranted = getPermission(
    AUTH_ROUTE_CONFIG['/admin/feature-flags'].permissions,
  )

  if (!isGranted) {
    return notFound()
  }

  return <RoleFeature />
}

export default Page
