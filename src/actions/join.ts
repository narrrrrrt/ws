import { Room } from "../room"
import { EventResponse } from "../types"
import { join_l } from "../logic/join_l"

export async function joinHandle(room: Room, data: any): Promise<Response> {
  const sheet = data?.sheet
  const token = data?.token

  // ロジックに委譲
  const result = join_l(room, sheet, token)

  // 黒 or 白が新規参加した場合のみ broadcast
  if (result.role === "black" || result.role === "white") {
    room.broadcast("join")
  }

  // レスポンス生成
  const res: EventResponse = {
    event: "join",
    data: result
  }

  return new Response(JSON.stringify(res), { status: 200 })
}