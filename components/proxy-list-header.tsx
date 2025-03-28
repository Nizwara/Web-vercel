"use client"

// Tambahkan prop untuk fungsi menghapus cache
interface ProxyListHeaderProps {
  searchQuery: string
  onSearch: (query: string) => void
  proxiesPerPage: number
  onProxiesPerPageChange: (value: number) => void
  autoCheckEnabled: boolean
  batchSize: number
  toggleAutoCheck: () => void
  onToggleAdvancedFilters: () => void
  onShowExportImport: () => void
  onShowTutorial: () => void
  hideNonActive: boolean
  onToggleHideNonActive: () => void
  onClearCache?: () => void
}

export function ProxyListHeader({
  searchQuery,
  onSearch,
  proxiesPerPage,
  onProxiesPerPageChange,
  autoCheckEnabled,
  batchSize,
  toggleAutoCheck,
  onToggleAdvancedFilters,
  onShowExportImport,
  onShowTutorial,
  hideNonActive,
  onToggleHideNonActive,
  onClearCache,
}: ProxyListHeaderProps) {
  // Tambahkan tombol Clear Cache di bagian akhir return statement, sebelum penutup div terakhir

  // Tambahkan tombol Clear Cache di bagian tools
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search proxies..."
              className="w-full px-3 py-2 bg-tech-input border border-tech-border rounded-lg focus:outline-none focus:ring-1 focus:ring-tech-accent text-sm"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-tech-muted">
              {searchQuery ? (
                <button onClick={() => onSearch("")} className="hover:text-tech-accent">
                  ✕
                </button>
              ) : (
                <span>🔍</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={proxiesPerPage}
            onChange={(e) => onProxiesPerPageChange(Number.parseInt(e.target.value))}
            className="px-2 py-1 bg-tech-input border border-tech-border rounded-lg focus:outline-none focus:ring-1 focus:ring-tech-accent text-sm"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>

          <button
            onClick={toggleAutoCheck}
            className={`px-2 py-1 rounded-lg text-sm flex items-center gap-1 ${
              autoCheckEnabled ? "bg-tech-accent text-white" : "bg-tech-input border border-tech-border text-tech-text"
            }`}
            title={
              autoCheckEnabled
                ? `Auto-check enabled (batch size: ${batchSize}). Click to ${
                    batchSize < 10 ? "increase batch size" : "disable"
                  }.`
                : "Enable auto-check"
            }
          >
            <span>Auto</span>
            {autoCheckEnabled && <span className="text-xs">{batchSize}</span>}
          </button>

          <button
            onClick={onToggleHideNonActive}
            className={`px-2 py-1 rounded-lg text-sm flex items-center gap-1 ${
              hideNonActive ? "bg-tech-accent text-white" : "bg-tech-input border border-tech-border text-tech-text"
            }`}
            title={hideNonActive ? "Show all proxies" : "Hide non-active proxies"}
          >
            {hideNonActive ? "Show All" : "Hide Non-Active"}
          </button>

          <button
            onClick={onToggleAdvancedFilters}
            className="px-2 py-1 bg-tech-input border border-tech-border rounded-lg text-sm hover:bg-tech-bg"
            title="Advanced Filters"
          >
            Filters
          </button>

          <button
            onClick={onShowExportImport}
            className="px-2 py-1 bg-tech-input border border-tech-border rounded-lg text-sm hover:bg-tech-bg"
            title="Export/Import Configuration"
          >
            Export/Import
          </button>

          <button
            onClick={onShowTutorial}
            className="px-2 py-1 bg-tech-input border border-tech-border rounded-lg text-sm hover:bg-tech-bg"
            title="Show Tutorial"
          >
            ?
          </button>

          {onClearCache && (
            <button
              onClick={onClearCache}
              className="px-2 py-1 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm hover:bg-red-200"
              title="Clear proxy check cache"
            >
              Clear Cache
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

