// --- 言語型 ---
export type Lang = "ja" | "en" | "es" | "de" | "it" | "fr"

// --- 合法手（座標） ---
export interface Move {
  x: number
  y: number
}

// --- システムプロンプト ---
const systemDict: Record<Lang, string> = {
  ja: "あなたはオセロの友達コーチです。事実に基づき、存在しない手や無理な戦略は述べません。常に短く楽しいコメントをしてください。挨拶は不要、日本語で200文字以内。",
  en: "You are a friendly Othello coach. Always give factual, short, and fun comments. Do not invent moves. No greetings. Respond in English under 200 characters.",
  es: "Eres un entrenador amistoso de Othello. Da comentarios basados en hechos, cortos y divertidos. No inventes movimientos. Sin saludos. Responde en español con menos de 200 caracteres.",
  de: "Du bist ein freundlicher Othello-Coach. Gib immer sachliche, kurze und unterhaltsame Kommentare. Keine erfundenen Züge. Keine Grüße. Antworte auf Deutsch unter 200 Zeichen.",
  it: "Sei un allenatore amichevole di Othello. Dai commenti basati sui fatti, brevi e divertenti. Non inventare mosse. Nessun saluto. Rispondi in italiano entro 200 caratteri.",
  fr: "Vous êtes un entraîneur amical d'Othello. Donnez toujours des commentaires factuels, courts et amusants. N'inventez pas de coups. Pas de salutations. Répondez en français sous 200 caractères.",
}

// --- 黒/白 ---
const statusDict: Record<Lang, { black: string; white: string }> = {
  ja: { black: "黒", white: "白" },
  en: { black: "Black", white: "White" },
  es: { black: "Negras", white: "Blancas" },
  de: { black: "Schwarz", white: "Weiß" },
  it: { black: "Nero", white: "Bianco" },
  fr: { black: "Noir", white: "Blanc" },
}

// --- フェーズ ---
const phaseDict: Record<Lang, { opening: string; midgame: string; endgame: string }> = {
  ja: { opening: "序盤", midgame: "中盤", endgame: "終盤" },
  en: { opening: "opening", midgame: "midgame", endgame: "endgame" },
  es: { opening: "apertura", midgame: "medio juego", endgame: "final" },
  de: { opening: "Eröffnung", midgame: "Mittelspiel", endgame: "Endspiel" },
  it: { opening: "apertura", midgame: "medio gioco", endgame: "finale" },
  fr: { opening: "ouverture", midgame: "milieu de partie", endgame: "fin de partie" },
}

// --- 枕言葉 ---
const roleHeaderDict: Record<Lang, Record<"black" | "white", string>> = {
  ja: { black: "あなたは黒のプレイヤーのコーチです。", white: "あなたは白のプレイヤーのコーチです。" },
  en: { black: "You are the coach of the Black player.", white: "You are the coach of the White player." },
  es: { black: "Eres el entrenador del jugador de Negras.", white: "Eres el entrenador del jugador de Blancas." },
  de: { black: "Du bist der Coach des schwarzen Spielers.", white: "Du bist der Coach des weißen Spielers." },
  it: { black: "Sei l'allenatore del giocatore Nero.", white: "Sei l'allenatore del giocatore Bianco." },
  fr: { black: "Vous êtes l'entraîneur du joueur Noir.", white: "Vous êtes l'entraîneur du joueur Blanc." },
}

// --- ケースごとの指示 ---
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

// --- クロージング ---
const closingDict: Record<Lang, string> = {
  ja: "コメントは200文字以内、改行は最大で7行までにしてください。短く、楽しく、フレンドリーに。挨拶は不要です。",
  en: "Keep the comment under 200 characters, with a maximum of 7 line breaks. Short, fun, and friendly. No greetings.",
  es: "Mantén el comentario por debajo de 200 caracteres, con un máximo de 7 saltos de línea. Corto, divertido y amigable. Sin saludos.",
  de: "Halte den Kommentar unter 200 Zeichen, mit maximal 7 Zeilenumbrüchen. Kurz, unterhaltsam und freundlich. Keine Grüße.",
  it: "Mantieni il commento sotto i 200 caratteri, con un massimo di 7 interruzioni di riga. Breve, divertente e amichevole. Niente saluti.",
  fr: "Gardez le commentaire sous 200 caractères, avec un maximum de 7 sauts de ligne. Court, amusant et amical. Pas de salutations.",
}

// --- 合法手（X=◯, Y=◯ 形式に変換） ---
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

// --- 角を言語別に表現 ---
function moveToCornerName(m: Move, lang: Lang): string {
  const dict: Record<Lang, Record<string, string>> = {
    ja: { "0,0": "左上角", "7,0": "右上角", "0,7": "左下角", "7,7": "右下角" },
    en: { "0,0": "top-left corner", "7,0": "top-right corner", "0,7": "bottom-left corner", "7,7": "bottom-right corner" },
    es: { "0,0": "esquina superior izquierda", "7,0": "esquina superior derecha", "0,7": "esquina inferior izquierda", "7,7": "esquina inferior derecha" },
    de: { "0,0": "linke obere Ecke", "7,0": "rechte obere Ecke", "0,7": "linke untere Ecke", "7,7": "rechte untere Ecke" },
    it: { "0,0": "angolo in alto a sinistra", "7,0": "angolo in alto a destra", "0,7": "angolo in basso a sinistra", "7,7": "angolo in basso a destra" },
    fr: { "0,0": "coin supérieur gauche", "7,0": "coin supérieur droit", "0,7": "coin inférieur gauche", "7,7": "coin inférieur droit" },
  }
  return dict[lang][`${m.x},${m.y}`] || ""
}

// --- 本体 ---
export function buildReversiChat(
  lang: Lang,
  role: "black" | "white",
  status: "black" | "white",
  phase: "opening" | "midgame" | "endgame",
  caseId: number,
  board: string[],
  moves: Move[] = []
) {
  const lines: string[] = []

  // 枕言葉
  lines.push(roleHeaderDict[lang][role])
  lines.push(`${statusDict[lang][status]}の手番、${phaseDict[lang][phase]}です。`)

  // ケース別コメント
  lines.push(caseDict[caseId][lang])

  // 合法手（必要な場合のみ）
  if (caseId === 2 && moves.length === 1) {
    lines.push(moveToHumanReadable(moves[0], lang))
  }
  if (caseId === 3 && moves.length === 2) {
    moves.forEach((m) => lines.push(moveToHumanReadable(m, lang)))
  }
  if (caseId === 5) {
    moves.forEach((m) => {
      const cornerName = moveToCornerName(m, lang)
      if (cornerName) {
        lines.push(`${cornerName}`)
      }
    })
  }

  // ボードデータの意味補足
  lines.push(
    lang === "ja"
      ? "盤面データの意味: B=黒, W=白, -=空き"
      : "Board data legend: B=Black, W=White, -=Empty"
  )

  // 実際のボード
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