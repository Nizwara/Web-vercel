"use client"

import type React from "react"

import { memo, useCallback, useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"
import { getEmojiFlag } from "@/lib/utils"
import type { Proxy } from "@/types/proxy"
import { generateConfigs } from "@/lib/config-generator"
import { Label } from "@/components/ui/label"
import { ProxyHistory } from "@/components/proxy-history"
import { useLocalStorage } from "@/hooks/use-local-storage"

// Update the ProxyCardProps interface to include the new serverType and sslServers props
interface ProxyCardProps {
  proxy: Proxy
  hostName: string
  nameWEB: string
  pathinfo: string
  useWildcard?: boolean
  wildcardSubdomain?: string
  wildcardFullHost?: string
  availableHostNames: string[]
  availableBugServers: string[]
  availableSslServers?: string[]
  serverType?: string
  onSettingsChange: (settings: {
    hostName: string
    useWildcard: boolean
    wildcardSubdomain: string
    wildcardFullHost: string
    serverType?: string
  }) => void
  proxyStatus?: {
    isActive: boolean
    latency: string
    error?: string
    lastChecked?: number
    history?: Array<{
      timestamp: number
      isActive: boolean
      latency: string
    }>
  }
  checkProxyStatus?: (proxy: Proxy) => void
  isFavorite?: boolean
  toggleFavorite?: (proxy: Proxy) => void
}

// Update the component to destructure the new props with default values
export const ProxyCard = memo(function ProxyCard({
  proxy,
  hostName,
  nameWEB,
  pathinfo,
  useWildcard = false,
  wildcardSubdomain = "",
  wildcardFullHost = "",
  availableHostNames = [],
  availableBugServers = [],
  availableSslServers = [],
  serverType = "WS",
  onSettingsChange,
  proxyStatus,
  checkProxyStatus,
  isFavorite = false,
  toggleFavorite,
}: ProxyCardProps) {
  const { proxyIP, proxyPort, country, org } = proxy
  const [localHostName, setLocalHostName] = useState(hostName)
  const [localUseWildcard, setLocalUseWildcard] = useState(useWildcard)
  const [localWildcardSubdomain, setLocalWildcardSubdomain] = useState(wildcardSubdomain)
  const [localWildcardFullHost, setLocalWildcardFullHost] = useState(wildcardFullHost)
  const [localServerType, setLocalServerType] = useState(serverType)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [favoriteProxies, setFavoriteProxies] = useLocalStorage<string[]>("favorite_proxies", [])
  // Add a new state for bug server mode
  const [bugServerMode, setBugServerMode] = useState<"regular" | "wildcard">("wildcard")

  // Add these new state variables after the existing useState declarations
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [localProxyStatus, setLocalProxyStatus] = useState(proxyStatus)
  const [useBugServer, setUseBugServer] = useState(false)

  // Tambahkan state baru untuk mengelola input manual dan mode custom:
  const [isCustomBugServer, setIsCustomBugServer] = useState(false)
  const [customBugServer, setCustomBugServer] = useState("")
  const [localWildcardWs, setLocalWildcardWs] = useState(false)
  const [localWildcardSsl, setLocalWildcardSsl] = useState(false)

  // Tambahkan useEffect ini setelah deklarasi state dan sebelum fungsi checkStatus
  // Ubah fungsi checkStatus menjadi useCallback dengan dependensi yang benar
  const checkStatus = useCallback(async () => {
    if (checkProxyStatus) {
      checkProxyStatus(proxy)
    } else {
      try {
        setCheckingStatus(true)

        // Gunakan API server sebagai metode utama
        const response = await fetch(
          `/api/check-proxy?ip=${encodeURIComponent(proxy.proxyIP)}&port=${encodeURIComponent(proxy.proxyPort)}`,
        )

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }

        const data = await response.json()

        setLocalProxyStatus({
          isActive: data.proxyip === true,
          latency: data.latency || "Unknown",
          lastChecked: Date.now(),
          history: [
            ...(localProxyStatus?.history || []),
            {
              timestamp: Date.now(),
              isActive: data.proxyip === true,
              latency: data.latency || "Unknown",
            },
          ].slice(-10), // Keep only the last 10 history entries
        })
      } catch (error) {
        console.error("Error checking proxy status:", error)

        // Coba metode fallback
        try {
          const fallbackResponse = await fetch(
            `/api/check-proxy-internal?ip=${encodeURIComponent(proxy.proxyIP)}&port=${encodeURIComponent(proxy.proxyPort)}`,
          )

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()

            setLocalProxyStatus({
              isActive: fallbackData.proxyip === true,
              latency: fallbackData.latency || "Unknown",
              lastChecked: Date.now(),
              history: [
                ...(localProxyStatus?.history || []),
                {
                  timestamp: Date.now(),
                  isActive: fallbackData.proxyip === true,
                  latency: fallbackData.latency || "Unknown",
                },
              ].slice(-10),
            })

            setCheckingStatus(false)
            return
          }
        } catch (fallbackError) {
          console.error("Fallback method also failed:", fallbackError)
        }

        setLocalProxyStatus({
          isActive: false,
          latency: "Error",
          error: error instanceof Error ? error.message : "Unknown error",
          lastChecked: Date.now(),
          history: [
            ...(localProxyStatus?.history || []),
            {
              timestamp: Date.now(),
              isActive: false,
              latency: "Error",
            },
          ].slice(-10),
        })
      } finally {
        setCheckingStatus(false)
      }
    }
  }, [proxy, localProxyStatus, checkProxyStatus])

  // Kemudian perbarui useEffect untuk menggunakan checkStatus dengan dependensi yang benar
  useEffect(() => {
    // Periksa status secara otomatis jika belum ada status
    if (!localProxyStatus && !checkingStatus) {
      checkStatus()
    }
  }, [localProxyStatus, checkingStatus, checkStatus])

  // Update local state when props change
  useEffect(() => {
    setLocalHostName(hostName)
    setLocalUseWildcard(useWildcard)
    setLocalWildcardSubdomain(wildcardSubdomain)
    setLocalWildcardFullHost(wildcardFullHost)
    setLocalServerType(serverType)
    setLocalProxyStatus(proxyStatus)
    // Set useBugServer based on whether wildcardSubdomain is different from hostName
    setUseBugServer(wildcardSubdomain !== "" && wildcardSubdomain !== hostName)
  }, [hostName, useWildcard, wildcardSubdomain, wildcardFullHost, serverType, proxyStatus])

  // Handle hostname change
  const handleHostNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHostNameValue = e.target.value
    setLocalHostName(newHostNameValue)

    // Update wildcard full host if using wildcard
    const updatedWildcardFullHost =
      localUseWildcard && localWildcardSubdomain
        ? `${localWildcardSubdomain}.${newHostNameValue}`
        : localWildcardFullHost

    if (localUseWildcard && localWildcardSubdomain) {
      setLocalWildcardFullHost(updatedWildcardFullHost)
    }

    // Automatically save settings
    onSettingsChange({
      hostName: newHostNameValue,
      useWildcard: localUseWildcard,
      wildcardSubdomain: localWildcardSubdomain,
      wildcardFullHost: updatedWildcardFullHost,
      serverType: localServerType,
    })

    // Show saved indicator briefly
    showNotification("Settings saved successfully!")
  }

  // Handle bug server checkbox change
  const handleUseBugServerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUseBugServer = e.target.checked
    setUseBugServer(newUseBugServer)

    // If turning off bug server, also turn off wildcard
    if (!newUseBugServer) {
      setLocalUseWildcard(false)
    }

    // Automatically save settings
    onSettingsChange({
      hostName: localHostName,
      useWildcard: false, // Reset to false when toggling bug server
      wildcardSubdomain: newUseBugServer ? localWildcardSubdomain : "",
      wildcardFullHost: "",
      serverType: "WS", // Default to WS when toggling bug server
    })

    // Show saved indicator briefly
    showNotification("Settings saved successfully!")
  }

  // Handle wildcard checkbox change
  const handleUseWildcardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const useWildcard = e.target.checked
    setLocalUseWildcard(useWildcard)

    // Update wildcard full host if using wildcard
    const updatedWildcardFullHost =
      useWildcard && localWildcardSubdomain ? `${localWildcardSubdomain}.${localHostName}` : localWildcardFullHost

    if (useWildcard && localWildcardSubdomain) {
      setLocalWildcardFullHost(updatedWildcardFullHost)
    }

    // Automatically save settings
    onSettingsChange({
      hostName: localHostName,
      useWildcard: useWildcard,
      wildcardSubdomain: localWildcardSubdomain,
      wildcardFullHost: updatedWildcardFullHost,
      serverType: localServerType,
    })

    // Show saved indicator briefly
    showNotification("Settings saved successfully!")
  }

  // Handle bug server mode change
  const handleBugServerModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mode = e.target.value as "regular" | "wildcard"
    setBugServerMode(mode)

    // Update wildcard setting based on mode
    const newUseWildcard = mode === "wildcard"
    setLocalUseWildcard(newUseWildcard)

    // Update wildcard full host if using wildcard
    const updatedWildcardFullHost =
      newUseWildcard && localWildcardSubdomain ? `${localWildcardSubdomain}.${localHostName}` : localWildcardFullHost

    if (newUseWildcard && localWildcardSubdomain) {
      setLocalWildcardFullHost(updatedWildcardFullHost)
    }

    // Automatically save settings
    onSettingsChange({
      hostName: localHostName,
      useWildcard: newUseWildcard,
      wildcardSubdomain: localWildcardSubdomain,
      wildcardFullHost: updatedWildcardFullHost,
      serverType: localServerType,
    })

    // Show saved indicator briefly
    showNotification("Settings saved successfully!")
  }

  // Handle wildcard subdomain change
  const handleWildcardSubdomainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subdomain = e.target.value
    setLocalWildcardSubdomain(subdomain)
    const updatedWildcardFullHost = `${subdomain}.${localHostName}`
    setLocalWildcardFullHost(updatedWildcardFullHost)

    // Automatically save settings
    onSettingsChange({
      hostName: localHostName,
      useWildcard: localUseWildcard,
      wildcardSubdomain: subdomain,
      wildcardFullHost: updatedWildcardFullHost,
      serverType: localServerType,
    })

    // Show saved indicator briefly
    showNotification("Settings saved successfully!")
  }

  // Handle server type change
  const handleServerTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newServerType = e.target.value
    setLocalServerType(newServerType)

    // Automatically save settings
    onSettingsChange({
      hostName: localHostName,
      useWildcard: localUseWildcard,
      wildcardSubdomain: localWildcardSubdomain,
      wildcardFullHost: localWildcardFullHost,
      serverType: newServerType,
    })

    // Show saved indicator briefly
    showNotification("Settings saved successfully!")
  }

  const handleWildcardWsChange = (e: React.ChangeEvent<{ checked: boolean }>) => {
    const checked = e.target.checked
    setLocalWildcardWs(checked)
  }

  const handleWildcardSslChange = (e: React.ChangeEvent<{ checked: boolean }>) => {
    const checked = e.target.checked
    setLocalWildcardSsl(checked)
  }

  // Update the handleSaveSettings function to include serverType
  const handleSaveSettings = () => {
    // Di dalam fungsi handleSaveSettings, pastikan nilai yang disimpan adalah:
    const bugServerToSave = isCustomBugServer ? customBugServer : localWildcardSubdomain

    onSettingsChange({
      hostName: localHostName,
      useWildcard: localUseWildcard,
      wildcardSubdomain: bugServerToSave,
      wildcardFullHost: localWildcardFullHost,
      serverType: localServerType,
    })

    showNotification("Settings saved successfully!")
  }

  // Handle toggling favorite status
  const handleToggleFavorite = () => {
    if (toggleFavorite) {
      toggleFavorite(proxy)
    } else {
      const proxyKey = `${proxy.proxyIP}:${proxy.proxyPort}`
      setFavoriteProxies((prev) => {
        if (prev.includes(proxyKey)) {
          return prev.filter((key) => key !== proxyKey)
        } else {
          return [...prev, proxyKey]
        }
      })
    }
  }

  // Add this function after the existing functions but before the return statement
  // Ubah fungsi checkStatus untuk menggunakan API server

  // Memoize configs to prevent recalculation on every render
  const configs = generateConfigs(
    localHostName,
    proxy,
    nameWEB,
    pathinfo,
    localUseWildcard,
    localWildcardSubdomain,
    localWildcardFullHost || `${localWildcardSubdomain}.${localHostName}`,
    {
      sslServers: availableSslServers && availableSslServers.length > 0 ? availableSslServers : availableHostNames, // Use availableHostNames as fallback
      defaultServerType: localServerType || "WS",
      defaultHostname: localHostName,
    },
  )

  const bugServerOptions = availableBugServers.map((server) => ({
    value: server,
    label: server,
  }))

  // Update the showNotification function with the same enhanced animation and design
  const showNotification = useCallback((message: string) => {
    // Remove any existing notifications first
    const existingNotifications = document.querySelectorAll(".copy-notification")
    existingNotifications.forEach((notification) => {
      document.body.removeChild(notification)
    })

    // Create the notification container
    const popup = document.createElement("div")
    popup.className = "copy-notification"
    popup.style.position = "fixed"
    popup.style.bottom = "30px"
    popup.style.left = "50%"
    popup.style.transform = "translateX(-50%) translateY(100px)"
    popup.style.backgroundColor = "rgba(0, 0, 0, 0.8)"
    popup.style.color = "#fff"
    popup.style.padding = "12px 20px"
    popup.style.borderRadius = "8px"
    popup.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.3)"
    popup.style.zIndex = "9999"
    popup.style.transition = "all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)"
    popup.style.opacity = "0"
    popup.style.display = "flex"
    popup.style.alignItems = "center"
    popup.style.justifyContent = "center"
    popup.style.gap = "10px"
    popup.style.backdropFilter = "blur(5px)"
    popup.style.border = "1px solid rgba(255, 255, 255, 0.1)"
    popup.style.fontSize = "14px"
    popup.style.fontWeight = "500"

    // Add checkmark icon
    const icon = document.createElement("span")
    icon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5"></path>
      </svg>
    `
    icon.style.display = "flex"
    icon.style.alignItems = "center"
    icon.style.justifyContent = "center"
    icon.style.color = "#4ade80" // Green color for success
    icon.className = "checkmark-icon"

    // Add text
    const text = document.createElement("span")
    text.textContent = message

    // Append elements
    popup.appendChild(icon)
    popup.appendChild(text)
    document.body.appendChild(popup)

    // Animate in
    setTimeout(() => {
      popup.style.opacity = "1"
      popup.style.transform = "translateX(-50%) translateY(0)"
    }, 10)

    // Add pulse animation to the checkmark
    const keyframes = `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
      }
    `
    const style = document.createElement("style")
    style.innerHTML = keyframes
    document.head.appendChild(style)

    icon.style.animation = "pulse 1s ease-in-out infinite"

    // Animate out after delay
    setTimeout(() => {
      popup.style.opacity = "0"
      popup.style.transform = "translateX(-50%) translateY(20px)"

      // Remove the element after animation completes
      setTimeout(() => {
        if (document.body.contains(popup)) {
          document.body.removeChild(popup)
        }
        if (document.head.contains(style)) {
          document.head.removeChild(style)
        }
      }, 500)
    }, 2000)
  }, [])

  // Tambahkan fungsi untuk membuat konfigurasi Clash Rotate setelah fungsi showNotification
  // Use the telegram username from props instead of hardcoding it
  const telegram = pathinfo.startsWith("t.me/") ? pathinfo.substring(5) : pathinfo
  // Fungsi untuk membuat konfigurasi Clash Rotate
  const generateClashRotateConfigs = useCallback(() => {
    // Dapatkan kode negara
    const countryCode = country.toUpperCase()

    // Buat path rotate yang konsisten dengan konfigurasi lainnya
    const rotatePath = `/${pathinfo}/${countryCode}`

    // Buat nama untuk setiap konfigurasi
    const vlName = `${getEmojiFlag(country)} ${countryCode}-[Tls]-[VL]-[${nameWEB}]`
    const trName = `${getEmojiFlag(country)} ${countryCode}-[Tls]-[TR]-[${nameWEB}]`
    const ssName = `${getEmojiFlag(country)} ${countryCode}-[Tls]-[SS]-[${nameWEB}]`

    // Tentukan server dan SNI berdasarkan pengaturan dan server type
    let serverHost
    let sniHost

    // Check if we're using a bug server
    const isBugServerActive = useBugServer && localWildcardSubdomain && localWildcardSubdomain !== localHostName

    // 1. Regular (default) - no bug server
    if (!isBugServerActive) {
      serverHost = localHostName // server = hostname (only)
      sniHost = localHostName // sni & host = hostname (only)
    }
    // Bug server is activated, handle the 3 options
    else if (localServerType === "SSL") {
      // Wildcard SSL: For SSL mode, server should be hostname, sni & host = bugserver.hostname
      serverHost = localHostName // server = hostname (only)
      sniHost = `${localWildcardSubdomain}.${localHostName}` // sni & host = bugserver.hostname
    } else if (localServerType === "WS-WILD") {
      // Wildcard WS: server = bugserver, sni & host = bugserver.hostname
      serverHost = localWildcardSubdomain // server = bugserver (only)
      sniHost = `${localWildcardSubdomain}.${localHostName}` // sni & host = bugserver.hostname
    } else {
      // Regular Websocket: server = bugserver, sni & host = hostname
      serverHost = localWildcardSubdomain // server = bugserver (only)
      sniHost = localHostName // sni & host = hostname (only)
    }

    // Buat UUID yang konsisten berdasarkan kode negara
    const uuid = crypto.randomUUID()

    // Buat konfigurasi Clash untuk VLESS Rotate
    const clashVLRotate = `
