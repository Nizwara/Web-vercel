"use client"

import { memo, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useLocalStorage } from "@/hooks/use-local-storage"

interface ThemeCustomizerProps {
  onClose: () => void
}

export const ThemeCustomizer = memo(function ThemeCustomizer({ onClose }: ThemeCustomizerProps) {
  const [customTheme, setCustomTheme] = useLocalStorage("custom_theme", {
    primary: "#20c997",
    accent: "#38d9a9",
    background: "#f8f9fa",
    card: "rgba(255, 255, 255, 0.7)",
    text: "#2d3436",
    muted: "#636e72",
  })

  const [localTheme, setLocalTheme] = useState(customTheme)

  // Apply theme when component mounts and when theme changes
  useEffect(() => {
    applyTheme(customTheme)
  }, [customTheme])

  const applyTheme = (theme: typeof customTheme) => {
    const root = document.documentElement

    // Apply light theme colors
    root.style.setProperty("--primary-color", theme.primary)
    root.style.setProperty("--accent-color", theme.accent)
    root.style.setProperty("--background-color", theme.background)
    root.style.setProperty("--card-color", theme.card)
    root.style.setProperty("--text-color", theme.text)
    root.style.setProperty("--muted-color", theme.muted)

    // Update CSS variables
    document.body.style.setProperty("--tech-accent", theme.primary)
    document.body.style.setProperty("--tech-highlight", theme.accent)
  }

  const handleColorChange = (key: keyof typeof localTheme, value: string) => {
    setLocalTheme((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSave = () => {
    setCustomTheme(localTheme)
    onClose()
  }

  const handleReset = () => {
    const defaultTheme = {
      primary: "#20c997",
      accent: "#38d9a9",
      background: "#f8f9fa",
      card: "rgba(255, 255, 255, 0.7)",
      text: "#2d3436",
      muted: "#636e72",
    }
    setLocalTheme(defaultTheme)
    setCustomTheme(defaultTheme)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full animate-scaleIn">
        <div className="p-4 bg-gradient-to-r from-tech-accent to-tech-highlight text-white flex justify-between items-center">
          <h3 className="text-lg font-bold">Customize Theme</h3>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
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
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs mb-1">Primary Color</label>
              <div className="flex items-center">
                <input
                  type="color"
                  value={localTheme.primary}
                  onChange={(e) => handleColorChange("primary", e.target.value)}
                  className="w-8 h-8 rounded mr-2"
                />
                <input
                  type="text"
                  value={localTheme.primary}
                  onChange={(e) => handleColorChange("primary", e.target.value)}
                  className="tech-input text-xs flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1">Accent Color</label>
              <div className="flex items-center">
                <input
                  type="color"
                  value={localTheme.accent}
                  onChange={(e) => handleColorChange("accent", e.target.value)}
                  className="w-8 h-8 rounded mr-2"
                />
                <input
                  type="text"
                  value={localTheme.accent}
                  onChange={(e) => handleColorChange("accent", e.target.value)}
                  className="tech-input text-xs flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1">Background Color</label>
              <div className="flex items-center">
                <input
                  type="color"
                  value={localTheme.background}
                  onChange={(e) => handleColorChange("background", e.target.value)}
                  className="w-8 h-8 rounded mr-2"
                />
                <input
                  type="text"
                  value={localTheme.background}
                  onChange={(e) => handleColorChange("background", e.target.value)}
                  className="tech-input text-xs flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1">Card Color</label>
              <div className="flex items-center">
                <input
                  type="color"
                  value={localTheme.card}
                  onChange={(e) => handleColorChange("card", e.target.value)}
                  className="w-8 h-8 rounded mr-2"
                />
                <input
                  type="text"
                  value={localTheme.card}
                  onChange={(e) => handleColorChange("card", e.target.value)}
                  className="tech-input text-xs flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1">Text Color</label>
              <div className="flex items-center">
                <input
                  type="color"
                  value={localTheme.text}
                  onChange={(e) => handleColorChange("text", e.target.value)}
                  className="w-8 h-8 rounded mr-2"
                />
                <input
                  type="text"
                  value={localTheme.text}
                  onChange={(e) => handleColorChange("text", e.target.value)}
                  className="tech-input text-xs flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1">Muted Text Color</label>
              <div className="flex items-center">
                <input
                  type="color"
                  value={localTheme.muted}
                  onChange={(e) => handleColorChange("muted", e.target.value)}
                  className="w-8 h-8 rounded mr-2"
                />
                <input
                  type="text"
                  value={localTheme.muted}
                  onChange={(e) => handleColorChange("muted", e.target.value)}
                  className="tech-input text-xs flex-1"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-white/10 dark:bg-gray-800/10 rounded-lg mb-6">
            <h4 className="text-sm font-medium mb-2">Preview</h4>
            <div className="p-3 rounded-lg" style={{ backgroundColor: localTheme.background }}>
              <div
                className="p-3 rounded-lg mb-2"
                style={{
                  backgroundColor: localTheme.card,
                  color: localTheme.text,
                }}
              >
                <h5 style={{ color: localTheme.primary }}>Sample Card</h5>
                <p style={{ color: localTheme.text }}>This is how your theme will look.</p>
                <p style={{ color: localTheme.muted }}>This is muted text.</p>
                <button
                  className="px-3 py-1 rounded-md text-white text-xs mt-2"
                  style={{ backgroundColor: localTheme.accent }}
                >
                  Sample Button
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              onClick={handleReset}
              className="text-xs py-1 px-3 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
            >
              Reset to Default
            </Button>
            <Button onClick={handleSave} className="text-xs py-1 px-3 tech-button">
              Save Theme
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
})

