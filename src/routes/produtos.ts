import { prisma } from "../../lib/prisma";
import { Router } from "express";
import { authMiddleware, requireRole } from "../middleware/auth";
import { registrarLog } from "../utils/security";
import { z } from "zod";

const router = Router();

const produtoSchema = z.object({
  nome: z.string().min(1).max(80),
  quant: z.number().int().min(0, "Quantidade nao pode ser negativa"),
  preco: z.number().positive("Preco deve ser positivo"),
});

router.get("/", async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany({
      where: { deleted: false },
      orderBy: { nome: "asc" },
    });

    res.status(200).json(produtos);
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
    const produto = await prisma.produto.findFirst({
      where: { id, deleted: false },
    });

    if (!produto) {
      res.status(404).json({ erro: "Produto nao encontrado" });
      return;
    }

    res.status(200).json(produto);
  } catch {
    res.status(500).json({ erro: "Erro no servidor" });
  }
});

router.post("/", async (req, res) => {
  const valida = produtoSchema.safeParse(req.body);

  if (!valida.success) {
    res.status(400).json({ erro: valida.error.issues });
    return;
  }

  const { nome, quant, preco } = valida.data;

  try {
    const produto = await prisma.produto.create({
      data: { nome, quant, preco },
    });

    res.status(201).json(produto);
  } catch {
    res.status(500).json({ erro: "Erro ao criar produto" });
  }
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    res.status(400).json({ erro: "ID invalido" });
    return;
  }

  const valida = produtoSchema.safeParse(req.body);

  if (!valida.success) {
    res.status(400).json({ erro: valida.error.issues });
    return;
  }

  const { nome, quant, preco } = valida.data;

  try {
    const produto = await prisma.produto.update({
      where: { id },
      data: { nome, quant, preco },
    });

    res.status(200).json(produto);
  } catch {
    res.status(500).json({ erro: "Erro ao atualizar produto" });
  }
});

router.delete("/:id", authMiddleware, requireRole("ADMIN"), async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    res.status(400).json({ erro: "ID invalido" });
    return;
  }

  try {
    const produto = await prisma.produto.update({
      where: { id },
      data: { deleted: true, deletedAt: new Date() },
    });

    await registrarLog({
      usuarioId: (req as any).user.id,
      acao: "exclusao_produto",
      descricao: `Produto ${produto.nome} marcado como deletado`,
      ip: req.ip,
    });

    res.status(200).json(produto);
  } catch {
    res.status(500).json({ erro: "Erro ao excluir produto" });
  }
});

export default router;
