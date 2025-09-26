import { Room } from "../room"
import { join_l } from "../logic/join_l"
import { EventResponse } from "../types"

export function joinHandle(room: Room, data: any, ws: WebSocket): void {
  const { seat, token } = data
  const { role, token: newToken } = join_l(room, seat, token)

  room.sessions.set(ws, newToken)

  if (role === "observer") {
    room.respond(ws)
  } else {
    const response: EventResponse = {
      event: "join",
      data: { role, token: newToken }
    }
    room.respond(ws, response)
    room.broadcast("join")
  }
}