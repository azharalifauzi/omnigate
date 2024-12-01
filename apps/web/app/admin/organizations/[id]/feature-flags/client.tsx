'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import Pagination from '~/components/pagination'
import { client, QueryKey, unwrapResponse } from '~/utils/fetcher'
import OrganizationDetailLayout from '../_components/detail-layout'
import FeatureFlagTable from './_components/table'
import { useParams } from 'next/navigation'

const FeatureFlagsFeature = () => {
  const [page, setPage] = useState(1)
  const params = useParams<{ id: string }>()
  const id = params?.id

  const { data } = useQuery({
    queryKey: [QueryKey.FeatureFlags, 'organizations', id, page],
    queryFn: async () => {
      const res = client.api.v1.organization[':id']['feature-flags'].$get({
        query: {
          page: page.toString(),
        },
        param: {
          id: id?.toString() ?? '',
        },
      })

      const json = await unwrapResponse(res)

      return json.data
    },
    placeholderData: keepPreviousData,
    enabled: !!id,
  })

  return (
    <OrganizationDetailLayout>
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
    </OrganizationDetailLayout>
  )
}

export default FeatureFlagsFeature
