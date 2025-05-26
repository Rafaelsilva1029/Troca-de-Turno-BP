"use client"

import type React from "react"

import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { getSupabaseClient } from "@/lib/supabase"
import type { Record } from "@/types/types"

const WashingLubrificationControl = () => {
  const [registros, setRegistros] = useState<Record[]>([])
  const [novoRegistro, setNovoRegistro] = useState<Omit<Record, "id">>({
    date: new Date().toLocaleDateString("pt-BR"),
    km: 0,
    description: "",
  })
  const [bdConectado, setBdConectado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const { toast } = useToast()
  const [statusConexao, setStatusConexao] = useState<"conectando" | "conectado" | "erro" | "offline">("conectando")

  useEffect(() => {
    tentarConectarBanco()
  }, [])

  // Função para tentar conectar com banco
  const tentarConectarBanco = async () => {
    try {
      setStatusConexao("conectando")
      setErro(null)

      const supabase = getSupabaseClient()

      // Tentar carregar dados da tabela
      const { data, error } = await supabase.from("maintenance_records").select("*").order("id", { ascending: false })

      if (error) {
        throw error
      }

      // Sucesso! Tabela existe e dados carregados
      if (data && data.length > 0) {
        setRegistros(data)
      }

      setBdConectado(true)
      setStatusConexao("conectado")

      toast({
        title: "✅ Conectado ao Banco!",
        description: `${data?.length || 0} registros carregados com sucesso!`,
      })
    } catch (error) {
      console.error("Erro na conexão:", error)
      setStatusConexao("offline")
      setBdConectado(false)
      setErro("Sistema funcionando offline com dados locais.")

      toast({
        title: "Modo Offline",
        description: "Verifique se a tabela foi criada corretamente no Supabase.",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNovoRegistro({
      ...novoRegistro,
      [name]: value,
    })
  }

  const adicionarRegistro = async () => {
    if (!novoRegistro.date || !novoRegistro.km || !novoRegistro.description) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos!",
        variant: "destructive",
      })
      return
    }

    if (!bdConectado) {
      toast({
        title: "Erro",
        description: "Sem conexão com o banco de dados!",
        variant: "destructive",
      })
      return
    }

    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.from("maintenance_records").insert([novoRegistro]).select()

      if (error) {
        throw error
      }

      setRegistros([...registros, data[0]])
      setNovoRegistro({
        date: new Date().toLocaleDateString("pt-BR"),
        km: 0,
        description: "",
      })

      toast({
        title: "Sucesso",
        description: "Registro adicionado com sucesso!",
      })
    } catch (error) {
      console.error("Erro ao adicionar registro:", error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar registro!",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Controle de Lavagem e Lubrificação</h1>

      {statusConexao === "conectando" && (
        <div className="alert alert-info">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>Conectando ao banco de dados...</span>
        </div>
      )}

      {erro && (
        <div className="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{erro}</span>
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Adicionar Registro</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Data:</label>
            <Input
              type="date"
              name="date"
              onChange={handleInputChange}
              value={novoRegistro.date}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">KM:</label>
            <Input
              type="number"
              name="km"
              onChange={handleInputChange}
              value={novoRegistro.km}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Descrição:</label>
            <Input
              type="text"
              name="description"
              onChange={handleInputChange}
              value={novoRegistro.description}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>
        <Button onClick={adicionarRegistro} className="mt-4">
          Adicionar
        </Button>
      </div>

      <Table>
        <TableCaption>Lista de registros de lavagem e lubrificação.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Data</TableHead>
            <TableHead>KM</TableHead>
            <TableHead>Descrição</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registros.map((registro) => (
            <TableRow key={registro.id}>
              <TableCell className="font-medium">{registro.date}</TableCell>
              <TableCell>{registro.km}</TableCell>
              <TableCell>{registro.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total de registros: {registros.length}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}

export default WashingLubrificationControl
