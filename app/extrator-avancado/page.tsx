"use client"

import { RobustImageExtractor } from "@/components/robust-image-extractor"

export default function ExtratorAvancadoPage() {
  const handleDataExtracted = (data: { frota: string; horario: string }[]) => {
    console.log("Dados extraídos:", data)
    // Aqui você pode implementar a lógica para usar os dados extraídos
    // Por exemplo, salvar no estado local, enviar para uma API, etc.
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Extrator Avançado de Dados de Agendamentos</h1>
      <RobustImageExtractor onDataExtracted={handleDataExtracted} />
    </div>
  )
}
