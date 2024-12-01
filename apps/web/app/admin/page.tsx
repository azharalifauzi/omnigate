import React from 'react'
import AdminLayout from './_components/admin-layout'
import { getUserServerSession } from '~/utils/server'
import { AUTH_ROUTE_CONFIG } from '~/configs/auth'
import { notFound } from 'next/navigation'

const Page = () => {
  const { user, getPermission } = getUserServerSession()

  const isGranted = getPermission(AUTH_ROUTE_CONFIG['/admin'].permissions)

  if (!isGranted) {
    return notFound()
  }

  return (
    <AdminLayout>
      <div className="text-2xl font-semibold">
        <div>Hi {user?.name},</div>
        <div>Welcome to Admin Dashboard</div>
      </div>
    </AdminLayout>
  )
}

export default Page
