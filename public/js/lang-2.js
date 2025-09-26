// --- グローバル変数 ---
let i18n = null;
let currentLang = "en"; // detectLanguage() で決定する

// --- 言語検出 ---
function detectLanguage() {
  const lang = (navigator.language || "en").toLowerCase();
  if (lang.startsWith("ja")) return "ja";
  if (lang.startsWith("es")) return "es";
  if (lang.startsWith("de")) return "de";
  if (lang.startsWith("it")) return "it";
  if (lang.startsWith("fr")) return "fr";
  return "en"; // fallback
}

// --- i18n utility ---
async function loadMessages() {
  const res = await fetch("/i18n/messages.json");
  i18n = await res.json();
  currentLang = detectLanguage();
}

function t(key, vars = {}) {
  // JSONがまだ読み込まれていない or 該当キーがない場合はそのまま返す
  if (!i18n || !i18n[key]) return key;

  let text = i18n[key][currentLang] || i18n[key]["en"] || key;

  // 置換処理 {black}, {white} など
  for (const [k, v] of Object.entries(vars)) {
    text = text.replace(`{${k}}`, v);
  }
  return text;
}