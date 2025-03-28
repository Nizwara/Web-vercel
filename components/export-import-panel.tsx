"use client"

import type React from "react"

import { memo, useState, useRef } from "react"
import { Button } from "@/components/ui/button"

interface ExportImportPanelProps {
  onExport: () => void
  onImport: (jsonData: string) => void
  onClose: () => void
}

export const ExportImportPanel = memo(function ExportImportPanel({
  onExport,
  onImport,
  onClose,
}: ExportImportPanelProps) {
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const jsonData = event.target?.result as string
        // Validate JSON
        JSON.parse(jsonData)
        onImport(jsonData)
        setImportError(null)
      } catch (error) {
        setImportError("Invalid JSON file. Please select a valid configuration file.")
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-md rounded-lg p-3 animate-fadeIn">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium">Export/Import Configuration</h3>
        <button onClick={onClose} className="text-tech-muted hover:text-tech-accent" aria-label="Close">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white/10 dark:bg-gray-900/10 p-3 rounded-lg">
          <h4 className="text-xs font-medium mb-2">Export Configuration</h4>
          <p className="text-xs text-tech-muted mb-3">
            Export your proxy status, favorites, and settings to a JSON file.
          </p>
          <Button
            onClick={onExport}
            className="text-xs py-1 px-3 tech-button w-full flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export Configuration
          </Button>
        </div>

        <div className="bg-white/10 dark:bg-gray-900/10 p-3 rounded-lg">
          <h4 className="text-xs font-medium mb-2">Import Configuration</h4>
          <p className="text-xs text-tech-muted mb-3">Import previously exported configuration from a JSON file.</p>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
          <Button
            onClick={handleImportClick}
            className="text-xs py-1 px-3 tech-button w-full flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Import Configuration
          </Button>
          {importError && <p className="text-xs text-red-500 mt-2">{importError}</p>}
        </div>
      </div>
    </div>
  )
})

