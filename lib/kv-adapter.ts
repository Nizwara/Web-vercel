import { createClient } from "@vercel/kv"

// Fungsi untuk mengekstrak hostname dari Redis URL
function extractHostnameFromRedisUrl(redisUrl: string): string | null {
  try {
    // Format: redis[s]://username:password@hostname:port
    const match = redisUrl.match(/redis(s?):\/\/.*?@([^:]+):/)
    if (match && match[2]) {
      return match[2]
    }
    return null
  } catch (e) {
    console.error("Error parsing Redis URL:", e)
    return null
  }
}

// Fungsi untuk mendapatkan token dari Redis URL
function extractTokenFromRedisUrl(redisUrl: string): string | null {
  try {
    // Format: redis[s]://username:password@hostname:port
    const match = redisUrl.match(/redis(s?):\/\/.*?:(.*?)@/)
    if (match && match[2]) {
      return match[2]
    }
    return null
  } catch (e) {
    console.error("Error extracting token from Redis URL:", e)
    return null
  }
}

// Buat KV client dengan URL yang dikonversi
export function getKVClient() {
  const redisUrl = process.env.KV_URL || process.env.REDIS_URL || ""

  if (!redisUrl) {
    throw new Error("No Redis URL found in environment variables")
  }

  // Ekstrak hostname dan token
  const hostname = extractHostnameFromRedisUrl(redisUrl)

  // Gunakan token dari KV_REST_API_TOKEN jika ada, atau ekstrak dari URL Redis
  const token =
    process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN || extractTokenFromRedisUrl(redisUrl)

  if (!hostname || !token) {
    throw new Error("Failed to extract hostname or token from Redis URL")
  }

  // Buat URL REST API
  const url = `https://${hostname}`

  console.log(`Creating KV client with URL: ${url.substring(0, 20)}...`)

  // Buat dan kembalikan client
  return createClient({
    url,
    token,
  })
}

// Ekspor instance client langsung untuk kemudahan penggunaan
export const kvClient = getKVClient()

