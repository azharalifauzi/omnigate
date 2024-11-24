'use client'

import { Button } from '@repo/ui/components/ui/button'
import RoleTable from './_components/table'
import RoleForm from './_components/form'
import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { client, QueryKey, unwrapResponse } from '~/utils/fetcher'
import Pagination from '~/components/pagination'
import AdminLayout from '../_components/admin-layout'

const RoleFeature = () => {
  const [isOpen, setOpen] = useState(false)
  const [page, setPage] = useState(1)

  const { data } = useQuery({
    queryKey: [QueryKey.Roles, page],
    queryFn: async () => {
      const res = client.api.v1.role.$get({
        query: {
          page: page.toString(),
        },
      })

      const json = await unwrapResponse(res)

      return json.data
    },
    placeholderData: keepPreviousData,
  })

  return (
    <AdminLayout>
      <div className="p-10">
        <div className="flex justify-between">
          <div>
            <h1 className="text-3xl font-medium mb-2">Roles</h1>
            <div>
              Roles are sets of permissions that define what users can do. You
              can assign multiple roles to customize user access.
            </div>
          </div>
          <RoleForm
            key={`add-organization-form-${isOpen}`}
            isOpen={isOpen}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
          >
            <Button>Add role</Button>
          </RoleForm>
        </div>
        <div className="mt-8">
          <RoleTable data={data?.data || []} />
          <Pagination
            className="justify-end mt-4"
            totalPages={data?.pageCount ?? 1}
            currentPage={page}
            onPageChange={setPage}
          />
        </div>
      </div>
    </AdminLayout>
  )
}

export default RoleFeature
