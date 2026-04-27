"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Package, Plus, Loader2, PackageX } from "lucide-react"
import { getProdutos, createProduto } from "@/lib/api"
import { formatCurrency, toNumber, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function ProdutosPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ nome: "", preco: "", quant: "" })

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ["produtos"],
    queryFn: getProdutos,
  })

  const mutation = useMutation({
    mutationFn: () => {
      const preco = parseFloat(form.preco.replace(",", "."))
      const quant = parseInt(form.quant)
      if (!form.nome) throw new Error("Nome é obrigatório")
      if (!preco || preco <= 0) throw new Error("Preço inválido")
      if (!quant || quant < 0) throw new Error("Quantidade inválida")
      return createProduto({ nome: form.nome, preco, quant })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["produtos"] })
      setForm({ nome: "", preco: "", quant: "" })
      toast.success("Produto cadastrado!")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  const totalItens = produtos.reduce((acc, p) => acc + p.quant, 0)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gerencie o cardápio e o estoque da cantina
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus size={16} className="text-primary" />
              Novo Produto
            </CardTitle>
            <CardDescription>Adicione um item ao cardápio</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                mutation.mutate()
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label>Nome *</Label>
                <Input
                  placeholder="Ex: Suco de laranja"
                  value={form.nome}
                  onChange={set("nome")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Preço (R$) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    R$
                  </span>
                  <Input
                    className="pl-8"
                    placeholder="0,00"
                    value={form.preco}
                    onChange={set("preco")}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Quantidade em estoque *</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.quant}
                  onChange={set("quant")}
                />
              </div>
              <Button
                type="submit"
                className="w-full gap-2"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Plus size={16} />
                    Cadastrar Produto
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista de produtos */}
        <div className="lg:col-span-2 space-y-4">
          {/* Resumo */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold font-mono">{produtos.length}</p>
                  <p className="text-xs text-muted-foreground">Produtos</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Package size={16} className="text-green-400" />
                </div>
                <div>
                  <p className="text-xl font-bold font-mono">{totalItens}</p>
                  <p className="text-xs text-muted-foreground">Itens em estoque</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cardápio</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                  <Loader2 size={16} className="animate-spin" /> Carregando...
                </div>
              ) : produtos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <PackageX size={36} className="opacity-30" />
                  <p>Nenhum produto cadastrado</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {/* Header */}
                  <div className="grid grid-cols-12 px-5 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <span className="col-span-5">Produto</span>
                    <span className="col-span-3 text-right">Preço</span>
                    <span className="col-span-4 text-right">Estoque</span>
                  </div>
                  {produtos.map((produto) => {
                    const semEstoque = produto.quant === 0
                    const estoqueB = produto.quant <= 5 && produto.quant > 0
                    return (
                      <div
                        key={produto.id}
                        className={cn(
                          "grid grid-cols-12 px-5 py-3.5 items-center hover:bg-secondary/30 transition-colors",
                          semEstoque && "opacity-50"
                        )}
                      >
                        <div className="col-span-5">
                          <p className="font-medium text-sm">{produto.nome}</p>
                          <p className="text-xs text-muted-foreground">#{produto.id}</p>
                        </div>
                        <div className="col-span-3 text-right">
                          <span className="font-mono font-bold text-primary text-sm">
                            {formatCurrency(produto.preco)}
                          </span>
                        </div>
                        <div className="col-span-4 text-right">
                          <Badge
                            variant={
                              semEstoque
                                ? "destructive"
                                : estoqueB
                                ? "warning"
                                : "success"
                            }
                          >
                            {semEstoque ? "Esgotado" : `${produto.quant} un`}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
