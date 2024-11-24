'use client'

import { type User } from '@repo/server'
import React from 'react'
import { UserContext } from '~/hooks/user'

interface Props {
  children?: React.ReactNode
  user: User | null
}

const UserContextProvider: React.FC<Props> = ({ children, user }) => {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}

export default UserContextProvider
