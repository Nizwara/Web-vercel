export interface AdminSettings {
  hostnames: string[] // This will now serve as both hostnames and sslServers
  bugServers: string[]
  defaultHostname: string // We'll keep this for backward compatibility
  defaultPathInfo: string
  defaultNameWEB: string
  defaultTelegram: string
  defaultServerType: string
  ownerPin?: string
  lastUpdated: string
}

export interface SettingsResponse {
  success: boolean
  data?: AdminSettings
  error?: string
}

