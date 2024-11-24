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
import { Textarea } from '@repo/ui/components/ui/textarea'
import { client, QueryKey, unwrapResponse } from '~/utils/fetcher'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

interface PermissionFormProps {
  children?: React.ReactNode
  type?: 'create' | 'edit'
  initialData?: Data & { id: number }
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

const PermissionForm: React.FC<PermissionFormProps> = ({
  children,
  type = 'create',
  initialData,
  isOpen,
  onClose,
  onOpen,
}) => {
  const form = useForm<Data>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? async () => initialData : undefined,
  })
  const { control, handleSubmit } = form

  const queryClient = useQueryClient()

  const createPermission = useMutation({
    mutationFn: async (data: Data) => {
      const res = client.api.v1.permission.$post({
        json: data,
      })

      await unwrapResponse(res)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QueryKey.Permissions],
      })
      onClose && onClose()
    },
  })

  const updatePermission = useMutation({
    mutationFn: async (data: Data & { id: number }) => {
      const res = client.api.v1.permission[':id'].$put({
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

      queryClient.invalidateQueries({
        queryKey: [QueryKey.Permissions],
      })
      onClose && onClose()
    },
  })

  function onSubmit(data: Data) {
    if (type === 'create') {
      createPermission.mutate(data)
    } else if (type === 'edit' && initialData?.id) {
      updatePermission.mutate({
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
      <DialogContent className="w-full max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl">
            {type === 'create' ? 'Add' : 'Edit'} Permission
          </DialogTitle>
        </DialogHeader>
        <div>
          <Form {...form}>
            <form className="grid gap-2" onSubmit={handleSubmit(onSubmit)}>
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
                      Specify a clear title that indicates what this permission
                      allows users to view or modify.
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
                      Provide detailed information to help users understand the
                      purpose of this permission and its impact on system
                      operations.
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
                      Establish a unique identifier that will be used to
                      reference this permission within the application's code.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                className="mt-4"
                disabled={
                  createPermission.isPending || updatePermission.isPending
                }
              >
                {createPermission.isPending || updatePermission.isPending
                  ? 'Loading...'
                  : 'Save'}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PermissionForm
