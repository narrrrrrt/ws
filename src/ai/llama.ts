// 2-space indent
import { buildReversiChat } from "./prompt/reversiPrompt"

export async function llamaHandler(
  request: Request,
  env: any,
): Promise<Response> {
  // chat をスコープ外でも参照できるように先に宣言
  let chat: any = null
  let response: any = null

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

    chat = buildReversiChat(
      {
        board: body.board,
        status: body.status,
        lang: body.lang,                // room.js から渡す lang
        movesByColor: body.movesByColor // 任意
      },
      request.headers.get("Accept-Language") as any // fallback 用
    )

    response = await env.AI.run(
      "@cf/meta/llama-3-8b-instruct",
      chat
    )

    return Response.json({
      chat,
      response
    })
  } catch (err: any) {
    response = {
      error: (err && err.message) || String(err)
    }

    return Response.json({
      chat,
      response
    })
  }
}