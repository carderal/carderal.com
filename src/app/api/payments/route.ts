import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    const { id, topic } = await request.json();

    if (!id || !topic || topic !== 'payment') {
      return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 });
    }

    const host = process.env.DB_HOST;
    const user = process.env.DB_USER;
    const password = process.env.DB_PASS;
    const db = process.env.DB_NAME;
    const access_token = process.env.MP_ACCESS_TOKEN;

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const payment = await response.json();

    if (payment.status === 'approved') {
      const connection = mysql.createConnection({
        host,
        user,
        password,
        database: db,
      });

      const player = payment.external_reference;
      const insertSql = `INSERT INTO autopix_pendings (id, player) VALUES (?, ?)`;

      connection.execute(insertSql, [id, player], (err, results) => {
        if (err) {
          return NextResponse.json({ error: 'Erro na Database' }, { status: 500 });
        }
        connection.end();
        return NextResponse.json({ message: 'Pagamento aprovado, Sucesso!' }, { status: 201 });
      });
    } else {
      return NextResponse.json({ error: 'Pagamento não aprovado' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro no processamento do pagamento:', error);
    return NextResponse.json({ error: 'Erro no servidor' }, { status: 500 });
  }
}
