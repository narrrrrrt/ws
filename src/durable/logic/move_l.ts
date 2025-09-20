import { Room } from "../room"
import { EventResponse } from "../types"

export function move_l(room: Room, token: string, x: number, y: number): EventResponse {
  let role: "black" | "white" | null = null
  if (room.black === token) role = "black"
  else if (room.white === token) role = "white"

  if (!role) {
    return { event: "move", data: { error: "You are not a player" } }
  }

  if (room.status !== role) {
    return { event: "move", data: { error: "Not your turn" } }
  }

  const row = room.board[y].split("")
  row[x] = role === "black" ? "B" : "W"
  room.board[y] = row.join("")

  room.status = role === "black" ? "white" : "black"

  return { event: "move", data: {} }
}