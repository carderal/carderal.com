import { NextApiRequest, NextApiResponse } from "next";
import mysql from "mysql2/promise";
import axios from "axios";

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;
const DB_NAME = process.env.DB_NAME;

async function connectDB() {
  return mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    // Extrai `id` e `topic` corretamente do `req.body`
    const { id, topic } = req.body;

    if (!id || topic?.trim() !== "payment") {
      return res.status(400).json({ error: "Parâmetros inválidos" });
    }

    // Busca detalhes do pagamento no Mercado Pago
    const { data: payment } = await axios.get(
      `https://api.mercadopago.com/v1/payments/${id}`,
      {
        headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
      }
    );

    if (!payment) {
      console.error("❌ Erro: Resposta vazia do Mercado Pago");
      return res.status(500).json({ error: "Erro ao buscar pagamento" });
    }

    console.log("✅ Pagamento encontrado:", payment);

    if (payment.status !== "approved") {
      console.warn("⚠️ Pagamento não aprovado:", payment.status);
      return res.status(400).json({ error: "Pagamento não aprovado" });
    }

    // Conexão com o banco de dados
    const connection = await connectDB();

    try {
      await connection.execute(
        "INSERT INTO autopix_pendings (id, player) VALUES (?, ?)",
        [id, payment.external_reference]
      );
    } finally {
      await connection.end(); // Fecha a conexão corretamente
    }

    console.log("✅ Pagamento registrado no banco:", id);

    return res.status(201).json({ success: "Pagamento registrado com sucesso!" });
  } catch (error: any) {
    console.error("❌ Erro ao processar webhook:", error.response?.data || error.message);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
