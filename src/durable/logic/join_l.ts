import { Room } from "../room"
import { Role } from "../types"

// 8文字のシンプルトークン
function generateToken(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function join_l(
  room: Room,
  seat?: Role,
  token?: string
): { role: Role; token: string | null } {
  let role: Role = "observer"
  let newToken: string | null = null

  // case 1: 新規参加 (seat のみ)
  if (seat && !token) {
    if (seat === "black" && room.black === null) {
      newToken = generateToken()
      room.board = [...Room.initialBoard]
      room.black = newToken
      role = "black"
    } else if (seat === "white" && room.white === null) {
      newToken = generateToken()
      room.board = [...Room.initialBoard]
      room.white = newToken
      role = "white"
    } else {
      role = "observer"
    }
  }

  // case 2: リロード (seat + token)
  else if (seat && token) {
    if (seat === "black" && room.black === token) {
      role = "black"
      newToken = token
    } else if (seat === "white" && room.white === token) {
      role = "white"
      newToken = token
    } else {
      role = "observer"
    }
  }

  // case 3: token のみ（相手が leave した後の継続）
  else if (!seat && token) {
    if (token === room.black || token === room.white) {
      role = token === room.black ? "black" : "white"
      newToken = token
      room.board = [...Room.initialBoard]
      room.status = "waiting"
    } else {
      role = "observer"
    }
  }

  // ステータス更新（observer 以外の場合）
  if (role !== "observer") {
    if (room.black && room.white) {
      room.status = "black" // ゲーム開始（黒番）
    } else {
      room.status = "waiting"
    }
  }

  // --- ★ ここで token を更新記録 ---
  if (newToken) {
    room.touchToken(newToken)
  }

  return { role, token: newToken }
}