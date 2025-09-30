(function () {
  const currentVersion = document.documentElement.id;
  const path = window.location.pathname;
  const urlParams = new URLSearchParams(window.location.search);
  // バージョンが不一致ならリダイレクト（キャッシュ対策）
  if (urlParams.get('v') !== currentVersion) {
    const newURL = `${path}?v=${currentVersion}`;
    window.location.replace(newURL);
    return;
  }

  if (urlParams.has('m')) return;

  // 言語によるリダイレクト（英語以外のみ）
  const userLang = (navigator.language || navigator.userLanguage).toLowerCase();
  const prefix = ['ja', 'de', 'fr', 'it', 'es'].find(code => userLang.startsWith(code));
  if ((path.endsWith("index.html") || path.endsWith("/")) && prefix){
    window.location.href = `index.${prefix}.html?v=${currentVersion}&m=1`;
  }
})();