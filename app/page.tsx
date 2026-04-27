"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Search,
  ShoppingCart,
  Wallet,
  Plus,
  Trash2,
  Users,
  TrendingUp,
  UserPlus,
  X,
  Loader2,
} from "lucide-react"
import { getAlunos, createAluno, deleteAluno } from "@/lib/api"
import { formatCurrency, toNumber, cn } from "@/lib/utils"
import type { Aluno } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// ── Formulário de novo aluno ─────────────────────────────────
function NovoAlunoForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    nome: "",
    turma: "",
    responsavel: "",
    email: "",
    obs: "",
  })

  const mutation = useMutation({
    mutationFn: createAluno,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alunos"] })
      toast.success("Aluno cadastrado com sucesso!")
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nome || !form.turma || !form.responsavel || !form.email) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }
    mutation.mutate(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Novo Aluno</CardTitle>
          <Button size="icon-sm" variant="ghost" onClick={onClose}>
            <X size={16} />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Nome *</Label>
                <Input placeholder="Nome completo" value={form.nome} onChange={set("nome")} />
              </div>
              <div className="space-y-1.5">
                <Label>Turma *</Label>
                <Input placeholder="Ex: 3A" value={form.turma} onChange={set("turma")} />
              </div>
              <div className="space-y-1.5">
                <Label>Responsável *</Label>
                <Input placeholder="Nome do responsável" value={form.responsavel} onChange={set("responsavel")} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>E-mail *</Label>
                <Input type="email" placeholder="email@exemplo.com" value={form.email} onChange={set("email")} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Obs (opcional)</Label>
                <Input placeholder="Observações" value={form.obs} onChange={set("obs")} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : "Cadastrar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Card de aluno ────────────────────────────────────────────
function AlunoCard({ aluno, onDelete }: { aluno: Aluno; onDelete: (id: number) => void }) {
  const router = useRouter()
  const saldo = toNumber(aluno.saldo)
  const saldoPositivo = saldo > 0

  return (
    <div className="group relative bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-all animate-fade-in">
      {/* Linha lateral colorida */}
      <div
        className={cn(
          "absolute left-0 top-3 bottom-3 w-0.5 rounded-full",
          saldoPositivo ? "bg-green-500" : "bg-destructive"
        )}
      />

      <div className="pl-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">{aluno.nome}</p>
            <Badge variant="secondary" className="mt-1">{aluno.turma}</Badge>
          </div>
          <div className="text-right shrink-0">
            <p
              className={cn(
                "font-mono font-bold text-base",
                saldoPositivo ? "text-green-400" : "text-destructive"
              )}
            >
              {formatCurrency(saldo)}
            </p>
            <p className="text-xs text-muted-foreground">saldo</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground truncate mb-3">
          👤 {aluno.responsavel}
        </p>

        {/* Ações */}
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => router.push(`/venda?alunoId=${aluno.id}`)}
          >
            <ShoppingCart size={14} />
            Vender
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5"
            onClick={() => router.push(`/deposito?alunoId=${aluno.id}`)}
          >
            <Wallet size={14} />
            Depositar
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(aluno.id)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Dashboard ────────────────────────────────────────────────
export default function Dashboard() {
  const qc = useQueryClient()
  const [busca, setBusca] = useState("")
  const [showForm, setShowForm] = useState(false)

  const { data: alunos = [], isLoading, isError } = useQuery({
    queryKey: ["alunos"],
    queryFn: getAlunos,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAluno,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alunos"] })
      toast.success("Aluno removido")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleDelete = (id: number) => {
    if (confirm("Remover este aluno?")) deleteMutation.mutate(id)
  }

  const filtrados = alunos.filter((a) =>
    a.nome.toLowerCase().includes(busca.toLowerCase()) ||
    a.turma.toLowerCase().includes(busca.toLowerCase())
  )

  // Stats
  const totalSaldo = alunos.reduce((acc, a) => acc + toNumber(a.saldo), 0)
  const comSaldo = alunos.filter((a) => toNumber(a.saldo) > 0).length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alunos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie as contas dos alunos
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <UserPlus size={16} />
          Novo Aluno
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono">{alunos.length}</p>
              <p className="text-xs text-muted-foreground">Total de alunos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendingUp size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-green-400">
                {formatCurrency(totalSaldo)}
              </p>
              <p className="text-xs text-muted-foreground">Saldo total em circulação</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono">{comSaldo}</p>
              <p className="text-xs text-muted-foreground">Alunos com saldo</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por nome ou turma..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          autoFocus
        />
      </div>

      {/* States */}
      {isLoading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 size={18} className="animate-spin" /> Carregando alunos...
        </div>
      )}

      {isError && (
        <div className="text-center py-20">
          <p className="text-destructive font-medium">Erro ao conectar com a API</p>
          <p className="text-sm text-muted-foreground mt-1">
            Verifique se o backend está rodando em{" "}
            <code className="text-primary">{process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}</code>
          </p>
        </div>
      )}

      {!isLoading && !isError && filtrados.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          {busca ? `Nenhum aluno encontrado para "${busca}"` : "Nenhum aluno cadastrado"}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtrados.map((aluno) => (
          <AlunoCard key={aluno.id} aluno={aluno} onDelete={handleDelete} />
        ))}
      </div>

      {/* Modal */}
      {showForm && <NovoAlunoForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
