// public/js/lang.js
let dict = {}

const supported = ["ja", "es", "de", "it", "fr"]

export function detectLanguage(candidate) {
  let lang = (candidate || (navigator.language || "en")).toLowerCase()
  lang = lang.split("-")[0]
  if (!supported.includes(lang)) lang = "en"
  return lang
}

export async function loadMessages(lang) {
  const res = await fetch("/i18n/messages.json")
  const all = await res.json()

  const d = {}
  for (const [key, value] of Object.entries(all)) {
    d[key] = value[lang] || value.en || key
  }
  dict = d
}

export function t(key, vars = {}) {
  let s = dict[key] || key
  for (const [k, v] of Object.entries(vars)) {
    s = s.replaceAll(`{${k}}`, String(v))
  }
  return s
}