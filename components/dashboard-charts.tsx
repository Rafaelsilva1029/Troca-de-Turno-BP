"use client"

import { useState } from "react"
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
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw, BarChart3, PieChartIcon, LineChartIcon } from "lucide-react"

// Dados de exemplo para os gráficos
const vehicleStatusData = [
  { name: "Operacional", value: 65, color: "#22c55e" },
  { name: "Em Manutenção", value: 25, color: "#eab308" },
  { name: "Inoperante", value: 10, color: "#ef4444" },
]

const vehicleTypeData = [
  { name: "Veículos Leves", operacional: 12, manutencao: 3, inoperante: 1 },
  { name: "Carga Seca", operacional: 8, manutencao: 2, inoperante: 1 },
  { name: "Caminhão Pipa", operacional: 10, manutencao: 5, inoperante: 2 },
  { name: "Caminhão Cavalos", operacional: 7, manutencao: 3, inoperante: 0 },
  { name: "Caminhão Munck", operacional: 5, manutencao: 2, inoperante: 1 },
  { name: "Caminhão Caçamba", operacional: 9, manutencao: 4, inoperante: 2 },
  { name: "Caminhão Pranchas", operacional: 6, manutencao: 2, inoperante: 1 },
  { name: "Caminhão Vinhaça", operacional: 8, manutencao: 3, inoperante: 1 },
  { name: "Caminhão Muda", operacional: 7, manutencao: 1, inoperante: 1 },
]

const maintenanceHistoryData = [
  { name: "Jan", preventiva: 12, corretiva: 8 },
  { name: "Fev", preventiva: 15, corretiva: 10 },
  { name: "Mar", preventiva: 18, corretiva: 7 },
  { name: "Abr", preventiva: 14, corretiva: 9 },
  { name: "Mai", preventiva: 16, corretiva: 6 },
  { name: "Jun", preventiva: 19, corretiva: 8 },
  { name: "Jul", preventiva: 22, corretiva: 5 },
  { name: "Ago", preventiva: 20, corretiva: 7 },
  { name: "Set", preventiva: 17, corretiva: 9 },
  { name: "Out", preventiva: 15, corretiva: 8 },
  { name: "Nov", preventiva: 18, corretiva: 6 },
  { name: "Dez", preventiva: 21, corretiva: 7 },
]

const fuelConsumptionData = [
  { name: "Jan", consumo: 5200 },
  { name: "Fev", consumo: 5800 },
  { name: "Mar", consumo: 6100 },
  { name: "Abr", consumo: 5900 },
  { name: "Mai", consumo: 6300 },
  { name: "Jun", consumo: 6700 },
  { name: "Jul", consumo: 7200 },
  { name: "Ago", consumo: 6800 },
  { name: "Set", consumo: 6500 },
  { name: "Out", consumo: 6200 },
  { name: "Nov", consumo: 5900 },
  { name: "Dez", consumo: 6400 },
]

const pendenciasData = [
  { name: "Veículos Leves", pendencias: 8 },
  { name: "Carga Seca", pendencias: 12 },
  { name: "Caminhão Pipa", pendencias: 15 },
  { name: "Caminhão Cavalos", pendencias: 7 },
  { name: "Caminhão Munck", pendencias: 9 },
  { name: "Caminhão Caçamba", pendencias: 14 },
  { name: "Caminhão Pranchas", pendencias: 6 },
  { name: "Caminhão Vinhaça", pendencias: 11 },
  { name: "Caminhão Muda", pendencias: 10 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded-md shadow-lg">
        <p className="text-slate-300 font-medium">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color || entry.stroke }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    )
  }

  return null
}

export function DashboardCharts() {
  const [timeRange, setTimeRange] = useState("year")
  const [isLoading, setIsLoading] = useState(false)

  const refreshData = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div></div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 h-8">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
              <SelectItem value="month">Último Mês</SelectItem>
              <SelectItem value="quarter">Último Trimestre</SelectItem>
              <SelectItem value="year">Último Ano</SelectItem>
              <SelectItem value="all">Todo o Período</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="bg-slate-800 hover:bg-slate-700 h-8"
            onClick={refreshData}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-slate-100 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button variant="outline" size="sm" className="bg-slate-800 hover:bg-slate-700 h-8">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-800/50 p-1 mb-6">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700 data-[state=active]:text-green-400">
            <BarChart3 className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="data-[state=active]:bg-slate-700 data-[state=active]:text-green-400">
            <PieChartIcon className="h-4 w-4 mr-2" />
            Veículos
          </TabsTrigger>
          <TabsTrigger
            value="maintenance"
            className="data-[state=active]:bg-slate-700 data-[state=active]:text-green-400"
          >
            <LineChartIcon className="h-4 w-4 mr-2" />
            Manutenção
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status dos Veículos */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Status dos Veículos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={vehicleStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {vehicleStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pendências por Categoria */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Pendências por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pendenciasData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#94a3b8" }}
                        tickLine={{ stroke: "#475569" }}
                        axisLine={{ stroke: "#475569" }}
                        tickFormatter={(value) => value.split(" ")[0]}
                      />
                      <YAxis
                        tick={{ fill: "#94a3b8" }}
                        tickLine={{ stroke: "#475569" }}
                        axisLine={{ stroke: "#475569" }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="pendencias" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Consumo de Combustível */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Consumo de Combustível (Litros)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={fuelConsumptionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#94a3b8" }}
                        tickLine={{ stroke: "#475569" }}
                        axisLine={{ stroke: "#475569" }}
                      />
                      <YAxis
                        tick={{ fill: "#94a3b8" }}
                        tickLine={{ stroke: "#475569" }}
                        axisLine={{ stroke: "#475569" }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="consumo" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Histórico de Manutenção */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Histórico de Manutenção</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={maintenanceHistoryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#94a3b8" }}
                        tickLine={{ stroke: "#475569" }}
                        axisLine={{ stroke: "#475569" }}
                      />
                      <YAxis
                        tick={{ fill: "#94a3b8" }}
                        tickLine={{ stroke: "#475569" }}
                        axisLine={{ stroke: "#475569" }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="preventiva" stroke="#22c55e" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="corretiva" stroke="#ef4444" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vehicles" className="mt-0">
          <div className="space-y-6">
            {/* Veículos por Tipo e Status */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Veículos por Tipo e Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vehicleTypeData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        type="number"
                        tick={{ fill: "#94a3b8" }}
                        tickLine={{ stroke: "#475569" }}
                        axisLine={{ stroke: "#475569" }}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fill: "#94a3b8" }}
                        tickLine={{ stroke: "#475569" }}
                        axisLine={{ stroke: "#475569" }}
                        width={120}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="operacional" name="Operacional" stackId="a" fill="#22c55e" />
                      <Bar dataKey="manutencao" name="Em Manutenção" stackId="a" fill="#eab308" />
                      <Bar dataKey="inoperante" name="Inoperante" stackId="a" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-0">
          <div className="space-y-6">
            {/* Histórico de Manutenção Detalhado */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">Histórico de Manutenção Detalhado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={maintenanceHistoryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#94a3b8" }}
                        tickLine={{ stroke: "#475569" }}
                        axisLine={{ stroke: "#475569" }}
                      />
                      <YAxis
                        tick={{ fill: "#94a3b8" }}
                        tickLine={{ stroke: "#475569" }}
                        axisLine={{ stroke: "#475569" }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="preventiva"
                        name="Manutenção Preventiva"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="corretiva"
                        name="Manutenção Corretiva"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
