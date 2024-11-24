import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/ui/components/ui/dialog'
import { client, QueryKey, unwrapResponse } from '~/utils/fetcher'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useGetAllOrganizations, useGetUserById } from '../../_hooks'
import { Switch } from '@repo/ui/components/ui/switch'
import React, { useMemo } from 'react'
import { Label } from '@repo/ui/components/ui/label'
import { useParams } from 'next/navigation'
import { cn } from '@repo/ui/lib/utils'

const AssignOrgForm: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient()
  const params = useParams<{ id: string }>()
  const id = params?.id
  const { data: organizations } = useGetAllOrganizations()

  const { data: user } = useGetUserById()
  const userOrganizationIds = useMemo(() => {
    if (!user) {
      return new Set()
    }

    return new Set(user.organizations.map((org) => org.id))
  }, [user])

  const assignOrg = useMutation({
    mutationFn: async (organizationId: number) => {
      if (!id) return

      const res = client.api.v1.user[':id']['assign-organization'].$post({
        json: {
          organizationId,
        },
        param: {
          id,
        },
      })
      await unwrapResponse(res)
      queryClient.invalidateQueries({
        queryKey: [QueryKey.UserProfile, id],
      })
      queryClient.invalidateQueries({
        queryKey: [QueryKey.Organizations],
      })
      queryClient.invalidateQueries({
        queryKey: [QueryKey.OrganizationUserList, organizationId.toString()],
      })
    },
  })

  const unAssignOrg = useMutation({
    mutationFn: async (organizationId: number) => {
      if (!id) return

      const res = client.api.v1.user[':id']['unassign-organization'].$post({
        json: {
          organizationId,
        },
        param: {
          id,
        },
      })
      await unwrapResponse(res)
      queryClient.invalidateQueries({
        queryKey: [QueryKey.UserProfile, id],
      })
      queryClient.invalidateQueries({
        queryKey: [QueryKey.Organizations],
      })
      queryClient.invalidateQueries({
        queryKey: [QueryKey.OrganizationUserList, organizationId.toString()],
      })
    },
  })

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit organizations</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] min-h-[100px] overflow-auto">
          <div className="mb-4">Organizations</div>
          <div className="grid gap-4">
            {organizations?.map((org) => (
              <div key={`orgs-${org.id}`} className="flex items-center gap-3">
                <Switch
                  id={`orgs-${org.id}`}
                  checked={userOrganizationIds.has(org.id) ?? false}
                  disabled={org.isDefault ?? false}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      assignOrg.mutate(org.id)
                    } else {
                      unAssignOrg.mutate(org.id)
                    }
                  }}
                />
                <Label
                  htmlFor={`orgs-${org.id}`}
                  className={cn('font-medium', {
                    'text-gray-400': org.isDefault,
                  })}
                >
                  {org.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AssignOrgForm
