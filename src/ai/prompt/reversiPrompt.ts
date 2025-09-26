// reversiPrompt.ts

export type Lang = "ja" | "en" | "es" | "de" | "it" | "fr"

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

const systemPromptDict: Record<Lang, string> = {
  ja: "あなたはオセロの友達コーチです。事実に基づき、存在しない手や無理な戦略は述べません。必ず友達に話しかけるように短く楽しくコメントしてください。出力は200文字以内、日本語で答えてください。",
  en: "You are a friendly Othello coach. Give advice based on facts, avoid impossible moves or unrealistic strategies. Speak like a friend, short and fun. Answer within 200 characters, in English.",
  es: "Eres un entrenador amistoso de Othello. Da consejos basados en hechos, sin movimientos imposibles ni estrategias poco realistas. Habla como un amigo, de forma breve y divertida. Responde en menos de 200 caracteres, en español.",
  de: "Du bist ein freundlicher Othello-Trainer. Gib Ratschläge auf Faktenbasis, keine unmöglichen Züge oder unrealistischen Strategien. Sprich wie ein Freund, kurz und mit Spaß. Antworte in weniger als 200 Zeichen, auf Deutsch.",
  it: "Sei un allenatore amichevole di Othello. Dai consigli basati sui fatti, senza mosse impossibili o strategie irrealistiche. Parla come un amico, in modo breve e divertente. Rispondi in meno di 200 caratteri, in italiano.",
  fr: "Tu es un coach amical d’Othello. Donne des conseils basés sur des faits, sans coups impossibles ni stratégies irréalistes. Parle comme un ami, de manière courte et amusante. Réponds en moins de 200 caractères, en français.",
}

// 石の数を数える (string[] または string に対応)
function countPieces(board: string[] | string): number {
  if (Array.isArray(board)) {
    return board.join("").split("").filter(c => c === "B" || c === "W").length
  } else {
    return (board.match(/[BW]/g) || []).length
  }
}

// 局面を判定
function detectPhase(board: string[] | string, lang: Lang): string {
  const pieces = countPieces(board)
  if (pieces < 20) return phaseDict[lang].opening
  if (pieces < 50) return phaseDict[lang].midgame
  return phaseDict[lang].endgame
}

// 有効手の整形
function formatMoves(moves: { x: number; y: number }[]): string {
  return moves.map(m => `(${m.x},${m.y})`).join(", ")
}

export function buildReversiChat(
  params: {
    board: string[]   // board は string[]
    status: "black" | "white"
    lang: Lang
    movesByColor?: Record<string, { x: number; y: number }[]>
  },
  fallbackLang: Lang = "en"
) {
  const { board, status, lang, movesByColor } = params
  const selectedLang: Lang = systemPromptDict[lang] ? lang : fallbackLang

  const localizedStatus = statusDict[selectedLang][status]
  const phase = detectPhase(board, selectedLang)

  let movesStr = ""
  if (movesByColor && movesByColor[status]) {
    movesStr = `\nValid moves: ${formatMoves(movesByColor[status])}`
  }

  // board を AI に渡すときは一続きの文字列にして読みやすくする
  const boardStr = Array.isArray(board) ? board.join("\n") : board

  return {
    messages: [
      {
        role: "system",
        content: systemPromptDict[selectedLang],
      },
      {
        role: "user",
        content: `Turn: ${localizedStatus}\nPhase: ${phase}\nBoard:\n${boardStr}${movesStr}`,
      },
    ],
  }
}