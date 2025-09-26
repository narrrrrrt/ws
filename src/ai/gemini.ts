// 2-space indent
import { buildReversiChat } from "./prompt/reversiPrompt"

export async function geminiHandler(
  request: Request,
  env: any,
): Promise<Response> {
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
        lang: body.lang,
        movesByColor: body.movesByColor
      },
      request.headers.get("Accept-Language") as any
    )

    // Gemini API 呼び出し
    responce = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chat)
      }
    )

    const data = await responce.json()

    // 候補の最初のテキストだけ取り出す
    /*
    response =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "(no response text)"
*/ 

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