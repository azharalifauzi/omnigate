'use client'

import { useQuery } from '@tanstack/react-query'
import UsersTable from './_components/users-table'
import Pagination from '~/components/pagination'
import { client, QueryKey, unwrapResponse } from '~/utils/fetcher'
import { useState } from 'react'
import OrganizationDetailLayout from '../_components/detail-layout'
import { useParams } from 'next/navigation'

const OrganizationUserList = () => {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [page, setPage] = useState(1)

  const { data } = useQuery({
    queryKey: [QueryKey.OrganizationUserList, id, page],
    queryFn: async () => {
      const res = client.api.v1.organization[':id'].users.$get({
        param: {
          id: id || '1',
        },
        query: {
          page: page.toString(),
        },
      })

      const json = await unwrapResponse(res)

      return json.data
    },
    enabled: !!id,
  })

  return (
    <OrganizationDetailLayout>
      <div className="p-10">
        <h1 className="text-3xl font-medium mb-2">Users</h1>
        <div className="mt-8">
          <UsersTable data={data?.data ?? []} />
          <Pagination
            className="justify-end mt-4"
            totalPages={data?.pageCount || 1}
            currentPage={page}
            onPageChange={setPage}
          />
        </div>
      </div>
    </OrganizationDetailLayout>
  )
}

export default OrganizationUserList
