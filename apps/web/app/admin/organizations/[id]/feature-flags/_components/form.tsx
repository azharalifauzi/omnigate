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
  initialData?: {
    id: number
    name: string
    description: string
    key: string
    value: Data['value']
    defaultValue: 'true' | 'false'
  }
  organization: {
    id: number
  }
  isOpen?: boolean
  onClose?: () => void
  onOpen?: () => void
}

const formSchema = z.object({
  value: z.enum(['true', 'false', 'default']).default('default'),
})

type Data = z.infer<typeof formSchema>

const FeatureFlagForm: React.FC<FeatureFlagFormProps> = ({
  children,
  initialData,
  isOpen,
  onClose,
  onOpen,
  organization,
}) => {
  const form = useForm<Data>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? async () => ({ value: initialData.value })
      : { value: 'default' },
  })
  const { control, handleSubmit } = form

  const queryClient = useQueryClient()

  const updateFeatureFlag = useMutation({
    mutationFn: async (data: Data & { id: number }) => {
      const res = client.api.v1.organization[':id']['feature-flags'].$post({
        json: {
          value: match(data.value)
            .with('true', () => true)
            .with('false', () => false)
            .otherwise(() => undefined),
          featureFlagId: data.id,
        },
        param: {
          id: organization.id.toString(),
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
    if (initialData) {
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
          <DialogTitle className="text-3xl">Edit Feature Flag</DialogTitle>
        </DialogHeader>
        <div>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4 max-h-[60vh] overflow-auto px-6">
                <div className="text-xl font-medium mb-2">Details</div>

                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      className="disabled:bg-gray-100"
                      value={initialData?.name}
                      disabled
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>

                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      className="disabled:bg-gray-100"
                      value={initialData?.description}
                      disabled
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                <FormItem>
                  <FormLabel>Key</FormLabel>
                  <FormControl>
                    <Input
                      className="disabled:bg-gray-100"
                      value={initialData?.key}
                      disabled
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                <FormField
                  control={control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormDescription>
                        Set value for this organization.
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
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="default" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Use default ({initialData?.defaultValue})
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="w-full px-6">
                <Button
                  className="mt-4 w-full"
                  disabled={updateFeatureFlag.isPending}
                >
                  {updateFeatureFlag.isPending ? 'Loading...' : 'Save'}
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
