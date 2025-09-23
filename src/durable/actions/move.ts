import { Room } from "../room"
import { move_l } from "../logic/move_l"
import { EventResponse } from "../types"

export function moveHandle(room: Room, data: any, ws: WebSocket): void {
  const { token, x, y } = data

  // ロジックで判定 & EventResponse を返す
  const response: EventResponse = move_l(room, token, x, y)

  // 個別レスポンスは必ず返す
  ws.send(JSON.stringify(response))

  // エラーでなければ全員にブロードキャスト
  if (!response.data?.error) {
    room.broadcast("move")
  }
}