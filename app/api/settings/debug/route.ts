import { NextResponse } from "next/server"
import { getKVConnectionDetails, normalizeKVUrl, findRedisUrlInEnv, testKVConnection } from "@/lib/kv-helper"

export async function GET() {
  try {
    // Tambahkan pengecekan khusus untuk Redis URL
    const redisUrl = process.env.KV_URL || process.env.REDIS_URL
    let redisUrlDetected = false
    let redisHostname = null

    if (redisUrl && (redisUrl.startsWith("redis://") || redisUrl.startsWith("rediss://"))) {
      redisUrlDetected = true
      try {
        // Format: redis[s]://username:password@hostname:port
        const match = redisUrl.match(/redis(s?):\/\/.*?@([^:]+):/)
        if (match && match[2]) {
          redisHostname = match[2]
        }
      } catch (e) {
        console.error("Error parsing Redis URL:", e)
      }
    }

    // Get KV connection details
    const kvDetails = getKVConnectionDetails()
    const redisUrlInfo = findRedisUrlInEnv()

    // Check environment variables
    const envVars = {
      KV_REST_API_URL: process.env.KV_REST_API_URL ? `${process.env.KV_REST_API_URL.substring(0, 30)}...` : "not set",
      KV_REST_API_URL_NORMALIZED: kvDetails.normalizedUrl
        ? `${kvDetails.normalizedUrl.substring(0, 30)}...`
        : "not set",
      KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN
        ? `${process.env.KV_REST_API_TOKEN.substring(0, 5)}...`
        : "not set",
      KV_REST_API_TOKEN_LENGTH: process.env.KV_REST_API_TOKEN?.length || 0,
      NODE_ENV: process.env.NODE_ENV,
      // Tambahkan informasi Redis URL
      REDIS_URL_DETECTED: redisUrlDetected,
      REDIS_HOSTNAME: redisHostname,
    }

    // Check for additional environment variables that might be causing confusion
    const additionalVars = {}
    for (const key in process.env) {
      if (key.includes("KV_") || key.includes("UPSTASH_") || key.includes("REDIS_")) {
        additionalVars[key] = `${process.env[key]?.substring(0, 10)}...`
      }
    }

    let kvStatus = "not tested"
    let kvError = null
    let testResults = null

    // Jika Redis URL terdeteksi, coba tes koneksi langsung
    if (redisUrlDetected) {
      try {
        // Tes koneksi sederhana
        const { kv } = await import("@vercel/kv")
        const testKey = `test_key_${Date.now()}`
        const testValue = `test_value_${Date.now()}`

        await kv.set(testKey, testValue)
        const retrievedValue = await kv.get(testKey)
        await kv.del(testKey)

        if (retrievedValue === testValue) {
          kvStatus = "working correctly"
          testResults = {
            pingResult: "OK",
            testKey,
            testValue,
            retrievedValue,
            match: true,
            usingRedisUrl: true,
          }
        } else {
          kvStatus = "connection failed"
          kvError = "Value mismatch in Redis test"
        }
      } catch (error) {
        kvStatus = "connection failed"
        kvError = error instanceof Error ? error.message : String(error)
      }
    } else if (kvDetails.isValid) {
      // Gunakan metode pengujian yang ada jika tidak ada Redis URL
      try {
        const connectionTest = await testKVConnection()

        if (connectionTest.success) {
          kvStatus = "working correctly"
          testResults = connectionTest.details
        } else {
          kvStatus = "connection failed"
          kvError = connectionTest.message
        }
      } catch (error) {
        kvStatus = "connection failed"
        kvError = error instanceof Error ? error.message : String(error)
      }
    } else {
      kvStatus = "invalid configuration"
    }

    // Try to parse Redis URL if present
    let redisUrlParseInfo = null
    if (
      process.env.KV_REST_API_URL &&
      (process.env.KV_REST_API_URL.startsWith("redis://") || process.env.KV_REST_API_URL.startsWith("rediss://"))
    ) {
      try {
        const url = process.env.KV_REST_API_URL
        const match = url.match(/redis(s?):\/\/(.*?):(.*?)@([^:]+):(\d+)/)
        if (match) {
          redisUrlParseInfo = {
            protocol: match[1] ? "rediss" : "redis",
            username: match[2],
            password: `${match[3].substring(0, 5)}...`,
            hostname: match[4],
            port: match[5],
            normalizedUrl: normalizeKVUrl(url),
          }
        }
      } catch (e) {
        redisUrlParseInfo = { error: String(e) }
      }
    }

    // Ubah rekomendasi untuk menangani Redis URL
    const recommendations = []

    if (redisUrlDetected && kvStatus === "working correctly") {
      recommendations.push(
        "Anda menggunakan Redis URL dan koneksi berfungsi dengan baik. Tidak perlu tindakan lebih lanjut.",
      )
    } else if (!kvDetails.isValid && !redisUrlDetected) {
      recommendations.push(
        "Your KV_REST_API_URL is not valid. It should be a full HTTPS URL like https://your-database.upstash.io",
      )
    }

    if (!kvDetails.isValid) {
      recommendations.push(
        "Your KV_REST_API_URL is not valid. It should be a full HTTPS URL like https://your-database.upstash.io",
      )
    }

    if (kvDetails.url && /^[a-zA-Z0-9]+$/.test(kvDetails.url)) {
      recommendations.push(
        "Your KV_REST_API_URL appears to be just a token or ID, not a valid URL. Check your environment variables.",
      )
    }

    if (redisUrlInfo.found) {
      recommendations.push(
        `Found a Redis URL in ${redisUrlInfo.key}. You might want to use this as your KV_REST_API_URL instead, but convert it to an HTTPS URL.`,
      )
    }

    if (kvError && kvError.includes("invalid URL")) {
      recommendations.push(
        "The URL format is invalid. Make sure it starts with https:// and is a valid Upstash endpoint.",
      )
    }

    // Add recommendations for successful connections
    if (kvStatus === "working correctly") {
      recommendations.push("Your database connection is working correctly. No action needed.")
    }

    const adapterInfo = {
      name: "Example Adapter",
      version: "1.0.0",
    }

    // Tambahkan adapterInfo ke respons
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      environmentVariables: envVars,
      additionalKVVariables: additionalVars,
      kvStatus,
      kvError,
      testResults,
      redisUrlParseInfo,
      redisUrlFound: redisUrlInfo.found,
      redisUrlInfo: redisUrlInfo.found
        ? {
            key: redisUrlInfo.key,
            url: `${redisUrlInfo.url?.substring(0, 20)}...`,
          }
        : null,
      kvDetails: {
        originalUrl: kvDetails.url ? `${kvDetails.url.substring(0, 30)}...` : "not set",
        normalizedUrl: kvDetails.normalizedUrl ? `${kvDetails.normalizedUrl.substring(0, 30)}...` : "not set",
        hasToken: !!kvDetails.token,
        tokenLength: kvDetails.token?.length || 0,
        isValid: kvDetails.isValid,
        error: kvDetails.error,
      },
      adapterInfo, // Tambahkan informasi adapter
      recommendations,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

