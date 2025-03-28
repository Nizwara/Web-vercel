"use client"

import { useState } from "react"
import { useTheme, type ThemeOption } from "@/components/theme-provider"

const predefinedThemes: ThemeOption[] = [
  {
    name: "Default Blue",
    primary: "#1a1a2e",
    secondary: "#16213e",
    background: "#0f3460",
    card: "#162447",
    text: "#e6e6e6",
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
    text: "#e6e6e6",
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
    text: "#e6e6e6",
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
    text: "#e6e6e6",
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
    text: "#e6e6e6",
    muted: "#a0a0a0",
    accent: "#ff7e5f",
    success: "#00cc66",
  },
]

export function DirectThemeSelector() {
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

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: "4px 8px",
          backgroundColor: `${theme.accent}20`,
          borderRadius: "4px",
          transition: "all 0.3s ease",
          fontSize: "12px",
          color: theme.text, // Ensure text is visible
        }}
      >
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: theme.accent,
          }}
        ></div>
        <span>Theme</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: "60px",
            right: "20px",
            width: "256px",
            backgroundColor: theme.card,
            color: theme.text, // Ensure text is visible
            borderRadius: "8px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
            zIndex: 9999,
            padding: "12px",
            animation: "fadeIn 0.3s ease-out",
            transition: "all 0.3s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h3
              style={{
                fontWeight: 500,
                color: theme.text,
              }}
            >
              Select Theme
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                color: theme.muted,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            {predefinedThemes.map((themeOption) => (
              <button
                key={themeOption.name}
                onClick={() => handleThemeChange(themeOption)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "6px 8px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: theme.name === themeOption.name ? `${themeOption.accent}20` : "transparent",
                  color: theme.name === themeOption.name ? themeOption.accent : theme.text,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    backgroundColor: themeOption.accent,
                  }}
                ></div>
                <span>{themeOption.name}</span>
              </button>
            ))}
          </div>

          <div
            style={{
              borderTop: `1px solid ${theme.muted}30`,
              paddingTop: "12px",
            }}
          >
            <h4
              style={{
                fontWeight: 500,
                fontSize: "14px",
                marginBottom: "8px",
                color: theme.text,
              }}
            >
              Custom Theme
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    color: theme.muted,
                    marginBottom: "4px",
                  }}
                >
                  Accent
                </label>
                <input
                  type="color"
                  value={customTheme.accent}
                  onChange={(e) => handleCustomThemeChange("accent", e.target.value)}
                  style={{
                    width: "100%",
                    height: "24px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    border: "none",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    color: theme.muted,
                    marginBottom: "4px",
                  }}
                >
                  Background
                </label>
                <input
                  type="color"
                  value={customTheme.background}
                  onChange={(e) => handleCustomThemeChange("background", e.target.value)}
                  style={{
                    width: "100%",
                    height: "24px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    border: "none",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    color: theme.muted,
                    marginBottom: "4px",
                  }}
                >
                  Card
                </label>
                <input
                  type="color"
                  value={customTheme.card}
                  onChange={(e) => handleCustomThemeChange("card", e.target.value)}
                  style={{
                    width: "100%",
                    height: "24px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    border: "none",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    color: theme.muted,
                    marginBottom: "4px",
                  }}
                >
                  Text
                </label>
                <input
                  type="color"
                  value={customTheme.text}
                  onChange={(e) => handleCustomThemeChange("text", e.target.value)}
                  style={{
                    width: "100%",
                    height: "24px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    border: "none",
                  }}
                />
              </div>
            </div>
            <button
              onClick={applyCustomTheme}
              style={{
                width: "100%",
                padding: "6px 0",
                backgroundColor: theme.accent,
                color: "white",
                borderRadius: "4px",
                fontSize: "14px",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              Apply Custom Theme
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

