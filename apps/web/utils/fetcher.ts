import type { ApiRoutesType } from '@repo/server'
import { type ClientResponse, hc } from 'hono/client'

export const client = hc<ApiRoutesType>('/')

export function unwrapResponse<T>(f: Promise<ClientResponse<T>>): Promise<T> {
  return new Promise((resolve, reject) => {
    f.then(async (res) => {
      if (res.status >= 400) {
        reject((await res.json()) as T)
      } else {
        resolve((await res.json()) as T)
      }
    }).catch((err) => reject(err))
  })
}

export enum QueryKey {
  OrganizationDetail = 'organization-detail',
  Organizations = 'organizations',
  OrganizationUserList = 'organization-user-list',
  Permissions = 'permissions',
  Roles = 'roles',
  PermissionsToRoles = 'permissions-to-roles',
  Users = 'users',
  UserProfile = 'user-profile',
  UserRoles = 'user-roles',
  AllRoles = 'all-roles',
  AllOrganizations = 'all-organizations',
}
