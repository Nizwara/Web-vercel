"use client"

import type React from "react"

import { memo, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CopyButtonProps {
  value: string
  children: React.ReactNode
  className?: string
}

export const CopyButton = memo(function CopyButton({ value, children, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      showNotification("Copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
      showNotification("Failed to copy")
    }
  }, [value])

  // Update the showNotification function with a more stylish animation and design

  const showNotification = useCallback((message: string) => {
    // Remove any existing notifications first
    const existingNotifications = document.querySelectorAll(".copy-notification")
    existingNotifications.forEach((notification) => {
      document.body.removeChild(notification)
    })

    // Create the notification container
    const popup = document.createElement("div")
    popup.className = "copy-notification"
    popup.style.position = "fixed"
    popup.style.bottom = "30px"
    popup.style.left = "50%"
    popup.style.transform = "translateX(-50%) translateY(100px)"
    popup.style.backgroundColor = "rgba(0, 0, 0, 0.8)"
    popup.style.color = "#fff"
    popup.style.padding = "12px 20px"
    popup.style.borderRadius = "8px"
    popup.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.3)"
    popup.style.zIndex = "9999"
    popup.style.transition = "all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)"
    popup.style.opacity = "0"
    popup.style.display = "flex"
    popup.style.alignItems = "center"
    popup.style.justifyContent = "center"
    popup.style.gap = "10px"
    popup.style.backdropFilter = "blur(5px)"
    popup.style.border = "1px solid rgba(255, 255, 255, 0.1)"
    popup.style.fontSize = "14px"
    popup.style.fontWeight = "500"

    // Add checkmark icon
    const icon = document.createElement("span")
    icon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5"></path>
      </svg>
    `
    icon.style.display = "flex"
    icon.style.alignItems = "center"
    icon.style.justifyContent = "center"
    icon.style.color = "#4ade80" // Green color for success
    icon.className = "checkmark-icon"

    // Add text
    const text = document.createElement("span")
    text.textContent = message

    // Append elements
    popup.appendChild(icon)
    popup.appendChild(text)
    document.body.appendChild(popup)

    // Animate in
    setTimeout(() => {
      popup.style.opacity = "1"
      popup.style.transform = "translateX(-50%) translateY(0)"
    }, 10)

    // Add pulse animation to the checkmark
    const keyframes = `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
      }
    `
    const style = document.createElement("style")
    style.innerHTML = keyframes
    document.head.appendChild(style)

    icon.style.animation = "pulse 1s ease-in-out infinite"

    // Animate out after delay
    setTimeout(() => {
      popup.style.opacity = "0"
      popup.style.transform = "translateX(-50%) translateY(20px)"

      // Remove the element after animation completes
      setTimeout(() => {
        if (document.body.contains(popup)) {
          document.body.removeChild(popup)
        }
        if (document.head.contains(style)) {
          document.head.removeChild(style)
        }
      }, 500)
    }, 2000)
  }, [])

  return (
    <Button
      onClick={handleCopy}
      className={cn(
        "transition-all duration-300",
        copied
          ? "bg-tech-success text-white"
          : "bg-white/50 hover:bg-white/70 text-tech-text border border-tech-accent/20",
        className,
      )}
    >
      {copied ? "Copied!" : children}
    </Button>
  )
})

