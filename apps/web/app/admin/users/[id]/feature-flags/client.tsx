'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import Pagination from '~/components/pagination'
import { client, QueryKey, unwrapResponse } from '~/utils/fetcher'
import { useGetUserById } from '../../_hooks'
import UserDetailLayout from '../_components/detail-layout'
import FeatureFlagTable from './_components/table'

const FeatureFlagsFeature = () => {
  const [page, setPage] = useState(1)

  const { data: user } = useGetUserById()

  const { data } = useQuery({
    queryKey: [QueryKey.FeatureFlags, user?.id, page],
    queryFn: async () => {
      const res = client.api.v1.user[':id']['feature-flags'].$get({
        query: {
          page: page.toString(),
        },
        param: {
          id: user?.id?.toString() ?? '',
        },
      })

      const json = await unwrapResponse(res)

      return json.data
    },
    placeholderData: keepPreviousData,
    enabled: !!user?.id,
  })

  return (
    <UserDetailLayout name={user?.name ?? ''}>
      <div className="px-10 pt-20 pb-10">
        <div className="flex justify-between mb-2">
          <h1 className="text-3xl font-medium">Feature Flags</h1>
        </div>
        <div className="mt-8">
          <FeatureFlagTable data={data?.data || []} />
          <Pagination
            className="justify-end mt-4"
            totalPages={data?.pageCount ?? 1}
            currentPage={page}
            onPageChange={setPage}
          />
        </div>
      </div>
    </UserDetailLayout>
  )
}

export default FeatureFlagsFeature
