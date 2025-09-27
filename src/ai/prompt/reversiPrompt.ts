// prompt/reversiPrompt.ts

export type Lang = "ja" | "en" | "es" | "de" | "it" | "fr"
type Status = "black" | "white"
type Move = { x: number; y: number }

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

// ---- Helpers ----
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

// ---- Case classifier ----
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

// ---- Prompts per case ----
const casePrompts: Record<Lang, Record<number, string>> = {
  ja: {
    0: "序盤の基本戦略を意識しましょう。角は強く、辺を早く取りすぎないこと。中央を固めるのが流れを作ります。",
    1: "今回は打てる場所がありません。パスするしかない状況です。励ましやユーモアを交えた短いコメントを返してください。",
    2: "今回は打てる場所が1つしかありません。仕方ない状況への共感や『ここしかないけど大事な一手になる』といった短いコメントを返してください。",
    3: "今回は打てる場所が2つあります。どちらも悪くないが、どちらかをおすすめする短いコメントを返してください。",
    4: "今回は複数の合法手があります。局面に応じた戦略（序盤=展開、中盤=安定、終盤=石数調整）を短くアドバイスしてください。",
    5: "今回の合法手の中に角があります。必ず角の価値に触れてください。座標ではなく『右上の角』など自然な言葉で説明してください。",
    6: "ゲームは終盤です。残りの手数はわずかです。最後の数手に集中すること、勝敗が見えてくる緊張感を短くコメントしてください。",
    7: "すでに勝敗は確定しています。この状況に合った短いコメントを返してください。勝ちなら称賛、負けなら労い、引き分けならユーモアを交えてください。",
  },
  // 他言語もここで埋めればOK (例: en, es...)
}

// ---- Main builder ----
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
  const includeMoves = !(caseId === 0 || caseId === 1) // 序盤特別とパスは渡さない

  const lines: string[] = []
  lines.push(`手番: ${localizedStatus}`)
  lines.push(`局面: ${phase}`)
  lines.push(`盤面:\n${boardStr}`)
  if (includeMoves && moves.length > 0) {
    const formatted = moves.map(m => `(x=${m.x+1},y=${m.y+1})`).join(", ")
    lines.push(`有効な手: ${formatted}`)
  }
  lines.push(caseInstruction)

  return {
    messages: [
      {
        role: "system",
        content:
          "あなたはオセロの友達コーチです。事実に基づき、存在しない手や無理な戦略は述べません。" +
          "常に短く楽しいコメントをしてください。挨拶は不要、日本語で200文字以内。",
      },
      { role: "user", content: lines.join("\n") },
    ],
  }
}