// prompt/reversiPrompt.ts

export type Lang = "ja" | "en" | "es" | "de" | "it" | "fr"

type Move = { x: number; y: number }
type Status = "black" | "white"

const SUPPORTED: Lang[] = ["ja", "en", "es", "de", "it", "fr"]

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
  ja: "あなたはオセロの友達コーチです。事実に基づき、存在しない手や無理な戦略は述べません。座標の羅列ではなく、短く楽しい一言アドバイスを日本語で伝えてください（200文字以内）。",
  en: "You are a friendly Othello coach. Base advice on facts; avoid impossible moves. Give a short, cheerful tip in English (≤200 chars), not just coordinates.",
  es: "Eres un entrenador amistoso de Othello. Consejos basados en hechos; evita jugadas imposibles. Da un consejo breve y alegre en español (≤200 caracteres), no solo coordenadas.",
  de: "Du bist ein freundlicher Othello-Trainer. Faktenbasierte Tipps; keine unmöglichen Züge. Gib einen kurzen, fröhlichen Hinweis auf Deutsch (≤200 Zeichen), nicht nur Koordinaten.",
  it: "Sei un allenatore amichevole di Othello. Consigli basati sui fatti; evita mosse impossibili. Fornisci un breve suggerimento in italiano (≤200 caratteri), non solo coordinate.",
  fr: "Tu es un coach amical d’Othello. Conseils fondés sur des faits; pas de coups impossibles. Donne un bref conseil en français (≤200 caractères), pas seulement des coordonnées.",
}

// ---- Helpers ----
function pickLang(explicit?: string, acceptHeader?: string | null): Lang {
  // 1) 明示指定が最優先
  if (explicit && SUPPORTED.includes(explicit as Lang)) return explicit as Lang
  // 2) Accept-Language から推定（ja-JP → ja など）
  if (acceptHeader) {
    const candidates = acceptHeader.split(",").map(s => s.trim().split(";")[0])
    for (const c of candidates) {
      const base = c.toLowerCase().split("-")[0]
      if (SUPPORTED.includes(base as Lang)) return base as Lang
    }
  }
  // 3) デフォルト
  return "ja"
}

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
  return moves.map(m => `(${m.x},${m.y})`).join(", ")
}

// ---- Main ----
export function buildReversiChat(
  params: {
    board: string[]              // 8 行の文字列配列
    status: Status               // "black" | "white"
    lang?: Lang                  // 明示言語（任意）
    movesByColor?: Record<Status, Move[]>
  },
  acceptLanguageHeader?: string | null
) {
  const lang = pickLang(params.lang, acceptLanguageHeader)
  const l = labels[lang]

  const boardStr = Array.isArray(params.board) ? params.board.join("\n") : String(params.board)
  const phase = detectPhase(params.board, lang)
  const localizedStatus = statusDict[lang][params.status]

  let movesLine = ""
  const mv = params.movesByColor?.[params.status]
  if (mv && mv.length > 0) {
    const fm = formatMoves(mv)
    // ラベルも各言語化
    movesLine = `\n${l.validMoves}: ${fm}`
  }

  return {
    messages: [
      {
        role: "system",
        content: systemPromptDict[lang],
      },
      {
        role: "user",
        // ラベルも本文も対象言語で統一（英単語は混ぜない）
        content:
          `${l.turn}: ${localizedStatus}\n` +
          `${l.phase}: ${phase}\n` +
          `${l.board}:\n${boardStr}` +
          movesLine,
      },
    ],
  }
}