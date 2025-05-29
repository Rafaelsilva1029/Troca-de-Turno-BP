"use client"

import dynamic from "next/dynamic"

// Importação dinâmica com SSR desabilitado para evitar problemas de pré-renderização
const UltraRobustExtractor = dynamic(() => import("@/components/ultra-robust-extractor"), {
  ssr: false,
  loading: () => <p className="p-4">Carregando extrator...</p>,
})

export default function ExtratorUltraRobustoPage() {
  const handleDataExtracted = (data: any[]) => {
    console.log("Dados extraídos:", data)
    // Implementação para usar os dados extraídos
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Extrator Ultra Robusto</h1>
      <UltraRobustExtractor onDataExtracted={handleDataExtracted} />
    </div>
  )
}
