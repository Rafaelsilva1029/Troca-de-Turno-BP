// This is the Dashboard for "Programação do Turno"
// Re-using and adapting from v464
"use client"

import { cn } from "@/lib/utils"

import { useEffect, useState } from "react"
import { CalendarDays, Tractor, Bus, BellRing, PlusCircle, Settings, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FuturisticCard } from "./components/futuristic-card"
import type { Shift, Reminder, DashboardStat, QuickAction } from "./lib/types"
import { mockShifts, mockEquipment, mockBusSchedules, mockReminders } from "./lib/data"
import Link from "next/link"
import { requestNotificationPermission, scheduleReminderNotification } from "./lib/notification-service"
import { useRouter } from "next/navigation"

// ISR revalidation
export const revalidate = 10

export default function ProgramacaoTurnoDashboardPage() {
  const router = useRouter()
  const [shiftsToday, setShiftsToday] = useState<Shift[]>([])
  const [activeEquipmentCount, setActiveEquipmentCount] = useState<number>(0)
  const [nextBusesCount, setNextBusesCount] = useState<number>(0)
  const [pendingReminders, setPendingReminders] = useState<Reminder[]>([])

  useEffect(() => {
    // Simulate fetching and processing data for dashboard
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    setShiftsToday(
      mockShifts.filter(
        (shift) => (shift.startTime >= todayStart && shift.startTime <= todayEnd) || shift.status === "Em Andamento",
      ),
    )
    setActiveEquipmentCount(mockEquipment.filter((e) => e.status === "Em Uso").length)
    setNextBusesCount(
      mockBusSchedules.filter((s) => {
        const [hours, minutes] = s.departureTime.split(":").map(Number)
        const departureDate = new Date()
        departureDate.setHours(hours, minutes, 0, 0)
        return departureDate > new Date() && s.status === "Programado"
      }).length,
    )
    setPendingReminders(mockReminders.filter((r) => !r.isViewed))

    // Request notification permission and schedule initial reminders
    requestNotificationPermission().then((permission) => {
      if (permission === "granted") {
        console.log("Permissão para notificações concedida.")
        mockReminders.forEach((reminder) => {
          if (!reminder.isViewed) {
            const notifyTime = reminder.notifyBeforeMinutes
              ? new Date(reminder.time.getTime() - reminder.notifyBeforeMinutes * 60000)
              : reminder.time
            scheduleReminderNotification(reminder.title, notifyTime, reminder.description)
          }
        })
      }
    })
  }, [])

  const dashboardStats: DashboardStat[] = [
    {
      title: "Turnos de Hoje",
      value: shiftsToday.length,
      icon: CalendarDays,
      description: "turnos ativos/planejados",
      link: "/programacao-turno/turnos",
      colorClass: "text-cyan-400 border-cyan-500",
    },
    {
      title: "Equipamentos em Campo",
      value: activeEquipmentCount,
      icon: Tractor,
      description: "equipamentos em uso",
      link: "/programacao-turno/equipamentos",
      colorClass: "text-green-400 border-green-500",
    },
    {
      title: "Próximos Ônibus",
      value: nextBusesCount,
      icon: Bus,
      description: "partidas programadas",
      link: "/programacao-turno/onibus",
      colorClass: "text-orange-400 border-orange-500",
    },
    {
      title: "Lembretes Pendentes",
      value: pendingReminders.length,
      icon: BellRing,
      description: "alertas ativos",
      link: "/programacao-turno/lembretes",
      colorClass: "text-amber-400 border-amber-500",
    },
  ]

  const quickActions: QuickAction[] = [
    {
      label: "Novo Turno",
      icon: PlusCircle,
      action: () => router.push("/programacao-turno/turnos?action=new"),
      className: "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white",
    },
    {
      label: "Registrar Equipamento",
      icon: Tractor,
      action: () => router.push("/programacao-turno/equipamentos?action=new"),
      className: "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white",
    },
    {
      label: "Adicionar Ônibus",
      icon: Bus,
      action: () => router.push("/programacao-turno/onibus?action=new"),
      className: "bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white",
    },
    {
      label: "Criar Lembrete",
      icon: BellRing,
      action: () => router.push("/programacao-turno/lembretes?action=new"),
      variant: "outline",
      className: "border-amber-500 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300",
    },
  ]

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Programação do Turno</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-600 hover:bg-slate-700/50">
            <Download className="mr-2 h-4 w-4" /> Exportar Resumo
          </Button>
          <Button variant="outline" className="border-slate-600 hover:bg-slate-700/50">
            <Settings className="mr-2 h-4 w-4" /> Configurações
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
          <FuturisticCard
            key={stat.title}
            title={stat.title}
            icon={stat.icon}
            iconColorClass={stat.colorClass.split(" ")[0]} // e.g. text-cyan-400
            className="animate-slideInFromLeft"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <p className={`text-4xl font-bold ${stat.colorClass.split(" ")[0]}`}>{stat.value}</p>
            <p className="text-sm text-slate-400">{stat.description}</p>
            <Link href={stat.link}>
              <Button variant="outline" size="sm" className={`mt-4 w-full ${stat.colorClass} hover:bg-opacity-10`}>
                Ver Detalhes
              </Button>
            </Link>
          </FuturisticCard>
        ))}
      </div>

      {/* Quick Actions */}
      <FuturisticCard
        title="Ações Rápidas"
        icon={PlusCircle}
        iconColorClass="text-slate-300"
        className="animate-fadeIn"
        style={{ animationDelay: "0.4s" }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((qa) => (
            <Button
              key={qa.label}
              onClick={qa.action}
              variant={qa.variant}
              className={cn("w-full flex items-center justify-center gap-2 py-3 text-base", qa.className)}
            >
              {qa.icon && <qa.icon className="h-5 w-5" />}
              {qa.label}
            </Button>
          ))}
        </div>
      </FuturisticCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Turnos do Dia */}
        <FuturisticCard
          title="Resumo dos Turnos do Dia"
          icon={CalendarDays}
          iconColorClass="text-cyan-400"
          className="lg:col-span-2 animate-slideInFromBottom"
        >
          {shiftsToday.length > 0 ? (
            <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {shiftsToday.map((shift) => (
                <li
                  key={shift.id}
                  className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-100">
                      {shift.employeeName} - {shift.workFront}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        shift.status === "Em Andamento"
                          ? "bg-green-500/20 text-green-300 border border-green-500/30"
                          : shift.status === "Planejado"
                            ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                            : shift.status === "Concluído"
                              ? "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                              : "bg-red-500/20 text-red-300 border border-red-500/30"
                      }`}
                    >
                      {shift.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    {shift.startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                    {shift.endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {shift.observations && <p className="text-xs text-slate-500 mt-1 truncate">{shift.observations}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 text-center py-4">Nenhum turno programado para hoje.</p>
          )}
        </FuturisticCard>

        {/* Lembretes Pendentes */}
        <FuturisticCard
          title="Lembretes Ativos"
          icon={BellRing}
          iconColorClass="text-amber-400"
          className="animate-slideInFromBottom"
          style={{ animationDelay: "0.1s" }}
        >
          {pendingReminders.length > 0 ? (
            <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {pendingReminders.map((reminder) => (
                <li
                  key={reminder.id}
                  className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-100">{reminder.title}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        reminder.priority === "Alta"
                          ? "bg-red-500/20 text-red-300 border border-red-500/30"
                          : reminder.priority === "Média"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                      }`}
                    >
                      {reminder.priority}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    {reminder.time.toLocaleTimeString([], {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {reminder.description && (
                    <p className="text-xs text-slate-500 mt-1 truncate">{reminder.description}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 text-center py-4">Nenhum lembrete pendente.</p>
          )}
        </FuturisticCard>
      </div>
    </div>
  )
}
