import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const topic = searchParams.get("topic");

  if (!id || topic !== "payment") {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  try {
    const response = await axios.get(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });

    const payment = response.data;

    if (payment.status !== "approved") {
      return NextResponse.json({ error: "Pagamento não aprovado" }, { status: 400 });
    }

    const connection = await connectDB();
    await connection.execute(
      "INSERT INTO autopix_pendings (id, player) VALUES (?, ?)",
      [id, payment.external_reference]
    );
    await connection.end();

    return NextResponse.json({ success: "Pagamento registrado com sucesso!" }, { status: 201 });
  } catch (error) {
    console.error("Erro ao processar pagamento:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
