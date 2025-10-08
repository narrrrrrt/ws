/**
 * Google Drive 上のファイルを Cloudflare Workers 経由で
 * ストリーミング配信する安全な実装（内部固定鍵版）
 *
 * index.ts から呼び出して使う:
 *   return await streamDriveAudio(env);
 */

export async function streamDriveAudio(env: any): Promise<Response> {
  try {
    // === 内部固定（折り返し防止） ===
    const SA_EMAIL = "drive-proxy@inductive-seer-474403-f5.iam.gserviceaccount.com";
    const DRIVE_FILE_ID = "1ECFhj_xq3n24C1JsvPoD4QbBPS-HRIxN";
    const SA_PRIVATE_KEY = `
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDWjZL0DojRy8+X
b5TODjjMGk9QS1wiS0jdDf+JUtj6yjRIgsUjxztuTX4c3I9ior+sVDDlZz6P8B4F
YmKN1zkUIDWxxfKNf2gvWMRUKHTdrkTMiasX/JGIRGl7pXKWrVLoafLLrkEPbcZU
fyco7+MsGU5jVneT6lRxioJVGMKqlPnteW148EtpOUBPWxSXju6J2OMgVZvglnEE
jRfXLibzxVBctVOxHOA7iLSlJN3vhVeRGwj3WiGNQl2AvEDWywikAZXgR5ZzK8M7
QNm8PWjmKAryrlmOL4EZi9HllLr5xSFFupsWJd4+wPTCB066AphM0wBEO9WuJi+t
4N4aQPcJAgMBAAECggEAEwUwl2eodAzahbhnG5zoJrPx/xJg0LHi4j68JItOYAeu
YRU/iJ+NCO2Tj6RzJt5HTSD9LeeCuAjxG5VJ9Mm1Li/fnFE9L2BLNxNQyFmTzq+e
oSrwZ4Teml/fCA6cdqrwtCW18Z35KsOwQ7JhoT/u+dK+f8Qp5dhUWk9ApNTRzerG
3PU/u3wTVUVN/0SEnj8FjaK/UbD/IBYiQhTQfm9BIklVAYEI5gIfLHdr1IBN5uTu
lqdZ3L5GLJUKRJUonD+yMBSv2mQzBddbYmXbDIsBSCkOmPTGqMAabnh6IHmPtqwo
N5YMsDx0T01cCcAUje0+Q9rnUIj9wqdtCkfbzV9Y5wKBgQD4hDnvZ4NsxXEbjTHe
M2H6aCFMMDRF8h5YpcMFOhP6sCxecdUSNk0Lt+4MK0o3ytkBCPdeT7hdx8uIoZUr
2AwG3vN4IrJXnDV03Srr2b0QqonueLZ1qdMMbiqELnmBPdcknBbeUqVXJ9xj2QXV
XF/Z+Rc0JSUqNQVgwzSU9cHDfwKBgQDdA4dYkJcGEchg58AOsmBZMiKIJPp1WVc0
buL8oy9nWbEmI5d8cCt32ccfODm+udUz2cSnSeZrB+xhPcWTb+mA+JVMkkV8pir/
5fFGmukHHEvO7y0jqtEgNO9JeEBbkYDAZEpuod36cXFtqxsLIRx8FnGXuGiwOJuT
ec1OnABpdwKBgC0HsIO7qumzoPoQDIApqVA5PAdVGLOv2mXPq1WwH1ymPXPjhmsl
YbKE4mJcGbegTs/MMx5orYx4nl2kgaYPIKbCETWse8o6KMmDJbrUmliBvjpyrwUE
/5PaBmQrE6MidHBSxCYGraTsORfyhAcUFN4nL1gofuJ19wKAfG+dVD27AoGAd0Gn
L5fdlg3UZM3IaWXA7YBK99GUP+v0TTukSZQ4SPkxyJWd8SyJmAMwGd158ztNGsxf
+7C5n3lICHSPfu39PnVkAkxPKGJ1g11tIp8GLKsNEN0oKz3J2CoYEDnN6FsL8URs
kWPQZon+HaIdVpUITMDDjI2aF7SD5kDsEoXFByMCgYEA480sIcKyWTt+FTtcsH5d
btye53Kx/rPbF7Kk81AZb1iFlWTtuYufYJ3KHkrXeXfGbM68B65IO9WLKk3CQl99
Pv5fjHAI22fLGiKDR1a2vDoVtnfQMu0StBVkmSVLiDtuSkKPTXufHkFjHJsq3ELS
DQLeZS1fJgTD8LUcjYXD77g=
-----END PRIVATE KEY-----
`;

    // === JWTトークン生成 ===
    const now = Math.floor(Date.now() / 1000);
    const header = base64urlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const payload = base64urlEncode(JSON.stringify({
      iss: SA_EMAIL,
      scope: "https://www.googleapis.com/auth/drive.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }));
    const unsignedJWT = `${header}.${payload}`;

    const key = await importPrivateKey(SA_PRIVATE_KEY);
    const sig = await crypto.subtle.sign(
      { name: "RSASSA-PKCS1-v1_5" },
      key,
      new TextEncoder().encode(unsignedJWT)
    );
    const signature = base64urlEncode(new Uint8Array(sig));
    const jwt = `${unsignedJWT}.${signature}`;

    // === アクセストークン取得 ===
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return new Response("Token fetch failed", { status: 500 });
    }

    // === Driveファイルフェッチ ===
    const driveUrl = `https://www.googleapis.com/drive/v3/files/${DRIVE_FILE_ID}?alt=media`;

    // ★ Range を Drive に中継（Safari の audio 再生に必須）
    const driveHeaders: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
    };
    if (env.__requestRange) {
      driveHeaders["Range"] = env.__requestRange;
    }

    const res = await fetch(driveUrl, { headers: driveHeaders });

    if (res.status === 404) {
      return new Response("File not found on Google Drive", { status: 404 });
    }

    // === ヘッダー整形（Content-Range 等を透過）
    //    Content-Type は明示的に audio/m4a を優先しつつ、Range関連は転写
    const outHeaders = new Headers();
    outHeaders.set("Content-Type", "audio/m4a");
    outHeaders.set("Cache-Control", "public, max-age=3600");
    outHeaders.set("Access-Control-Allow-Origin", "*");

    // ★ Range 応答ヘッダーを透過
    for (const h of ["Content-Range", "Accept-Ranges", "Content-Length", "ETag", "Last-Modified"]) {
      const v = res.headers.get(h);
      if (v) outHeaders.set(h, v);
    }

    // === ストリーミング中継（TransformStream）
    if (!res.body) {
      return new Response("No body in Drive response", { status: 500 });
    }
    const { readable, writable } = new TransformStream();
    // 重要: pipeTo は await しない（逐次配信）
    res.body.pipeTo(writable);

    // ★ ここで res.status をそのまま返す（200 でも 206 でも）
    return new Response(readable, {
      status: res.status,
      headers: outHeaders,
    });

  } catch (err: any) {
    return new Response("Worker error: " + err.message, { status: 500 });
  }
}

// =========================================================
// PEM 形式の秘密鍵をインポート
// =========================================================
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const binary = atob(pem.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "").replace(/\s+/g, ""));
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return crypto.subtle.importKey(
    "pkcs8",
    buf,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

// =========================================================
// Base64URL エンコード
// =========================================================
function base64urlEncode(input: string | Uint8Array): string {
  let str = typeof input === "string" ? input : String.fromCharCode(...input);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
