import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Controle de Equipamentos",
  description: "Sistema de controle e gerenciamento de equipamentos",
}

export default function ControleEquipamentosPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Controle de Equipamentos</h1>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <p className="text-slate-400">
          Página completa de controle de equipamentos em construção. Acesse a versão compacta na seção de Programação de
          Turno.
        </p>
      </div>
    </div>
  )
}
