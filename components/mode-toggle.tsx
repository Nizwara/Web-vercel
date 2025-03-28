"use client"

import { useState, useEffect } from "react"
import { useTheme } from "@/components/theme-provider"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Pastikan komponen hanya dirender setelah mounting untuk menghindari perbedaan hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Cek apakah tema saat ini adalah tema gelap
  const isDarkMode =
    theme.background.startsWith("#0") ||
    theme.background.startsWith("#1") ||
    theme.background.startsWith("#2") ||
    theme.name?.toLowerCase().includes("dark")

  // Tema default untuk mode terang dan gelap
  const lightTheme = {
    name: "Light Mode",
    primary: "#ffffff",
    secondary: "#f8f9fa",
    background: "#f0f2f5",
    card: "#ffffff",
    text: "#1a1a1a",
    muted: "#6c757d",
    accent: "#0099ff",
    success: "#00cc66",
  }

  const darkTheme = {
    name: "Default Blue",
    primary: "#1a1a2e",
    secondary: "#16213e",
    background: "#0f3460",
    card: "#162447",
    text: "#e6e6e6",
    muted: "#a0a0a0",
    accent: "#0099ff",
    success: "#00cc66",
  }

  const toggleMode = () => {
    setTheme(isDarkMode ? lightTheme : darkTheme)
  }

  // Ubah bagian return untuk menghapus posisi fixed dan menyesuaikan styling agar cocok dengan header

  return (
    <button
      onClick={toggleMode}
      className="relative group p-1 bg-white/20 dark:bg-gray-900/20 rounded-full hover:bg-white/30 dark:hover:bg-gray-900/30 transition-all duration-300"
      style={{
        backgroundColor: isDarkMode ? "rgba(240, 242, 245, 0.2)" : "rgba(26, 26, 46, 0.2)",
      }}
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white dark:text-white"
        >
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white dark:text-white"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      )}
    </button>
  )
}

