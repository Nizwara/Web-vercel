"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  color: string
  alpha: number
  life: number
  maxLife: number
}

export function MouseParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0, moved: false })
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const animationFrameRef = useRef<number | null>(null)

  // Set mounted to true after component mounts
  useEffect(() => {
    setMounted(true)
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !mounted) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    setCanvasSize()
    window.addEventListener("resize", setCanvasSize)

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
      mouseRef.current.moved = true

      // Create particles on mouse move
      createParticles(5)
    }

    // Touch move handler
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current.x = e.touches[0].clientX
        mouseRef.current.y = e.touches[0].clientY
        mouseRef.current.moved = true

        // Create particles on touch move
        createParticles(3)
      }
    }

    // Create particles
    const createParticles = (count: number) => {
      const particleColor = theme === "dark" ? "#6366f1" : "#4f46e5" // Indigo color for particles

      for (let i = 0; i < count; i++) {
        const size = Math.random() * 5 + 1
        const speedX = Math.random() * 2 - 1
        const speedY = Math.random() * 2 - 1
        const life = 0
        const maxLife = Math.random() * 30 + 20

        particlesRef.current.push({
          x: mouseRef.current.x,
          y: mouseRef.current.y,
          size,
          speedX,
          speedY,
          color: particleColor,
          alpha: 1,
          life,
          maxLife,
        })
      }
    }

    // Animation function
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      const updatedParticles: Particle[] = []

      for (const particle of particlesRef.current) {
        // Update particle position
        particle.x += particle.speedX
        particle.y += particle.speedY
        particle.life += 1

        // Calculate alpha based on life
        particle.alpha = 1 - particle.life / particle.maxLife

        // Draw particle if still alive
        if (particle.alpha > 0) {
          ctx.globalAlpha = particle.alpha
          ctx.fillStyle = particle.color
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          ctx.fill()

          // Keep particle for next frame
          updatedParticles.push(particle)
        }
      }

      // Update particles reference
      particlesRef.current = updatedParticles

      // Request next frame
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    // Start animation
    animate()

    // Add event listeners
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("touchmove", handleTouchMove)

    // Cleanup
    return () => {
      window.removeEventListener("resize", setCanvasSize)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("touchmove", handleTouchMove)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [mounted, theme])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    />
  )
}

