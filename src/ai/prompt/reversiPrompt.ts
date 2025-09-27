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

// ---- システム指示 ----
const systemDict: Record<Lang, string> = {
  ja: "あなたはオセロの友達コーチです。事実に基づき、存在しない手や無理な戦略は述べません。常に短く楽しいコメントをしてください。挨拶は不要、日本語で200文字以内。",
  en: "You are a friendly Othello coach. Stick to facts, never suggest impossible moves or strategies. Always reply with short and fun comments. No greetings. Keep it under 200 characters in English.",
  es: "Eres un amigo entrenador de Othello. Responde siempre con comentarios breves y divertidos basados en hechos. Sin saludos. Menos de 200 caracteres en español.",
  de: "Du bist ein freundlicher Othello-Coach. Halte dich an die Fakten und schlage niemals unmögliche Züge oder Strategien vor. Antworte immer kurz und unterhaltsam. Keine Begrüßung. Unter 200 Zeichen auf Deutsch.",
  it: "Sei un amico coach di Othello. Attieniti ai fatti, non suggerire mai mosse impossibili. Rispondi sempre con commenti brevi e divertenti. Nessun saluto. Sotto i 200 caratteri in italiano.",
  fr: "Tu es un coach amical d’Othello. Reste factuel, ne propose jamais de coups impossibles. Réponds toujours avec des commentaires courts et amusants. Pas de salutations. Moins de 200 caractères en français.",
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
    5: "今回の合法手の中に角があります。必ず角の価値に触れてください。『右上の角』『右下の角』など自然な言葉で説明してください。",
    6: "ゲームは終盤です。残りの手数はわずかです。最後の数手に集中するよう短いコメントをしてください。",
    7: "すでに勝敗は確定しています。この状況に合った短いコメントを返してください。勝ちなら称賛、負けなら労い、引き分けならユーモアを交えてください。",
  },
  en: {
    0: "Focus on basic opening strategies. Corners are powerful, avoid taking edges too early, and build central control.",
    1: "No legal moves available. You must pass. Provide a short comment that fits this situation.",
    2: "Only one legal move is available. Mention the lack of choice while keeping the tone positive.",
    3: "Two legal moves are available. Suggest one naturally while acknowledging the choice.",
    4: "Multiple legal moves available. Give strategic advice based on the game phase (opening=expansion, midgame=stability, endgame=stone count).",
    5: "A corner move is available. Always highlight the value of corners. Use natural phrases like 'top-right corner' or 'bottom-left corner'.",
    6: "It's the endgame. Only a few moves remain. Give a short comment about focusing on the final stage.",
    7: "The result is already decided. Respond with a fitting short comment: praise for winning, encouragement for losing, or humor for a draw.",
  },
  es: {
    0: "Concéntrate en las estrategias básicas de apertura. Las esquinas son poderosas, evita tomar los bordes demasiado pronto y controla el centro.",
    1: "No hay movimientos legales disponibles. Debes pasar. Devuelve un comentario breve que encaje con esta situación.",
    2: "Solo hay un movimiento legal disponible. Menciona la falta de opciones con un tono positivo.",
    3: "Hay dos movimientos posibles. Recomienda uno naturalmente reconociendo la elección.",
    4: "Hay varios movimientos posibles. Da un consejo estratégico según la fase (apertura=expansión, medio juego=estabilidad, final=conteo).",
    5: "Hay una jugada en la esquina. Destaca siempre el valor de las esquinas. Usa frases naturales como 'esquina superior derecha'.",
    6: "Es el final del juego. Quedan pocos movimientos. Haz un comentario breve sobre enfocarse en la recta final.",
    7: "El resultado ya está decidido. Responde con un comentario breve apropiado: elogio si ganas, ánimo si pierdes o humor si empatas.",
  },
  de: {
    0: "Konzentriere dich auf grundlegende Eröffnungsstrategien. Ecken sind stark, vermeide es, Kanten zu früh zu nehmen, und baue zentrale Kontrolle auf.",
    1: "Keine legalen Züge verfügbar. Du musst passen. Gib einen kurzen Kommentar, der passt.",
    2: "Nur ein legaler Zug ist verfügbar. Erwähne die fehlende Wahl, aber bleibe positiv.",
    3: "Zwei legale Züge verfügbar. Schlage einen vor, während du die Wahl anerkennst.",
    4: "Mehrere legale Züge verfügbar. Gib strategischen Rat je nach Phase (Anfang=Expansion, Mittelspiel=Stabilität, Endspiel=Steine zählen).",
    5: "Ein Eckzug ist verfügbar. Hebe immer den Wert der Ecken hervor. Verwende natürliche Phrasen wie 'rechte obere Ecke'.",
    6: "Es ist das Endspiel. Nur wenige Züge bleiben. Mach einen kurzen Kommentar über die Konzentration auf die letzte Phase.",
    7: "Das Ergebnis steht bereits fest. Antworte mit einem passenden kurzen Kommentar: Lob für den Sieg, Trost für die Niederlage oder Humor für ein Unentschieden.",
  },
  it: {
    0: "Concentrati sulle strategie di apertura di base. Gli angoli sono potenti, evita di prendere i bordi troppo presto e controlla il centro.",
    1: "Nessuna mossa legale disponibile. Devi passare. Fornisci un breve commento che si adatti alla situazione.",
    2: "C'è solo una mossa legale. Sottolinea la mancanza di scelta mantenendo un tono positivo.",
    3: "Ci sono due mosse possibili. Consigliane una naturalmente riconoscendo la scelta.",
    4: "Ci sono diverse mosse possibili. Dai un consiglio strategico in base alla fase (apertura=espansione, medio gioco=stabilità, finale=conteggio).",
    5: "C'è una mossa d'angolo disponibile. Sottolinea sempre il valore degli angoli. Usa frasi naturali come 'angolo in alto a destra'.",
    6: "È la fase finale. Restano solo poche mosse. Fai un breve commento sul concentrarsi sull'ultima fase.",
    7: "Il risultato è già deciso. Rispondi con un commento breve adeguato: lode per la vittoria, incoraggiamento per la sconfitta o umorismo per il pareggio.",
  },
  fr: {
    0: "Concentrez-vous sur les stratégies de base de l’ouverture. Les coins sont puissants, évitez de prendre les bords trop tôt et contrôlez le centre.",
    1: "Aucun coup légal disponible. Vous devez passer. Fournissez un court commentaire adapté à cette situation.",
    2: "Un seul coup légal est disponible. Mentionnez le manque de choix en gardant un ton positif.",
    3: "Deux coups légaux disponibles. Suggérez-en un naturellement en reconnaissant le choix.",
    4: "Plusieurs coups légaux disponibles. Donnez un conseil stratégique selon la phase (ouverture=expansion, milieu=stabilité, finale=comptage).",
    5: "Un coup dans le coin est disponible. Soulignez toujours la valeur des coins. Utilisez des expressions naturelles comme 'coin supérieur droit'.",
    6: "C’est la fin de partie. Il ne reste que quelques coups. Faites un court commentaire sur la concentration pour la fin.",
    7: "Le résultat est déjà décidé. Répondez avec un court commentaire adapté : félicitations pour une victoire, encouragements pour une défaite ou humour pour un match nul.",
  },
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
  lines.push(`Turn: ${localizedStatus}`)
  lines.push(`Phase: ${phase}`)
  lines.push(`Board:\n${boardStr}`)
  if (includeMoves && moves.length > 0) {
    const formatted = moves.map(m => `(x=${m.x+1},y=${m.y+1})`).join(", ")
    lines.push(`Legal moves: ${formatted}`)
  }
  lines.push(caseInstruction)

  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: systemDict[lang] + "\n\n" + lines.join("\n"),
          },
        ],
      },
    ],
  }
}