#InconigtoVPN
proxies:
- name: ${vlName}
  server: ${serverHost}
  port: 443
  type: vless
  uuid: ${uuid}
  cipher: auto
  tls: true
  client-fingerprint: chrome
  udp: false
  skip-cert-verify: true
  network: ws
  servername: ${sniHost}
  alpn:
    - h2
    - h3
    - http/1.1
  ws-opts:
    path: ${rotatePath}
    headers:
      Host: ${sniHost}
    max-early-data: 0
    early-data-header-name: Sec-WebSocket-Protocol
    ip-version: dual
    v2ray-http-upgrade: false
    v2ray-http-upgrade-fast-open: false
`

    // Buat konfigurasi Clash untuk TROJAN Rotate
    const clashTRRotate = `
#InconigtoVPN
proxies:      
- name: ${trName}
  server: ${serverHost}
  port: 443
  type: trojan
  password: ${uuid}
  tls: true
  client-fingerprint: chrome
  udp: false
  skip-cert-verify: true
  network: ws
  sni: ${sniHost}
  alpn:
    - h2
    - h3
    - http/1.1
  ws-opts:
    path: ${rotatePath}
    headers:
      Host: ${sniHost}
    max-early-data: 0
    early-data-header-name: Sec-WebSocket-Protocol
    ip-version: dual
    v2ray-http-upgrade: false
    v2ray-http-upgrade-fast-open: false
