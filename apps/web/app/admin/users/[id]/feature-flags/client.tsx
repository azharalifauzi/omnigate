'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import Pagination from '~/components/pagination'
import { client, QueryKey, unwrapResponse } from '~/utils/fetcher'
import { useGetUserById } from '../../_hooks'
import UserDetailLayout from '../_components/detail-layout'
import FeatureFlagTable from './_components/table'
import { match } from 'ts-pattern'
import { Button } from '@repo/ui/components/ui/button'
import Link from '~/components/link'

const FeatureFlagsFeature = () => {
  const [page, setPage] = useState(1)

  const { data: user } = useGetUserById()

  const { data } = useQuery({
    queryKey: [QueryKey.FeatureFlags, 'user', user?.id, page],
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
          {match(data?.data.length ?? 0)
            .with(0, () => (
              <div className="flex flex-col items-center text-center max-w-lg mx-auto mt-24">
                <div className="font-medium mb-4 text-2xl">
                  Manage Feature Flags
                </div>
                <div className="mb-6">
                  At the moment, there are no feature flags available for this
                  user. You&apos;ll need to configure them for your business
                  first.
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
    </UserDetailLayout>
  )
}

export default FeatureFlagsFeature
