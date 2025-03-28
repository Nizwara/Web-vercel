"use client"

import React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { debugKVConnection } from "@/lib/settings-service"

export function DebugPanel() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRawEnvVars, setShowRawEnvVars] = useState(false)

  const runDiagnostics = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await debugKVConnection()
      setDebugInfo(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    if (status === "working correctly") return "text-green-500 dark:text-green-400"
    if (status === "not tested") return "text-yellow-500 dark:text-yellow-400"
    return "text-red-500 dark:text-red-400"
  }

  return (
    <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-tech-text">
      <h3 className="font-medium mb-2">Database Connection Diagnostics</h3>

      <div className="flex gap-2 mb-4">
        <Button onClick={runDiagnostics} disabled={loading} className="bg-blue-500 hover:bg-blue-600 text-white">
          {loading ? "Running Diagnostics..." : "Run Diagnostics"}
        </Button>

        {debugInfo && (
          <Button
            onClick={() => setShowRawEnvVars(!showRawEnvVars)}
            className="bg-gray-500 hover:bg-gray-600 text-white"
          >
            {showRawEnvVars ? "Hide Raw Data" : "Show Raw Data"}
          </Button>
        )}
      </div>

      {error && (
        <div className="p-2 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded mb-4">{error}</div>
      )}

      {!debugInfo && !loading && (
        <div className="p-3 bg-white dark:bg-gray-800 rounded shadow-sm">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Click "Run Diagnostics" to check your database connection status.
          </p>
        </div>
      )}

      {debugInfo && !showRawEnvVars && (
        <div className="space-y-4">
          <div className="p-3 bg-white dark:bg-gray-800 rounded shadow-sm">
            <h4 className="font-medium mb-2">KV Connection Status</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">Status:</div>
              <div className={getStatusColor(debugInfo.kvStatus)}>{debugInfo.kvStatus}</div>

              {debugInfo.kvError && (
                <>
                  <div className="font-medium">Error:</div>
                  <div className="text-red-500">{debugInfo.kvError}</div>
                </>
              )}

              <div className="font-medium">Configuration Valid:</div>
              <div className={debugInfo.kvDetails?.isValid ? "text-green-500" : "text-red-500"}>
                {debugInfo.kvDetails?.isValid ? "Yes" : "No"}
              </div>
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-gray-800 rounded shadow-sm">
            <h4 className="font-medium mb-2">Environment Variables</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">KV_REST_API_URL:</div>
              <div>{debugInfo.environmentVariables?.KV_REST_API_URL || "not set"}</div>

              <div className="font-medium">Normalized URL:</div>
              <div>{debugInfo.environmentVariables?.KV_REST_API_URL_NORMALIZED || "not set"}</div>

              <div className="font-medium">KV_REST_API_TOKEN:</div>
              <div>{debugInfo.environmentVariables?.KV_REST_API_TOKEN || "not set"}</div>

              <div className="font-medium">Token Length:</div>
              <div>{debugInfo.environmentVariables?.KV_REST_API_TOKEN_LENGTH || "0"}</div>

              <div className="font-medium">Environment:</div>
              <div>{debugInfo.environment || "unknown"}</div>
            </div>
          </div>

          {debugInfo.redisUrlFound && (
            <div className="p-3 bg-white dark:bg-gray-800 rounded shadow-sm border-l-4 border-yellow-500">
              <h4 className="font-medium mb-2">Redis URL Found!</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">Found in:</div>
                <div>{debugInfo.redisUrlInfo?.key}</div>

                <div className="font-medium">URL:</div>
                <div>{debugInfo.redisUrlInfo?.url}</div>
              </div>
              <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                This might be the correct URL to use, but it needs to be converted to an HTTPS URL.
              </p>
            </div>
          )}

          {debugInfo.redisUrlParseInfo && (
            <div className="p-3 bg-white dark:bg-gray-800 rounded shadow-sm">
              <h4 className="font-medium mb-2">Redis URL Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">Protocol:</div>
                <div>{debugInfo.redisUrlParseInfo.protocol}</div>

                <div className="font-medium">Hostname:</div>
                <div>{debugInfo.redisUrlParseInfo.hostname}</div>

                <div className="font-medium">Port:</div>
                <div>{debugInfo.redisUrlParseInfo.port}</div>

                <div className="font-medium">Normalized URL:</div>
                <div>{debugInfo.redisUrlParseInfo.normalizedUrl}</div>
              </div>
            </div>
          )}

          {Object.keys(debugInfo.additionalKVVariables || {}).length > 0 && (
            <div className="p-3 bg-white dark:bg-gray-800 rounded shadow-sm">
              <h4 className="font-medium mb-2">Additional KV Variables</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(debugInfo.additionalKVVariables).map(([key, value]) => (
                  <React.Fragment key={key}>
                    <div className="font-medium">{key}:</div>
                    <div>{value}</div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {debugInfo.recommendations && debugInfo.recommendations.length > 0 && (
            <div className="p-3 bg-white dark:bg-gray-800 rounded shadow-sm border-l-4 border-blue-500">
              <h4 className="font-medium mb-2">Recommendations</h4>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {debugInfo.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-blue-600 dark:text-blue-400">
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {debugInfo.kvDetails?.error && (
            <div className="p-3 bg-white dark:bg-gray-800 rounded shadow-sm border-l-4 border-red-500">
              <h4 className="font-medium mb-2">Error Details</h4>
              <p className="text-red-500 text-sm">{debugInfo.kvDetails.error}</p>
            </div>
          )}

          {debugInfo.testResults && (
            <div className="p-3 bg-white dark:bg-gray-800 rounded shadow-sm border-l-4 border-green-500">
              <h4 className="font-medium mb-2">Connection Test Results</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">Ping Result:</div>
                <div>{debugInfo.testResults.pingResult || "N/A"}</div>

                <div className="font-medium">Test Key:</div>
                <div>{debugInfo.testResults.testKey || "N/A"}</div>

                <div className="font-medium">Test Value:</div>
                <div>{debugInfo.testResults.testValue || "N/A"}</div>

                <div className="font-medium">Retrieved Value:</div>
                <div>{debugInfo.testResults.retrievedValue || "N/A"}</div>

                <div className="font-medium">Match:</div>
                <div className={debugInfo.testResults.match ? "text-green-500" : "text-red-500"}>
                  {debugInfo.testResults.match ? "Yes" : "No"}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {debugInfo && showRawEnvVars && (
        <div className="text-xs overflow-auto max-h-96 p-2 bg-gray-100 dark:bg-gray-800 rounded">
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
        <h4 className="font-medium mb-2 text-blue-700 dark:text-blue-300">Database Connection Guide</h4>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
          This panel helps you diagnose your Vercel KV database connection. A properly configured connection requires:
        </p>
        <ol className="list-decimal pl-5 text-sm space-y-1 text-gray-700 dark:text-gray-300">
          <li>
            A valid <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">KV_REST_API_URL</code> that starts with
            https://
          </li>
          <li>
            A valid <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">KV_REST_API_TOKEN</code> with sufficient
            length
          </li>
          <li>Proper permissions for your database instance</li>
        </ol>
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
          If you encounter issues, check your environment variables in the Vercel dashboard and ensure they are
          correctly set.
        </p>
      </div>
    </Card>
  )
}

