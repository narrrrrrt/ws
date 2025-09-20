import { BroadcastPayload, RoomStatus } from "./types"
import { leave_l } from "./logic/leave_l"

export class Room {
  black: string | null = null
  white: string | null = null
  board: string[] = [...Room.flatBoard]
  status: RoomStatus = "waiting"
  sessions: Map<WebSocket, string | null> = new Map()

  static readonly flatBoard: string[] = Array(8).fill("--------")

  static readonly initialBoard: string[] = [
    "--------",
    "--------",
    "--------",
    "---WB---",
    "---BW---",
    "--------",
    "--------",
    "--------",
  ]

  addSession(ws: WebSocket) {
    this.sessions.set(ws, null)
    ws.accept()
  }

  removeSession(ws: WebSocket) {
    const token = this.sessions.get(ws)
    if (token) {
      leave_l(this, token)
      this.broadcast("leave")
    }
    this.sessions.delete(ws)
  }

  broadcast(event: string) {
    const payload: BroadcastPayload = {
      event,
      data: {
        black: this.black !== null,
        white: this.white !== null,
        board: this.board,
        status: this.status,
      },
    }

    const msg = JSON.stringify(payload)

    for (const ws of this.sessions.keys()) {
      try {
        ws.send(msg)
      } catch {
        this.sessions.delete(ws) // dead session を削除
      }
    }
  }

  respond(ws: WebSocket, payload: EventResponse) {
    ws.send(JSON.stringify(payload))
  }
}