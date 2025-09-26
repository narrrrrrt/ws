// 2-space indent
import { buildReversiChat } from "./prompt/reversiPrompt"

export async function geminiHandler(
  request: Request,
  env: any,
): Promise<Response> {
  let chat: any = null
  let rawResponse: any = null  // fetch のレスポンスを保持
  let data: any = null

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
    rawResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chat)
      }
    )

    data = await rawResponse.json()

    return Response.json({
      chat,
      response: data
    })
  } catch (err: any) {
    return Response.json({
      chat,
      response: data ?? null, // JSON が取れてればそれを、無ければ null
      rawResponseStatus: rawResponse?.status ?? null,
      rawResponseOk: rawResponse?.ok ?? null,
      error: (err && err.message) || String(err)
    })
  }
}