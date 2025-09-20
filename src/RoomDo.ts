import { Room } from "../room"
import { joinHandle } from "../actions/join"
import { leaveHandle } from "../actions/leave"
import { moveHandle } from "../actions/move"
import { resetHandle } from "../actions/reset"

const actions = {
  joinHandle,
  leaveHandle,
  moveHandle,
  resetHandle,
}

export class RoomDO {
  room: Room

  constructor(state: DurableObjectState) {
    this.room = new Room()
  }

  async fetch(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url)

      // --- WS 接続の場合 ---
      if (url.pathname.endsWith("/ws")) {
        const pair = new WebSocketPair()
        const [client, server] = Object.values(pair)

        server.accept()
        this.room.addSession(server)

        // WS message → actions に振り分け
        server.addEventListener("message", async (evt) => {
          try {
            const data = JSON.parse(evt.data as string)
            const fnName = `${data?.event}Handle` as keyof typeof actions
            const fn = actions[fnName]

            if (typeof fn === "function") {
              await fn(this.room, data, server)
            } else {
              server.send(JSON.stringify({ error: "unknown event" }))
            }
          } catch (err: any) {
            server.send(JSON.stringify({ error: String(err.message || err) }))
          }
        })

        // close は Room 内で処理される
        return new Response(null, { status: 101, webSocket: client })
      }

      // --- HTTP リクエストの場合（Join の最初だけ） ---
      if (request.method === "POST") {
        const data = await request.json()
        if (data?.event === "join") {
          return await joinHandle(this.room, data)
        }
        return new Response(JSON.stringify({ error: "unsupported HTTP event" }), { status: 400 })
      }

      return new Response("OK", { status: 200 })
    } catch (err: any) {
      return new Response(JSON.stringify({ error: String(err.message || err) }), { status: 200 })
    }
  }
}