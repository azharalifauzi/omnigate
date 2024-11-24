'use client'

import { Trash2, Upload, User2 } from 'lucide-react'
import { Dialog, DialogContent } from '@repo/ui/components/ui/dialog'
import { useUser } from '~/hooks/user'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { useMutation } from '@tanstack/react-query'
import { client, unwrapResponse } from '~/utils/fetcher'
import React from 'react'
import { browseFile } from '~/utils'
import { ofetch } from 'ofetch'
import { toast } from '@repo/ui/components/ui/sonner'

interface AccountSettingsProps {
  isOpen: boolean
  onClose: () => void
}

const profileSchema = z.object({
  name: z.string({ message: 'Name is required' }).min(1, 'Name is required'),
  image: z.string().optional().nullable(),
})

type Profile = z.infer<typeof profileSchema>

const AccountSettings: React.FC<AccountSettingsProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useUser()
  const profileForm = useForm<Profile>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name,
      image: user?.image,
    },
  })

  const handleUpdateProfile = useMutation({
    mutationFn: async (data: Profile) => {
      const res = client.api.v1.user.me.$put({
        json: {
          name: data.name,
          image: data.image ?? null,
        },
      })

      await unwrapResponse(res)
      window.location.reload()
    },
  })

  const handleUploadImage = useMutation({
    mutationFn: async () => {
      const file = await browseFile('image/*')

      if (!file.type.startsWith('image')) {
        toast.error('Failed to upload', {
          description: 'Image format is invalid',
        })
        return
      }

      if (file.size / (1024 * 1024) > 3) {
        toast.error('Failed to upload', {
          description: 'File size max 3mb',
        })
        return
      }

      const res = client.api.v1.file['get-presigned-url'].$post({
        json: {
          fileKey: `assets/${new Date().getTime()}-${file.name}`,
        },
      })

      const { data } = await unwrapResponse(res)

      await ofetch(data.url, {
        method: 'PUT',
        headers: {
          'x-amz-acl': 'public-read',
          'content-type': file.type,
        },
        body: file,
      })

      const url = new URL(data.url)
      profileForm.setValue('image', url.origin + url.pathname)
    },
  })

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="max-w-xl p-6">
        <div className="bg-white rounded-md">
          <div className="text-lg font-semibold mb-4">Profile Details</div>
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center relative">
              {profileForm.watch('image') ? (
                <>
                  <button
                    className="absolute bottom-0 right-0 h-5 w-5 bg-red-500 flex items-center justify-center text-white rounded-full"
                    onClick={() => profileForm.setValue('image', null)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <img
                    src={profileForm.watch('image') ?? ''}
                    className="w-full h-full object-cover object-center rounded-full"
                  />
                </>
              ) : (
                <User2 className="text-gray-400" />
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">
                Profile picture
              </div>
              <div className="text-xs text-gray-400 mb-2">
                Recommended aspect ratio 1:1
              </div>
              <button
                className="flex text-xs border border-gray-200 rounded-full py-1 px-8 items-center gap-2 font-semibold hover:bg-gray-100"
                onClick={() => handleUploadImage.mutate()}
              >
                <Upload className="h-3.5 w-3.5" />
                {handleUploadImage.isPending ? 'Loading...' : 'Upload picture'}
              </button>
            </div>
          </div>
          <Form {...profileForm}>
            <form
              className="grid gap-3 mt-4"
              onSubmit={profileForm.handleSubmit((data) =>
                handleUpdateProfile.mutate(data),
              )}
            >
              <FormItem>
                <FormLabel>Email</FormLabel>
                <Input disabled value={user?.email} className="bg-gray-100" />
              </FormItem>
              <FormField
                control={profileForm.control}
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
              <div className="flex justify-end mt-3">
                <Button className="rounded-lg w-40" type="submit">
                  {handleUpdateProfile.isPending
                    ? 'Loading...'
                    : 'Save changes'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AccountSettings
