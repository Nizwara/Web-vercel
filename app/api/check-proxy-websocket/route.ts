import { type NextRequest, NextResponse } from "next/server"
import net from "net"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ip = searchParams.get("ip")
  const port = searchParams.get("port")
  const country = searchParams.get("country") || ""
  const org = searchParams.get("org") || ""

  if (!ip || !port) {
    return NextResponse.json({ error: "IP and port are required" }, { status: 400 })
  }

  try {
    // Mulai waktu untuk menghitung latensi
    const startTime = Date.now()

    // Periksa koneksi proxy menggunakan WebSocket
    const isActive = await checkProxyWithWebSocket(ip, Number.parseInt(port))
    const endTime = Date.now()
    const latency = isActive ? `${endTime - startTime}ms` : "Timeout"

    return NextResponse.json({
      proxyip: isActive,
      latency: latency,
      country: country,
      org: org,
      method: "websocket",
    })
  } catch (error) {
    console.error("Error checking proxy:", error)
    return NextResponse.json(
      {
        error: "Failed to check proxy status",
        proxyip: false,
        latency: "Error",
        method: "websocket",
      },
      { status: 500 },
    )
  }
}

// Fungsi untuk memeriksa proxy menggunakan WebSocket
async function checkProxyWithWebSocket(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Buat koneksi TCP untuk simulasi WebSocket
      const socket = new net.Socket()

      // Set timeout untuk koneksi
      socket.setTimeout(3000)

      // Coba koneksi ke proxy
      socket.connect(port, host, () => {
        // Koneksi berhasil
        socket.end()
        resolve(true)
      })

      // Tangani timeout
      socket.on("timeout", () => {
        socket.destroy()
        resolve(false)
      })

      // Tangani error
      socket.on("error", () => {
        socket.destroy()
        resolve(false)
      })
    } catch (error) {
      console.error("Error in WebSocket check:", error)
      resolve(false)
    }
  })
}

