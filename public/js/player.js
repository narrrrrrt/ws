document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("playBtn");
  const audio = document.getElementById("audio");
  let state = "idle"; // idle | loading | playing | paused

  const setLoading = () => {
    btn.innerHTML = "";
    const loader = document.createElement("div");
    loader.className = "loader";
    for (let i = 0; i < 3; i++) loader.appendChild(document.createElement("span"));
    btn.appendChild(loader);
  };

  const setPlayIcon = () => btn.textContent = "▶";
  const setPauseIcon = () => btn.textContent = "⏸";

  btn.addEventListener("click", async () => {
    if (state === "idle" || state === "paused") {
      setLoading();
      state = "loading";
      try {
        await audio.play();
        setPauseIcon();
        state = "playing";
      } catch (e) {
        setPlayIcon();
        state = "idle";
      }
    } else if (state === "playing") {
      audio.pause();
      setPlayIcon();
      state = "paused";
    }
  });

  // イベント監視（ローディング → 再生開始 → 終了 → エラー）
  audio.addEventListener("waiting", () => { if (state !== "loading") setLoading(); });
  audio.addEventListener("playing", () => { setPauseIcon(); state = "playing"; });
  audio.addEventListener("pause", () => { setPlayIcon(); state = "paused"; });
  audio.addEventListener("ended", () => { setPlayIcon(); state = "idle"; });
  audio.addEventListener("error", () => { setPlayIcon(); state = "idle"; });
});
