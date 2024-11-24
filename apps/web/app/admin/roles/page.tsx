import { getServerSideUserObject } from '~/utils/auth'
import RoleFeature from './client'
import { AUTH_ROUTE_CONFIG } from '~/configs/auth'
import { notFound } from 'next/navigation'

const Page = () => {
  const { getPermission } = getServerSideUserObject()

  const isGranted = getPermission(AUTH_ROUTE_CONFIG['/admin/roles'].permissions)

  if (!isGranted) {
    return notFound()
  }

  return <RoleFeature />
}

export default Page
