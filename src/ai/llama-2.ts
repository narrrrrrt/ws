// 2-space indent
import { buildReversiChat } from "./prompt/reversiPrompt"

export async function llamaHandler(
  request: Request,
  env: any,
): Promise<Response> {
  try {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 })
    }

    const body = await request.clone().json()

    if (
      !body ||
      !Array.isArray(body.board) ||
      !(body.status === "black" || body.status === "white")
    ) {
      return new Response("Invalid body", { status: 400 })
    }

    const chat = buildReversiChat(
      {
        board: body.board,
        status: body.status,
        lang: body.lang,                // room.js から渡す lang
        movesByColor: body.movesByColor // 任意
      },
      request.headers.get("Accept-Language") // fallback 用
    )

    const response = await env.AI.run(
      "@cf/meta/llama-3-8b-instruct",
      chat
    )
    
    return Response.json({
      chat,
      response
    })
  } catch (err: any) {
    return new Response(
      `Llama Worker error: ${(err && err.message) || String(err)}`,
      { status: 500 }
    )
  }
}