document.addEventListener("DOMContentLoaded", () => {
  const playBtn = document.getElementById("playBtn");
  const wave = document.getElementById("wave");
  const audio = document.getElementById("audio");

  // 動的に波形バーを生成
  for (let i = 0; i < 5; i++) {
    const bar = document.createElement("span");
    wave.appendChild(bar);
  }

  playBtn.addEventListener("click", async () => {
    // ボタンを隠して波形を表示
    playBtn.classList.add("hidden");
    wave.classList.remove("hidden");

    if (!audio.src) {
      audio.src = "/m4a"; // Cloudflare Workerから配信される音声
    }

    try {
      await audio.play();
    } catch (err) {
      console.error("再生エラー:", err);
      // 再生失敗したら元に戻す
      wave.classList.add("hidden");
      playBtn.classList.remove("hidden");
    }
  });

  // 再生終了後は初期状態に戻す
  audio.addEventListener("ended", () => {
    wave.classList.add("hidden");
    playBtn.classList.remove("hidden");
  });
});
