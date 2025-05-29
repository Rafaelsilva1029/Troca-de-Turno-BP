"use client"

import { useState, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { FileText, Plus, Save, Trash2, Loader2, Truck, AlertTriangle } from "lucide-react"
import { savePendencias } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { PendenciaItem } from "./pendencia-item"

// Interface para o contexto de pendências
interface PendenciasContextType {
  pendenciasData: Record<string, PendenciaItem[]>
  updatePendenciasData: (category: string, pendencias: PendenciaItem[]) => void
  openReportModal: (category: string) => void
  openLiberarPendenciaModal: (category: string, description: string, frota: string) => void
}

// Props para o componente
interface PendenciaSectionProps {
  title: string
  context: PendenciasContextType
  onAutoSave?: (category: string, pendencias: PendenciaItem[]) => void
}

// Status do auto-salvamento
type AutoSaveStatus = "idle" | "saving" | "saved" | "error"

// Declarar a função global para adicionar pendências recentes
declare global {
  interface Window {
    addPendenciaRecente?: (
      category: string,
      description: string,
      frota: string,
      action: "added" | "updated" | "removed",
    ) => void
  }
}

export function PendenciaSection({ title, context, onAutoSave }: PendenciaSectionProps) {
  const { toast } = useToast()
  const { pendenciasData, updatePendenciasData, openReportModal, openLiberarPendenciaModal } = context

  const slug = title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[/]/g, "-")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

  const [pendencias, setPendencias] = useState<PendenciaItem[]>([])
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle")
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousPendenciasRef = useRef<PendenciaItem[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPendencia, setNewPendencia] = useState({ description: "", frota: "" })

  // Inicializar pendências do contexto
  useEffect(() => {
    if (pendenciasData[slug]) {
      // Ensure we have a valid array of PendenciaItem objects
      const items = pendenciasData[slug].map((item) => {
        // If the item is a string, convert it to a PendenciaItem
        if (typeof item === "string") {
          return { description: item, frota: "" }
        }
        // If it's already a PendenciaItem, ensure it has all required properties
        return {
          description: item.description || "",
          frota: item.frota || "",
          id: item.id,
          priority: item.priority,
        }
      })
      setPendencias(items)
      previousPendenciasRef.current = [...items]
    } else {
      setPendencias([{ description: "", frota: "" }])
      previousPendenciasRef.current = [{ description: "", frota: "" }]
    }
  }, [pendenciasData, slug])

  // Função para detectar mudanças e registrar em pendências recentes
  const detectChangesAndLog = (newPendencias: PendenciaItem[], oldPendencias: PendenciaItem[]) => {
    if (!window.addPendenciaRecente) return

    const newFiltered = newPendencias.filter((p) => p.description && p.description.trim() !== "")
    const oldFiltered = oldPendencias.filter((p) => p.description && p.description.trim() !== "")

    // Detectar pendências adicionadas
    newFiltered.forEach((pendencia) => {
      if (!oldFiltered.some((old) => old.description === pendencia.description && old.frota === pendencia.frota)) {
        window.addPendenciaRecente!(slug, pendencia.description, pendencia.frota, "added")
      }
    })

    // Detectar pendências removidas
    oldFiltered.forEach((pendencia) => {
      if (!newFiltered.some((newP) => newP.description === pendencia.description && newP.frota === pendencia.frota)) {
        window.addPendenciaRecente!(slug, pendencia.description, pendencia.frota, "removed")
      }
    })

    // Detectar pendências atualizadas
    if (newFiltered.length === oldFiltered.length) {
      newFiltered.forEach((pendencia, index) => {
        const oldPendencia = oldFiltered[index]
        if (
          oldPendencia &&
          (pendencia.description !== oldPendencia.description || pendencia.frota !== oldPendencia.frota) &&
          pendencia.description &&
          pendencia.description.trim() !== "" &&
          oldPendencia.description &&
          oldPendencia.description.trim() !== ""
        ) {
          window.addPendenciaRecente!(slug, pendencia.description, pendencia.frota, "updated")
        }
      })
    }
  }

  // Função para adicionar uma nova pendência
  const addPendencia = () => {
    if (showAddForm) {
      if (
        !newPendencia.description ||
        !newPendencia.description.trim() ||
        !newPendencia.frota ||
        !newPendencia.frota.trim()
      ) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive",
        })
        return
      }

      const newId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const pendenciaToAdd = {
        ...newPendencia,
        id: newId,
        priority: newPendencia.priority || "media",
      }

      const newPendencias = [...pendencias, pendenciaToAdd]
      setPendencias(newPendencias)
      updatePendenciasData(slug, newPendencias)
      triggerAutoSave(newPendencias)

      // Resetar o formulário
      setNewPendencia({ description: "", frota: "" })
      setShowAddForm(false)

      // Detectar mudanças
      setTimeout(() => {
        detectChangesAndLog(newPendencias, previousPendenciasRef.current)
        previousPendenciasRef.current = [...newPendencias]
      }, 100)
    } else {
      setShowAddForm(true)
    }
  }

  // Função para atualizar uma pendência existente
  const updatePendenciaDescription = (index: number, value: string) => {
    const oldPendencias = [...pendencias]
    const newPendencias = [...pendencias]
    newPendencias[index] = { ...newPendencias[index], description: value }
    setPendencias(newPendencias)
    updatePendenciasData(slug, newPendencias)

    // Detectar mudanças apenas se o valor não estiver vazio e for diferente do anterior
    if (value && value.trim() !== "" && oldPendencias[index]?.description !== value) {
      setTimeout(() => {
        detectChangesAndLog(newPendencias, previousPendenciasRef.current)
        previousPendenciasRef.current = [...newPendencias]
      }, 100)
    }

    triggerAutoSave(newPendencias)
  }

  // Função para atualizar a frota de uma pendência
  const updatePendenciaFrota = (index: number, value: string) => {
    const oldPendencias = [...pendencias]
    const newPendencias = [...pendencias]
    newPendencias[index] = { ...newPendencias[index], frota: value.toUpperCase() }
    setPendencias(newPendencias)
    updatePendenciasData(slug, newPendencias)

    // Detectar mudanças apenas se o valor não estiver vazio e for diferente do anterior
    if (oldPendencias[index]?.frota !== value) {
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
    if (newPendencias[index].description && newPendencias[index].description.trim() !== "") {
      if (window.addPendenciaRecente) {
        window.addPendenciaRecente(slug, newPendencias[index].description, newPendencias[index].frota || "", "removed")
      }
    }

    newPendencias.splice(index, 1)
    if (newPendencias.length === 0) {
      newPendencias.push({ description: "", frota: "" })
    }
    setPendencias(newPendencias)
    updatePendenciasData(slug, newPendencias)
    previousPendenciasRef.current = [...newPendencias]
    triggerAutoSave(newPendencias)
  }

  // Função para disparar o auto-salvamento com debounce
  const triggerAutoSave = (pendenciasToSave: PendenciaItem[]) => {
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
        const filteredPendencias = pendenciasToSave.filter((p) => p.description && p.description.trim() !== "")

        // Salva no banco de dados (adaptação necessária para o novo formato)
        await savePendencias(
          slug,
          filteredPendencias.map((p) => p.description),
        )

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

  // Função para excluir todas as pendências desta categoria
  const deleteAllPendencias = async () => {
    try {
      setIsDeleting(true)

      // Simulando exclusão
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Limpar pendências
      setPendencias([{ description: "", frota: "" }])
      updatePendenciasData(slug, [])
      previousPendenciasRef.current = [{ description: "", frota: "" }]

      // Chamar função de auto-save se existir
      if (onAutoSave) {
        onAutoSave(slug, [])
      }

      toast({
        title: "Pendências excluídas",
        description: `Todas as pendências de ${title} foram excluídas.`,
      })
    } catch (error) {
      console.error("Erro ao excluir pendências:", error)
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir as pendências. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Renderizar o indicador de status do auto-salvamento
  const renderAutoSaveIndicator = () => {
    switch (autoSaveStatus) {
      case "saving":
        return (
          <div className="text-xs flex items-center text-yellow-400 px-2 py-1 bg-yellow-500/10 rounded-md">
            <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 mr-2 animate-pulse"></div>
            Salvando...
          </div>
        )
      case "saved":
        return (
          <div className="text-xs flex items-center text-green-400 px-2 py-1 bg-green-500/10 rounded-md">
            <Save className="h-3 w-3 mr-2" />
            Salvo
          </div>
        )
      case "error":
        return (
          <div className="text-xs flex items-center text-red-400 px-2 py-1 bg-red-500/10 rounded-md">
            <div className="h-1.5 w-1.5 rounded-full bg-red-500 mr-2"></div>
            Erro ao salvar
          </div>
        )
      default:
        return null
    }
  }

  return (
    <AccordionItem
      value={slug}
      className="border-slate-700/30 overflow-hidden transition-all duration-200 hover:border-green-500/30"
    >
      <AccordionTrigger className="hover:bg-slate-800/50 px-5 py-4 text-slate-200 group">
        <div className="flex justify-between items-center w-full pr-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-green-900/20 flex items-center justify-center text-green-400 border border-green-500/30 group-hover:bg-green-900/30 transition-colors">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-medium group-hover:text-green-400 transition-colors">{title}</span>
              {autoSaveStatus !== "idle" && <div className="ml-3">{renderAutoSaveIndicator()}</div>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendencias.some((p) => p.priority === "urgente" && p.description.trim() !== "") && (
              <Badge variant="outline" className="bg-red-900/20 text-red-400 border-red-500/50 text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Urgente
              </Badge>
            )}
            <Badge variant="outline" className="bg-slate-800/50 text-green-400 border-green-500/50 text-xs">
              {pendencias.filter((p) => p.description && p.description.trim() !== "").length} pendências
            </Badge>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-5 pt-4 pb-5 bg-slate-900/30">
        <div className="space-y-5 max-w-full">
          {pendencias.map((pendencia, index) => (
            <PendenciaItem
              key={index}
              index={index}
              pendencia={pendencia}
              title={title}
              updatePendenciaDescription={updatePendenciaDescription}
              updatePendenciaFrota={updatePendenciaFrota}
              removePendencia={removePendencia}
              openLiberarPendenciaModal={openLiberarPendenciaModal}
              slug={slug}
            />
          ))}
        </div>

        {/* Formulário para adicionar nova pendência */}
        {showAddForm && (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-md p-5 space-y-4 mt-6 mb-2">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Nova Pendência</h4>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="md:w-1/4 w-full">
                <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-lg p-3 border border-blue-500/30 shadow-lg">
                  <label className="block text-xs text-blue-300 mb-2 font-semibold uppercase tracking-wider flex items-center">
                    <Truck className="h-3 w-3 mr-2" />
                    Frota
                  </label>
                  <div className="relative">
                    <Input
                      value={newPendencia.frota}
                      onChange={(e) => setNewPendencia({ ...newPendencia, frota: e.target.value.toUpperCase() })}
                      placeholder="Nº FROTA"
                      className="bg-blue-900/40 border-blue-500/50 h-12 text-white font-bold text-lg placeholder:text-blue-400/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 pl-10"
                    />
                    <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400 animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="md:w-3/4 w-full">
                <Textarea
                  value={newPendencia.description}
                  onChange={(e) => setNewPendencia({ ...newPendencia, description: e.target.value })}
                  placeholder={`Descreva a pendência para ${title}...`}
                  className="bg-slate-800 border-slate-700 min-h-[120px] h-full w-full resize-y"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(false)}
                className="bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={addPendencia}
                className="bg-green-600 hover:bg-green-700"
                disabled={
                  !newPendencia.description ||
                  !newPendencia.description.trim() ||
                  !newPendencia.frota ||
                  !newPendencia.frota.trim()
                }
              >
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-5 mt-2 border-t border-slate-700/30">
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              className="border-dashed border-slate-700 bg-slate-800/50 text-slate-400 hover:text-green-400 hover:border-green-500/50 hover:bg-green-900/20"
              onClick={addPendencia}
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar Pendência
            </Button>
            <div>{renderAutoSaveIndicator()}</div>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="sm"
              className="bg-red-900/20 text-red-400 hover:bg-red-900/30 border-red-700/50"
              onClick={deleteAllPendencias}
              disabled={
                pendencias.filter((p) => p.description && p.description.trim() !== "").length === 0 || isDeleting
              }
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-1" /> Excluir Tudo
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-green-900/20 hover:bg-green-900/30 text-green-400 border-green-500/30"
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
