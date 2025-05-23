"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface TruckAnimationProps {
  size?: number
  speed?: number
  color?: string
}

export function TruckAnimation({ size = 40, speed = 1, color = "#22c55e" }: TruckAnimationProps) {
  const smokeRef = useRef<SVGGElement>(null)

  useEffect(() => {
    // Animação de fumaça
    const smokeElement = smokeRef.current
    if (!smokeElement) return

    const smokeInterval = setInterval(() => {
      const smokeParticle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      smokeParticle.setAttribute("cx", "5")
      smokeParticle.setAttribute("cy", "15")
      smokeParticle.setAttribute("r", (Math.random() * 1.5 + 0.5).toString())
      smokeParticle.setAttribute("fill", "rgba(150, 150, 150, 0.7)")

      smokeElement.appendChild(smokeParticle)

      // Animar a partícula de fumaça
      let opacity = 0.7
      let posX = 5
      let posY = 15
      let size = Number.parseFloat(smokeParticle.getAttribute("r") || "1")

      const animateSmoke = () => {
        if (opacity <= 0) {
          smokeParticle.remove()
          return
        }

        opacity -= 0.02
        posX -= 0.3
        posY -= 0.2
        size += 0.05

        smokeParticle.setAttribute("cx", posX.toString())
        smokeParticle.setAttribute("cy", posY.toString())
        smokeParticle.setAttribute("r", size.toString())
        smokeParticle.setAttribute("fill", `rgba(150, 150, 150, ${opacity})`)

        requestAnimationFrame(animateSmoke)
      }

      animateSmoke()
    }, 300 / speed)

    return () => clearInterval(smokeInterval)
  }, [speed])

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.div
        animate={{
          y: [0, -1, 0, 1, 0],
        }}
        transition={{
          duration: 0.5 / speed,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "mirror",
        }}
        className="w-full h-full"
      >
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Chassis do caminhão */}
          <rect x="10" y="20" width="20" height="10" rx="1" fill={color} />

          {/* Cabine */}
          <rect x="5" y="15" width="10" height="10" rx="1" fill={color} />

          {/* Janela */}
          <rect x="7" y="17" width="6" height="4" rx="1" fill="#1e293b" />

          {/* Rodas */}
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 1 / speed, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <circle cx="10" cy="30" r="3" fill="#1e293b" />
            <circle cx="10" cy="30" r="1.5" fill="#334155" />
          </motion.g>

          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 1 / speed, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <circle cx="25" cy="30" r="3" fill="#1e293b" />
            <circle cx="25" cy="30" r="1.5" fill="#334155" />
          </motion.g>

          {/* Farol */}
          <rect x="5" y="20" width="2" height="2" rx="0.5" fill="#fbbf24" />

          {/* Escapamento */}
          <rect x="5" y="14" width="1" height="3" rx="0.5" fill="#64748b" />

          {/* Fumaça */}
          <g ref={smokeRef}></g>

          {/* Carga */}
          <rect x="15" y="15" width="10" height="5" rx="1" fill="#475569" />
        </svg>
      </motion.div>
    </div>
  )
}
