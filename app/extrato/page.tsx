"use client"

import { useQuery } from "@tanstack/react-query"
import { Loader2, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatCurrency, toNumber, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type Deposito = {
  id: number
  valor: number
  tipo: string
  data: string
}

type Venda = {
  id: number
  preco: number
  quant: number
  data: string
  produto: {
    nome: string
  }
}

type Extrato = {
  nome: string
  turma: string
  saldo: number
  depositos: Deposito[]
  vendas: Venda[]
}

// 🔥 função API (ajusta URL se precisar)
async function getExtrato(): Promise<Extrato> {
  const res = await fetch("http://localhost:3001/alunos/1/extrato")
  if (!res.ok) throw new Error("Erro ao buscar extrato")
  return res.json()
}

export default function ExtratoPage() {
  const router = useRouter()

  const { data, isLoading, error } = useQuery({
    queryKey: ["extrato"],
    queryFn: getExtrato,
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="animate-spin" size={18} />
        Carregando extrato...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-screen items-center justify-center text-destructive">
        Erro ao carregar extrato
      </div>
    )
  }

  // junta tudo em uma lista só (ordenada por data)
  const movimentos = [
    ...data.depositos.map((d) => ({
      tipo: "deposito",
      data: d.data,
      valor: toNumber(d.valor),
      descricao: `Depósito (${d.tipo})`,
    })),
    ...data.vendas.map((v) => ({
      tipo: "venda",
      data: v.data,
      valor: toNumber(v.preco),
      descricao: `${v.produto.nome} (x${v.quant})`,
    })),
  ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <Button size="icon-sm" variant="ghost" onClick={() => router.push("/")}>
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h2 className="font-semibold">Extrato</h2>
          <p className="text-xs text-muted-foreground">
            {data.nome} • {data.turma}
          </p>
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {movimentos.length === 0 ? (
          <p className="text-center text-muted-foreground">
            Nenhum lançamento encontrado
          </p>
        ) : (
          movimentos.map((m, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
            >
              <div>
                <p className="text-sm font-medium">{m.descricao}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(m.data).toLocaleDateString("pt-BR")}
                </p>
              </div>

              <p
                className={cn(
                  "font-mono font-bold",
                  m.tipo === "deposito"
                    ? "text-green-400"
                    : "text-destructive"
                )}
              >
                {m.tipo === "deposito" ? "+" : "-"}{" "}
                {formatCurrency(m.valor)}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Saldo */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Saldo atual</span>
          <span
            className={cn(
              "font-mono font-bold text-2xl",
              toNumber(data.saldo) > 0
                ? "text-green-400"
                : "text-destructive"
            )}
          >
            {formatCurrency(toNumber(data.saldo))}
          </span>
        </div>
      </div>
    </div>
  )
}