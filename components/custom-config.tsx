"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Plus, Save, AlertCircle, Check } from "lucide-react"
import { getSettings, saveSettings, getStorageMethod } from "@/lib/settings-service"
import type { AdminSettings } from "@/lib/types/settings"
import { useTheme } from "@/contexts/theme-context"

// Update the onSave interface to include serverType
interface CustomConfigProps {
  defaultHostName: string
  defaultPathInfo: string
  defaultNameWEB: string
  defaultTelegram: string
  onSave: (config: {
    hostName: string
    pathinfo: string
    nameWEB: string
    telegram: string
    useWildcard: boolean
    wildcardSubdomain: string
    wildcardFullHost: string
    serverType?: string
  }) => void
  onClose: () => void
}

export function CustomConfig({
  defaultHostName,
  defaultPathInfo,
  defaultNameWEB,
  defaultTelegram,
  onSave,
  onClose,
}: CustomConfigProps) {
  const { theme } = useTheme()

  // State for managing hostnames and bug servers
  const [hostnames, setHostnames] = useState<string[]>([])
  const [newHostname, setNewHostname] = useState("")
  const [bugServers, setBugServers] = useState<string[]>([])
  const [newBugServer, setNewBugServer] = useState("")

  const [baseHostName, setBaseHostName] = useState("")
  const [pathinfo, setPathinfo] = useState(defaultPathInfo)
  const [nameWEB, setNameWEB] = useState(defaultNameWEB)
  const [telegram, setTelegram] = useState(defaultTelegram)
  const [showSuccess, setShowSuccess] = useState(false)
  const [useWildcard, setUseWildcard] = useState(false)
  const [wildcardSubdomain, setWildcardSubdomain] = useState("")
  const [showConfirmation, setShowConfirmation] = useState(false)

  // State for admin settings
  const [isSavingAdminSettings, setIsSavingAdminSettings] = useState(false)
  const [adminSettingsSaved, setAdminSettingsSaved] = useState(false)
  const [adminSettingsError, setAdminSettingsError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [storageMethod, setStorageMethod] = useState<string>("unknown")

  // Add after the other useState declarations:
  const [sslServers, setSslServers] = useState<string[]>([])
  const [serverType, setServerType] = useState<string>("WS")

  // Add a new state variable for database contents after the other state declarations
  const [databaseContents, setDatabaseContents] = useState<AdminSettings | null>(null)
  const [loadingDatabase, setLoadingDatabase] = useState(false)

  // PIN protection states
  const [showPinModal, setShowPinModal] = useState(true)
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState(false)
  const [isAdvancedUnlocked, setIsAdvancedUnlocked] = useState(false)
  const [correctPin, setCorrectPin] = useState("220199") // Default PIN

  // PIN change functionality removed

  // Load settings from server on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSettings()

        // Update state with loaded settings
        setHostnames(settings.hostnames || [])
        setBugServers(settings.bugServers || [])
        setBaseHostName(settings.defaultHostname || defaultHostName)
        setPathinfo(settings.defaultPathInfo || defaultPathInfo)
        setNameWEB(settings.defaultNameWEB || defaultNameWEB)
        setTelegram(settings.defaultTelegram || defaultTelegram)
        setLastUpdated(settings.lastUpdated || null)
        setStorageMethod(getStorageMethod())

        // Set default wildcard subdomain if bug servers exist
        if (settings.bugServers && settings.bugServers.length > 0) {
          setWildcardSubdomain(settings.bugServers[0])
        }

        // Add to the useEffect that updates form values:
        setSslServers(settings?.sslServers || [])
        setServerType(settings?.defaultServerType || "WS")

        // Load PIN from settings if available
        if (settings.ownerPin) {
          setCorrectPin(settings.ownerPin)
        }
      } catch (error) {
        console.error("Error loading settings:", error)
        // Set fallback values
        setBaseHostName(defaultHostName)
      }
    }

    loadSettings()
  }, [defaultHostName, defaultPathInfo, defaultNameWEB, defaultTelegram])

  // Update pathinfo when telegram username changes
  useEffect(() => {
    if (pathinfo.startsWith("t.me/")) {
      setPathinfo(`t.me/${telegram}`)
    }
  }, [telegram])

  // Verify PIN
  const verifyPin = () => {
    if (pin === correctPin) {
      setIsAdvancedUnlocked(true)
      setShowPinModal(false)
      setPinError(false)
    } else {
      setPinError(true)
      setPin("")
    }
  }

  // PIN change functionality removed

  // Add a function to load and display database contents after the other functions
  const loadDatabaseContents = async () => {
    try {
      setLoadingDatabase(true)
      const settings = await getSettings()
      setDatabaseContents(settings)
    } catch (error) {
      console.error("Error loading database contents:", error)
    } finally {
      setLoadingDatabase(false)
    }
  }

  // Add useEffect to load database contents when advanced settings are unlocked
  useEffect(() => {
    if (isAdvancedUnlocked) {
      loadDatabaseContents()
    }
  }, [isAdvancedUnlocked])

  // Get the full wildcard hostname
  const getWildcardFullHost = () => {
    if (useWildcard && wildcardSubdomain) {
      return `${wildcardSubdomain}.${baseHostName}`
    }
    return baseHostName
  }

  // Tambahkan log untuk memeriksa nilai SSL servers saat disimpan
  const handleSave = async () => {
    // First save to database
    setIsSavingAdminSettings(true)

    try {
      const settings: AdminSettings = {
        hostnames,
        bugServers,
        // Gunakan nilai sslServers yang sudah ada atau nilai default
        sslServers: sslServers.length > 0 ? sslServers : [baseHostName],
        defaultHostname: baseHostName,
        defaultPathInfo: pathinfo,
        defaultNameWEB: nameWEB,
        defaultTelegram: telegram,
        defaultServerType: serverType || "WS",
        ownerPin: correctPin, // Include the current PIN
        lastUpdated: new Date().toISOString(),
      }

      console.log("Saving admin settings with SSL servers:", settings.sslServers)
      console.log("Server type being saved:", settings.defaultServerType)
      const success = await saveSettings(settings)

      if (success) {
        setLastUpdated(settings.lastUpdated)
        setStorageMethod(getStorageMethod())

        // Update the database contents display
        setDatabaseContents(settings)

        // Show confirmation dialog for configuration save
        setShowConfirmation(true)
      } else {
        setAdminSettingsError("Failed to save settings. Please try again.")
      }
    } catch (error) {
      console.error("Error saving admin settings:", error)
      setAdminSettingsError("An error occurred while saving settings. Please try again.")
    } finally {
      setIsSavingAdminSettings(false)
    }
  }

  // Update the handleConfirm function to include serverType
  const handleConfirm = () => {
    onSave({
      hostName: useWildcard ? wildcardSubdomain : baseHostName,
      pathinfo,
      nameWEB,
      telegram,
      useWildcard,
      wildcardSubdomain,
      wildcardFullHost: getWildcardFullHost(),
      serverType: serverType,
    })
    setShowSuccess(true)

    // Show success message for longer
    setTimeout(() => {
      setShowSuccess(false)
    }, 3000)

    // Close the confirmation dialog
    setShowConfirmation(false)

    // Add a delay before refreshing database contents to allow the save operation to complete
    setTimeout(() => {
      loadDatabaseContents()
    }, 1500)
  }

  const handleCancel = () => {
    setShowConfirmation(false)
  }

  // Add a new hostname to the list
  const addHostname = () => {
    if (newHostname && !hostnames.includes(newHostname)) {
      setHostnames([...hostnames, newHostname])
      setNewHostname("")
    }
  }

  // Remove a hostname from the list
  const removeHostname = (hostname: string) => {
    setHostnames(hostnames.filter((h) => h !== hostname))

    // If the currently selected hostname is being removed, select the first available one
    if (baseHostName === hostname && hostnames.length > 1) {
      const newSelected = hostnames.find((h) => h !== hostname) || ""
      setBaseHostName(newSelected)
    }
  }

  // Add a new bug server to the list
  const addBugServer = () => {
    if (newBugServer && !bugServers.includes(newBugServer)) {
      setBugServers([...bugServers, newBugServer])
      setNewBugServer("")
    }
  }

  // Remove a bug server from the list
  const removeBugServer = (server: string) => {
    setBugServers(bugServers.filter((s) => s !== server))

    // If the currently selected server is being removed, select the first available one
    if (wildcardSubdomain === server && bugServers.length > 1) {
      const newSelected = bugServers.find((s) => s !== server) || ""
      setWildcardSubdomain(newSelected)
    }
  }

  // Save admin settings
  const handleSaveAdminSettings = async () => {
    setIsSavingAdminSettings(true)
    setAdminSettingsSaved(false)
    setAdminSettingsError(null)

    try {
      const settings: AdminSettings = {
        hostnames,
        bugServers,
        // Gunakan nilai sslServers yang sudah ada atau nilai default
        sslServers: sslServers.length > 0 ? sslServers : [baseHostName],
        defaultHostname: baseHostName,
        defaultPathInfo: pathinfo,
        defaultNameWEB: nameWEB,
        defaultTelegram: telegram,
        defaultServerType: serverType,
        ownerPin: correctPin, // Include the current PIN
        lastUpdated: new Date().toISOString(),
      }

      console.log("Saving admin settings:", settings)
      const success = await saveSettings(settings)

      if (success) {
        setAdminSettingsSaved(true)
        setLastUpdated(settings.lastUpdated)
        setStorageMethod(getStorageMethod())

        // Show success message for longer
        setTimeout(() => {
          setAdminSettingsSaved(false)
        }, 5000)

        // Show a notification to the user
        const storageMethodText = getStorageMethod() === "vercel_kv" ? "Vercel database" : "file system"
        showNotification(`Settings saved successfully to ${storageMethodText}!`)

        // Refresh settings to verify they were saved correctly
        try {
          const refreshedSettings = await getSettings()
          console.log("Refreshed settings after save:", refreshedSettings)

          // Update UI with refreshed settings
          setHostnames(refreshedSettings.hostnames || [])
          setBugServers(refreshedSettings.bugServers || [])
          setBaseHostName(refreshedSettings.defaultHostname || baseHostName)
          setPathinfo(refreshedSettings.defaultPathInfo || pathinfo)
          setNameWEB(refreshedSettings.defaultNameWEB || nameWEB)
          setTelegram(refreshedSettings.defaultTelegram || telegram)
          setLastUpdated(refreshedSettings.lastUpdated || null)

          // Also update the database contents display
          setDatabaseContents(refreshedSettings)
        } catch (refreshError) {
          console.error("Error refreshing settings after save:", refreshError)
        }
      } else {
        setAdminSettingsError("Failed to save settings. Please try again.")
      }
    } catch (error) {
      console.error("Error saving admin settings:", error)
      setAdminSettingsError("An error occurred while saving settings. Please try again.")
    } finally {
      setIsSavingAdminSettings(false)
    }
  }

  // Show notification function
  const showNotification = (message: string) => {
    // Remove any existing notifications first
    const existingNotifications = document.querySelectorAll(".settings-notification")
    existingNotifications.forEach((notification) => {
      document.body.removeChild(notification)
    })

    // Create the notification container
    const popup = document.createElement("div")
    popup.className = "settings-notification"
    popup.style.position = "fixed"
    popup.style.bottom = "30px"
    popup.style.left = "50%"
    popup.style.transform = "translateX(-50%) translateY(100px)"
    popup.style.backgroundColor = theme === "light" ? "rgba(255, 255, 255, 0.9)" : "rgba(15, 23, 42, 0.9)"
    popup.style.color = theme === "light" ? "#2d3436" : "#e2e8f0"
    popup.style.padding = "12px 20px"
    popup.style.borderRadius = "8px"
    popup.style.boxShadow =
      theme === "light" ? "0 4px 20px rgba(32, 201, 151, 0.2)" : "0 4px 20px rgba(0, 170, 255, 0.2)"
    popup.style.zIndex = "9999"
    popup.style.transition = "all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)"
    popup.style.opacity = "0"
    popup.style.display = "flex"
    popup.style.alignItems = "center"
    popup.style.justifyContent = "center"
    popup.style.gap = "10px"
    popup.style.backdropFilter = "blur(5px)"
    popup.style.border = theme === "light" ? "1px solid rgba(32, 201, 151, 0.2)" : "1px solid rgba(0, 170, 255, 0.2)"
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
    icon.style.color = theme === "light" ? "#20c997" : "#00aaff"
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
    }, 3000)
  }

  // Example configuration preview
  const getExampleConfig = () => {
    if (useWildcard) {
      return `vless://uuid@${wildcardSubdomain}:443?encryption=none&security=tls&sni=${getWildcardFullHost()}&fp=randomized&type=ws&host=${getWildcardFullHost()}&path=%2F${pathinfo}%2FID#🇮🇩 (ID)-[Tls]-[VL]-[${nameWEB}]`
    }
    return `vless://uuid@${baseHostName}:443?encryption=none&security=tls&sni=${baseHostName}&fp=randomized&type=ws&host=${baseHostName}&path=%2F${pathinfo}%2FID#🇮🇩 (ID)-[Tls]-[VL]-[${nameWEB}]`
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString()
    } catch (e) {
      return dateString
    }
  }

  return (
    <Card className={`${theme === "light" ? "bg-white/40" : "bg-gray-900/40"} backdrop-blur-md border-none shadow-lg`}>
      <div className="p-4 border-b border-white/30 dark:border-gray-700/30 flex justify-between items-center">
        <h2 className="text-xl font-bold tech-text-gradient">Advanced Configuration</h2>
        {showSuccess && (
          <div className="text-tech-success animate-fadeIn px-3 py-1 rounded-full bg-white/20 dark:bg-gray-800/20 backdrop-blur-md">
            Settings saved!
          </div>
        )}
      </div>

      <div className="p-6">
        {isAdvancedUnlocked ? (
          <div className="space-y-4">
            {/* Admin Settings Status Messages */}
            {adminSettingsSaved && (
              <div className="bg-green-500/20 text-green-500 p-2 rounded-md text-sm flex items-center">
                <Check size={16} className="mr-2" />
                Settings saved successfully
              </div>
            )}

            {adminSettingsError && (
              <div className="bg-red-500/20 text-red-500 p-2 rounded-md text-sm flex items-center">
                <AlertCircle size={16} className="mr-2" />
                {adminSettingsError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="pathinfo">Path Format</Label>
              <Input
                id="pathinfo"
                value={pathinfo}
                onChange={(e) => setPathinfo(e.target.value)}
                placeholder="Enter path (e.g., t.me/username)"
                className="tech-input"
              />
              <p className="text-xs text-tech-muted">The path used in your configuration URLs</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameWEB">Web Name</Label>
              <Input
                id="nameWEB"
                value={nameWEB}
                onChange={(e) => setNameWEB(e.target.value)}
                placeholder="Enter web name (e.g., InconigtoVPN)"
                className="tech-input"
              />
              <p className="text-xs text-tech-muted">The name that will appear in your configurations</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram Username</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-white/30 dark:border-gray-700/30 bg-white/20 dark:bg-gray-800/20 text-tech-muted">
                  @
                </span>
                <Input
                  id="telegram"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="Enter Telegram username"
                  className="tech-input rounded-l-none"
                />
              </div>
              <p className="text-xs text-tech-muted">Your Telegram username without the @ symbol</p>
            </div>

            {/* Base Hostname Management Section */}
            <div className="space-y-2 mt-6 p-4 border border-white/20 dark:border-gray-700/20 rounded-lg">
              <h3 className="font-medium text-tech-accent">Manage Base Hostnames</h3>
              <p className="text-xs text-tech-muted mb-3">
                Add or remove base hostnames that will be available in the basic settings
              </p>

              <div className="flex gap-2 mb-4">
                <Input
                  value={newHostname}
                  onChange={(e) => setNewHostname(e.target.value)}
                  placeholder="Enter new hostname"
                  className="tech-input flex-1"
                />
                <Button
                  onClick={addHostname}
                  className="tech-button flex items-center gap-1"
                  disabled={!newHostname || hostnames.includes(newHostname)}
                >
                  <Plus size={16} /> Add
                </Button>
              </div>

              <div className="max-h-40 overflow-y-auto">
                {hostnames.map((hostname) => (
                  <div
                    key={hostname}
                    className="flex items-center justify-between p-2 mb-1 bg-white/10 dark:bg-gray-800/10 rounded"
                  >
                    <span className="text-sm">{hostname}</span>
                    <button
                      onClick={() => removeHostname(hostname)}
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1"
                      aria-label={`Remove ${hostname}`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bug Server Management Section */}
            <div className="space-y-2 mt-6 p-4 border border-white/20 dark:border-gray-700/20 rounded-lg">
              <h3 className="font-medium text-tech-accent">Manage Bug Servers</h3>
              <p className="text-xs text-tech-muted mb-3">
                Add or remove bug servers that will be available in the basic settings
              </p>

              <div className="flex gap-2 mb-4">
                <Input
                  value={newBugServer}
                  onChange={(e) => setNewBugServer(e.target.value)}
                  placeholder="Enter new bug server"
                  className="tech-input flex-1"
                />
                <Button
                  onClick={addBugServer}
                  className="tech-button flex items-center gap-1"
                  disabled={!newBugServer || bugServers.includes(newBugServer)}
                >
                  <Plus size={16} /> Add
                </Button>
              </div>

              <div className="max-h-40 overflow-y-auto">
                {bugServers.map((server) => (
                  <div
                    key={server}
                    className="flex items-center justify-between p-2 mb-1 bg-white/10 dark:bg-gray-800/10 rounded"
                  >
                    <span className="text-sm">{server}</span>
                    <button
                      onClick={() => removeBugServer(server)}
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1"
                      aria-label={`Remove ${server}`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="serverType" className="block text-sm font-medium mb-1">
                Default Server Type
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="serverType"
                    value="WS"
                    checked={serverType === "WS"}
                    onChange={() => setServerType("WS")}
                    className="mr-2"
                  />
                  <span>WS (WebSocket)</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="serverType"
                    value="SSL"
                    checked={serverType === "SSL"}
                    onChange={() => setServerType("SSL")}
                    className="mr-2"
                  />
                  <span>SSL</span>
                </label>
              </div>
            </div>

            <div className="bg-white/20 dark:bg-gray-800/20 p-4 rounded-lg backdrop-blur-md mt-4">
              <h3 className="font-medium mb-2 text-tech-accent">Configuration Preview</h3>
              <pre className="text-xs bg-black/80 text-green-400 p-3 rounded overflow-x-auto">{getExampleConfig()}</pre>
            </div>

            {/* Add a new section to display database contents in the UI */}
            {/* Add this after the Configuration Preview section and before the closing </div> of the isAdvancedUnlocked condition */}
            <div className="bg-white/20 dark:bg-gray-800/20 p-4 rounded-lg backdrop-blur-md mt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-tech-accent">Database Contents</h3>
                <Button
                  onClick={loadDatabaseContents}
                  className="tech-button text-xs py-1 px-2 flex items-center gap-1"
                  disabled={loadingDatabase}
                >
                  {loadingDatabase ? (
                    <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-1"></div>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1"
                    >
                      <path d="M21 2v6h-6"></path>
                      <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                      <path d="M3 12a9 9 0 0 0 15 6.7L21 16"></path>
                      <path d="M21 22v-6h-6"></path>
                    </svg>
                  )}
                  Refresh
                </Button>
              </div>

              {databaseContents ? (
                <div className="bg-black/80 text-green-400 p-3 rounded overflow-auto max-h-80">
                  <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(databaseContents, null, 2)}</pre>
                </div>
              ) : (
                <div className="text-center p-4 text-tech-muted">
                  {loadingDatabase ? "Loading database contents..." : "No database contents to display"}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="text-tech-muted mb-2">Advanced settings are locked</div>
              <Button onClick={() => setShowPinModal(true)} className="tech-button">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Unlock Advanced Settings
              </Button>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between items-center">
          <div>
            <h3 className="font-medium text-tech-accent">Settings Information</h3>
            {lastUpdated && <p className="text-xs text-tech-muted">Last updated: {formatDate(lastUpdated)}</p>}
            {storageMethod && (
              <p className="text-xs text-tech-muted">
                Storage method:{" "}
                {storageMethod === "vercel_kv"
                  ? "Vercel KV Database"
                  : storageMethod === "file_system"
                    ? "Server File System"
                    : storageMethod === "localStorage_fallback"
                      ? "Local Storage (Fallback)"
                      : "Unknown"}
              </p>
            )}
            {/* PIN change functionality removed */}
          </div>
          <Button
            onClick={handleSaveAdminSettings}
            className="tech-button flex items-center gap-1"
            disabled={isSavingAdminSettings}
          >
            {isSavingAdminSettings ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1"></div>
            ) : (
              <Save size={16} className="mr-1" />
            )}
            Save All Settings
          </Button>
        </div>
      </div>

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div
            className={`${theme === "light" ? "bg-white" : "bg-gray-900"} p-4 rounded-lg shadow-xl max-w-xs mx-auto`}
          >
            <h3 className="text-base font-medium mb-3">Enter Owner PIN</h3>
            <p className="mb-3 text-xs text-tech-muted">
              Advanced settings are protected. Please enter the owner PIN to continue.
            </p>

            <div className="space-y-3">
              <div>
                <Label htmlFor="pin" className="text-sm">
                  PIN
                </Label>
                <div className="mt-1 relative">
                  <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md flex justify-center">
                    <div className="flex space-x-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-3 h-3 rounded-full border border-gray-400 dark:border-gray-600 flex items-center justify-center"
                        >
                          {pin.length > i && <div className="w-2 h-2 rounded-full bg-gray-800 dark:bg-gray-200"></div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        if (pin.length < 6) {
                          setPin(pin + num.toString())
                          setPinError(false)
                        }
                      }}
                      className="p-3 text-center border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      if (pin.length > 0) {
                        setPin(pin.slice(0, -1))
                      }
                    }}
                    className="p-3 text-center border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    ⌫
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (pin.length < 6) {
                        setPin(pin + "0")
                        setPinError(false)
                      }
                    }}
                    className="p-3 text-center border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (pin.length === 6) {
                        verifyPin()
                      }
                    }}
                    disabled={pin.length !== 6}
                    className={`p-3 text-center rounded-md transition-colors ${
                      pin.length === 6
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    ✓
                  </button>
                </div>

                {pinError && <p className="text-red-500 text-xs mt-2">Incorrect PIN. Please try again.</p>}
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowPinModal(false)
                    setPin("")
                    setPinError(false)
                    onClose()
                  }}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button onClick={verifyPin} className="tech-button text-xs px-3 py-1.5">
                  Verify
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className={`${theme === "light" ? "bg-white" : "bg-gray-900"} p-6 rounded-lg shadow-xl max-w-md w-full`}>
            <h3 className="text-lg font-medium mb-4">Save Configuration</h3>
            <p className="mb-6">Are you sure you want to save these configuration settings?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
              >
                No
              </button>
              <button onClick={handleConfirm} className="tech-button">
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN change functionality removed */}
    </Card>
  )
}

