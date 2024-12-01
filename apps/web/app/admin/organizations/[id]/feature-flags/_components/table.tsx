import { Button } from '@repo/ui/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/ui/dropdown-menu'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Ellipsis } from 'lucide-react'
import React, { useState } from 'react'
import { match } from 'ts-pattern'
import FeatureFlagForm from './form'
import { useParams } from 'next/navigation'

type FeatureFlag = {
  id: number
  name: string
  description: string | null
  key: string
  allowOverride: 'user' | 'organization' | null
  defaultValue: boolean
  value: boolean | null
}

const columnHelper = createColumnHelper<FeatureFlag>()

const columns = [
  columnHelper.accessor('name', {
    header: () => <span>Name</span>,
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
  columnHelper.accessor('value', {
    header: () => <span>Value</span>,
    cell: (info) => (
      <code>
        {match(info.getValue())
          .with(true, () => 'true')
          .with(false, () => 'false')
          .otherwise(() => `${info.row.original.defaultValue} (default)`)}
      </code>
    ),
    minSize: 120,
  }),
  columnHelper.accessor('id', {
    id: 'action',
    header: () => <span></span>,
    cell: (info) => <Action data={info.row.original} />,
    size: 80,
  }),
]

const Action: React.FC<{ data: FeatureFlag }> = ({ data }) => {
  const [modalState, setModalState] = useState<'idle' | 'edit'>('idle')
  const params = useParams()
  const id = params?.id

  return (
    <>
      {id && (
        <FeatureFlagForm
          key={`edit-feature-flag-form-${data.id}-${modalState === 'edit'}`}
          isOpen={modalState === 'edit'}
          onClose={() => setModalState('idle')}
          initialData={{
            key: data.key,
            name: data.name,
            description: data.description ?? '',
            id: data.id,
            defaultValue: data.defaultValue ? 'true' : 'false',
            value: match(data.value)
              .with(true, () => 'true')
              .with(false, () => 'false')
              .otherwise(() => 'default') as 'true' | 'false' | 'default',
          }}
          organization={{ id: Number(id.toString()) }}
        />
      )}

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
            Edit Feature Flag
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

interface Props {
  data: FeatureFlag[]
}

const FeatureFlagTable: React.FC<Props> = ({ data }) => {
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

export default FeatureFlagTable
