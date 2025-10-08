export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    // === 内部固定値 ===
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

    // === Google API JWT 準備 ===
    const header = {
      alg: "RS256",
      typ: "JWT",
    };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: SA_EMAIL,
      scope: "https://www.googleapis.com/auth/drive.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };

    // Base64URL エンコード
    function base64url(source: ArrayBuffer | string): string {
      let encoded = btoa(
        typeof source === "string"
          ? source
          : String.fromCharCode(...new Uint8Array(source))
      );
      return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }

    // 鍵をインポート
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      (() => {
        const pem = SA_PRIVATE_KEY.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "").replace(/\s+/g, "");
        const binary = atob(pem);
        const buffer = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
        return buffer.buffer;
      })(),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    // JWT 署名
    const encodedHeader = base64url(JSON.stringify(header));
    const encodedPayload = base64url(JSON.stringify(payload));
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      privateKey,
      new TextEncoder().encode(signatureInput)
    );
    const jwt = `${signatureInput}.${base64url(signature)}`;

    // アクセストークン取得
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Failed to get access token", tokenData }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Drive ファイル取得
    const driveUrl = `https://www.googleapis.com/drive/v3/files/${DRIVE_FILE_ID}?alt=media`;
    const driveResponse = await fetch(driveUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!driveResponse.ok) {
      return new Response(JSON.stringify({
        error: "Drive fetch failed",
        status: driveResponse.status,
        statusText: driveResponse.statusText,
      }), {
        status: driveResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // m4a ファイル返却
    return new Response(driveResponse.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/m4a",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    });
  },
};
