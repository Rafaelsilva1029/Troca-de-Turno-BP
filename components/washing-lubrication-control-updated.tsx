"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { format, isValid, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  AlertCircle,
  CalendarIcon,
  CheckCircle2,
  Clock,
  Database,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  Plus,
  Wifi,
  WifiOff,
  Upload,
  Download,
  Brain,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import * as XLSX from "xlsx"
import { getSupabaseClient } from "@/lib/supabase"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { UltraAdvancedAIExtractor } from "@/components/ultra-advanced-ai-extractor"

// Tipos
interface MaintenanceRecord {
  id: number
  frota: string
  local: string
  tipo_preventiva: string
  data_programada: string
  data_realizada?: string
  situacao: "PENDENTE" | "ENCERRADO" | "EM_ANDAMENTO"
  horario_agendado: string
  observacao?: string
  created_at?: string
  updated_at?: string
}

interface PDFExportOptions {
  includeHeader: boolean
  includeLogo: boolean
  includeStatistics: boolean
  includeCharts: boolean
  includeFilters: boolean
  orientation: "portrait" | "landscape"
  pageSize: "a4" | "a3" | "letter"
  fontSize: "small" | "medium" | "large"
  colorScheme: "professional" | "colorful" | "minimal"
}

interface WashingLubricationControlProps {
  importedData?: Array<{
    frota: string
    horario: string
  }>
}

const tiposPreventiva = [
  { value: "lavagem_lubrificacao", label: "Lavagem / Lubrificação" },
  { value: "lavagem", label: "Lavagem" },
  { value: "lubrificacao", label: "Lubrificação" },
  { value: "troca_oleo", label: "Troca de Óleo" },
  { value: "lavagem_completa", label: "Lavagem Completa" },
]

const locais = [
  { value: "LAVADOR", label: "LAVADOR" },
  { value: "LUBRIFICADOR", label: "LUBRIFICADOR" },
  { value: "MECANICO", label: "MECÂNICO" },
  { value: "OFICINA", label: "OFICINA" },
  { value: "PATIO", label: "PÁTIO" },
  { value: "CAMPO", label: "CAMPO" },
]

const formatDateSafe = (dateString: string | undefined | null, formatStr = "dd/MM/yyyy"): string => {
  if (!dateString) return ""
  try {
    if (typeof dateString !== "string" || dateString.trim() === "") {
      return ""
    }
    const date = parseISO(dateString)
    if (!isValid(date)) {
      return ""
    }
    return format(date, formatStr)
  } catch (error) {
    console.error("Erro ao formatar data:", error, dateString)
    return ""
  }
}

const normalizarHorario = (horario: string): string => {
  if (!horario) return "08:00"
  let horarioLimpo = horario.toString().trim()
  if (/^\d{1,4}$/.test(horarioLimpo)) {
    if (horarioLimpo.length === 1) horarioLimpo = `0${horarioLimpo}:00`
    else if (horarioLimpo.length === 2) horarioLimpo = `${horarioLimpo}:00`
    else if (horarioLimpo.length === 3) horarioLimpo = `0${horarioLimpo.charAt(0)}:${horarioLimpo.slice(1)}`
    else if (horarioLimpo.length === 4) horarioLimpo = `${horarioLimpo.slice(0, 2)}:${horarioLimpo.slice(2)}`
  }
  if (/^\d{1,2}:\d{2}$/.test(horarioLimpo)) {
    const [horas, minutos] = horarioLimpo.split(":")
    return `${horas.padStart(2, "0")}:${minutos}`
  }
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(horarioLimpo)) {
    const [horas, minutos] = horarioLimpo.split(":")
    return `${horas.padStart(2, "0")}:${minutos}`
  }
  return "08:00"
}

