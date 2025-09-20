import { Room } from "../room"
import { EventResponse } from "../types"
import { leave_l } from "../logic/leave_l"

export async function leaveHandle(room: Room, data: any): Promise<Response> {
  const token = data?.token
  if (!token) {
    // leave は token が必須
    const res: EventResponse = {
      event: "leave",
      data: { errorReason: "missing token" }
    }
    return new Response(JSON.stringify(res), { status: 400 })
  }

  // ロジックに委譲
  leave_l(room, token)

  // leave はレスポンスを返さない設計
  // ただし HTTP 的には 200 OK を返す
  return new Response(null, { status: 200 })
}