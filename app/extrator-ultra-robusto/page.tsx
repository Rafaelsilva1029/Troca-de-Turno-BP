import { UltraRobustExtractor } from "@/components/ultra-robust-extractor"

export default function ExtratorUltraRobustoPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Extrator Ultra Robusto de Dados de Agendamentos</h1>
      <UltraRobustExtractor
        onDataExtracted={(data) => {
          console.log("Dados extraídos:", data)
          // Aqui você pode implementar a lógica para usar os dados extraídos
        }}
      />
    </div>
  )
}
