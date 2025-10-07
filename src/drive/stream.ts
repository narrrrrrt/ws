/**
 * Google Drive Streaming Worker（改行除去対応・Base64/PEM両対応）
 */

export async function streamDriveAudio(env: any): Promise<Response> {
  try {
    const email = env.SA_EMAIL;
    let keyRaw = env.SA_PRIVATE_KEY_B64 || env.SA_PRIVATE_KEY;
    const fileId = env.DRIVE_FILE_ID;

    if (!email || !keyRaw) {
      return new Response("Missing env vars", { status: 500 });
    }

    // 🔹 改行や余計な空白を削除（どんな形式でも安全）
    keyRaw = keyRaw.replace(/(\\r|\\n|\r|\n)/g, "").trim();

    // 🔹 Base64 or PEM 判定してバイト列化
    let keyBytes: Uint8Array;
    if (/^-----BEGIN/.test(keyRaw)) {
      // PEMの場合 → ラベルを削除して Base64 部分を抽出
      const b64 = keyRaw
        .replace(/-----BEGIN PRIVATE KEY-----/, "")
        .replace(/-----END PRIVATE KEY-----/, "")
        .replace(/\s+/g, "");
      keyBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    } else {
      // Base64の場合
      keyBytes = Uint8Array.from(atob(keyRaw), (c) => c.charCodeAt(0));
    }

    // 🔹 アクセストークンを生成
    const token = await getAccessToken(email, keyBytes);

    // 🔹 Debug用出力
    const debug = {
      SA_EMAIL: email,
      key_length: keyRaw.length,
      decoded_bytes: keyBytes.length,
      access_token_preview: token?.slice(0, 40) + "...",
    };

    return new Response(JSON.stringify(debug, null, 2), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response("Worker error: " + err.message, { status: 500 });
  }
}

// =========================================================
// JWT生成＋Google OAuthトークン取得
// =========================================================
async function getAccessToken(email: string, keyBytes: Uint8Array): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64urlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64urlEncode(JSON.stringify({
    iss: email,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyBytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    new TextEncoder().encode(unsigned)
  );

  const signature = base64urlEncode(new Uint8Array(sig));
  const jwt = `${unsigned}.${signature}`;

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!resp.ok) {
    throw new Error(`Token request failed: ${resp.status} ${await resp.text()}`);
  }

  const json = await resp.json();
  return json.access_token;
}

// =========================================================
// Base64URL エンコード
// =========================================================
function base64urlEncode(input: string | Uint8Array): string {
  let bin = typeof input === "string"
    ? input
    : String.fromCharCode(...input);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
