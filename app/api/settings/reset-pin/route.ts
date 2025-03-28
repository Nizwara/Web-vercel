import { NextResponse } from "next/server"
import { getSettings, saveSettings } from "@/lib/settings-service"

export async function GET() {
  try {
    // Ambil pengaturan saat ini
    const settings = await getSettings()

    // Ubah PIN
    settings.ownerPin = "220199"

    // Simpan pengaturan yang diperbarui
    await saveSettings(settings)

    return NextResponse.json({
      success: true,
      message: "PIN berhasil diubah menjadi 220199",
    })
  } catch (error) {
    console.error("Error resetting PIN:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

