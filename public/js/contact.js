document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  const modal = document.getElementById("modal");
  const modalMessage = document.getElementById("modal-message");
  const modalClose = document.getElementById("modal-close");
  const toggleContact = document.getElementById("toggle-contact");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);

    try {
      const response = await fetch("https://ive.narrat.workers.dev/mail", {
        method: "POST",
        body: data,
      });

      const text = await response.text();
      modalMessage.textContent = text;
      modal.style.display = "block";
    } catch (error) {
      modalMessage.textContent = "⚠️ 通信に失敗しました: " + error;
      modal.style.display = "block";
    }
  });

  modalClose.addEventListener("click", () => {
    modal.style.display = "none";
    form.reset();             // 入力内容クリア
    toggleContact.checked = false; // フォーム閉じる
  });

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
      form.reset();
      toggleContact.checked = false;
    }
  });
});