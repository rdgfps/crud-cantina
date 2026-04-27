"use client"

import { useState, useMemo, Suspense } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  ArrowLeft,
  Loader2,
  PackageX,
  X,
} from "lucide-react"
import { getAlunos, getProdutos, createVenda } from "@/lib/api"
import { formatCurrency, toNumber, cn } from "@/lib/utils"
import type { Aluno, Produto, CartItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// ── Seletor de aluno (overlay) ────────────────────────────────
function SeletorAluno({
  alunos,
  onSelect,
}: {
  alunos: Aluno[]
  onSelect: (a: Aluno) => void
}) {
  const [busca, setBusca] = useState("")
  const filtrados = alunos.filter((a) =>
    a.nome.toLowerCase().includes(busca.toLowerCase()) ||
    a.turma.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="flex-1 flex items-start justify-center pt-16 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ShoppingCart size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Selecionar Aluno</h2>
          <p className="text-muted-foreground mt-1">Escolha o aluno para iniciar a venda</p>
        </div>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 h-12 text-base"
            placeholder="Buscar por nome ou turma..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            autoFocus
          />
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {filtrados.map((aluno) => {
            const saldo = toNumber(aluno.saldo)
            return (
              <button
                key={aluno.id}
                onClick={() => onSelect(aluno)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
              >
                <div>
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {aluno.nome}
                  </p>
                  <p className="text-sm text-muted-foreground">{aluno.turma}</p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-mono font-bold",
                    saldo > 0 ? "text-green-400" : "text-destructive"
                  )}>
                    {formatCurrency(saldo)}
                  </p>
                  <p className="text-xs text-muted-foreground">saldo</p>
                </div>
              </button>
            )
          })}
          {filtrados.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhum aluno encontrado</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Card de produto ───────────────────────────────────────────
function ProdutoCard({
  produto,
  quantNoCarrinho,
  onAdd,
  onRemove,
}: {
  produto: Produto
  quantNoCarrinho: number
  onAdd: () => void
  onRemove: () => void
}) {
  const semEstoque = produto.quant === 0

  return (
    <div
      className={cn(
        "bg-card border rounded-xl p-4 flex flex-col gap-3 transition-all",
        semEstoque
          ? "border-border opacity-50"
          : quantNoCarrinho > 0
          ? "border-primary/60 bg-primary/5"
          : "border-border hover:border-border/80"
      )}
    >
      <div className="flex-1">
        <p className={cn("font-semibold", semEstoque ? "text-muted-foreground" : "text-foreground")}>
          {produto.nome}
        </p>
        <p className="text-xl font-mono font-bold text-primary mt-1">
          {formatCurrency(produto.preco)}
        </p>
        <p className={cn("text-xs mt-1", semEstoque ? "text-destructive" : "text-muted-foreground")}>
          {semEstoque ? "Sem estoque" : `${produto.quant} em estoque`}
        </p>
      </div>

      {quantNoCarrinho > 0 ? (
        <div className="flex items-center justify-between bg-primary/10 rounded-lg px-2 py-1">
          <Button
            size="icon-sm"
            variant="ghost"
            className="h-7 w-7 text-primary hover:bg-primary/20"
            onClick={onRemove}
          >
            <Minus size={14} />
          </Button>
          <span className="font-mono font-bold text-primary text-sm w-6 text-center">
            {quantNoCarrinho}
          </span>
          <Button
            size="icon-sm"
            variant="ghost"
            className="h-7 w-7 text-primary hover:bg-primary/20"
            onClick={onAdd}
            disabled={semEstoque || quantNoCarrinho >= produto.quant}
          >
            <Plus size={14} />
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          className="w-full gap-1"
          onClick={onAdd}
          disabled={semEstoque}
        >
          <Plus size={14} />
          Adicionar
        </Button>
      )}
    </div>
  )
}

// ── Página principal da venda ─────────────────────────────────
function VendaContent() {
  const router = useRouter()
  const qc = useQueryClient()
  const searchParams = useSearchParams()
  const alunoIdParam = searchParams.get("alunoId")

  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [vendaOk, setVendaOk] = useState(false)

  const { data: alunos = [], isLoading: loadingAlunos } = useQuery({
    queryKey: ["alunos"],
    queryFn: getAlunos,
    // Seleciona o aluno automaticamente se vier da URL
    select: (data) => {
      if (alunoIdParam && !alunoSelecionado) {
        const aluno = data.find((a) => a.id === Number(alunoIdParam))
        if (aluno) setAlunoSelecionado(aluno)
      }
      return data
    },
  })

  const { data: produtos = [], isLoading: loadingProdutos } = useQuery({
    queryKey: ["produtos"],
    queryFn: getProdutos,
  })

  // ── Carrinho helpers ─────────────────────────────────────
  const addToCart = (produto: Produto) => {
    setCart((prev) => {
      const existe = prev.find((i) => i.produto.id === produto.id)
      if (existe) {
        return prev.map((i) =>
          i.produto.id === produto.id ? { ...i, quant: i.quant + 1 } : i
        )
      }
      return [...prev, { produto, quant: 1 }]
    })
  }

  const removeFromCart = (produtoId: number) => {
    setCart((prev) => {
      const item = prev.find((i) => i.produto.id === produtoId)
      if (item && item.quant > 1) {
        return prev.map((i) =>
          i.produto.id === produtoId ? { ...i, quant: i.quant - 1 } : i
        )
      }
      return prev.filter((i) => i.produto.id !== produtoId)
    })
  }

  const removeItemCart = (produtoId: number) => {
    setCart((prev) => prev.filter((i) => i.produto.id !== produtoId))
  }

  const total = useMemo(
    () => cart.reduce((acc, i) => acc + toNumber(i.produto.preco) * i.quant, 0),
    [cart]
  )

  const saldo = toNumber(alunoSelecionado?.saldo ?? 0)
  const saldoInsuficiente = total > saldo

  // ── Confirmar venda (1 POST por item do carrinho) ────────
  const mutation = useMutation({
    mutationFn: async () => {
      if (!alunoSelecionado) throw new Error("Nenhum aluno selecionado")
      for (const item of cart) {
        await createVenda({
          alunoId: alunoSelecionado.id,
          produtoId: item.produto.id,
          quant: item.quant,
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alunos"] })
      qc.invalidateQueries({ queryKey: ["produtos"] })
      setVendaOk(true)
      setCart([])
      setTimeout(() => {
        setVendaOk(false)
        setAlunoSelecionado(null)
        router.push("/")
      }, 2000)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // ── Tela de sucesso ───────────────────────────────────────
  if (vendaOk) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-green-400">Venda registrada!</h2>
          <p className="text-muted-foreground mt-2">Redirecionando...</p>
        </div>
      </div>
    )
  }

  if (loadingAlunos || loadingProdutos) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground gap-2">
        <Loader2 size={18} className="animate-spin" /> Carregando...
      </div>
    )
  }

  // ── Sem aluno selecionado → mostrar seletor ───────────────
  if (!alunoSelecionado) {
    return <SeletorAluno alunos={alunos} onSelect={setAlunoSelecionado} />
  }

  // ── POS principal ─────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Produtos (esq) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setAlunoSelecionado(null)}
          >
            <ArrowLeft size={16} />
          </Button>
          <h2 className="font-semibold">Produtos</h2>
          <Badge variant="secondary">{produtos.length} itens</Badge>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {produtos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
              <PackageX size={40} />
              <p>Nenhum produto cadastrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {produtos.map((p) => (
                <ProdutoCard
                  key={p.id}
                  produto={p}
                  quantNoCarrinho={cart.find((i) => i.produto.id === p.id)?.quant ?? 0}
                  onAdd={() => addToCart(p)}
                  onRemove={() => removeFromCart(p.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Painel direito (aluno + carrinho) */}
      <div className="w-80 shrink-0 border-l border-border bg-card flex flex-col">
        {/* Aluno */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Aluno</p>
            <button
              onClick={() => setAlunoSelecionado(null)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              trocar
            </button>
          </div>
          <p className="font-bold text-lg leading-tight">{alunoSelecionado.nome}</p>
          <p className="text-sm text-muted-foreground">{alunoSelecionado.turma}</p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-xs text-muted-foreground">Saldo disponível</p>
            <p className={cn(
              "font-mono font-bold text-lg",
              saldo > 0 ? "text-green-400" : "text-destructive"
            )}>
              {formatCurrency(saldo)}
            </p>
          </div>
        </div>

        {/* Carrinho */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
            Carrinho
          </p>
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
              <ShoppingCart size={28} className="opacity-30" />
              <p className="text-sm">Adicione produtos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item.produto.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 h-5 w-5 rounded bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {item.quant}
                    </span>
                    <span className="truncate text-foreground">{item.produto.nome}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatCurrency(toNumber(item.produto.preco) * item.quant)}
                    </span>
                    <button
                      onClick={() => removeItemCart(item.produto.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total + Confirmar */}
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Total</span>
            <span className={cn(
              "font-mono font-bold text-2xl",
              saldoInsuficiente && cart.length > 0 ? "text-destructive" : "text-foreground"
            )}>
              {formatCurrency(total)}
            </span>
          </div>
          {saldoInsuficiente && cart.length > 0 && (
            <p className="text-xs text-destructive text-right">
              Saldo insuficiente (faltam {formatCurrency(total - saldo)})
            </p>
          )}
          <Button
            size="xl"
            className="w-full gap-2"
            onClick={() => mutation.mutate()}
            disabled={
              cart.length === 0 ||
              saldoInsuficiente ||
              mutation.isPending
            }
          >
            {mutation.isPending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <CheckCircle size={20} />
                Confirmar Venda
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function VendaPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center text-muted-foreground gap-2">
        <Loader2 size={18} className="animate-spin" /> Carregando...
      </div>
    }>
      <VendaContent />
    </Suspense>
  )
}
