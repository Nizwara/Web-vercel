"use client"

import type React from "react"

import { memo, useState, useCallback, useEffect, useRef, useMemo } from "react"
import { ProxyListHeader } from "@/components/proxy-list-header"
import { ProxyListItems } from "@/components/proxy-list-items"
import { ProxyListFooter } from "@/components/proxy-list-footer"
import { getEmojiFlag } from "@/lib/utils"
import type { Proxy } from "@/types/proxy"
import { AdvancedFilters } from "@/components/advanced-filters"
import { TutorialOverlay } from "@/components/tutorial-overlay"
import { ExportImportPanel } from "@/components/export-import-panel"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { WelcomeModal } from "@/components/welcome-modal"

// Create a global variable to track checked proxies across renders
// This will persist even if the component re-renders
// Then replace the autoCheckEnabled state and the useEffect for auto-checking with this:

interface ProxyListProps {
  loading: boolean
  error: string | null
  searchQuery: string
  onSearch: (query: string) => void
  currentProxies: Proxy[]
  activeTabIndex: number
  onTabSelect: (index: number, proxy: Proxy) => void
  indexOfFirstProxy: number
  currentPage: number
  totalPages: number
  paginate: (pageNumber: number) => void
  proxiesPerPage: number
  onProxiesPerPageChange: (value: number) => void
  totalProxies: number
  indexOfLastProxy: number
  isMobileView: boolean
}

interface ProxyStatusData {
  isActive: boolean
  latency: string
  flag?: string
  org?: string
  error?: string
  method?: string
  lastChecked?: number
  history?: Array<{
    timestamp: number
    isActive: boolean
    latency: string
  }>
}

