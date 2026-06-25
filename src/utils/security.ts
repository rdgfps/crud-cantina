import { prisma } from "../../lib/prisma";

export const senhaForteRegex = {
  maiuscula: /[A-Z]/,
  minuscula: /[a-z]/,
  numero: /[0-9]/,
  simbolo: /[^A-Za-z0-9]/,
};

export function gerarCodigoRecuperacao() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function mensagemUltimoLogin(ultimoLogin: Date | null) {
  if (!ultimoLogin) {
    return "Este e seu primeiro acesso";
  }

  return `Seu ultimo acesso foi em ${ultimoLogin.toLocaleString("pt-BR")}`;
}

export async function registrarLog(params: {
  usuarioId?: number | null;
  acao: string;
  descricao?: string;
  ip?: string;
}) {
  try {
    await prisma.log.create({
      data: {
        usuarioId: params.usuarioId ?? null,
        acao: params.acao,
        descricao: params.descricao,
        ip: params.ip,
      },
    });
  } catch {
    return;
  }
}
