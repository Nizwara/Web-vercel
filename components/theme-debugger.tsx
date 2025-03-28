"use client"

import { useState } from "react"
import { useTheme } from "./theme-provider"

export function ThemeDebugger() {
  const { theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return null
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "10px",
        right: "10px",
        zIndex: 9999,
        backgroundColor: theme.card,
        color: theme.text,
        padding: "12px",
        borderRadius: "8px",
        boxShadow: "0 0 20px rgba(0,0,0,0.3)",
        width: "300px",
        maxHeight: "80vh",
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <h3 style={{ margin: 0 }}>Theme Debugger</h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: "none",
            border: "none",
            color: theme.muted,
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: "8px" }}>
        <strong>Current Theme:</strong> {theme.name}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {Object.entries(theme).map(([key, value]) => {
          if (key === "name") return null

          return (
            <div
              key={key}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "8px",
                border: `1px solid ${theme.muted}50`,
                borderRadius: "4px",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  backgroundColor: value,
                  borderRadius: "4px",
                  marginBottom: "4px",
                  border: `1px solid ${theme.muted}50`,
                }}
              />
              <div style={{ fontSize: "12px" }}>{key}</div>
              <div style={{ fontSize: "10px", color: theme.muted }}>{value}</div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: "12px", fontSize: "12px" }}>
        <div>
          <strong>Applied to:</strong>
        </div>
        <ul style={{ margin: "4px 0 0 0", paddingLeft: "16px" }}>
          <li>body: {document.body.style.backgroundColor || "not directly set"}</li>
          <li>:root vars: {document.documentElement.style.getPropertyValue("--color-background") || "not set"}</li>
          <li>Custom style tag: {document.getElementById("custom-theme-styles") ? "active" : "not found"}</li>
        </ul>
      </div>

      <button
        onClick={() => {
          // Force refresh all styles
          const styleEl = document.getElementById("custom-theme-styles")
          if (styleEl) {
            styleEl.remove()
            setTimeout(() => window.location.reload(), 100)
          }
        }}
        style={{
          marginTop: "12px",
          padding: "4px 8px",
          backgroundColor: theme.accent,
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          width: "100%",
        }}
      >
        Force Refresh Styles
      </button>
    </div>
  )
}

