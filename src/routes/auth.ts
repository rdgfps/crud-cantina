import { Router, Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma";
import { enviarEmail } from "../../lib/email";
import {
  gerarCodigoRecuperacao,
  mensagemUltimoLogin,
  registrarLog,
  senhaForteRegex,
} from "../utils/security";

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

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

const esqueciSenhaSchema = z.object({
  email: z.string().email(),
});

const redefinirSenhaSchema = z.object({
  email: z.string().email(),
  codigo: z.string().min(6).max(6),
  novaSenha: senhaForteSchema,
});

router.post("/login", async (req: Request, res: Response) => {
  const valida = loginSchema.safeParse(req.body);

  if (!valida.success) {
    return res.status(400).json({ erro: valida.error.issues });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ erro: "JWT_SECRET nao configurado" });
  }

  const { email, senha } = valida.data;

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario) {
      await registrarLog({
        acao: "login_invalido",
        descricao: `Tentativa com e-mail inexistente: ${email}`,
        ip: req.ip,
      });

      return res.status(401).json({ erro: "Credenciais invalidas" });
    }

    const senhaConfere = await bcrypt.compare(senha, usuario.senha);

    if (!senhaConfere) {
      await registrarLog({
        usuarioId: usuario.id,
        acao: "login_invalido",
        descricao: "Senha incorreta",
        ip: req.ip,
      });

      return res.status(401).json({ erro: "Credenciais invalidas" });
    }

    const ultimoLoginAnterior = usuario.ultimoLogin;
    const token = jwt.sign(
      { userId: usuario.id, nivel: usuario.nivel },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoLogin: new Date() },
    });

    await registrarLog({
      usuarioId: usuario.id,
      acao: "login_sucesso",
      descricao: "Login realizado com sucesso",
      ip: req.ip,
    });

    res.status(200).json({
      token,
      nome: usuario.nome,
      nivel: usuario.nivel,
      mensagem: mensagemUltimoLogin(ultimoLoginAnterior),
    });
  } catch {
    res.status(500).json({ erro: "Erro ao processar login" });
  }
});

router.post("/esqueci-senha", async (req: Request, res: Response) => {
  const valida = esqueciSenhaSchema.safeParse(req.body);

  if (!valida.success) {
    return res.status(400).json({ erro: valida.error.issues });
  }

  const { email } = valida.data;

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario) {
      await registrarLog({
        acao: "recuperacao_senha_usuario_inexistente",
        descricao: `Tentativa para e-mail inexistente: ${email}`,
        ip: req.ip,
      });

      return res.status(404).json({ erro: "Usuario nao encontrado" });
    }

    const codigo = gerarCodigoRecuperacao();
    const expiraEm = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        recoveryCode: codigo,
        recoveryExpiresAt: expiraEm,
      },
    });

    await enviarEmail({
      para: usuario.email,
      assunto: "Codigo de recuperacao de senha",
      html: `<p>Seu codigo de recuperacao e <strong>${codigo}</strong>.</p><p>Ele expira em 15 minutos.</p>`,
    });

    await registrarLog({
      usuarioId: usuario.id,
      acao: "recuperacao_senha_solicitada",
      descricao: "Codigo de recuperacao enviado por e-mail",
      ip: req.ip,
    });

    res.status(200).json({
      mensagem: "Codigo de recuperacao enviado por e-mail",
    });
  } catch {
    res.status(500).json({ erro: "Erro ao solicitar recuperacao de senha" });
  }
});

router.post("/redefinir-senha", async (req: Request, res: Response) => {
  const valida = redefinirSenhaSchema.safeParse(req.body);

  if (!valida.success) {
    return res.status(400).json({ erro: valida.error.issues });
  }

  const { email, codigo, novaSenha } = valida.data;

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario || !usuario.recoveryCode || !usuario.recoveryExpiresAt) {
      return res.status(400).json({ erro: "Codigo invalido ou expirado" });
    }

    const codigoExpirado = usuario.recoveryExpiresAt.getTime() < Date.now();

    if (usuario.recoveryCode !== codigo || codigoExpirado) {
      await registrarLog({
        usuarioId: usuario.id,
        acao: "redefinicao_senha_invalida",
        descricao: "Codigo invalido ou expirado",
        ip: req.ip,
      });

      return res.status(400).json({ erro: "Codigo invalido ou expirado" });
    }

    const senhaCriptografada = await bcrypt.hash(novaSenha, 10);

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        senha: senhaCriptografada,
        recoveryCode: null,
        recoveryExpiresAt: null,
      },
    });

    await registrarLog({
      usuarioId: usuario.id,
      acao: "senha_redefinida",
      descricao: "Senha redefinida com sucesso",
      ip: req.ip,
    });

    res.status(200).json({ mensagem: "Senha redefinida com sucesso" });
  } catch {
    res.status(500).json({ erro: "Erro ao redefinir senha" });
  }
});

export default router;
