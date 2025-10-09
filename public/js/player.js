document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("playPauseBtn");
  const wave = document.getElementById("wave");
  const audio = document.getElementById("player");

  // 動的に5本のバーを生成
  for (let i = 0; i < 5; i++) {
    const bar = document.createElement("span");
    wave.appendChild(bar);
  }

  btn.addEventListener("click", async () => {
    if (audio.paused || audio.ended) {
      // 再生開始
      btn.textContent = "⏸";
      wave.classList.remove("hidden");
      wave.classList.remove("paused");

      if (!audio.src) {
        audio.src = "/m4a"; // Cloudflare Worker側の音源URL
      }

      try {
        await audio.play();
      } catch (err) {
        console.error("再生エラー:", err);
        btn.textContent = "▶";
        wave.classList.add("hidden");
      }
    } else {
      // 一時停止
      audio.pause();
      btn.textContent = "▶";
      wave.classList.add("paused"); // 波形を静止
    }
  });

  // 再生終了時はリセット
  audio.addEventListener("ended", () => {
    btn.textContent = "▶";
    wave.classList.add("hidden");
  });
});
