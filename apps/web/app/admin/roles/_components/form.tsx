import { Button } from '@repo/ui/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/ui/form'
import { Input } from '@repo/ui/components/ui/input'
import { Switch } from '@repo/ui/components/ui/switch'
import { Textarea } from '@repo/ui/components/ui/textarea'
import { client, QueryKey, unwrapResponse } from '~/utils/fetcher'
import { eqSet } from '~/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

interface RoleFormProps {
  children?: React.ReactNode
  type?: 'create' | 'edit'
  initialData?: Data & { id: number }
  initialChecked?: number[]
  isOpen?: boolean
  onClose?: () => void
  onOpen?: () => void
}

const formSchema = z.object({
  name: z.string({ message: 'Name is required' }).min(1, 'Name is required'),
  description: z.string().optional(),
  key: z.string({ message: 'Key is required' }).min(1, 'Key is required'),
})

type Data = z.infer<typeof formSchema>

const RoleForm: React.FC<RoleFormProps> = ({
  children,
  type = 'create',
  initialData,
  initialChecked,
  isOpen,
  onClose,
  onOpen,
}) => {
  const form = useForm<Data>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? async () => initialData : undefined,
  })
  const [permissionsChecked, setPermissionsChecked] = useState(
    new Set<number>(initialChecked),
  )
  const { control, handleSubmit } = form

  const queryClient = useQueryClient()

  const { data: permissions } = useQuery({
    queryKey: [QueryKey.Permissions, QueryKey.PermissionsToRoles],
    queryFn: async () => {
      const res = client.api.v1.permission.$get({
        query: {
          page: '1',
          size: '999999',
        },
      })

      const json = await unwrapResponse(res)

      return json.data
    },
    placeholderData: keepPreviousData,
  })

  const createRole = useMutation({
    mutationFn: async (data: Data) => {
      const res = client.api.v1.role.$post({
        json: data,
      })

      const json = await unwrapResponse(res)

      const roleId = json.data?.id
      if (!roleId) {
        return
      }

      const assignPermissionRes = client.api.v1.role['assign-permission'][
        ':id'
      ].$post({
        param: {
          id: roleId.toString(),
        },
        json: {
          permissionIds: Array.from(permissionsChecked.values()),
        },
      })

      await unwrapResponse(assignPermissionRes)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QueryKey.Roles],
      })
      onClose && onClose()
    },
  })

  const updateRole = useMutation({
    mutationFn: async (data: Data & { id: number }) => {
      const res = client.api.v1.role[':id'].$put({
        json: {
          description: data.description,
          key: data.key,
          name: data.name,
        },
        param: {
          id: data.id.toString(),
        },
      })

      await unwrapResponse(res)

      if (eqSet(permissionsChecked, new Set(initialChecked))) {
        return
      }

      const newAssignedIds = Array.from(permissionsChecked.values()).filter(
        (id) => !initialChecked?.includes(id),
      )
      const newUnAsiggnedIds =
        initialChecked?.filter((id) => !permissionsChecked.has(id)) ?? []

      await unwrapResponse(
        client.api.v1.role['assign-permission'][':id'].$post({
          json: {
            permissionIds: newAssignedIds,
          },
          param: {
            id: data.id.toString(),
          },
        }),
      )
      await unwrapResponse(
        client.api.v1.role['unassign-permission'][':id'].$post({
          json: {
            permissionIds: newUnAsiggnedIds,
          },
          param: {
            id: data.id.toString(),
          },
        }),
      )

      queryClient.invalidateQueries({
        queryKey: [QueryKey.Roles],
      })
      onClose && onClose()
    },
  })

  function onSubmit(data: Data) {
    if (type === 'create') {
      createRole.mutate(data)
    } else if (type === 'edit' && initialData?.id) {
      updateRole.mutate({
        ...data,
        id: initialData.id,
      })
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (open) {
          onOpen && onOpen()
        } else {
          onClose && onClose()
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-full max-w-2xl px-0">
        <DialogHeader className="px-6">
          <DialogTitle className="text-3xl">
            {type === 'create' ? 'Add' : 'Edit'} Role
          </DialogTitle>
        </DialogHeader>
        <div>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-2 max-h-[60vh] overflow-auto px-6">
                <div className="text-xl font-medium mb-2">Role details</div>
                <FormField
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Select a name that is easily recognizable, such as
                        "admin" or "account manager".
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormDescription>
                        Outline the role's responsibilities, including specific
                        permissions and any restrictions. Indicate who is
                        suitable for this role.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Provide a unique identifier for this role within your
                        application's code, for example, "project-lead".
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="mt-4 mb-4">
                  <div className="text-xl font-medium mb-4">Permissions</div>
                  <div className="grid gap-2">
                    {permissions?.data.map(({ key, name, description, id }) => (
                      <div
                        key={`permissions-to-roles-${key}`}
                        className="flex justify-between"
                      >
                        <div>
                          <div>{name}</div>
                          <div className="line-clamp-1 text-gray-500 text-sm">
                            {description ?? 'No description'}
                          </div>
                        </div>
                        <Switch
                          checked={permissionsChecked.has(id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setPermissionsChecked((p) => new Set(p).add(id))
                            } else {
                              setPermissionsChecked(
                                (p) =>
                                  new Set([...p].filter((pid) => pid !== id)),
                              )
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="w-full px-6">
                <Button
                  className="mt-4 w-full"
                  disabled={createRole.isPending || updateRole.isPending}
                >
                  {createRole.isPending || updateRole.isPending
                    ? 'Loading...'
                    : 'Save'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default RoleForm
