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

const systemPromptDict: Record<Lang, string> = {
  ja: "あなたはオセロの友達コーチです。事実に基づき、存在しない手や無理な戦略は述べません。出力は200文字以内。日本語で答えてください。",
  en: "You are a friendly Othello coach. Base your advice on facts, avoid impossible moves or unreasonable strategies. Answer concisely within 200 characters, in English.",
  es: "Eres un entrenador amistoso de Othello. Da consejos basados en hechos, sin movimientos imposibles ni estrategias poco realistas. Responde en menos de 200 caracteres, en español.",
  de: "Du bist ein freundlicher Othello-Trainer. Gib nur Fakten wieder, keine unmöglichen Züge oder unrealistischen Strategien. Antworte in weniger als 200 Zeichen, auf Deutsch.",
  it: "Sei un allenatore amichevole di Othello. Dai consigli basati sui fatti, senza mosse impossibili o strategie irrealistiche. Rispondi in meno di 200 caratteri, in italiano.",
  fr: "Tu es un coach amical d’Othello. Donne des conseils basés sur des faits, sans coups impossibles ni stratégies irréalistes. Réponds en moins de 200 caractères, en français.",
}

export function buildReversiChat(
  params: {
    board: string
    status: "black" | "white"
    lang: Lang
    movesByColor?: Record<string, any>
  },
  fallbackLang: Lang = "en"
) {
  const { board, status, lang, movesByColor } = params
  const selectedLang: Lang = systemPromptDict[lang] ? lang : fallbackLang

  const localizedStatus = statusDict[selectedLang][status]

  let movesStr = ""
  if (movesByColor && movesByColor[status]) {
    movesStr = `\nValid moves: ${JSON.stringify(movesByColor[status])}`
  }

  return {
    messages: [
      {
        role: "system",
        content: systemPromptDict[selectedLang],
      },
      {
        role: "user",
        content: `Turn: ${localizedStatus}\nBoard:\n${board}${movesStr}`,
      },
    ],
  }
}