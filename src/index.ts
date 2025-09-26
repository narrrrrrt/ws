import { llamaHandler } from "./ai/llama";
const VALID_IDS = ["1", "2", "3", "4"]

export default {
  async fetch(request: Request, env: any): Promise<Response> {

    const assetRes = await env.ASSETS.fetch(request.clone())
    if (assetRes.status !== 404) {
      return assetRes
    }

    const url = new URL(request.url)
    if (url.pathname === "/ai") {
      return llamaHandler(request, env);
    }

    const [roomId, ...rest] = url.pathname.split("/").filter(s => s.length > 0)
    const restPath = "/" + rest.join("/")

    if (roomId && VALID_IDS.includes(roomId)) {
      try {
        const id = env.RoomDO.idFromName(roomId)
        const stub = env.RoomDO.get(id)

        const doUrl = new URL(`http://do${restPath}${url.search}`)
        const doReq = new Request(doUrl.toString(), request)

        return await stub.fetch(doReq)
      } catch (err: any) {
        return new Response(`DO error: ${err?.message || String(err)}`, {
          status: 200,
        })
      }
    }

    return new Response("Not found", { status: 404 })
  },
}

export { RoomDO } from "./durable/RoomDO"