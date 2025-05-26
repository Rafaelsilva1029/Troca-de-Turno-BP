import { ImageDataExtractorStandalone } from "@/components/image-data-extractor-standalone"

export default function ExtractorPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Extrator de Dados de Agendamentos</h1>
      <ImageDataExtractorStandalone />
    </div>
  )
}
