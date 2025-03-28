// Tambahkan file API baru untuk metode DOM
import { type NextRequest, NextResponse } from "next/server"

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
    // Simulasikan pemeriksaan proxy dengan DOM
    // Dalam implementasi sebenarnya, ini akan dilakukan di sisi klien
    const isActive = Math.random() > 0.3 // Simulasi 70% proxy aktif
    const latency = isActive ? `${Math.floor(Math.random() * 200) + 50}ms` : "Timeout"

    return NextResponse.json({
      proxyip: isActive,
      latency: latency,
      country: country,
      org: org,
      method: "dom",
    })
  } catch (error) {
    console.error("Error checking proxy:", error)
    return NextResponse.json(
      {
        error: "Failed to check proxy status",
        proxyip: false,
        latency: "Error",
        method: "dom",
      },
      { status: 500 },
    )
  }
}

