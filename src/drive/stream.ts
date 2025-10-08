/**
 * Google Drive streaming (埋め込みBase64鍵対応版)
 */

const PRIVATE_KEY_B64 = `
LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRRFdqWkwwRG9qUnk4K1gKYjVUT0Rqak1HazlRUzF3aVMwamREZitKVXRqNnlqUklnc1VqeHp0dVRYNGMzSTlpb3Irc1ZERGxaejZQOEI0RgpZbUtOMXprVUlEV3h4ZktOZjJndldNUlVLSFRkcmtUTWlhc1gvSkdJUkdsN3BYS1dyVkxvYWZMTHJrRVBiY1pVCmZ5Y283K01zR1U1alZuZVQ2bFJ4aW9KVkdNS3FsUG50ZVcxNDhFdHBPVUJQV3hTWGp1NkoyT01nVlp2Z2xuRUUKalJmWExpYnp4VkJjdFZPeEhPQTdpTFNsSk4zdmhWZVJHd2ozV2lHTlFsMkF2RURXeXdpa0FaWGdSNVp6SzhNNwpRTm04UFdqbUtBcnlybG1PTDRFWmk5SGxsTHI1eFNGRnVwc1dKZDQrd1BUQ0IwNjZBcGhNMHdCRU85V3VKaSt0CjRONGFRUGNKQWdNQkFBRUNnZ0VBRXdVd2wyZW9kQXphaGJobkc1em9KclB4L3hKZzBMSGk0ajY4Skl0T1lBZXUKWVJVL2lKK05DTzJUajZSekp0NUhUU0Q5TGVlQ3VBanhHNVZKOU1tMUxpL2ZuRkU5TDJCTE54TlF5Rm1UenErZQpvU3J3WjRUZW1sL2ZDQTZjZHFyd3RDVzE4WjM1S3NPd1E3SmhvVC91K2RLK2Y4UXA1ZGhVV2s5QXBOVFJ6ZXJHCjNQVS91M3dUVlVWTi8wU0VuajhGamFLL1ViRC9JQllpUWhUUWZtOUJJa2xWQVlFSTVnSWZMSGRyMUlCTjV1VHUKbHFkWjNMNUdMSlVLUkpVb25EK3lNQlN2Mm1RekJkZGJZbVhiRElzQlNDa09tUFRHcU1BYWJuaDZJSG1QdHF3bwpONVlNc0R4MFQwMWNDY0FVamUwK1E5cm5VSWo5d3FkdENrZmJ6VjlZNXdLQmdRRDRoRG52WjROc3hYRWJqVEhlCk0ySDZhQ0ZNTURSRjhoNVlwY01GT2hQNnNDeGVjZFVTTmswTHQrNE1LMG8zeXRrQkNQZGVUN2hkeDh1SW9aVXIKMkF3RzN2TjRJckpYbkRWMDNTcnIyYjBRcW9udWVMWjFxZE1NYmlxRUxubUJQZGNrbkJiZVVxVlhKOXhqMlFYVgpYRi9aK1JjMEpTVXFOUVZnd3pTVTljSERmd0tCZ1FEZEE0ZFlrSmNHRWNoZzU4QU9zbUJaTWlLSUpQcDFXVmMwCmJ1TDhveTluV2JFbUk1ZDhjQ3QzMmNjZk9EbSt1ZFV6MmNTblNlWnJCK3hoUGNXVGIrbUErSlZNa2tWOHBpci8KNWZGR211a0hIRXZPN3kwanF0RWdOTzlKZUVCYmtZREFaRXB1b2QzNmNYRnRxeHNMSVJ4OEZuR1h1R2l3T0p1VAplYzFPbkFCcGR3S0JnQzBIc0lPN3F1bXpvUG9RRElBcHFWQTVQQWRWR0xPdjJtWFBxMVd3SDF5bVBYUGpobXNsClliS0U0bUpjR2JlZ1RzL01NeDVvcll4NG5sMmtnYVlQSUtiQ0VUV3NlOG82S01tREpiclVtbGlCdmpweXJ3VUUKLzVQYUJtUXJFNk1pZEhCU3hDWUdyYVRzT1JmeWhBY1VGTjRuTDFnb2Z1SjE5d0tBZkcrZFZEMjdBb0dBZDBHbgpMNWZkbGczVVpNM0lhV1hBN1lCSzk5R1VQK3YwVFR1a1NaUTRTUGt4eUpXZDhTeUptQU13R2QxNTh6dE5Hc3hmCis3QzVuM2xJQ0hTUGZ1MzlQblZrQWt4UEtHSjFnMTF0SXA4R0xLc05FTjBvS3ozSjJDb1lFRG5ONkZzTDhVUnMKa1dQUVpvbitIYUlkVnBVSVRNRERqSTJhRjdTRDVrRHNFb1hGQnlNQ2dZRUE0ODBzSWNLeVdUdCtGVHRjc0g1ZApidHllNTNLeC9yUGJGN0trODFBWmIxaUZsV1R0dVl1ZllKM0tIa3JYZVhmR2JNNjhCNjVJTzlXTEtrM0NRbDk5ClB2NWZqSEFJMjJmTEdpS0RSMWEydkRvVnRuZlFNdTBTdEJWa21TVkxpRHR1U2tLUFRYdWZIa0ZqSEpzcTNFTFMKRFFMZVpTMWZKZ1REOExVY2pZWEQ3N2c9Ci0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0=
`;

export async function streamDriveAudio(env: any): Promise<Response> {
  try {
    const FILE_ID = env.DRIVE_FILE_ID;
    const email = env.SA_EMAIL;
    let b64Key = env.SA_PRIVATE_KEY_B64 || PRIVATE_KEY_B64;

    if (!FILE_ID || !email) {
      return new Response("Missing environment variables", { status: 500 });
    }

    // 🔹 改行を除去してクリーン化
    b64Key = b64Key.replace(/(\r|\n)/g, "").trim();

    // 1️⃣ アクセストークンを取得
    const token = await getAccessToken(email, b64Key);

    // 2️⃣ Google Driveの音声ファイルを取得
    const driveUrl = `https://www.googleapis.com/drive/v3/files/${FILE_ID}?alt=media`;
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

    const range = env.requestHeaders?.Range;
    if (range) headers["Range"] = range;

    const res = await fetch(driveUrl, { headers });

    // 3️⃣ 音声データを返す
    const outHeaders = new Headers();
    outHeaders.set("Content-Type", "audio/m4a");
    outHeaders.set("Cache-Control", "public, max-age=3600");
    outHeaders.set("Access-Control-Allow-Origin", "*");
    outHeaders.set("Content-Disposition", 'inline; filename="audio.m4a"');

    for (const h of ["Content-Range", "Accept-Ranges", "Content-Length"]) {
      const v = res.headers.get(h);
      if (v) outHeaders.set(h, v);
    }

    return new Response(res.body, { status: res.status, headers: outHeaders });
  } catch (err: any) {
    return new Response("Worker error: " + err.message, { status: 500 });
  }
}

// JWT生成・トークン取得
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

// Base64鍵のインポート
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

function base64urlEncode(input: string | Uint8Array): string {
  let bin = "";
  if (typeof input === "string") bin = input;
  else bin = String.fromCharCode(...input);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
