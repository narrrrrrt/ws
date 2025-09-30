export interface Env {
  GITHUB_TOKEN: string;
}

export async function handleForm(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const formData = await request.formData();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const message = formData.get("message") as string;
  const lang = (formData.get("lang") as string) || "en";

  const body = `
**Name:** ${name}
**Email:** ${email}

${message}
  `;

  const res = await fetch("https://api.github.com/repos/narrrrrrt/contact/issues", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify({
      title: `お問い合わせ from ${name}`,
      body: body,
      labels: ["inquiry"],
    }),
  });

  const messages: Record<string, string> = {
    ja: "送信しました。ありがとうございます！",
    en: "Your message has been sent. Thank you!",
    es: "Su mensaje ha sido enviado. ¡Gracias!",
    de: "Ihre Nachricht wurde gesendet. Vielen Dank!",
    it: "Il tuo messaggio è stato inviato. Grazie!",
    fr: "Votre message a été envoyé. Merci!",
  };

  const successMessage = messages[lang] || messages["en"];
  const errorMessage = lang === "ja" ? "送信に失敗しました。" : "Failed to send message.";

  if (!res.ok) {
    const err = await res.text();
    return new Response(errorMessage + "\n" + err, { status: 500 });
  }

  return new Response(successMessage, { status: 200 });
}