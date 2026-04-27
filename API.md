# API Cantina Escolar — Documentação

Sistema de controle de contas de alunos para cantina escolar, com gestão de depósitos, vendas e saldo.

## 🚀 Tecnologias

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| Node.js | ^20 | Runtime JavaScript |
| Express | ^5 | Framework web |
| Prisma | 5.22.0 | ORM banco de dados |
| MySQL | - | Banco de dados |
| TypeScript | ^5 | Linguagem tipada |
| Zod | ^4 | Validação de dados |
| Nodemailer | ^8 | Envio de e-mails |

## 📁 Estrutura do Projeto

```
projeto-cantina/
├── src/
│   ├── server.ts          # Servidor principal
│   └── routes/
│       ├── alunos.ts      # CRUD Alunos
│       ├── produtos.ts    # CRUD Produtos
│       ├── depositos.ts   # Gestão Débitos
│       └── vendas.ts      # Gestão Vendas
├── lib/
│   ├── prisma.ts          # Instância Prisma
│   └── email.ts           # Envio de e-mails
├── prisma/
│   └── schema.prisma      # Schema banco
├── app/                   # Frontend Next.js
├── components/            # Componentes React
└── package.json
```

## 🏗️ Banco de Dados

### Modelos

#### Aluno
| Campo | Tipo | Descrição |
|-------|------|------------|
| id | Int | PK auto-incremento |
| nome | String(80) | Nome completo |
| turma | String(20) | Identificação turma |
| responsavel | String(80) | Nome responsável |
| email | String(100) | E-mail contato |
| obs | String(255)? | Observações |
| saldo | Decimal(9,2) | Saldo atual |

#### Produto
| Campo | Tipo | Descrição |
|-------|------|------------|
| id | Int | PK auto-incremento |
| nome | String(60) | Nome produto |
| quant | Int | Quantidade estoque |
| preco | Decimal(9,2) | Preço unitário |

#### Deposito
| Campo | Tipo | Descrição |
|-------|------|------------|
| id | Int | PK auto-incremento |
| alunoId | Int | FK Aluno |
| valor | Decimal(10,2) | Valor depósito |
| tipo | Enum | PIX, Cartao, Dinheiro |
| data | DateTime | Data/hora |

#### Venda
| Campo | Tipo | Descrição |
|-------|------|------------|
| id | Int | PK auto-incremento |
| alunoId | Int | FK Aluno |
| produtoId | Int | FK Produto |
| quant | Int | Qtd items |
| preco | Decimal(10,2) | Preço total |
| data | DateTime | Data/hora |

### Enum

```prisma
enum TipoDeposito {
  PIX
  Cartao
  Dinheiro
}
```

## 🔌 Endpoints da API

### Base URL
```
http://localhost:3001
```

### Alunos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/alunos` | Listar todos alunos |
| GET | `/alunos/:id` | Buscar aluno por ID |
| POST | `/alunos` | Criar novo aluno |
| PUT | `/alunos/:id` | Atualizar aluno |
| DELETE | `/alunos/:id` | Excluir aluno |

**Body POST/PUT:**
```json
{
  "nome": "João Silva",
  "turma": "3ºA",
  "responsavel": "Maria Silva",
  "email": "maria@email.com",
  "obs": "Aluno、例"
}
```

### Produtos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/produtos` | Listar todos produtos |
| GET | `/produtos/:id` | Buscar produto por ID |
| POST | `/produtos` | Criar novo produto |
| PUT | `/produtos/:id` | Atualizar produto |
| DELETE | `/produtos/:id` | Excluir produto |

**Body POST/PUT:**
```json
{
  "nome": "Sanduíche",
  "quant": 50,
  "preco": 10.00
}
```

### Depósitos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/depositos` | Listar todos depósitos |
| GET | `/depositos/:id` | Buscar depósito por ID |
| POST | `/depositos` | Realizar depósito |
| DELETE | `/depositos/:id` | Cancelar depósito |

**Body POST:**
```json
{
  "alunoId": 1,
  "valor": 100.00,
  "tipo": "PIX"
}
```

> **Nota:** O depósito cria registro E incrementa saldo do aluno em transação atômica.

### Vendas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/vendas` | Listar todas vendas |
| GET | `/vendas/:id` | Buscar venda por ID |
| POST | `/vendas` | Registrar venda |

**Body POST:**
```json
{
  "alunoId": 1,
  "produtoId": 1,
  "quant": 2
}
```

> **Validações automáticas:**
- Verifica saldo suficiente do aluno
- Verifica estoque disponível do produto
- Decrementa estoque após venda
- Decrementa saldo do aluno

## ⚙️ Configuração

### Variáveis de Ambiente

Criar arquivo `.env` na raiz:

```env
DATABASE_URL="mysql://usuario:senha@host:porta/bancodedados"
```

### Scripts npm

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Iniciar Next.js (frontend) |
| `npm run dev:api` | Iniciar API (backend) |
| `npm run build` | Build produção Next.js |
| `npx prisma generate` | Gerar Prisma Client |
| `npx prisma db push` | Sincronizar schema banco |

## 🔒 Validação de Dados

O projeto usa **Zod** para validação de schemas:

- Tipos definidos para cada modelo
- Mensagens de erro customizadas
- Validação em camada de rota

## 📧 E-mails

Módulo `lib/email.ts` envia notificações para responsáveis quando:
- Novo aluno cadastrado
- Depósito realizado
- Saldo baixo

## 📄 Licença

MIT