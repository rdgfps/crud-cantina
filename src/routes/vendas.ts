import { prisma } from "../../lib/prisma";
import { Router } from "express";
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
      },
    });
    res.status(200).json(vendas);
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
    const venda = await prisma.venda.findUnique({
      where: { id },
      include: {
        aluno: { select: { nome: true } },
        produto: { select: { nome: true } },
      },
    });
    if (!venda) {
      res.status(404).json({ erro: "Venda não encontrada" });
      return;
    }
    res.status(200).json(venda);
  } catch (error) {
    res.status(500).json({ erro: "Erro no servidor" });
  }
});

// POST /vendas — registra venda com TRANSAÇÃO
// Valida saldo e estoque ANTES de gravar
router.post("/", async (req, res) => {
  const valida = vendaSchema.safeParse(req.body);
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.issues });
    return;
  }

  const { alunoId, produtoId, quant } = valida.data;

  try {
    // Busca aluno e produto em paralelo para verificar saldo e estoque
    const [aluno, produto] = await Promise.all([
      prisma.aluno.findUnique({ where: { id: alunoId } }),
      prisma.produto.findUnique({ where: { id: produtoId } }),
    ]);

    if (!aluno) {
      res.status(404).json({ erro: "Aluno não encontrado" });
      return;
    }
    if (!produto) {
      res.status(404).json({ erro: "Produto não encontrado" });
      return;
    }

    // Calcula o total da venda (quant * preço do produto)
    const totalVenda = produto.preco.toNumber() * quant;

    // Verifica se há estoque suficiente
    if (produto.quant < quant) {
      res.status(400).json({
        erro: `Estoque insuficiente. Disponível: ${produto.quant}`,
      });
      return;
    }

    // Verifica se o aluno tem saldo suficiente
    if (aluno.saldo.toNumber() < totalVenda) {
      res.status(400).json({
        erro: `Saldo insuficiente. Saldo atual: R$ ${aluno.saldo.toFixed(2)}, Total: R$ ${totalVenda.toFixed(2)}`,
      });
      return;
    }

    // Tudo certo — executa as 3 operações em uma única transação atômica:
    // 1) Cria a venda  2) Debita o saldo do aluno  3) Reduz o estoque
    const [venda, , ] = await prisma.$transaction([
      prisma.venda.create({
        data: { alunoId, produtoId, quant, preco: totalVenda },
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

    res.status(201).json({ venda, totalCobrado: totalVenda });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao registrar venda" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ erro: "ID inválido" });
    return;
  }

  try {
    const venda = await prisma.venda.delete({ where: { id } });
    res.status(200).json(venda);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao excluir venda" });
  }
});

export default router;
