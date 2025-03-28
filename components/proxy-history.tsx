"use client"

import { memo } from "react"

interface ProxyHistoryProps {
  history?: Array<{
    timestamp: number
    isActive: boolean
    latency: string
  }>
  proxyKey: string
}

export const ProxyHistory = memo(function ProxyHistory({ history, proxyKey }: ProxyHistoryProps) {
  if (!history || history.length === 0) {
    return <div className="text-center p-4 text-tech-muted">No history available for this proxy.</div>
  }

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium mb-2">Status History</h3>
      <div className="bg-white/10 dark:bg-gray-800/10 rounded-lg p-2 max-h-40 overflow-y-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/10 dark:border-gray-700/10">
              <th className="text-left p-1">Time</th>
              <th className="text-left p-1">Status</th>
              <th className="text-left p-1">Latency</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry, index) => (
              <tr
                key={`${proxyKey}-${index}`}
                className="border-b border-white/5 dark:border-gray-700/5 hover:bg-white/5 dark:hover:bg-gray-700/5"
              >
                <td className="p-1">{new Date(entry.timestamp).toLocaleString()}</td>
                <td className="p-1">
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-1 ${
                      entry.isActive ? "bg-tech-success" : "bg-red-500"
                    }`}
                  ></span>
                  {entry.isActive ? "Active" : "Inactive"}
                </td>
                <td className="p-1">{entry.latency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
})

