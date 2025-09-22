import { Room } from "../room"
import { EventResponse } from "../types"

export function move_l(room: Room, token: string, x: number | null, y: number | null): EventResponse {
  let role: "black" | "white" | null = null
  if (room.black === token) role = "black"
  else if (room.white === token) role = "white"

  if (!role) {
    return { event: "move", data: { error: "You are not a player" } }
  }

  if (room.status !== role) {
    return { event: "move", data: { error: "Not your turn" } }
  }

  // --- パス処理 ---
  if (x === null || y === null) {
    if (room.lastAction === "pass") {
      // 2回連続でパス → ゲーム終了
      return { event: "finish", data: {} }
    }
    room.lastAction = "pass"
    room.status = role === "black" ? "white" : "black"
    return { event: "move", data: {} }
  }

  // --- 石を置く ---
  const row = room.board[y].split("")
  row[x] = role === "black" ? "B" : "W"
  room.board[y] = row.join("")

  // --- ひっくり返し処理 ---
  flipStones(room.board, x, y, role)

  // --- 状態更新 ---
  room.lastAction = "move"
  room.status = role === "black" ? "white" : "black"

  // --- token のタッチ更新 ---
  room.touchToken(token)

  return { event: "move", data: {} }
}

// 8方向に対して裏返し処理を実行
function flipStones(board: string[], x: number, y: number, role: "black" | "white") {
  const me = role === "black" ? "B" : "W"
  const opp = role === "black" ? "W" : "B"
  const directions = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [-1, -1], [1, -1], [-1, 1]
  ]

  for (const [dx, dy] of directions) {
    const toFlip: [number, number][] = []
    let cx = x + dx
    let cy = y + dy

    while (cy >= 0 && cy < 8 && cx >= 0 && cx < 8) {
      const cell = board[cy][cx]
      if (cell === opp) {
        toFlip.push([cx, cy])
      } else if (cell === me) {
        if (toFlip.length > 0) {
          for (const [fx, fy] of toFlip) {
            const row = board[fy].split("")
            row[fx] = me
            board[fy] = row.join("")
          }
        }
        break
      } else {
        break
      }
      cx += dx
      cy += dy
    }
  }
}