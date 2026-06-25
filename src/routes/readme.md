# Sistema de Cantina Escolar

Backend para controle de alunos, produtos, vendas, depositos, usuarios e logs da cantina.

## Rotas principais

- `/alunos`
- `/produtos`
- `/depositos`
- `/vendas`
- `/usuarios`
- `/login`
- `/esqueci-senha`
- `/redefinir-senha`

## Seguranca

- Senhas criptografadas com bcrypt.
- Login com JWT.
- Middleware de autenticacao por token.
- Controle de acesso por nivel: `ADMIN`, `GERENTE` e `OPERADOR`.
- Logs de cadastro, login, vendas, depositos e exclusao de produto.
- Recuperacao de senha por codigo enviado por e-mail.
- Soft delete em produtos.

## Testes

A pasta `bruno` contem exemplos para testar cadastro, login, recuperacao de senha, rotas protegidas e permissao de exclusao.
