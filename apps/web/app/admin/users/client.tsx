'use client'

import Pagination from '~/components/pagination'
import { Button } from '@repo/ui/components/ui/button'
import { useState } from 'react'
import UsersTable from './_components/table'
import UserForm from './_components/form'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { client, QueryKey, unwrapResponse } from '~/utils/fetcher'
import { Input } from '@repo/ui/components/ui/input'
import { Search } from 'lucide-react'
import { useGetAllOrganizations } from './_hooks'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/ui/select'
import AdminLayout from '../_components/admin-layout'

const UserFeature = () => {
  const [isOpen, setOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(
    undefined,
  )

  const { data } = useQuery({
    queryKey: [QueryKey.Users, page, search, selectedOrgId],
    queryFn: async () => {
      const res = client.api.v1.user.$get({
        query: {
          page: page.toString(),
          search,
          organizationId: selectedOrgId,
        },
      })

      const json = await unwrapResponse(res)

      return json.data
    },
    placeholderData: keepPreviousData,
  })

  const { data: organizations } = useGetAllOrganizations()

  return (
    <AdminLayout>
      <div className="p-10">
        <div className="flex justify-between">
          <h1 className="text-3xl font-medium mb-2">
            Users ({data?.totalCount ?? 0})
          </h1>
          <UserForm
            key={`add-organization-form-${isOpen}`}
            isOpen={isOpen}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
          >
            <Button>Add user</Button>
          </UserForm>
        </div>
        <div className="mt-8">
          <div className="flex items-center mb-4 gap-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const elements = new FormData(e.currentTarget)
                setSearch(elements.get('search')?.toString() ?? '')
              }}
              className="max-w-sm relative w-full"
            >
              <Search className="absolute top-1/2 -translate-y-1/2 left-2 w-[18px] h-[18px] text-gray-600" />
              <Input name="search" className="pl-8" placeholder="Search" />
            </form>
            <Select
              value={
                selectedOrgId ??
                organizations?.find((org) => org.isDefault)?.id?.toString()
              }
              onValueChange={setSelectedOrgId}
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {organizations?.map((org) => (
                  <SelectItem
                    key={`select-org-${org.id}`}
                    value={org.id.toString()}
                  >
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <UsersTable data={data?.data || []} />
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

export default UserFeature
