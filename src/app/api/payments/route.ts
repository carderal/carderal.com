import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2";

interface PaymentRequest {
  id: string
  topic: string
}

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await req.json();
    const { id, topic }: PaymentRequest = body;

    if(!id || !topic || topic !== 'payment'){
      return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
    }

      const host = process.env.DB_HOST
      const user = process.env.DB_USER
      const password = process.env.DB_PASS
      const db = process.env.DB_NAME
      const token = process.env.MP_ACCESS_TOKEN

      const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      })

      const payment = await response.json()

      if(payment.status === 'approved'){
        const connection = mysql.createConnection({
          host,
          user,
          password,
          database: db,
        })

        const player = payment.external_reference
        const insertSQL = 'INSERT INTO autopix_pendings (id, player) VALUES (?,?)'

        try {
          await new Promise((resolve, reject) => {
            connection.execute(insertSQL, [id, player], (error, results) => {
              if(error){
                console.error('Error inserting payment:', error)
                reject(error)
                return
              }
              connection.end()
              resolve(results)
            })
          })
          return NextResponse.json({ message: 'Payment registered successfully' }, { status: 201 })
        } catch (error) {
          console.error('Error inserting payment:', error)
          return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
        }
      } else {
        return NextResponse.json({ message: 'Payment not approved' }, { status: 400 })
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
}