"use client"
import dynamic from "next/dynamic"

const EquipamentosLocalizacao = dynamic(() => import("@/components/equipamentos-localizacao"), {
  ssr: false,
  loading: () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Equipamentos Localização</h1>
        <p className="text-slate-400 mt-2">Gerencie a localização e status dos equipamentos por categoria</p>
      </div>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    </div>
  ),
})

export default function EquipamentosLocalizacaoPage() {
  return <EquipamentosLocalizacao />
}
