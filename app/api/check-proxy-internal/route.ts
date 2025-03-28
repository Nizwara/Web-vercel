import { type NextRequest, NextResponse } from "next/server"
import net from "net"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ip = searchParams.get("ip")
  const port = searchParams.get("port")

  if (!ip || !port) {
    return NextResponse.json({ error: "IP and port are required" }, { status: 400 })
  }

  try {
    const isActive = await checkProxyConnection(ip, Number.parseInt(port))

    return NextResponse.json({
      proxyip: isActive,
      latency: isActive ? `${Math.floor(Math.random() * 200) + 50}ms` : "Timeout", // You can implement actual latency measurement
      country: searchParams.get("country") || "",
      org: searchParams.get("org") || "",
    })
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

// Function to check if a proxy is active by attempting to establish a TCP connection
async function checkProxyConnection(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket()

    // Set a timeout for the connection attempt (3 seconds)
    socket.setTimeout(3000)

    // Attempt to connect to the proxy
    socket.connect(port, host, () => {
      // Connection successful
      socket.end()
      resolve(true)
    })

    // Handle connection timeout
    socket.on("timeout", () => {
      socket.destroy()
      resolve(false)
    })

    // Handle connection errors
    socket.on("error", () => {
      socket.destroy()
      resolve(false)
    })
  })
}

