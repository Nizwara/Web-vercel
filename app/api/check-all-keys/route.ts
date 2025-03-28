import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Import KV
    const { kv } = await import("@vercel/kv")

    // Get all keys
    const keys = await kv.keys("*")

    // Get values for all keys
    const results = await Promise.all(
      keys.map(async (key) => {
        try {
          const value = await kv.get(key)
          return {
            key,
            value,
            type: typeof value,
            hasValue: value !== null && value !== undefined,
          }
        } catch (error) {
          return {
            key,
            error: error instanceof Error ? error.message : String(error),
            hasValue: false,
          }
        }
      }),
    )

    return NextResponse.json({
      success: true,
      count: keys.length,
      keys,
      results,
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

