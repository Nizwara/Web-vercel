import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ip = searchParams.get("ip")
  const port = searchParams.get("port")

  if (!ip || !port) {
    return NextResponse.json({ error: "IP and port are required" }, { status: 400 })
  }

  try {
    const response = await fetch(`https://proxyip.biz.id/${ip}:${port}`, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error checking proxy:", error)
    return NextResponse.json(
      {
        error: "Failed to check proxy status",
        proxyip: false,
        latency: "Error",
      },
      { status: 500 },
    )
  }
}

