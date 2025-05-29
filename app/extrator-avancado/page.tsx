import { RobustImageExtractor } from "@/components/robust-image-extractor"

export default function ExtratorAvancadoPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Extrator Avançado de Dados de Agendamentos</h1>
      <RobustImageExtractor
        onDataExtracted={(data) => {
          console.log("Dados extraídos:", data)
          // Aqui você pode implementar a lógica para usar os dados extraídos
        }}
      />
    </div>
  )
}
