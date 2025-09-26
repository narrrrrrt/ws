import { BroadcastPayload, RoomStatus, EventResponse } from "./types"
import { leave_l } from "./logic/leave_l"

export class Room {
  black: string | null = null
  white: string | null = null
  board: string[] = [...Room.initialBoard]
  status: RoomStatus = "waiting"
  
  lastAction: "move" | "pass" | null = null

  // WebSocket → token
  sessions: Map<WebSocket, string | null> = new Map()

  // token → lastUpdate timestamp
  lastUpdates: Map<string, number> = new Map()

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

  // 定期的に ping を投げる
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      for (const ws of this.sessions.keys()) {
        ws.send(JSON.stringify({ event: "ping", data: { time: Date.now() } }))
      }
    }, 10000)
  }

  // join / resume 時に token を更新
  touchToken(token: string) {
    this.lastUpdates.set(token, Date.now())
  }

  // WS close 時に呼び出される
  removeSession(ws: WebSocket) {
    const token = this.sessions.get(ws)
    if (!token) {
      this.sessions.delete(ws)
      return
    }

    const scheduledAt = Date.now()

    setTimeout(() => {
      const last = this.lastUpdates.get(token) ?? 0
      if (last > scheduledAt) {
        // resume が入ったので削除キャンセル
        return
      }

      // 正式に削除
      leave_l(this, token)
      this.sessions.delete(ws)
      this.broadcast("leave")
    }, 1200)
  }
  
  /*
  removeByToken(token: string) {
    for (const [ws, t] of this.sessions.entries()) {
      if (t === token) {
        this.sessions.delete(ws)
        break // 見つかったら抜ける
      }
    }
  }
  */

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
        this.sessions.delete(ws) // dead session cleanup
      }
    }
  }

  //respond(ws: WebSocket, payload: EventResponse) {
  //  ws.send(JSON.stringify(payload))
  //}
  
  respond(ws: WebSocket, payload?: EventResponse) {
    if (!payload) {
      // 現在の状態を丸ごと返す
      const current: BroadcastPayload = {
        event: "join",
        data: {
          black: this.black !== null,
          white: this.white !== null,
          board: this.board,
          status: this.status,
        },
      }
      ws.send(JSON.stringify(current))
    } else {
      // 通常の指定イベントレスポンス
      ws.send(JSON.stringify(payload))
    }
  }  
}