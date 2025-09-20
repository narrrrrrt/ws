import { Room } from "../room"
import { EventResponse } from "../types"

export function resetHandle(room: Room, _data: any, ws: WebSocket): void {
  // 状態を初期化
  room.black = null
  room.white = null
  room.board = [...Room.initialBoard]
  room.status = "waiting"

  // 本人へのレスポンス
  const response: EventResponse = {
    event: "reset",
    data: {}
  }
  room.respond(ws, response)

  // 全員にブロードキャスト
  room.broadcast("reset")
}