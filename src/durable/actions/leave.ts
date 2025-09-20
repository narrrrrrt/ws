import { Room } from "../room"
import { leave_l } from "../logic/leave_l"
import { EventResponse } from "../types"

export function leaveHandle(room: Room, data: any, ws: WebSocket): void {
  const token = data.token
  if (!token) return

  leave_l(room, token)

  // 本人へのレスポンスを返す（型 EventResponse）
  const response: EventResponse = {
    event: "leave",
    data: {} // leave は返すものなし
  }
  room.respond(ws, response)

  // 全員にブロードキャスト
  room.broadcast("leave")
}