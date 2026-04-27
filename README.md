# Cantina Escolar — Frontend

Sistema de gerenciamento de contas de alunos para cantina escolar.

## Stack

- **Next.js 15** (App Router)
- **React 19** + TypeScript
- **TanStack Query v5** — fetching, cache e refetch automático
- **Tailwind CSS** + CSS variables (tema dark amber)
- **Sonner** — toasts
- **Lucide React** — ícones

## Setup

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variável de ambiente

Crie o arquivo `.env.local` com:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Iniciar o frontend

```bash
npm run dev
```

Abra [http://localhost:3001](http://localhost:3001) (ou a porta que o Next.js escolher).

> O backend deve estar rodando em `http://localhost:3000` antes de iniciar o frontend.

## Páginas

| Rota | Descrição |
|------|-----------|
| `/` | Dashboard — lista de alunos com saldo |
| `/venda` | POS de venda rápida |
| `/venda?alunoId=X` | Venda com aluno pré-selecionado |
| `/deposito` | Registrar depósito |
| `/deposito?alunoId=X` | Depósito com aluno pré-selecionado |
| `/produtos` | Cadastro e listagem de produtos |

## Estrutura

```
cantina-front/
├── app/
│   ├── page.tsx           # Dashboard
│   ├── venda/page.tsx     # POS de vendas
│   ├── deposito/page.tsx  # Depósitos
│   └── produtos/page.tsx  # Produtos
├── components/
│   ├── nav.tsx            # Sidebar de navegação
│   ├── providers.tsx      # QueryClient + Toaster
│   └── ui/                # Componentes base (Button, Card, Input...)
├── lib/
│   ├── api.ts             # Funções de chamada à API REST
│   ├── types.ts           # Interfaces TypeScript
│   └── utils.ts           # cn(), formatCurrency(), toNumber()
```
