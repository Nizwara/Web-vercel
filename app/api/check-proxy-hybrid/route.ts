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

    // Periksa koneksi proxy menggunakan metode yang lebih sederhana dan andal
    const result = await checkProxySimple(ip, Number.parseInt(port))

    const endTime = Date.now()
    const latency = result.isActive ? `${endTime - startTime}ms` : "Timeout"

    return NextResponse.json({
      proxyip: result.isActive,
      latency: latency,
      country: country,
      org: org,
      method: "hybrid-simple",
      details: result.details,
    })
  } catch (error) {
    console.error("Error checking proxy:", error)
    return NextResponse.json(
      {
        error: "Failed to check proxy status",
        proxyip: false,
        latency: "Error",
        method: "hybrid-error",
      },
      { status: 500 },
    )
  }
}

// Fungsi sederhana untuk memeriksa proxy
async function checkProxySimple(host: string, port: number): Promise<{ isActive: boolean; details?: string }> {
  return new Promise((resolve) => {
    try {
      const socket = new net.Socket()

      // Set timeout untuk koneksi (2 detik)
      socket.setTimeout(2000)

      // Coba koneksi ke proxy
      socket.connect(port, host, () => {
        // Koneksi berhasil
        socket.end()
        resolve({
          isActive: true,
          details: "TCP connection successful",
        })
      })

      // Handle timeout
      socket.on("timeout", () => {
        socket.destroy()
        resolve({
          isActive: false,
          details: "TCP connection timed out",
        })
      })

      // Handle error
      socket.on("error", (err) => {
        socket.destroy()
        resolve({
          isActive: false,
          details: `TCP connection error: ${err.message}`,
        })
      })
    } catch (error) {
      resolve({
        isActive: false,
        details: `TCP connection exception: ${error instanceof Error ? error.message : String(error)}`,
      })
    }
  })
}

