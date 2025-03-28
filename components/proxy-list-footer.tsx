"use client"

import { memo } from "react"
import { Pagination } from "@/components/pagination"

interface ProxyListFooterProps {
  totalProxies: number
  indexOfFirstProxy: number
  indexOfLastProxy: number
  currentPage: number
  totalPages: number
  paginate: (pageNumber: number) => void
}

export const ProxyListFooter = memo(function ProxyListFooter({
  totalProxies,
  indexOfFirstProxy,
  indexOfLastProxy,
  currentPage,
  totalPages,
  paginate,
}: ProxyListFooterProps) {
  if (totalProxies === 0) {
    return (
      <div className="text-center p-4 text-tech-muted animate-fadeInUp">No proxies found matching your search.</div>
    )
  }

  return (
    <>
      <Pagination currentPage={currentPage} totalPages={totalPages} paginate={paginate} />

      <div className="text-center text-sm mt-2 text-tech-muted animate-fadeInUp">
        Showing {indexOfFirstProxy + 1}-{Math.min(indexOfLastProxy, totalProxies)} of {totalProxies} proxies
      </div>
    </>
  )
})

