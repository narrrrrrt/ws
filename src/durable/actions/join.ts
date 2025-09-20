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

  if (role === "observer") {
    if (!room.black && !room.white) {
      // 誰もいないときは observer に初期状態を返す
      room.respond(ws, {
        event: "join",
        data: {
          board: [...Room.initialBoard],
          status: "waiting",
          black: false,
          white: false
        }
      })
    }
    // 誰かプレイヤーがいれば、broadcast が流れるので何もしない
  } else {
    // 黒・白の join は従来通り broadcast
    room.broadcast("join")
  }
}