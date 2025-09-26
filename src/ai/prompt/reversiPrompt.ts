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
  ja: { opening: "序盤", midgame: "中盤", endgame: "終盤" },
  en: { opening: "opening", midgame: "midgame", endgame: "endgame" },
  es: { opening: "apertura", midgame: "medio juego", endgame: "final" },
  de: { opening: "Anfang", midgame: "Mittelspiel", endgame: "Endspiel" },
  it: { opening: "apertura", midgame: "medio gioco", endgame: "finale" },
  fr: { opening: "ouverture", midgame: "milieu de partie", endgame: "finale" },
}

const labels: Record<Lang, { turn: string; phase: string; board: string; validMoves: string }> = {
  ja: { turn: "手番", phase: "局面", board: "盤面", validMoves: "有効な手" },
  en: { turn: "Turn", phase: "Phase", board: "Board", validMoves: "Valid moves" },
  es: { turn: "Turno", phase: "Fase", board: "Tablero", validMoves: "Movimientos válidos" },
  de: { turn: "Zug", phase: "Phase", board: "Brett", validMoves: "Gültige Züge" },
  it: { turn: "Turno", phase: "Fase", board: "Scacchiera", validMoves: "Mosse valide" },
  fr: { turn: "Tour", phase: "Phase", board: "Plateau", validMoves: "Coups valides" },
}

// ---- System Prompts with rules ----
const systemPromptDict: Record<Lang, string> = {
  ja: "あなたはオセロの友達コーチです。事実に基づき、存在しない手や無理な戦略は述べません。\nルール:\n- 盤面は8x8。「-」は空きマス、「B」は黒石、「W」は白石です。\n- プレイヤーは自分の色の石だけを置けます。白番のときは白石、黒番のときは黒石です。\n- 相手の色の石を置くことはできません。\n- 有効な手は複数あっても、必ず最もおすすめの1手だけを選び、その理由を短く説明してください。\n挨拶は不要です。短く楽しい一言アドバイスを日本語で答えてください（200文字以内）。",
  en: "You are a friendly Othello coach. Base advice on facts, avoid impossible moves.\nRules:\n- The board is 8x8. '-' is empty, 'B' is Black, 'W' is White.\n- A player can only place their own color. White's turn = place White, Black's turn = place Black.\n- Never place the opponent's stones.\n- Even if multiple valid moves exist, always choose only the single best move and explain briefly why.\nDo not start with greetings. Give a short, fun tip in English (≤200 chars).",
  es: "Eres un entrenador amistoso de Othello. Consejos basados en hechos; sin movimientos imposibles.\nReglas:\n- El tablero es 8x8. '-' vacío, 'B' negras, 'W' blancas.\n- Solo se pueden poner fichas propias. Turno de blancas = poner blancas, turno de negras = poner negras.\n- Nunca pongas fichas del rival.\n- Aunque haya varias jugadas válidas, elige siempre una sola jugada recomendada y explica brevemente por qué.\nSin saludos. Da un consejo breve y divertido en español (≤200 caracteres).",
  de: "Du bist ein freundlicher Othello-Trainer. Faktenbasierte Tipps, keine unmöglichen Züge.\nRegeln:\n- Brett 8x8. '-' leer, 'B' Schwarz, 'W' Weiß.\n- Spieler setzen nur ihre eigene Farbe. Weiß am Zug = Weiß setzen, Schwarz am Zug = Schwarz setzen.\n- Keine gegnerischen Steine setzen.\n- Auch wenn es mehrere gültige Züge gibt, wähle immer nur den besten und erkläre kurz warum.\nKein Gruß. Gib einen kurzen, spaßigen Hinweis auf Deutsch (≤200 Zeichen).",
  it: "Sei un allenatore amichevole di Othello. Consigli basati sui fatti; niente mosse impossibili.\nRegole:\n- Scacchiera 8x8. '-' vuoto, 'B' nero, 'W' bianco.\n- Ogni giocatore piazza solo i propri pezzi. Turno bianco = pedine bianche, turno nero = pedine nere.\n- Mai piazzare pedine dell'avversario.\n- Anche se ci sono più mosse valide, scegli sempre e solo la migliore e spiega brevemente perché.\nNiente saluti. Fornisci un breve consiglio in italiano (≤200 caratteri).",
  fr: "Tu es un coach amical d’Othello. Donne des conseils basés sur des faits; pas de coups impossibles.\nRègles:\n- Plateau 8x8. '-' vide, 'B' noir, 'W' blanc.\n- Le joueur pose uniquement sa couleur. Tour des blancs = poser blanc, tour des noirs = poser noir.\n- Ne pose jamais de pions adverses.\n- Même s'il existe plusieurs coups valides, choisis toujours un seul meilleur coup et explique brièvement pourquoi.\nPas de salutations. Donne un bref conseil en français (≤200 caractères).",
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
  return moves.map(m => `(x=${m.x + 1}, y=${m.y + 1})`).join(", ")
}

// ---- Main ----
export function buildReversiChat(params: {
  board: string[]
  status: Status
  lang: Lang
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

  // ---- Gemini 形式（partsを1つにまとめる）----
  const text =
    systemPromptDict[lang] + "\n\n" +
    `${l.turn}: ${localizedStatus}\n` +
    `${l.phase}: ${phase}\n` +
    `${l.board}:\n${boardStr}` +
    movesLine

  return {
    contents: [
      {
        role: "user",
        parts: [{ text }]
      }
    ]
  }
}