`

    // Buat konfigurasi Clash untuk SHADOWSOCKS Rotate
    const clashSSRotate = `
#InconigtoVPN
proxies:
- name: ${ssName}
  server: ${serverHost}
  port: 443
  type: ss
  cipher: none
  password: ${uuid}
  plugin: v2ray-plugin
  client-fingerprint: chrome
  udp: false
  plugin-opts:
    mode: websocket
    host: ${sniHost}
    path: ${rotatePath}
    tls: true
    mux: false
    skip-cert-verify: true
  headers:
    custom: value
    ip-version: dual
    v2ray-http-upgrade: false
    v2ray-http-upgrade-fast-open: false
`

    return {
      clashVLRotate,
      clashTRRotate,
      clashSSRotate,
      allClashRotate: `#InconigtoVPN
proxies:
${extractProxies(clashVLRotate)}${extractProxies(clashTRRotate)}${extractProxies(clashSSRotate)}`,
    }
  }, [
    country,
    nameWEB,
    useBugServer,
    localUseWildcard,
    localWildcardSubdomain,
    localHostName,
    localWildcardFullHost,
    pathinfo,
    localServerType,
  ])

  // Tambahkan fungsi extractProxies di luar fungsi lain agar bisa digunakan oleh generateClashRotateConfigs
  const extractProxies = (config: string) => {
    const lines = config.split("\n")
    // Cari indeks baris yang dimulai dengan "- name:"
    const startIndex = lines.findIndex((line) => line.trim().startsWith("- name:"))
    if (startIndex === -1) return ""
    return lines.slice(startIndex).join("\n")
  }

  // Sekarang tambahkan rotateConfigs ke dalam komponen
  const rotateConfigs = generateClashRotateConfigs()

  // Function to get the current configuration description
  const getConfigDescription = () => {
    if (!useBugServer) {
      return "Regular (default): server = hostname, sni & host = hostname"
    } else if (!localUseWildcard) {
      return "Websocket: server = bugserver, sni & host = hostname"
    } else if (localServerType === "WS") {
      return "Wildcard WS: server = bugserver, sni & host = bugserver.hostname"
    } else {
      return "Wildcard SSL: server = hostname, sni & host = bugserver.hostname"
    }
  }

  // Add the basic settings UI before the configs section
  return (
    <Card className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-md text-tech-text border-none shadow-lg">
      {/* Header with proxy info */}
      <div className="p-3 sm:p-4 border-b border-white/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl sm:text-4xl animate-float">{getEmojiFlag(country)}</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-medium text-base sm:text-lg">{org}</h2>
              <button
                onClick={handleToggleFavorite}
                className={`text-sm hover:scale-110 transition-transform ${
                  isFavorite ? "text-yellow-500" : "text-gray-400 hover:text-yellow-500"
                }`}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                {isFavorite ? "★" : "☆"}
              </button>
            </div>
            <p className="text-tech-muted text-xs sm:text-sm">{country}</p>
          </div>
        </div>
        {/* Replace the paragraph that displays the IP:PORT with this updated version */}
        <div className="text-right">
          <p className="text-tech-accent font-medium text-sm sm:text-base flex flex-col items-end">
            <span>
              {proxyIP}:{proxyPort}
            </span>
            {/* Also update the status display in the return statement to show a refresh button when status is already checked
            Replace the existing status display with this: */}
            {localProxyStatus ? (
              <span className="flex items-center">
                <span className={`text-xs ${localProxyStatus.isActive ? "text-tech-success" : "text-red-500"}`}>
                  {localProxyStatus.isActive ? "ACTIVE" : "NON-ACTIVE"}
                  {localProxyStatus.isActive &&
                    localProxyStatus.latency !== "Error" &&
                    ` (${localProxyStatus.latency})`}
                </span>
                <button
                  onClick={checkStatus}
                  disabled={checkingStatus}
                  className="text-xs text-tech-muted hover:text-tech-accent transition-all duration-300 ml-2"
                  title="Refresh status"
                >
                  {checkingStatus ? "..." : "↻"}
                </button>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-xs text-tech-muted hover:text-tech-accent transition-all duration-300 ml-2"
                  title={showHistory ? "Hide history" : "Show history"}
                >
                  {showHistory ? "▲" : "▼"}
                </button>
              </span>
            ) : (
              <span className="text-xs text-tech-muted animate-pulse">
                {checkingStatus ? "Checking status..." : "Checking status automatically..."}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Show history if expanded */}
      {showHistory && localProxyStatus && (
        <div className="px-3 sm:px-4 py-2 border-b border-white/30">
          <ProxyHistory history={localProxyStatus.history} proxyKey={`${proxy.proxyIP}:${proxy.proxyPort}`} />
        </div>
      )}

      {/* Basic Settings Section */}
      <div className="p-3 sm:p-4 border-b border-white/30 animate-fadeIn">
        <h3 className="text-base sm:text-lg font-medium text-tech-accent mb-3 text-center">Configuration Settings</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
          <div>
            <Label htmlFor="card-hostname" className="text-xs sm:text-sm mb-1 block">
              Base Hostname
            </Label>
            <select
              id="card-hostname"
              value={localHostName}
              onChange={handleHostNameChange}
              className="tech-select w-full text-xs sm:text-sm"
            >
              {availableHostNames.length > 0 ? (
                availableHostNames.map((host) => (
                  <option key={host} value={host}>
                    {host}
                  </option>
                ))
              ) : (
                <option value="">No hostnames available</option>
              )}
            </select>
          </div>

          <div>
            <div className="flex items-center mb-1">
              <input
                type="checkbox"
                id="card-use-bug-server"
                checked={useBugServer}
                onChange={handleUseBugServerChange}
                className="mr-2 h-3 w-3 sm:h-4 sm:w-4"
              />
              <Label htmlFor="card-use-bug-server" className="text-xs sm:text-sm">
                Use Bug Server
              </Label>
            </div>

            {useBugServer && (
              <>
                <div className="flex flex-col gap-2">
                  <select
                    id="card-wildcard-subdomain"
                    value={isCustomBugServer ? "custom" : localWildcardSubdomain}
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setIsCustomBugServer(true)
                        setCustomBugServer("")
                      } else {
                        setIsCustomBugServer(false)
                        setLocalWildcardSubdomain(e.target.value)
                        handleWildcardSubdomainChange(e)
                      }
                    }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Pilih Bug Server</option>
                    {bugServerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                    <option value="custom">Custom (Ketik Manual)</option>
                  </select>

                  {isCustomBugServer && (
                    <input
                      type="text"
                      value={customBugServer}
                      onChange={(e) => {
                        setCustomBugServer(e.target.value)
                        // Update localWildcardSubdomain dengan nilai custom
                        setLocalWildcardSubdomain(e.target.value)
                      }}
                      placeholder="Masukkan bug server custom"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  )}
                </div>

                <div className="flex items-center mb-1">
                  <Label htmlFor="bug-server-mode" className="text-xs sm:text-sm mr-2">
                    Bug Server Mode:
                  </Label>
                  <select
                    id="bug-server-mode"
                    value={localServerType}
                    onChange={handleServerTypeChange}
                    className="tech-select text-xs sm:text-sm flex-1"
                  >
                    <option value="WS">Websocket</option>
                    <option value="WS-WILD">Wildcard WS</option>
                    <option value="SSL">Wildcard SSL</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end">{/* Settings saved notification now shows as a popup */}</div>
      </div>

      {/* Simplified configuration tabs */}
      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* V2Ray Configs Section */}
        <div className="bg-white/30 backdrop-blur-md rounded-lg p-3 sm:p-4 shadow-sm">
          <h3 className="text-base sm:text-lg font-medium text-tech-accent mb-2 sm:mb-3 text-center">V2RAY CONFIGS</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 mb-4">
            {/* VLESS Section */}
            <div className="bg-white/20 backdrop-blur-md rounded-lg p-3 sm:p-4 shadow-sm">
              <h3 className="text-sm font-medium text-tech-accent mb-2 text-center">VLESS</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-tech-muted mb-1">TLS Rotate</p>
                  <div className="relative">
                    <pre className="tech-terminal text-xs p-2 max-h-16 sm:max-h-20 overflow-y-auto text-white">
                      {configs.RTvlessTls}
                    </pre>
                    <CopyButton
                      value={configs.RTvlessTls}
                      className="absolute top-2 right-2 text-xs h-6 w-6 p-0 text-white"
                      onClick={() => showNotification("VLESS TLS Rotate copied!")}
                    >
                      Copy
                    </CopyButton>
                  </div>
                </div>
                <div className="flex gap-2">
                  <CopyButton
                    value={configs.vlessTls}
                    className="flex-1 text-xs h-7"
                    onClick={() => showNotification("VLESS TLS copied!")}
                  >
                    TLS
                  </CopyButton>
                  <CopyButton
                    value={configs.vlessNTls}
                    className="flex-1 text-xs h-7"
                    onClick={() => showNotification("VLESS N-TLS copied!")}
                  >
                    N-TLS
                  </CopyButton>
                </div>
              </div>
            </div>

            {/* TROJAN Section */}
            <div className="bg-white/20 backdrop-blur-md rounded-lg p-3 sm:p-4 shadow-sm">
              <h3 className="text-sm font-medium text-tech-accent mb-2 text-center">TROJAN</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-tech-muted mb-1">TLS Rotate</p>
                  <div className="relative">
                    <pre className="tech-terminal text-xs p-2 max-h-16 sm:max-h-20 overflow-y-auto text-white">
                      {configs.RTtrojanTls}
                    </pre>
                    <CopyButton
                      value={configs.RTtrojanTls}
                      className="absolute top-2 right-2 text-xs h-6 w-6 p-0 text-white"
                      onClick={() => showNotification("TROJAN TLS Rotate copied!")}
                    >
                      Copy
                    </CopyButton>
                  </div>
                </div>
                <div className="flex gap-2">
                  <CopyButton
                    value={configs.trojanTls}
                    className="flex-1 text-xs h-7"
                    onClick={() => showNotification("TROJAN TLS copied!")}
                  >
                    TLS
                  </CopyButton>
                  <CopyButton
                    value={configs.trojanNTls}
                    className="flex-1 text-xs h-7"
                    onClick={() => showNotification("TROJAN N-TLS copied!")}
                  >
                    N-TLS
                  </CopyButton>
                </div>
              </div>
            </div>

            {/* SHADOWSOCKS Section */}
            <div className="bg-white/20 backdrop-blur-md rounded-lg p-3 sm:p-4 shadow-sm">
              <h3 className="text-sm font-medium text-tech-accent mb-2 text-center">SHADOWSOCKS</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-tech-muted mb-1">TLS Rotate</p>
                  <div className="relative">
                    <pre className="tech-terminal text-xs p-2 max-h-16 sm:max-h-20 overflow-y-auto text-white">
                      {configs.RTssTls}
                    </pre>
                    <CopyButton
                      value={configs.RTssTls}
                      className="absolute top-2 right-2 text-xs h-6 w-6 p-0 text-white"
                      onClick={() => showNotification("SHADOWSOCKS TLS Rotate copied!")}
                    >
                      Copy
                    </CopyButton>
                  </div>
                </div>
                <div className="flex gap-2">
                  <CopyButton
                    value={configs.ssTls}
                    className="flex-1 text-xs h-7"
                    onClick={() => showNotification("SHADOWSOCKS TLS copied!")}
                  >
                    TLS
                  </CopyButton>
                  <CopyButton
                    value={configs.ssNTls}
                    className="flex-1 text-xs h-7"
                    onClick={() => showNotification("SHADOWSOCKS N-TLS copied!")}
                  >
                    N-TLS
                  </CopyButton>
                </div>
              </div>
            </div>
          </div>

          {/* Copy All V2Ray Button */}
          <CopyButton
            value={configs.allConfigs}
            className="w-full text-sm py-2 bg-tech-accent/80 hover:bg-tech-accent text-white font-medium"
            onClick={() => showNotification("All V2Ray configurations copied!")}
          >
            Copy All V2Ray Config
          </CopyButton>
        </div>

        {/* Clash Configs Section */}
        <div className="bg-white/30 backdrop-blur-md rounded-lg p-3 sm:p-4 shadow-sm">
          <h3 className="text-base sm:text-lg font-medium text-tech-accent mb-2 sm:mb-3 text-center">CLASH CONFIGS</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-4">
            <CopyButton
              value={configs.clashVLTls}
              className="text-xs"
              onClick={() => showNotification("Clash VLESS copied!")}
            >
              Clash VLESS
            </CopyButton>
            <CopyButton
              value={configs.clashTRTls}
              className="text-xs"
              onClick={() => showNotification("Clash TROJAN copied!")}
            >
              Clash TROJAN
            </CopyButton>
            <CopyButton
              value={configs.clashSSTls}
              className="text-xs"
              onClick={() => showNotification("Clash SHADOWSOCKS copied!")}
            >
              Clash SHADOWSOCKS
            </CopyButton>
          </div>

          {/* Tombol Copy All Clash Configs yang menggabungkan semua konfigurasi */}
          <CopyButton
            value={(() => {
              // Ekstrak bagian proxy dari setiap konfigurasi Clash
              const extractProxies = (config: string) => {
                const lines = config.split("\n")
                // Cari indeks baris yang dimulai dengan "- name:"
                const startIndex = lines.findIndex((line) => line.trim().startsWith("- name:"))
                if (startIndex === -1) return ""
                return lines.slice(startIndex).join("\n")
              }

              // Gabungkan semua konfigurasi (regular dan rotate) dengan satu header
              return `#InconigtoVPN
proxies:
${extractProxies(configs.clashVLTls)}${extractProxies(configs.clashTRTls)}${extractProxies(configs.clashSSTls)}${extractProxies(rotateConfigs.clashVLRotate)}${extractProxies(rotateConfigs.clashTRRotate)}${extractProxies(rotateConfigs.clashSSRotate)}`
            })()}
            className="w-full text-xs py-2 bg-tech-accent/80 hover:bg-tech-accent text-white font-medium"
            onClick={() => showNotification("All Clash configurations copied!")}
          >
            Copy All Clash Config
          </CopyButton>
        </div>
      </div>
    </Card>
  )
})

