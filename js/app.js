document.addEventListener('DOMContentLoaded', () => {
  let allTanks = [];
  const sideView = document.getElementById('side-view');
  const sideContent = document.getElementById('side-content');
  const overlay = document.getElementById('overlay');
  const closeBtn = document.getElementById('close-btn');

  // JSON読み込み
  fetch('tanks.json')
    .then(res => res.json())
    .then(data => {
      allTanks = data;
      renderCards(allTanks);
    });

  // カード描画
  function renderCards(tanks) {
    const container = document.getElementById('card-container');
    container.innerHTML = '';

    tanks.forEach(tank => {
      const card = document.createElement('article');
      card.className = 'specimen-card';
      card.style.cursor = 'pointer'; // クリックできることがわかるように

      card.innerHTML = `
        <div class="card-id">[${tank.id}] ${tank.date}</div>
        <h2 class="card-title">${tank.title}</h2>
        <div class="card-aquarium">📍 ${tank.aquarium}</div>
        <p class="card-summary">${tank.summary}</p>
      `;

      // ★カードクリックでサイドビューを開く
      card.addEventListener('click', () => {
        openSideView(tank.content);
      });

      container.appendChild(card);
    });
  }

  // ★サイドビューを開いて Markdown を読み込む関数
  function openSideView(mdPath) {
    sideContent.innerHTML = '<p class="loading">[LOADING SPECIMEN LOG...]</p>';
    sideView.classList.add('active');
    overlay.classList.add('active');

    // 指定された.mdファイルを読み込んでHTMLに変換
    fetch(mdPath)
      .then(res => {
        if (!res.ok) throw new Error('File not found');
        return res.text();
      })
      .then(markdownText => {
        // markedライブラリを使ってMarkdownをHTMLに変換
        sideContent.innerHTML = marked.parse(markdownText);
      })
      .catch(err => {
        sideContent.innerHTML = '<p>[ERROR: 観測手記の読み込みに失敗しました]</p>';
      });
  }

  // ★閉じる処理
  function closeSideView() {
    sideView.classList.remove('active');
    overlay.classList.remove('active');
  }

  closeBtn.addEventListener('click', closeSideView);
  overlay.addEventListener('click', closeSideView);
  
  // ESCキーでも閉じられるように
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSideView();
  });
});