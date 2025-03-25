import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';
import axios from 'axios';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID do pagamento não encontrado' });
    }

    const response = await axios.get(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });

    const payment = response.data;

    if (payment.status !== 'approved') {
      return res.status(400).json({ error: 'Pagamento não aprovado' });
    }

    const connection = await connectDB();

    await connection.execute(
      'UPDATE players SET creditos = creditos + ? WHERE pix_code = ?',
      [payment.transaction_amount, payment.external_reference]
    );

    await connection.end();

    return res.status(200).json({ success: 'Pagamento confirmado e processado!' });
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
