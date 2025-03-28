"use client"

import { memo } from "react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  paginate: (pageNumber: number) => void
}

export const Pagination = memo(function Pagination({ currentPage, totalPages, paginate }: PaginationProps) {
  // Don't render pagination if there's only one page
  if (totalPages <= 1) return null

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers: number[] = []

    if (totalPages <= 3) {
      // If 3 or fewer pages, show all
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else if (currentPage <= 2) {
      // If near the start
      for (let i = 1; i <= 3; i++) {
        pageNumbers.push(i)
      }
    } else if (currentPage >= totalPages - 1) {
      // If near the end
      for (let i = totalPages - 2; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // In the middle
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pageNumbers.push(i)
      }
    }

    return pageNumbers
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex justify-center items-center mt-4 space-x-2 flex-wrap animate-fadeInUp">
      <button
        onClick={() => paginate(1)}
        disabled={currentPage === 1}
        className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-105"
        aria-label="First page"
      >
        <span className="sr-only">First page</span>
        <span aria-hidden="true">«</span>
      </button>
      <button
        onClick={() => paginate(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-105"
        aria-label="Previous page"
      >
        <span className="sr-only">Previous page</span>
        <span aria-hidden="true">‹</span>
      </button>

      <div className="flex items-center justify-center min-w-[120px] px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-md">
        <span className="font-semibold text-blue-600 dark:text-blue-400">{currentPage}</span>
        <span className="mx-2 text-gray-500 dark:text-gray-400">/</span>
        <span className="text-gray-600 dark:text-gray-300">{totalPages}</span>
      </div>

      <button
        onClick={() => paginate(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-105"
        aria-label="Next page"
      >
        <span className="sr-only">Next page</span>
        <span aria-hidden="true">›</span>
      </button>
      <button
        onClick={() => paginate(totalPages)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition transform hover:scale-105"
        aria-label="Last page"
      >
        <span className="sr-only">Last page</span>
        <span aria-hidden="true">»</span>
      </button>
    </div>
  )
})

