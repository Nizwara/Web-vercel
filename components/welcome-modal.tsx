"use client"
import { Button } from "@/components/ui/button"

interface WelcomeModalProps {
  onClose: () => void
  onShowTutorial: () => void
}

export function WelcomeModal({ onClose, onShowTutorial }: WelcomeModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-tech-card max-w-md w-full rounded-xl shadow-2xl overflow-hidden text-tech-text">
        <div className="p-4 bg-gradient-to-r from-tech-accent to-tech-highlight text-white">
          <h2 className="text-xl font-bold">Selamat Datang di Inconigto VPN</h2>
        </div>

        <div className="p-6">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-tech-accent/10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-12 h-12 text-tech-accent"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
          </div>

          <p className="text-center mb-6">
            Terima kasih telah menggunakan Inconigto VPN Config Generator. Aplikasi ini membantu Anda menemukan dan
            mengkonfigurasi proxy untuk kebutuhan VPN Anda.
          </p>

          <div className="flex flex-col gap-3">
            <Button onClick={onShowTutorial} className="tech-button w-full">
              Lihat Tutorial
            </Button>

            <Button
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 w-full"
            >
              Mulai Gunakan
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

