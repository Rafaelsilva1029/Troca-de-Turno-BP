"use client"

import { SimpleRobustExtractor } from "@/components/simple-robust-extractor"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ExtratorSimplesPage() {
  const [extractedData, setExtractedData] = useState<{ frota: string; horario: string }[]>([])

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Extrator Simplificado de Dados</h1>

      <SimpleRobustExtractor
        onDataExtracted={(data) => {
          setExtractedData(data)
          console.log("Dados extraídos:", data)
        }}
      />

      {extractedData.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Resumo da Extração</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">
              Total de registros extraídos: <strong>{extractedData.length}</strong>
            </p>
            <p className="text-sm text-gray-500 mt-2">Os dados foram extraídos com sucesso e estão prontos para uso.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
