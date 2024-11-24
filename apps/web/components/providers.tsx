'use client'

import { ServerError } from '@repo/server/src/lib/error.js'
import { toast, Toaster } from '@repo/ui/components/ui/sonner'
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { NuqsAdapter } from 'nuqs/adapters/next/app'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 24 * 60 * 60 * 1000, // stale time 24 hours
    },
  },
  queryCache: new QueryCache({
    onError: (data: any) => {
      if ('statusCode' in data) {
        const err = data as InstanceType<typeof ServerError>['response']
        toast.error(err.message, {
          description: err.description,
        })
        return
      }

      if (data instanceof Error) {
        toast.error('Opps unknown error is happened', {
          description: 'Please contact our support to solve the issue',
        })
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (data: any) => {
      if ('statusCode' in data) {
        const err = data as InstanceType<typeof ServerError>['response']
        toast.error(err.message, {
          description: err.description,
        })
        return
      }

      if (data instanceof Error) {
        toast.error('Opps unknown error is happened', {
          description: 'Please contact our support to solve the issue',
        })
      }
    },
  }),
})

interface Props {
  children?: React.ReactNode
}

const Providers: React.FC<Props> = ({ children }) => {
  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </NuqsAdapter>
  )
}

export default Providers
