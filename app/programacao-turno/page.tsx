import { CollapsibleEquipmentControl } from "@/components/collapsible-equipment-control"

export default function ProgramacaoTurnoPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Programação do Turno</h1>

      {/* Componente de Controle de Equipamentos Recolhível */}
      <CollapsibleEquipmentControl />

      {/* Resto do conteúdo da página */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">Programação Atual</h2>
          {/* Conteúdo da programação */}
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">Próximos Turnos</h2>
          {/* Conteúdo dos próximos turnos */}
        </div>
      </div>
    </div>
  )
}
