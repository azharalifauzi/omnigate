'use client'

import { Button } from '@repo/ui/components/ui/button'
import OrganizationTable from './_components/table'
import OrganizationForm from './_components/form'
import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { client, QueryKey, unwrapResponse } from '~/utils/fetcher'
import Pagination from '~/components/pagination'
import AdminLayout from '../_components/admin-layout'

const OrganizationFeature = () => {
  const [isOpen, setOpen] = useState(false)
  const [page, setPage] = useState(1)

  const { data } = useQuery({
    queryKey: [QueryKey.Organizations, page],
    queryFn: async () => {
      const res = client.api.v1.organization.$get({
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
          <h1 className="text-3xl font-medium mb-2">Organizations</h1>
          <OrganizationForm
            key={`add-organization-form-${isOpen}`}
            isOpen={isOpen}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
          >
            <Button>Add Organization</Button>
          </OrganizationForm>
        </div>
        <div className="mt-8">
          <OrganizationTable data={data?.data || []} />
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

export default OrganizationFeature
