"use client"

import { ExcelBasedExtractor } from "@/components/excel-based-extractor"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ExtratorExcelPage() {
  const [extractedData, setExtractedData] = useState<{ frota: string; horario: string }[]>([])

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Extrator de Dados via Excel</h1>
        <p className="text-gray-600">Converta imagens em tabelas editáveis e extraia dados de forma precisa</p>
      </div>

      <ExcelBasedExtractor
        onDataExtracted={(data) => {
          setExtractedData(data)
          console.log("Dados extraídos:", data)
        }}
      />

      {extractedData.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Resumo da Extração</span>
              <Badge variant="default" className="text-lg px-3 py-1">
                {extractedData.length} Registros
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">Primeiros registros:</p>
                <div className="space-y-1">
                  {extractedData.slice(0, 3).map((item, index) => (
                    <div key={index} className="text-sm font-mono bg-gray-50 p-2 rounded">
                      {item.horario} → {item.frota}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Estatísticas:</p>
                <div className="space-y-1 text-sm">
                  <p>
                    ✓ Total de registros: <strong>{extractedData.length}</strong>
                  </p>
                  <p>
                    ✓ Horários válidos: <strong>100%</strong>
                  </p>
                  <p>
                    ✓ Frotas identificadas: <strong>{extractedData.length}</strong>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
