"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
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
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
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
  LineChart,
  Line,
  AreaChart,
  Area,
  Sector,
} from "recharts"

// Tipos
interface MaintenanceRecord {
  id: number
  frota: string
  descricao_ponto: string
  tipo_preventiva: string
  data_programada: string
  data_realizada?: string
  situacao: "PENDENTE" | "ENCERRADO" | "EM_ANDAMENTO"
  horario_agendado: string
  observacao?: string
  updated_at?: string
}

const tiposPreventiva = [
  { value: "lavagem_lubrificacao", label: "Lavagem / Lubrificação" },
  { value: "lavagem", label: "Lavagem" },
  { value: "lubrificacao", label: "Lubrificação" },
  { value: "troca_oleo", label: "Troca de Óleo" },
  { value: "lavagem_completa", label: "Lavagem Completa" },
]

const descricoesPonto = [
  { value: "LAVADOR", label: "LAVADOR" },
  { value: "LUBRIFICADOR", label: "LUBRIFICADOR" },
  { value: "MECANICO", label: "MECÂNICO" },
]

// Dados locais para fallback
const dadosLocais: MaintenanceRecord[] = [
  {
    id: 1,
    frota: "6597",
    descricao_ponto: "LAVADOR",
    tipo_preventiva: "lavagem_lubrificacao",
    data_programada: "2025-05-11",
    situacao: "PENDENTE",
    horario_agendado: "04:00",
    observacao: "TROCA DE ÓLEO",
  },
  {
    id: 2,
    frota: "8805",
    descricao_ponto: "LAVADOR",
    tipo_preventiva: "lavagem_lubrificacao",
    data_programada: "2025-05-17",
    situacao: "PENDENTE",
    horario_agendado: "08:00",
    observacao: "EM VIAGEM",
  },
  {
    id: 3,
    frota: "4597",
    descricao_ponto: "LAVADOR",
    tipo_preventiva: "lavagem_lubrificacao",
    data_programada: "2025-05-18",
    situacao: "PENDENTE",
    horario_agendado: "14:30",
    observacao: "EM VIAGEM",
  },
  {
    id: 4,
    frota: "6602",
    descricao_ponto: "LAVADOR",
    tipo_preventiva: "lavagem_lubrificacao",
    data_programada: "2025-05-18",
    situacao: "PENDENTE",
    horario_agendado: "02:00",
    observacao: "OFICINA GABELIM",
  },
  {
    id: 5,
    frota: "4583",
    descricao_ponto: "LAVADOR",
    tipo_preventiva: "lavagem_lubrificacao",
    data_programada: "2025-05-19",
    situacao: "PENDENTE",
    horario_agendado: "20:00",
    observacao: "TROCA DE ÓLEO",
  },
  {
    id: 6,
    frota: "4620",
    descricao_ponto: "LAVADOR",
    tipo_preventiva: "lavagem_lubrificacao",
    data_programada: "2025-05-19",
    situacao: "PENDENTE",
    horario_agendado: "05:00",
    observacao: "",
  },
  {
    id: 7,
    frota: "4581",
    descricao_ponto: "LAVADOR",
    tipo_preventiva: "lavagem_lubrificacao",
    data_programada: "2025-05-20",
    situacao: "PENDENTE",
    horario_agendado: "20:00",
    observacao: "TROCA DE ÓLEO",
  },
  {
    id: 8,
    frota: "8790",
    descricao_ponto: "LAVADOR",
    tipo_preventiva: "lavagem_lubrificacao",
    data_programada: "2025-05-21",
    data_realizada: "2025-05-21",
    situacao: "ENCERRADO",
    horario_agendado: "07:00",
    observacao: "",
  },
  {
    id: 9,
    frota: "6597",
    descricao_ponto: "LAVADOR",
    tipo_preventiva: "lavagem_lubrificacao",
    data_programada: "2025-05-21",
    situacao: "PENDENTE",
    horario_agendado: "08:00",
    observacao: "Está fazendo coletas",
  },
  {
    id: 10,
    frota: "8793",
    descricao_ponto: "LAVADOR",
    tipo_preventiva: "lavagem_lubrificacao",
    data_programada: "2025-05-21",
    data_realizada: "2025-05-21",
    situacao: "ENCERRADO",
    horario_agendado: "13:00",
    observacao: "",
  },
  {
    id: 11,
    frota: "32232",
    descricao_ponto: "LAVADOR",
    tipo_preventiva: "lavagem_lubrificacao",
    data_programada: "2025-05-21",
    data_realizada: "2025-05-21",
    situacao: "ENCERRADO",
    horario_agendado: "14:00",
    observacao: "",
  },
  {
    id: 12,
    frota: "4575",
    descricao_ponto: "LAVADOR",
    tipo_preventiva: "lavagem_lubrificacao",
    data_programada: "2025-05-21",
    data_realizada: "2025-05-21",
    situacao: "ENCERRADO",
    horario_agendado: "15:00",
    observacao: "Aguardando ao lado do lavador",
  },
  {
    id: 13,
    frota: "48004",
    descricao_ponto: "LAVADOR",
    tipo_preventiva: "lavagem_lubrificacao",
    data_programada: "2025-05-21",
    data_realizada: "2025-05-21",
    situacao: "ENCERRADO",
    horario_agendado: "00:00",
    observacao: "",
  },
  {
    id: 14,
    frota: "4588",
    descricao_ponto: "LAVADOR",
    tipo_preventiva: "lavagem_lubrificacao",
    data_programada: "2025-05-21",
    data_realizada: "2025-05-21",
    situacao: "ENCERRADO",
    horario_agendado: "00:50",
    observacao: "",
  },
  {
    id: 15,
    frota: "8799",
    descricao_ponto: "LAVADOR",
    tipo_preventiva: "lavagem_lubrificacao",
    data_programada: "2025-05-21",
    situacao: "PENDENTE",
    horario_agendado: "02:00",
    observacao: "Gabelim",
  },
  {
    id: 16,
    frota: "4616",
    descricao_ponto: "LAVADOR",
    tipo_preventiva: "lavagem_lubrificacao",
    data_programada: "2025-05-21",
    situacao: "PENDENTE",
    horario_agendado: "04:00",
    observacao: "",
  },
  {
    id: 17,
    frota: "8794",
    descricao_ponto: "LAVADOR",
    tipo_preventiva: "lavagem_lubrificacao",
    data_programada: "2025-05-21",
    situacao: "PENDENTE",
    horario_agendado: "05:40",
    observacao: "",
  },
]

