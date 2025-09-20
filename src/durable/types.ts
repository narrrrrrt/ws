export type Role = "black" | "white" | "observer"
export type Status = "waiting" | "black" | "white" | "leave"
export type Board = string[]

export interface EventPayload {
  event: string
  seat?: Role
  token?: string
  x?: number
  y?: number
}

export interface EventResponse {
  event: string
  data: {
    token?: string
    role?: Role
    errorReason?: string   // 失敗時のみ
  }
}

export interface BroadcastPayload {
  event: string
  data: {
    black: boolean
    white: boolean
    board: Board
    status: Status
  }
}