import { createClient } from "@vercel/kv"

export function getKVClientForSettings() {
  const redisUrl = process.env.KV_URL || process.env.REDIS_URL || ""

  if (!redisUrl) {
    throw new Error("No Redis URL found in environment variables")
  }

  // Ekstrak hostname dari URL Redis
  const match = redisUrl.match(/redis(s?):\/\/.*?@([^:]+):/)
  const hostname = match && match[2] ? match[2] : null

  // Gunakan token yang tersedia
  const token = process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_READ_ONLY_TOKEN

  if (!hostname || !token) {
    throw new Error("Failed to extract hostname or token from Redis URL")
  }

  // Buat URL REST API
  const url = `https://${hostname}`

  // Buat dan kembalikan client
  return createClient({
    url,
    token,
  })
}

