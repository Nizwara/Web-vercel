import type { AdminSettings } from "./types/settings"

// Default settings as fallback
const defaultSettings: AdminSettings = {
  hostnames: [],
  bugServers: [],
  sslServers: [],
  defaultHostname: "",
  defaultPathInfo: "",
  defaultNameWEB: "",
  defaultTelegram: "",
  defaultServerType: "WS",
  lastUpdated: new Date().toISOString(),
}

// Storage key for localStorage cache
const STORAGE_KEY = "inconigto_admin_settings_cache"

// Get settings from API with localStorage cache as fallback
export async function getSettings(): Promise<AdminSettings> {
  try {
    // Add cache-busting query parameter to prevent browser caching
    const timestamp = new Date().getTime()
    const response = await fetch(`/api/settings?t=${timestamp}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.status}`)
    }

    const result = await response.json()

    if (result.success && result.data) {
      // Store in localStorage as backup cache
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data))
        localStorage.setItem("adminSettingsTimestamp", new Date().toISOString())
        localStorage.setItem("adminSettingsStorageMethod", result.storageMethod || "unknown")
      } catch (e) {
        console.error("Error storing settings in localStorage cache:", e)
      }
      return result.data
    } else {
      throw new Error(result.error || "Failed to fetch settings")
    }
  } catch (error) {
    console.error("Error fetching settings:", error)

    // Add more detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
    }

    // Try to get from localStorage cache as fallback
    try {
      const storedSettings = localStorage.getItem(STORAGE_KEY)
      const timestamp = localStorage.getItem("adminSettingsTimestamp")

      if (storedSettings) {
        console.log(`Using cached settings from: ${timestamp || "unknown time"}`)
        return JSON.parse(storedSettings) as AdminSettings
      }
    } catch (e) {
      console.error("Error parsing stored settings:", e)
    }

    // Return default settings if all else fails
    console.log("Using default settings as fallback")
    return { ...defaultSettings }
  }
}

// Save settings to API
export async function saveSettings(settings: AdminSettings): Promise<boolean> {
  const maxRetries = 3
  let retryCount = 0

  while (retryCount < maxRetries) {
    try {
      console.log(`Attempt ${retryCount + 1} to save settings`)

      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to save settings: ${response.status} - ${errorText}`)
      }

      const result = await response.json()

      if (result.success) {
        // Update localStorage cache
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data || settings))
          localStorage.setItem("adminSettingsTimestamp", new Date().toISOString())
          localStorage.setItem("adminSettingsStorageMethod", result.storageMethod || "unknown")
        } catch (e) {
          console.error("Error storing settings in localStorage cache:", e)
        }
        return true
      } else {
        throw new Error(result.error || "Failed to save settings")
      }
    } catch (error) {
      console.error(`Error saving settings (attempt ${retryCount + 1}):`, error)
      retryCount++

      if (retryCount >= maxRetries) {
        // Store in localStorage as backup cache even if API fails
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
          localStorage.setItem("adminSettingsTimestamp", new Date().toISOString())
          localStorage.setItem("adminSettingsStorageMethod", "localStorage_fallback")
        } catch (e) {
          console.error("Error storing settings in localStorage cache:", e)
        }

        return false
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  return false
}

// Get the current storage method being used
export function getStorageMethod(): string {
  try {
    return localStorage.getItem("adminSettingsStorageMethod") || "unknown"
  } catch (e) {
    return "unknown"
  }
}

export async function debugKVConnection(): Promise<any> {
  try {
    const response = await fetch("/api/settings/debug", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to debug KV connection: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error debugging KV connection:", error)
    throw error
  }
}

