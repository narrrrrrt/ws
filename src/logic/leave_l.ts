import { Room } from "../room"

export function leave_l(room: Room, token: string): void {
  if (room.black === token) {
    room.black = null
    room.status = "leave"
    room.board = [...Room.flatBoard]
  } else if (room.white === token) {
    room.white = null
    room.status = "leave"
    room.board = [...Room.flatBoard]
  }
  // observer or 無効token の場合は自然に何もしないで終了
}