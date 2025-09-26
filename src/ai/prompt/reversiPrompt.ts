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

// ---- ベースのシステムプロンプト ----
const systemPromptDict: Record<Lang, string> = {
  ja: "あなたはオセロの友達コーチです。事実に基づき、存在しない手や無理な戦略は述べません。常に短く楽しいアドバイスをしてください。挨拶は不要、日本語で200文字以内。",
  en: "You are a friendly Othello coach. Only give factual, legal advice. Always keep it short and fun. No greetings. Reply in English under 200 characters.",
  es: "Eres un entrenador de Othello. Solo jugadas legales y realistas. Da consejos cortos y divertidos. Sin saludos. En español, menos de 200 caracteres.",
  de: "Du bist ein Othello-Coach. Nur legale, realistische Tipps. Kurz und spaßig. Kein Gruß. Antworte auf Deutsch (≤200 Zeichen).",
  it: "Sei un coach di Othello. Dai solo mosse legali e realistiche. Breve e divertente. Nessun saluto. In italiano (≤200 caratteri).",
  fr: "Tu es coach d’Othello. Donne seulement des coups légaux et réalistes. Bref et amusant. Pas de salutations. Réponds en français (≤200 caractères).",
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
  if (!moves || moves.length === 0) return "-"
  return moves.map(m => `(x=${m.x + 1}, y=${m.y + 1})`).join(", ")
}

// 角の判定
function hasCorner(moves: Move[]): boolean {
  return moves.some(m =>
    (m.x === 0 && m.y === 0) ||
    (m.x === 0 && m.y === 7) ||
    (m.x === 7 && m.y === 0) ||
    (m.x === 7 && m.y === 7)
  )
}

// ---- ケース別追加指示 ----
function caseInstruction(
  moves: Move[] | undefined,
  board: string[],
  lang: Lang
): string {
  const emptyCount = [...board.join("")].filter(ch => ch === "-").length
  const totalPieces = countPieces(board)
  const moveCount = moves?.length || 0
  const corner = moves && hasCorner(moves)

  // 勝敗確定の簡易判定（残りマス < 石差）
  const blackCount = [...board.join("")].filter(ch => ch === "B").length
  const whiteCount = [...board.join("")].filter(ch => ch === "W").length
  const diff = Math.abs(blackCount - whiteCount)

  // 勝敗確定
  if (diff > emptyCount) {
    return {
      ja: "すでに勝敗が確定しています。この状況にふさわしい短いコメントを出してください。",
      en: "The outcome is already decided. Give a short comment suitable for this situation.",
      es: "El resultado ya está decidido. Da un breve comentario adecuado a esta situación.",
      de: "Das Ergebnis steht bereits fest. Gib einen kurzen Kommentar dazu.",
      it: "L'esito è già deciso. Dai un breve commento adatto alla situazione.",
      fr: "L'issue est déjà décidée. Donne un bref commentaire adapté à cette situation.",
    }[lang]
  }

  // パス
  if (moveCount === 0) {
    return {
      ja: "今回は合法手がありません。パスするしかありません。この状況にふさわしい短いコメントを出してください。",
      en: "No valid moves available. You must pass. Provide a short comment fitting this situation.",
      es: "No hay movimientos válidos. Debes pasar. Da un breve comentario adecuado.",
      de: "Keine gültigen Züge. Du musst passen. Gib einen passenden kurzen Kommentar.",
      it: "Nessuna mossa valida. Devi passare. Dai un breve commento adeguato.",
      fr: "Aucun coup valide. Vous devez passer. Donne un bref commentaire adapté.",
    }[lang]
  }

  // 単一手
  if (moveCount === 1) {
    return {
      ja: "合法手は1つしかありません。この状況にふさわしい短いコメントを出してください。",
      en: "Only one valid move. Give a short comment fitting this situation.",
      es: "Solo hay un movimiento válido. Da un breve comentario adecuado.",
      de: "Nur ein gültiger Zug. Gib einen passenden kurzen Kommentar.",
      it: "C'è solo una mossa valida. Dai un breve commento adatto.",
      fr: "Un seul coup valide. Donne un bref commentaire adapté.",
    }[lang]
  }

  // 二択
  if (moveCount === 2) {
    return {
      ja: "合法手は2つだけです。この中からおすすめの一手を選び、その理由を短く説明してください。",
      en: "There are only 2 valid moves. Choose the best one and explain briefly why.",
      es: "Solo hay 2 movimientos válidos. Elige el mejor y explica brevemente por qué.",
      de: "Es gibt nur 2 gültige Züge. Wähle den besten und erkläre kurz warum.",
      it: "Ci sono solo 2 mosse valide. Scegli la migliore e spiega brevemente perché.",
      fr: "Il n'y a que 2 coups valides. Choisis le meilleur et explique brièvement pourquoi.",
    }[lang]
  }

  // 角を含む
  if (corner) {
    return {
      ja: "合法手の中に角があります。角の価値に触れながら、最もおすすめの一手を選んでください。",
      en: "One of the valid moves is a corner. Mention its value and choose the best move.",
      es: "Uno de los movimientos válidos es una esquina. Menciona su valor y elige el mejor.",
      de: "Einer der gültigen Züge ist eine Ecke. Erwähne ihren Wert und wähle den besten.",
      it: "Una delle mosse valide è un angolo. Cita il suo valore e scegli la migliore.",
      fr: "L'un des coups valides est un coin. Mentionne sa valeur et choisis le meilleur.",
    }[lang]
  }

  // 終盤
  if (emptyCount <= 5) {
    return {
      ja: "ゲームは終盤です。残りわずかな局面に合った短いコメントを出してください。",
      en: "The game is in the endgame. Provide a short comment suitable for this phase.",
      es: "El juego está en la fase final. Da un breve comentario adecuado.",
      de: "Das Spiel ist im Endspiel. Gib einen kurzen passenden Kommentar.",
      it: "La partita è nella fase finale. Dai un breve commento adatto.",
      fr: "La partie est en finale. Donne un bref commentaire adapté.",
    }[lang]
  }

  // 通常ケース
  return {
    ja: "合法手が複数あります。この中から最もおすすめの一手を選び、その理由を短く説明してください。",
    en: "There are multiple valid moves. Choose the single best one and briefly explain why.",
    es: "Hay varios movimientos válidos. Elige el mejor y explica brevemente por qué.",
    de: "Es gibt mehrere gültige Züge. Wähle den besten und erkläre kurz warum.",
    it: "Ci sono più mosse valide. Scegli la migliore e spiega brevemente perché.",
    fr: "Il y a plusieurs coups valides. Choisis le meilleur et explique brièvement pourquoi.",
  }[lang]
}

// ---- Main ----
export function buildReversiChat(params: {
  board: string[]
  status: Status
  lang: Lang
  movesByColor?: Record<Status, Move[]>
}) {
  const { board, status, lang, movesByColor } = params

  const boardStr = board.join("\n")
  const phase = detectPhase(board, lang)
  const localizedStatus = statusDict[lang][status]
  const moves = movesByColor?.[status]

  const base = `${systemPromptDict[lang]}\n\n` +
    `状況: ${localizedStatus}の手番、${phase}。\n` +
    `盤面:\n${boardStr}\n` +
    `有効な手: ${moves ? formatMoves(moves) : "-"}`

  const extra = caseInstruction(moves, board, lang)

  return {
    contents: [
      {
        role: "user",
        parts: [{ text: `${base}\n\n${extra}` }],
      },
    ],
  }
}