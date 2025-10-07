export default {
  async fetch(request, env) {
    const result: Record<string, any> = {}

    try {
      const rawKey = env.SA_PRIVATE_KEY
      if (!rawKey) {
        return new Response(JSON.stringify({ error: "SA_PRIVATE_KEY not set" }, null, 2), {
          headers: { "content-type": "application/json" },
        })
      }

      // 改行が含まれているかチェック
      const hasNewlines = /[\r\n]/.test(rawKey)
      result["has_newlines"] = hasNewlines

      // 改行を除去したバージョンを作成
      const cleanedKey = rawKey.replace(/[\r\n]/g, "")
      result["cleaned_length"] = cleanedKey.length

      // Base64 decode 試行
      try {
        const decoded = atob(cleanedKey)
        result["decoded_preview"] = decoded.slice(0, 64)
        result["decoded_length"] = decoded.length
        result["decode_ok"] = true
      } catch (e) {
        result["decode_ok"] = false
        result["decode_error"] = e.message
      }

      // 改行の位置を特定（デバッグ用）
      const newlinePositions = []
      for (let i = 0; i < rawKey.length; i++) {
        if (rawKey[i] === "\n" || rawKey[i] === "\r") newlinePositions.push(i)
      }
      result["newline_positions_sample"] = newlinePositions.slice(0, 10)

      return new Response(JSON.stringify(result, null, 2), {
        headers: { "content-type": "application/json" },
      })
    } catch (e) {
      return new Response(
        JSON.stringify({ error: e.message, stack: e.stack }, null, 2),
        { headers: { "content-type": "application/json" } }
      )
    }
  },
}
