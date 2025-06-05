import type { Metadata } from "next"
import { EquipamentosLocalizacaoClient } from "./client"

export const metadata: Metadata = {
  title: "Equipamentos Localização | Branco Peres",
  description: "Gerencie a localização e status dos equipamentos por categoria",
}

export default function EquipamentosLocalizacaoPage() {
  return <EquipamentosLocalizacaoClient />
}
