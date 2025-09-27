// ---- 型定義 ----
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

const systemDict: Record<Lang, string> = {
  ja: "あなたはオセロの友達コーチです。事実に基づき、存在しない手や無理な戦略は述べません。常に短く楽しいコメントをしてください。挨拶は不要、日本語で200文字以内。",
  en: "You are a friendly Othello coach. Stick to facts, never suggest impossible moves. Always reply with short and fun comments. No greetings. Keep it under 200 characters in English.",
  es: "Eres un amigo entrenador de Othello. Responde con comentarios breves y divertidos basados en hechos. Sin saludos. Menos de 200 caracteres en español.",
  de: "Du bist ein freundlicher Othello-Coach. Halte dich an die Fakten. Gib immer kurze, unterhaltsame Kommentare. Keine Begrüßung. Unter 200 Zeichen auf Deutsch.",
  it: "Sei un amico coach di Othello. Rispondi sempre con commenti brevi e divertenti basati sui fatti. Nessun saluto. Sotto i 200 caratteri in italiano.",
  fr: "Vous êtes un coach amical d’Othello. Donnez toujours des commentaires courts et amusants basés sur les faits. Pas de salutations. Moins de 200 caractères en français.",
}

const roleHeaderDict: Record<Lang, Record<Status, string>> = {
  ja: { black: "あなたは黒のプレイヤーのコーチです。", white: "あなたは白のプレイヤーのコーチです。" },
  en: { black: "You are the coach of the Black player.", white: "You are the coach of the White player." },
  es: { black: "Eres el entrenador del jugador de Negras.", white: "Eres el entrenador del jugador de Blancas." },
  de: { black: "Du bist der Coach des schwarzen Spielers.", white: "Du bist der Coach des weißen Spielers." },
  it: { black: "Sei l'allenatore del giocatore Nero.", white: "Sei l'allenatore del giocatore Bianco." },
  fr: { black: "Vous êtes l'entraîneur du joueur Noir.", white: "Vous êtes l'entraîneur du joueur Blanc." },
}

// ---- クロージング ----
const closingDict: Record<Lang, string> = {
  ja: "コメントは200文字以内、改行は最大で7行までにしてください。短く、楽しく、フレンドリーに。挨拶は不要です。",
  en: "Keep the comment under 200 characters, with at most 7 line breaks. Short, fun, and friendly. No greetings.",
  es: "Mantén el comentario por debajo de 200 caracteres, con un máximo de 7 saltos de línea. Corto, divertido y amistoso. Sin saludos.",
  de: "Halte den Kommentar unter 200 Zeichen, mit höchstens 7 Zeilenumbrüchen. Kurz, unterhaltsam und freundlich. Keine Grüße.",
  it: "Mantieni il commento sotto i 200 caratteri, con massimo 7 interruzioni di riga. Breve, divertente e amichevole. Nessun saluto.",
  fr: "Gardez le commentaire sous 200 caractères, avec au maximum 7 sauts de ligne. Court, amusant et amical. Pas de salutations.",
}

// ---- ケース分類 ----
function countPieces(board: string[]): number {
  return board.join("").replace(/-/g, "").length
}

function isCorner(move: Move): boolean {
  return (move.x === 0 || move.x === 7) && (move.y === 0 || move.y === 7)
}

function detectPhase(board: string[]): "opening" | "midgame" | "endgame" {
  const n = countPieces(board)
  if (n < 20) return "opening"
  if (n < 50) return "midgame"
  return "endgame"
}

function classifyCase(board: string[], moves: Move[], turnCount: number): number {
  const pieceCount = countPieces(board)
  const empties = 64 - pieceCount
  const blacks = board.join("").split("B").length - 1
  const whites = board.join("").split("W").length - 1
  if (Math.abs(blacks - whites) > empties) return 7
  if (!moves || moves.length === 0) return 1
  if (turnCount < 8 && pieceCount <= 16) return 0
  if (moves.some(isCorner)) return 5
  if (pieceCount > 50) return 6
  if (moves.length === 1) return 2
  if (moves.length === 2) return 3
  return 4
}

// ---- 候補手表現 ----
function moveToHumanReadable(m: Move, lang: Lang): string {
  const pos = `X=${m.x + 1}, Y=${m.y + 1}`
  const dict: Record<Lang, string> = {
    ja: `候補手: ${pos}`,
    en: `Candidate: ${pos}`,
    es: `Jugada posible: ${pos}`,
    de: `Möglicher Zug: ${pos}`,
    it: `Mossa possibile: ${pos}`,
    fr: `Coup possible: ${pos}`,
  }
  return dict[lang]
}

function moveToCornerName(m: Move, lang: Lang): string {
  const dict: Record<Lang, Record<string, string>> = {
    ja: { "0,0": "左上角", "7,0": "右上角", "0,7": "左下角", "7,7": "右下角" },
    en: { "0,0": "top-left corner", "7,0": "top-right corner", "0,7": "bottom-left corner", "7,7": "bottom-right corner" },
    es: { "0,0": "esquina superior izquierda", "7,0": "esquina superior derecha", "0,7": "esquina inferior izquierda", "7,7": "esquina inferior derecha" },
    de: { "0,0": "linke obere Ecke", "7,0": "rechte obere Ecke", "0,7": "linke untere Ecke", "7,7": "rechte untere Ecke" },
    it: { "0,0": "angolo in alto a sinistra", "7,0": "angolo in alto a destra", "0,7": "angolo in basso a sinistra", "7,7": "angolo in basso a destra" },
    fr: { "0,0": "coin supérieur gauche", "7,0": "coin supérieur droit", "0,7": "coin inférieur gauche", "7,7": "coin inférieur droit" },
  }
  return dict[lang][`${m.x},${m.y}`] || moveToHumanReadable(m, lang)
}

