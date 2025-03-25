export async function POST(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const topic = searchParams.get("topic");
  
    if (!id || !topic) {
      return new Response(JSON.stringify({ error: "Parâmetros inválidos" }), { status: 400 });
    }
  
    return new Response(JSON.stringify({ success: "Webhook recebido com sucesso!", id, topic }), { status: 200 });
  }
  