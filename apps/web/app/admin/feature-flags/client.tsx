'use client'

import { Button } from '@repo/ui/components/ui/button'
import FeatureFlagTable from './_components/table'
import FeatureFlagForm from './_components/form'
import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { client, QueryKey, unwrapResponse } from '~/utils/fetcher'
import Pagination from '~/components/pagination'
import AdminLayout from '../_components/admin-layout'

const FeatureFlagsFeature = () => {
  const [isOpen, setOpen] = useState(false)
  const [page, setPage] = useState(1)

  const { data } = useQuery({
    queryKey: [QueryKey.FeatureFlags, page],
    queryFn: async () => {
      const res = client.api.v1['feature-flag'].$get({
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
        <div className="flex justify-between mb-2">
          <h1 className="text-3xl font-medium">Feature Flags</h1>
          <FeatureFlagForm
            key={`add-feature-flag-form-${isOpen}`}
            isOpen={isOpen}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
          >
            <Button>Add feature flag</Button>
          </FeatureFlagForm>
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
    </AdminLayout>
  )
}

export default FeatureFlagsFeature
