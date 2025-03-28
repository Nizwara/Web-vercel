/**
 * Helper functions for Vercel KV integration
 */

// Function to check and fix KV URL format
export function normalizeKVUrl(url: string | undefined): string | undefined {
  if (!url) return undefined

  // If URL doesn't start with http/https, try to fix it
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    // Check if it's a Redis URL (starts with redis:// or rediss://)
    if (url.startsWith("redis://") || url.startsWith("rediss://")) {
      // Extract the hostname from Redis URL
      try {
        // Format: redis[s]://username:password@hostname:port
        const match = url.match(/redis(s?):\/\/.*?@([^:]+):/)
        if (match && match[2]) {
          return `https://${match[2]}`
        }
      } catch (e) {
        console.error("Error parsing Redis URL:", e)
      }
    }

    // Check if it's an Upstash token/ID (typically a random string without dots or slashes)
    if (/^[a-zA-Z0-9]+$/.test(url)) {
      console.log("URL appears to be an Upstash token/ID, not a valid URL")
      return undefined // Return undefined to indicate invalid URL
    }

    // If we couldn't extract from Redis URL, try adding https://
    return `https://${url}`
  }

  return url
}

// Function to validate KV connection parameters
export function validateKVParams(url: string | undefined, token: string | undefined): boolean {
  if (!url || !token) return false

  // URL should be a valid HTTP URL
  try {
    new URL(url)
    // URL must start with https:// for Upstash
    if (!url.startsWith("https://")) {
      console.error("KV URL must start with https://")
      return false
    }
  } catch (e) {
    console.error("Invalid KV URL format:", url)
    return false
  }

  // Token should be at least 10 characters
  if (token.length < 10) {
    console.error("KV token too short:", token.length)
    return false
  }

  return true
}

// Function to extract KV connection details from environment variables
export function getKVConnectionDetails(): {
  url: string | undefined
  token: string | undefined
  isValid: boolean
  normalizedUrl: string | undefined
  error?: string
} {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN

  // Check if URL is just a token/ID
  if (url && /^[a-zA-Z0-9]+$/.test(url)) {
    return {
      url,
      token,
      normalizedUrl: undefined,
      isValid: false,
      error: `URL appears to be just a token/ID (${url}), not a valid URL. It should be a full HTTPS URL like https://your-db.upstash.io`,
    }
  }

  const normalizedUrl = normalizeKVUrl(url)
  const isValid = validateKVParams(normalizedUrl, token)

  let error
  if (!normalizedUrl) {
    error = "URL is missing or invalid"
  } else if (!token) {
    error = "Token is missing"
  } else if (!isValid) {
    error = "URL or token is invalid"
  }

  return {
    url,
    token,
    normalizedUrl,
    isValid,
    error,
  }
}

// Function to check if we have Redis URL in other environment variables
export function findRedisUrlInEnv(): { found: boolean; key?: string; url?: string } {
  for (const key in process.env) {
    const value = process.env[key]
    if (!value) continue

    // Check if this env var contains a Redis URL
    if ((value.startsWith("redis://") || value.startsWith("rediss://")) && value.includes("@") && value.includes(":")) {
      return {
        found: true,
        key,
        url: value,
      }
    }

    // Check if this env var contains an Upstash HTTP URL
    if (value.startsWith("https://") && (value.includes("upstash.io") || value.includes("upstash.com"))) {
      return {
        found: true,
        key,
        url: value,
      }
    }
  }

  return { found: false }
}

// Tambahkan fungsi untuk mendeteksi dan menggunakan Redis URL
export function detectRedisUrl(): {
  found: boolean
  url?: string
  hostname?: string
  username?: string
  password?: string
} {
  const redisUrl = process.env.KV_URL || process.env.REDIS_URL

  if (!redisUrl || (!redisUrl.startsWith("redis://") && !redisUrl.startsWith("rediss://"))) {
    return { found: false }
  }

  try {
    // Format: redis[s]://username:password@hostname:port
    const match = redisUrl.match(/redis(s?):\/\/(.*?):(.*?)@([^:]+):/)
    if (match) {
      return {
        found: true,
        url: redisUrl,
        hostname: match[4],
        username: match[2],
        password: match[3],
      }
    }
    return { found: true, url: redisUrl }
  } catch (e) {
    console.error("Error parsing Redis URL:", e)
    return { found: true, url: redisUrl }
  }
}

// Perbarui fungsi testKVConnection untuk menangani Redis URL
export async function testKVConnection(): Promise<{
  success: boolean
  message: string
  details?: any
}> {
  try {
    // Cek apakah kita memiliki Redis URL
    const redisInfo = detectRedisUrl()

    // Import KV
    const { kv } = await import("@vercel/kv")

    // Test ping
    const pingResult = await kv.ping()

    // Test set/get operations
    const testKey = `test_key_${Date.now()}`
    const testValue = `test_value_${Date.now()}`

    await kv.set(testKey, testValue)
    const retrievedValue = await kv.get(testKey)

    // Clean up
    await kv.del(testKey)

    if (retrievedValue === testValue) {
      return {
        success: true,
        message: "KV connection is working correctly",
        details: {
          pingResult,
          testKey,
          testValue,
          retrievedValue,
          match: true,
          usingRedisUrl: redisInfo.found,
        },
      }
    } else {
      return {
        success: false,
        message: `Value mismatch: expected "${testValue}", got "${retrievedValue}"`,
        details: {
          pingResult,
          testKey,
          testValue,
          retrievedValue,
          match: false,
          usingRedisUrl: redisInfo.found,
        },
      }
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
      details: { error },
    }
  }
}

