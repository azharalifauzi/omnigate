import { zodResolver } from '@hookform/resolvers/zod'
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
import { RadioGroup, RadioGroupItem } from '@repo/ui/components/ui/radio-group'
import { Input } from '@repo/ui/components/ui/input'
import { Textarea } from '@repo/ui/components/ui/textarea'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { client, QueryKey, unwrapResponse } from '~/utils/fetcher'
import { match } from 'ts-pattern'

interface FeatureFlagFormProps {
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
  defaultValue: z.enum(['true', 'false']).default('false'),
  allowOverride: z.enum(['user', 'organization', 'not-allowed']),
})

type Data = z.infer<typeof formSchema>

const FeatureFlagForm: React.FC<FeatureFlagFormProps> = ({
  children,
  type = 'create',
  initialData,
  isOpen,
  onClose,
  onOpen,
}) => {
  const form = useForm<Data>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? async () => initialData
      : { defaultValue: 'false', allowOverride: 'not-allowed' },
  })
  const { control, handleSubmit } = form

  const queryClient = useQueryClient()

  const createFeatureFlag = useMutation({
    mutationFn: async (data: Data) => {
      const res = client.api.v1['feature-flag'].$post({
        json: {
          ...data,
          allowOverride:
            data.allowOverride !== 'not-allowed'
              ? data.allowOverride
              : undefined,
          defaultValue: data.defaultValue === 'true' ? true : false,
        },
      })

      const json = await unwrapResponse(res)

      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QueryKey.FeatureFlags],
      })
      onClose && onClose()
    },
  })

  const updateFeatureFlag = useMutation({
    mutationFn: async (data: Data & { id: number }) => {
      const res = client.api.v1['feature-flag'][':id'].$put({
        json: {
          description: data.description,
          name: data.name,
          defaultValue: data.defaultValue === 'true' ? true : false,
        },
        param: {
          id: data.id.toString(),
        },
      })

      await unwrapResponse(res)

      queryClient.invalidateQueries({
        queryKey: [QueryKey.FeatureFlags],
      })
      onClose && onClose()
    },
  })

  function onSubmit(data: Data) {
    if (type === 'create') {
      createFeatureFlag.mutate(data)
    } else if (type === 'edit' && initialData?.id) {
      updateFeatureFlag.mutate({
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
            {type === 'create' ? 'Add' : 'Edit'} Feature Flag
          </DialogTitle>
        </DialogHeader>
        <div>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4 max-h-[60vh] overflow-auto px-6">
                <div className="text-xl font-medium mb-2">Details</div>
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
                        Give a name to identify a feature that will be flagged.
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
                      <FormDescription>Describe the feature. </FormDescription>
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
                        <Input {...field} disabled={type === 'edit'} />
                      </FormControl>
                      <FormDescription>
                        Give a key that will be accessed in the application,
                        e.g. pdf-download.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="defaultValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Value</FormLabel>
                      <FormDescription>
                        This value will applied to all application, unless you
                        override it.
                      </FormDescription>
                      <FormControl className="!mt-4">
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="true" />
                            </FormControl>
                            <FormLabel className="font-normal">True</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="false" />
                            </FormControl>
                            <FormLabel className="font-normal">False</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="allowOverride"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Override default value in</FormLabel>
                      <FormDescription>
                        Allow overriding applied feature flags to organization
                        or user level.
                      </FormDescription>
                      <FormControl className="!mt-4">
                        {match(type)
                          .with('create', () => (
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={field.disabled}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="not-allowed" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Not allowed
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="organization" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Organization
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="user" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  User
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          ))
                          .otherwise(() => (
                            <Input
                              disabled={type === 'edit'}
                              value={field.value?.split('-').join(' ')}
                              className="capitalize"
                            />
                          ))}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="w-full px-6">
                <Button
                  className="mt-4 w-full"
                  disabled={
                    createFeatureFlag.isPending || updateFeatureFlag.isPending
                  }
                >
                  {createFeatureFlag.isPending || updateFeatureFlag.isPending
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

export default FeatureFlagForm
