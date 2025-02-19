import { getUserServerSession } from '~/utils/server'
import FeatureFlagFeature from './client'
import { AUTH_ROUTE_CONFIG } from '~/configs/auth'
import { notFound } from 'next/navigation'

const Page = async () => {
  const { getPermission } = await getUserServerSession()

  const isGranted = getPermission(
    AUTH_ROUTE_CONFIG['/admin/users/[id]/feature-flags'].permissions,
  )

  if (!isGranted) {
    return notFound()
  }

  return <FeatureFlagFeature />
}

export default Page
