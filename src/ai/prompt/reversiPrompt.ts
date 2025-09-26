// prompt/reversiPrompt.ts

export type Lang = "ja" | "en" | "es" | "de" | "it" | "fr"
type Status = "black" | "white"
type Move = { x: number; y: number }

// ---- 辞書 ----
const statusDict: Record<Lang, { black: string; white: string }> = {
  ja: { black: "黒",      white: "白" },
  en: { black: "Black",   white: "White" },
  es: { black: "Negras",  white: "Blancas" },
  de: { black: "Schwarz", white: "Weiß" },
  it: { black: "Nero",    white: "Bianco" },
  fr: { black: "Noir",    white: "Blanc" },
}

const phaseDict: Record<Lang, { opening: string; midgame: string; endgame: string }> = {
  ja: { opening: "序盤", midgame: "中盤", endgame: "終盤" },
  en: { opening: "opening", midgame: "midgame", endgame: "endgame" },
  es: { opening: "apertura", midgame: "medio juego", endgame: "final" },
  de: { opening: "Anfang", midgame: "Mittelspiel", endgame: "Endspiel" },
  it: { opening: "apertura", midgame: "medio gioco", endgame: "finale" },
  fr: { opening: "ouverture", midgame: "milieu de partie", endgame: "finale" },
}

// ---- システムプロンプト ----
const systemPromptDict: Record<Lang, string> = {
  ja: "あなたはオセロの友達コーチです。事実に基づき、存在しない手や無理な戦略は述べません。今打つべき最良の一手を選び、その理由を短く説明してください。挨拶は不要、日本語で200文字以内。",
  en: "You are a friendly Othello coach. Give only legal, realistic moves. Choose the single best move and briefly explain why. No greetings. Keep it under 200 characters in English.",
  es: "Eres un entrenador amistoso de Othello. Solo jugadas legales y realistas. Elige la mejor y explica brevemente. Sin saludos. Máx. 200 caracteres en español.",
  de: "Du bist ein freundlicher Othello-Trainer. Nur legale, realistische Züge. Wähle den besten und erkläre kurz warum. Kein Gruß. Max. 200 Zeichen auf Deutsch.",
  it: "Sei un coach di Othello. Dai solo mosse legali e realistiche. Scegli la migliore e spiega brevemente. Nessun saluto. Max 200 caratteri in italiano.",
  fr: "Tu es coach d’Othello. Donne uniquement des coups légaux et réalistes. Choisis le meilleur et explique brièvement. Pas de salutations. 200 caractères max en français.",
}

// ---- ヘルパー ----
function countPieces(board: string[] | string): number {
  const s = Array.isArray(board) ? board.join("") : board
  return [...s].filter(ch => ch === "B" || ch === "W").length
}

function detectPhase(board: string[] | string, lang: Lang): string {
  const n = countPieces(board)
  if (n < 20) return phaseDict[lang].opening
  if (n < 50) return phaseDict[lang].midgame
  return phaseDict[lang].endgame
}

function formatMoves(moves: Move[]): string {
  if (!moves || moves.length === 0) return ""
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

  const boardStr = board.join("\n")
  const phase = detectPhase(board, lang)
  const localizedStatus = statusDict[lang][status]
  const moves = movesByColor?.[status]

  let movesLine = ""
  if (moves && moves.length > 0) {
    movesLine = `\n有効な手: ${formatMoves(moves)}`
  }

  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              systemPromptDict[lang] + "\n\n" +
              `状況: ${localizedStatus}の手番、${phase}。\n` +
              `盤面:\n${boardStr}` +
              movesLine
          }
        ]
      }
    ]
  }
}