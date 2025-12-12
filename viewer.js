// viewer.js

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const timestamp = urlParams.get('id');

  if (!timestamp) {
    document.getElementById('content-area').innerText = "ID Artikel tidak ditemukan.";
    return;
  }

  chrome.storage.local.get(['visitHistory'], (result) => {
    const history = result.visitHistory || [];
    const item = history.find(i => i.timestamp === Number(timestamp));

    if (item) {
      // --- LOGIKA TITLE BARU ---
      // Format: {Tanggal} - {Page Title}
      // Contoh: 22/09/2025 - Panduan Listing Produk...
      if (item.articleDate) {
        document.title = `${item.articleDate} - ${item.title}`;
      } else {
        document.title = item.title;
      }
      
      renderArticle(item);
    } else {
      document.title = "Artikel 404";
      document.getElementById('content-area').innerText = "Data artikel tidak ditemukan di database.";
    }
  });
});

function renderArticle(item) {
  const container = document.getElementById('content-area');
  
  const breadcrumbHtml = item.breadcrumb 
    ? `<div class="breadcrumb">📂 ${item.breadcrumb}</div>` 
    : '';

  const dateHtml = item.articleDate 
    ? `<span style="margin-right:15px;">📅 Rilis: <b>${item.articleDate}</b></span>` 
    : '';
  
  container.innerHTML = `
    <div class="meta-header">
      ${breadcrumbHtml}
      <h1>${item.title}</h1>
      
      <div style="margin-top:10px; font-size:12px; color:#555; display:flex; align-items:center; flex-wrap:wrap; gap:10px;">
        ${dateHtml}
        <span>🕒 Diakses: ${item.accessTime}</span>
        <a href="${item.url}" target="_blank" class="original-link" style="margin-left:auto;">🔗 Buka Sumber Asli</a>
      </div>
    </div>

    <div class="article-body">
      ${item.articleContent || '<p><em>Konten artikel tidak tersedia.</em></p>'}
    </div>
  `;
}