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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/ui/form'
import { Input } from '@repo/ui/components/ui/input'
import { client, QueryKey, unwrapResponse } from '~/utils/fetcher'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

interface OrganizationFormProps {
  children?: React.ReactNode
  isOpen?: boolean
  onClose?: () => void
  onOpen?: () => void
}

const formSchema = z.object({
  name: z.string({ message: 'Name is required' }).min(1, 'Name is required'),
})

type Data = z.infer<typeof formSchema>

const OrganizationForm: React.FC<OrganizationFormProps> = ({
  children,
  isOpen,
  onClose,
  onOpen,
}) => {
  const form = useForm<Data>({
    resolver: zodResolver(formSchema),
  })
  const { control, handleSubmit } = form

  const queryClient = useQueryClient()

  const createOrganization = useMutation({
    mutationFn: async (data: Data) => {
      const res = client.api.v1.organization.$post({
        json: data,
      })
      await unwrapResponse(res)

      queryClient.invalidateQueries({
        queryKey: [QueryKey.Organizations],
      })
      onClose && onClose()
    },
  })

  function onSubmit(data: Data) {
    createOrganization.mutate(data)
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
          <DialogTitle className="text-3xl">Add Organization</DialogTitle>
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

                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="mt-4" disabled={createOrganization.isPending}>
                {createOrganization.isPending ? 'Loading...' : 'Save'}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default OrganizationForm
