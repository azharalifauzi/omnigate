'use client'

import React from 'react'
import { useUser } from '~/hooks/user'

const Test = () => {
  const user = useUser()

  return <div>{JSON.stringify(user, null, 2)}</div>
}

export default Test
