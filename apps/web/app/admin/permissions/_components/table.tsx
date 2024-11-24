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
import { Ellipsis } from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'
import React, { useState } from 'react'
import PermissionForm from './form'
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

type Permission = {
  name: string
  key: string
  description: string | null
  id: number
  createdAt: string
}

const columnHelper = createColumnHelper<Permission>()

const columns = [
  columnHelper.accessor('name', {
    header: () => <span>Permission</span>,
    cell: (info) => info.getValue(),
    minSize: 220,
  }),
  columnHelper.accessor('key', {
    header: () => <span>Key</span>,
    cell: (info) => (
      <span className="bg-gray-100 px-1.5 py-0.5 rounded-sm text-gray-500">
        <code>{info.getValue()}</code>
      </span>
    ),
    size: 160,
  }),
  columnHelper.accessor('description', {
    header: () => <span>Description</span>,
    cell: (info) => info.getValue(),
    minSize: 300,
  }),
  columnHelper.accessor('id', {
    id: 'action',
    header: () => <span></span>,
    cell: (info) => <Action data={info.row.original} />,
    size: 80,
  }),
]

const Action: React.FC<{ data: Permission }> = ({ data }) => {
  const [modalState, setModalState] = useState<'idle' | 'edit' | 'delete'>(
    'idle',
  )

  const queryClient = useQueryClient()

  const deletePermission = useMutation({
    mutationFn: async () => {
      const res = client.api.v1.permission[':id'].$delete({
        param: {
          id: data.id.toString(),
        },
      })
      await unwrapResponse(res)
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: [QueryKey.Permissions] })
      setModalState('idle')
      await sleep(100)
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
              Delete Permission
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-800">
              You&apos;re about to delete the {data.name} permission. Any users
              who are assigned this permission - separately or as part of a role
              - will lose access to the permission.
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
                deletePermission.mutate()
              }}
            >
              {deletePermission.isPending ? 'Loading...' : 'Delete permission'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <PermissionForm
        key={`edit-permission-form-${data.id}-${modalState === 'edit'}`}
        type="edit"
        isOpen={modalState === 'edit'}
        onClose={() => setModalState('idle')}
        initialData={{
          key: data.key,
          name: data.name,
          description: data.description ?? '',
          id: data.id,
        }}
      />
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
          <DropdownMenuItem onSelect={() => setModalState('edit')}>
            Edit Permission
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setModalState('delete')}
            className="text-red-500"
          >
            Delete Permission
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

interface PermissionTableProps {
  data: Permission[]
}

const PermissionTable: React.FC<PermissionTableProps> = ({ data }) => {
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

export default PermissionTable