export function WashingLubricationControl({ importedData }: WashingLubricationControlProps = {}) {
  const [registros, setRegistros] = useState<MaintenanceRecord[]>([
    {
      id: 1,
      frota: "6597",
      local: "LAVADOR",
      tipo_preventiva: "lavagem_lubrificacao",
      data_programada: "2025-01-26",
      situacao: "PENDENTE",
      horario_agendado: "04:00",
      observacao:
        "TROCA DE ÓLEO E FILTROS, VERIFICAR NÍVEL DO RADIADOR E POSSÍVEIS VAZAMENTOS NO SISTEMA DE ARREFECIMENTO. EQUIPAMENTO PRECISA DE ATENÇÃO URGENTE.",
    },
    {
      id: 2,
      frota: "8805",
      local: "LAVADOR",
      tipo_preventiva: "lavagem_lubrificacao",
      data_programada: "2025-01-27",
      situacao: "PENDENTE",
      horario_agendado: "08:00",
      observacao: "EM VIAGEM - PREVISÃO DE RETORNO DIA 28 PELA MANHÃ.",
    },
    {
      id: 3,
      frota: "4597",
      local: "LUBRIFICADOR",
      tipo_preventiva: "lubrificacao",
      data_programada: "2025-01-28",
      situacao: "EM_ANDAMENTO",
      horario_agendado: "14:30",
      observacao: "Aguardando peças para substituição da bomba de graxa.",
    },
    {
      id: 4,
      frota: "6602",
      local: "MECANICO",
      tipo_preventiva: "troca_oleo",
      data_programada: "2025-01-25",
      situacao: "ENCERRADO",
      horario_agendado: "02:00",
      observacao: "Concluído com sucesso.",
      data_realizada: "2025-01-25",
    },
  ])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [bdConectado, setBdConectado] = useState(false)
  const [statusConexao, setStatusConexao] = useState<"conectando" | "conectado" | "erro" | "offline">("offline")
  const [termoBusca, setTermoBusca] = useState("")
  const [filtroTipo, setFiltroTipo] = useState<string>("todos")
  const [filtroSituacao, setFiltroSituacao] = useState<string>("todos")
  const [filtroLocal, setFiltroLocal] = useState<string>("todos")
  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>()
  const [dialogoAdicionar, setDialogoAdicionar] = useState(false)
  const [dialogoEditar, setDialogoEditar] = useState(false)
  const [registroSelecionado, setRegistroSelecionado] = useState<MaintenanceRecord | null>(null)
  const [dialogoImportar, setDialogoImportar] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [sincronizando, setSincronizando] = useState(false)
  const [atualizandoStatus, setAtualizandoStatus] = useState<number | null>(null)
  const [novoRegistro, setNovoRegistro] = useState<Omit<MaintenanceRecord, "id">>({
    frota: "",
    local: "LAVADOR",
    tipo_preventiva: "lavagem_lubrificacao",
    data_programada: format(new Date(), "yyyy-MM-dd"),
    situacao: "PENDENTE",
    horario_agendado: "08:00",
    observacao: "",
  })
  const tabelaRef = useRef<HTMLDivElement>(null)
  const logoImageRef = useRef<HTMLImageElement | null>(null)
  const [arquivoCsv, setArquivoCsv] = useState<File | null>(null)

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = "/logo-branco-peres.png"
    img.onload = () => {
      logoImageRef.current = img
    }
    img.onerror = () => {
      console.error("Falha ao carregar imagem do logo.")
      toast({
        title: "Erro no Logo",
        description: "Não foi possível carregar o logo para exportação.",
        variant: "destructive",
      })
    }
  }, [])

  useEffect(() => {
    tentarConectarBanco()
  }, [])

  useEffect(() => {
    if (importedData && importedData.length > 0) {
      const processarDadosImportados = async () => {
        try {
          setCarregando(true)
          const novosRegistrosImportados = importedData.map((item) => ({
            frota: item.frota,
            local: "LAVADOR",
            tipo_preventiva: "lavagem_lubrificacao",
            data_programada: format(new Date(), "yyyy-MM-dd"),
            situacao: "PENDENTE" as const,
            horario_agendado: normalizarHorario(item.horario),
            observacao: "Importado via extração automática",
          }))
          await importarRegistros(novosRegistrosImportados)
          toast({
            title: "Dados importados",
            description: `${importedData.length} registros foram importados com sucesso.`,
          })
        } catch (error) {
          console.error("Erro ao processar dados importados:", error)
          toast({ title: "Erro", description: "Erro ao processar dados importados", variant: "destructive" })
        } finally {
          setCarregando(false)
        }
      }
      processarDadosImportados()
    }
  }, [importedData])

  const tentarConectarBanco = async () => {
    try {
      setStatusConexao("conectando")
      setErro(null)
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.from("maintenance_records").select("*").order("id", { ascending: false })
      if (error) throw error
      if (data && data.length > 0) setRegistros(data)
      setBdConectado(true)
      setStatusConexao("conectado")
      toast({ title: "Conectado", description: `Sistema conectado! ${data?.length || 0} registros carregados.` })
    } catch (error: any) {
      console.error("Erro na conexão inicial:", error)
      setBdConectado(false)
      let errorMessage = "Falha ao conectar ao banco. Operando em modo offline."
      if (error.message && error.message.includes("relation") && error.message.includes("does not exist")) {
        setStatusConexao("erro") // Specific state for table not found
        errorMessage = "Tabela 'maintenance_records' não encontrada no banco. Verifique o schema."
        setErro(errorMessage)
        toast({ title: "Erro de Banco", description: errorMessage, variant: "destructive" })
      } else if (error.message && error.message.toLowerCase().includes("rls")) {
        setStatusConexao("erro")
        errorMessage = "Acesso negado. Verifique as políticas de RLS (Row Level Security) da tabela."
        setErro(errorMessage)
        toast({ title: "Erro de Permissão", description: errorMessage, variant: "destructive" })
      } else {
        setStatusConexao("offline")
        setErro(errorMessage)
        toast({ title: "Modo Offline", description: errorMessage, variant: "destructive" })
      }
    }
  }

  const carregarRegistrosDoBanco = async () => {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.from("maintenance_records").select("*").order("id", { ascending: false })
      if (error) throw error
      if (data && data.length > 0) setRegistros(data)
    } catch (error) {
      console.error("Erro ao carregar registros:", error)
      throw error
    }
  }

  const gerarProximoId = () => Math.max(...registros.map((r) => r.id), 0) + 1

  const adicionarRegistro = async () => {
    try {
      setCarregando(true)
      setErro(null)
      if (!novoRegistro.frota.trim()) throw new Error("Frota é obrigatória")
      if (!novoRegistro.data_programada) throw new Error("Data programada é obrigatória")
      if (!novoRegistro.horario_agendado) throw new Error("Horário agendado é obrigatório")

      const registroCompleto: MaintenanceRecord = {
        ...novoRegistro,
        id: gerarProximoId(),
        horario_agendado: normalizarHorario(novoRegistro.horario_agendado),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (bdConectado) {
        try {
          const supabase = getSupabaseClient()
          const dadosParaBanco = {
            frota: registroCompleto.frota,
            local: registroCompleto.local,
            tipo_preventiva: registroCompleto.tipo_preventiva,
            data_programada: registroCompleto.data_programada,
            data_realizada: registroCompleto.data_realizada || null,
            situacao: registroCompleto.situacao,
            horario_agendado: registroCompleto.horario_agendado,
            observacao: registroCompleto.observacao || null,
            created_at: registroCompleto.created_at,
            updated_at: registroCompleto.updated_at,
          }
          const { data, error } = await supabase.from("maintenance_records").insert([dadosParaBanco]).select()
          if (error) throw error
          setRegistros((prev) => [data[0], ...prev])
        } catch (dbError: any) {
          console.error("Erro ao adicionar registro no banco:", dbError)
          toast({
            title: "Erro no Banco",
            description: `Falha ao salvar no banco: ${dbError.message}. Salvo localmente.`,
            variant: "warning",
          })
          setRegistros((prev) => [registroCompleto, ...prev])
        }
      } else {
        setRegistros((prev) => [registroCompleto, ...prev])
      }
      setNovoRegistro({
        frota: "",
        local: "LAVADOR",
        tipo_preventiva: "lavagem_lubrificacao",
        data_programada: format(new Date(), "yyyy-MM-dd"),
        situacao: "PENDENTE",
        horario_agendado: "08:00",
        observacao: "",
      })
      setDialogoAdicionar(false)
      toast({ title: "Sucesso", description: `Registro adicionado ${bdConectado ? "no banco" : "localmente"}!` })
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Erro desconhecido"
      setErro(mensagem)
      toast({ title: "Erro", description: mensagem, variant: "destructive" })
    } finally {
      setCarregando(false)
    }
  }

  const atualizarRegistro = async () => {
    if (!registroSelecionado) return
    try {
      setCarregando(true)
      setErro(null)
      const registroAtualizado = {
        ...registroSelecionado,
        horario_agendado: normalizarHorario(registroSelecionado.horario_agendado),
        updated_at: new Date().toISOString(),
      }
      if (bdConectado) {
        try {
          const supabase = getSupabaseClient()
          const dadosParaAtualizacao = {
            frota: registroAtualizado.frota,
            local: registroAtualizado.local,
            tipo_preventiva: registroAtualizado.tipo_preventiva,
            data_programada: registroAtualizado.data_programada,
            data_realizada: registroAtualizado.data_realizada || null,
            situacao: registroAtualizado.situacao,
            horario_agendado: registroAtualizado.horario_agendado,
            observacao: registroAtualizado.observacao || null,
            updated_at: registroAtualizado.updated_at,
          }
          const { error } = await supabase
            .from("maintenance_records")
            .update(dadosParaAtualizacao)
            .eq("id", registroSelecionado.id)
          if (error) throw error
        } catch (dbError: any) {
          console.error("Erro ao atualizar registro no banco:", dbError)
          toast({
            title: "Erro no Banco",
            description: `Falha ao atualizar no banco: ${dbError.message}. Atualizado localmente.`,
            variant: "warning",
          })
        }
      }
      setRegistros((prev) => prev.map((r) => (r.id === registroSelecionado.id ? registroAtualizado : r)))
      setDialogoEditar(false)
      setRegistroSelecionado(null)
      toast({ title: "Sucesso", description: `Registro atualizado ${bdConectado ? "no banco" : "localmente"}!` })
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Erro desconhecido"
      setErro(mensagem)
      toast({ title: "Erro", description: mensagem, variant: "destructive" })
    } finally {
      setCarregando(false)
    }
  }

  const alterarStatus = async (id: number, novoStatus: "PENDENTE" | "ENCERRADO" | "EM_ANDAMENTO") => {
    try {
      setAtualizandoStatus(id)
      const registro = registros.find((r) => r.id === id)
      if (!registro) return
      const registroAtualizado = {
        ...registro,
        situacao: novoStatus,
        data_realizada: novoStatus === "ENCERRADO" ? format(new Date(), "yyyy-MM-dd") : registro.data_realizada,
        updated_at: new Date().toISOString(),
      }
      if (bdConectado) {
        try {
          const supabase = getSupabaseClient()
          const { error } = await supabase
            .from("maintenance_records")
            .update({
              situacao: novoStatus,
              data_realizada: registroAtualizado.data_realizada,
              updated_at: registroAtualizado.updated_at,
            })
            .eq("id", id)
          if (error) throw error
        } catch (dbError: any) {
          console.error("Erro ao alterar status no banco:", dbError)
          toast({
            title: "Erro no Banco",
            description: `Falha ao alterar status no banco: ${dbError.message}. Alterado localmente.`,
            variant: "warning",
          })
        }
      }
      setRegistros((prev) => prev.map((r) => (r.id === id ? registroAtualizado : r)))
      toast({ title: "Sucesso", description: `Status atualizado ${bdConectado ? "no banco" : "localmente"}!` })
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Erro desconhecido"
      toast({ title: "Erro", description: mensagem, variant: "destructive" })
    } finally {
      setAtualizandoStatus(null)
    }
  }

  const excluirRegistro = async (id: number) => {
    try {
      setCarregando(true)
      if (bdConectado) {
        try {
          const supabase = getSupabaseClient()
          const { error } = await supabase.from("maintenance_records").delete().eq("id", id)
          if (error) throw error
        } catch (dbError: any) {
          console.error("Erro ao excluir registro no banco:", dbError)
          toast({
            title: "Erro no Banco",
            description: `Falha ao excluir no banco: ${dbError.message}. Excluído localmente.`,
            variant: "warning",
          })
        }
      }
      setRegistros((prev) => prev.filter((r) => r.id !== id))
      toast({ title: "Sucesso", description: `Registro excluído ${bdConectado ? "do banco" : "localmente"}!` })
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Erro desconhecido"
      toast({ title: "Erro", description: mensagem, variant: "destructive" })
    } finally {
      setCarregando(false)
    }
  }

  const limparTodosRegistros = async () => {
    try {
      setCarregando(true)
      if (bdConectado) {
        try {
          const supabase = getSupabaseClient()
          const { error } = await supabase.from("maintenance_records").delete().neq("id", 0)
          if (error) throw error
        } catch (dbError) {
          console.warn("Erro ao limpar registros no banco:", dbError)
          throw dbError
        }
      }
      setRegistros([])
      toast({
        title: "Sucesso",
        description: `Todos os registros foram excluídos ${bdConectado ? "do banco" : "localmente"}!`,
      })
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Erro desconhecido"
      toast({ title: "Erro", description: mensagem, variant: "destructive" })
    } finally {
      setCarregando(false)
    }
  }

  const sincronizarBanco = async () => {
    try {
      setSincronizando(true)
      setErro(null)
      await carregarRegistrosDoBanco()
      setBdConectado(true)
      setStatusConexao("conectado")
      toast({ title: "Sucesso", description: "Dados sincronizados com o banco de dados!" })
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Erro de sincronização"
      setStatusConexao("erro")
      setBdConectado(false)
      toast({ title: "Erro", description: mensagem, variant: "destructive" })
    } finally {
      setSincronizando(false)
    }
  }

  const exportarExcel = () => {
    try {
      setExportando(true)
      const dadosExport = registrosFiltrados.map((r) => ({
        Frota: r.frota,
        Local: r.local,
        "Tipo Preventiva": obterLabelTipo(r.tipo_preventiva),
        "Data Programada": formatDateSafe(r.data_programada),
        "Data Realizada": formatDateSafe(r.data_realizada),
        Situação: r.situacao === "EM_ANDAMENTO" ? "ANDAMENTO" : r.situacao,
        "Horário Agendado": r.horario_agendado,
        Observação: r.observacao || "",
      }))
      const worksheet = XLSX.utils.json_to_sheet(dadosExport)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Lavagem e Lubrificação")
      worksheet["!cols"] = [
        { wch: 10 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 30 },
      ]
      XLSX.writeFile(workbook, "controle-lavagem-lubrificacao.xlsx")
      toast({ title: "Sucesso", description: "Arquivo Excel exportado!" })
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao exportar Excel", variant: "destructive" })
    } finally {
      setExportando(false)
    }
  }

  const exportarModeloExcel = () => {
    try {
      setExportando(true)
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.aoa_to_sheet([
        [
          "Frota",
          "Local",
          "Tipo Preventiva",
          "Data Programada",
          "Data Realizada",
          "Situação",
          "Horário Agendado",
          "Observação",
        ],
        ["6597", "LAVADOR", "Lavagem / Lubrificação", "26/01/2025", "", "PENDENTE", "04:00", "TROCA DE ÓLEO"],
        ["8805", "LAVADOR", "Lavagem", "27/01/2025", "", "PENDENTE", "08:00", "EM VIAGEM"],
      ])
      worksheet["!cols"] = [
        { wch: 10 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 30 },
      ]
      XLSX.utils.book_append_sheet(workbook, worksheet, "Modelo de Importação")
      XLSX.writeFile(workbook, "modelo-importacao-lavagem-lubrificacao.xlsx")
      toast({ title: "Sucesso", description: "Modelo Excel exportado!" })
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao exportar modelo Excel", variant: "destructive" })
    } finally {
      setExportando(false)
    }
  }

  const exportarImagemPowerBIFuturisticAgro = async () => {
    if (!logoImageRef.current) {
      toast({
        title: "Logo não carregado",
        description: "A imagem do logo ainda não foi carregada. Tente novamente.",
        variant: "destructive",
      })
      return
    }
    try {
      setExportando(true)
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Contexto do canvas não criado")

      const colors = {
        bgPage: "#0A0F14",
        bgHeader: "#10161D",
        bgCard: "#161C24",
        textTitle: "#F0F6FC",
        textPrimary: "#C9D1D9",
        textSecondary: "#8B949E",
        accentGreen: "#2ECC71",
        accentYellow: "#F1C40F",
        accentRed: "#E74C3C",
        borderCard: "#2A3038",
        gridLines: "rgba(139, 148, 158, 0.1)",
        tableHeaderBg: "#10161D",
        tableEvenRowBg: "#161C24",
        tableOddRowBg: "#13181F",
        tableBorder: "#2A3038",
      }

      const FONT_FAMILY = "'Inter', 'Segoe UI', Roboto, sans-serif"
      const pagePadding = 90
      const headerActualHeight = 180
      const kpiSectionHeight = 240
      const kpiSpacing = 60
      const pieChartSectionHeight = 600
      const sectionSpacing = 60
      const tableHeaderHeight = 80
      const tableRowHeight = 90
      const tableFooterHeight = 50
      const bottomPadding = 70

      const tableDataHeight = registrosFiltrados.length * tableRowHeight
      const canvasHeight =
        headerActualHeight +
        pagePadding +
        kpiSectionHeight +
        kpiSpacing +
        pieChartSectionHeight +
        sectionSpacing +
        tableHeaderHeight +
        tableDataHeight +
        tableFooterHeight +
        bottomPadding
      const canvasWidth = 1920

      canvas.width = canvasWidth
      canvas.height = canvasHeight
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"

      ctx.fillStyle = colors.bgPage
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      let currentY = 0
      ctx.fillStyle = colors.bgHeader
      ctx.fillRect(0, currentY, canvasWidth, headerActualHeight)
      const logo = logoImageRef.current
      const logoHeight = 110
      const logoWidth = (logo.width / logo.height) * logoHeight
      const logoX = pagePadding
      const logoY = (headerActualHeight - logoHeight) / 2
      ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight)
      const titleX = logoX + logoWidth + 45

      const drawText = (
        text: string,
        x: number,
        y: number,
        size: number,
        color: string,
        weight = "normal",
        align: CanvasTextAlign = "left",
        baseline: CanvasTextBaseline = "alphabetic",
      ) => {
        ctx.font = `${weight} ${size}px ${FONT_FAMILY}`
        ctx.fillStyle = color
        ctx.textAlign = align
        ctx.textBaseline = baseline
        ctx.fillText(text, x, y)
      }
      const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number) => {
        ctx.beginPath()
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + width - radius, y)
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
        ctx.lineTo(x + width, y + height - radius)
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
        ctx.lineTo(x + radius, y + height)
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
        ctx.lineTo(x, y + radius)
        ctx.quadraticCurveTo(x, y, x + radius, y)
        ctx.closePath()
      }

      // Título e Subtítulo do Cabeçalho da Imagem (usando baseline 'middle' e ajustes específicos)
      drawText(
        "Controle de Lavagem e Lubrificação Logística",
        titleX,
        logoY + logoHeight / 2 - 25,
        58,
        colors.textTitle,
        "bold",
        "left",
        "middle",
      )
      drawText(
        `Branco Peres Agro S/A - ${format(new Date(), "dd/MM/yyyy")}`,
        titleX,
        logoY + logoHeight / 2 + 40,
        40,
        colors.textSecondary,
        "normal",
        "left",
        "middle",
      )
      currentY += headerActualHeight + pagePadding

      // KPIs (usando baseline 'middle' e ajustes específicos)
      const numKpiCards = 3
      const totalKpiWidth = canvasWidth - 2 * pagePadding
      const kpiCardWidth = (totalKpiWidth - (numKpiCards - 1) * kpiSpacing) / numKpiCards
      const kpiData = [
        { title: "Total Registros", value: registros.length.toString(), color: colors.accentYellow },
        {
          title: "Pendentes",
          value: registros.filter((r) => r.situacao === "PENDENTE").length.toString(),
          color: colors.accentRed,
        },
        {
          title: "Concluídos Hoje",
          value: registros
            .filter((r) => r.situacao === "ENCERRADO" && r.data_realizada === format(new Date(), "yyyy-MM-dd"))
            .length.toString(),
          color: colors.accentGreen,
        },
      ]
      kpiData.forEach((kpi, index) => {
        const cardX = pagePadding + index * (kpiCardWidth + kpiSpacing)
        ctx.fillStyle = colors.bgCard
        ctx.strokeStyle = colors.borderCard
        ctx.lineWidth = 1.5
        drawRoundedRect(cardX, currentY, kpiCardWidth, kpiSectionHeight, 16)
        ctx.fill()
        ctx.stroke()
        drawText(
          kpi.title,
          cardX + kpiCardWidth / 2,
          currentY + 60,
          44,
          colors.textSecondary,
          "600",
          "center",
          "middle",
        )
        drawText(
          kpi.value,
          cardX + kpiCardWidth / 2,
          currentY + kpiSectionHeight / 2 + 50,
          105,
          kpi.color,
          "bold",
          "center",
          "middle",
        )
      })
      currentY += kpiSectionHeight + sectionSpacing

      // Gráfico de Pizza (usando baseline 'middle' e ajustes específicos)
      const pieCardX = pagePadding
      const pieCardWidth = canvasWidth - 2 * pagePadding
      ctx.fillStyle = colors.bgCard
      ctx.strokeStyle = colors.borderCard
      ctx.lineWidth = 1.5
      drawRoundedRect(pieCardX, currentY, pieCardWidth, pieChartSectionHeight, 16)
      ctx.fill()
      ctx.stroke()
      drawText(
        "Distribuição de Status",
        pieCardX + 50,
        currentY + 55, // Y para o topo do texto
        48,
        colors.textPrimary,
        "bold",
        "left",
        "top",
      )

      const pieData = [
        {
          label: "Pendentes",
          value: registros.filter((r) => r.situacao === "PENDENTE").length,
          color: colors.accentRed,
        },
        {
          label: "Em Andamento",
          value: registros.filter((r) => r.situacao === "EM_ANDAMENTO").length,
          color: colors.accentYellow,
        },
        {
          label: "Concluídos",
          value: registros.filter((r) => r.situacao === "ENCERRADO").length,
          color: colors.accentGreen,
        },
      ]
      const totalPieValue = pieData.reduce((sum, item) => sum + item.value, 0)
      if (totalPieValue > 0) {
        const pieContentX = pieCardX + 45
        const pieContentY = currentY + 55 + 45 + 35
        const pieContentWidth = pieCardWidth - 90
        const pieContentHeight = pieChartSectionHeight - 100 - 45 - 35
        const pieCenterX = pieContentX + pieContentWidth / 2.5
        const pieCenterY = pieContentY + pieContentHeight / 2
        const radius = Math.min(pieContentWidth / 2.5, pieContentHeight) / 1.8
        let startAngle = -Math.PI / 2
        pieData.forEach((item) => {
          if (item.value === 0) return
          const sliceAngle = (item.value / totalPieValue) * 2 * Math.PI
          ctx.beginPath()
          ctx.moveTo(pieCenterX, pieCenterY)
          ctx.arc(pieCenterX + 6, pieCenterY + 6, radius, startAngle, startAngle + sliceAngle)
          ctx.closePath()
          ctx.fillStyle = "rgba(0,0,0,0.25)"
          ctx.fill()
          startAngle += sliceAngle
        })
        startAngle = -Math.PI / 2
        pieData.forEach((item) => {
          if (item.value === 0) return
          const sliceAngle = (item.value / totalPieValue) * 2 * Math.PI
          const endAngle = startAngle + sliceAngle
          ctx.beginPath()
          ctx.moveTo(pieCenterX, pieCenterY)
          ctx.arc(pieCenterX, pieCenterY, radius, startAngle, endAngle)
          ctx.closePath()
          ctx.fillStyle = item.color
          ctx.fill()
          ctx.lineWidth = 2.5
          ctx.strokeStyle = colors.bgCard
          ctx.stroke()
          startAngle = endAngle
        })
        const legendX = pieCenterX + radius + 80
        const legendYStart = pieCenterY - (pieData.length / 2) * 50 + 20
        pieData.forEach((item, index) => {
          const itemY = legendYStart + index * 55
          ctx.fillStyle = item.color
          ctx.fillRect(legendX, itemY - 16, 32, 32)
          drawText(
            `${item.label}: ${item.value} (${((item.value / totalPieValue) * 100).toFixed(0)}%)`,
            legendX + 45,
            itemY, // Y para o meio do texto da legenda
            36,
            colors.textPrimary,
            "normal",
            "left",
            "middle",
          )
        })
      } else {
        drawText(
          "Sem dados para o gráfico",
          pieCardX + pieCardWidth / 2,
          currentY + pieChartSectionHeight / 2, // Y para o meio
          38,
          colors.textSecondary,
          "normal",
          "center",
          "middle",
        )
      }
      currentY += pieChartSectionHeight + sectionSpacing

      // Tabela
      const tableX = pagePadding
      const tableWidth = canvasWidth - 2 * pagePadding
      const columns = [
        { header: "Frota", key: "frota", width: 0.1 },
        { header: "Local", key: "local", width: 0.12 },
        { header: "Tipo Prev.", key: "tipo_preventiva", width: 0.18 },
        { header: "Data Prog.", key: "data_programada", width: 0.12 },
        { header: "Data Real.", key: "data_realizada", width: 0.12 },
        { header: "Situação", key: "situacao", width: 0.12 },
        { header: "Horário", key: "horario_agendado", width: 0.1 },
        { header: "Observação", key: "observacao", width: 0.14 },
      ]

      // Cabeçalho da Tabela (usando baseline 'top')
      ctx.fillStyle = colors.tableHeaderBg
      ctx.fillRect(tableX, currentY, tableWidth, tableHeaderHeight)
      let currentXHeader = tableX
      const headerCellFontSize = 32
      columns.forEach((col) => {
        const textYHeader = currentY + (tableHeaderHeight - headerCellFontSize) / 2
        drawText(
          col.header,
          currentXHeader + (tableWidth * col.width) / 2,
          textYHeader,
          headerCellFontSize,
          colors.textTitle,
          "600",
          "center",
          "top",
        )
        currentXHeader += tableWidth * col.width
      })
      currentY += tableHeaderHeight

      // Linhas da Tabela (usando baseline 'top')
      registrosFiltrados.forEach((registro, index) => {
        ctx.fillStyle = index % 2 === 0 ? colors.tableEvenRowBg : colors.tableOddRowBg
        ctx.fillRect(tableX, currentY, tableWidth, tableRowHeight)
        let currentXCell = tableX
        columns.forEach((col) => {
          let cellValue = (registro as any)[col.key] || ""
          let textColor = colors.textPrimary
          if (col.key === "data_programada" || col.key === "data_realizada") cellValue = formatDateSafe(cellValue)
          else if (col.key === "tipo_preventiva") cellValue = obterLabelTipo(cellValue)
          else if (col.key === "local") cellValue = obterLabelLocal(cellValue)
          else if (col.key === "situacao") {
            if (cellValue === "PENDENTE") textColor = colors.accentRed
            else if (cellValue === "EM_ANDAMENTO") {
              textColor = colors.accentYellow
              cellValue = "ANDAMENTO" // Change the display value for the image
            } else if (cellValue === "ENCERRADO") textColor = colors.accentGreen
          }

          const cellPadding = 18
          const colActualWidth = tableWidth * col.width - 2 * cellPadding
          const baseFontSize = 30
          const observationFontSize = 28

          if (col.key === "observacao" && cellValue.length > 0) {
            ctx.font = `${"normal"} ${observationFontSize}px ${FONT_FAMILY}`
            const words = cellValue.split(" ")
            let line = ""
            const lines = []
            const maxLines = 2 // Reduzido para 2 para melhor encaixe e centralização

            for (let n = 0; n < words.length; n++) {
              const testLine = line + words[n] + " "
              const metrics = ctx.measureText(testLine)
              const testWidth = metrics.width
              if (testWidth > colActualWidth && n > 0) {
                lines.push(line.trim())
                line = words[n] + " "
              } else {
                line = testLine
              }
            }
            lines.push(line.trim())

            let linesToDraw = lines
            if (lines.length > maxLines) {
              linesToDraw = lines.slice(0, maxLines)
              const lastLineIndex = maxLines - 1
              let truncatedLine = linesToDraw[lastLineIndex]
              while (ctx.measureText(truncatedLine + "...").width > colActualWidth && truncatedLine.length > 0) {
                truncatedLine = truncatedLine.slice(0, -1)
              }
              linesToDraw[lastLineIndex] = truncatedLine + "..."
            }

            const numLinhasEfetivas = linesToDraw.length
            const paddingEntreLinhas = 4 // Espaçamento entre as linhas da observação
            // Altura total do bloco de texto da observação
            const totalTextHeight =
              numLinhasEfetivas > 0
                ? numLinhasEfetivas * observationFontSize + Math.max(0, numLinhasEfetivas - 1) * paddingEntreLinhas
                : 0

            let textYForObservation = currentY + (tableRowHeight - totalTextHeight) / 2

            for (const l of linesToDraw) {
              drawText(
                l,
                currentXCell + cellPadding,
                textYForObservation,
                observationFontSize,
                textColor,
                "normal",
                "left",
                "top", // Baseline 'top'
              )
              textYForObservation += observationFontSize + paddingEntreLinhas // Mover para o topo da próxima linha
            }
          } else {
            const textYForCell = currentY + (tableRowHeight - baseFontSize) / 2
            drawText(
              cellValue.toString(),
              currentXCell + (tableWidth * col.width) / 2,
              textYForCell,
              baseFontSize,
              textColor,
              "normal",
              "center",
              "top", // Baseline 'top'
            )
          }
          currentXCell += tableWidth * col.width
        })
        ctx.strokeStyle = colors.tableBorder
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(tableX, currentY + tableRowHeight)
        ctx.lineTo(tableX + tableWidth, currentY + tableRowHeight)
        ctx.stroke()
        currentY += tableRowHeight
      })

      // Rodapé da Imagem (usando baseline 'top')
      currentY += bottomPadding / 2
      const footerFontSize = 34
      const textYFooter = currentY + (tableFooterHeight - footerFontSize) / 2
      drawText(
        `Exportado em: ${format(new Date(), "dd/MM/yyyy HH:mm")} | Branco Peres Agro S/A`,
        canvasWidth / 2,
        textYFooter,
        footerFontSize,
        colors.textSecondary,
        "normal",
        "center",
        "top",
      )

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = `dashboard-completo-BP-${format(new Date(), "yyyy-MM-dd-HHmm")}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
            toast({ title: "Dashboard Exportado!", description: "Imagem completa do dashboard gerada com sucesso." })
          }
        },
        "image/png",
        1.0,
      )
    } catch (error) {
      console.error("Erro ao exportar dashboard:", error)
      toast({
        title: "Erro na Exportação",
        description: "Ocorreu um erro ao gerar o dashboard.",
        variant: "destructive",
      })
    } finally {
      setExportando(false)
    }
  }

  const importarRegistros = async (registrosImportados: Omit<MaintenanceRecord, "id">[]) => {
    try {
      setCarregando(true)
      const registrosCompletos: MaintenanceRecord[] = registrosImportados.map((r, i) => ({
        ...r,
        id: gerarProximoId() + i,
        horario_agendado: normalizarHorario(r.horario_agendado),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
      if (bdConectado) {
        try {
          const supabase = getSupabaseClient()
          const dadosParaBanco = registrosCompletos.map((r) => ({
            frota: r.frota,
            local: r.local,
            tipo_preventiva: r.tipo_preventiva,
            data_programada: r.data_programada,
            data_realizada: r.data_realizada || null,
            situacao: r.situacao,
            horario_agendado: r.horario_agendado,
            observacao: r.observacao || null,
            created_at: r.created_at,
            updated_at: r.updated_at,
          }))
          const { data, error } = await supabase.from("maintenance_records").insert(dadosParaBanco).select()
          if (error) throw error
          setRegistros((prev) => [...data, ...prev])
          return data
        } catch (dbError: any) {
          console.error("Erro ao importar registros para o banco:", dbError)
          toast({
            title: "Erro no Banco",
            description: `Falha ao importar para o banco: ${dbError.message}. Registros salvos localmente.`,
            variant: "warning",
          })
          setRegistros((prev) => [...registrosCompletos, ...prev])
          return registrosCompletos
        }
      } else {
        setRegistros((prev) => [...registrosCompletos, ...prev])
        return registrosCompletos
      }
    } catch (error) {
      console.error("Erro ao importar:", error)
      throw error
    } finally {
      setCarregando(false)
    }
  }

  const parseCsvDate = (dateStr: string | undefined | null): string => {
    if (!dateStr || typeof dateStr !== "string" || dateStr.trim() === "") return ""
    try {
      // Attempt 1: dd/MM/yyyy
      let dateParts = dateStr.split("/")
      if (dateParts.length === 3) {
        const day = Number.parseInt(dateParts[0], 10)
        const month = Number.parseInt(dateParts[1], 10) - 1 // Month is 0-indexed
        const year = Number.parseInt(dateParts[2], 10)
        if (
          !isNaN(day) &&
          !isNaN(month) &&
          !isNaN(year) &&
          year > 1000 &&
          year < 3000 &&
          month >= 0 &&
          month <= 11 &&
          day >= 1 &&
          day <= 31
        ) {
          const d = new Date(Date.UTC(year, month, day)) // Use UTC to avoid timezone issues with date-only strings
          if (isValid(d) && d.getUTCFullYear() === year && d.getUTCMonth() === month && d.getUTCDate() === day) {
            return format(d, "yyyy-MM-dd")
          }
        }
      }

      // Attempt 2: yyyy-MM-dd (ISO-like but could be just string)
      dateParts = dateStr.split("-")
      if (dateParts.length === 3) {
        const year = Number.parseInt(dateParts[0], 10)
        const month = Number.parseInt(dateParts[1], 10) - 1
        const day = Number.parseInt(dateParts[2], 10)
        if (
          !isNaN(day) &&
          !isNaN(month) &&
          !isNaN(year) &&
          year > 1000 &&
          year < 3000 &&
          month >= 0 &&
          month <= 11 &&
          day >= 1 &&
          day <= 31
        ) {
          const d = new Date(Date.UTC(year, month, day)) // Use UTC
          if (isValid(d) && d.getUTCFullYear() === year && d.getUTCMonth() === month && d.getUTCDate() === day) {
            return format(d, "yyyy-MM-dd")
          }
        }
      }

      // Attempt 3: Direct parseISO (for full ISO strings, less likely for simple CSV dates)
      const isoDate = parseISO(dateStr)
      if (isValid(isoDate)) {
        return format(isoDate, "yyyy-MM-dd")
      }

      console.warn(`Data inválida ou formato não reconhecido no CSV: ${dateStr}`)
      return ""
    } catch (e) {
      console.error(`Erro ao parsear data CSV "${dateStr}":`, e)
      return ""
    }
  }

  const getLocalValueFromLabel = (label: string): string => {
    const searchLabel = label?.toString().trim().toLowerCase() || ""
    const found = locais.find((l) => l.label.toLowerCase() === searchLabel || l.value.toLowerCase() === searchLabel)
    return found ? found.value : "LAVADOR" // Default
  }

  const getTipoPreventivaValueFromLabel = (label: string): string => {
    const searchLabel = label?.toString().trim().toLowerCase() || ""
    const found = tiposPreventiva.find(
      (tp) => tp.label.toLowerCase() === searchLabel || tp.value.toLowerCase() === searchLabel,
    )
    return found ? found.value : "lavagem_lubrificacao" // Default
  }

  const getSituacaoValueFromLabel = (label: string): "PENDENTE" | "ENCERRADO" | "EM_ANDAMENTO" => {
    const upperLabel = label?.toString().trim().toUpperCase() || ""
    if (upperLabel === "PENDENTE") return "PENDENTE"
    if (upperLabel === "ENCERRADO" || upperLabel === "CONCLUÍDO" || upperLabel === "CONCLUIDO") return "ENCERRADO"
    if (upperLabel === "EM ANDAMENTO" || upperLabel === "ANDAMENTO" || upperLabel === "EM_ANDAMENTO")
      return "EM_ANDAMENTO"
    return "PENDENTE" // Default
  }

  const handleProcessarCsvImport = async () => {
    if (!arquivoCsv) {
      toast({ title: "Nenhum arquivo", description: "Selecione um arquivo CSV.", variant: "destructive" })
      return
    }
    try {
      setCarregando(true)
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const data = e.target?.result
          if (!data) throw new Error("Falha ao ler arquivo")
          const workbook = XLSX.read(data, { type: "binary", cellDates: true }) // cellDates can help with Excel dates
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          // Using raw: false to get formatted strings if cellDates doesn't work as expected for CSV dates
          const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { raw: false, defval: "" })

          if (jsonData.length === 0) {
            toast({ title: "Arquivo Vazio", description: "O CSV importado não contém dados.", variant: "warning" })
            setDialogoImportar(false)
            setArquivoCsv(null)
            return
          }

          const expectedHeaders = [
            "Frota",
            "Local",
            "Tipo Preventiva",
            "Data Programada",
            "Situação",
            "Horário Agendado",
          ] // Minimal expected
          const actualHeaders = Object.keys(jsonData[0])
          if (!expectedHeaders.every((header) => actualHeaders.includes(header))) {
            toast({
              title: "Cabeçalho Inválido",
              description: "O CSV não parece ter os cabeçalhos esperados. Verifique o modelo.",
              variant: "destructive",
            })
            setCarregando(false)
            return
          }

          const novosRegistrosImportados: Omit<MaintenanceRecord, "id">[] = jsonData
            .map((row: any, index: number) => {
              const dataProgramadaStr = row["Data Programada"]?.toString().trim()
              const dataProgramada = parseCsvDate(dataProgramadaStr)

              const dataRealizadaStr = row["Data Realizada"]?.toString().trim()
              const dataRealizada = dataRealizadaStr ? parseCsvDate(dataRealizadaStr) : undefined

              if (!row["Frota"]?.toString().trim()) {
                console.warn(`Linha ${index + 2} do CSV ignorada: Frota ausente.`)
                return null
              }
              if (!dataProgramada) {
                console.warn(
                  `Linha ${index + 2} do CSV (${row["Frota"]}) ignorada: Data Programada inválida ou ausente ('${dataProgramadaStr}').`,
                )
                return null
              }

              return {
                frota: row["Frota"].toString().trim(),
                local: getLocalValueFromLabel(row["Local"]?.toString().trim()),
                tipo_preventiva: getTipoPreventivaValueFromLabel(row["Tipo Preventiva"]?.toString().trim()),
                data_programada: dataProgramada,
                data_realizada: dataRealizada,
                situacao: getSituacaoValueFromLabel(row["Situação"]?.toString().trim()),
                horario_agendado: normalizarHorario(row["Horário Agendado"]?.toString().trim()),
                observacao: row["Observação"]?.toString().trim() || "",
              }
            })
            .filter((record) => record !== null) as Omit<MaintenanceRecord, "id">[]

          if (novosRegistrosImportados.length === 0 && jsonData.length > 0) {
            toast({
              title: "Dados Inválidos",
              description:
                "Nenhum registro válido encontrado no CSV após processamento. Verifique os formatos de data (dd/MM/yyyy ou yyyy-MM-dd) e os valores obrigatórios.",
              variant: "warning",
            })
          } else if (novosRegistrosImportados.length > 0) {
            await importarRegistros(novosRegistrosImportados)
            toast({ title: "Sucesso", description: `${novosRegistrosImportados.length} registros importados do CSV.` })
          }

          setDialogoImportar(false)
          setArquivoCsv(null)
        } catch (parseError) {
          console.error("Erro ao processar CSV:", parseError)
          const msg = parseError instanceof Error ? parseError.message : "Erro desconhecido ao processar CSV."
          toast({
            title: "Erro no CSV",
            description: `Falha ao processar o arquivo CSV. ${msg}`,
            variant: "destructive",
          })
        } finally {
          setCarregando(false)
        }
      }
      reader.onerror = () => {
        toast({ title: "Erro de Leitura", description: "Não foi possível ler o arquivo.", variant: "destructive" })
        setCarregando(false)
      }
      reader.readAsBinaryString(arquivoCsv)
    } catch (error) {
      console.error("Erro ao iniciar importação:", error)
      toast({ title: "Erro", description: "Ocorreu um erro ao iniciar a importação.", variant: "destructive" })
      setCarregando(false)
    }
  }

  const obterLabelTipo = (valor: string) => tiposPreventiva.find((t) => t.value === valor)?.label || valor
  const obterLabelLocal = (valor: string) => locais.find((l) => l.value === valor)?.label || valor

  const registrosFiltrados = registros.filter((r) => {
    const busca = termoBusca.toLowerCase()
    const correspondeBusca =
      r.frota.toLowerCase().includes(busca) ||
      r.local.toLowerCase().includes(busca) ||
      (r.observacao && r.observacao.toLowerCase().includes(busca))
    const correspondeTipo = filtroTipo === "todos" || r.tipo_preventiva === filtroTipo
    const correspondeSituacao = filtroSituacao === "todos" || r.situacao === filtroSituacao
    const correspondeLocal = filtroLocal === "todos" || r.local === filtroLocal
    let correspondeData = true
    if (dataSelecionada && isValid(dataSelecionada)) {
      try {
        correspondeData = r.data_programada === format(dataSelecionada, "yyyy-MM-dd")
      } catch (e) {
        correspondeData = false
      }
    }
    return correspondeBusca && correspondeTipo && correspondeSituacao && correspondeLocal && correspondeData
  })

  const renderizarStatus = (situacao: string) => {
    const commonClasses =
      "inline-flex items-center px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold border shadow-sm"
    if (situacao === "PENDENTE")
      return (
        <span className={`${commonClasses} bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-200`}>
          <Clock className="w-3.5 h-3.5 mr-1.5 text-red-600" />
          PENDENTE
        </span>
      )
    if (situacao === "ENCERRADO")
      return (
        <span
          className={`${commonClasses} bg-gradient-to-r from-emerald-50 to-green-100 text-emerald-700 border-emerald-200`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
          ENCERRADO
        </span>
      )
    if (situacao === "EM_ANDAMENTO")
      return (
        <span
          className={`${commonClasses} bg-gradient-to-r from-amber-50 to-yellow-100 text-amber-700 border-amber-200`}
        >
          <PlayCircle className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
          ANDAMENTO
        </span>
      )
    return (
      <span className={`${commonClasses} bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200`}>
        {situacao}
      </span>
    )
  }
  const renderizarObservacao = (observacao?: string) => {
    if (!observacao) return ""
    if (observacao.includes("TROCA DE ÓLEO")) return <span className="text-green-600 font-medium">{observacao}</span>
    if (observacao.includes("EM VIAGEM") || observacao.includes("OFICINA") || observacao.includes("Gabelim"))
      return <span className="text-red-600 font-medium">{observacao}</span>
    return <span className="text-red-600">{observacao}</span>
  }
  const renderizarStatusConexao = () => {
    const iconClasses = "h-4 w-4"
    if (statusConexao === "conectando")
      return (
        <div className="flex items-center gap-2 text-yellow-600">
          <Loader2 className={`${iconClasses} animate-spin`} />
          <span className="text-xs sm:text-sm">Conectando...</span>
        </div>
      )
    if (statusConexao === "conectado")
      return (
        <div className="flex items-center gap-2 text-green-600">
          <Wifi className={iconClasses} />
          <span className="text-xs sm:text-sm">Online</span>
        </div>
      )
    if (statusConexao === "erro")
      return (
        <div className="flex items-center gap-2 text-red-600">
          <WifiOff className={iconClasses} />
          <span className="text-xs sm:text-sm">Tabela não encontrada</span>
        </div>
      )
    if (statusConexao === "offline")
      return (
        <div className="flex items-center gap-2 text-gray-600">
          <WifiOff className={iconClasses} />
          <span className="text-xs sm:text-sm">Offline</span>
        </div>
      )
    return null
  }

  const colorsForCharts = {
    bgPage: "#1A202C",
    bgHeader: "#2D3748",
    bgCard: "#252E3A",
    textTitle: "#FFFFFF",
    textPrimary: "#E2E8F0",
    textSecondary: "#A0AEC0",
    accentGreen: "#38A169",
    accentYellow: "#D69E2E",
    accentRed: "#E53E3E",
    borderCard: "#3A475A",
    gridLines: "rgba(100, 116, 139, 0.15)",
    tableHeaderBg: "#2c3e50",
    tableEvenRowBg: "#252E3A",
    tableOddRowBg: "#1F2937",
    tableBorder: "#4A5568",
  }

  const dadosGraficoSituacao = [
    {
      name: "Pendentes",
      value: registrosFiltrados.filter((r) => r.situacao === "PENDENTE").length,
      color: colorsForCharts.accentRed,
    },
    {
      name: "Encerrados",
      value: registrosFiltrados.filter((r) => r.situacao === "ENCERRADO").length,
      color: colorsForCharts.accentGreen,
    },
    {
      name: "Andamento",
      value: registrosFiltrados.filter((r) => r.situacao === "EM_ANDAMENTO").length,
      color: colorsForCharts.accentYellow,
    },
  ]
  const dadosGraficoTipo = tiposPreventiva.map((tipo) => ({
    name: tipo.label,
    value: registrosFiltrados.filter((r) => r.tipo_preventiva === tipo.value).length,
  }))

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-[#1e2a38] text-white p-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src="/company-logo.png"
                alt="Company Logo"
                className="h-12 w-12 lg:h-16 lg:w-16 object-contain drop-shadow-lg"
                style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.3))" }}
              />
              <div>
                <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  Controle de Lavagem e Lubrificação Logística
                </CardTitle>
                <CardDescription className="text-gray-300 text-sm sm:text-base lg:text-lg">
                  Branco Peres Agro S/A - {format(new Date(), "dd/MM/yyyy")}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {renderizarStatusConexao()}
              {statusConexao !== "conectado" ? (
                <Button
                  variant="outline"
                  className="bg-white text-[#1e2a38] hover:bg-gray-100"
                  onClick={tentarConectarBanco}
                  disabled={sincronizando}
                >
                  {sincronizando ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Database className="mr-2 h-4 w-4" />
                  )}{" "}
                  Conectar BD
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="bg-white text-[#1e2a38] hover:bg-gray-100"
                  onClick={sincronizarBanco}
                  disabled={sincronizando}
                >
                  {sincronizando ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}{" "}
                  Sincronizar
                </Button>
              )}
              <Button className="bg-red-600 hover:bg-red-700 text-white">Menu</Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {erro && (
            <Alert variant="destructive" className="m-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Aviso</AlertTitle>
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}
          {!bdConectado && (
            <Alert className="m-4 bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Modo Offline</AlertTitle>
              <AlertDescription className="text-blue-700">
                Sistema funcionando com dados locais. Para conectar ao banco, execute o script SQL.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="tabela" className="w-full">
            <div className="px-4 pt-2 border-b">
              <TabsList>
                <TabsTrigger
                  value="tabela"
                  className="text-white data-[state=active]:bg-[#1e2a38] data-[state=active]:text-white"
                >
                  Tabela
                </TabsTrigger>
                <TabsTrigger
                  value="dashboard"
                  className="text-white data-[state=active]:bg-[#1e2a38] data-[state=active]:text-white"
                >
                  Dashboard
                </TabsTrigger>
                <TabsTrigger
                  value="ia-extracao"
                  className="text-white data-[state=active]:bg-[#1e2a38] data-[state=active]:text-white"
                >
                  <Brain className="mr-2 h-4 w-4" />
                  IA Extração
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="tabela" className="p-0">
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                  <div className="flex-1 relative max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Buscar por frota, local ou observação..."
                      className="pl-8"
                      value={termoBusca}
                      onChange={(e) => setTermoBusca(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dataSelecionada && isValid(dataSelecionada) ? format(dataSelecionada, "dd/MM/yyyy") : "Data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dataSelecionada}
                          onSelect={setDataSelecionada}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <Select value={filtroLocal} onValueChange={setFiltroLocal}>
                      <SelectTrigger className="w-[140px] h-9">
                        <SelectValue placeholder="Local" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos locais</SelectItem>
                        {locais.map((l) => (
                          <SelectItem key={l.value} value={l.value}>
                            {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                      <SelectTrigger className="w-[160px] h-9">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos tipos</SelectItem>
                        {tiposPreventiva.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
                      <SelectTrigger className="w-[140px] h-9">
                        <SelectValue placeholder="Situação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas</SelectItem>
                        <SelectItem value="PENDENTE">Pendente</SelectItem>
                        <SelectItem value="EM_ANDAMENTO">Andamento</SelectItem>
                        <SelectItem value="ENCERRADO">Encerrado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9"
                      onClick={() => {
                        setTermoBusca("")
                        setFiltroTipo("todos")
                        setFiltroSituacao("todos")
                        setFiltroLocal("todos")
                        setDataSelecionada(undefined)
                      }}
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      Limpar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="h-9" onClick={() => setDialogoAdicionar(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200"
                      onClick={() => {
                        if (window.confirm("Excluir TODOS os registros?")) limparTodosRegistros()
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Limpar Tudo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-blue-200"
                      onClick={() => setDialogoImportar(true)}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Importar
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9"
                          disabled={exportando || registrosFiltrados.length === 0}
                        >
                          {exportando ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          Exportar
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={exportarExcel}
                          disabled={exportando || registrosFiltrados.length === 0}
                        >
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          Exportar Excel
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={exportarImagemPowerBIFuturisticAgro}
                          disabled={exportando || registrosFiltrados.length === 0 || !logoImageRef.current}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Dashboard Futurístico Agro
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={exportarModeloExcel} disabled={exportando}>
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          Baixar Modelo Excel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
              <div ref={tabelaRef} className="overflow-x-auto">
                <div className="bg-[#1e2a38] p-4 flex items-center gap-4">
                  <img src="/company-logo.png" alt="Company Logo" className="h-12 w-12 object-contain" />
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white">
                      Controle de Lavagem e Lubrificação Logística
                    </h2>
                    <p className="text-gray-300 text-xs sm:text-sm">
                      Branco Peres Agro S/A - {format(new Date(), "dd/MM/yyyy")}
                    </p>
                  </div>
                </div>
                <table className="w-full border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-[#2c3e50] text-white">
                      <th className="border border-gray-600 px-3 py-2 text-xs sm:text-sm font-medium">Frota</th>
                      <th className="border border-gray-600 px-3 py-2 text-xs sm:text-sm font-medium">Local</th>
                      <th className="border border-gray-600 px-3 py-2 text-xs sm:text-sm font-medium">
                        Tipo Preventiva
                      </th>
                      <th className="border border-gray-600 px-3 py-2 text-xs sm:text-sm font-medium">
                        Data Programada
                      </th>
                      <th className="border border-gray-600 px-3 py-2 text-xs sm:text-sm font-medium">
                        Data Realizada
                      </th>
                      <th className="border border-gray-600 px-3 py-2 text-xs sm:text-sm font-medium">Situação</th>
                      <th className="border border-gray-600 px-3 py-2 text-xs sm:text-sm font-medium">
                        Horário Agendado
                      </th>
                      <th className="border border-gray-600 px-3 py-2 text-xs sm:text-sm font-medium">Observação</th>
                      <th className="border border-gray-600 px-3 py-2 text-center text-xs sm:text-sm font-medium">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {carregando ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 border border-gray-300 bg-white">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                          Carregando...
                        </td>
                      </tr>
                    ) : registrosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 border border-gray-300 bg-white">
                          Nenhum registro encontrado
                        </td>
                      </tr>
                    ) : (
                      registrosFiltrados.map((r, idx) => (
                        <tr key={r.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-900 font-medium">
                            {r.frota}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-900">
                            {obterLabelLocal(r.local)}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-900">
                            {obterLabelTipo(r.tipo_preventiva)}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-900">
                            {formatDateSafe(r.data_programada)}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-900">
                            {formatDateSafe(r.data_realizada)}
                          </td>
                          <td className="border border-gray-300 px-3 py-2">{renderizarStatus(r.situacao)}</td>
                          <td className="border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-900">
                            {r.horario_agendado}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">
                            {renderizarObservacao(r.observacao)}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-700 hover:bg-gray-100 border border-gray-300"
                                  >
                                    {atualizandoStatus === r.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <MoreHorizontal className="h-4 w-4" />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => alterarStatus(r.id, "PENDENTE")}
                                    disabled={r.situacao === "PENDENTE" || atualizandoStatus === r.id}
                                  >
                                    <PauseCircle className="mr-2 h-4 w-4" />
                                    Pendente
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => alterarStatus(r.id, "EM_ANDAMENTO")}
                                    disabled={r.situacao === "EM_ANDAMENTO" || atualizandoStatus === r.id}
                                  >
                                    <PlayCircle className="mr-2 h-4 w-4" />
                                    Andamento
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => alterarStatus(r.id, "ENCERRADO")}
                                    disabled={r.situacao === "ENCERRADO" || atualizandoStatus === r.id}
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Encerrado
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:bg-blue-50 border border-gray-300"
                                onClick={() => {
                                  setRegistroSelecionado(r)
                                  setDialogoEditar(true)
                                }}
                              >
                                <SlidersHorizontal className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:bg-red-50 border border-gray-300"
                                onClick={() => excluirRegistro(r.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="dashboard" className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Total Registros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">{registrosFiltrados.length}</div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">Pendentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-red-600">
                      {registrosFiltrados.filter((r) => r.situacao === "PENDENTE").length}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">Andamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-amber-600">
                      {registrosFiltrados.filter((r) => r.situacao === "EM_ANDAMENTO").length}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-emerald-500 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">Concluídos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold text-emerald-600">
                      {registrosFiltrados.filter((r) => r.situacao === "ENCERRADO").length}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg font-semibold">Distribuição por Situação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dadosGraficoSituacao}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label
                          >
                            {dadosGraficoSituacao.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg font-semibold">Distribuição por Tipo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dadosGraficoTipo}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="ia-extracao" className="p-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center text-base font-semibold tracking-wide">
                    <Brain className="mr-2 h-5 w-5 text-green-500" />
                    IA Ultra-Avançada de Extração
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UltraAdvancedAIExtractor />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Diálogo para Adicionar Novo Registro */}
      <Dialog open={dialogoAdicionar} onOpenChange={setDialogoAdicionar}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-semibold">Adicionar Novo Registro</DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-muted-foreground">
              Preencha os campos abaixo para adicionar uma nova manutenção.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="frota" className="text-right text-xs sm:text-sm">
                Frota
              </Label>
              <Input
                id="frota"
                value={novoRegistro.frota}
                onChange={(e) => setNovoRegistro({ ...novoRegistro, frota: e.target.value })}
                className="col-span-3"
                placeholder="Ex: 6597"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="local" className="text-right text-xs sm:text-sm">
                Local
              </Label>
              <Select
                value={novoRegistro.local}
                onValueChange={(value) => setNovoRegistro({ ...novoRegistro, local: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o local" />
                </SelectTrigger>
                <SelectContent>
                  {locais.map((local) => (
                    <SelectItem key={local.value} value={local.value}>
                      {local.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tipo_preventiva" className="text-right text-xs sm:text-sm">
                Tipo Preventiva
              </Label>
              <Select
                value={novoRegistro.tipo_preventiva}
                onValueChange={(value) => setNovoRegistro({ ...novoRegistro, tipo_preventiva: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposPreventiva.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="data_programada" className="text-right text-xs sm:text-sm">
                Data Programada
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="col-span-3 justify-start font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {novoRegistro.data_programada ? (
                      formatDateSafe(novoRegistro.data_programada)
                    ) : (
                      <span>Escolha uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={novoRegistro.data_programada ? parseISO(novoRegistro.data_programada) : undefined}
                    onSelect={(date) =>
                      setNovoRegistro({
                        ...novoRegistro,
                        data_programada: date ? format(date, "yyyy-MM-dd") : "",
                      })
                    }
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="horario_agendado" className="text-right text-xs sm:text-sm">
                Horário Agendado
              </Label>
              <Input
                id="horario_agendado"
                type="time"
                value={novoRegistro.horario_agendado}
                onChange={(e) => setNovoRegistro({ ...novoRegistro, horario_agendado: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="observacao" className="text-right text-xs sm:text-sm">
                Observação
              </Label>
              <Textarea
                id="observacao"
                value={novoRegistro.observacao}
                onChange={(e) => setNovoRegistro({ ...novoRegistro, observacao: e.target.value })}
                className="col-span-3"
                placeholder="Detalhes adicionais"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={adicionarRegistro} disabled={carregando}>
              {carregando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar Registro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para Editar Registro */}
      {registroSelecionado && dialogoEditar && (
        <Dialog open={dialogoEditar} onOpenChange={setDialogoEditar}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-semibold">Editar Registro</DialogTitle>
              <DialogDescription className="text-sm sm:text-base text-muted-foreground">
                Modifique os campos abaixo para atualizar a manutenção.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-frota" className="text-right text-xs sm:text-sm">
                  Frota
                </Label>
                <Input
                  id="edit-frota"
                  value={registroSelecionado.frota}
                  onChange={(e) => setRegistroSelecionado({ ...registroSelecionado, frota: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-local" className="text-right text-xs sm:text-sm">
                  Local
                </Label>
                <Select
                  value={registroSelecionado.local}
                  onValueChange={(value) => setRegistroSelecionado({ ...registroSelecionado, local: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locais.map((local) => (
                      <SelectItem key={local.value} value={local.value}>
                        {local.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-tipo_preventiva" className="text-right text-xs sm:text-sm">
                  Tipo Preventiva
                </Label>
                <Select
                  value={registroSelecionado.tipo_preventiva}
                  onValueChange={(value) => setRegistroSelecionado({ ...registroSelecionado, tipo_preventiva: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposPreventiva.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-data_programada" className="text-right text-xs sm:text-sm">
                  Data Programada
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="col-span-3 justify-start font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {registroSelecionado.data_programada ? (
                        formatDateSafe(registroSelecionado.data_programada)
                      ) : (
                        <span>Escolha data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={
                        registroSelecionado.data_programada ? parseISO(registroSelecionado.data_programada) : undefined
                      }
                      onSelect={(date) =>
                        setRegistroSelecionado({
                          ...registroSelecionado,
                          data_programada: date ? format(date, "yyyy-MM-dd") : "",
                        })
                      }
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-horario_agendado" className="text-right text-xs sm:text-sm">
                  Horário
                </Label>
                <Input
                  id="edit-horario_agendado"
                  type="time"
                  value={registroSelecionado.horario_agendado}
                  onChange={(e) => setRegistroSelecionado({ ...registroSelecionado, horario_agendado: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-observacao" className="text-right text-xs sm:text-sm">
                  Observação
                </Label>
                <Textarea
                  id="edit-observacao"
                  value={registroSelecionado.observacao || ""}
                  onChange={(e) => setRegistroSelecionado({ ...registroSelecionado, observacao: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={atualizarRegistro} disabled={carregando}>
                {carregando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {/* Diálogo para Importar CSV */}
      <Dialog
        open={dialogoImportar}
        onOpenChange={(isOpen) => {
          setDialogoImportar(isOpen)
          if (!isOpen) setArquivoCsv(null)
        }}
      >
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-semibold">Importar Registros via CSV</DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-muted-foreground">
              Selecione um arquivo CSV (.csv) para importar. Certifique-se que as colunas correspondem ao modelo. As
              datas devem estar no formato dd/MM/yyyy ou yyyy-MM-dd.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={(e) => setArquivoCsv(e.target.files ? e.target.files[0] : null)}
              className="col-span-full"
            />
            <Button onClick={exportarModeloExcel} variant="link" className="mt-1 p-0 h-auto justify-start text-sm">
              <Download className="mr-1 h-3 w-3" />
              Baixar modelo de importação (Excel)
            </Button>
            <Alert variant="default" className="mt-2">
              <FileSpreadsheet className="h-4 w-4" />
              <AlertTitle className="text-sm sm:text-base font-semibold">Colunas Esperadas no CSV:</AlertTitle>
              <AlertDescription className="text-xs sm:text-sm">
                Frota, Local, Tipo Preventiva, Data Programada, Data Realizada (opcional), Situação, Horário Agendado,
                Observação (opcional).
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={() => setArquivoCsv(null)}>
                Cancelar
              </Button>
            </DialogClose>
            <Button onClick={handleProcessarCsvImport} disabled={!arquivoCsv || carregando}>
              {carregando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Importar Arquivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default WashingLubricationControl
