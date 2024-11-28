'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { client, QueryKey, unwrapResponse } from '~/utils/fetcher'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/ui/form'
import { Input } from '@repo/ui/components/ui/input'
import { Button } from '@repo/ui/components/ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { z } from 'zod'
import { useGetUserById } from '../_hooks'
import UserDetailLayout from './_components/detail-layout'
import AssignOrgForm from './_components/assign-org-form'
import Link from '~/components/link'
import { toast } from '@repo/ui/components/ui/sonner'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '~/hooks/user'
import { match } from 'ts-pattern'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@repo/ui/components/ui/alert-dialog'

const formSchema = z.object({
  name: z.string({ message: 'Name is required' }).min(1, 'Name is required'),
})

type Data = z.infer<typeof formSchema>

const UserProfile = () => {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id

  const { data } = useGetUserById()
  const { user } = useUser()

  const isSuspended = !!data?.suspendedAt

  const form = useForm<Data>({
    resolver: zodResolver(formSchema),
  })
  const queryClient = useQueryClient()

  const { control, handleSubmit, setValue } = form

  useEffect(() => {
    setValue('name', data?.name ?? '')
  }, [data])

  const updateUser = useMutation({
    mutationFn: async (data: Data) => {
      if (!id) return
      const res = client.api.v1.user[':id'].$put({
        json: data,
        param: {
          id: id,
        },
      })

      await unwrapResponse(res)
      queryClient.invalidateQueries({
        queryKey: [QueryKey.UserProfile, id],
      })
      queryClient.invalidateQueries({
        queryKey: [QueryKey.Users],
      })
      queryClient.invalidateQueries({
        queryKey: [QueryKey.OrganizationUserList],
      })
      toast('Success update user')
    },
  })

  const impersonateUser = useMutation({
    mutationFn: async () => {
      if (!id) return

      const res = client.api.v1.auth.impersonate.$post({
        json: {
          userId: Number(id),
        },
      })

      await unwrapResponse(res)
      window.open('/', '_self')
    },
  })

  const suspendUser = useMutation({
    mutationFn: async () => {
      if (!id) return

      const res = client.api.v1.user[':id'].suspend.$post({
        param: {
          id,
        },
      })

      await unwrapResponse(res)
      toast(`User: ${data?.name} is suspended`)
      queryClient.invalidateQueries({
        queryKey: [QueryKey.UserProfile, id],
      })
    },
  })

  const restoreUser = useMutation({
    mutationFn: async () => {
      if (!id) return

      const res = client.api.v1.user[':id'].restore.$post({
        param: {
          id,
        },
      })

      await unwrapResponse(res)
      toast(`User: ${data?.name} is restored`)
      queryClient.invalidateQueries({
        queryKey: [QueryKey.UserProfile, id],
      })
    },
  })

  const deleteUser = useMutation({
    mutationFn: async () => {
      if (!id) return

      const res = client.api.v1.user[':id'].$delete({
        param: {
          id,
        },
      })

      await unwrapResponse(res)
      toast(`User: ${data?.name} is deleted`)
      router.replace('/admin/users')
      queryClient.invalidateQueries({
        queryKey: [QueryKey.UserProfile, id],
      })
      queryClient.invalidateQueries({
        queryKey: [QueryKey.Users],
      })
      queryClient.invalidateQueries({
        queryKey: [QueryKey.OrganizationUserList],
      })
    },
  })

  function onSubmit(data: Data) {
    updateUser.mutate(data)
  }

  return (
    <UserDetailLayout name={data?.name ?? ''}>
      <div className="p-10 max-w-2xl">
        <div className="text-2xl font-medium mb-8">Profile</div>
        <Form {...form}>
          <form
            className="grid gap-3 border-b border-gray-200 pb-8"
            onSubmit={handleSubmit(onSubmit)}
          >
            <FormItem>
              <FormLabel>User ID</FormLabel>
              <Input disabled value={data?.id} className="bg-gray-100" />
            </FormItem>
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
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Input disabled value={data?.email} className="bg-gray-100" />
            </FormItem>
            <div>
              <Button className="mt-4" disabled={updateUser.isPending}>
                {updateUser.isPending ? 'Loading...' : 'Save'}
              </Button>
            </div>
          </form>
        </Form>
        <div className="flex justify-between mt-8 border-b border-gray-200 pb-8">
          <div>
            <div className="text-xl mb-1 font-medium">Organizations</div>
            <div>Choose which organizations this user belongs to</div>
          </div>
          <AssignOrgForm>
            <button className="hover:underline">Edit organizations</button>
          </AssignOrgForm>
        </div>
        <div className="border-b border-gray-200 pb-8 pt-4 grid gap-5">
          {data?.organizations.map(({ id, name }) => (
            <div key={`user-orgs-${id}`} className="flex justify-between">
              <div>{name}</div>
              <Link
                className="hover:underline"
                href={`/admin/organizations/${id}`}
              >
                View organization
              </Link>
            </div>
          ))}
        </div>
        {user?.id.toString() !== id && (
          <div className="mt-8 border-b border-gray-200 pb-8">
            <div className="text-xl mb-6 font-medium">Admin actions</div>
            <div className="mb-6">
              <div className="font-medium">Impersonate user</div>
              <div className="mb-3">
                Temporarily login as the user. Use this carefully, all the
                actions that is taken will be permanent
              </div>
              <Button
                variant="destructive"
                onClick={() => impersonateUser.mutate()}
              >
                {match(impersonateUser)
                  .with({ isPending: true }, () => 'Loading...')
                  .otherwise(() => 'Impersonate user')}
              </Button>
            </div>
            <div className="mb-6">
              <div className="font-medium">Suspend and restore user</div>
              <div className="mb-3">
                {match(isSuspended)
                  .with(
                    true,
                    () =>
                      "Give the user back their access to all apps and organizations after they've been suspended.",
                  )
                  .otherwise(
                    () =>
                      "Temporarily revoke the user's access to all applications until restored.",
                  )}
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    {match(isSuspended)
                      .with(true, () => 'Restore user')
                      .otherwise(() => 'Suspend user')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will{' '}
                      {isSuspended ? 'restore' : 'suspend'} {data?.name}{' '}
                      account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        isSuspended
                          ? restoreUser.mutate()
                          : suspendUser.mutate()
                      }
                    >
                      {match(suspendUser.isPending || restoreUser.isPending)
                        .with(true, () => 'Loading...')
                        .otherwise(() => 'Continue')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <div className="mb-6">
              <div className="font-medium">Delete user</div>
              <div className="mb-3">
                Permanently remove the user from all organizations and
                applications.
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete user</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete{' '}
                      {data?.name} account and remove {data?.name} data from our
                      servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteUser.mutate()}>
                      {match(deleteUser)
                        .with({ isPending: true }, () => 'Loading...')
                        .otherwise(() => 'Continue')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </div>
    </UserDetailLayout>
  )
}

export default UserProfile
