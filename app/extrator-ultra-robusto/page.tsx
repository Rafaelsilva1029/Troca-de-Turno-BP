"use client"

export default function ExtratorUltraRobustoPage() {
  const handleDataExtracted = (data: any[]) => {
    console.log('Dados extraídos:', data)
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Extrator Ultra Robusto</h1>
      <UltraRobustExtractor onDataExtracted={handleDataExtracted} />
    </div>
  )
}
