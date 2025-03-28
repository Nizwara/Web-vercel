"use client"

import { useState, useEffect, useRef } from "react"

interface DOMProxyCheckerProps {
  proxyIP: string
  proxyPort: string
  onResult: (result: { isActive: boolean; latency: string }) => void
}

export function DOMProxyChecker({ proxyIP, proxyPort, onResult }: DOMProxyCheckerProps) {
  const [isChecking, setIsChecking] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

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
  }

  // Fungsi untuk memeriksa proxy menggunakan DOM
  const checkProxy = () => {
    setIsChecking(true)

    // Bersihkan resources sebelumnya jika ada
    cleanup()

    // Mulai waktu untuk menghitung latensi
    const startTime = Date.now()

    // Buat iframe tersembunyi
    const iframe = document.createElement("iframe")
    iframe.style.display = "none"
    document.body.appendChild(iframe)
    iframeRef.current = iframe

    // Set timeout untuk menangani kasus proxy tidak aktif
    timeoutRef.current = setTimeout(() => {
      onResult({ isActive: false, latency: "Timeout" })
      setIsChecking(false)
      cleanup()
    }, 5000)

    // Coba metode fetch terlebih dahulu
    fetch(`http://${proxyIP}:${proxyPort}`, {
      mode: "no-cors",
      cache: "no-cache",
      headers: {
        Pragma: "no-cache",
      },
    })
      .then(() => {
        const endTime = Date.now()
        const latency = `${endTime - startTime}ms`
        onResult({ isActive: true, latency })
        setIsChecking(false)
        cleanup()
      })
      .catch(() => {
        // Jika fetch gagal, coba metode iframe
        try {
          iframe.onload = () => {
            const endTime = Date.now()
            const latency = `${endTime - startTime}ms`
            onResult({ isActive: true, latency })
            setIsChecking(false)
            cleanup()
          }

          iframe.onerror = () => {
            onResult({ isActive: false, latency: "Error" })
            setIsChecking(false)
            cleanup()
          }

          // Coba muat URL proxy
          iframe.src = `http://${proxyIP}:${proxyPort}`
        } catch (err) {
          onResult({ isActive: false, latency: "Error" })
          setIsChecking(false)
          cleanup()
        }
      })
  }

  // Bersihkan resources saat komponen unmount
  useEffect(() => {
    return cleanup
  }, [])

  return <div style={{ display: "none" }}>{/* Komponen ini tidak merender apa pun yang terlihat */}</div>
}

