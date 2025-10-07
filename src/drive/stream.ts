// drive/stream.ts
/**
 * Cloudflare Workers 環境変数の動作確認用
 * - SA_EMAIL, SA_PRIVATE_KEY, DRIVE_FILE_ID の読み込み確認
 * - Base64キーが正しくデコードできるか検証
 * - 実際のストリーミングや Google API 呼び出しは行わない
 */

export async function streamDriveAudio(env: any): Promise<Response> {
  const saEmail = env.SA_EMAIL;
  const driveFileId = env.DRIVE_FILE_ID;
  const key = env.SA_PRIVATE_KEY;

  const result: Record<string, any> = {
    SA_EMAIL: saEmail ? "✅ loaded" : "❌ missing",
    DRIVE_FILE_ID: driveFileId ? "✅ loaded" : "❌ missing",
  };

  if (key) {
    try {
      const decoded = atob(key);
      result.SA_PRIVATE_KEY = `✅ Base64 decoded (${decoded.length} chars)`;
      result.SAMPLE = decoded.slice(0, 60).replace(/\n/g, "\\n") + "...";
    } catch (e: any) {
      result.SA_PRIVATE_KEY = `⚠️ decode failed: ${e.message}`;
    }
  } else {
    result.SA_PRIVATE_KEY = "❌ missing";
  }

  return new Response(JSON.stringify(result, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
