import { prisma } from "../../lib/prisma";
import { Router } from "express";
import { z } from "zod";

const router = Router();

const depositoSchema = z.object({
  alunoId: z.number().int().positive(),
  valor: z.number().positive("Valor deve ser positivo"),
  // aceita as três formas do enum TipoDeposito
  tipo: z.enum(["PIX", "Cartao", "Dinheiro"]),
});

router.get("/", async (req, res) => {
  try {
    const depositos = await prisma.deposito.findMany({
      include: { aluno: { select: { nome: true } } },
    });
    res.status(200).json(depositos);
  } catch (error) {
    res.status(500).json({ erro: "Erro no servidor" });
  }
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ erro: "ID inválido" });
    return;
  }

  try {
    const deposito = await prisma.deposito.findUnique({
      where: { id },
      include: { aluno: { select: { nome: true } } },
    });
    if (!deposito) {
      res.status(404).json({ erro: "Depósito não encontrado" });
      return;
    }
    res.status(200).json(deposito);
  } catch (error) {
    res.status(500).json({ erro: "Erro no servidor" });
  }
});

// POST /depositos — registra depósito e aumenta saldo do aluno (TRANSAÇÃO)
router.post("/", async (req, res) => {
  const valida = depositoSchema.safeParse(req.body);
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.issues });
    return;
  }

  const { alunoId, valor, tipo } = valida.data;

  try {
    // prisma.$transaction garante que as duas operações ocorram juntas:
    // se uma falhar, a outra é desfeita automaticamente (rollback)
    const [deposito, aluno] = await prisma.$transaction([
      // 1) Cria o registro do depósito
      prisma.deposito.create({
        data: { alunoId, valor, tipo },
      }),
      // 2) Incrementa o saldo do aluno
      prisma.aluno.update({
        where: { id: alunoId },
        data: { saldo: { increment: valor } },
      }),
    ]);

    res.status(201).json({ deposito, saldoAtual: aluno.saldo });
  } catch (error) {
    res.status(500).json({ erro: "Erro ao realizar depósito" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ erro: "ID inválido" });
    return;
  }

  try {
    const deposito = await prisma.deposito.delete({ where: { id } });
    res.status(200).json(deposito);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao excluir depósito" });
  }
});

export default router;
