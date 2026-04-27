import { prisma } from "../../lib/prisma";
import { enviarEmail } from "../../lib/email";
import { Router, Request, Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const router = Router();

//  Tipo completo com includes (TOP)
type AlunoComExtrato = Prisma.AlunoGetPayload<{
  include: {
    depositos: true;
    vendas: {
      include: { produto: true };
    };
  };
}>;

// Schema de validação
const alunoSchema = z.object({
  nome: z.string().min(1).max(80),
  turma: z.string().min(1).max(20),
  responsavel: z.string().min(1).max(80),
  email: z.string().email("E-mail inválido").max(100),
  obs: z.string().max(255).optional(),
});

// GET /alunos
router.get("/", async (req: Request, res: Response) => {
  try {
    const alunos = await prisma.aluno.findMany();
    res.status(200).json(alunos);
  } catch {
    res.status(500).json({ erro: "Erro no servidor" });
  }
});

// GET /alunos/:id
router.get("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ erro: "ID inválido" });
  }

  try {
    const aluno = await prisma.aluno.findUnique({ where: { id } });

    if (!aluno) {
      return res.status(404).json({ erro: "Aluno não encontrado" });
    }

    res.status(200).json(aluno);
  } catch {
    res.status(500).json({ erro: "Erro no servidor" });
  }
});

// POST /alunos
router.post("/", async (req: Request, res: Response) => {
  const valida = alunoSchema.safeParse(req.body);

  if (!valida.success) {
    return res.status(400).json({ erro: valida.error.issues });
  }

  try {
    const aluno = await prisma.aluno.create({
      data: valida.data,
    });

    res.status(201).json(aluno);
  } catch {
    res.status(500).json({ erro: "Erro ao criar aluno" });
  }
});

// PUT /alunos/:id
router.put("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ erro: "ID inválido" });
  }

  const valida = alunoSchema.safeParse(req.body);

  if (!valida.success) {
    return res.status(400).json({ erro: valida.error.issues });
  }

  try {
    const aluno = await prisma.aluno.update({
      where: { id },
      data: valida.data,
    });

    res.status(200).json(aluno);
  } catch {
    res.status(500).json({ erro: "Erro ao atualizar aluno" });
  }
});

// DELETE /alunos/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ erro: "ID inválido" });
  }

  try {
    const aluno = await prisma.aluno.delete({ where: { id } });
    res.status(200).json(aluno);
  } catch {
    res.status(500).json({ erro: "Erro ao excluir aluno" });
  }
});

//  GET /alunos/:id/extrato
router.get("/:id/extrato", async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ erro: "ID inválido" });
  }

  try {
    const aluno = (await prisma.aluno.findUnique({
      where: { id },
      include: {
        depositos: { orderBy: { data: "asc" } },
        vendas: {
          include: { produto: true },
          orderBy: { data: "asc" },
        },
      },
    })) as AlunoComExtrato;

    if (!aluno) {
      return res.status(404).json({ erro: "Aluno não encontrado" });
    }

    // 🔹 Depósitos
    const linhasDepositos = aluno.depositos
      .map(
        (d: any) => `
        <tr>
          <td>${d.data.toLocaleDateString("pt-BR")}</td>
          <td>Depósito (${d.tipo})</td>
          <td style="color:green">+ R$ ${Number(d.valor).toFixed(2)}</td>
        </tr>`
      )
      .join("");

    // 🔹 Vendas
    const linhasVendas = aluno.vendas
      .map(
        (v: any) => `
        <tr>
          <td>${v.data.toLocaleDateString("pt-BR")}</td>
          <td>Venda: ${v.produto.nome} (x${v.quant})</td>
          <td style="color:red">- R$ ${Number(v.preco).toFixed(2)}</td>
        </tr>`
      )
      .join("");

    // 📄 HTML
    const html = `
      <html>
      <body style="font-family: Arial; padding: 20px;">
        <h2>Extrato da Cantina Escolar</h2>
        <p><strong>Aluno:</strong> ${aluno.nome}</p>
        <p><strong>Turma:</strong> ${aluno.turma}</p>

        <table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse:collapse;">
          <thead>
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

        <h3>Saldo: R$ ${Number(aluno.saldo).toFixed(2)}</h3>
      </body>
      </html>
    `;

    await enviarEmail({
      para: aluno.email,
      assunto: `Extrato — ${aluno.nome}`,
      html,
    });

    res.status(200).json({ mensagem: "E-mail enviado com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao enviar extrato" });
  }
});

export default router;