export interface Aluno {
  id: number
  nome: string
  turma: string
  responsavel: string
  email: string
  obs?: string | null
  saldo: string | number
}

export interface Produto {
  id: number
  nome: string
  quant: number
  preco: string | number
}

export interface Deposito {
  id: number
  alunoId: number
  valor: string | number
  tipo: "PIX" | "Cartao" | "Dinheiro"
  data: string
}

export interface Venda {
  id: number
  alunoId: number
  produtoId: number
  quant: number
  preco: string | number
  data: string
}

export interface CartItem {
  produto: Produto
  quant: number
}