export const ProxyList = memo(function ProxyList({
  loading,
  error,
  searchQuery,
  onSearch,
  currentProxies,
  activeTabIndex,
  onTabSelect,
  indexOfFirstProxy,
  currentPage,
  totalPages,
  paginate,
  proxiesPerPage,
  onProxiesPerPageChange,
  totalProxies,
  indexOfLastProxy,
  isMobileView,
}: ProxyListProps) {
  // Add state to track active status of proxies
  const [proxyStatus, setProxyStatus] = useLocalStorage<Record<string, ProxyStatusData>>("proxy_status", {})
  const [checkingStatus, setCheckingStatus] = useState<Record<string, boolean>>({})
  const [favoriteProxies, setFavoriteProxies] = useLocalStorage<string[]>("favorite_proxies", [])
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [showExportImport, setShowExportImport] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState({
    status: "all", // "all", "active", "inactive", "unchecked"
    latency: "all", // "all", "fast", "medium", "slow"
    favorites: false,
    lastChecked: "all", // "all", "recent", "old"
  })
  // Add a new state variable for hiding non-active proxies after the other state declarations
  const [hideNonActive, setHideNonActive] = useState(false)
  const checkQueue = useRef<string[]>([])
  const isProcessingQueue = useRef(false)
  const isOnline = useOnlineStatus()
  const autoCheckSessionId = useRef<string | null>(null)
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(false)
  const [batchSize, setBatchSize] = useState(3)
  const autoCheckRef = useRef({
    enabled: false,
    checkedProxies: new Set<string>(),
    inProgress: false,
  })
  // Tambahkan state selectedProxy setelah state lainnya
  const [selectedProxy, setSelectedProxy] = useState<Proxy | null>(null)
  const [localActiveTabIndex, setLocalActiveTabIndex] = useState<number>(0)
  const [localViewingConfig, setLocalViewingConfig] = useState<boolean>(false)
  const [localViewingCustomSettings, setLocalViewingCustomSettings] = useState<boolean>(false)

  // Show welcome and tutorial for first-time users
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("has_seen_welcome")
    if (!hasSeenWelcome) {
      setShowWelcome(true)
    }
  }, [])

  // Pastikan filteredProxies tersedia di dalam komponen
  const filteredProxies = useMemo(() => {
    return currentProxies
  }, [currentProxies])

  // Sort proxies by country alphabetically
  const sortedProxies = useMemo(() => {
    return [...filteredProxies].sort((a, b) => {
      // Sort alphabetically by country
      return a.country.localeCompare(b.country)
    })
  }, [filteredProxies])

  // Function to show browser notifications
  const showNotification = useCallback((message: string) => {
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notification")
      return
    }

    if (Notification.permission === "granted") {
      new Notification("Inconigto VPN", { body: message })
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("Inconigto VPN", { body: message })
        }
      })
    }
  }, [])

  // Ubah fungsi checkSingleProxyStatus untuk menggunakan pendekatan yang lebih andal

  const checkSingleProxyStatus = useCallback(
    async (proxy: Proxy): Promise<ProxyStatusData> => {
      const proxyKey = `${proxy.proxyIP}:${proxy.proxyPort}`
      const existingStatus = proxyStatus[proxyKey] || { history: [] }

      if (!isOnline) {
        return {
          ...existingStatus,
          isActive: false,
          latency: "Offline Mode",
          lastChecked: Date.now(),
        }
      }

      try {
        // Gunakan metode yang lebih andal
        console.log(`Checking proxy ${proxyKey}...`)

        // Cek cache terlebih dahulu
        const cacheKey = `proxy_check_${proxyKey}`
        const cachedResult = sessionStorage.getItem(cacheKey)

        if (cachedResult) {
          const parsedCache = JSON.parse(cachedResult)
          // Gunakan cache hanya jika belum kedaluwarsa (5 menit)
          if (Date.now() - parsedCache.timestamp < 5 * 60 * 1000) {
            console.log(`Using cached result for ${proxyKey}`)
            return {
              isActive: parsedCache.isActive,
              latency: parsedCache.latency,
              flag: parsedCache.flag || getEmojiFlag(proxy.country),
              org: parsedCache.org || proxy.org,
              lastChecked: parsedCache.timestamp,
              method: parsedCache.method || "cache",
              history: [
                ...(existingStatus.history || []),
                {
                  timestamp: Date.now(),
                  isActive: parsedCache.isActive,
                  latency: parsedCache.latency,
                },
              ].slice(-10),
            }
          }
        }

        // Jika tidak ada cache atau sudah kedaluwarsa, gunakan API standar yang sudah terbukti berfungsi
        const response = await fetch(
          `/api/check-proxy?ip=${encodeURIComponent(proxy.proxyIP)}&port=${encodeURIComponent(proxy.proxyPort)}`,
        )

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }

        const data = await response.json()
        console.log(`Check result for ${proxyKey}: ${data.proxyip ? "active" : "inactive"}`)

        const newStatus = {
          isActive: data.proxyip === true,
          latency: data.latency || "Unknown",
          flag: data.flag || getEmojiFlag(proxy.country),
          org: data.org || proxy.org,
          method: "standard-api",
          lastChecked: Date.now(),
          history: [
            ...(existingStatus.history || []),
            {
              timestamp: Date.now(),
              isActive: data.proxyip === true,
              latency: data.latency || "Unknown",
            },
          ].slice(-10),
        }

        // Simpan hasil ke cache
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            isActive: newStatus.isActive,
            latency: newStatus.latency,
            flag: newStatus.flag,
            org: newStatus.org,
            method: newStatus.method,
            timestamp: newStatus.lastChecked,
          }),
        )

        // Show notification if it's a favorite proxy and status changed
        if (
          favoriteProxies.includes(proxyKey) &&
          existingStatus.isActive !== undefined &&
          existingStatus.isActive !== newStatus.isActive
        ) {
          showNotification(
            `Favorite proxy ${proxy.proxyIP}:${proxy.proxyPort} is now ${newStatus.isActive ? "ACTIVE" : "INACTIVE"}`,
          )
        }

        return newStatus
      } catch (error) {
        console.error("Error checking proxy status:", error)

        // Jika metode standar gagal, coba metode internal
        try {
          console.log(`Standard method failed for ${proxyKey}, trying internal...`)
          const fallbackResponse = await fetch(
            `/api/check-proxy-internal?ip=${encodeURIComponent(proxy.proxyIP)}&port=${encodeURIComponent(proxy.proxyPort)}`,
          )

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()

            return {
              isActive: fallbackData.proxyip === true,
              latency: fallbackData.latency || "Unknown",
              flag: getEmojiFlag(proxy.country),
              org: proxy.org,
              method: "internal-api",
              lastChecked: Date.now(),
              history: [
                ...(existingStatus.history || []),
                {
                  timestamp: Date.now(),
                  isActive: fallbackData.proxyip === true,
                  latency: fallbackData.latency || "Unknown",
                },
              ].slice(-10),
            }
          }
        } catch (fallbackError) {
          console.error("Internal method also failed:", fallbackError)
        }

        return {
          ...existingStatus,
          isActive: false,
          latency: "Error",
          error: error instanceof Error ? error.message : "Unknown error",
          flag: getEmojiFlag(proxy.country),
          org: proxy.org,
          method: "all-failed",
          lastChecked: Date.now(),
          history: [
            ...(existingStatus.history || []),
            {
              timestamp: Date.now(),
              isActive: false,
              latency: "Error",
            },
          ].slice(-10),
        }
      }
    },
    [proxyStatus, favoriteProxies, isOnline, showNotification],
  )

  // Function to process the queue of proxies to check
  const processQueue = useCallback(async () => {
    if (isProcessingQueue.current || checkQueue.current.length === 0) {
      return Promise.resolve() // Return a resolved promise if nothing to do
    }

    isProcessingQueue.current = true

    try {
      // Process up to the current batch size
      const batch = checkQueue.current.splice(0, batchSize)

      // Mark these proxies as being checked
      setCheckingStatus((prev) => {
        const newState = { ...prev }
        batch.forEach((key) => {
          newState[key] = true
        })
        return newState
      })

      // Find the proxy objects for these keys
      const proxiesToCheck = batch
        .map((key) => {
          const [ip, port] = key.split(":")
          return currentProxies.find((p) => p.proxyIP === ip && p.proxyPort === port)
        })
        .filter(Boolean) as Proxy[]

      // Check them in parallel
      const results = await Promise.all(proxiesToCheck.map((proxy) => checkSingleProxyStatus(proxy)))

      // Update the status for each proxy
      setProxyStatus((prev) => {
        const newState = { ...prev }
        proxiesToCheck.forEach((proxy, index) => {
          const key = `${proxy.proxyIP}:${proxy.proxyPort}`
          newState[key] = results[index]
        })
        return newState
      })

      // Mark these proxies as no longer being checked
      setCheckingStatus((prev) => {
        const newState = { ...prev }
        batch.forEach((key) => {
          newState[key] = false
        })
        return newState
      })

      // If there are more proxies in the queue, continue processing after a short delay
      if (checkQueue.current.length > 0) {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            isProcessingQueue.current = false
            processQueue().then(resolve)
          }, 500)
        })
      } else {
        isProcessingQueue.current = false
        return Promise.resolve()
      }
    } catch (error) {
      console.error("Error processing queue:", error)
      isProcessingQueue.current = false
      return Promise.reject(error)
    }
  }, [currentProxies, checkSingleProxyStatus, batchSize, setProxyStatus])

  // Fungsi untuk memeriksa semua proxy dalam daftar
  const checkAllProxies = useCallback(() => {
    // Tambahkan semua proxy yang belum diperiksa ke dalam queue
    const proxyKeys = sortedProxies.map((proxy) => `${proxy.proxyIP}:${proxy.proxyPort}`)

    // Filter hanya proxy yang belum diperiksa atau sedang diperiksa
    const proxiesToCheck = proxyKeys.filter((key) => !checkingStatus[key] && !checkQueue.current.includes(key))

    // Tambahkan ke queue
    checkQueue.current.push(...proxiesToCheck)

    // Mulai proses pemeriksaan jika belum berjalan
    if (!isProcessingQueue.current && checkQueue.current.length > 0) {
      processQueue()
    }
  }, [sortedProxies, checkingStatus, processQueue])

  // Function to manually check a proxy status
  const checkProxyStatus = useCallback(
    (proxy: Proxy, event?: React.MouseEvent) => {
      if (event) {
        event.stopPropagation() // Prevent triggering the proxy selection
      }

      const proxyKey = `${proxy.proxyIP}:${proxy.proxyPort}`

      if (checkingStatus[proxyKey]) return // Prevent duplicate requests

      // Add to queue if not already in it
      if (!checkQueue.current.includes(proxyKey)) {
        checkQueue.current.push(proxyKey)
        processQueue()
      }
    },
    [checkingStatus, processQueue],
  )

  // Auto-check visible proxies when they change - only if autoCheckEnabled is true
  // Toggle auto-check function with cycling batch sizes
  const toggleAutoCheck = useCallback(() => {
    if (!autoCheckEnabled) {
      // First click: Enable with batch size 3
      setAutoCheckEnabled(true)
      setBatchSize(3)

      // Reset the checked proxies set
      autoCheckRef.current = {
        enabled: true,
        checkedProxies: new Set<string>(),
        inProgress: false,
      }

      // Clear any existing queue
      checkQueue.current = []
      console.log("Auto-check enabled with fresh state")
    } else if (batchSize === 3) {
      // Second click: Change to batch size 5
      setBatchSize(5)
    } else if (batchSize === 5) {
      // Third click: Change to batch size 10
      setBatchSize(10)
    } else {
      // Fourth click: Disable auto-check
      setAutoCheckEnabled(false)
      setBatchSize(3) // Reset to default for next time

      // Reset the auto-check state
      autoCheckRef.current = {
        enabled: false,
        checkedProxies: new Set<string>(),
        inProgress: false,
      }

      // Clear the queue
      checkQueue.current = []
      console.log("Auto-check disabled, cleared state")
    }
  }, [autoCheckEnabled, batchSize])

  // Separate effect for auto-check to avoid re-running on every render
  useEffect(() => {
    // Skip if auto-check is disabled or we're offline
    if (!autoCheckEnabled || !isOnline) {
      return
    }

    console.log("Auto-check effect running")

    // Function to check the next batch of proxies
    const checkNextBatch = () => {
      // Skip if we're already processing or auto-check was disabled
      if (autoCheckRef.current.inProgress || !autoCheckRef.current.enabled) {
        return
      }

      // Find proxies that haven't been checked yet
      const proxiesToCheck = sortedProxies.filter((proxy) => {
        const proxyKey = `${proxy.proxyIP}:${proxy.proxyPort}`

        // Skip if already checked in this session
        if (autoCheckRef.current.checkedProxies.has(proxyKey)) {
          return false
        }

        // Skip if already being checked
        if (checkingStatus[proxyKey]) {
          return false
        }

        // Skip if already in queue
        if (checkQueue.current.includes(proxyKey)) {
          return false
        }

        return true
      })

      // If no proxies to check, we're done
      if (proxiesToCheck.length === 0) {
        console.log("No more proxies to check in this session")
        return
      }

      // Take only up to batchSize proxies
      const batch = proxiesToCheck.slice(0, batchSize)
      console.log(`Adding ${batch.length} proxies to check queue`)

      // Mark these as checked in our session
      batch.forEach((proxy) => {
        const proxyKey = `${proxy.proxyIP}:${proxy.proxyPort}`
        autoCheckRef.current.checkedProxies.add(proxyKey)
      })

      // Add to the check queue
      const proxyKeys = batch.map((proxy) => `${proxy.proxyIP}:${proxy.proxyPort}`)
      checkQueue.current.push(...proxyKeys)

      // Start processing
      autoCheckRef.current.inProgress = true

      // Process the queue
      processQueue().finally(() => {
        // Mark as no longer in progress
        autoCheckRef.current.inProgress = false

        // Schedule the next batch if auto-check is still enabled
        if (autoCheckRef.current.enabled) {
          setTimeout(checkNextBatch, 1000)
        }
      })
    }

    // Start checking
    checkNextBatch()

    // Cleanup function
    return () => {
      // This will run when the effect is cleaned up (component unmounts or dependencies change)
      console.log("Auto-check effect cleanup")
    }
  }, [autoCheckEnabled, isOnline, sortedProxies, batchSize, checkingStatus, processQueue])

  // Toggle favorite status for a proxy
  const toggleFavorite = useCallback(
    (proxy: Proxy, event?: React.MouseEvent) => {
      if (event) {
        event.stopPropagation()
      }

      const proxyKey = `${proxy.proxyIP}:${proxy.proxyPort}`

      setFavoriteProxies((prev) => {
        if (prev.includes(proxyKey)) {
          return prev.filter((key) => key !== proxyKey)
        } else {
          return [...prev, proxyKey]
        }
      })
    },
    [setFavoriteProxies],
  )

  // Apply advanced filters to proxies
  const applyAdvancedFilters = useCallback((filters: typeof advancedFilters) => {
    setAdvancedFilters(filters)
  }, [])

  // Export proxy configurations
  const exportConfigurations = useCallback(() => {
    const exportData = {
      proxyStatus,
      favoriteProxies,
      timestamp: Date.now(),
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `inconigto-vpn-config-${new Date().toISOString().slice(0, 10)}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }, [proxyStatus, favoriteProxies])

  // Import proxy configurations
  const importConfigurations = useCallback(
    (jsonData: string) => {
      try {
        const importedData = JSON.parse(jsonData)

        if (importedData.proxyStatus) {
          setProxyStatus(importedData.proxyStatus)
        }

        if (importedData.favoriteProxies) {
          setFavoriteProxies(importedData.favoriteProxies)
        }

        showNotification("Configuration imported successfully")
      } catch (error) {
        console.error("Error importing configuration:", error)
        showNotification("Error importing configuration")
      }
    },
    [setProxyStatus, setFavoriteProxies, showNotification],
  )

  // Handle welcome modal close
  const handleWelcomeClose = useCallback(() => {
    setShowWelcome(false)
    localStorage.setItem("has_seen_welcome", "true")
  }, [])

  // Handle showing tutorial from welcome modal
  const handleShowTutorialFromWelcome = useCallback(() => {
    setShowWelcome(false)
    setShowTutorial(true)
    localStorage.setItem("has_seen_welcome", "true")
  }, [])

  // Fungsi untuk menghapus cache pengecekan proxy
  const clearProxyCache = useCallback(() => {
    // Hapus semua item cache proxy dari sessionStorage
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith("proxy_check_")) {
        sessionStorage.removeItem(key)
      }
    })

    // Tampilkan notifikasi
    showNotification("Proxy check cache cleared")

    // Reset status pengecekan
    setCheckingStatus({})
  }, [showNotification])

  // Ubah fungsi handleTabSelect
  const handleTabSelect = useCallback(
    (index: number, proxy: Proxy) => {
      setLocalActiveTabIndex(index)
      setSelectedProxy(proxy) // Simpan proxy yang dipilih
      onTabSelect(index, proxy) // Panggil fungsi onTabSelect yang diterima dari props
      setLocalViewingConfig(true)
      setLocalViewingCustomSettings(false)

      // If in mobile view, scroll to the content area
      if (isMobileView) {
        const contentArea = document.getElementById("content-area")
        if (contentArea) {
          contentArea.scrollIntoView({ behavior: "smooth" })
        }
      }
    },
    [isMobileView, onTabSelect],
  )

  return (
    <div className="bg-tech-card p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 animate-fadeIn relative" style={{ zIndex: 1 }}>
      {/* Offline Mode Indicator */}
      {!isOnline && (
        <div className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 p-2 rounded-lg text-sm flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>Offline Mode - Using cached data</span>
        </div>
      )}

      {/* Header Component */}
      <ProxyListHeader
        searchQuery={searchQuery}
        onSearch={onSearch}
        proxiesPerPage={proxiesPerPage}
        onProxiesPerPageChange={onProxiesPerPageChange}
        autoCheckEnabled={autoCheckEnabled}
        batchSize={batchSize}
        toggleAutoCheck={toggleAutoCheck}
        onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
        onShowExportImport={() => setShowExportImport(!showExportImport)}
        onShowTutorial={() => setShowTutorial(true)}
        hideNonActive={hideNonActive}
        onToggleHideNonActive={() => setHideNonActive(!hideNonActive)}
        onClearCache={clearProxyCache}
      />

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <AdvancedFilters
          filters={advancedFilters}
          onApplyFilters={applyAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
        />
      )}

      {/* Export/Import Panel */}
      {showExportImport && (
        <ExportImportPanel
          onExport={exportConfigurations}
          onImport={importConfigurations}
          onClose={() => setShowExportImport(false)}
        />
      )}

      {/* Status Summary */}
      {!loading && !error && (
        <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-md rounded-lg p-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-tech-muted">Status:</span>
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-tech-success mr-1"></span>
              <span className="text-tech-success">
                {Object.values(proxyStatus).filter((status) => status.isActive).length} aktif
              </span>
            </div>
            <div className="flex items-center ml-3">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span>
              <span className="text-red-500">
                {Object.values(proxyStatus).filter((status) => !status.isActive).length} tidak aktif
              </span>
            </div>
            <div className="flex items-center ml-3">
              <span className="w-2 h-2 rounded-full bg-gray-400 mr-1"></span>
              <span className="text-tech-muted">{totalProxies - Object.keys(proxyStatus).length} belum diperiksa</span>
            </div>
            <div className="flex items-center ml-3">
              <span className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>
              <span className="text-yellow-600 dark:text-yellow-400">{favoriteProxies.length} favorit</span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-40 animate-scaleIn">
          <div className="w-16 h-16 border-4 border-tech-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 p-4 bg-tech-bg rounded-lg animate-fadeInUp">
          <p className="font-bold mb-2">Error loading proxies:</p>
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* Proxy List Items Component */}
          <div className="space-y-2 pr-1">
            <ProxyListItems
              currentProxies={sortedProxies}
              activeTabIndex={activeTabIndex}
              onTabSelect={onTabSelect}
              indexOfFirstProxy={indexOfFirstProxy}
              checkingStatus={checkingStatus}
              proxyStatus={proxyStatus}
              checkProxyStatus={checkProxyStatus}
              favoriteProxies={favoriteProxies}
              toggleFavorite={toggleFavorite}
              advancedFilters={advancedFilters}
              hideNonActive={hideNonActive}
            />
          </div>

          {/* Footer Component with Pagination */}
          <ProxyListFooter
            totalProxies={totalProxies}
            indexOfFirstProxy={indexOfFirstProxy}
            indexOfLastProxy={indexOfLastProxy}
            currentPage={currentPage}
            totalPages={totalPages}
            paginate={paginate}
          />
        </>
      )}
      {currentProxies.length === 0 && !loading && !error && (
        <div className="text-center p-4 text-tech-muted animate-fadeInUp">No proxies match your current filters.</div>
      )}

      {/* Welcome Modal */}
      {showWelcome && <WelcomeModal onClose={handleWelcomeClose} onShowTutorial={handleShowTutorialFromWelcome} />}

      {/* Tutorial Overlay */}
      {showTutorial && (
        <TutorialOverlay
          onClose={() => {
            setShowTutorial(false)
            localStorage.setItem("has_seen_tutorial", "true")
          }}
        />
      )}
    </div>
  )
})

