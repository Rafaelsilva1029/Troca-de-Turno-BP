"use client"

import { useState, useEffect } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Verificar se estamos no navegador (client-side)
    if (typeof window !== "undefined") {
      const media = window.matchMedia(query)

      // Definir o estado inicial
      setMatches(media.matches)

      // Definir um listener para mudanças
      const listener = () => setMatches(media.matches)

      // Adicionar o listener
      media.addEventListener("change", listener)

      // Limpar o listener quando o componente for desmontado
      return () => media.removeEventListener("change", listener)
    }

    // Retornar false por padrão no servidor
    return () => {}
  }, [query])

  return matches
}
