"use client"

import { useTheme } from "@/contexts/theme-context"
import { Button } from "@/components/ui/button"
import { SunIcon, MoonIcon } from "lucide-react"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="icon"
      className={`rounded-full w-9 h-9 backdrop-blur-md border transition-all duration-300 ${
        theme === "light"
          ? "bg-white/20 border-white/30 hover:bg-white/30"
          : "bg-gray-800/30 hover:bg-gray-800/50 border-gray-700/30 neon-box"
      }`}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
    >
      {theme === "light" ? (
        <MoonIcon className="h-5 w-5 text-tech-accent" />
      ) : (
        <SunIcon className="h-5 w-5 text-yellow-400" />
      )}
    </Button>
  )
}

