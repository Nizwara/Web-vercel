import { memo } from "react"
import { CopyButton } from "@/components/copy-button"

interface ConfigItem {
  name: string
  value: string
  isCode?: boolean
}

interface ConfigSectionProps {
  title: string
  configs: ConfigItem[]
}

export const ConfigSection = memo(function ConfigSection({ title, configs }: ConfigSectionProps) {
  return (
    <div className="space-y-4 bg-white/30 backdrop-blur-md rounded-lg p-4 shadow-sm">
      <h2 className="text-lg font-medium text-center text-tech-accent">{title}</h2>

      <div className="space-y-3">
        {configs.map((config, index) => (
          <div key={index} className="space-y-1">
            <p className="text-xs text-tech-muted">{config.name}</p>
            <div className="relative">
              <pre className="tech-terminal text-xs p-2 max-h-20 overflow-y-auto">{config.value}</pre>
              <CopyButton value={config.value} className="absolute top-2 right-2 text-xs h-6 w-6 p-0">
                Copy
              </CopyButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

