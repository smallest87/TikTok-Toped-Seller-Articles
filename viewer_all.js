// viewer_all.js

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Set Tanggal
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('print-date').textContent = `Dibuat pada: ${dateStr}, Pukul ${timeStr}`;
  document.title = `Kompilasi Artikel (${dateStr})`;

  // 2. Ambil Data & Render
  chrome.storage.local.get(['visitHistory'], (result) => {
    const history = result.visitHistory || [];
    const tocList = document.getElementById('toc-list');
    const articlesContainer = document.getElementById('articles-container');

    tocList.innerHTML = '';
    articlesContainer.innerHTML = '';

    if (history.length === 0) {
      articlesContainer.innerHTML = '<p style="text-align:center">Belum ada data artikel tersimpan.</p>';
      return;
    }

    const dataToRender = [...history].reverse();

    dataToRender.forEach((item, index) => {
      if (!item.articleContent) return;

      const anchorId = `art-${index}`;

      // A. Daftar Isi
      const li = document.createElement('li');
      li.className = 'toc-item';
      li.innerHTML = `
        <a href="#${anchorId}" class="toc-link">${item.title}</a>
        <span style="font-size:14px; font-style:italic;">${item.articleDate || ''}</span>
      `;
      tocList.appendChild(li);

      // B. Konten Artikel
      const articleDiv = document.createElement('article');
      articleDiv.className = 'article-wrapper';
      articleDiv.id = anchorId;

      const breadcrumb = item.breadcrumb ? `<span>${item.breadcrumb}</span>` : 'Artikel';
      
      articleDiv.innerHTML = `
        <div class="article-meta-info">
          <strong>${breadcrumb}</strong> | 📅 Rilis: ${item.articleDate || '-'} | 🔗 <a href="${item.url}" target="_blank">Sumber Asli</a>
        </div>
        <div class="article-title-main">${item.title}</div>
        <div class="article-body">${item.articleContent}</div>
      `;

      articlesContainer.appendChild(articleDiv);
    });
  });

  // --- PERBAIKAN: Event Listener untuk Tombol Print ---
  const printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
});