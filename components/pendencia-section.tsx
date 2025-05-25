"use client"

import { useState, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Check, FileText, Plus, Save, Trash2 } from "lucide-react"
import { savePendencias } from "@/lib/supabase"

// Interface para o contexto de pendências
interface PendenciasContextType {
  pendenciasData: Record<string, string[]>
  updatePendenciasData: (category: string, pendencias: string[]) => void
  openReportModal: (category: string) => void
  openLiberarPendenciaModal: (category: string, description: string) => void
}

// Props para o componente
interface PendenciaSectionProps {
  title: string
  context: PendenciasContextType
  onAutoSave?: (category: string, pendencias: string[]) => void
}

// Status do auto-salvamento
type AutoSaveStatus = "idle" | "saving" | "saved" | "error"

// Declarar a função global para adicionar pendências recentes
declare global {
  interface Window {
    addPendenciaRecente?: (category: string, description: string, action: "added" | "updated" | "removed") => void
  }
}

export function PendenciaSection({ title, context, onAutoSave }: PendenciaSectionProps) {
  const { pendenciasData, updatePendenciasData, openReportModal, openLiberarPendenciaModal } = context

  const slug = title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[/]/g, "-")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  const [pendencias, setPendencias] = useState<string[]>([])
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle")
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousPendenciasRef = useRef<string[]>([])

  // Inicializar pendências do contexto
  useEffect(() => {
    if (pendenciasData[slug]) {
      setPendencias(pendenciasData[slug])
      previousPendenciasRef.current = [...pendenciasData[slug]]
    } else {
      setPendencias([""])
      previousPendenciasRef.current = [""]
    }
  }, [pendenciasData, slug])

  // Função para detectar mudanças e registrar em pendências recentes
  const detectChangesAndLog = (newPendencias: string[], oldPendencias: string[]) => {
    if (!window.addPendenciaRecente) return

    const newFiltered = newPendencias.filter((p) => p.trim() !== "")
    const oldFiltered = oldPendencias.filter((p) => p.trim() !== "")

    // Detectar pendências adicionadas
    newFiltered.forEach((pendencia) => {
      if (!oldFiltered.includes(pendencia)) {
        window.addPendenciaRecente!(slug, pendencia, "added")
      }
    })

    // Detectar pendências removidas
    oldFiltered.forEach((pendencia) => {
      if (!newFiltered.includes(pendencia)) {
        window.addPendenciaRecente!(slug, pendencia, "removed")
      }
    })

    // Detectar pendências atualizadas (mais complexo, por simplicidade vamos detectar quando há mudança no conteúdo)
    if (newFiltered.length === oldFiltered.length) {
      newFiltered.forEach((pendencia, index) => {
        if (
          oldFiltered[index] &&
          pendencia !== oldFiltered[index] &&
          pendencia.trim() !== "" &&
          oldFiltered[index].trim() !== ""
        ) {
          window.addPendenciaRecente!(slug, pendencia, "updated")
        }
      })
    }
  }

  // Função para adicionar uma nova pendência
  const addPendencia = () => {
    const newPendencias = [...pendencias, ""]
    setPendencias(newPendencias)
    updatePendenciasData(slug, newPendencias)
    triggerAutoSave(newPendencias)
  }

  // Função para atualizar uma pendência existente
  const updatePendencia = (index: number, value: string) => {
    const oldPendencias = [...pendencias]
    const newPendencias = [...pendencias]
    newPendencias[index] = value
    setPendencias(newPendencias)
    updatePendenciasData(slug, newPendencias)

    // Detectar mudanças apenas se o valor não estiver vazio e for diferente do anterior
    if (value.trim() !== "" && oldPendencias[index] !== value) {
      setTimeout(() => {
        detectChangesAndLog(newPendencias, previousPendenciasRef.current)
        previousPendenciasRef.current = [...newPendencias]
      }, 100)
    }

    triggerAutoSave(newPendencias)
  }

  // Função para remover uma pendência
  const removePendencia = (index: number) => {
    const oldPendencias = [...pendencias]
    const newPendencias = [...pendencias]

    // Registrar a remoção se a pendência não estava vazia
    if (newPendencias[index].trim() !== "") {
      if (window.addPendenciaRecente) {
        window.addPendenciaRecente(slug, newPendencias[index], "removed")
      }
    }

    newPendencias.splice(index, 1)
    if (newPendencias.length === 0) {
      newPendencias.push("")
    }
    setPendencias(newPendencias)
    updatePendenciasData(slug, newPendencias)
    previousPendenciasRef.current = [...newPendencias]
    triggerAutoSave(newPendencias)
  }

  // Função para disparar o auto-salvamento com debounce
  const triggerAutoSave = (pendenciasToSave: string[]) => {
    // Cancelar qualquer timeout existente
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Configura o status para "saving"
    setAutoSaveStatus("saving")

    // Cria um novo timeout (1500ms = 1.5 segundos)
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        // Filtra pendências vazias
        const filteredPendencias = pendenciasToSave.filter((p) => p.trim() !== "")

        // Salva no banco de dados
        await savePendencias(slug, filteredPendencias)

        // Notifica o componente pai (opcional)
        if (onAutoSave) {
          onAutoSave(slug, filteredPendencias)
        }

        // Configura o status para "saved"
        setAutoSaveStatus("saved")

        // Volta para "idle" após 2 segundos
        setTimeout(() => {
          setAutoSaveStatus("idle")
        }, 2000)
      } catch (error) {
        console.error("Erro ao auto-salvar pendências:", error)
        setAutoSaveStatus("error")

        // Volta para "idle" após 3 segundos
        setTimeout(() => {
          setAutoSaveStatus("idle")
        }, 3000)
      }
    }, 1500) // Espera 1.5 segundos após a última alteração para salvar
  }

  // Limpar o timeout na desmontagem do componente
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  // Renderizar o indicador de status do auto-salvamento
  const renderAutoSaveIndicator = () => {
    switch (autoSaveStatus) {
      case "saving":
        return (
          <div className="text-xs flex items-center text-yellow-400">
            <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 mr-1 animate-pulse"></div>
            Salvando...
          </div>
        )
      case "saved":
        return (
          <div className="text-xs flex items-center text-green-400">
            <Save className="h-3 w-3 mr-1" />
            Salvo
          </div>
        )
      case "error":
        return (
          <div className="text-xs flex items-center text-red-400">
            <div className="h-1.5 w-1.5 rounded-full bg-red-500 mr-1"></div>
            Erro ao salvar
          </div>
        )
      default:
        return null
    }
  }

  return (
    <AccordionItem value={slug}>
      <AccordionTrigger className="hover:bg-slate-800/50 px-4 py-2 text-slate-200">
        <div className="flex justify-between items-center w-full pr-4">
          <div className="flex items-center space-x-2">
            <span>{title}</span>
            {autoSaveStatus !== "idle" && <div className="ml-2">{renderAutoSaveIndicator()}</div>}
          </div>
          <Badge variant="outline" className="bg-slate-800/50 text-green-400 border-green-500/50 text-xs">
            {pendencias.filter((p) => p.trim() !== "").length} pendências
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pt-2 pb-4">
        <div className="space-y-3">
          {pendencias.map((pendencia, index) => (
            <div key={index} className="flex items-start space-x-2">
              <Textarea
                value={pendencia}
                onChange={(e) => updatePendencia(index, e.target.value)}
                placeholder={`Descreva a pendência para ${title}...`}
                className="flex-1 bg-slate-800 border-slate-700 min-h-[80px]"
              />
              <div className="flex flex-col space-y-1">
                {pendencia.trim() !== "" && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-green-500"
                      onClick={() => openLiberarPendenciaModal(slug, pendencia)}
                      title="Finalizar pendência"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-red-500"
                      onClick={() => removePendencia(index)}
                      title="Remover pendência"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="border-dashed border-slate-700 text-slate-400 hover:text-slate-200"
                onClick={addPendencia}
              >
                <Plus className="h-4 w-4 mr-1" /> Adicionar Pendência
              </Button>
              <div>{renderAutoSaveIndicator()}</div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="bg-slate-800/70 hover:bg-slate-700 text-green-400 border-green-500/30"
              onClick={() => openReportModal(slug)}
            >
              <FileText className="h-4 w-4 mr-1" /> Gerar Relatório
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
