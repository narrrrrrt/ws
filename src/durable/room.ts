import { BroadcastPayload, RoomStatus } from "./types"
import { leave_l } from "./logic/leave_l"

export class Room {
  black: string | null = null
  white: string | null = null
  board: string[] = [...Room.initialBoard]
  status: RoomStatus = "waiting"
  sessions: Map<WebSocket, string | null> = new Map()
  heartbeatTimer: NodeJS.Timeout | null = null  

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

  constructor() {
    this.startHeartbeat()
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      for (const ws of this.sessions.keys()) {
        ws.send(JSON.stringify({ event: "ping", data: { time: Date.now() } }))
      }
    }, 10000)
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