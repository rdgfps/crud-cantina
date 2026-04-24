import nodemailer from "nodemailer";
import "dotenv/config";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface EnviarEmailParams {
  para: string;
  assunto: string;
  html: string;
}

export async function enviarEmail({ para, assunto, html }: EnviarEmailParams) {
  await transporter.sendMail({
    from: `"Cantina Escolar" <${process.env.EMAIL_USER}>`,
    to: para,
    subject: assunto,
    html,
  });
}
