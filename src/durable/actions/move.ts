import { Room } from "../room"
import { move_l } from "../logic/move_l"
import { EventResponse } from "../types"

export function moveHandle(room: Room, token: string, x: number, y: number, ws: WebSocket): void {
  const response: EventResponse = move_l(room, token, x, y)

  // 個別レスポンス
  ws.send(JSON.stringify(response))

  // 成功時は全員に最新状態をブロードキャスト
  if (!response.data.error) {
    room.broadcast("move")
  }
}