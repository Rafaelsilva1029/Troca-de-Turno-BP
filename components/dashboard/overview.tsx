"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase-client"
import { Activity, AlertTriangle, Calendar, CheckCircle2, Clock, PenToolIcon as Tool, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardOverview() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    pendenciasCount: 0,
    liberadosCount: 0,
    veiculosCount: 0,
    manutencaoCount: 0,
    proximasManutencoes: 0,
    programacaoCount: 0,
    lembretesPendentes: 0,
    atividadesHoje: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const supabase = getSupabaseClient()

        // Buscar contagem de pendências
        const { count: pendenciasCount } = await supabase.from("pendencias").select("*", { count: "exact", head: true })

        // Buscar contagem de equipamentos liberados
        const { count: liberadosCount } = await supabase
          .from("pendencias_liberadas")
          .select("*", { count: "exact", head: true })

        // Buscar contagem de veículos
        const { count: veiculosCount } = await supabase
          .from("veiculos_logistica")
          .select("*", { count: "exact", head: true })

        // Buscar contagem de manutenções
        const { count: manutencaoCount } = await supabase
          .from("maintenance_records")
          .select("*", { count: "exact", head: true })
          .eq("situacao", "PENDENTE")

        // Buscar contagem de próximas manutenções (próximos 7 dias)
        const today = new Date()
        const nextWeek = new Date()
        nextWeek.setDate(today.getDate() + 7)

        const { count: proximasManutencoes } = await supabase
          .from("maintenance_records")
          .select("*", { count: "exact", head: true })
          .eq("situacao", "PENDENTE")
          .gte("data_programada", today.toISOString().split("T")[0])
          .lte("data_programada", nextWeek.toISOString().split("T")[0])

        // Buscar contagem de programação do turno
        const { count: programacaoCount } = await supabase
          .from("programacao_turno")
          .select("*", { count: "exact", head: true })

        // Buscar contagem de lembretes pendentes
        const { count: lembretesPendentes } = await supabase
          .from("reminders")
          .select("*", { count: "exact", head: true })
          .in("status", ["pendente", "em-andamento", "atrasado"])

        // Buscar contagem de atividades para hoje
        const { count: atividadesHoje } = await supabase
          .from("reminders")
          .select("*", { count: "exact", head: true })
          .eq("due_date", today.toISOString().split("T")[0])

        setStats({
          pendenciasCount: pendenciasCount || 0,
          liberadosCount: liberadosCount || 0,
          veiculosCount: veiculosCount || 0,
          manutencaoCount: manutencaoCount || 0,
          proximasManutencoes: proximasManutencoes || 0,
          programacaoCount: programacaoCount || 0,
          lembretesPendentes: lembretesPendentes || 0,
          atividadesHoje: atividadesHoje || 0,
        })

        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Pendências Oficina</CardTitle>
          <Tool className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20 bg-slate-800" />
          ) : (
            <>
              <div className="text-2xl font-bold text-white">{stats.pendenciasCount}</div>
              <p className="text-xs text-slate-400 mt-1">
                {stats.pendenciasCount > 0 ? (
                  <span className="flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
                    Pendências a resolver
                  </span>
                ) : (
                  <span className="flex items-center">
                    <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                    Nenhuma pendência
                  </span>
                )}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Equipamentos Liberados</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20 bg-slate-800" />
          ) : (
            <>
              <div className="text-2xl font-bold text-white">{stats.liberadosCount}</div>
              <p className="text-xs text-slate-400 mt-1">
                <span className="flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  Total de equipamentos liberados
                </span>
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Manutenções Pendentes</CardTitle>
          <Activity className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20 bg-slate-800" />
          ) : (
            <>
              <div className="text-2xl font-bold text-white">{stats.manutencaoCount}</div>
              <p className="text-xs text-slate-400 mt-1">
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1 text-amber-500" />
                  {stats.proximasManutencoes} nos próximos 7 dias
                </span>
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Lembretes</CardTitle>
          <Calendar className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20 bg-slate-800" />
          ) : (
            <>
              <div className="text-2xl font-bold text-white">{stats.lembretesPendentes}</div>
              <p className="text-xs text-slate-400 mt-1">
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1 text-amber-500" />
                  {stats.atividadesHoje} atividades para hoje
                </span>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
