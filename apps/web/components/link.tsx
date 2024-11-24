'use client'

import React from 'react'
import LinkPrimitive, { LinkProps } from 'next/link'
import { usePathname } from 'next/navigation'

interface Props extends LinkProps {
  children?: React.ReactNode
  end?: boolean
  className?: string
}

const Link: React.FC<Props> = ({ children, end, ...props }) => {
  const pathname = usePathname()

  const hrefPathname = new URL(
    props.href.toString(),
    typeof window !== 'undefined' ? window.origin : 'http://localhost:3000',
  ).pathname

  const isActive = end
    ? hrefPathname === pathname
    : pathname?.startsWith(hrefPathname)

  return (
    <LinkPrimitive {...props} data-active={isActive}>
      {children}
    </LinkPrimitive>
  )
}

export default Link
