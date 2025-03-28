"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"

export interface ThemeOption {
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

const defaultTheme: ThemeOption = {
  name: "Default",
  primary: "#1a1a2e",
  secondary: "#16213e",
  background: "#0f3460",
  card: "#162447",
  text: "#e6e6e6",
  muted: "#a0a0a0",
  accent: "#0099ff",
  success: "#00cc66",
}

interface ThemeContextType {
  theme: ThemeOption
  setTheme: (theme: ThemeOption) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useLocalStorage<ThemeOption>("user_theme", defaultTheme)
  const [mounted, setMounted] = useState(false)

  // Only apply theme after component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Apply theme to document body directly with more aggressive approach
  useEffect(() => {
    if (!mounted || !theme) return

    // Create a style element to override all theme-related styles
    const styleId = "custom-theme-styles"
    let styleEl = document.getElementById(styleId) as HTMLStyleElement

    if (!styleEl) {
      styleEl = document.createElement("style")
      styleEl.id = styleId
      document.head.appendChild(styleEl)
    }

    // Create CSS with !important to override everything
    const css = `
  :root {
    --color-primary: ${theme.primary} !important;
    --color-secondary: ${theme.secondary} !important;
    --color-background: ${theme.background} !important;
    --color-card: ${theme.card} !important;
    --color-text: ${theme.text} !important;
    --color-muted: ${theme.muted} !important;
    --color-accent: ${theme.accent} !important;
    --color-success: ${theme.success} !important;
  }
  
  body {
    background-color: ${theme.background} !important;
    color: ${theme.text} !important;
  }
  
  .tech-card, .bg-tech-card, [class*="bg-tech-card"] {
    background-color: ${theme.card} !important;
  }
  
  .tech-bg, .bg-tech-bg, [class*="bg-tech-bg"] {
    background-color: ${theme.background} !important;
  }
  
  .tech-text, .text-tech-text, [class*="text-tech-text"] {
    color: ${theme.text} !important;
  }
  
  .tech-muted, .text-tech-muted, [class*="text-tech-muted"] {
    color: ${theme.muted} !important;
  }
  
  .bg-tech-accent, [class*="bg-tech-accent"] {
    background-color: ${theme.accent} !important;
  }
  
  .text-tech-accent, [class*="text-tech-accent"] {
    color: ${theme.accent} !important;
  }
  
  .tech-success, .text-tech-success, [class*="text-tech-success"] {
    color: ${theme.success} !important;
  }
  
  .bg-tech-success, [class*="bg-tech-success"] {
    background-color: ${theme.success} !important;
  }
  
  /* Override any Green Mars specific styles */
  .light .tech-bg, .dark .tech-bg {
    background-color: ${theme.background} !important;
  }
  
  .light .tech-card, .dark .tech-card {
    background-color: ${theme.card} !important;
  }
  
  /* Override button styles */
  button.bg-tech-accent, button[class*="bg-tech-accent"] {
    background-color: ${theme.accent} !important;
    color: white !important;
  }
  
  /* Override any container backgrounds */
  [class*="container"], [class*="wrapper"], [class*="page"], main, section, header, footer {
    background-color: ${theme.background} !important;
  }
  
  /* Force all direct children of body to use theme background */
  body > * {
    background-color: ${theme.background} !important;
  }

  /* Fix text contrast issues */
  .dark .text-gray-800, .dark .text-black, .dark .text-gray-900 {
    color: #e2e8f0 !important; /* Light color for dark backgrounds */
  }
  
  .light .text-white, .light .text-gray-100, .light .text-gray-200 {
    color: #1a1a1a !important; /* Dark color for light backgrounds */
  }
  
  /* Ensure dropdown menus have proper contrast */
  .dark [role="menu"], .dark [role="listbox"], .dark [role="dialog"] {
    background-color: ${theme.card} !important;
    color: ${theme.text} !important;
  }
  
  /* Ensure form elements have proper contrast */
  .dark input, .dark select, .dark textarea {
    background-color: rgba(15, 23, 42, 0.7) !important;
    color: ${theme.text} !important;
  }
  
  .light input, .light select, .light textarea {
    background-color: rgba(255, 255, 255, 0.7) !important;
    color: #1a1a1a !important;
  }
  
  /* Fix pre and code blocks */
  pre, code, .tech-terminal {
    color: #f8f9fa !important;
  }
`

    styleEl.textContent = css

    // Also apply directly to elements for immediate effect
    document.body.style.backgroundColor = `${theme.background} !important`
    document.body.style.color = `${theme.text} !important`

    // Force update on all major containers
    document.querySelectorAll('main, div[class*="container"], div[class*="wrapper"]').forEach((el) => {
      ;(el as HTMLElement).style.backgroundColor = `${theme.background} !important`
    })

    console.log("Theme Provider: Applied theme", theme.name, "with aggressive overrides")
  }, [theme, mounted])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

