import SettingsClient from "./settings-client"
import { ThemeProvider } from "@/contexts/theme-context"

export default function SettingsPage() {
  return (
    <ThemeProvider>
      <SettingsClient />
    </ThemeProvider>
  )
}

