"use client"

import type React from "react"

import { memo } from "react"
import { getEmojiFlag } from "@/lib/utils"
import type { Proxy } from "@/types/proxy"

interface ProxyListItemsProps {
  currentProxies: Proxy[]
  activeTabIndex: number
  onTabSelect: (index: number, proxy: Proxy) => void // Ubah tipe fungsi ini
  indexOfFirstProxy: number
  checkingStatus: Record<string, boolean>
  proxyStatus: Record<
    string,
    {
      isActive: boolean
      latency: string
      error?: string
      lastChecked?: number
      history?: Array<{
        timestamp: number
        isActive: boolean
        latency: string
      }>
      method?: string
    }
  >
  checkProxyStatus: (proxy: Proxy, event?: React.MouseEvent) => void
  favoriteProxies: string[]
  toggleFavorite: (proxy: Proxy, event?: React.MouseEvent) => void
  advancedFilters: {
    status: string
    latency: string
    favorites: boolean
    lastChecked: string
  }
  hideNonActive: boolean
}

export const ProxyListItems = memo(function ProxyListItems({
  currentProxies,
  activeTabIndex,
  onTabSelect,
  indexOfFirstProxy,
  checkingStatus,
  proxyStatus,
  checkProxyStatus,
  favoriteProxies,
  toggleFavorite,
  advancedFilters,
  hideNonActive,
}: ProxyListItemsProps) {
  // Apply advanced filters
  const filteredProxies = currentProxies.filter((proxy) => {
    const proxyKey = `${proxy.proxyIP}:${proxy.proxyPort}`
    const status = proxyStatus[proxyKey]

    // Hide non-active proxies if the option is enabled
    if (hideNonActive && status && !status.isActive) {
      return false
    }

    // Filter by favorites
    if (advancedFilters.favorites && !favoriteProxies.includes(proxyKey)) {
      return false
    }

    // Filter by status
    if (advancedFilters.status !== "all") {
      if (advancedFilters.status === "active" && (!status || !status.isActive)) {
        return false
      }
      if (advancedFilters.status === "inactive" && (!status || status.isActive)) {
        return false
      }
      if (advancedFilters.status === "unchecked" && status) {
        return false
      }
    }

    // Filter by latency
    if (advancedFilters.latency !== "all" && status) {
      const latencyValue = status.latency
      if (latencyValue.includes("ms")) {
        const ms = Number.parseInt(latencyValue)
        if (advancedFilters.latency === "fast" && ms > 200) {
          return false
        }
        if (advancedFilters.latency === "medium" && (ms <= 200 || ms > 500)) {
          return false
        }
        if (advancedFilters.latency === "slow" && ms <= 500) {
          return false
        }
      } else if (advancedFilters.latency !== "slow") {
        // If latency is not in ms format and we're not looking for slow connections
        return false
      }
    }

    // Filter by last checked
    if (advancedFilters.lastChecked !== "all" && status) {
      const now = Date.now()
      const lastChecked = status.lastChecked || 0
      const hoursDiff = (now - lastChecked) / (1000 * 60 * 60)

      if (advancedFilters.lastChecked === "recent" && hoursDiff > 1) {
        return false
      }
      if (advancedFilters.lastChecked === "old" && hoursDiff <= 1) {
        return false
      }
    }

    return true
  })

  return (
    <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 relative z-10">
      {filteredProxies.length === 0 ? (
        <div className="text-center p-4 text-tech-muted animate-fadeInUp">No proxies match your current filters.</div>
      ) : (
        filteredProxies.map((proxy, index) => {
          const proxyKey = `${proxy.proxyIP}:${proxy.proxyPort}`
          const isChecking = checkingStatus[proxyKey]
          const status = proxyStatus[proxyKey]
          const statusChecked = proxyKey in proxyStatus
          const isFavorite = favoriteProxies.includes(proxyKey)

          return (
            <button
              key={proxyKey}
              onClick={() => {
                console.log("Selecting proxy:", proxy.proxyIP, proxy.proxyPort, "at index", indexOfFirstProxy + index)
                onTabSelect(indexOfFirstProxy + index, proxy)
              }}
              className={`w-full text-left py-1.5 px-2 sm:py-2 sm:px-3 flex items-center gap-2 sm:gap-3 transition-all duration-300 stagger-item animate-fadeInUp h-[60px] sm:h-[68px] ${
                activeTabIndex === indexOfFirstProxy + index ? "tech-tab active animate-glow" : "tech-tab"
              } ${isFavorite ? "border-l-4 border-yellow-400" : ""}`}
              data-country={proxy.country.toLowerCase()}
              data-proxy-ip={proxy.proxyIP}
              data-proxy-port={proxy.proxyPort}
            >
              <span className="text-lg sm:text-xl animate-pulse-soft">{getEmojiFlag(proxy.country)}</span>
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium text-xs sm:text-sm flex items-center">
                  {proxy.org}
                  {isFavorite && (
                    <span className="ml-1 text-yellow-500" title="Favorite">
                      ★
                    </span>
                  )}
                </div>
                <div className="text-xs text-tech-muted truncate">
                  {proxy.proxyIP}:{proxy.proxyPort}
                </div>
              </div>
              <div className="flex flex-col items-end justify-center status-transition h-full min-h-[36px]">
                {isChecking ? (
                  <div className="text-xs flex items-center text-tech-muted animate-fadeIn">
                    <div className="w-3 h-3 border-2 border-tech-accent border-t-transparent rounded-full animate-spin mr-1.5"></div>
                    <span>Checking</span>
                  </div>
                ) : statusChecked ? (
                  <div className="text-right animate-fadeIn">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-2 h-2 rounded-full ${status.isActive ? "bg-tech-success" : "bg-red-500"}`}
                      ></div>
                      <span className={`text-xs font-medium ${status.isActive ? "text-tech-success" : "text-red-500"}`}>
                        {status.isActive ? "ACTIVE" : "DEAD"}
                      </span>
                    </div>
                    {status.isActive && status.latency !== "Error" && status.latency !== "Unknown" && (
                      <span className="block text-xs text-tech-muted mt-0.5">{status.latency}</span>
                    )}
                    <div className="flex gap-2 mt-1.5">
                      <button
                        onClick={(e) => checkProxyStatus(proxy, e)}
                        className="text-xs text-tech-accent hover:underline"
                      >
                        Check
                      </button>
                      <button
                        onClick={(e) => toggleFavorite(proxy, e)}
                        className={`text-xs ${isFavorite ? "text-yellow-500" : "text-tech-muted"} hover:text-yellow-500`}
                        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        {isFavorite ? "★" : "☆"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-end">
                    <button
                      onClick={(e) => checkProxyStatus(proxy, e)}
                      className="text-xs text-tech-accent hover:underline"
                    >
                      Check Status
                    </button>
                    <button
                      onClick={(e) => toggleFavorite(proxy, e)}
                      className={`text-xs ${isFavorite ? "text-yellow-500" : "text-tech-muted"} hover:text-yellow-500 mt-1`}
                      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    >
                      {isFavorite ? "★" : "☆"}
                    </button>
                  </div>
                )}
              </div>
            </button>
          )
        })
      )}
    </div>
  )
})

