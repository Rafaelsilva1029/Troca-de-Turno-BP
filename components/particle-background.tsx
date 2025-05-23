"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  color: string
  opacity: number
  life: number
  maxLife: number
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Configurar o canvas para ocupar toda a tela
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Criar partículas
    const particles: Particle[] = []
    const particleCount = 100
    const maxDistance = 150 // Distância máxima para desenhar linhas entre partículas

    // Função para criar uma partícula
    const createParticle = (): Particle => {
      const size = Math.random() * 3 + 1
      const maxLife = Math.random() * 100 + 100
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        color: `rgba(${Math.floor(Math.random() * 50) + 50}, ${Math.floor(Math.random() * 150) + 100}, ${Math.floor(Math.random() * 50) + 50}, 1)`,
        opacity: Math.random() * 0.5 + 0.2,
        life: 0,
        maxLife,
      }
    }

    // Inicializar partículas
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle())
    }

    // Função para calcular a distância entre duas partículas
    const getDistance = (x1: number, y1: number, x2: number, y2: number): number => {
      const xDist = x2 - x1
      const yDist = y2 - y1
      return Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2))
    }

    // Função de animação
    const animate = () => {
      if (!ctx || !canvas) return

      // Limpar o canvas com um fundo semi-transparente para criar efeito de rastro
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Atualizar e desenhar partículas
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Atualizar posição
        p.x += p.speedX
        p.y += p.speedY
        p.life++

        // Verificar limites do canvas
        if (p.x > canvas.width) p.x = 0
        if (p.x < 0) p.x = canvas.width
        if (p.y > canvas.height) p.y = 0
        if (p.y < 0) p.y = canvas.height

        // Calcular opacidade baseada no ciclo de vida
        p.opacity = 1 - p.life / p.maxLife

        // Reiniciar partícula se o ciclo de vida acabou
        if (p.life >= p.maxLife) {
          particles[i] = createParticle()
          continue
        }

        // Desenhar partícula
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color.replace("1)", `${p.opacity})`)
        ctx.fill()

        // Desenhar linhas entre partículas próximas
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const distance = getDistance(p.x, p.y, p2.x, p2.y)

          if (distance < maxDistance) {
            // Calcular opacidade baseada na distância
            const opacity = 1 - distance / maxDistance
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(100, 200, 100, ${opacity * 0.2})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      requestAnimationFrame(animate)
    }

    // Iniciar animação
    animate()

    // Limpar event listeners quando o componente for desmontado
    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full opacity-30 z-0" />
}
