/**
 * Google Drive 上のファイルを Cloudflare Workers 経由で
 * ストリーミング配信する安全な実装（Base64鍵対応版）
 *
 * 必要な環境変数:
 * - SA_EMAIL             サービスアカウントの client_email
 * - SA_PRIVATE_KEY_B64   PEM を Base64 化したもの（1行で保存）
 * - DRIVE_FILE_ID        Google Drive のファイルID
 */

export async function streamDriveAudio(env: any): Promise<Response> {
  try {
    const FILE_ID = env.DRIVE_FILE_ID;
    const email = env.SA_EMAIL;
    const b64Key = env.SA_PRIVATE_KEY_B64;

    if (!FILE_ID || !email || !b64Key) {
      return new Response("Missing environment variables", { status: 500 });
    }

    // 1️⃣ アクセストークンを取得
    const token = await getAccessToken(email, b64Key);

    // 2️⃣ Range対応リクエストで Google Drive ファイルを取得
    const driveUrl = `https://www.googleapis.com/drive/v3/files/${FILE_ID}?alt=media`;
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

    const range = env.requestHeaders?.Range;
    if (range) headers["Range"] = range;

    const res = await fetch(driveUrl, { headers });

    // 3️⃣ 音声レスポンス返却
    const outHeaders = new Headers();
    outHeaders.set("Content-Type", "audio/m4a");
    outHeaders.set("Cache-Control", "public, max-age=3600");
    outHeaders.set("Access-Control-Allow-Origin", "*");
    outHeaders.set("Content-Disposition", 'inline; filename="audio.m4a"');

    // Range系ヘッダーを転送
    for (const h of ["Content-Range", "Accept-Ranges", "Content-Length"]) {
      const v = res.headers.get(h);
      if (v) outHeaders.set(h, v);
    }

    return new Response(res.body, { status: res.status, headers: outHeaders });

  } catch (err: any) {
    return new Response("Worker error: " + err.message, { status: 500 });
  }
}

// =========================================================
// JWT を生成し、Google Drive API 用アクセストークンを取得
// =========================================================

async function getAccessToken(clientEmail: string, privateKeyB64: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64urlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64urlEncode(JSON.stringify({
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const unsignedJWT = `${header}.${payload}`;

  const key = await importPrivateKeyFromBase64(privateKeyB64);
  const sig = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    new TextEncoder().encode(unsignedJWT)
  );
  const signature = base64urlEncode(new Uint8Array(sig));
  const jwt = `${unsignedJWT}.${signature}`;

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Token request failed: ${resp.status} ${txt}`);
  }

  const data = await resp.json();
  return data.access_token;
}

// =========================================================
// Base64形式の秘密鍵をインポート
// =========================================================

async function importPrivateKeyFromBase64(b64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    raw,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

// =========================================================
// Base64URL エンコード
// =========================================================
function base64urlEncode(input: string | Uint8Array): string {
  let bin = "";
  if (typeof input === "string") {
    bin = input;
  } else {
    bin = String.fromCharCode(...input);
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
