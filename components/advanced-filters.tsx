"use client"

import { memo, useState } from "react"
import { Button } from "@/components/ui/button"

interface AdvancedFiltersProps {
  filters: {
    status: string
    latency: string
    favorites: boolean
    lastChecked: string
  }
  onApplyFilters: (filters: {
    status: string
    latency: string
    favorites: boolean
    lastChecked: string
  }) => void
  onClose: () => void
}

export const AdvancedFilters = memo(function AdvancedFilters({
  filters,
  onApplyFilters,
  onClose,
}: AdvancedFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters)

  const handleChange = (key: string, value: string | boolean) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleApply = () => {
    onApplyFilters(localFilters)
    onClose()
  }

  const handleReset = () => {
    const resetFilters = {
      status: "all",
      latency: "all",
      favorites: false,
      lastChecked: "all",
    }
    setLocalFilters(resetFilters)
    onApplyFilters(resetFilters)
  }

  return (
    <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-md rounded-lg p-3 animate-fadeIn">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium">Advanced Filters</h3>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Status Filter */}
        <div>
          <label className="block text-xs mb-1">Status</label>
          <select
            value={localFilters.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className="tech-select w-full text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="unchecked">Unchecked Only</option>
          </select>
        </div>

        {/* Latency Filter */}
        <div>
          <label className="block text-xs mb-1">Latency</label>
          <select
            value={localFilters.latency}
            onChange={(e) => handleChange("latency", e.target.value)}
            className="tech-select w-full text-xs"
          >
            <option value="all">All Latencies</option>
            <option value="fast">Fast (&lt;200ms)</option>
            <option value="medium">Medium (200-500ms)</option>
            <option value="slow">Slow (&gt;500ms)</option>
          </select>
        </div>

        {/* Last Checked Filter */}
        <div>
          <label className="block text-xs mb-1">Last Checked</label>
          <select
            value={localFilters.lastChecked}
            onChange={(e) => handleChange("lastChecked", e.target.value)}
            className="tech-select w-full text-xs"
          >
            <option value="all">Any Time</option>
            <option value="recent">Recent (≤1 hour)</option>
            <option value="old">Older (&gt;1 hour)</option>
          </select>
        </div>

        {/* Favorites Filter */}
        <div className="flex items-end">
          <label className="flex items-center text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={localFilters.favorites}
              onChange={(e) => handleChange("favorites", e.target.checked)}
              className="mr-2"
            />
            Show Favorites Only
          </label>
        </div>
      </div>

      <div className="flex justify-end mt-3 gap-2">
        <Button
          onClick={handleReset}
          className="text-xs py-1 px-3 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
        >
          Reset
        </Button>
        <Button onClick={handleApply} className="text-xs py-1 px-3 tech-button">
          Apply Filters
        </Button>
      </div>
    </div>
  )
})

