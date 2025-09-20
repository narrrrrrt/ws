import { Room } from "../room"
import { join_l } from "../logic/join_l"
import { EventResponse } from "../types"

export function joinHandle(room: Room, data: any, ws: WebSocket): void {
  const { seat, token } = data
  const { role, token: newToken } = join_l(room, seat, token)

  // 本人へのレスポンスを型付きで作成
  const response: EventResponse = {
    event: "join",
    data: { role, token: newToken }
  }

  room.respond(ws, response)

  // 黒 or 白の場合は全員にブロードキャスト
  if (role !== "observer") {
    room.broadcast("join")
  }
}