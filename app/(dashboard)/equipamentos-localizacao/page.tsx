import { EquipamentosLocalizacao } from "@/components/equipamentos-localizacao"

export default function EquipamentosLocalizacaoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Equipamentos Localização</h1>
        <p className="text-slate-400 mt-2">Gerencie a localização e status dos equipamentos por categoria</p>
      </div>
      <EquipamentosLocalizacao />
    </div>
  )
}
