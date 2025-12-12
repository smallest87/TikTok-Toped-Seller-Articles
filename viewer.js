// viewer.js

document.addEventListener('DOMContentLoaded', () => {
  // 1. Ambil Parameter Timestamp dari URL
  const urlParams = new URLSearchParams(window.location.search);
  const timestamp = urlParams.get('id');

  if (!timestamp) {
    document.getElementById('content-area').innerText = "Artikel tidak ditemukan (ID missing).";
    return;
  }

  // 2. Cari Data di Local Storage
  chrome.storage.local.get(['visitHistory'], (result) => {
    const history = result.visitHistory || [];
    
    // Konversi timestamp string dari URL ke number
    const item = history.find(i => i.timestamp === Number(timestamp));

    if (item) {
      // --- UPDATE TITLE HALAMAN ---
      // Mengubah judul Tab Browser menjadi Judul Artikel
      document.title = item.title; 
      
      renderArticle(item);
    } else {
      document.title = "Artikel Tidak Ditemukan";
      document.getElementById('content-area').innerText = "Artikel tidak ditemukan di database.";
    }
  });
});

function renderArticle(item) {
  const container = document.getElementById('content-area');
  
  // Format Breadcrumb
  const breadcrumbHtml = item.breadcrumb ? `<div class="breadcrumb">📂 ${item.breadcrumb}</div>` : '';
  
  // Suntikkan HTML
  container.innerHTML = `
    <div class="meta-header">
      ${breadcrumbHtml}
      <h1>${item.title}</h1>
      <a href="${item.url}" target="_blank" class="original-link">🔗 Buka URL Asli</a>
      <span style="float:right; font-size:12px; color:#888;">Diakses: ${item.accessTime}</span>
    </div>
    <div class="article-body">
      ${item.articleContent || '<p><em>Konten artikel tidak tersedia atau gagal diambil.</em></p>'}
    </div>
  `;
}