document.addEventListener("DOMContentLoaded", () => {
  const playBtn = document.getElementById("playBtn");
  const wave = document.getElementById("wave");
  const audio = document.getElementById("audio");

  // 波形バーを生成（初期は非表示）
  for (let i = 0; i < 5; i++) {
    const bar = document.createElement("span");
    wave.appendChild(bar);
  }
  wave.classList.add("hidden");

  playBtn.addEventListener("click", async () => {
    // ▶を消して波を表示
    playBtn.classList.add("hidden");
    wave.classList.remove("hidden");

    try {
      // iOSのオーディオ再生許可を確保（無音トリガー）
      await audio.play();
    } catch {}

    // 音声ソース設定 → 再生
    if (!audio.src) {
      audio.src = "/m4a"; // Cloudflare Worker のエンドポイント
      try { await audio.play(); } catch {}
    }
  });

  // 再生完了しても波は出たまま
  audio.addEventListener("ended", () => {});
  audio.addEventListener("error", () => {});
});
