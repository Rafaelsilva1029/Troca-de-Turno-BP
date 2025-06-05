"use client"

import { useState, useEffect } from "react"
import { Search, MapPin, Truck, Activity, AlertCircle, CheckCircle } from "lucide-react"

export default function EquipamentosSistema() {
  const [searchTerm, setSearchTerm] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    console.log("🚀 EQUIPAMENTOS SISTEMA CARREGADO COM SUCESSO!")
    console.log("📍 URL:", window.location.href)
  }, [])

  const equipamentos = [
    {
      frota: "BP001",
      categoria: "PIPAS ÁGUA BRUTA",
      localizacao: "Setor A - Linha 1",
      status: "ATIVO",
      operador: "João Silva",
      ultimaAtualizacao: "10:30",
    },
    {
      frota: "BP002",
      categoria: "MUNCK DISPONÍVEL",
      localizacao: "Oficina Central",
      status: "MANUTENÇÃO",
      operador: "Maria Santos",
      ultimaAtualizacao: "09:15",
    },
    {
      frota: "BP003",
      categoria: "CAÇAMBAS DISPONÍVEIS",
      localizacao: "Pátio Principal",
      status: "ATIVO",
      operador: "Pedro Costa",
      ultimaAtualizacao: "11:45",
    },
    {
      frota: "BP004",
      categoria: "TRATOR AGRÍCOLA",
      localizacao: "Campo Norte",
      status: "EM OPERAÇÃO",
      operador: "Ana Oliveira",
      ultimaAtualizacao: "12:20",
    },
    {
      frota: "BP005",
      categoria: "CAMINHÃO BASCULANTE",
      localizacao: "Estrada Rural",
      status: "ATIVO",
      operador: "Carlos Lima",
      ultimaAtualizacao: "13:10",
    },
  ]

  const filteredEquipamentos = equipamentos.filter(
    (eq) =>
      eq.frota.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.localizacao.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ATIVO":
      case "EM OPERAÇÃO":
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case "MANUTENÇÃO":
        return <AlertCircle className="h-4 w-4 text-yellow-400" />
      default:
        return <Activity className="h-4 w-4 text-blue-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ATIVO":
      case "EM OPERAÇÃO":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "MANUTENÇÃO":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando sistema de equipamentos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header Fixo */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-green-400 flex items-center gap-2">
                <MapPin className="h-6 w-6" />
                Equipamentos Localização
              </h1>
              <p className="text-slate-400 text-sm">Sistema de Monitoramento - Branco Peres</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm">Sistema Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Equipamentos Ativos</p>
                <p className="text-2xl font-bold text-green-400">
                  {equipamentos.filter((eq) => eq.status === "ATIVO" || eq.status === "EM OPERAÇÃO").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Em Manutenção</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {equipamentos.filter((eq) => eq.status === "MANUTENÇÃO").length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Frota</p>
                <p className="text-2xl font-bold text-blue-400">{equipamentos.length}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Última Atualização</p>
                <p className="text-lg font-bold text-purple-400">{new Date().toLocaleTimeString()}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Busca */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por frota, categoria ou localização..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Lista de Equipamentos */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-100 mb-4">
            📍 Equipamentos Monitorados ({filteredEquipamentos.length})
          </h2>

          {filteredEquipamentos.map((equipamento, index) => (
            <div
              key={index}
              className="bg-slate-800 rounded-lg border border-slate-700 hover:border-green-500/50 transition-colors"
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-green-400">Frota: {equipamento.frota}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(equipamento.status)}`}
                      >
                        {getStatusIcon(equipamento.status)}
                        <span className="ml-1">{equipamento.status}</span>
                      </span>
                    </div>

                    <p className="text-slate-300 font-medium mb-1">{equipamento.categoria}</p>

                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{equipamento.localizacao}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        <span>Operador: {equipamento.operador}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-slate-400">Última atualização</p>
                    <p className="text-green-400 font-medium">{equipamento.ultimaAtualizacao}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredEquipamentos.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Nenhum equipamento encontrado para "{searchTerm}"</p>
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="mt-8 bg-slate-800 p-4 rounded-lg border border-slate-600">
          <h3 className="font-semibold text-green-400 mb-2">✅ Sistema Funcionando</h3>
          <div className="text-sm text-slate-400 space-y-1">
            <p>• Rota: /equipamentos-sistema</p>
            <p>• Timestamp: {new Date().toLocaleString()}</p>
            <p>• Status: Operacional</p>
          </div>
        </div>
      </div>
    </div>
  )
}
