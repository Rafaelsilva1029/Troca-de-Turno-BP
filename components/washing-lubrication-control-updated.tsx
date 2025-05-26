"use client"

import { useState, useRef, useEffect } from "react"
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
  Plus,
  Wifi,
  WifiOff,
  Copy,
  Upload,
  Download,
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
} from "recharts"

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
]

// Dados de exemplo para inicialização
const dadosExemplo: MaintenanceRecord[] = [
  {
    id: 1,
    frota: "6597",
    local: "LAVADOR",
    tipo_preventiva: "lavagem_lubrificacao",
    data_programada: "2025-01-26",
    situacao: "PENDENTE",
    horario_agendado: "04:00",
    observacao: "TROCA DE ÓLEO",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    frota: "8805",
    local: "LAVADOR",
    tipo_preventiva: "lavagem_lubrificacao",
    data_programada: "2025-01-27",
    situacao: "PENDENTE",
    horario_agendado: "08:00",
    observacao: "EM VIAGEM",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    frota: "4597",
    local: "LUBRIFICADOR",
    tipo_preventiva: "lubrificacao",
    data_programada: "2025-01-28",
    situacao: "EM_ANDAMENTO",
    horario_agendado: "14:30",
    observacao: "Aguardando peças",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    frota: "6602",
    local: "MECANICO",
    tipo_preventiva: "troca_oleo",
    data_programada: "2025-01-25",
    data_realizada: "2025-01-25",
    situacao: "ENCERRADO",
    horario_agendado: "02:00",
    observacao: "Concluído com sucesso",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export function WashingLubricationControl() {
  // Estados principais
  const [registros, setRegistros] = useState<MaintenanceRecord[]>(dadosExemplo)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [bdConectado, setBdConectado] = useState(false)
  const [statusConexao, setStatusConexao] = useState<"conectando" | "conectado" | "erro" | "offline">("offline")

  // Estados de filtros
  const [termoBusca, setTermoBusca] = useState("")
  const [filtroTipo, setFiltroTipo] = useState<string>("todos")
  const [filtroSituacao, setFiltroSituacao] = useState<string>("todos")
  const [filtroLocal, setFiltroLocal] = useState<string>("todos")
  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>()

  // Estados de diálogos
  const [dialogoAdicionar, setDialogoAdicionar] = useState(false)
  const [dialogoEditar, setDialogoEditar] = useState(false)
  const [registroSelecionado, setRegistroSelecionado] = useState<MaintenanceRecord | null>(null)
  const [dialogoInicializarBd, setDialogoInicializarB  = useState<MaintenanceRecord | null>(null)\
  const [dialogoInicializarBd, setDialogoInicializarBd] = useState(false)
  const [dialogoImportar, setDialogoImportar] = useState(false)

  // Estados de operações
  const [exportando, setExportando] = useState(false)
  const [sincronizando, setSincronizando] = useState(false)
  const [atualizandoStatus, setAtualizandoStatus] = useState<number | null>(null)

  // Novo registro
  const [novoRegistro, setNovoRegistro] = useState<Omit<MaintenanceRecord, "id">>({
    frota: "",
    local: "LAVADOR",
    tipo_preventiva: "lavagem_lubrificacao",
    data_programada: format(new Date(), "yyyy-MM-dd"),
    situacao: "PENDENTE",
    horario_agendado: "08:00",
    observacao: "",
  })

  // Ref para exportação
  const tabelaRef = useRef<HTMLDivElement>(null)

  // Inicialização - tentar conectar com banco de dados
  useEffect(() => {
    tentarConectarBanco()
  }, [])

  // Função para tentar conectar com banco
  const tentarConectarBanco = async () => {
    try {
      setStatusConexao("conectando")
      setErro(null)

      const supabase = getSupabaseClient()

      // Tentar carregar dados da tabela que agora existe
      const { data, error } = await supabase.from("maintenance_records").select("*").order("id", { ascending: false })

      if (error) {
        throw error
      }

      // Sucesso! Carregar dados do banco
      if (data && data.length > 0) {
        setRegistros(data)
      }

      setBdConectado(true)
      setStatusConexao("conectado")

      toast({
        title: "Conectado",
        description: `Sistema conectado! ${data?.length || 0} registros carregados do banco de dados.`,
      })
    } catch (error) {
      console.error("Erro na conexão:", error)
      setStatusConexao("offline")
      setBdConectado(false)
      setErro("Sistema funcionando offline com dados locais.")

      toast({
        title: "Modo Offline",
        description: "Sistema funcionando com dados locais.",
        variant: "destructive",
      })
    }
  }

  // Função para carregar registros do banco
  const carregarRegistrosDoBanco = async () => {
    try {
      const supabase = getSupabaseClient()

      const { data, error } = await supabase.from("maintenance_records").select("*").order("id", { ascending: false })

      if (error) {
        throw error
      }

      if (data && data.length > 0) {
        setRegistros(data)
      }
    } catch (error) {
      console.error("Erro ao carregar registros:", error)
      throw error
    }
  }

  // Função para gerar próximo ID
  const gerarProximoId = () => {
    return Math.max(...registros.map((r) => r.id), 0) + 1
  }

  // Função para adicionar registro
  const adicionarRegistro = async () => {
    try {
      setCarregando(true)
      setErro(null)

      // Validações
      if (!novoRegistro.frota.trim()) {
        throw new Error("Frota é obrigatória")
      }
      if (!novoRegistro.data_programada) {
        throw new Error("Data programada é obrigatória")
      }
      if (!novoRegistro.horario_agendado) {
        throw new Error("Horário agendado é obrigatório")
      }

      const novoId = gerarProximoId()
      const registroCompleto: MaintenanceRecord = {
        ...novoRegistro,
        id: novoId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (bdConectado) {
        // Tentar salvar no banco de dados
        try {
          const supabase = getSupabaseClient()

          // Preparar dados para inserção no banco
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

          if (error) {
            throw error
          }

          // Sucesso no banco, usar dados retornados
          setRegistros((prev) => [data[0], ...prev])
        } catch (dbError) {
          console.warn("Erro no banco, salvando localmente:", dbError)
          // Salvar localmente se houver erro no banco
          setRegistros((prev) => [registroCompleto, ...prev])
        }
      } else {
        // Salvar localmente
        setRegistros((prev) => [registroCompleto, ...prev])
      }

      // Limpar formulário
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

      toast({
        title: "Sucesso",
        description: `Registro adicionado ${bdConectado ? "no banco de dados" : "localmente"}!`,
      })
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Erro desconhecido"
      setErro(mensagem)
      toast({
        title: "Erro",
        description: mensagem,
        variant: "destructive",
      })
    } finally {
      setCarregando(false)
    }
  }

  // Função para atualizar registro
  const atualizarRegistro = async () => {
    if (!registroSelecionado) return

    try {
      setCarregando(true)
      setErro(null)

      const registroAtualizado = {
        ...registroSelecionado,
        updated_at: new Date().toISOString(),
      }

      if (bdConectado) {
        // Tentar atualizar no banco de dados
        try {
          const supabase = getSupabaseClient()

          // Preparar dados para atualização no banco
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

          if (error) {
            throw error
          }
        } catch (dbError) {
          console.warn("Erro no banco, atualizando localmente:", dbError)
        }
      }

      // Atualizar localmente
      setRegistros((prev) => prev.map((r) => (r.id === registroSelecionado.id ? registroAtualizado : r)))

      setDialogoEditar(false)
      setRegistroSelecionado(null)

      toast({
        title: "Sucesso",
        description: `Registro atualizado ${bdConectado ? "no banco de dados" : "localmente"}!`,
      })
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Erro desconhecido"
      setErro(mensagem)
      toast({
        title: "Erro",
        description: mensagem,
        variant: "destructive",
      })
    } finally {
      setCarregando(false)
    }
  }

  // Função para alterar status
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
        // Tentar atualizar no banco de dados
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

          if (error) {
            throw error
          }
        } catch (dbError) {
          console.warn("Erro no banco, atualizando localmente:", dbError)
        }
      }

      // Atualizar localmente
      setRegistros((prev) => prev.map((r) => (r.id === id ? registroAtualizado : r)))

      toast({
        title: "Sucesso",
        description: `Status atualizado ${bdConectado ? "no banco de dados" : "localmente"}!`,
      })
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Erro desconhecido"
      toast({
        title: "Erro",
        description: mensagem,
        variant: "destructive",
      })
    } finally {
      setAtualizandoStatus(null)
    }
  }

  // Função para excluir registro
  const excluirRegistro = async (id: number) => {
    try {
      setCarregando(true)

      if (bdConectado) {
        // Tentar excluir do banco de dados
        try {
          const supabase = getSupabaseClient()
          const { error } = await supabase.from("maintenance_records").delete().eq("id", id)

          if (error) {
            throw error
          }
        } catch (dbError) {
          console.warn("Erro no banco, excluindo localmente:", dbError)
        }
      }

      // Excluir localmente
      setRegistros((prev) => prev.filter((r) => r.id !== id))

      toast({
        title: "Sucesso",
        description: `Registro excluído ${bdConectado ? "do banco de dados" : "localmente"}!`,
      })
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Erro desconhecido"
      toast({
        title: "Erro",
        description: mensagem,
        variant: "destructive",
      })
    } finally {
      setCarregando(false)
    }
  }

  // Função para sincronizar com banco
  const sincronizarBanco = async () => {
    try {
      setSincronizando(true)
      setErro(null)

      await carregarRegistrosDoBanco()
      setBdConectado(true)
      setStatusConexao("conectado")

      toast({
        title: "Sucesso",
        description: "Dados sincronizados com o banco de dados!",
      })
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Erro de sincronização"
      setStatusConexao("erro")
      setBdConectado(false)
      toast({
        title: "Erro",
        description: mensagem,
        variant: "destructive",
      })
    } finally {
      setSincronizando(false)
    }
  }

  // Função para copiar SQL
  const copiarSQL = () => {
    const sqlScript = `-- Script SQL para criar a tabela maintenance_records
CREATE TABLE IF NOT EXISTS maintenance_records (
    id SERIAL PRIMARY KEY,
    frota VARCHAR(50) NOT NULL,
    local VARCHAR(100) NOT NULL,
    tipo_preventiva VARCHAR(100) NOT NULL,
    data_programada DATE NOT NULL,
    data_realizada DATE,
    situacao VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK (situacao IN ('PENDENTE', 'ENCERRADO', 'EM_ANDAMENTO')),
    horario_agendado TIME NOT NULL,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_maintenance_records_frota ON maintenance_records(frota);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_situacao ON maintenance_records(situacao);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_data_programada ON maintenance_records(data_programada);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_local ON maintenance_records(local);

-- Inserir dados de exemplo
INSERT INTO maintenance_records (frota, local, tipo_preventiva, data_programada, situacao, horario_agendado, observacao) VALUES
('6597', 'LAVADOR', 'lavagem_lubrificacao', '2025-01-26', 'PENDENTE', '04:00', 'TROCA DE ÓLEO'),
('8805', 'LAVADOR', 'lavagem_lubrificacao', '2025-01-27', 'PENDENTE', '08:00', 'EM VIAGEM'),
('4597', 'LUBRIFICADOR', 'lubrificacao', '2025-01-28', 'EM_ANDAMENTO', '14:30', 'Aguardando peças'),
('6602', 'MECANICO', 'troca_oleo', '2025-01-25', 'ENCERRADO', '02:00', 'Concluído com sucesso');`

    navigator.clipboard.writeText(sqlScript)
    toast({
      title: "SQL Copiado",
      description: "Script SQL copiado para a área de transferência!",
    })
  }

  // Função para exportar Excel
  const exportarExcel = () => {
    try {
      setExportando(true)

      const dadosExport = registrosFiltrados.map((registro) => ({
        Frota: registro.frota,
        Local: registro.local,
        "Tipo Preventiva": obterLabelTipo(registro.tipo_preventiva),
        "Data Programada": format(new Date(registro.data_programada), "dd/MM/yyyy"),
        "Data Realizada": registro.data_realizada ? format(new Date(registro.data_realizada), "dd/MM/yyyy") : "",
        Situação: registro.situacao === "EM_ANDAMENTO" ? "ANDAMENTO" : registro.situacao,
        "Horário Agendado": registro.horario_agendado,
        Observação: registro.observacao || "",
      }))

      const worksheet = XLSX.utils.json_to_sheet(dadosExport)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Lavagem e Lubrificação")

      // Ajustar largura das colunas
      const colWidths = [
        { wch: 10 }, // Frota
        { wch: 15 }, // Local
        { wch: 20 }, // Tipo Preventiva
        { wch: 15 }, // Data Programada
        { wch: 15 }, // Data Realizada
        { wch: 12 }, // Situação
        { wch: 15 }, // Horário Agendado
        { wch: 30 }, // Observação
      ]
      worksheet["!cols"] = colWidths

      XLSX.writeFile(workbook, "controle-lavagem-lubrificacao.xlsx")

      toast({
        title: "Sucesso",
        description: "Arquivo Excel exportado com sucesso!",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar arquivo Excel",
        variant: "destructive",
      })
    } finally {
      setExportando(false)
    }
  }

  // Função para exportar modelo Excel
  const exportarModeloExcel = () => {
    try {
      setExportando(true)

      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.new_sheet()

      // Definir cabeçalhos
      XLSX.utils.sheet_add_aoa(worksheet, [
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
      ])

      XLSX.utils.book_append_sheet(workbook, worksheet, "Modelo de Importação")
      XLSX.writeFile(workbook, "modelo-importacao-lavagem-lubrificacao.xlsx")

      toast({
        title: "Sucesso",
        description: "Modelo Excel exportado com sucesso!",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar modelo Excel",
        variant: "destructive",
      })
    } finally {
      setExportando(false)
    }
  }

  // Função para exportar PDF
  const exportarPDF = async () => {
    try {
      setExportando(true)

      if (!tabelaRef.current) {
        throw new Error("Tabela não encontrada")
      }

      const canvas = await html2canvas(tabelaRef.current, {
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

      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight)
      pdf.save("controle-lavagem-lubrificacao.pdf")

      toast({
        title: "Sucesso",
        description: "Arquivo PDF exportado com sucesso!",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar arquivo PDF",
        variant: "destructive",
      })
    } finally {
      setExportando(false)
    }
  }

  // Função para importar registros
  const importarRegistros = async (registrosImportados: Omit<MaintenanceRecord, "id">[]) => {
    try {
      setCarregando(true)

      // Adicionar IDs e timestamps aos registros importados
      const registrosCompletos: MaintenanceRecord[] = registrosImportados.map((registro, index) => ({
        ...registro,
        id: gerarProximoId() + index,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      if (bdConectado) {
        // Tentar salvar no banco de dados
        try {
          const supabase = getSupabaseClient()

          // Preparar dados para inserção no banco
          const dadosParaBanco = registrosCompletos.map((registro) => ({
            frota: registro.frota,
            local: registro.local,
            tipo_preventiva: registro.tipo_preventiva,
            data_programada: registro.data_programada,
            data_realizada: registro.data_realizada || null,
            situacao: registro.situacao,
            horario_agendado: registro.horario_agendado,
            observacao: registro.observacao || null,
            created_at: registro.created_at,
            updated_at: registro.updated_at,
          }))

          const { data, error } = await supabase.from("maintenance_records").insert(dadosParaBanco).select()

          if (error) {
            throw error
          }

          // Sucesso no banco, usar dados retornados
          setRegistros((prev) => [...data, ...prev])
        } catch (dbError) {
          console.warn("Erro no banco, salvando localmente:", dbError)
          // Salvar localmente se houver erro no banco
          setRegistros((prev) => [...registrosCompletos, ...prev])
        }
      } else {
        // Salvar localmente
        setRegistros((prev) => [...registrosCompletos, ...prev])
      }

      return true
    } catch (error) {
      console.error("Erro ao importar registros:", error)
      throw error
    } finally {
      setCarregando(false)
    }
  }

  // Função auxiliar para obter label do tipo
  const obterLabelTipo = (valor: string) => {
    const tipo = tiposPreventiva.find((t) => t.value === valor)
    return tipo ? tipo.label : valor
  }

  // Função auxiliar para obter label do local
  const obterLabelLocal = (valor: string) => {
    const local = locais.find((l) => l.value === valor)
    return local ? local.label : valor
  }

  // Filtrar registros
  const registrosFiltrados = registros.filter((registro) => {
    const correspondeTermoBusca =
      registro.frota.toLowerCase().includes(termoBusca.toLowerCase()) ||
      registro.local.toLowerCase().includes(termoBusca.toLowerCase()) ||
      (registro.observacao && registro.observacao.toLowerCase().includes(termoBusca.toLowerCase()))

    const correspondeTipo = filtroTipo === "todos" || registro.tipo_preventiva === filtroTipo
    const correspondeSituacao = filtroSituacao === "todos" || registro.situacao === filtroSituacao
    const correspondeLocal = filtroLocal === "todos" || registro.local === filtroLocal

    const correspondeData =
      !dataSelecionada ||
      format(new Date(registro.data_programada), "yyyy-MM-dd") === format(dataSelecionada, "yyyy-MM-dd")

    return correspondeTermoBusca && correspondeTipo && correspondeSituacao && correspondeLocal && correspondeData
  })

  // Renderizar status com cores
  const renderizarStatus = (situacao: string) => {
    switch (situacao) {
      case "PENDENTE":
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200 shadow-sm">
            <Clock className="w-3.5 h-3.5 mr-1.5 text-red-600" />
            PENDENTE
          </span>
        )
      case "ENCERRADO":
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-50 to-green-100 text-emerald-700 border border-emerald-200 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            ENCERRADO
          </span>
        )
      case "EM_ANDAMENTO":
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-50 to-yellow-100 text-amber-700 border border-amber-200 shadow-sm">
            <PlayCircle className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
            ANDAMENTO
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200 shadow-sm">
            {situacao}
          </span>
        )
    }
  }

  // Renderizar observação com cores
  const renderizarObservacao = (observacao?: string) => {
    if (!observacao) return ""

    if (observacao.includes("TROCA DE ÓLEO")) {
      return <span className="text-green-600 font-medium">{observacao}</span>
    } else if (observacao.includes("EM VIAGEM")) {
      return <span className="text-red-600 font-medium">{observacao}</span>
    } else if (observacao.includes("OFICINA") || observacao.includes("Gabelim")) {
      return <span className="text-red-600 font-medium">{observacao}</span>
    }

    return <span className="text-red-600">{observacao}</span>
  }

  // Renderizar indicador de status de conexão
  const renderizarStatusConexao = () => {
    switch (statusConexao) {
      case "conectando":
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Conectando...</span>
          </div>
        )
      case "conectado":
        return (
          <div className="flex items-center gap-2 text-green-600">
            <Wifi className="h-4 w-4" />
            <span className="text-sm">Online</span>
          </div>
        )
      case "erro":
        return (
          <div className="flex items-center gap-2 text-red-600">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm">Tabela não encontrada</span>
          </div>
        )
      case "offline":
        return (
          <div className="flex items-center gap-2 text-gray-600">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm">Offline</span>
          </div>
        )
      default:
        return null
    }
  }

  // Dados para gráficos
  const dadosGraficoSituacao = [
    {
      name: "Pendentes",
      value: registrosFiltrados.filter((r) => r.situacao === "PENDENTE").length,
      color: "#dc2626", // Vermelho mais vibrante
    },
    {
      name: "Encerrados",
      value: registrosFiltrados.filter((r) => r.situacao === "ENCERRADO").length,
      color: "#059669", // Verde esmeralda
    },
    {
      name: "Andamento",
      value: registrosFiltrados.filter((r) => r.situacao === "EM_ANDAMENTO").length,
      color: "#d97706", // Âmbar mais forte
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
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-w5r6EZIgd51nAwt9Zn5bLhga0cn9hX.png"
                alt="Branco Peres Logo"
                className="h-12 w-12 lg:h-16 lg:w-16 object-contain drop-shadow-lg"
                style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.3))" }}
              />
              <div>
                <CardTitle className="text-xl lg:text-3xl font-bold text-white">
                  Controle de Lavagem e Lubrificação Logística
                </CardTitle>
                <CardDescription className="text-gray-300 text-sm lg:text-lg">
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
                  )}
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
              <AlertTitle>Aviso</AlertTitle>
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          {!bdConectado && (
            <Alert className="m-4 bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Modo Offline</AlertTitle>
              <AlertDescription className="text-blue-700">
                Sistema funcionando com dados locais. Para conectar ao banco de dados, execute o script SQL fornecido.
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
              </TabsList>
            </div>

            <TabsContent value="tabela" className="p-0">
              {/* Filtros e Controles */}
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                  {/* Busca */}
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

                  {/* Filtros */}
                  <div className="flex flex-wrap gap-2">
                    {/* Filtro Data */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dataSelecionada ? format(dataSelecionada, "dd/MM/yyyy") : "Data"}
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

                    {/* Filtro Local */}
                    <Select value={filtroLocal} onValueChange={setFiltroLocal}>
                      <SelectTrigger className="w-[140px] h-9">
                        <SelectValue placeholder="Local" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os locais</SelectItem>
                        {locais.map((local) => (
                          <SelectItem key={local.value} value={local.value}>
                            {local.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Filtro Tipo */}
                    <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                      <SelectTrigger className="w-[160px] h-9">
                        <SelectValue placeholder="Tipo" />
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

                    {/* Filtro Situação */}
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

                    {/* Botão Limpar Filtros */}
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

                  {/* Ações */}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="h-9" onClick={() => setDialogoAdicionar(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar
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
                          onClick={exportarPDF}
                          disabled={exportando || registrosFiltrados.length === 0}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Exportar PDF
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

              {/* Tabela */}
              <div ref={tabelaRef} className="overflow-x-auto">
                <div className="bg-[#1e2a38] p-4 flex items-center gap-4">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-w5r6EZIgd51nAwt9Zn5bLhga0cn9hX.png"
                    alt="Branco Peres Logo"
                    className="h-12 w-12 object-contain"
                  />
                  <div>
                    <h2 className="text-lg font-bold text-white">Controle de Lavagem e Lubrificação Logística</h2>
                    <p className="text-gray-300 text-sm">Branco Peres Agro S/A - {format(new Date(), "dd/MM/yyyy")}</p>
                  </div>
                </div>

                <table className="w-full border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-[#2c3e50] text-white">
                      <th className="border border-gray-600 px-3 py-2 text-left text-sm font-medium">Frota</th>
                      <th className="border border-gray-600 px-3 py-2 text-left text-sm font-medium">Local</th>
                      <th className="border border-gray-600 px-3 py-2 text-left text-sm font-medium">
                        Tipo Preventiva
                      </th>
                      <th className="border border-gray-600 px-3 py-2 text-left text-sm font-medium">
                        Data Programada
                      </th>
                      <th className="border border-gray-600 px-3 py-2 text-left text-sm font-medium">Data Realizada</th>
                      <th className="border border-gray-600 px-3 py-2 text-left text-sm font-medium">Situação</th>
                      <th className="border border-gray-600 px-3 py-2 text-left text-sm font-medium">
                        Horário Agendado
                      </th>
                      <th className="border border-gray-600 px-3 py-2 text-left text-sm font-medium">Observação</th>
                      <th className="border border-gray-600 px-3 py-2 text-center text-sm font-medium">Ações</th>
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
                      registrosFiltrados.map((registro, index) => (
                        <tr key={registro.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900 font-medium">
                            {registro.frota}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                            {obterLabelLocal(registro.local)}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                            {obterLabelTipo(registro.tipo_preventiva)}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                            {format(new Date(registro.data_programada), "dd/MM/yyyy")}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                            {registro.data_realizada ? format(new Date(registro.data_realizada), "dd/MM/yyyy") : ""}
                          </td>
                          <td className="border border-gray-300 px-3 py-2">{renderizarStatus(registro.situacao)}</td>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                            {registro.horario_agendado}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-sm">
                            {renderizarObservacao(registro.observacao)}
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
                                    {atualizandoStatus === registro.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin text-gray-700" />
                                    ) : (
                                      <MoreHorizontal className="h-4 w-4 text-gray-700" />
                                    )}
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => alterarStatus(registro.id, "PENDENTE")}
                                    disabled={registro.situacao === "PENDENTE" || atualizandoStatus === registro.id}
                                  >
                                    <PauseCircle className="mr-2 h-4 w-4" />
                                    Pendente
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => alterarStatus(registro.id, "EM_ANDAMENTO")}
                                    disabled={registro.situacao === "EM_ANDAMENTO" || atualizandoStatus === registro.id}
                                  >
                                    <PlayCircle className="mr-2 h-4 w-4" />
                                    Andamento
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => alterarStatus(registro.id, "ENCERRADO")}
                                    disabled={registro.situacao === "ENCERRADO" || atualizandoStatus === registro.id}
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
                                  setRegistroSelecionado(registro)
                                  setDialogoEditar(true)
                                }}
                              >
                                <SlidersHorizontal className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:bg-red-50 border border-gray-300"
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{registrosFiltrados.length}</div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">Pendentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {registrosFiltrados.filter((r) => r.situacao === "PENDENTE").length}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">Andamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-600">
                      {registrosFiltrados.filter((r) => r.situacao === "EM_ANDAMENTO").length}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">Concluídos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">
                      {registrosFiltrados.filter((r) => r.situacao === "ENCERRADO").length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição por Situação</CardTitle>
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
                    <CardTitle>Distribuição por Tipo</CardTitle>
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
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog para mostrar SQL */}
      <Dialog open={dialogoInicializarBd} onOpenChange={setDialogoInicializarBd}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Script SQL para Criar Tabela</DialogTitle>
            <DialogDescription>
              Execute este script SQL no seu banco de dados Supabase para criar a tabela necessária.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
              <pre className="whitespace-pre-wrap text-xs">
                {`-- Script SQL para criar a tabela maintenance_records
CREATE TABLE IF NOT EXISTS maintenance_records (
    id SERIAL PRIMARY KEY,
    frota VARCHAR(50) NOT NULL,
    local VARCHAR(100) NOT NULL,
    tipo_preventiva VARCHAR(100) NOT NULL,
    data_programada DATE NOT NULL,
    data_realizada DATE,
    situacao VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' 
        CHECK (situacao IN ('PENDENTE', 'ENCERRADO', 'EM_ANDAMENTO')),
    horario_agendado TIME NOT NULL,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_maintenance_records_frota 
    ON maintenance_records(frota);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_situacao 
    ON maintenance_records(situacao);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_data_programada 
    ON maintenance_records(data_programada);

-- Inserir dados de exemplo
INSERT INTO maintenance_records 
    (frota, local, tipo_preventiva, data_programada, situacao, horario_agendado, observacao) 
VALUES
    ('6597', 'LAVADOR', 'lavagem_lubrificacao', '2025-01-26', 'PENDENTE', '04:00', 'TROCA DE ÓLEO'),
    ('8805', 'LAVADOR', 'lavagem_lubrificacao', '2025-01-27', 'PENDENTE', '08:00', 'EM VIAGEM'),
    ('4597', 'LUBRIFICADOR', 'lubrificacao', '2025-01-28', 'EM_ANDAMENTO', '14:30', 'Aguardando peças'),
    ('6602', 'MECANICO', 'troca_oleo', '2025-01-25', 'ENCERRADO', '02:00', 'Concluído com sucesso');`}
              </pre>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoInicializarBd(false)}>
              Fechar
            </Button>
            <Button onClick={copiarSQL}>
              <Copy className="mr-2 h-4 w-4" />
              Copiar SQL
            </Button>
            <Button onClick={tentarConectarBanco}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Conectar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar registro */}
      <Dialog open={dialogoAdicionar} onOpenChange={setDialogoAdicionar}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Registro</DialogTitle>
            <DialogDescription>
              Preencha os dados para adicionar um novo registro de lavagem e lubrificação.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frota">Frota *</Label>
                <Input
                  id="frota"
                  value={novoRegistro.frota}
                  onChange={(e) => setNovoRegistro({ ...novoRegistro, frota: e.target.value })}
                  placeholder="Ex: 6597"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="local">Local *</Label>
                <Select
                  value={novoRegistro.local}
                  onValueChange={(value) => setNovoRegistro({ ...novoRegistro, local: value })}
                >
                  <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_preventiva">Tipo Preventiva *</Label>
              <Select
                value={novoRegistro.tipo_preventiva}
                onValueChange={(value) => setNovoRegistro({ ...novoRegistro, tipo_preventiva: value })}
              >
                <SelectTrigger>
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
                <Label htmlFor="data_programada">Data Programada *</Label>
                <Input
                  id="data_programada"
                  type="date"
                  value={novoRegistro.data_programada}
                  onChange={(e) => setNovoRegistro({ ...novoRegistro, data_programada: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_realizada">Data Realizada</Label>
                <Input
                  id="data_realizada"
                  type="date"
                  value={novoRegistro.data_realizada || ""}
                  onChange={(e) => setNovoRegistro({ ...novoRegistro, data_realizada: e.target.value || undefined })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="horario_agendado">Horário Agendado *</Label>
                <Input
                  id="horario_agendado"
                  type="time"
                  value={novoRegistro.horario_agendado}
                  onChange={(e) => setNovoRegistro({ ...novoRegistro, horario_agendado: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="situacao">Situação</Label>
                <Select
                  value={novoRegistro.situacao}
                  onValueChange={(value: "PENDENTE" | "ENCERRADO" | "EM_ANDAMENTO") =>
                    setNovoRegistro({ ...novoRegistro, situacao: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a situação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDENTE">PENDENTE</SelectItem>
                    <SelectItem value="EM_ANDAMENTO">ANDAMENTO</SelectItem>
                    <SelectItem value="ENCERRADO">ENCERRADO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            <Button onClick={adicionarRegistro} disabled={carregando}>
              {carregando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar registro */}
      <Dialog open={dialogoEditar} onOpenChange={setDialogoEditar}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Registro</DialogTitle>
            <DialogDescription>Atualize os dados do registro selecionado.</DialogDescription>
          </DialogHeader>

          {registroSelecionado && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-frota">Frota *</Label>
                  <Input
                    id="edit-frota"
                    value={registroSelecionado.frota}
                    onChange={(e) => setRegistroSelecionado({ ...registroSelecionado, frota: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-local">Local *</Label>
                  <Select
                    value={registroSelecionado.local}
                    onValueChange={(value) => setRegistroSelecionado({ ...registroSelecionado, local: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o local" />
                    </SelectTrigger>
                    <SelectContent>
                      {locais.map((local) => (
                        <SelectItem key={local.value} value={local.value}>
                          {local.label}
                        </SelectItem>
                      \
