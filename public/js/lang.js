// lang.js
let messages = {}

const supported = ["ja", "es", "de", "it", "fr"]

export function detectLanguage(candidate) {
  let lang = candidate || (navigator.language || navigator.userLanguage).split("-")[0]
  if (!supported.includes(lang)) {
    lang = "en"
  }
  return lang
}

export async function loadMessages(lang) {
  const res = await fetch("/i18n/messages.json")
  const allMessages = await res.json()
  messages = allMessages[lang] || allMessages["en"]
}

export function t(key) {
  return messages[key] || key
}