"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { ProxyList } from "@/components/proxy-list"
import { ProxyCard } from "@/components/proxy-card"
import { ErrorBoundary } from "@/components/error-boundary"
import type { Proxy } from "@/types/proxy"
import { getSettings, saveSettings } from "@/lib/settings-service"
import { useRouter } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"
import { FloatingThemeSelector } from "@/components/floating-theme-selector"
import { MouseParticles } from "@/components/mouse-particles"

export default function Home() {
  const [proxyList, setProxyList] = useState<Proxy[]>([])
  const [filteredProxies, setFilteredProxies] = useState<Proxy[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const [hostName, setHostName] = useState("")
  const [nameWEB, setNameWEB] = useState("Inconigto_Mode")
  const [telegram, setTelegram] = useState("Inconigto_Mode")
  const [pathinfo, setPathinfo] = useState("t.me/Inconigto_Mode") // Changed default path
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMobileView, setIsMobileView] = useState(false)
  // Add wildcard configuration states
  const [useWildcard, setUseWildcard] = useState(false)
  const [wildcardSubdomain, setWildcardSubdomain] = useState("")
  const [wildcardFullHost, setWildcardFullHost] = useState("")
  // Add a new state to track whether we're viewing a proxy configuration
  const [viewingConfig, setViewingConfig] = useState(false)
  // Add state for loading settings
  const [loadingSettings, setLoadingSettings] = useState(true)

  // Add these new state variables for the quick settings
  const [availableHostNames, setAvailableHostNames] = useState<string[]>([])
  const [availableBugServers, setAvailableBugServers] = useState<string[]>([])
  const [quickSettingsSaved, setQuickSettingsSaved] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [proxiesPerPage, setProxiesPerPage] = useState(10)

  // Add a new state variable to track when settings have been updated
  const [settingsUpdated, setSettingsUpdated] = useState(false)

  // Add the new state variables for server type and SSL servers
  const [serverType, setServerType] = useState("WS")
  const [availableSslServers, setAvailableSslServers] = useState<string[]>([])

  // Check for mobile view
  const [showQrisModal, setShowQrisModal] = useState(false)

  // Add the router here
  const router = useRouter()

  // Add state to track if we're viewing custom settings
  const [viewingCustomSettings, setViewingCustomSettings] = useState(false)

  // Add state for active proxy
  const [activeProxy, setActiveProxy] = useState<Proxy | null>(null)

  useEffect(() => {
    // Tambahkan log untuk memeriksa nilai SSL servers dan server type
    console.log("Available SSL Servers:", availableSslServers)
    console.log("Current Server Type:", serverType)
  }, [availableSslServers, serverType])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  // Update the useEffect that loads settings to include the new properties
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoadingSettings(true)
        const settings = await getSettings()

        // Update state with loaded settings
        setHostName(settings.defaultHostname || "")
        setPathinfo(settings.defaultPathInfo || "t.me/Inconigto_Mode")
        setNameWEB(settings.defaultNameWEB || "Inconigto_Mode")
        setTelegram(settings.defaultTelegram || "Inconigto_Mode")
        setAvailableHostNames(settings.hostnames || [])
        setAvailableBugServers(settings.bugServers || [])

        // Add these lines to load the new settings
        setServerType(settings.defaultServerType || "WS")

        // Pastikan availableSslServers selalu memiliki nilai default
        const sslServers = settings.sslServers || []
        if (sslServers.length === 0) {
          sslServers.push("inconigto.biz.id") // Tambahkan default SSL server
        }
        setAvailableSslServers(sslServers)
        console.log("SSL Servers loaded:", sslServers)

        // Set default wildcard subdomain if bug servers exist
        if (settings.bugServers && settings.bugServers.length > 0) {
          setWildcardSubdomain(settings.bugServers[0])
        }
      } catch (error) {
        console.error("Error loading settings:", error)
        setError("Failed to load settings. Using default values.")

        // Set default SSL server even if settings fail to load
        setAvailableSslServers(["inconigto.biz.id"])
      } finally {
        setLoadingSettings(false)
      }
    }

    loadSettings()
  }, [])

  // Fetch proxy list from the provided URL
  useEffect(() => {
    const fetchProxyList = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          "https://raw.githubusercontent.com/InconigtoVPN/ProxyIP/refs/heads/main/proxyList.txt",
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch proxy list: ${response.status} ${response.statusText}`)
        }

        const text = await response.text()

        // Parse the text into proxy objects
        const proxies: Proxy[] = text
          .split("\n")
          .filter((line) => line.trim() !== "")
          .map((line) => {
            const [proxyIP, proxyPort, country, ...orgParts] = line.split(",")
            return {
              proxyIP: proxyIP?.trim() || "",
              proxyPort: proxyPort?.trim() || "",
              country: country?.trim() || "",
              org: orgParts.join(",").trim() || "Unknown",
            }
          })
          .filter((proxy) => proxy.proxyIP && proxy.proxyPort && proxy.country) // Filter out invalid entries

        // Filter out duplicates based on IP:PORT combination
        const uniqueProxies = removeDuplicateProxies(proxies)

        setProxyList(uniqueProxies)
        setFilteredProxies(uniqueProxies)
      } catch (error) {
        console.error("Error fetching proxy list:", error)
        setError(error instanceof Error ? error.message : "Failed to load proxy list")
      } finally {
        setLoading(false)
      }
    }

    fetchProxyList()
    // Don't set hostname from window.location
  }, [])

  // Function to remove duplicate proxies based on IP:PORT combination
  const removeDuplicateProxies = (proxies: Proxy[]): Proxy[] => {
    const uniqueProxies: Proxy[] = []
    const seenCombinations = new Set<string>()

    for (const proxy of proxies) {
      const combination = `${proxy.proxyIP}:${proxy.proxyPort}`

      if (!seenCombinations.has(combination)) {
        seenCombinations.add(combination)
        uniqueProxies.push(proxy)
      }
    }

    return uniqueProxies
  }

  // Memoize the search handler to prevent unnecessary re-renders
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
      setCurrentPage(1) // Reset to first page when searching

      const filtered = proxyList.filter(
        (proxy) =>
          proxy.country.toLowerCase().includes(query.toLowerCase()) ||
          proxy.org.toLowerCase().includes(query.toLowerCase()),
      )

      setFilteredProxies(filtered)
    },
    [proxyList],
  )

  // Memoize pagination calculations
  const paginationData = useMemo(() => {
    // Sort the filtered proxies by country alphabetically
    const sortedFilteredProxies = [...filteredProxies].sort((a, b) => a.country.localeCompare(b.country))

    const indexOfLastProxy = currentPage * proxiesPerPage
    const indexOfFirstProxy = indexOfLastProxy - proxiesPerPage
    const currentProxies = sortedFilteredProxies.slice(indexOfFirstProxy, indexOfLastProxy)
    const totalPages = Math.ceil(sortedFilteredProxies.length / proxiesPerPage)

    return {
      indexOfFirstProxy,
      indexOfLastProxy,
      currentProxies,
      totalPages,
    }
  }, [filteredProxies, currentPage, proxiesPerPage])

  // Memoize the pagination handler
  const paginate = useCallback(
    (pageNumber: number) => {
      if (pageNumber > 0 && pageNumber <= paginationData.totalPages) {
        setCurrentPage(pageNumber)
        // Reset active tab to first item on the new page
        setActiveTabIndex(paginationData.indexOfFirstProxy)
      }
    },
    [paginationData.totalPages, paginationData.indexOfFirstProxy],
  )

  // Handle proxies per page change
  const handleProxiesPerPageChange = useCallback((value: number) => {
    setProxiesPerPage(value)
    setCurrentPage(1) // Reset to first page when changing items per page
  }, [])

  // Perbarui handleTabSelect untuk menyimpan proxy yang dipilih
  const handleTabSelect = useCallback(
    (index: number, proxy: Proxy) => {
      console.log("Selected proxy:", proxy.proxyIP, proxy.proxyPort, "at index", index)
      setActiveTabIndex(index)
      setActiveProxy(proxy) // Simpan proxy yang dipilih
      setViewingConfig(true)
      setViewingCustomSettings(false)

      // If in mobile view, scroll to the content area
      if (isMobileView) {
        const contentArea = document.getElementById("content-area")
        if (contentArea) {
          contentArea.scrollIntoView({ behavior: "smooth" })
        }
      }
    },
    [isMobileView],
  )

  // Update the handleBackToList function to reload settings when coming back from custom settings
  const handleBackToList = useCallback(() => {
    setViewingConfig(false)

    // If coming back from custom settings, reload the settings
    if (viewingCustomSettings) {
      setSettingsUpdated(true)
    }
  }, [viewingCustomSettings])

  // Add a function to handle saving custom configuration
  const handleSaveCustomConfig = useCallback(
    (config: {
      hostName: string
      pathinfo: string
      nameWEB: string
      telegram: string
      useWildcard: boolean
      wildcardSubdomain: string
      wildcardFullHost: string
      serverType?: string
    }) => {
      setHostName(config.hostName)
      setPathinfo(config.pathinfo)
      setNameWEB(config.nameWEB)
      setTelegram(config.telegram)
      setUseWildcard(config.useWildcard)
      setWildcardSubdomain(config.wildcardSubdomain)
      setWildcardFullHost(config.wildcardFullHost)
      if (config.serverType) {
        setServerType(config.serverType)
      }

      // Save settings to KV database
      saveSettings({
        hostnames: availableHostNames,
        bugServers: availableBugServers,
        sslServers: availableSslServers,
        defaultHostname: config.hostName,
        defaultPathInfo: config.pathinfo,
        defaultNameWEB: config.nameWEB,
        defaultTelegram: config.telegram,
        defaultServerType: config.serverType || serverType,
        lastUpdated: new Date().toISOString(),
      }).catch((error) => {
        console.error("Error saving settings:", error)
      })
    },
    [availableHostNames, availableBugServers, availableSslServers, serverType],
  )

  // Add a new function to handle settings changes from the ProxyCard
  const handleProxyCardSettingsChange = useCallback(
    (settings: {
      hostName: string
      useWildcard: boolean
      wildcardSubdomain: string
      wildcardFullHost: string
      serverType?: string
    }) => {
      setHostName(settings.hostName)
      setUseWildcard(settings.useWildcard)
      setWildcardSubdomain(settings.wildcardSubdomain)
      setWildcardFullHost(settings.wildcardFullHost)
      if (settings.serverType) {
        setServerType(settings.serverType)
      }

      // Save settings to KV database
      saveSettings({
        hostnames: availableHostNames,
        bugServers: availableBugServers,
        sslServers: availableSslServers,
        defaultHostname: settings.hostName,
        defaultPathInfo: pathinfo,
        defaultNameWEB: nameWEB,
        defaultTelegram: telegram,
        defaultServerType: settings.serverType || serverType,
        lastUpdated: new Date().toISOString(),
      }).catch((error) => {
        console.error("Error saving settings:", error)
      })
    },
    [availableHostNames, availableBugServers, availableSslServers, pathinfo, nameWEB, telegram, serverType],
  )

  // Add a function to handle navigation between proxies
  // Perbarui handleNavigateProxy untuk menggunakan indeks dari filteredProxies yang diurutkan
  const handleNavigateProxy = useCallback(
    (direction: "prev" | "next") => {
      // Urutkan proxies seperti yang ditampilkan di daftar
      const sortedProxies = [...filteredProxies].sort((a, b) => a.country.localeCompare(b.country))

      // Temukan indeks proxy aktif saat ini
      const currentIndex = activeProxy
        ? sortedProxies.findIndex((p) => p.proxyIP === activeProxy.proxyIP && p.proxyPort === activeProxy.proxyPort)
        : -1

      console.log("Current proxy index:", currentIndex, "of", sortedProxies.length)

      if (currentIndex === -1) return

      let newIndex = currentIndex

      if (direction === "prev") {
        newIndex = currentIndex > 0 ? currentIndex - 1 : sortedProxies.length - 1
      } else {
        newIndex = currentIndex < sortedProxies.length - 1 ? currentIndex + 1 : 0
      }

      console.log("Navigating to proxy index:", newIndex)

      // Set proxy aktif yang baru
      const newProxy = sortedProxies[newIndex]
      setActiveProxy(newProxy)

      // Update activeTabIndex juga untuk konsistensi
      const globalIndex = filteredProxies.findIndex(
        (p) => p.proxyIP === newProxy.proxyIP && p.proxyPort === newProxy.proxyPort,
      )
      if (globalIndex !== -1) {
        setActiveTabIndex(globalIndex)
      }
    },
    [filteredProxies, activeProxy],
  )

  // Get the active proxy
  // Perbarui hasNext untuk menggunakan indeks dari filteredProxies yang diurutkan
  const hasNext = useMemo(() => {
    if (!activeProxy) return false

    const sortedProxies = [...filteredProxies].sort((a, b) => a.country.localeCompare(b.country))
    const currentIndex = sortedProxies.findIndex(
      (p) => p.proxyIP === activeProxy.proxyIP && p.proxyPort === activeProxy.proxyPort,
    )

    // Selalu true karena kita ingin bisa menavigasi melingkar
    return true
  }, [filteredProxies, activeProxy])

  // Tambahkan hasPrev untuk konsistensi
  const hasPrev = useMemo(() => {
    // Selalu true karena kita ingin bisa menavigasi melingkar
    return activeProxy !== null
  }, [activeProxy])

  function getEmojiFlag(countryCode: string) {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
  }

  // Define available hostnames and bug servers
  const hostNames = useMemo(
    () => ["sni.inconigto.me", "sni.inconigto.eu.org", "sni.inconigto.cf", "sni.inconigto.ga", "sni.inconigto.ml"],
    [],
  )
  const bugServers = useMemo(
    () => ["bug.inconigto.me", "bug.inconigto.eu.org", "bug.inconigto.cf", "bug.inconigto.ga", "bug.inconigto.ml"],
    [],
  )

  // Add this function to handle saving quick settings
  const handleSaveQuickSettings = useCallback(async () => {
    try {
      // Update the wildcard full host if using wildcard
      if (useWildcard && wildcardSubdomain) {
        setWildcardFullHost(`${wildcardSubdomain}.${hostName}`)
      }

      // Show a success message
      setQuickSettingsSaved(true)

      // Save settings to KV database
      const settings = await getSettings()
      const updatedSettings = {
        ...settings,
        defaultHostname: hostName,
        defaultPathInfo: pathinfo,
        defaultNameWEB: nameWEB,
        defaultTelegram: telegram,
        lastUpdated: new Date().toISOString(),
      }

      await saveSettings(updatedSettings)

      // Hide success message after a delay
      setTimeout(() => {
        setQuickSettingsSaved(false)
      }, 2000)
    } catch (error) {
      console.error("Error saving quick settings:", error)
    }
  }, [hostName, pathinfo, nameWEB, telegram, useWildcard, wildcardSubdomain])

  // Add a useEffect to reload settings when settingsUpdated is true
  useEffect(() => {
    if (settingsUpdated) {
      const reloadSettings = async () => {
        try {
          console.log("Reloading settings after custom configuration update...")
          const settings = await getSettings()

          // Update state with reloaded settings
          setHostName(settings.defaultHostname || hostName)
          setPathinfo(settings.defaultPathInfo || pathinfo)
          setNameWEB(settings.defaultNameWEB || nameWEB)
          setTelegram(settings.defaultTelegram || telegram)

          // Update the hostnames and bug servers lists
          setAvailableHostNames(settings.hostnames || [])
          setAvailableBugServers(settings.bugServers || [])

          console.log("Settings reloaded successfully:", settings)
        } catch (error) {
          console.error("Error reloading settings:", error)
        } finally {
          setSettingsUpdated(false)
        }
      }

      reloadSettings()
    }
  }, [settingsUpdated, hostName, pathinfo, nameWEB, telegram])

  // Show loading state while settings are being loaded
  if (loadingSettings) {
    return (
      <main className="min-h-screen bg-tech-bg tech-bg-pattern flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-tech-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-medium text-tech-text">Loading settings...</p>
        </div>
      </main>
    )
  }

  // Update the return statement to conditionally render either the list or the configuration
  return (
    <main className="min-h-screen bg-tech-bg tech-bg-pattern flex flex-col">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 flex flex-col flex-grow">
        <div className="w-full max-w-6xl mx-auto rounded-xl overflow-hidden animate-fadeIn glass-container flex flex-col">
          {/* Header - Selalu di atas */}
          <div className="bg-gradient-to-r from-tech-accent/80 to-tech-highlight/80 dark:from-tech-accent/80 dark:to-tech-highlight/80 backdrop-blur-md p-3 sm:p-4 border-b border-white/30 dark:border-white/10 rounded-t-xl shadow-lg">
            <div className="flex justify-between items-center">
              {/* Logo dan Judul */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white/20 dark:bg-gray-900/20 flex items-center justify-center shadow-inner animate-float">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-6 h-6 text-white dark:text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <path d="M12 8v4"></path>
                    <path d="M12 16h.01"></path>
                  </svg>
                </div>
                <div>
                  <h1 className="text-center text-lg sm:text-xl md:text-2xl font-bold text-white dark:text-white drop-shadow-md">
                    <span className="animate-pulse-glow">INCONIGTO</span>
                    <span className="text-yellow-200 dark:text-white ml-1 animate-pulse-soft">MODE</span>
                  </h1>
                  <div className="text-xs text-white/70 dark:text-white/70 hidden sm:block">
                    Secure VPN Configuration Generator
                  </div>
                </div>
              </div>

              {/* Tombol-tombol di header */}
              <div className="flex items-center space-x-2">
                {/* Mode Toggle Button */}
                <ModeToggle />
              </div>
            </div>

            {/* Status Bar - Dengan tombol yang dipindahkan ke sini */}
            <div className="mt-2 pt-2 border-t border-white/20 dark:border-gray-700/20 flex justify-between items-center text-xs text-white/70 dark:text-white/70">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse mr-2"></div>
                <span>Online</span>

                <div className="border-r border-white/20 dark:border-gray-700/20 h-4 mx-2"></div>

                {/* QRIS Payment Button */}
                <button
                  onClick={() => setShowQrisModal(true)}
                  className="relative group p-1 bg-white/20 dark:bg-gray-900/20 rounded-full hover:bg-white/30 dark:hover:bg-gray-900/30 transition-all duration-300"
                  aria-label="Support via QRIS"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 text-white dark:text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                    <circle cx="12" cy="12" r="2"></circle>
                    <path d="M6 12h.01M18 12h.01"></path>
                  </svg>
                  <span className="absolute -top-1 -right-1 w-1 h-1 bg-green-400 rounded-full animate-pulse"></span>
                </button>

                {/* Settings Button */}
                <button
                  onClick={() => router.push("/settings")}
                  className="relative group p-1 bg-white/20 dark:bg-gray-900/20 rounded-full hover:bg-white/30 dark:hover:bg-gray-900/30 transition-all duration-300"
                  aria-label="Advanced Settings"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 text-white dark:text-white animate-spin-slow"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                </button>

                {/* Telegram Link */}
                <a
                  href={`https://t.me/${telegram}`}
                  className="relative group p-1 bg-white/20 dark:bg-gray-900/20 rounded-full hover:bg-white/30 dark:hover:bg-gray-900/30 transition-all duration-300"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Telegram @${telegram}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-3 h-3 text-white dark:text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21.73 2.27a2 2 0 0 0-2.83 0L2.27 18.9a2 2 0 0 0 0 2.83 2 2 0 0 0 2.83 0L21.73 5.1a2 2 0 0 0 0-2.83z"></path>
                    <path d="M8.7 13.3a1 1 0 0 0-1.4 1.4l3 3a1 1 0 0 0 1.4 0l3-3a1 1 0 0 0-1.4-1.4L12 14.58l-3.3-3.3z"></path>
                  </svg>
                </a>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="hidden sm:flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content area */}
          <div id="content-area" className="bg-white/20 dark:bg-gray-900/20 backdrop-blur-md flex-grow relative z-5">
            <ErrorBoundary
              fallback={<div className="p-4 text-red-500">An error occurred. Please try again later.</div>}
            >
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-tech-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xl font-medium text-tech-text">Loading proxy configurations...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-center text-red-500">
                    <p className="text-xl mb-4 font-bold">Error loading proxy list</p>
                    <p>{error}</p>
                  </div>
                </div>
              ) : viewingConfig && activeProxy ? (
                <div className="animate-fadeIn">
                  <div className="p-3 sm:p-4 flex justify-between items-center border-b border-white/20 dark:border-gray-700/20">
                    <button
                      onClick={handleBackToList}
                      className="tech-button flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2"
                    >
                      <span>←</span> Back to List
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleNavigateProxy("prev")}
                        className="tech-button flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2"
                        disabled={!hasPrev}
                      >
                        <span>←</span> Prev
                      </button>
                      <button
                        onClick={() => handleNavigateProxy("next")}
                        className="tech-button flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2"
                        disabled={!hasNext}
                      >
                        Next <span>→</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 relative z-20">
                    <ProxyCard
                      proxy={activeProxy}
                      hostName={hostName}
                      nameWEB={nameWEB}
                      pathinfo={pathinfo}
                      useWildcard={useWildcard}
                      wildcardSubdomain={wildcardSubdomain}
                      wildcardFullHost={wildcardFullHost}
                      availableHostNames={availableHostNames}
                      availableBugServers={availableBugServers}
                      availableSslServers={availableSslServers}
                      serverType={serverType}
                      onSettingsChange={handleProxyCardSettingsChange}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <ProxyList
                    loading={loading}
                    error={error}
                    searchQuery={searchQuery}
                    onSearch={handleSearch}
                    currentProxies={paginationData.currentProxies}
                    activeTabIndex={activeTabIndex}
                    onTabSelect={handleTabSelect}
                    indexOfFirstProxy={paginationData.indexOfFirstProxy}
                    currentPage={currentPage}
                    totalPages={paginationData.totalPages}
                    paginate={paginate}
                    proxiesPerPage={proxiesPerPage}
                    onProxiesPerPageChange={handleProxiesPerPageChange}
                    totalProxies={filteredProxies.length}
                    indexOfLastProxy={paginationData.indexOfLastProxy}
                    isMobileView={isMobileView}
                  />
                </div>
              )}
            </ErrorBoundary>
          </div>
        </div>
      </div>

      {/* Mode Toggle Button */}
      {/* <ModeToggle /> */}

      {/* Floating Theme Selector */}
      <FloatingThemeSelector />

      {/* QRIS Payment Modal */}
      {showQrisModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-2xl max-w-md w-full mx-4">
            <div className="p-4 bg-gradient-to-r from-tech-accent to-tech-highlight text-white flex justify-between items-center">
              <h3 className="text-lg font-bold">Support via QRIS</h3>
              <button
                onClick={() => setShowQrisModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="p-6 flex flex-col items-center">
              <div className="mb-4 text-center">
                <p className="text-tech-text dark:text-gray-300 mb-2">Scan this QR code to support our work</p>
                <p className="text-tech-muted text-sm">Your contribution helps us maintain and improve our services</p>
              </div>

              {/* QR Code Image */}
              <div className="bg-white p-3 rounded-lg shadow-md mb-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-tech-accent/10 to-tech-highlight/10 animate-gradient-x"></div>
                <img
                  src="/images/qris.png"
                  alt="QRIS Payment Code"
                  className="w-64 h-64 object-contain relative z-10"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg?height=250&width=250"
                    e.currentTarget.alt = "QR Code not available"
                  }}
                />
              </div>

              <div className="text-center text-tech-muted text-sm">
                <p>QRIS supports payments from:</p>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">DANA</span>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">GoPay</span>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">OVO</span>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">LinkAja</span>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">ShopeePay</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 text-center">
              <button onClick={() => setShowQrisModal(false)} className="tech-button px-6 py-2">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Mouse Particles Effect */}
      <MouseParticles />
    </main>
  )
}

