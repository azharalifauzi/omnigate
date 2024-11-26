export interface Permission {
  key: string
}

export function somePermissions(permissions: string[]) {
  return (p: Permission[]) => {
    return p.some(({ key }) => {
      return permissions.includes(key)
    })
  }
}

export function everyPermissions(permissions: string[]) {
  return (p: Permission[]) => {
    return p.every(({ key }) => {
      return permissions.includes(key)
    })
  }
}
