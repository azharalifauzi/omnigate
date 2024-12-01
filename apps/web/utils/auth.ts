export interface Permission {
  key: string
}

export function somePermissions(permissions: string[]) {
  return (p: Permission[]) => {
    const onlyKeys = p.map((p) => p.key)
    return permissions.some((permission) => onlyKeys.includes(permission))
  }
}

export function everyPermissions(permissions: string[]) {
  return (p: Permission[]) => {
    const onlyKeys = p.map((p) => p.key)
    return permissions.every((permission) => onlyKeys.includes(permission))
  }
}