export function WashingLubricationControl() {
  // Estados
  const [registros, setRegistros] = useState<MaintenanceRecord[]>([])
  const [carregando, setCarregando] = useState(true)
  const [atualizandoStatus, setAtualizandoStatus] = useState<number | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [bdInicializado, setBdInicializado] = useState(false)
  const [termoBusca, setTermoBusca] = useState("")
  const [filtroTipo, setFiltroTipo] = useState<string>("todos")
  const [filtroSituacao, setFiltroSituacao] = useState<string>("todos")
  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>(new Date())
  const [dialogoAdicionar, setDialogoAdicionar] = useState(false)
  const [dialogoInicializarBd, setDialogoInicializarBd] = useState(false)
  const [dialogoCriarTabela, setDialogoCriarTabela] = useState(false)
  const [dialogoEditarRegistro, setDialogoEditarRegistro] = useState(false)
  const [registroSelecionado, setRegistroSelecionado] = useState<MaintenanceRecord | null>(null)
  const [statusInicializacao, setStatusInicializacao] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [mensagemInicializacao, setMensagemInicializacao] = useState("")
  const [filtroPeriodo, setFiltroPeriodo] = useState<{ de: Date | undefined; ate: Date | undefined }>({
    de: undefined,
    ate: undefined,
  })
  const [exportando, setExportando] = useState(false)
  const [criandoTabela, setCriandoTabela] = useState(false)
  const [sincronizando, setSincronizando] = useState(false)
  const [activeIndexTipo, setActiveIndexTipo] = useState(0)
  const [activeIndexSituacao, setActiveIndexSituacao] = useState(0)

  // Novo registro
  const [novoRegistro, setNovoRegistro] = useState<Omit<MaintenanceRecord, "id">>({
    frota: "",
    descricao_ponto: "LAVADOR",
    tipo_preventiva: "lavagem_lubrificacao",
    data_programada: format(new Date(), "yyyy-MM-dd"),
    situacao: "PENDENTE",
    horario_agendado: "08:00",
    observacao: "",
  })

  // Refs para exportação
  const relatorioRef = useRef<HTMLDivElement>(null)

  // Inicialização
  useEffect(() => {
    // Inicializar com dados locais imediatamente para melhor UX
    setRegistros(dadosLocais)
    setCarregando(false)

    // Verificar banco de dados automaticamente na inicialização
    verificarBancoDados()
  }, [])

  // Função para buscar registros do banco de dados
  const buscarRegistros = async () => {
    try {
      if (!bdInicializado) {
        return false
      }

      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from("maintenance_records")
        .select("*")
        .order("data_programada", { ascending: false })

      if (error) {
        console.error("Erro ao buscar registros:", error)
        return false
      }

      if (data && data.length > 0) {
        setRegistros(data)
        return true
      } else {
        console.log("Nenhum registro encontrado na tabela.")
        return false
      }
    } catch (err) {
      console.error("Erro ao buscar registros:", err)
      return false
    }
  }

  // Função para verificar o banco de dados
  const verificarBancoDados = async () => {
    setStatusInicializacao("loading")
    setMensagemInicializacao("Verificando conexão com o banco de dados...")

    try {
      // Usar dados locais como fallback inicial
      setRegistros(dadosLocais)

      try {
        // Usar o cliente Supabase do singleton
        const supabase = getSupabaseClient()

        setMensagemInicializacao("Verificando se a tabela existe...")

        // Verificar se a tabela existe
        const { error } = await supabase.from("maintenance_records").select("id").limit(1)

        if (error) {
          // Se a tabela não existir, mostrar mensagem e oferecer opção para criar
          if (error.message && error.message.includes("does not exist")) {
            setMensagemInicializacao(
              "A tabela 'maintenance_records' não existe. Você pode criá-la clicando no botão abaixo.",
            )
            setStatusInicializacao("error")
            setDialogoCriarTabela(true)
            return
          }

          throw error
        }

        // Tabela existe, buscar registros
        setStatusInicializacao("success")
        setMensagemInicializacao("Tabela encontrada! Carregando registros...")
        setBdInicializado(true)

        const { data, error: fetchError } = await supabase
          .from("maintenance_records")
          .select("*")
          .order("data_programada", { ascending: false })

        if (fetchError) {
          throw new Error(`Erro ao buscar registros: ${fetchError.message}`)
        }

        if (data && data.length > 0) {
          setRegistros(data)
        } else {
          // Se não houver dados, manter os dados locais
          console.log("Nenhum registro encontrado na tabela. Usando dados locais.")
        }
      } catch (tableError) {
        console.error("Erro ao verificar/buscar tabela:", tableError)

        // Verificar se o erro é porque a tabela não existe
        if (tableError instanceof Error && tableError.message.includes("does not exist")) {
          setMensagemInicializacao(
            "A tabela 'maintenance_records' não existe. Você pode criá-la clicando no botão abaixo.",
          )
          setStatusInicializacao("error")
          setDialogoCriarTabela(true)
          return
        }

        setStatusInicializacao("error")
        setMensagemInicializacao(
          `Erro ao verificar tabela: ${tableError instanceof Error ? tableError.message : String(tableError)}. Usando dados locais.`,
        )
        setBdInicializado(false)
      }
    } catch (err) {
      console.error("Erro ao inicializar banco de dados:", err)
      setStatusInicializacao("error")
      setMensagemInicializacao(
        `Erro ao conectar com o banco de dados: ${err instanceof Error ? err.message : String(err)}. Usando dados locais.`,
      )
      setBdInicializado(false)
    } finally {
      setCarregando(false)
    }
  }

  // Função para popular a tabela com dados de exemplo
  const popularTabela = async () => {
    setCriandoTabela(true)

    try {
      const supabase = getSupabaseClient()

      if (!supabase) {
        throw new Error("Cliente Supabase não inicializado corretamente")
      }

      console.log("Verificando se a tabela existe...")

      // Verificar se a tabela existe
      const { error: checkError } = await supabase.from("maintenance_records").select("id").limit(1)

      if (checkError && checkError.message.includes("does not exist")) {
        throw new Error("A tabela 'maintenance_records' não existe. Por favor, crie a tabela primeiro.")
      }

      console.log("Tabela encontrada, inserindo dados de exemplo...")

      // Inserir dados de exemplo
      for (const registro of dadosLocais.slice(0, 5)) {
        // Formatar as datas corretamente para o formato de data do PostgreSQL
        const formattedRecord = {
          frota: registro.frota,
          descricao_ponto: registro.descricao_ponto,
          tipo_preventiva: registro.tipo_preventiva,
          data_programada: registro.data_programada, // Já está no formato YYYY-MM-DD
          data_realizada: registro.data_realizada, // Já está no formato YYYY-MM-DD ou undefined
          situacao: registro.situacao,
          horario_agendado: registro.horario_agendado,
          observacao: registro.observacao || null,
          updated_at: new Date().toISOString(),
        }

        const { error: insertError } = await supabase.from("maintenance_records").insert(formattedRecord)

        if (insertError) {
          console.warn("Erro ao inserir dado de exemplo:", insertError)
          // Continuar mesmo se houver erro em um dos registros de exemplo
        }
      }

      toast({
        title: "Dados inseridos com sucesso",
        description: "A tabela foi populada com dados de exemplo.",
      })

      // Fechar o diálogo de criar tabela
      setDialogoCriarTabela(false)

      // Atualizar status
      setStatusInicializacao("success")
      setMensagemInicializacao("Dados inseridos com sucesso! Sistema pronto para uso.")
      setBdInicializado(true)

      // Buscar registros
      const { data } = await supabase.from("maintenance_records").select("*")
      if (data && data.length > 0) {
        setRegistros(data)
      }
    } catch (err) {
      console.error("Erro ao popular tabela:", err)
      toast({
        title: "Erro ao popular tabela",
        description: `Ocorreu um erro: ${err instanceof Error ? err.message : String(err)}`,
        variant: "destructive",
      })

      setStatusInicializacao("error")
      setMensagemInicializacao(
        `Erro ao popular tabela: ${err instanceof Error ? err.message : String(err)}. Usando dados locais.`,
      )
    } finally {
      setCriandoTabela(false)
    }
  }

  // Adicionar registro
  const adicionarRegistro = async () => {
    if (!bdInicializado) {
      // Modo offline - adiciona ao estado local
      const novoId = Math.max(...registros.map((r) => r.id), 0) + 1
      const registroComId = {
        id: novoId,
        ...novoRegistro,
        updated_at: new Date().toISOString(),
      }
      setRegistros([registroComId, ...registros])
      setDialogoAdicionar(false)

      toast({
        title: "Registro adicionado (modo offline)",
        description: "O registro foi adicionado localmente.",
      })

      // Limpar formulário
      setNovoRegistro({
        frota: "",
        descricao_ponto: "LAVADOR",
        tipo_preventiva: "lavagem_lubrificacao",
        data_programada: format(new Date(), "yyyy-MM-dd"),
        situacao: "PENDENTE",
        horario_agendado: "08:00",
        observacao: "",
      })

      return
    }

    try {
      const supabase = getSupabaseClient()

      const registroParaAdicionar = {
        ...novoRegistro,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("maintenance_records").insert([registroParaAdicionar]).select()

      if (error) throw error

      toast({
        title: "Registro adicionado",
        description: "O registro de manutenção foi adicionado com sucesso.",
      })

      setRegistros((prev) => [...(data || []), ...prev])
      setDialogoAdicionar(false)

      // Limpar formulário
      setNovoRegistro({
        frota: "",
        descricao_ponto: "LAVADOR",
        tipo_preventiva: "lavagem_lubrificacao",
        data_programada: format(new Date(), "yyyy-MM-dd"),
        situacao: "PENDENTE",
        horario_agendado: "08:00",
        observacao: "",
      })
    } catch (err) {
      console.error("Erro ao adicionar registro:", err)
      toast({
        title: "Erro ao adicionar registro",
        description: "Ocorreu um erro ao adicionar o registro de manutenção.",
        variant: "destructive",
      })
    }
  }

  // Atualizar registro
  const atualizarRegistro = async (registro: MaintenanceRecord) => {
    if (!bdInicializado) {
      // Modo offline - atualiza no estado local
      setRegistros((prev) =>
        prev.map((r) => (r.id === registro.id ? { ...registro, updated_at: new Date().toISOString() } : r)),
      )

      toast({
        title: "Registro atualizado (modo offline)",
        description: "O registro foi atualizado localmente.",
      })

      return
    }

    try {
      const supabase = getSupabaseClient()

      const registroParaAtualizar = {
        ...registro,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("maintenance_records").update(registroParaAtualizar).eq("id", registro.id)

      if (error) throw error

      setRegistros((prev) =>
        prev.map((r) => (r.id === registro.id ? { ...registro, updated_at: new Date().toISOString() } : r)),
      )

      toast({
        title: "Registro atualizado",
        description: "O registro de manutenção foi atualizado com sucesso.",
      })
    } catch (err) {
      console.error("Erro ao atualizar registro:", err)
      toast({
        title: "Erro ao atualizar registro",
        description: "Ocorreu um erro ao atualizar o registro de manutenção.",
        variant: "destructive",
      })
    }
  }

  // Excluir registro
  const excluirRegistro = async (id: number) => {
    if (!bdInicializado) {
      setRegistros((prev) => prev.filter((registro) => registro.id !== id))
      toast({
        title: "Registro excluído (modo offline)",
        description: "O registro foi removido localmente.",
      })
      return
    }

    try {
      const supabase = getSupabaseClient()

      const { error } = await supabase.from("maintenance_records").delete().eq("id", id)

      if (error) throw error

      setRegistros((prev) => prev.filter((registro) => registro.id !== id))
      toast({
        title: "Registro excluído",
        description: "O registro de manutenção foi excluído com sucesso.",
      })
    } catch (err) {
      console.error("Erro ao excluir registro:", err)
      toast({
        title: "Erro ao excluir registro",
        description: "Ocorreu um erro ao excluir o registro de manutenção.",
        variant: "destructive",
      })
    }
  }

  // Alterar status do registro
  const alterarStatusRegistro = async (id: number, novoStatus: "PENDENTE" | "ENCERRADO" | "EM_ANDAMENTO") => {
    setAtualizandoStatus(id)

    try {
      const registro = registros.find((r) => r.id === id)
      if (!registro) {
        throw new Error("Registro não encontrado")
      }

      const registroAtualizado: MaintenanceRecord = {
        ...registro,
        situacao: novoStatus,
        data_realizada: novoStatus === "ENCERRADO" ? format(new Date(), "yyyy-MM-dd") : registro.data_realizada,
        updated_at: new Date().toISOString(),
      }

      await atualizarRegistro(registroAtualizado)
    } catch (err) {
      console.error("Erro ao alterar status:", err)
      toast({
        title: "Erro ao alterar status",
        description: "Ocorreu um erro ao alterar o status do registro.",
        variant: "destructive",
      })
    } finally {
      setAtualizandoStatus(null)
    }
  }

  // Sincronizar com o banco de dados
  const sincronizarComBancoDados = async () => {
    if (!bdInicializado) {
      toast({
        title: "Banco de dados não inicializado",
        description: "Verifique a conexão com o banco de dados primeiro.",
        variant: "destructive",
      })
      return
    }

    setSincronizando(true)

    try {
      const resultado = await buscarRegistros()

      if (resultado) {
        toast({
          title: "Sincronização concluída",
          description: "Os registros foram sincronizados com o banco de dados.",
        })
      } else {
        toast({
          title: "Nenhum registro encontrado",
          description: "Não foram encontrados registros no banco de dados.",
        })
      }
    } catch (err) {
      console.error("Erro ao sincronizar:", err)
      toast({
        title: "Erro ao sincronizar",
        description: "Ocorreu um erro ao sincronizar com o banco de dados.",
        variant: "destructive",
      })
    } finally {
      setSincronizando(false)
    }
  }

  // Filtrar registros
  const registrosFiltrados = registros.filter((registro) => {
    const correspondeTermoBusca =
      registro.frota.toLowerCase().includes(termoBusca.toLowerCase()) ||
      (registro.observacao && registro.observacao.toLowerCase().includes(termoBusca.toLowerCase()))

    const correspondeTipo = filtroTipo === "todos" || registro.tipo_preventiva === filtroTipo
    const correspondeSituacao = filtroSituacao === "todos" || registro.situacao === filtroSituacao

    // Filtro de período
    const dataProgramada = new Date(registro.data_programada)
    const correspondePeriodo =
      (!filtroPeriodo.de || dataProgramada >= filtroPeriodo.de) &&
      (!filtroPeriodo.ate || dataProgramada <= filtroPeriodo.ate)

    return correspondeTermoBusca && correspondeTipo && correspondeSituacao && correspondePeriodo
  })

  // Exportar para PDF
  const exportarPDF = async () => {
    if (!relatorioRef.current) return

    setExportando(true)

    try {
      const canvas = await html2canvas(relatorioRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      })

      const imgWidth = 280
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Adicionar imagem do relatório
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight)

      pdf.save("controle-lavagem-lubrificacao.pdf")

      toast({
        title: "PDF exportado",
        description: "O relatório foi exportado com sucesso.",
      })
    } catch (err) {
      console.error("Erro ao exportar PDF:", err)
      toast({
        title: "Erro ao exportar",
        description: "Ocorreu um erro ao exportar o relatório para PDF.",
        variant: "destructive",
      })
    } finally {
      setExportando(false)
    }
  }

  // Exportar para Excel
  const exportarExcel = () => {
    setExportando(true)

    try {
      const worksheet = XLSX.utils.json_to_sheet(
        registrosFiltrados.map((registro) => ({
          "Frota Veículo": registro.frota,
          "DESCRIÇÃO PONTO": registro.descricao_ponto,
          "TIPO PREVENTIVA": obterLabelTipoPreventiva(registro.tipo_preventiva),
          "DATA PROGRAMADA": format(new Date(registro.data_programada), "dd/MM/yyyy"),
          "DATA REALIZADA": registro.data_realizada ? format(new Date(registro.data_realizada), "dd/MM/yyyy") : "",
          SITUAÇÃO: registro.situacao,
          "HORÁRIO AGENDADO": registro.horario_agendado,
          Observação: registro.observacao || "",
          "Última Atualização": registro.updated_at ? format(new Date(registro.updated_at), "dd/MM/yyyy HH:mm") : "",
        })),
      )

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Controle Lav Lubrificação")

      // Ajustar largura das colunas
      const colWidths = [
        { wch: 12 }, // Frota Veículo
        { wch: 15 }, // DESCRIÇÃO PONTO
        { wch: 20 }, // TIPO PREVENTIVA
        { wch: 15 }, // DATA PROGRAMADA
        { wch: 15 }, // DATA REALIZADA
        { wch: 12 }, // SITUAÇÃO
        { wch: 15 }, // HORÁRIO AGENDADO
        { wch: 40 }, // Observação
        { wch: 20 }, // Última Atualização
      ]

      worksheet["!cols"] = colWidths

      // Converter para array buffer
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })

      // Criar Blob a partir do buffer
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

      // Criar URL para o blob
      const url = URL.createObjectURL(blob)

      // Criar elemento de link para download
      const link = document.createElement("a")
      link.href = url
      link.download = "controle-lavagem-lubrificacao.xlsx"

      // Adicionar à página, clicar e remover
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Liberar a URL do objeto
      URL.revokeObjectURL(url)

      toast({
        title: "Excel exportado",
        description: "O relatório foi exportado com sucesso.",
      })
    } catch (err) {
      console.error("Erro ao exportar Excel:", err)
      toast({
        title: "Erro ao exportar",
        description: `Ocorreu um erro ao exportar o relatório para Excel: ${err instanceof Error ? err.message : String(err)}`,
        variant: "destructive",
      })
    } finally {
      setExportando(false)
    }
  }

  // Função auxiliar para obter o label do tipo preventiva
  const obterLabelTipoPreventiva = (valor: string) => {
    const tipo = tiposPreventiva.find((t) => t.value === valor)
    return tipo ? tipo.label : valor
  }

  // Renderização da célula de situação com cores
  const renderizarSituacao = (situacao: string) => {
    switch (situacao) {
      case "PENDENTE":
        return <div className="bg-red-600 text-white text-center py-1 px-2 rounded-sm font-medium">PENDENTE</div>
      case "ENCERRADO":
        return <div className="bg-green-600 text-white text-center py-1 px-2 rounded-sm font-medium">ENCERRADO</div>
      case "EM_ANDAMENTO":
        return <div className="bg-yellow-500 text-white text-center py-1 px-2 rounded-sm font-medium">EM ANDAMENTO</div>
      default:
        return situacao
    }
  }

  // Renderização da célula de observação com cores
  const renderizarObservacao = (observacao?: string) => {
    if (!observacao) return ""

    if (observacao.includes("TROCA DE ÓLEO")) {
      return <div className="bg-green-600 text-white text-center py-1 px-2 rounded-sm">{observacao}</div>
    } else if (observacao.includes("EM VIAGEM")) {
      return <div className="bg-red-600 text-white text-center py-1 px-2 rounded-sm">{observacao}</div>
    } else if (observacao.includes("OFICINA") || observacao.includes("Gabelim")) {
      return <div className="bg-red-600 text-white text-center py-1 px-2 rounded-sm">{observacao}</div>
    }

    return observacao
  }

  // Funções para preparar dados para os gráficos
  const prepararDadosTipoPreventiva = () => {
    const dadosPorTipo = tiposPreventiva
      .map((tipo) => {
        const quantidade = registrosFiltrados.filter((r) => r.tipo_preventiva === tipo.value).length
        return {
          name: tipo.label,
          value: quantidade,
          color:
            tipo.value === "lavagem_lubrificacao"
              ? "#22c55e"
              : tipo.value === "lavagem"
                ? "#3b82f6"
                : tipo.value === "lubrificacao"
                  ? "#eab308"
                  : tipo.value === "troca_oleo"
                    ? "#ef4444"
                    : "#8b5cf6",
        }
      })
      .filter((item) => item.value > 0)

    return dadosPorTipo
  }

  const prepararDadosSituacao = () => {
    const pendentes = registrosFiltrados.filter((r) => r.situacao === "PENDENTE").length
    const emAndamento = registrosFiltrados.filter((r) => r.situacao === "EM_ANDAMENTO").length
    const encerrados = registrosFiltrados.filter((r) => r.situacao === "ENCERRADO").length

    return [
      { name: "Pendentes", value: pendentes, color: "#ef4444" },
      { name: "Em Andamento", value: emAndamento, color: "#eab308" },
      { name: "Encerrados", value: encerrados, color: "#22c55e" },
    ].filter((item) => item.value > 0)
  }

  const prepararDadosPorData = () => {
    // Agrupar registros por data
    const registrosPorData = registrosFiltrados.reduce((acc, registro) => {
      const data = format(new Date(registro.data_programada), "dd/MM/yyyy")
      if (!acc[data]) {
        acc[data] = {
          data,
          pendentes: 0,
          emAndamento: 0,
          encerrados: 0,
          total: 0,
        }
      }

      if (registro.situacao === "PENDENTE") acc[data].pendentes++
      else if (registro.situacao === "EM_ANDAMENTO") acc[data].emAndamento++
      else if (registro.situacao === "ENCERRADO") acc[data].encerrados++

      acc[data].total++

      return acc
    }, {})

    // Converter para array e ordenar por data
    return Object.values(registrosPorData).sort((a: any, b: any) => {
      const dataA = new Date(a.data.split("/").reverse().join("-"))
      const dataB = new Date(b.data.split("/").reverse().join("-"))
      return dataA.getTime() - dataB.getTime()
    })
  }

  const prepararDadosPorFrota = () => {
    // Agrupar registros por frota
    const registrosPorFrota = registrosFiltrados.reduce((acc, registro) => {
      if (!acc[registro.frota]) {
        acc[registro.frota] = {
          frota: registro.frota,
          pendentes: 0,
          emAndamento: 0,
          encerrados: 0,
          total: 0,
        }
      }

      if (registro.situacao === "PENDENTE") acc[registro.frota].pendentes++
      else if (registro.situacao === "EM_ANDAMENTO") acc[registro.frota].emAndamento++
      else if (registro.situacao === "ENCERRADO") acc[registro.frota].encerrados++

      acc[registro.frota].total++

      return acc
    }, {})

    // Converter para array e ordenar por total
    return Object.values(registrosPorFrota)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 10) // Limitar aos 10 maiores
  }

  // Componente para renderizar o tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-md shadow-lg">
          <p className="text-slate-300 font-medium">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color || entry.fill || entry.stroke }}>
              {`${entry.name || entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      )
    }

    return null
  }

  // Componente para renderizar o setor ativo no gráfico de pizza
  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props
    const sin = Math.sin(-RADIAN * midAngle)
    const cos = Math.cos(-RADIAN * midAngle)
    const sx = cx + (outerRadius + 10) * cos
    const sy = cy + (outerRadius + 10) * sin
    const mx = cx + (outerRadius + 30) * cos
    const my = cy + (outerRadius + 30) * sin
    const ex = mx + (cos >= 0 ? 1 : -1) * 22
    const ey = my
    const textAnchor = cos >= 0 ? "start" : "end"

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-sm font-medium">
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          textAnchor={textAnchor}
          fill="#999"
          className="text-xs"
        >{`${value} registros`}</text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" className="text-xs">
          {`(${(percent * 100).toFixed(2)}%)`}
        </text>
      </g>
    )
  }

  // Renderização
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-[#1e2a38] text-white p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-w5r6EZIgd51nAwt9Zn5bLhga0cn9hX.png"
                alt="Branco Peres Logo"
                className="h-16 w-16 object-contain drop-shadow-lg"
                style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.3))" }}
              />
              <div>
                <CardTitle className="text-3xl font-bold text-white flex items-center">
                  Controle de Lav / Lubrificação Logística
                </CardTitle>
                <CardDescription className="text-gray-300 text-lg">
                  Branco Peres Agro S/A - {format(new Date(), "dd/MM/yyyy")}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!bdInicializado ? (
                <Button
                  variant="outline"
                  className="bg-white text-[#1e2a38] hover:bg-gray-100"
                  onClick={() => setDialogoInicializarBd(true)}
                >
                  <Database className="mr-2 h-4 w-4" />
                  Verificar BD
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="bg-white text-[#1e2a38] hover:bg-gray-100"
                  onClick={sincronizarComBancoDados}
                  disabled={sincronizando}
                >
                  {sincronizando ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
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
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          {!bdInicializado && (
            <Alert className="m-4 bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Modo Offline</AlertTitle>
              <AlertDescription className="text-blue-700">
                Sistema operando com dados locais. Clique em "Verificar BD" para conectar ao banco de dados.
              </AlertDescription>
            </Alert>
          )}

          <div className="p-4 bg-gray-100 border-b">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar por frota ou observações..."
                  className="pl-8"
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                      <Filter className="mr-2 h-4 w-4" />
                      Filtros
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-medium">Filtrar Registros</h4>

                      <div className="space-y-2">
                        <Label htmlFor="filtroTipo">Tipo Preventiva</Label>
                        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                          <SelectTrigger id="filtroTipo">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos os tipos</SelectItem>
                            {tiposPreventiva.map((tipo) => (
                              <SelectItem key={tipo.value} value={tipo.value}>
                                {tipo.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="filtroSituacao">Situação</Label>
                        <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
                          <SelectTrigger id="filtroSituacao">
                            <SelectValue placeholder="Selecione a situação" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todas as situações</SelectItem>
                            <SelectItem value="PENDENTE">PENDENTE</SelectItem>
                            <SelectItem value="ENCERRADO">ENCERRADO</SelectItem>
                            <SelectItem value="EM_ANDAMENTO">EM ANDAMENTO</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Período</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {filtroPeriodo.de ? format(filtroPeriodo.de, "dd/MM/yyyy") : "Data inicial"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={filtroPeriodo.de}
                                onSelect={(date) => setFiltroPeriodo({ ...filtroPeriodo, de: date })}
                                initialFocus
                                locale={ptBR}
                              />
                            </PopoverContent>
                          </Popover>

                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {filtroPeriodo.ate ? format(filtroPeriodo.ate, "dd/MM/yyyy") : "Data final"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={filtroPeriodo.ate}
                                onSelect={(date) => setFiltroPeriodo({ ...filtroPeriodo, ate: date })}
                                initialFocus
                                locale={ptBR}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFiltroTipo("todos")
                            setFiltroSituacao("todos")
                            setFiltroPeriodo({ de: undefined, ate: undefined })
                          }}
                        >
                          Limpar
                        </Button>
                        <Button size="sm">Aplicar Filtros</Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <Button variant="outline" size="sm" className="h-9" onClick={() => setDialogoAdicionar(true)}>
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Novo Registro
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={exportarExcel}
                  disabled={exportando || registrosFiltrados.length === 0}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Excel
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={exportarPDF}
                  disabled={exportando || registrosFiltrados.length === 0}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="tabela" className="w-full">
            <div className="px-4 pt-2 border-b">
              <TabsList>
                <TabsTrigger value="tabela" className="data-[state=active]:bg-[#1e2a38] data-[state=active]:text-white">
                  Tabela
                </TabsTrigger>
                <TabsTrigger
                  value="dashboard"
                  className="data-[state=active]:bg-[#1e2a38] data-[state=active]:text-white"
                >
                  Dashboard
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="tabela" className="p-0">
              <div ref={relatorioRef} className="overflow-x-auto">
                <div className="bg-[#1e2a38] p-4 flex items-center gap-4">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-w5r6EZIgd51nAwt9Zn5bLhga0cn9hX.png"
                    alt="Branco Peres Logo"
                    className="h-14 w-14 object-contain"
                  />
                  <div>
                    <h2 className="text-xl font-bold text-white">Controle de Lav / Lubrificação Logística</h2>
                    <p className="text-gray-300">Branco Peres Agro S/A - {format(new Date(), "dd/MM/yyyy")}</p>
                  </div>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#2c3e50] text-white">
                      <th className="border border-gray-600 px-3 py-2 text-left">Frota Veículo</th>
                      <th className="border border-gray-600 px-3 py-2 text-left">DESCRIÇÃO PONTO</th>
                      <th className="border border-gray-600 px-3 py-2 text-left">TIPO PREVENTIVA</th>
                      <th className="border border-gray-600 px-3 py-2 text-left">DATA PROGRAMADA</th>
                      <th className="border border-gray-600 px-3 py-2 text-left">DATA REALIZADA</th>
                      <th className="border border-gray-600 px-3 py-2 text-left">SITUAÇÃO</th>
                      <th className="border border-gray-600 px-3 py-2 text-left">HORÁRIO AGENDADO</th>
                      <th className="border border-gray-600 px-3 py-2 text-left">Observação</th>
                      <th className="border border-gray-600 px-3 py-2 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carregando ? (
                      <tr>
                        <td colSpan={9} className="text-center py-4 border border-gray-300 bg-white">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                          Carregando...
                        </td>
                      </tr>
                    ) : registrosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-4 border border-gray-300 bg-white">
                          Nenhum registro encontrado
                        </td>
                      </tr>
                    ) : (
                      registrosFiltrados.map((registro, index) => (
                        <tr key={registro.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="border border-gray-300 px-3 py-2 text-gray-900">{registro.frota}</td>
                          <td className="border border-gray-300 px-3 py-2 text-gray-900">{registro.descricao_ponto}</td>
                          <td className="border border-gray-300 px-3 py-2 text-gray-900">
                            {obterLabelTipoPreventiva(registro.tipo_preventiva)}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-gray-900">
                            {format(new Date(registro.data_programada), "dd/MM/yyyy")}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-gray-900">
                            {registro.data_realizada ? format(new Date(registro.data_realizada), "dd/MM/yyyy") : ""}
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <div className="flex items-center justify-between">
                              {renderizarSituacao(registro.situacao)}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                                    {atualizandoStatus === registro.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <MoreHorizontal className="h-4 w-4" />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => alterarStatusRegistro(registro.id, "PENDENTE")}
                                    disabled={registro.situacao === "PENDENTE" || atualizandoStatus === registro.id}
                                    className="text-red-600"
                                  >
                                    <PauseCircle className="mr-2 h-4 w-4" />
                                    Pendente
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => alterarStatusRegistro(registro.id, "EM_ANDAMENTO")}
                                    disabled={registro.situacao === "EM_ANDAMENTO" || atualizandoStatus === registro.id}
                                    className="text-yellow-600"
                                  >
                                    <PlayCircle className="mr-2 h-4 w-4" />
                                    Em Andamento
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => alterarStatusRegistro(registro.id, "ENCERRADO")}
                                    disabled={registro.situacao === "ENCERRADO" || atualizandoStatus === registro.id}
                                    className="text-green-600"
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Encerrado
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-gray-900">
                            {registro.horario_agendado}
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            {renderizarObservacao(registro.observacao)}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-700 hover:bg-gray-200"
                                onClick={() => {
                                  setRegistroSelecionado(registro)
                                  setDialogoEditarRegistro(true)
                                }}
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-700 hover:bg-gray-200"
                                onClick={() => excluirRegistro(registro.id)}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2 bg-[#1e2a38] text-white">
                    <CardTitle className="text-lg">Total de Registros</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-bold text-yellow-500">{registrosFiltrados.length}</div>
                    <p className="text-sm text-gray-500">Registros encontrados</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 bg-[#1e2a38] text-white">
                    <CardTitle className="text-lg">Pendentes</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-bold text-red-600">
                      {registrosFiltrados.filter((r) => r.situacao === "PENDENTE").length}
                    </div>
                    <p className="text-sm text-gray-500">Registros pendentes</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 bg-[#1e2a38] text-white">
                    <CardTitle className="text-lg">Concluídos</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="text-3xl font-bold text-green-600">
                      {registrosFiltrados.filter((r) => r.situacao === "ENCERRADO").length}
                    </div>
                    <p className="text-sm text-gray-500">Registros concluídos</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Gráfico de Pizza - Distribuição por Tipo */}
                <Card>
                  <CardHeader className="bg-[#1e2a38] text-white">
                    <CardTitle className="text-lg">Distribuição por Tipo de Preventiva</CardTitle>
                    <CardDescription className="text-gray-300">
                      Análise da distribuição dos registros por tipo de preventiva
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            activeIndex={activeIndexTipo}
                            activeShape={renderActiveShape}
                            data={prepararDadosTipoPreventiva()}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            onMouseEnter={(_, index) => setActiveIndexTipo(index)}
                          >
                            {prepararDadosTipoPreventiva().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Gráfico de Pizza - Distribuição por Situação */}
                <Card>
                  <CardHeader className="bg-[#1e2a38] text-white">
                    <CardTitle className="text-lg">Distribuição por Situação</CardTitle>
                    <CardDescription className="text-gray-300">
                      Análise da distribuição dos registros por situação
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            activeIndex={activeIndexSituacao}
                            activeShape={renderActiveShape}
                            data={prepararDadosSituacao()}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            onMouseEnter={(_, index) => setActiveIndexSituacao(index)}
                          >
                            {prepararDadosSituacao().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-6 mb-6">
                {/* Gráfico de Linha - Evolução por Data */}
                <Card>
                  <CardHeader className="bg-[#1e2a38] text-white">
                    <CardTitle className="text-lg">Evolução de Registros por Data</CardTitle>
                    <CardDescription className="text-gray-300">
                      Análise da evolução dos registros ao longo do tempo
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={prepararDadosPorData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="data"
                            tick={{ fill: "#4b5563" }}
                            tickLine={{ stroke: "#9ca3af" }}
                            axisLine={{ stroke: "#9ca3af" }}
                          />
                          <YAxis
                            tick={{ fill: "#4b5563" }}
                            tickLine={{ stroke: "#9ca3af" }}
                            axisLine={{ stroke: "#9ca3af" }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="total"
                            name="Total"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 8 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="pendentes"
                            name="Pendentes"
                            stroke="#ef4444"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="emAndamento"
                            name="Em Andamento"
                            stroke="#eab308"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="encerrados"
                            name="Encerrados"
                            stroke="#22c55e"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Área - Evolução Acumulada */}
                <Card>
                  <CardHeader className="bg-[#1e2a38] text-white">
                    <CardTitle className="text-lg">Evolução Acumulada por Situação</CardTitle>
                    <CardDescription className="text-gray-300">
                      Análise da evolução acumulada dos registros por situação
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={prepararDadosPorData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="data"
                            tick={{ fill: "#4b5563" }}
                            tickLine={{ stroke: "#9ca3af" }}
                            axisLine={{ stroke: "#9ca3af" }}
                          />
                          <YAxis
                            tick={{ fill: "#4b5563" }}
                            tickLine={{ stroke: "#9ca3af" }}
                            axisLine={{ stroke: "#9ca3af" }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="pendentes"
                            name="Pendentes"
                            stackId="1"
                            stroke="#ef4444"
                            fill="#ef4444"
                            fillOpacity={0.6}
                          />
                          <Area
                            type="monotone"
                            dataKey="emAndamento"
                            name="Em Andamento"
                            stackId="1"
                            stroke="#eab308"
                            fill="#eab308"
                            fillOpacity={0.6}
                          />
                          <Area
                            type="monotone"
                            dataKey="encerrados"
                            name="Encerrados"
                            stackId="1"
                            stroke="#22c55e"
                            fill="#22c55e"
                            fillOpacity={0.6}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Gráfico de Barras - Top Frotas */}
                <Card>
                  <CardHeader className="bg-[#1e2a38] text-white">
                    <CardTitle className="text-lg">Top 10 Frotas com Mais Registros</CardTitle>
                    <CardDescription className="text-gray-300">
                      Análise das frotas com maior número de registros
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={prepararDadosPorFrota()} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            type="number"
                            tick={{ fill: "#4b5563" }}
                            tickLine={{ stroke: "#9ca3af" }}
                            axisLine={{ stroke: "#9ca3af" }}
                          />
                          <YAxis
                            dataKey="frota"
                            type="category"
                            tick={{ fill: "#4b5563" }}
                            tickLine={{ stroke: "#9ca3af" }}
                            axisLine={{ stroke: "#9ca3af" }}
                            width={50}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="pendentes" name="Pendentes" stackId="a" fill="#ef4444" />
                          <Bar dataKey="emAndamento" name="Em Andamento" stackId="a" fill="#eab308" />
                          <Bar dataKey="encerrados" name="Encerrados" stackId="a" fill="#22c55e" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog para adicionar registro */}
      <Dialog open={dialogoAdicionar} onOpenChange={setDialogoAdicionar}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="flex flex-row items-center gap-3">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-w5r6EZIgd51nAwt9Zn5bLhga0cn9hX.png"
              alt="Branco Peres Logo"
              className="h-10 w-10 object-contain"
            />
            <div>
              <DialogTitle>Adicionar Registro de Manutenção</DialogTitle>
              <DialogDescription>Preencha os detalhes da manutenção a ser realizada.</DialogDescription>
            </div>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frota">Frota Veículo</Label>
                <Input
                  id="frota"
                  value={novoRegistro.frota}
                  onChange={(e) => setNovoRegistro({ ...novoRegistro, frota: e.target.value })}
                  placeholder="Ex: 6597"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao_ponto">Descrição Ponto</Label>
                <Select
                  value={novoRegistro.descricao_ponto}
                  onValueChange={(value) => setNovoRegistro({ ...novoRegistro, descricao_ponto: value })}
                >
                  <SelectTrigger id="descricao_ponto">
                    <SelectValue placeholder="Selecione a descrição" />
                  </SelectTrigger>
                  <SelectContent>
                    {descricoesPonto.map((desc) => (
                      <SelectItem key={desc.value} value={desc.value}>
                        {desc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_preventiva">Tipo Preventiva</Label>
              <Select
                value={novoRegistro.tipo_preventiva}
                onValueChange={(value) => setNovoRegistro({ ...novoRegistro, tipo_preventiva: value })}
              >
                <SelectTrigger id="tipo_preventiva">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_programada">Data Programada</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {novoRegistro.data_programada
                        ? format(new Date(novoRegistro.data_programada), "dd/MM/yyyy")
                        : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dataSelecionada}
                      onSelect={(date) => {
                        setDataSelecionada(date)
                        if (date) {
                          setNovoRegistro({
                            ...novoRegistro,
                            data_programada: format(date, "yyyy-MM-dd"),
                          })
                        }
                      }}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="horario_agendado">Horário Agendado</Label>
                <Input
                  id="horario_agendado"
                  type="time"
                  value={novoRegistro.horario_agendado}
                  onChange={(e) => setNovoRegistro({ ...novoRegistro, horario_agendado: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="situacao">Situação</Label>
              <Select
                value={novoRegistro.situacao}
                onValueChange={(value: "PENDENTE" | "ENCERRADO" | "EM_ANDAMENTO") =>
                  setNovoRegistro({ ...novoRegistro, situacao: value })
                }
              >
                <SelectTrigger id="situacao">
                  <SelectValue placeholder="Selecione a situação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDENTE">PENDENTE</SelectItem>
                  <SelectItem value="ENCERRADO">ENCERRADO</SelectItem>
                  <SelectItem value="EM_ANDAMENTO">EM ANDAMENTO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacao">Observação</Label>
              <Input
                id="observacao"
                value={novoRegistro.observacao || ""}
                onChange={(e) => setNovoRegistro({ ...novoRegistro, observacao: e.target.value })}
                placeholder="Observações adicionais"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoAdicionar(false)}>
              Cancelar
            </Button>
            <Button onClick={adicionarRegistro}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar registro */}
      <Dialog open={dialogoEditarRegistro} onOpenChange={setDialogoEditarRegistro}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="flex flex-row items-center gap-3">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-w5r6EZIgd51nAwt9Zn5bLhga0cn9hX.png"
              alt="Branco Peres Logo"
              className="h-10 w-10 object-contain"
            />
            <div>
              <DialogTitle>Editar Registro de Manutenção</DialogTitle>
              <DialogDescription>Atualize os detalhes da manutenção.</DialogDescription>
            </div>
          </DialogHeader>

          {registroSelecionado && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-frota">Frota Veículo</Label>
                  <Input
                    id="edit-frota"
                    value={registroSelecionado.frota}
                    onChange={(e) => setRegistroSelecionado({ ...registroSelecionado, frota: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-descricao_ponto">Descrição Ponto</Label>
                  <Select
                    value={registroSelecionado.descricao_ponto}
                    onValueChange={(value) =>
                      setRegistroSelecionado({ ...registroSelecionado, descricao_ponto: value })
                    }
                  >
                    <SelectTrigger id="edit-descricao_ponto">
                      <SelectValue placeholder="Selecione a descrição" />
                    </SelectTrigger>
                    <SelectContent>
                      {descricoesPonto.map((desc) => (
                        <SelectItem key={desc.value} value={desc.value}>
                          {desc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-tipo_preventiva">Tipo Preventiva</Label>
                <Select
                  value={registroSelecionado.tipo_preventiva}
                  onValueChange={(value) => setRegistroSelecionado({ ...registroSelecionado, tipo_preventiva: value })}
                >
                  <SelectTrigger id="edit-tipo_preventiva">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-data_programada">Data Programada</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(new Date(registroSelecionado.data_programada), "dd/MM/yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={new Date(registroSelecionado.data_programada)}
                        onSelect={(date) => {
                          if (date) {
                            setRegistroSelecionado({
                              ...registroSelecionado,
                              data_programada: format(date, "yyyy-MM-dd"),
                            })
                          }
                        }}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-horario_agendado">Horário Agendado</Label>
                  <Input
                    id="edit-horario_agendado"
                    type="time"
                    value={registroSelecionado.horario_agendado}
                    onChange={(e) =>
                      setRegistroSelecionado({ ...registroSelecionado, horario_agendado: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-situacao">Situação</Label>
                <Select
                  value={registroSelecionado.situacao}
                  onValueChange={(value: "PENDENTE" | "ENCERRADO" | "EM_ANDAMENTO") =>
                    setRegistroSelecionado({
                      ...registroSelecionado,
                      situacao: value,
                      data_realizada:
                        value === "ENCERRADO" ? format(new Date(), "yyyy-MM-dd") : registroSelecionado.data_realizada,
                    })
                  }
                >
                  <SelectTrigger id="edit-situacao">
                    <SelectValue placeholder="Selecione a situação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDENTE">PENDENTE</SelectItem>
                    <SelectItem value="ENCERRADO">ENCERRADO</SelectItem>
                    <SelectItem value="EM_ANDAMENTO">EM ANDAMENTO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-observacao">Observação</Label>
                <Input
                  id="edit-observacao"
                  value={registroSelecionado.observacao || ""}
                  onChange={(e) => setRegistroSelecionado({ ...registroSelecionado, observacao: e.target.value })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoEditarRegistro(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (registroSelecionado) {
                  atualizarRegistro(registroSelecionado)
                  setDialogoEditarRegistro(false)
                }
              }}
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para verificar banco de dados */}
      <Dialog open={dialogoInicializarBd} onOpenChange={setDialogoInicializarBd}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="flex flex-row items-center gap-3">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-w5r6EZIgd51nAwt9Zn5bLhga0cn9hX.png"
              alt="Branco Peres Logo"
              className="h-10 w-10 object-contain"
            />
            <div>
              <DialogTitle>Verificação do Banco de Dados</DialogTitle>
              <DialogDescription>Verificar a conexão com o banco de dados e a tabela de registros.</DialogDescription>
            </div>
          </DialogHeader>

          <div className="py-4">
            <div
              className={`p-4 rounded-md ${
                statusInicializacao === "idle"
                  ? "bg-gray-100"
                  : statusInicializacao === "loading"
                    ? "bg-blue-50"
                    : statusInicializacao === "success"
                      ? "bg-green-50"
                      : "bg-red-50"
              }`}
            >
              <p
                className={`${
                  statusInicializacao === "idle"
                    ? "text-gray-700"
                    : statusInicializacao === "loading"
                      ? "text-blue-700"
                      : statusInicializacao === "success"
                        ? "text-green-700"
                        : "text-red-700"
                }`}
              >
                {statusInicializacao === "idle"
                  ? 'Clique em "Verificar Banco de Dados" para iniciar a verificação.'
                  : mensagemInicializacao}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoInicializarBd(false)}
              disabled={statusInicializacao === "loading"}
            >
              Fechar
            </Button>
            <Button
              onClick={verificarBancoDados}
              disabled={statusInicializacao === "loading" || statusInicializacao === "success"}
            >
              {statusInicializacao === "loading" ? "Verificando..." : "Verificar Banco de Dados"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para criar tabela */}
      <Dialog open={dialogoCriarTabela} onOpenChange={setDialogoCriarTabela}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="flex flex-row items-center gap-3">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-w5r6EZIgd51nAwt9Zn5bLhga0cn9hX.png"
              alt="Branco Peres Logo"
              className="h-10 w-10 object-contain"
            />
            <div>
              <DialogTitle>Tabela de Registros</DialogTitle>
              <DialogDescription>
                A tabela 'maintenance_records' já foi criada. Deseja populá-la com dados de exemplo?
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Tabela encontrada</AlertTitle>
              <AlertDescription>
                A tabela 'maintenance_records' já existe no banco de dados. Você pode populá-la com alguns registros de
                exemplo para começar a usar o sistema.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogoCriarTabela(false)
                setDialogoInicializarBd(false)
              }}
              disabled={criandoTabela}
            >
              Cancelar
            </Button>
            <Button onClick={popularTabela} disabled={criandoTabela}>
              {criandoTabela ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Populando...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Popular Tabela
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
