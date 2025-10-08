document.addEventListener("DOMContentLoaded", () => {
  const btnPlay = document.getElementById("playBtn");
  const btnStop = document.getElementById("stopBtn");
  const wave = document.getElementById("wave");
  const audio = document.getElementById("player");

  // 波形エレメント動的生成
  for (let i = 0; i < 5; i++) {
    const span = document.createElement("span");
    wave.appendChild(span);
  }

  btnPlay.addEventListener("click", async () => {
    // すでに再生中なら無視
    if (!audio.paused && !audio.ended) return;

    btnPlay.classList.add("hidden");
    btnStop.classList.remove("hidden");
    wave.classList.remove("hidden");

    if (!audio.src) {
      audio.src = "/m4a"; // Cloudflare Worker経由の音源
    }

    try {
      await audio.play();
      // 再生開始を待たずにアニメを出し続ける（NotebookLM風）
    } catch (err) {
      console.error("再生エラー:", err);
      btnPlay.classList.remove("hidden");
      btnStop.classList.add("hidden");
      wave.classList.add("hidden");
    }
  });

  btnStop.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0; // 頭出し
    wave.classList.add("hidden");
    btnStop.classList.add("hidden");
    btnPlay.classList.remove("hidden");
  });

  // 再生完了時もリセット
  audio.addEventListener("ended", () => {
    wave.classList.add("hidden");
    btnStop.classList.add("hidden");
    btnPlay.classList.remove("hidden");
  });
});
