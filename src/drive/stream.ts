/**
 * Google Drive Streaming Worker (Base64 PEM対応・ローカル検証用)
 *
 * 期待する環境変数:
 * - SA_EMAIL             サービスアカウントの client_email
 * - SA_PRIVATE_KEY_B64   Base64化した秘密鍵 (1行)
 * - DRIVE_FILE_ID        テスト用ファイルID
 */

export async function streamDriveAudio(env: any): Promise<Response> {
  try {
    const email = env.SA_EMAIL;
    const b64Key = env.SA_PRIVATE_KEY_B64;
    const FILE_ID = env.DRIVE_FILE_ID;

    if (!email || !b64Key) {
      return new Response("❌ Missing environment vars", { status: 500 });
    }

    // Base64 → Uint8Arrayへ復元
    const keyBytes = Uint8Array.from(atob(b64Key), (c) => c.charCodeAt(0));

    // JWT 生成
    const token = await getAccessToken(email, keyBytes);

    // 🎯 Drive APIを叩く部分はコメントアウト（ここではトークン生成の確認だけ）
    // const driveUrl = `https://www.googleapis.com/drive/v3/files/${FILE_ID}?alt=media`;
    // const res = await fetch(driveUrl, { headers: { Authorization: `Bearer ${token}` } });

    const debug = {
      SA_EMAIL: email,
      SA_PRIVATE_KEY_B64_len: b64Key.length,
      decoded_len: keyBytes.length,
      access_token_sample: token?.slice(0, 40) + "...",
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

  // CryptoKeyへインポート
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

  // Google OAuth2へPOST
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
// Base64URLエンコード関数
// =========================================================
function base64urlEncode(input: string | Uint8Array): string {
  let bin = typeof input === "string"
    ? input
    : String.fromCharCode(...input);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
