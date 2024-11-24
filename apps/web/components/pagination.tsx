import { cn } from '@repo/ui/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import React from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange?: (page: number) => void
  className?: string
}

const Pagination: React.FC<PaginationProps> = ({
  className,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div>
        {currentPage} / {totalPages}
      </div>
      <div className="flex items-center gap-1">
        <button
          disabled={currentPage - 1 < 1}
          onClick={() => {
            const backPage = currentPage - 1
            if (backPage < 1) {
              return
            }

            onPageChange && onPageChange(backPage)
          }}
          className="flex items-center justify-center h-6 w-6 disabled:opacity-35"
        >
          <ChevronLeft className="stroke-[1.5px]" />
        </button>
        <button
          disabled={currentPage + 1 > totalPages}
          onClick={() => {
            const nextPage = currentPage + 1
            if (nextPage > totalPages) {
              return
            }

            onPageChange && onPageChange(nextPage)
          }}
          className="flex items-center justify-center h-6 w-6 disabled:opacity-35"
        >
          <ChevronRight className="stroke-[1.5px]" />
        </button>
      </div>
    </div>
  )
}

export default Pagination
