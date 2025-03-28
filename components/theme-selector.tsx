"use client"

import { useState, useEffect, useRef } from "react"
import { useTheme } from "@/components/theme-provider"

interface ThemeOption {
  name: string
  primary: string
  secondary: string
  background: string
  card: string
  text: string
  muted: string
  accent: string
  success: string
}

const predefinedThemes: ThemeOption[] = [
  {
    name: "Default",
    primary: "#1a1a2e",
    secondary: "#16213e",
    background: "#0f3460",
    card: "#162447",
    text: "#e6e6e6", // Light text for dark background
    muted: "#a0a0a0",
    accent: "#0099ff",
    success: "#00cc66",
  },
  {
    name: "Dark Cyberpunk",
    primary: "#0d0221",
    secondary: "#190b28",
    background: "#240b36",
    card: "#190b28",
    text: "#e6e6e6", // Light text for dark background
    muted: "#a0a0a0",
    accent: "#ff124f",
    success: "#00cc66",
  },
  {
    name: "Midnight Blue",
    primary: "#1a1b41",
    secondary: "#2d3047",
    background: "#2d3047",
    card: "#1a1b41",
    text: "#e6e6e6", // Light text for dark background
    muted: "#a0a0a0",
    accent: "#4f8a8b",
    success: "#00cc66",
  },
  {
    name: "Forest",
    primary: "#1b2a1b",
    secondary: "#2c3e2c",
    background: "#324a32",
    card: "#2c3e2c",
    text: "#e6e6e6", // Light text for dark background
    muted: "#a0a0a0",
    accent: "#5a8f5a",
    success: "#00cc66",
  },
  {
    name: "Sunset",
    primary: "#2b1b2c",
    secondary: "#3e2c3e",
    background: "#4a324a",
    card: "#3e2c3e",
    text: "#e6e6e6", // Light text for dark background
    muted: "#a0a0a0",
    accent: "#ff7e5f",
    success: "#00cc66",
  },
  {
    name: "Light Mode",
    primary: "#ffffff",
    secondary: "#f8f9fa",
    background: "#f0f2f5",
    card: "#ffffff",
    text: "#1a1a1a", // Dark text for light background
    muted: "#6c757d",
    accent: "#0099ff",
    success: "#00cc66",
  },
]

export function ThemeSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [customTheme, setCustomTheme] = useState<ThemeOption>({
    name: "Custom",
    primary: "#1a1a2e",
    secondary: "#16213e",
    background: "#0f3460",
    card: "#162447",
    text: "#e6e6e6",
    muted: "#a0a0a0",
    accent: "#0099ff",
    success: "#00cc66",
  })
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Effect to handle clicks outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    // Add event listener when dropdown is open
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    // Cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleThemeChange = (newTheme: ThemeOption) => {
    console.log("Changing theme to:", newTheme.name)
    setTheme(newTheme)
    setIsOpen(false)
  }

  const handleCustomThemeChange = (property: keyof ThemeOption, value: string) => {
    setCustomTheme((prev) => ({
      ...prev,
      [property]: value,
    }))
  }

  const applyCustomTheme = () => {
    console.log("Applying custom theme:", customTheme)
    setTheme(customTheme)
    setIsOpen(false)
  }

  // Create a portal for the dropdown to ensure it's at the root level of the DOM
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 bg-white/20 dark:bg-gray-800/20 rounded hover:bg-white/30 dark:hover:bg-gray-700/30 transition-all text-xs"
        aria-label="Open theme selector"
        style={{ backgroundColor: `${theme.accent}20` }}
      >
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme?.accent || "#0099ff" }}></div>
        <span>Theme</span>
      </button>

      {isOpen && (
        <div
          className="fixed top-16 right-4 w-64 bg-tech-card rounded-lg shadow-lg p-3 animate-fadeIn theme-transition"
          style={{
            zIndex: 9999,
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
            backgroundColor: theme.card,
            color: theme.text,
            border: `1px solid ${theme.accent}40`,
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Select Theme</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-tech-muted hover:text-tech-text"
              aria-label="Close theme selector"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 mb-4">
            {predefinedThemes.map((themeOption) => (
              <button
                key={themeOption.name}
                onClick={() => handleThemeChange(themeOption)}
                className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 theme-transition ${
                  theme?.name === themeOption.name ? "bg-tech-accent/20 text-tech-accent" : "hover:bg-white/10"
                }`}
                style={{
                  backgroundColor: theme?.name === themeOption.name ? `${themeOption.accent}20` : undefined,
                  color: theme?.name === themeOption.name ? themeOption.accent : undefined,
                }}
              >
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: themeOption.accent }}></div>
                <span>{themeOption.name}</span>
              </button>
            ))}
          </div>

          <div className="border-t border-white/10 pt-3" style={{ borderColor: `${theme.text}20` }}>
            <h4 className="font-medium mb-2 text-sm">Custom Theme</h4>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-xs text-tech-muted mb-1" style={{ color: theme.muted }}>
                  Accent
                </label>
                <input
                  type="color"
                  value={customTheme.accent}
                  onChange={(e) => handleCustomThemeChange("accent", e.target.value)}
                  className="w-full h-6 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs text-tech-muted mb-1" style={{ color: theme.muted }}>
                  Background
                </label>
                <input
                  type="color"
                  value={customTheme.background}
                  onChange={(e) => handleCustomThemeChange("background", e.target.value)}
                  className="w-full h-6 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs text-tech-muted mb-1" style={{ color: theme.muted }}>
                  Card
                </label>
                <input
                  type="color"
                  value={customTheme.card}
                  onChange={(e) => handleCustomThemeChange("card", e.target.value)}
                  className="w-full h-6 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs text-tech-muted mb-1" style={{ color: theme.muted }}>
                  Text
                </label>
                <input
                  type="color"
                  value={customTheme.text}
                  onChange={(e) => handleCustomThemeChange("text", e.target.value)}
                  className="w-full h-6 rounded cursor-pointer"
                />
              </div>
            </div>
            <button
              onClick={applyCustomTheme}
              className="w-full py-1.5 rounded text-sm hover:opacity-90 transition-colors theme-transition"
              style={{ backgroundColor: theme.accent, color: "#ffffff" }}
            >
              Apply Custom Theme
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

