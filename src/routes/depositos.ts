import { prisma } from "../../lib/prisma";
import { Router } from "express";
import { authMiddleware, requireRole } from "../middleware/auth";
import { registrarLog } from "../utils/security";
import { z } from "zod";

const router = Router();

const depositoSchema = z.object({
  alunoId: z.number().int().positive(),
  valor: z.number().positive("Valor deve ser positivo"),
  tipo: z.enum(["PIX", "Cartao", "Dinheiro"]),
});

router.get("/", async (req, res) => {
  try {
    const depositos = await prisma.deposito.findMany({
      include: {
        aluno: { select: { nome: true } },
        usuario: { select: { nome: true, email: true, nivel: true } },
      },
      orderBy: { data: "desc" },
    });

    res.status(200).json(depositos);
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
    const deposito = await prisma.deposito.findUnique({
      where: { id },
      include: {
        aluno: { select: { nome: true } },
        usuario: { select: { nome: true, email: true, nivel: true } },
      },
    });

    if (!deposito) {
      res.status(404).json({ erro: "Deposito nao encontrado" });
      return;
    }

    res.status(200).json(deposito);
  } catch {
    res.status(500).json({ erro: "Erro no servidor" });
  }
});

router.post("/", authMiddleware, requireRole("GERENTE"), async (req, res) => {
  const valida = depositoSchema.safeParse(req.body);

  if (!valida.success) {
    res.status(400).json({ erro: valida.error.issues });
    return;
  }

  const { alunoId, valor, tipo } = valida.data;
  const usuarioId = (req as any).user.id;

  try {
    const [deposito, aluno] = await prisma.$transaction([
      prisma.deposito.create({
        data: { alunoId, usuarioId, valor, tipo },
      }),
      prisma.aluno.update({
        where: { id: alunoId },
        data: { saldo: { increment: valor } },
      }),
    ]);

    await registrarLog({
      usuarioId,
      acao: "deposito_criado",
      descricao: `Deposito de R$ ${valor.toFixed(2)} criado para aluno ${alunoId}`,
      ip: req.ip,
    });

    res.status(201).json({ deposito, saldoAtual: aluno.saldo });
  } catch {
    res.status(500).json({ erro: "Erro ao realizar deposito" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    res.status(400).json({ erro: "ID invalido" });
    return;
  }

  try {
    const deposito = await prisma.deposito.delete({ where: { id } });
    res.status(200).json(deposito);
  } catch {
    res.status(500).json({ erro: "Erro ao excluir deposito" });
  }
});

export default router;
