import type { Aluno, Produto } from "./types"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.erro || `Erro ${res.status}`)
  }

  return res.json()
}

// ── Alunos ──────────────────────────────────────────────────
export const getAlunos = () => request<Aluno[]>("/alunos")

export const getAluno = (id: number) => request<Aluno>(`/alunos/${id}`)

export const createAluno = (data: Omit<Aluno, "id" | "saldo">) =>
  request<Aluno>("/alunos", { method: "POST", body: JSON.stringify(data) })

export const updateAluno = (id: number, data: Omit<Aluno, "id" | "saldo">) =>
  request<Aluno>(`/alunos/${id}`, { method: "PUT", body: JSON.stringify(data) })

export const deleteAluno = (id: number) =>
  request<Aluno>(`/alunos/${id}`, { method: "DELETE" })

// ── Produtos ─────────────────────────────────────────────────
export const getProdutos = () => request<Produto[]>("/produtos")

export const createProduto = (data: Omit<Produto, "id">) =>
  request<Produto>("/produtos", { method: "POST", body: JSON.stringify(data) })

// ── Depósitos ────────────────────────────────────────────────
export const createDeposito = (data: {
  alunoId: number
  valor: number
  tipo: "PIX" | "Cartao" | "Dinheiro"
}) => request("/depositos", { method: "POST", body: JSON.stringify(data) })

// ── Vendas ───────────────────────────────────────────────────
export const createVenda = (data: {
  alunoId: number
  produtoId: number
  quant: number
}) => request("/vendas", { method: "POST", body: JSON.stringify(data) })
