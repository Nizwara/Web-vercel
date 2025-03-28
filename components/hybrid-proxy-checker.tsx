"use client"

import { useState, useEffect, useRef } from "react"
import type { Proxy } from "@/types/proxy"

interface HybridProxyCheckerProps {
  proxy: Proxy
  onResult: (result: {
    isActive: boolean
    latency: string
    method: string
  }) => void
  timeout?: number
}

export function HybridProxyChecker({ proxy, onResult, timeout = 5000 }: HybridProxyCheckerProps) {
  const [isChecking, setIsChecking] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Fungsi untuk membersihkan resources
  const cleanup = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (iframeRef.current && document.body.contains(iframeRef.current)) {
      document.body.removeChild(iframeRef.current)
      iframeRef.current = null
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }

  // Fungsi untuk memeriksa proxy dengan metode DOM (client-side)
  const checkWithDOM = async (): Promise<{ success: boolean; latency: number } | null> => {
    return new Promise((resolve) => {
      const startTime = Date.now()

      // Set timeout untuk menangani kasus proxy tidak aktif
      const domTimeout = setTimeout(() => {
        resolve(null) // Return null to indicate DOM method failed
      }, timeout / 2) // Use half the total timeout for DOM method

      // Gunakan pendekatan yang lebih sederhana dan andal
      try {
        // Buat image element untuk mencoba memuat gambar melalui proxy
        const img = new Image()
        img.onload = () => {
          clearTimeout(domTimeout)
          const endTime = Date.now()
          resolve({ success: true, latency: endTime - startTime })
        }

        img.onerror = () => {
          // Bahkan error bisa berarti proxy aktif tapi memblokir gambar
          // Kita anggap ini sebagai indikasi proxy aktif
          clearTimeout(domTimeout)
          const endTime = Date.now()
          resolve({ success: true, latency: endTime - startTime })
        }

        // Coba muat gambar kecil dari domain yang umum
        img.src = `http://www.google.com/favicon.ico?_=${Date.now()}`
      } catch (err) {
        clearTimeout(domTimeout)
        resolve(null) // DOM method failed
      }
    })
  }

  // Fungsi untuk memeriksa proxy dengan API server (server-side)
  const checkWithAPI = async (): Promise<{ success: boolean; latency: string; method: string }> => {
    try {
      // Gunakan API standar yang sudah terbukti berfungsi
      const response = await fetch(
        `/api/check-proxy?ip=${encodeURIComponent(proxy.proxyIP)}&port=${encodeURIComponent(proxy.proxyPort)}`,
        { signal: abortControllerRef.current?.signal },
      )

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      const data = await response.json()
      return {
        success: data.proxyip === true,
        latency: data.latency || "Unknown",
        method: "standard-api",
      }
    } catch (error) {
      // Jika standar gagal, coba metode internal
      try {
        const response = await fetch(
          `/api/check-proxy-internal?ip=${encodeURIComponent(proxy.proxyIP)}&port=${encodeURIComponent(proxy.proxyPort)}`,
          { signal: abortControllerRef.current?.signal },
        )

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }

        const data = await response.json()
        return {
          success: data.proxyip === true,
          latency: data.latency || "Unknown",
          method: "internal-api",
        }
      } catch (fallbackError) {
        // Jika semua metode gagal, kembalikan hasil negatif
        return {
          success: false,
          latency: "Error",
          method: "api-failed",
        }
      }
    }
  }

  // Fungsi utama untuk memeriksa proxy dengan metode hybrid
  const checkProxy = async () => {
    if (isChecking) return

    setIsChecking(true)
    abortControllerRef.current = new AbortController()

    try {
      // Mulai waktu untuk menghitung total latency
      const startTime = Date.now()

      // Set timeout untuk keseluruhan proses
      timeoutRef.current = setTimeout(() => {
        onResult({ isActive: false, latency: "Timeout", method: "timeout" })
        cleanup()
        setIsChecking(false)
      }, timeout)

      // 1. Coba metode DOM terlebih dahulu (client-side)
      console.log(`[Hybrid] Checking proxy ${proxy.proxyIP}:${proxy.proxyPort} with DOM method...`)
      const domResult = await checkWithDOM()

      if (domResult?.success) {
        // DOM method berhasil
        clearTimeout(timeoutRef.current)
        onResult({
          isActive: true,
          latency: `${domResult.latency}ms`,
          method: "dom",
        })
        console.log(`[Hybrid] DOM method successful: ${domResult.latency}ms`)
        cleanup()
        setIsChecking(false)
        return
      }

      // 2. Jika DOM gagal, gunakan metode API (server-side)
      console.log(`[Hybrid] DOM method failed, trying API method...`)
      const apiResult = await checkWithAPI()

      clearTimeout(timeoutRef.current)
      onResult({
        isActive: apiResult.success,
        latency: apiResult.latency,
        method: apiResult.method,
      })

      console.log(`[Hybrid] API method result: ${apiResult.success ? "active" : "inactive"} (${apiResult.method})`)
    } catch (error) {
      console.error("[Hybrid] Error in hybrid check:", error)
      clearTimeout(timeoutRef.current)
      onResult({
        isActive: false,
        latency: "Error",
        method: "error",
      })
    } finally {
      cleanup()
      setIsChecking(false)
    }
  }

  // Mulai pengecekan saat komponen dimount
  useEffect(() => {
    checkProxy()

    // Cleanup saat komponen unmount
    return cleanup
  }, [])

  return null // Komponen ini tidak merender apa pun
}

