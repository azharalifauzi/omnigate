'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import Pagination from '~/components/pagination'
import { client, QueryKey, unwrapResponse } from '~/utils/fetcher'
import OrganizationDetailLayout from '../_components/detail-layout'
import FeatureFlagTable from './_components/table'
import { useParams } from 'next/navigation'
import { match } from 'ts-pattern'
import { Button } from '@repo/ui/components/ui/button'
import Link from '~/components/link'

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
          {match(data?.data.length ?? 0)
            .with(0, () => (
              <div className="flex flex-col items-center text-center max-w-lg mx-auto mt-24">
                <div className="font-medium mb-4 text-2xl">
                  Manage Feature Flags
                </div>
                <div className="mb-4">
                  At the moment, there are no feature flags available for this
                  organization. You&apos;ll need to configure them for your
                  business first.
                </div>
                <Button asChild>
                  <Link href="/admin/feature-flags">Add Feature Flag</Link>
                </Button>
              </div>
            ))
            .otherwise(() => (
              <>
                <FeatureFlagTable data={data?.data || []} />
                <Pagination
                  className="justify-end mt-4"
                  totalPages={data?.pageCount ?? 1}
                  currentPage={page}
                  onPageChange={setPage}
                />
              </>
            ))}
        </div>
      </div>
    </OrganizationDetailLayout>
  )
}

export default FeatureFlagsFeature
