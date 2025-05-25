"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type VehicleCategory =
  | "veiculos-leves"
  | "carga-seca"
  | "caminhao-pipa"
  | "caminhao-cavalos"
  | "caminhao-munck"
  | "caminhao-cacamba"
  | "caminhao-pranchas"
  | "caminhao-vinhaca"
  | "caminhao-muda"

interface Vehicle {
  id: string
  frota: string
  categoria: VehicleCategory
  placa: string
  modelo: string
  ano: string
  status: string
  ultimaManutencao?: string
  proximaManutencao?: string
  motorista?: string
  observacoes?: string
}

interface VehicleDialogProps {
  isOpen: boolean
  onClose: () => void
  vehicle: Vehicle | null
  onSave: (vehicle: Vehicle) => void
}

export function VehicleDialog({ isOpen, onClose, vehicle, onSave }: VehicleDialogProps) {
  const [formData, setFormData] = useState<Vehicle>({
    id: "",
    frota: "",
    categoria: "veiculos-leves",
    placa: "",
    modelo: "",
    ano: "",
    status: "Operacional",
    ultimaManutencao: "",
    proximaManutencao: "",
    motorista: "",
    observacoes: "",
  })

  useEffect(() => {
    if (vehicle) {
      setFormData(vehicle)
    } else {
      setFormData({
        id: "",
        frota: "",
        categoria: "veiculos-leves",
        placa: "",
        modelo: "",
        ano: "",
        status: "Operacional",
        ultimaManutencao: "",
        proximaManutencao: "",
        motorista: "",
        observacoes: "",
      })
    }
  }, [vehicle])

  const handleSave = () => {
    onSave(formData)
  }

  const handleInputChange = (field: keyof Vehicle, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900/95 border-slate-700/50 backdrop-blur-sm text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center text-green-400">
            {vehicle?.id ? "Editar Equipamento" : "Novo Equipamento"}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {vehicle?.id ? "Edite as informações do equipamento" : "Adicione um novo equipamento à frota"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Frota */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="frota" className="text-right text-slate-300">
              Frota *
            </Label>
            <Input
              id="frota"
              value={formData.frota}
              onChange={(e) => handleInputChange("frota", e.target.value)}
              className="col-span-3 bg-slate-800/50 border-slate-700/50 text-slate-100"
              placeholder="Ex: L-001"
              required
            />
          </div>

          {/* Categoria */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="categoria" className="text-right text-slate-300">
              Categoria *
            </Label>
            <Select value={formData.categoria} onValueChange={(value) => handleInputChange("categoria", value)}>
              <SelectTrigger className="col-span-3 bg-slate-800/50 border-slate-700/50 text-slate-100">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                <SelectItem value="veiculos-leves">Veículos Leves</SelectItem>
                <SelectItem value="carga-seca">Carga Seca</SelectItem>
                <SelectItem value="caminhao-pipa">Caminhão Pipa</SelectItem>
                <SelectItem value="caminhao-cavalos">Caminhão Cavalos</SelectItem>
                <SelectItem value="caminhao-munck">Caminhão Munck</SelectItem>
                <SelectItem value="caminhao-cacamba">Caminhão Caçamba</SelectItem>
                <SelectItem value="caminhao-pranchas">Caminhão Pranchas</SelectItem>
                <SelectItem value="caminhao-vinhaca">Caminhão Vinhaça</SelectItem>
                <SelectItem value="caminhao-muda">Caminhão Muda</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right text-slate-300">
              Status *
            </Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
              <SelectTrigger className="col-span-3 bg-slate-800/50 border-slate-700/50 text-slate-100">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                <SelectItem value="Operacional">Operacional</SelectItem>
                <SelectItem value="Em manutenção">Em manutenção</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
                <SelectItem value="Aguardando peças">Aguardando peças</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Placa */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="placa" className="text-right text-slate-300">
              Placa
            </Label>
            <Input
              id="placa"
              value={formData.placa}
              onChange={(e) => handleInputChange("placa", e.target.value)}
              className="col-span-3 bg-slate-800/50 border-slate-700/50 text-slate-100"
              placeholder="Ex: ABC-1234"
            />
          </div>

          {/* Modelo */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="modelo" className="text-right text-slate-300">
              Modelo
            </Label>
            <Input
              id="modelo"
              value={formData.modelo}
              onChange={(e) => handleInputChange("modelo", e.target.value)}
              className="col-span-3 bg-slate-800/50 border-slate-700/50 text-slate-100"
              placeholder="Ex: Toyota Hilux"
            />
          </div>

          {/* Ano */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ano" className="text-right text-slate-300">
              Ano
            </Label>
            <Input
              id="ano"
              value={formData.ano}
              onChange={(e) => handleInputChange("ano", e.target.value)}
              className="col-span-3 bg-slate-800/50 border-slate-700/50 text-slate-100"
              placeholder="Ex: 2022"
            />
          </div>

          {/* Motorista */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="motorista" className="text-right text-slate-300">
              Motorista
            </Label>
            <Input
              id="motorista"
              value={formData.motorista || ""}
              onChange={(e) => handleInputChange("motorista", e.target.value)}
              className="col-span-3 bg-slate-800/50 border-slate-700/50 text-slate-100"
              placeholder="Nome do motorista"
            />
          </div>

          {/* Observações */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="observacoes" className="text-right text-slate-300 mt-2">
              Observações
            </Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes || ""}
              onChange={(e) => handleInputChange("observacoes", e.target.value)}
              className="col-span-3 bg-slate-800/50 border-slate-700/50 text-slate-100 min-h-[80px]"
              placeholder="Observações adicionais..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border-slate-600/50"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={!formData.frota.trim()}
          >
            {vehicle?.id ? "Atualizar" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
