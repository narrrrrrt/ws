// prompt/reversiPrompt.ts

export type Lang = "ja" | "en" | "es" | "de" | "it" | "fr"
type Status = "black" | "white"
type Move = { x: number; y: number }

// ---- Dictionaries ----
const statusDict: Record<Lang, { black: string; white: string }> = {
  ja: { black: "黒",      white: "白" },
  en: { black: "Black",   white: "White" },
  es: { black: "Negras",  white: "Blancas" },
  de: { black: "Schwarz", white: "Weiß" },
  it: { black: "Nero",    white: "Bianco" },
  fr: { black: "Noir",    white: "Blanc" },
}

const phaseDict: Record<Lang, { opening: string; midgame: string; endgame: string }> = {
  ja: { opening: "序盤",             midgame: "中盤",                endgame: "終盤" },
  en: { opening: "opening",          midgame: "midgame",             endgame: "endgame" },
  es: { opening: "apertura",         midgame: "medio juego",         endgame: "final" },
  de: { opening: "Anfang",           midgame: "Mittelspiel",         endgame: "Endspiel" },
  it: { opening: "apertura",         midgame: "medio gioco",         endgame: "finale" },
  fr: { opening: "ouverture",        midgame: "milieu de partie",    endgame: "finale" },
}

const labels: Record<Lang, { turn: string; phase: string; board: string; validMoves: string }> = {
  ja: { turn: "手番", phase: "局面", board: "盤面",      validMoves: "有効な手" },
  en: { turn: "Turn", phase: "Phase", board: "Board",    validMoves: "Valid moves" },
  es: { turn: "Turno", phase: "Fase", board: "Tablero",  validMoves: "Movimientos válidos" },
  de: { turn: "Zug", phase: "Phase", board: "Brett",     validMoves: "Gültige Züge" },
  it: { turn: "Turno", phase: "Fase", board: "Scacchiera", validMoves: "Mosse valide" },
  fr: { turn: "Tour", phase: "Phase", board: "Plateau",  validMoves: "Coups valides" },
}

const systemPromptDict: Record<Lang, string> = {
  ja: "あなたはオセロの友達コーチです。事実に基づき、存在しない手や無理な戦略は述べません。挨拶は不要です。短く楽しい一言アドバイスを日本語で伝えてください（200文字以内）。",
  en: "You are a friendly Othello coach. Base advice on facts; avoid impossible moves. Do not start with greetings. Give a short, cheerful tip in English (≤200 chars).",
  es: "Eres un entrenador amistoso de Othello. Consejos basados en hechos; evita jugadas imposibles. No empieces con saludos. Da un consejo breve y alegre en español (≤200 caracteres).",
  de: "Du bist ein freundlicher Othello-Trainer. Faktenbasierte Tipps; keine unmöglichen Züge. Kein Gruß am Anfang. Gib einen kurzen, fröhlichen Hinweis auf Deutsch (≤200 Zeichen).",
  it: "Sei un allenatore amichevole di Othello. Consigli basati sui fatti; evita mosse impossibili. Niente saluti iniziali. Fornisci un breve suggerimento in italiano (≤200 caratteri).",
  fr: "Tu es un coach amical d’Othello. Conseils fondés sur des faits; pas de coups impossibles. Pas de salutations. Donne un bref conseil en français (≤200 caractères).",
}

// ---- Helpers ----
function countPieces(board: string[] | string): number {
  const s = Array.isArray(board) ? board.join("") : board
  let cnt = 0
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === "B" || ch === "W") cnt++
  }
  return cnt
}

function detectPhase(board: string[] | string, lang: Lang): string {
  const n = countPieces(board)
  if (n < 20) return phaseDict[lang].opening
  if (n < 50) return phaseDict[lang].midgame
  return phaseDict[lang].endgame
}

function formatMoves(moves: Move[]): string {
  if (!moves || moves.length === 0) return ""
  // 0始まりを1始まりに変換、キー付き形式で出力
  return moves.map(m => `(x=${m.x + 1}, y=${m.y + 1})`).join(", ")
}

// ---- Main ----
export function buildReversiChat(params: {
  board: string[]              // 8 行の文字列配列
  status: Status               // "black" | "white"
  lang: Lang                   // 言語（必須）
  movesByColor?: Record<Status, Move[]>
}) {
  const { board, status, lang, movesByColor } = params

  const l = labels[lang]
  const boardStr = board.join("\n")
  const phase = detectPhase(board, lang)
  const localizedStatus = statusDict[lang][status]

  let movesLine = ""
  const mv = movesByColor?.[status]
  if (mv && mv.length > 0) {
    movesLine = `\n${l.validMoves}: ${formatMoves(mv)}`
  }

  return {
    messages: [
      {
        role: "system",
        content: systemPromptDict[lang],
      },
      {
        role: "user",
        content:
          `${l.turn}: ${localizedStatus}\n` +
          `${l.phase}: ${phase}\n` +
          `${l.board}:\n${boardStr}` +
          movesLine,
      },
    ],
  }
}