// ---- ケース別プロンプト ----
const caseDict: Record<number, Record<Lang, string>> = {
  0: {
    ja: "序盤です。軽い雑談を交えてコメントしてください。",
    en: "It's the opening. Add a light, casual remark.",
    es: "Es la apertura. Añade un comentario ligero y casual.",
    de: "Es ist die Eröffnung. Füge eine lockere Bemerkung hinzu.",
    it: "È l'apertura. Aggiungi un commento leggero e informale.",
    fr: "C'est l'ouverture. Ajoutez une remarque légère et décontractée.",
  },
  1: {
    ja: "今回は打てる手がなくパスになります。",
    en: "No valid moves, so it's a pass.",
    es: "No hay movimientos válidos, así que es un pase.",
    de: "Keine gültigen Züge, also ein Pass.",
    it: "Nessuna mossa valida, quindi è un passaggio.",
    fr: "Aucun coup valide, donc c'est un passage.",
  },
  2: {
    ja: "選択肢は一つしかありません。",
    en: "Only one option is available.",
    es: "Solo hay una opción disponible.",
    de: "Es gibt nur eine mögliche Option.",
    it: "C'è solo una possibilità disponibile.",
    fr: "Une seule option est disponible.",
  },
  3: {
    ja: "2つの候補があります。",
    en: "There are two possible moves.",
    es: "Hay dos movimientos posibles.",
    de: "Es gibt zwei mögliche Züge.",
    it: "Ci sono due mosse possibili.",
    fr: "Il y a deux coups possibles.",
  },
  4: {
    ja: "選択肢が多くあります。具体的な手は挙げずに全体感をコメントしてください。",
    en: "There are many options. Comment on the situation without listing every move.",
    es: "Hay muchas opciones. Comenta la situación sin enumerar todos los movimientos.",
    de: "Es gibt viele Möglichkeiten. Kommentiere die Situation, ohne alle Züge aufzulisten.",
    it: "Ci sono molte opzioni. Commenta la situazione senza elencare tutte le mosse.",
    fr: "Il y a de nombreuses options. Commentez la situation sans lister chaque coup.",
  },
  5: {
    ja: "角を狙える局面です。座標ではなく角の位置で表現してください。",
    en: "A corner is available. Refer to it by corner name, not coordinates.",
    es: "Una esquina está disponible. Refierete a ella por nombre de esquina, no coordenadas.",
    de: "Eine Ecke ist verfügbar. Benenne sie nach ihrer Position, nicht mit Koordinaten.",
    it: "Un angolo è disponibile. Indicalo per nome dell'angolo, non con coordinate.",
    fr: "Un coin est disponible. Référez-vous par le nom du coin, pas par les coordonnées.",
  },
  6: {
    ja: "終盤戦です。残り少ない局面をコメントしてください。",
    en: "It's the endgame. Comment on the final moves.",
    es: "Es el final de la partida. Comenta sobre los últimos movimientos.",
    de: "Es ist das Endspiel. Kommentiere die letzten Züge.",
    it: "È la fase finale. Commenta le mosse finali.",
    fr: "C'est la fin de partie. Commentez les derniers coups.",
  },
  7: {
    ja: "勝敗がほぼ確定しています。圧勝や健闘を称えてください。",
    en: "The game is nearly decided. Give praise or consolation.",
    es: "La partida está casi decidida. Da elogios o consuelo.",
    de: "Die Partie ist fast entschieden. Gib Lob oder Trost.",
    it: "La partita è quasi decisa. Dai elogi o consolazione.",
    fr: "La partie est presque décidée. Donnez des éloges ou des encouragements.",
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
  const phase = detectPhase(board)
  const moves = movesByColor?.[status] || []
  const caseId = classifyCase(board, moves, turnCount)

  const lines: string[] = []

  // 枕言葉
  lines.push(roleHeaderDict[lang][status])
  lines.push(`現在は${statusDict[lang][status]}の手番、${phaseDict[lang][phase]}です。`)

  // ケースごとの説明
  lines.push(caseDict[caseId][lang])

  // 候補手
  if (caseId === 2 && moves.length === 1) {
    lines.push(moveToHumanReadable(moves[0], lang))
  }
  if (caseId === 3 && moves.length === 2) {
    moves.forEach(m => lines.push(moveToHumanReadable(m, lang)))
  }
  if (caseId === 5) {
    moves.forEach(m => lines.push(moveToCornerName(m, lang)))
  }

  // ボードデータ補足
  lines.push(
    lang === "ja"
      ? "盤面データの意味: B=黒, W=白, -=空き"
      : "Board data legend: B=Black, W=White, -=Empty"
  )
  lines.push("現在の盤面:")
  lines.push(...board)

  // クロージング
  lines.push(closingDict[lang])

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