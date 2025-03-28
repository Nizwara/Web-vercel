import { type NextRequest, NextResponse } from "next/server"
import http from "http"
import { Socket } from "net"

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
    const startTime = Date.now()
    const result = await checkProxy(ip, Number.parseInt(port))
    const endTime = Date.now()
    const latency = endTime - startTime

    return NextResponse.json({
      proxyip: result.isActive,
      latency: result.isActive ? `${latency}ms` : "Timeout",
      country: country,
      org: org,
      details: result.details,
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

interface ProxyCheckResult {
  isActive: boolean
  details?: string
}

async function checkProxy(host: string, port: number): Promise<ProxyCheckResult> {
  return new Promise((resolve) => {
    // First, check if the proxy is reachable
    const socket = new Socket()
    let connectionSuccessful = false

    socket.setTimeout(5000)

    socket.on("connect", () => {
      connectionSuccessful = true
      socket.end()

      // If we can connect, try to make a request through the proxy
      testProxyRequest(host, port)
        .then((result) => {
          resolve({
            isActive: result.success,
            details: result.message,
          })
        })
        .catch(() => {
          resolve({
            isActive: true,
            details: "Connection successful but couldn't test HTTP request",
          })
        })
    })

    socket.on("timeout", () => {
      socket.destroy()
      resolve({
        isActive: false,
        details: "Connection timed out",
      })
    })

    socket.on("error", (err) => {
      socket.destroy()
      resolve({
        isActive: false,
        details: `Connection error: ${err.message}`,
      })
    })

    socket.connect(port, host)
  })
}

interface ProxyTestResult {
  success: boolean
  message: string
}

// Function to test if we can make a request through the proxy
async function testProxyRequest(host: string, port: number): Promise<ProxyTestResult> {
  return new Promise((resolve) => {
    // Try to connect to a known website through the proxy
    const testUrl = "http://example.com"
    const req = http.request({
      host: host,
      port: port,
      method: "CONNECT",
      path: "example.com:80",
    })

    req.on("connect", (res, socket) => {
      if (res.statusCode === 200) {
        // CONNECT successful, now try to make an HTTP request through the tunnel
        socket.write("GET / HTTP/1.1\r\n" + "Host: example.com\r\n" + "Connection: close\r\n" + "\r\n")

        let data = ""
        socket.on("data", (chunk) => {
          data += chunk.toString()
        })

        socket.on("end", () => {
          // Check if we got a valid HTTP response
          if (data.includes("HTTP/1.1 200 OK")) {
            resolve({
              success: true,
              message: "Proxy is working correctly",
            })
          } else {
            resolve({
              success: false,
              message: "Proxy connected but returned invalid response",
            })
          }
        })
      } else {
        resolve({
          success: false,
          message: `CONNECT failed with status: ${res.statusCode}`,
        })
      }
    })

    req.on("error", (err) => {
      resolve({
        success: false,
        message: `Request error: ${err.message}`,
      })
    })

    req.setTimeout(10000, () => {
      req.destroy()
      resolve({
        success: false,
        message: "Request timed out",
      })
    })

    req.end()
  })
}

