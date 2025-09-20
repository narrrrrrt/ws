import { Room } from "../room"
import { Role } from "../types"
import { randomUUID } from "crypto"

export function join_l(room: Room, sheet?: Role, token?: string): { role: Role; token?: string } {
  // --- 1. token だけで来た場合 (相手がリーブして続行したいケース)
  if (!sheet && token) {
    if (room.black === token || room.white === token) {
      // 正しいtoken → boardリセット & waiting
      room.board = [...Room.initialBoard]
      room.status = "waiting"
      return { role: room.black === token ? "black" : "white", token }
    }
    // 無効token → observer
    return { role: "observer" }
  }

  // --- 2. sheet + token (リロード)
  if (sheet && token) {
    if ((sheet === "black" && room.black === token) || (sheet === "white" && room.white === token)) {
      // 既存プレイヤー → そのままOK
      return { role: sheet, token }
    }
    // 不一致なら observer
    return { role: "observer" }
  }

  // --- 3. sheetだけ (新規参加)
  if (sheet) {
    let role: Role = "observer"
    let newToken: string | undefined

    if (sheet === "black" && !room.black) {
      room.black = newToken = randomUUID()
      role = "black"
    } else if (sheet === "white" && !room.white) {
      room.white = newToken = randomUUID()
      role = "white"
    } else {
      role = "observer"
    }

    // ステータス更新
    if (role !== "observer") {
      if (room.black && room.white) {
        room.status = "black"  // ゲーム開始
        room.board = [...Room.initialBoard]
      } else {
        room.status = "waiting"
        room.board = [...Room.initialBoard]
      }
    }

    return { role, token: newToken }
  }

  // どの条件にも当てはまらない → observer
  return { role: "observer" }
}