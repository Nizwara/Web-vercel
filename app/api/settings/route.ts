import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import type { AdminSettings } from "@/lib/types/settings"
import { getKVClientForSettings } from "./kv-adapter"

// Check if Vercel KV is available
const isKVAvailable =
  process.env.KV_REST_API_URL &&
  process.env.KV_REST_API_TOKEN &&
  process.env.KV_REST_API_URL.startsWith("https://") &&
  process.env.KV_REST_API_TOKEN.length > 10

// Key for storing settings in Vercel KV
const SETTINGS_KEY = "inconigto_admin_settings"

// Path to the settings file (fallback)
const settingsFilePath = path.join(process.cwd(), "public", "settings.json")

// Default settings
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

// Ensure the directory exists
function ensureDirectoryExists() {
  const dataDir = path.join(process.cwd(), "public")
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Get settings from file (fallback method)
function getSettingsFromFile(): AdminSettings {
  try {
    ensureDirectoryExists()

    if (!fs.existsSync(settingsFilePath)) {
      // If file doesn't exist, create it with default settings
      fs.writeFileSync(settingsFilePath, JSON.stringify(defaultSettings, null, 2))
      return defaultSettings
    }

    const fileContent = fs.readFileSync(settingsFilePath, "utf8")
    return JSON.parse(fileContent) as AdminSettings
  } catch (error) {
    console.error("Error reading settings from file:", error)
    return defaultSettings
  }
}

// Save settings to file (fallback method)
function saveSettingsToFile(settings: AdminSettings): boolean {
  try {
    ensureDirectoryExists()

    // First write to a temporary file
    const tempFilePath = `${settingsFilePath}.tmp`
    fs.writeFileSync(tempFilePath, JSON.stringify(settings, null, 2), "utf8")

    // Then rename to the actual file (more atomic operation)
    fs.renameSync(tempFilePath, settingsFilePath)

    // Verify the file was written correctly
    const fileContent = fs.readFileSync(settingsFilePath, "utf8")
    const parsedContent = JSON.parse(fileContent) as AdminSettings

    // Check if the content matches what we tried to save
    return JSON.stringify(parsedContent) === JSON.stringify(settings)
  } catch (error) {
    console.error("Error saving settings to file:", error)
    return false
  }
}

// GET handler
export async function GET(): Promise<NextResponse<any>> {
  try {
    let settings: AdminSettings

    if (isKVAvailable) {
      // If Vercel KV is available, try to use it
      try {
        console.log(
          "Attempting to use Vercel KV with URL:",
          process.env.KV_REST_API_URL?.substring(0, 10) + "...", // Log partial URL for debugging
        )

        const kv = getKVClientForSettings()
        settings = (await kv.get(SETTINGS_KEY)) as AdminSettings

        if (!settings) {
          console.log("No settings found in KV, using defaults")
          settings = defaultSettings
          await kv.set(SETTINGS_KEY, settings)
        }
      } catch (kvError) {
        console.error("Error using Vercel KV:", kvError)
        // Fall back to file-based storage
        settings = getSettingsFromFile()
      }
    } else {
      // Use file-based storage as fallback
      console.log("Vercel KV not properly configured, using file-based storage")
      settings = getSettingsFromFile()
    }

    return NextResponse.json({
      success: true,
      data: settings,
      storageMethod: isKVAvailable ? "vercel_kv" : "file_system",
    })
  } catch (error) {
    console.error("Error in GET settings:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve settings",
      },
      { status: 500 },
    )
  }
}

// POST handler
export async function POST(request: NextRequest): Promise<NextResponse<any>> {
  try {
    const newSettings = (await request.json()) as AdminSettings

    // Validate the settings
    if (
      !newSettings.hostnames ||
      !Array.isArray(newSettings.hostnames) ||
      !newSettings.bugServers ||
      !Array.isArray(newSettings.bugServers)
    ) {
      console.error("Invalid settings format:", newSettings)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid settings format",
        },
        { status: 400 },
      )
    }

    // Add timestamp
    newSettings.lastUpdated = new Date().toISOString()

    let saveSuccess = false
    let storageMethod = "file_system"

    if (isKVAvailable) {
      // If Vercel KV is available, try to use it
      try {
        console.log(
          "Attempting to use Vercel KV with URL:",
          process.env.KV_REST_API_URL?.substring(0, 10) + "...", // Log partial URL for debugging
        )
        const kv = getKVClientForSettings()
        await kv.set(SETTINGS_KEY, newSettings)

        // Verify the save was successful
        const savedSettings = (await kv.get(SETTINGS_KEY)) as AdminSettings

        if (savedSettings) {
          saveSuccess = true
          storageMethod = "vercel_kv"
        } else {
          // Fall back to file-based storage
          saveSuccess = saveSettingsToFile(newSettings)
        }
      } catch (kvError) {
        console.error("Error using Vercel KV:", kvError)
        // Fall back to file-based storage
        saveSuccess = saveSettingsToFile(newSettings)
      }
    } else {
      // Use file-based storage as fallback
      console.log("Vercel KV not properly configured, using file-based storage")
      saveSuccess = saveSettingsToFile(newSettings)
    }

    if (saveSuccess) {
      return NextResponse.json({
        success: true,
        data: newSettings,
        storageMethod,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to save settings",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in POST settings:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update settings",
      },
      { status: 500 },
    )
  }
}

