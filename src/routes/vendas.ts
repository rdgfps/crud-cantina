import { prisma } from "../../lib/prisma";
import { Router } from "express";
import { authMiddleware, requireRole } from "../middleware/auth";
import { registrarLog } from "../utils/security";
import { z } from "zod";

const router = Router();

const vendaSchema = z.object({
  alunoId: z.number().int().positive(),
  produtoId: z.number().int().positive(),
  quant: z.number().int().positive("Quantidade deve ser pelo menos 1"),
});

router.get("/", async (req, res) => {
  try {
    const vendas = await prisma.venda.findMany({
      include: {
        aluno: { select: { nome: true } },
        produto: { select: { nome: true } },
        usuario: { select: { nome: true, email: true, nivel: true } },
      },
      orderBy: { data: "desc" },
    });

    res.status(200).json(vendas);
  } catch {
    res.status(500).json({ erro: "Erro no servidor" });
  }
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    res.status(400).json({ erro: "ID invalido" });
    return;
  }

  try {
    const venda = await prisma.venda.findUnique({
      where: { id },
      include: {
        aluno: { select: { nome: true } },
        produto: { select: { nome: true } },
        usuario: { select: { nome: true, email: true, nivel: true } },
      },
    });

    if (!venda) {
      res.status(404).json({ erro: "Venda nao encontrada" });
      return;
    }

    res.status(200).json(venda);
  } catch {
    res.status(500).json({ erro: "Erro no servidor" });
  }
});

router.post("/", authMiddleware, requireRole("GERENTE"), async (req, res) => {
  const valida = vendaSchema.safeParse(req.body);

  if (!valida.success) {
    res.status(400).json({ erro: valida.error.issues });
    return;
  }

  const { alunoId, produtoId, quant } = valida.data;
  const usuarioId = (req as any).user.id;

  try {
    const [aluno, produto] = await Promise.all([
      prisma.aluno.findUnique({ where: { id: alunoId } }),
      prisma.produto.findFirst({ where: { id: produtoId, deleted: false } }),
    ]);

    if (!aluno) {
      res.status(404).json({ erro: "Aluno nao encontrado" });
      return;
    }

    if (!produto) {
      res.status(404).json({ erro: "Produto nao encontrado" });
      return;
    }

    const totalVenda = produto.preco.toNumber() * quant;

    if (produto.quant < quant) {
      res.status(400).json({
        erro: `Estoque insuficiente. Disponivel: ${produto.quant}`,
      });
      return;
    }

    if (aluno.saldo.toNumber() < totalVenda) {
      res.status(400).json({
        erro: `Saldo insuficiente. Saldo atual: R$ ${aluno.saldo.toFixed(
          2
        )}, Total: R$ ${totalVenda.toFixed(2)}`,
      });
      return;
    }

    const [venda, ,] = await prisma.$transaction([
      prisma.venda.create({
        data: { alunoId, produtoId, usuarioId, quant, preco: totalVenda },
      }),
      prisma.aluno.update({
        where: { id: alunoId },
        data: { saldo: { decrement: totalVenda } },
      }),
      prisma.produto.update({
        where: { id: produtoId },
        data: { quant: { decrement: quant } },
      }),
    ]);

    await registrarLog({
      usuarioId,
      acao: "venda_criada",
      descricao: `Venda criada para aluno ${alunoId}, produto ${produtoId}, quantidade ${quant}`,
      ip: req.ip,
    });

    res.status(201).json({ venda, totalCobrado: totalVenda });
  } catch {
    res.status(500).json({ erro: "Erro ao registrar venda" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    res.status(400).json({ erro: "ID invalido" });
    return;
  }

  try {
    const venda = await prisma.venda.delete({ where: { id } });
    res.status(200).json(venda);
  } catch {
    res.status(500).json({ erro: "Erro ao excluir venda" });
  }
});

export default router;
