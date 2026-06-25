import { Router, Request, Response } from "express";
import { Role } from "@prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { registrarLog, senhaForteRegex } from "../utils/security";

const router = Router();

const senhaForteSchema = z
  .string()
  .min(8, "Senha deve ter no minimo 8 caracteres")
  .max(255)
  .refine((senha) => senhaForteRegex.maiuscula.test(senha), {
    message: "Senha deve conter letra maiuscula",
  })
  .refine((senha) => senhaForteRegex.minuscula.test(senha), {
    message: "Senha deve conter letra minuscula",
  })
  .refine((senha) => senhaForteRegex.numero.test(senha), {
    message: "Senha deve conter numero",
  })
  .refine((senha) => senhaForteRegex.simbolo.test(senha), {
    message: "Senha deve conter simbolo",
  });

const cadastroSchema = z.object({
  nome: z.string().min(1).max(80),
  email: z.string().email("E-mail invalido").max(100),
  senha: senhaForteSchema,
  nivel: z.nativeEnum(Role).optional(),
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nome: true,
        email: true,
        nivel: true,
        ultimoLogin: true,
        createdAt: true,
      },
    });

    res.status(200).json(usuarios);
  } catch {
    res.status(500).json({ erro: "Erro no servidor" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const valida = cadastroSchema.safeParse(req.body);

  if (!valida.success) {
    return res.status(400).json({ erro: valida.error.issues });
  }

  const { nome, email, senha, nivel } = valida.data;

  try {
    const existente = await prisma.usuario.findUnique({ where: { email } });

    if (existente) {
      return res.status(409).json({ erro: "E-mail ja cadastrado" });
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: senhaCriptografada,
        nivel: nivel ?? "OPERADOR",
      },
    });

    await registrarLog({
      usuarioId: usuario.id,
      acao: "cadastro_usuario",
      descricao: `Usuario ${usuario.email} cadastrado`,
      ip: req.ip,
    });

    res.status(201).json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      nivel: usuario.nivel,
      ultimoLogin: usuario.ultimoLogin,
      createdAt: usuario.createdAt,
    });
  } catch {
    res.status(500).json({ erro: "Erro ao criar usuario" });
  }
});

export default router;
