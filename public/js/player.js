document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("playBtn");
  const spinner = document.getElementById("spinner");
  const audio = document.getElementById("player");

  btn.addEventListener("click", async () => {
    if (!audio.src) {
      // 🔽 Cloudflare Worker経由のエンドポイント
      audio.src = "/m4a"; 
    }

    // 再生中なら一時停止
    if (!audio.paused && !audio.ended) {
      audio.pause();
      btn.textContent = "▶ 再生";
      return;
    }

    // 再生開始
    btn.classList.add("hidden");
    spinner.classList.remove("hidden");

    try {
      await audio.play();
    } catch (err) {
      console.error("再生開始エラー:", err);
      spinner.classList.add("hidden");
      btn.classList.remove("hidden");
    }
  });

  // 再生開始時
  audio.addEventListener("playing", () => {
    spinner.classList.add("hidden");
    btn.classList.remove("hidden");
    btn.textContent = "⏸ 一時停止";
  });

  // 一時停止時
  audio.addEventListener("pause", () => {
    btn.textContent = "▶ 再生";
  });

  // 再生完了時
  audio.addEventListener("ended", () => {
    btn.textContent = "▶ 再生";
  });
});
