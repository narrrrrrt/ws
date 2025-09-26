import { Room } from "../room"
import { leave_l } from "../logic/leave_l"
import { EventResponse } from "../types"

export function leaveHandle(room: Room, data: any, ws: WebSocket): void {
  const token = data.token
  if (token) {
    leave_l(room, token)
    room.broadcast("leave")
  }

  ws.close(4001, "leave")
}