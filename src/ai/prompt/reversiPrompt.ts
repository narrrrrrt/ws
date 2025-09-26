// 2-space indent
type Move = { x: number; y: number }
type MovesByColor = { black: Move[]; white: Move[] }

function normLang(input?: string | null): "ja"|"en"|"es"|"de"|"it"|"fr" {
  const s = (input || "en").toLowerCase()
  const base = s.split(",")[0]?.trim() || "en"
  const two = base.split("-")[0]
  const supported = ["ja","en","es","de","it","fr"] as const
  return (supported as readonly string[]).includes(two) ? (two as any) : "en"
}

function systemPrompt(lang: string): string {
  const map: Record<string, string> = {
    ja: "あなたはオセロの友達コーチです。事実に基づき、存在しない手や無理な戦略は述べません。出力は200文字以内。日本語で答えてください。",
    en: "You are a friendly Othello coach. Only mention realistic options. Keep it under 200 characters. Reply in English.",
    es: "Eres un entrenador de Othello. Solo menciona opciones realistas. Menos de 200 caracteres. Responde en español.",
    de: "Du bist ein Othello-Coach. Nur realistische Optionen. Unter 200 Zeichen. Antworte auf Deutsch.",
    it: "Sei un coach di Othello. Solo mosse realistiche. Sotto 200 caratteri. Rispondi in italiano.",
    fr: "Tu es coach d’Othello. Donne seulement des options réalistes. Moins de 200 caractères. Réponds en français."
  }
  return map[lang] || map.en
}

export function buildReversiChat(
  input: {
    board: string[]
    status: "black" | "white"
    lang?: string
    movesByColor?: MovesByColor
  },
  acceptLanguageHeader?: string | null
) {
  const lang = normLang(input.lang || acceptLanguageHeader)
  const { board, status, movesByColor } = input

  const lines: string[] = []
  lines.push(`Turn: ${status}`)
  lines.push(`Board:\n${board.join("\n")}`)
  if (movesByColor) {
    const b = (movesByColor.black || []).map(m => `(${m.x},${m.y})`).join(", ") || "-"
    const w = (movesByColor.white || []).map(m => `(${m.x},${m.y})`).join(", ") || "-"
    lines.push(`Valid moves (black): ${b}`)
    lines.push(`Valid moves (white): ${w}`)
    lines.push(`Give advice only for the side to move (${status}).`)
  }
  lines.push("Give one short, friendly tip. Do not repeat the board.")

  return {
    messages: [
      { role: "system", content: systemPrompt(lang) },
      { role: "user", content: lines.join("\n") }
    ]
  }
}