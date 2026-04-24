import { prisma } from "../../lib/prisma";
import { enviarEmail } from "../../lib/email";
import { Router } from "express";
import { z } from "zod";

const router = Router();

// Schema de validação com Zod
const alunoSchema = z.object({
  nome: z.string().min(1).max(80),
  turma: z.string().min(1).max(20),
  responsavel: z.string().min(1).max(80),
  email: z.string().email("E-mail inválido").max(100),
  obs: z.string().max(255).optional(),
});

// GET /alunos — lista todos
router.get("/", async (req, res) => {
  try {
    const alunos = await prisma.aluno.findMany();
    res.status(200).json(alunos);
  } catch (error) {
    res.status(500).json({ erro: "Erro no servidor" });
  }
});

// GET /alunos/:id — busca por id
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ erro: "ID inválido" });
    return;
  }

  try {
    const aluno = await prisma.aluno.findUnique({ where: { id } });
    if (!aluno) {
      res.status(404).json({ erro: "Aluno não encontrado" });
      return;
    }
    res.status(200).json(aluno);
  } catch (error) {
    res.status(500).json({ erro: "Erro no servidor" });
  }
});

// POST /alunos — cria novo aluno
router.post("/", async (req, res) => {
  const valida = alunoSchema.safeParse(req.body);
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.issues });
    return;
  }

  const { nome, turma, responsavel, email, obs } = valida.data;

  try {
    const aluno = await prisma.aluno.create({
      data: { nome, turma, responsavel, email, obs },
    });
    res.status(201).json(aluno);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao criar aluno" });
  }
});

// PUT /alunos/:id — atualiza aluno
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ erro: "ID inválido" });
    return;
  }

  const valida = alunoSchema.safeParse(req.body);
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.issues });
    return;
  }

  const { nome, turma, responsavel, email, obs } = valida.data;

  try {
    const aluno = await prisma.aluno.update({
      where: { id },
      data: { nome, turma, responsavel, email, obs },
    });
    res.status(200).json(aluno);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao atualizar aluno" });
  }
});

// DELETE /alunos/:id — remove aluno
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ erro: "ID inválido" });
    return;
  }

  try {
    const aluno = await prisma.aluno.delete({ where: { id } });
    res.status(200).json(aluno);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao excluir aluno" });
  }
});

// ----------------------------------------------------------------
// GET /alunos/:id/extrato
// Envia e-mail HTML ao responsável com todos os lançamentos do aluno
// ----------------------------------------------------------------
router.get("/:id/extrato", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ erro: "ID inválido" });
    return;
  }

  try {
    // Busca o aluno com todos os depósitos e vendas (include = JOIN)
    const aluno = await prisma.aluno.findUnique({
      where: { id },
      include: {
        depositos: { orderBy: { data: "asc" } },
        vendas: {
          include: { produto: true }, // traz o nome do produto junto
          orderBy: { data: "asc" },
        },
      },
    });

    if (!aluno) {
      res.status(404).json({ erro: "Aluno não encontrado" });
      return;
    }

    // Monta as linhas da tabela de depósitos
    const linhasDepositos = aluno.depositos
      .map(
        (d) => `
        <tr>
          <td>${d.data.toLocaleDateString("pt-BR")}</td>
          <td>Depósito (${d.tipo})</td>
          <td style="color:green">+ R$ ${Number(d.valor).toFixed(2)}</td>
        </tr>`
      )
      .join("");

    // Monta as linhas da tabela de vendas
    const linhasVendas = aluno.vendas
      .map(
        (v) => `
        <tr>
          <td>${v.data.toLocaleDateString("pt-BR")}</td>
          <td>Venda: ${v.produto.nome} (x${v.quant})</td>
          <td style="color:red">- R$ ${Number(v.preco).toFixed(2)}</td>
        </tr>`
      )
      .join("");

    // Template HTML do e-mail
    const html = `
      <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Extrato da Cantina Escolar</h2>
        <p><strong>Aluno:</strong> ${aluno.nome}</p>
        <p><strong>Turma:</strong> ${aluno.turma}</p>

        <h3>Lançamentos</h3>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; width:100%">
          <thead style="background:#f2f2f2">
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            ${linhasDepositos}
            ${linhasVendas}
          </tbody>
        </table>

        <h3 style="margin-top:20px">
          Saldo Atual: R$ ${Number(aluno.saldo).toFixed(2)}
        </h3>
      </body>
      </html>
    `;

    await enviarEmail({
      para: aluno.email,
      assunto: `Extrato Cantina — ${aluno.nome}`,
      html,
    });

    res.status(200).json({ mensagem: `E-mail enviado para ${aluno.email}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao enviar extrato" });
  }
});

export default router;
