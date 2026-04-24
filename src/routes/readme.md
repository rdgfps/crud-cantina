# 🍽️ Sistema de Cantina Escolar

Sistema backend para gerenciamento de cantina escolar, com controle de saldo por aluno, registro de depósitos, vendas e envio automático de extrato por e-mail.

---

## 🚀 Funcionalidades atuais

### 👤 Alunos

* Cadastro de alunos
* Consulta individual e listagem
* Atualização e remoção
* Controle de saldo individual

### 💰 Depósitos

* Registro de depósitos (PIX, Cartão, Dinheiro)
* Atualização automática do saldo do aluno
* Uso de transações para garantir consistência

### 🛒 Vendas

* Registro de vendas vinculadas ao aluno e produto
* Validação de:

  * saldo suficiente
  * estoque disponível
* Atualização automática de:

  * saldo do aluno
  * estoque do produto
* Uso de transações (atomicidade)

### 📦 Produtos

* Cadastro de produtos
* Controle de estoque
* Atualização e remoção

### 📧 Extrato por e-mail

* Geração de extrato completo (depósitos + vendas)
* Envio automático para o responsável
* Template HTML com histórico e saldo atual

---

## 🧱 Tecnologias utilizadas

* Node.js
* Express
* Prisma ORM
* MySQL
* Zod (validação)
* Nodemailer (envio de e-mails)
* Mailtrap (ambiente de testes de e-mail)

---

## 🧪 Testes

As rotas podem ser testadas utilizando ferramentas como:

* Bruno
* Postman
* Insomnia

---

## ⚠️ Status do projeto

🚧 Em desenvolvimento — ainda não pronto para produção.

---

## 🔥 Próximos passos (essenciais)

### 🔐 Autenticação e segurança

* [ ] Implementar autenticação (JWT)
* [ ] Criptografia de senha (bcrypt)
* [ ] Middleware de autorização (roles: admin/funcionário)
* [ ] Proteção de rotas sensíveis

---

### 🖥️ Front-end (obrigatório para uso real)

* [ ] Interface para funcionários (caixa da cantina)
* [ ] Tela de vendas rápida
* [ ] Cadastro de alunos e produtos
* [ ] Dashboard simples

---

### 💳 Integração com pagamentos (PIX)

* [ ] Integração com gateway de pagamento
* [ ] Geração de QR Code PIX
* [ ] Implementação de webhook para confirmação
* [ ] Registro automático de depósitos via pagamento

---

### 👥 Gestão de usuários

* [ ] Sistema de login
* [ ] Perfis de acesso (admin, operador)
* [ ] Associação responsável ↔ aluno

---

### 📊 Relatórios

* [ ] Vendas por período
* [ ] Produtos mais vendidos
* [ ] Controle financeiro geral

---

### 🛡️ Melhorias de segurança

* [ ] Rate limiting
* [ ] Headers de segurança (Helmet)
* [ ] Validação de origem (CORS)
* [ ] Logs estruturados

---

### ⚙️ Infraestrutura

* [ ] Deploy em ambiente online
* [ ] Configuração de variáveis de ambiente
* [ ] Backup de banco de dados
* [ ] Monitoramento de erros

---

## 💡 Objetivo

Transformar este projeto em um sistema completo de gestão de cantina escolar, substituindo métodos manuais (como fichas físicas) por um controle digital eficiente, seguro e transparente para a escola e responsáveis.

---

## 📌 Observações

Este projeto começou como estudo de backend e está evoluindo para um produto real com potencial de uso comercial.

---

## 👨‍💻 Autor

Desenvolvido por Henrique Rodeghiero
