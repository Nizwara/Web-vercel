"use client"

import { useState } from "react"

interface TutorialStep {
  title: string
  content: string
  image?: string
}

export function TutorialOverlay({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)

  const tutorialSteps: TutorialStep[] = [
    {
      title: "Selamat Datang di Incognito VPN Config Generator",
      content:
        "Aplikasi ini membantu Anda menemukan dan memeriksa proxy yang aktif untuk digunakan dengan VPN Anda. Mari kita mulai dengan panduan singkat tentang cara menggunakannya.",
    },
    {
      title: "Mencari Proxy",
      content:
        "Gunakan kotak pencarian di bagian atas untuk mencari proxy berdasarkan negara atau organisasi. Anda juga dapat menggunakan filter lanjutan untuk menyaring hasil berdasarkan status, latensi, dan kriteria lainnya.",
    },
    {
      title: "Memeriksa Status Proxy",
      content:
        "Klik tombol 'Check' pada setiap proxy untuk memeriksa apakah proxy tersebut aktif. Anda juga dapat menggunakan fitur 'Auto Check' untuk memeriksa beberapa proxy secara otomatis.",
    },
    {
      title: "Menandai Favorit",
      content:
        "Klik ikon bintang untuk menandai proxy sebagai favorit. Proxy favorit akan disimpan dan dapat diakses dengan mudah menggunakan filter 'Favorites'.",
    },
    {
      title: "Ekspor dan Impor",
      content:
        "Anda dapat mengekspor konfigurasi proxy Anda untuk digunakan nanti atau mengimpor konfigurasi yang telah Anda simpan sebelumnya. Ini berguna untuk berbagi konfigurasi atau memindahkannya ke perangkat lain.",
    },
    {
      title: "Mode Offline",
      content:
        "Aplikasi ini bekerja bahkan ketika Anda offline! Data proxy yang telah diperiksa sebelumnya akan disimpan secara lokal dan dapat diakses kapan saja, bahkan tanpa koneksi internet.",
    },
    {
      title: "Siap Untuk Mulai!",
      content:
        "Sekarang Anda siap untuk menggunakan Incognito VPN Config Generator. Jika Anda memerlukan bantuan lebih lanjut, klik tombol 'Tutorial' di bagian atas aplikasi untuk melihat panduan ini lagi.",
    },
  ]

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onClose()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-tech-card max-w-2xl w-full rounded-xl shadow-2xl overflow-hidden text-tech-text">
        {/* Progress bar */}
        <div className="w-full h-1 bg-gray-200">
          <div
            className="h-full bg-tech-accent transition-all duration-300"
            style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
          ></div>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-tech-text">{tutorialSteps[currentStep].title}</h2>
          <p className="text-tech-muted mb-6">{tutorialSteps[currentStep].content}</p>

          {tutorialSteps[currentStep].image && (
            <div className="mb-6 rounded-lg overflow-hidden">
              <img
                src={tutorialSteps[currentStep].image || "/placeholder.svg"}
                alt={`Tutorial step ${currentStep + 1}`}
                className="w-full"
              />
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              className={`px-4 py-2 rounded ${
                currentStep === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-tech-bg text-tech-text hover:bg-tech-bg/80"
              }`}
              disabled={currentStep === 0}
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-2 rounded bg-tech-accent text-white hover:bg-tech-accent/80"
            >
              {currentStep === tutorialSteps.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

