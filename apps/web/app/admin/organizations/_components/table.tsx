import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { client, QueryKey, unwrapResponse } from '~/utils/fetcher'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/ui/dropdown-menu'
import { Check, Ellipsis } from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'
import React, { useState } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/components/ui/alert-dialog'
import { sleep } from '~/utils'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'

type Organization = {
  id: number
  name: string
  createdAt: string
  usersCount: number
  isDefault: boolean | null
}

const columnHelper = createColumnHelper<Organization>()

const columns = [
  columnHelper.accessor('name', {
    header: () => <span>Organization</span>,
    cell: (info) => info.getValue(),
    minSize: 220,
  }),
  columnHelper.accessor('id', {
    header: () => <span>Organization ID</span>,
    cell: (info) => (
      <span className="text-gray-500">
        <code>{info.getValue()}</code>
      </span>
    ),
    size: 120,
  }),
  columnHelper.accessor('usersCount', {
    header: () => <span>Users</span>,
    cell: (info) => info.getValue(),
    size: 120,
  }),
  columnHelper.accessor('createdAt', {
    header: () => <span>Date added</span>,
    cell: (info) => dayjs(info.getValue()).format('DD MMM YYYY'),
    size: 120,
  }),
  columnHelper.accessor('isDefault', {
    header: () => <span>Default</span>,
    cell: (info) =>
      info.getValue() ? <Check className="stroke-[1.5px]" /> : null,
    size: 80,
  }),
  columnHelper.display({
    id: 'action',
    header: () => <span></span>,
    cell: (info) => <Action data={info.row.original} />,
    size: 80,
  }),
]

const Action: React.FC<{ data: Organization }> = ({ data }) => {
  const [modalState, setModalState] = useState<'idle' | 'delete'>('idle')

  const router = useRouter()
  const queryClient = useQueryClient()

  const deleteOrganization = useMutation({
    mutationFn: async () => {
      const res = client.api.v1.organization[':id'].$delete({
        param: {
          id: data.id.toString(),
        },
      })

      await unwrapResponse(res)
    },
    onSuccess: async () => {
      setModalState('idle')
      await sleep(100)
      queryClient.invalidateQueries({ queryKey: [QueryKey.Organizations] })
    },
  })

  return (
    <>
      <AlertDialog
        open={modalState === 'delete'}
        onOpenChange={(open) =>
          open ? setModalState('delete') : setModalState('idle')
        }
      >
        <AlertDialogContent className="w-full max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl mb-4">
              Delete Organization
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-800">
              You&apos;re about to delete the {data.name} Organization. Any
              users who are assigned this Organization - separately or as part
              of a role - will lose access to the Organization.
              <br />
              <br />
              This action can&apos;t be reversed
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={async () => {
                deleteOrganization.mutate()
              }}
            >
              {deleteOrganization.isPending
                ? 'Loading...'
                : 'Delete Organization'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="h-7 w-7 p-0 focus-visible:ring-0 focus-visible:ring-transparent"
            variant="ghost"
          >
            <Ellipsis className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40" align="end">
          <DropdownMenuItem
            onSelect={() => {
              router.push(`/admin/organizations/${data.id}`)
            }}
          >
            View details
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              router.push(`/admin/organizations/${data.id}/users`)
            }}
          >
            View users
          </DropdownMenuItem>
          {!data.isDefault && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setModalState('delete')}
                className="text-red-500"
              >
                Delete Organization
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

interface OrganizationTableProps {
  data: Organization[]
}

const OrganizationTable: React.FC<OrganizationTableProps> = ({ data }) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <table className="w-full">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th
                className="text-left py-3 px-2 font-normal border-b border-gray-200"
                key={header.id}
                style={{ width: header.getSize() }}
              >
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext(),
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td
                className="py-3 px-2 text-sm border-b border-gray-200"
                key={cell.id}
                style={{ width: cell.column.getSize() }}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default OrganizationTable
