export interface MaintenanceRecord {
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
