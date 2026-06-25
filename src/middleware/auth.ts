import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ erro: "Token nao fornecido" });
  }

  const [tipo, token] = authHeader.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ erro: "Token invalido" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ erro: "JWT_SECRET nao configurado" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as { userId: number };

    const user = await prisma.usuario.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return res.status(401).json({ erro: "Usuario nao encontrado" });
    }

    (req as any).user = user;
    next();
  } catch {
    return res.status(401).json({ erro: "Token invalido ou expirado" });
  }
}

export function requireRole(...rolesPermitidos: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ erro: "Nao autenticado" });
    }

    if (user.nivel === "ADMIN" || rolesPermitidos.includes(user.nivel)) {
      next();
      return;
    }

    return res.status(403).json({ erro: "Permissao negada" });
  };
}
