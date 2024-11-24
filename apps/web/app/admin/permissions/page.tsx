import { getServerSideUserObject } from '~/utils/auth'
import PermissionFeature from './client'
import { AUTH_ROUTE_CONFIG } from '~/configs/auth'
import { notFound } from 'next/navigation'

const Page = () => {
  const { getPermission } = getServerSideUserObject()

  const isGranted = getPermission(
    AUTH_ROUTE_CONFIG['/admin/permissions'].permissions,
  )

  if (!isGranted) {
    return notFound()
  }

  return <PermissionFeature />
}

export default Page
