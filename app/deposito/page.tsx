"use client"

import { useState, Suspense } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Search,
  Wallet,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Smartphone,
  CreditCard,
  Banknote,
} from "lucide-react"
import { getAlunos, createDeposito } from "@/lib/api"
import { formatCurrency, toNumber, cn } from "@/lib/utils"
import type { Aluno } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type TipoDeposito = "PIX" | "Cartao" | "Dinheiro"

const TIPOS: { value: TipoDeposito; icon: React.ReactNode; label: string }[] = [
  { value: "PIX", icon: <Smartphone size={18} />, label: "PIX" },
  { value: "Cartao", icon: <CreditCard size={18} />, label: "Cartão" },
  { value: "Dinheiro", icon: <Banknote size={18} />, label: "Dinheiro" },
]

// Valores rápidos para depósito
const VALORES_RAPIDOS = [10, 20, 50, 100]

function DepositoContent() {
  const router = useRouter()
  const qc = useQueryClient()
  const searchParams = useSearchParams()
  const alunoIdParam = searchParams.get("alunoId")

  const [busca, setBusca] = useState("")
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null)
  const [valor, setValor] = useState("")
  const [tipo, setTipo] = useState<TipoDeposito>("PIX")
  const [sucesso, setSucesso] = useState(false)

  const { data: alunos = [], isLoading } = useQuery({
    queryKey: ["alunos"],
    queryFn: getAlunos,
    select: (data) => {
      if (alunoIdParam && !alunoSelecionado) {
        const aluno = data.find((a) => a.id === Number(alunoIdParam))
        if (aluno) setAlunoSelecionado(aluno)
      }
      return data
    },
  })

  const mutation = useMutation({
    mutationFn: () => {
      if (!alunoSelecionado) throw new Error("Nenhum aluno selecionado")
      const v = parseFloat(valor.replace(",", "."))
      if (!v || v <= 0) throw new Error("Valor inválido")
      return createDeposito({ alunoId: alunoSelecionado.id, valor: v, tipo })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alunos"] })
      setSucesso(true)
      setTimeout(() => {
        setSucesso(false)
        setAlunoSelecionado(null)
        setValor("")
        router.push("/")
      }, 2000)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const filtrados = alunos.filter(
    (a) =>
      a.nome.toLowerCase().includes(busca.toLowerCase()) ||
      a.turma.toLowerCase().includes(busca.toLowerCase())
  )

  // ── Tela de sucesso ──────────────────────────────────────
  if (sucesso) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center animate-fade-in">
          <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-green-400">Depósito realizado!</h2>
          <p className="text-muted-foreground mt-2">Redirecionando...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
        <Loader2 size={18} className="animate-spin" /> Carregando...
      </div>
    )
  }

  const valorNum = parseFloat(valor.replace(",", ".")) || 0
  const novoSaldo = toNumber(alunoSelecionado?.saldo ?? 0) + valorNum

  return (
    <div className="flex h-full">
      {/* Seletor de alunos (esq) */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="px-4 py-4 border-b border-border">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
            Selecionar Aluno
          </h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8 h-9 text-sm"
              placeholder="Buscar aluno..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtrados.map((aluno) => {
            const saldo = toNumber(aluno.saldo)
            const ativo = alunoSelecionado?.id === aluno.id
            return (
              <button
                key={aluno.id}
                onClick={() => setAlunoSelecionado(aluno)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg text-left transition-all text-sm",
                  ativo
                    ? "bg-primary/10 border border-primary/40"
                    : "hover:bg-secondary border border-transparent"
                )}
              >
                <div>
                  <p className={cn("font-medium", ativo ? "text-primary" : "text-foreground")}>
                    {aluno.nome}
                  </p>
                  <p className="text-xs text-muted-foreground">{aluno.turma}</p>
                </div>
                <p className={cn(
                  "font-mono font-bold text-xs",
                  saldo > 0 ? "text-green-400" : "text-destructive"
                )}>
                  {formatCurrency(saldo)}
                </p>
              </button>
            )
          })}
          {filtrados.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">
              Nenhum aluno encontrado
            </p>
          )}
        </div>
      </div>

      {/* Formulário (dir) */}
      <div className="flex-1 flex items-start justify-center pt-10 px-6">
        {!alunoSelecionado ? (
          <div className="text-center text-muted-foreground mt-20">
            <Wallet size={48} className="mx-auto opacity-20 mb-3" />
            <p>Selecione um aluno à esquerda</p>
          </div>
        ) : (
          <div className="w-full max-w-sm animate-fade-in">
            {/* Header aluno */}
            <div className="bg-card border border-border rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Aluno selecionado</p>
                <button
                  onClick={() => setAlunoSelecionado(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  trocar
                </button>
              </div>
              <p className="font-bold text-xl">{alunoSelecionado.nome}</p>
              <p className="text-sm text-muted-foreground">{alunoSelecionado.turma}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <span className="text-sm text-muted-foreground">Saldo atual</span>
                <span className={cn(
                  "font-mono font-bold text-lg",
                  toNumber(alunoSelecionado.saldo) > 0 ? "text-green-400" : "text-destructive"
                )}>
                  {formatCurrency(alunoSelecionado.saldo)}
                </span>
              </div>
              {valorNum > 0 && (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-muted-foreground">Novo saldo</span>
                  <span className="font-mono font-bold text-lg text-green-400">
                    {formatCurrency(novoSaldo)}
                  </span>
                </div>
              )}
            </div>

            {/* Valor */}
            <div className="space-y-2 mb-4">
              <Label className="text-foreground font-medium">Valor do depósito</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                  R$
                </span>
                <Input
                  className="pl-9 h-14 text-2xl font-mono font-bold"
                  placeholder="0,00"
                  value={valor}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9,\.]/g, "")
                    setValor(v)
                  }}
                  autoFocus
                />
              </div>
              {/* Valores rápidos */}
              <div className="grid grid-cols-4 gap-2">
                {VALORES_RAPIDOS.map((v) => (
                  <Button
                    key={v}
                    variant="outline"
                    size="sm"
                    onClick={() => setValor(String(v))}
                    className={cn(valor === String(v) && "border-primary text-primary")}
                  >
                    R$ {v}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tipo */}
            <div className="space-y-2 mb-6">
              <Label className="text-foreground font-medium">Forma de pagamento</Label>
              <div className="grid grid-cols-3 gap-2">
                {TIPOS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTipo(t.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                      tipo === t.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                    )}
                  >
                    {t.icon}
                    <span className="text-sm font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              size="xl"
              className="w-full gap-2"
              onClick={() => mutation.mutate()}
              disabled={!valor || valorNum <= 0 || mutation.isPending}
            >
              {mutation.isPending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <Wallet size={20} />
                  Confirmar Depósito{valorNum > 0 && ` de ${formatCurrency(valorNum)}`}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DepositoPage() {
  return (
    <div className="flex flex-col h-screen">
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-xl font-bold">Depósito</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Adicione saldo na conta do aluno
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
            <Loader2 size={18} className="animate-spin" /> Carregando...
          </div>
        }>
          <DepositoContent />
        </Suspense>
      </div>
    </div>
  )
}
