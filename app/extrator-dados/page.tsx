import { ImageDataExtractor } from "@/components/image-data-extractor"

export default function ExtratorDadosPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Extrator de Dados de Agendamentos</h1>
      <ImageDataExtractor />
    </div>
  )
}
