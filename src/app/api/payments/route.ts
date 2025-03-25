import { NextApiRequest, NextApiResponse } from "next";
import mysql from "mysql2"

interface PaymentRequest {
  id: string
  topic: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if(req.method === 'POST'){
    try {
      const { id, topic }: PaymentRequest = req.body;

      if(!id || !topic || topic !== 'payment'){
        return res.status(400).json({ message: 'Invalid request'})
      }

      const host = process.env.DB_HOST
      const user = process.env.DB_USER
      const password = process.env.DB_PASS
      const db = process.env.DB_NAME
      const token = process.env.MP_ACCESS_TOKEN

      const response = await fetch('https://api.mercadopago.com/v1/payments/${id}', {
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

        connection.execute(insertSQL, [id, player], (error, results) => {
          if(error){
            console.error('Error inserting payment:', error)
            return res.status(500).json({ message: 'Internal server error'})
          }

          connection.end()
          return res.status(201).json({ message: 'Payment registered successfully'})
        })
      } else {
        return res.status(400).json({ message: 'Payment not approved'})
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      return res.status(500).json({ message: 'Internal server error'})
    }
  }
}