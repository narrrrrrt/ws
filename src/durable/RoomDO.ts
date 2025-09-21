import { Room } from "./room"
import { joinHandle } from "./actions/join"
import { moveHandle } from "./actions/move"
import { leaveHandle } from "./actions/leave"
import { resetHandle } from "./actions/reset"

const actions = {
  join: joinHandle,
  move: moveHandle,
  leave: leaveHandle,
  reset: resetHandle,
}

export class RoomDO {
  state: DurableObjectState
  room: Room

  constructor(state: DurableObjectState) {
    this.state = state
    this.room = new Room()
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname.split("/").filter(Boolean)

    // --- WebSocket upgrade ---
    //if (path[1] === "ws") {
    if (request.headers.get("Upgrade") === "websocket") {
      const [client, server] = Object.values(new WebSocketPair())
      
      server.accept()

      // WS メッセージをアクションに振り分け
      server.addEventListener("message", async (evt: MessageEvent) => {
        try {
          const data = JSON.parse(evt.data.toString())
          const event = data.event as keyof typeof actions
          const fn = actions[event]

          if (fn) {
            fn(this.room, data, server)
          } else {
            server.send(JSON.stringify({ event: "error", reason: "Unknown event" }))
          }
        } catch (err: any) {
          server.send(JSON.stringify({ event: "error", reason: err.message }))
        }
      })

      // セッションが閉じたら削除処理
      server.addEventListener("close", () => {
        this.room.removeSession(server)
      })

      return new Response(null, { status: 101, webSocket: client })
    }

    // --- HTTP リクエストは資産配信 or 単純 200 OK ---
    return new Response("OK", { status: 200 })
  }
}