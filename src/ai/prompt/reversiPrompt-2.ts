// prompt/reversiPrompt.ts

export type Lang = "ja" | "en" | "es" | "de" | "it" | "fr"
type Status = "black" | "white"
type Move = { x: number; y: number }

// ---- 辞書 ----
const statusDict: Record<Lang, { black: string; white: string }> = {
  ja: { black: "黒", white: "白" },
  en: { black: "Black", white: "White" },
  es: { black: "Negras", white: "Blancas" },
  de: { black: "Schwarz", white: "Weiß" },
  it: { black: "Nero", white: "Bianco" },
  fr: { black: "Noir", white: "Blanc" },
}

const phaseDict: Record<Lang, { opening: string; midgame: string; endgame: string }> = {
  ja: { opening: "序盤", midgame: "中盤", endgame: "終盤" },
  en: { opening: "opening", midgame: "midgame", endgame: "endgame" },
  es: { opening: "apertura", midgame: "medio juego", endgame: "final" },
  de: { opening: "Anfang", midgame: "Mittelspiel", endgame: "Endspiel" },
  it: { opening: "apertura", midgame: "medio gioco", endgame: "finale" },
  fr: { opening: "ouverture", midgame: "milieu de partie", endgame: "finale" },
}

// ---- ヘルパー ----
function countPieces(board: string[]): number {
  return board.join("").replace(/-/g, "").length
}

function isCorner(move: Move): boolean {
  const { x, y } = move
  return (x === 0 || x === 7) && (y === 0 || y === 7)
}

function detectPhase(board: string[], lang: Lang): string {
  const n = countPieces(board)
  if (n < 20) return phaseDict[lang].opening
  if (n < 50) return phaseDict[lang].midgame
  return phaseDict[lang].endgame
}

// ---- ケース分類 ----
function classifyCase(board: string[], moves: Move[], turnCount: number) {
  const pieceCount = countPieces(board)

  // #7 勝敗確定 (簡易版: 残りマスより石差が大きいなら)
  const empties = 64 - pieceCount
  const blacks = board.join("").split("B").length - 1
  const whites = board.join("").split("W").length - 1
  if (Math.abs(blacks - whites) > empties) return 7

  // #1 パス
  if (!moves || moves.length === 0) return 1

  // #0 序盤特別 (最初の8手以内、かつ石 <=16)
  if (turnCount < 8 && pieceCount <= 16) return 0

  // #5 角
  if (moves.some(isCorner)) return 5

  // #6 終盤
  if (pieceCount > 50) return 6

  // #2 単一手
  if (moves.length === 1) return 2

  // #3 二択
  if (moves.length === 2) return 3

  // #4 通常
  return 4
}

// ---- ケース別プロンプト ----
const casePrompts: Record<Lang, Record<number, string>> = {
  ja: {
    0: "序盤の基本戦略を意識しましょう。角は強く、辺を早く取りすぎないこと。中央を固めるのが流れを作ります。",
    1: "今回は打てる場所がありません。パスするしかない状況です。パスに見合ったコメントを返してください。",
    2: "今回は打てる場所が1つしかありません。選択肢がない状況に触れつつ、前向きなコメントを返してください。",
    3: "今回は打てる場所が2つあります。どちらを選ぶか迷う場面です。自然にどちらかを勧めるコメントをしてください。",
    4: "今回は複数の合法手があります。局面に応じた戦略（序盤=展開、中盤=安定、終盤=石数調整）を短くアドバイスしてください。",
    5: "今回の合法手の中に角があります。必ず角の価値に触れてください。『右上の角』など自然な言葉で説明してください。",
    6: "ゲームは終盤です。残りの手数はわずかです。最後の数手に集中するよう短いコメントをしてください。",
    7: "すでに勝敗は確定しています。この状況に合った短いコメントを返してください。勝ちなら称賛、負けなら労い、引き分けならユーモアを交えてください。",
  },
  en: {
    0: "Focus on basic opening strategies. Corners are powerful, avoid taking edges too early, and build central control.",
    1: "No legal moves available. You must pass. Provide a short comment that fits this situation.",
    2: "Only one legal move is available. Mention the lack of choice while keeping the tone positive.",
    3: "Two legal moves are available. Suggest one naturally while acknowledging the choice.",
    4: "Multiple legal moves available. Give strategic advice based on the game phase (opening=expansion, midgame=stability, endgame=stone count).",
    5: "A corner move is available. Always highlight the value of corners. Use natural phrases like 'top-right corner'.",
    6: "It's the endgame. Only a few moves remain. Give a short comment about focusing on the final stage.",
    7: "The result is already decided. Respond with a fitting short comment: praise for winning, encouragement for losing, or humor for a draw.",
  },
  // 他の言語も必要なら同じように埋める
}

// ---- メインビルダー ----
export function buildReversiChat(params: {
  board: string[]
  status: Status
  lang: Lang
  movesByColor?: Record<Status, Move[]>
  turnCount: number
}) {
  const { board, status, lang, movesByColor, turnCount } = params
  const phase = detectPhase(board, lang)
  const localizedStatus = statusDict[lang][status]
  const moves = movesByColor?.[status] || []

  const caseId = classifyCase(board, moves, turnCount)
  const caseInstruction = casePrompts[lang][caseId]

  const boardStr = board.join("\n")

  // 合法手を渡すかどうか
  const includeMoves = !(caseId === 0 || caseId === 1)

  const lines: string[] = []
  lines.push(`手番: ${localizedStatus}`)
  lines.push(`局面: ${phase}`)
  lines.push(`盤面:\n${boardStr}`)
  if (includeMoves && moves.length > 0) {
    const formatted = moves.map(m => `(x=${m.x+1},y=${m.y+1})`).join(", ")
    lines.push(`有効な手: ${formatted}`)
  }
  lines.push(caseInstruction)

  // Gemini の API 仕様に合わせる
  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              "あなたはオセロの友達コーチです。事実に基づき、存在しない手や無理な戦略は述べません。" +
              "常に短く楽しいコメントをしてください。挨拶は不要、日本語で200文字以内。\n\n" +
              lines.join("\n"),
          },
        ],
      },
    ],
  }
}