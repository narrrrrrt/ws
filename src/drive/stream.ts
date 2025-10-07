export async function streamDriveAudio(env: any, request: Request): Promise<Response> {
  try {
    const { DRIVE_FILE_ID, SA_EMAIL, SA_PRIVATE_KEY } = env;
    if (!DRIVE_FILE_ID || !SA_EMAIL || !SA_PRIVATE_KEY) {
      return new Response("Missing env variables", { status: 500 });
    }

    const token = await getAccessToken(SA_EMAIL, SA_PRIVATE_KEY);

    const driveUrl = `https://www.googleapis.com/drive/v3/files/${DRIVE_FILE_ID}?alt=media`;
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

    const range = request.headers.get("Range");
    if (range) headers["Range"] = range;

    const res = await fetch(driveUrl, { headers }).catch(e => {
      return new Response(`Drive fetch failed: ${e}`, { status: 502 });
    });
    if (!(res instanceof Response)) return res;

    const outHeaders = new Headers({
      "Content-Type": "audio/m4a",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
      "Content-Disposition": 'inline; filename="audio.m4a"',
    });

    for (const h of ["Content-Range", "Accept-Ranges", "Content-Length"]) {
      const v = res.headers.get(h);
      if (v) outHeaders.set(h, v);
    }

    if (!res.body) {
      return new Response("Empty response from Drive", { status: 502 });
    }

    return new Response(res.body, { status: res.status, headers: outHeaders });
  } catch (err: any) {
    return new Response(`Worker error: ${err.message}`, { status: 500 });
  }
}
