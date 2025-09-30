window.onload = function () {
  const quizLinks = document.querySelectorAll(".quiz-link");
  const quizItems = document.querySelectorAll(".quiz-item");

  function showQuiz(index) {
    quizItems.forEach((item, i) => {
      item.hidden = i !== index;
    });
  }

  quizLinks.forEach(link => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const index = parseInt(link.dataset.index);
      if (isNaN(index)) return;

      quizLinks.forEach(el => el.classList.remove("active"));
      link.classList.add("active");

      showQuiz(index);
    });
  });

  // 最初に1番を表示
  quizLinks[0]?.classList.add("active");
  showQuiz(0);
};