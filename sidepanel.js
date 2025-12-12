// sidepanel.js

// --- FUNGSI 1: CEK STATUS TAB AKTIF VS DATABASE ---
function checkCurrentTabStatus(history) {
  const statusBox = document.getElementById('status-box');
  
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs.length === 0) return;
    
    const currentTab = tabs[0];
    const currentUrl = currentTab.url;

    // Cek apakah URL tab ini ada di history database
    const isExist = history.some(item => item.url === currentUrl);

    if (isExist) {
      statusBox.style.display = 'flex';
      statusBox.className = 'status-exist';
      statusBox.innerHTML = `
        <span>⚠️</span>
        <span>Halaman ini sudah ada di database.</span>
      `;
    } else {
      if (currentUrl && (currentUrl.includes('tokopedia.com') || currentUrl.includes('tiktok.com'))) {
          statusBox.style.display = 'flex';
          statusBox.className = 'status-new';
          statusBox.innerHTML = `
            <span>🆕</span>
            <span>Halaman baru! Sedang memproses...</span>
          `;
      } else {
          statusBox.style.display = 'none';
      }
    }
  });
}

// --- FUNGSI 2: RENDER DAFTAR RIWAYAT ---
function renderList(history) {
  checkCurrentTabStatus(history); // Update status

  const container = document.getElementById('list-container');
  container.innerHTML = '';

  if (!history || history.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px 20px; color:#888;">
        <div style="font-size:24px; margin-bottom:10px;">📭</div>
        <div>Belum ada data terekam.</div>
      </div>`;
    return;
  }

  // Urutkan dari terbaru
  const reversedHistory = [...history].reverse();

  reversedHistory.forEach(item => {
    // A. Parsing URL
    let baseUrl = item.url;
    let paramsHtml = '';
    
    try {
      const urlObj = new URL(item.url);
      baseUrl = urlObj.origin + urlObj.pathname;

      const entries = Array.from(urlObj.searchParams.entries());
      if (entries.length > 0) {
        paramsHtml = `<div class="list-group">`;
        entries.forEach(([key, value]) => {
          paramsHtml += `
            <div class="list-group-item">
              <span class="param-key">${key}</span>
              <span class="param-val">${value}</span>
            </div>`;
        });
        paramsHtml += `</div>`;
      } else {
        paramsHtml = `<div class="empty-param">Tidak ada parameter (GET)</div>`;
      }
    } catch (e) {
      paramsHtml = `<div class="empty-param">Format URL Invalid</div>`;
    }

    // B. Breadcrumb HTML
    const breadcrumbHtml = item.breadcrumb 
        ? `<div class="breadcrumb-text">📂 ${item.breadcrumb}</div>` 
        : '';

    // C. Article Date HTML
    const articleDateHtml = item.articleDate 
        ? `<div style="font-size:10px; color:#555; margin-bottom:6px;">📅 Rilis: <b>${item.articleDate}</b></div>` 
        : '';

    // D. Article Actions (Button & Preview)
    let openButtonHtml = '';
    let previewHtml = '';

    if (item.articleContent) {
        // Tombol Buka Tab Baru (Per Artikel)
        openButtonHtml = `
          <button class="open-viewer-btn" data-id="${item.timestamp}">
            ↗️ Buka Artikel di Tab Baru
          </button>
        `;

        // Accordion Preview
        previewHtml = `
          <details class="article-details">
            <summary>📄 Lihat Preview</summary>
            <div class="article-content-container">
              ${item.articleContent}
            </div>
          </details>
        `;
    }

    // E. Render Card
    const card = document.createElement('div');
    card.className = 'card';
    const badgeColor = item.platformName === 'Tokopedia' ? '#03ac0e' : '#fe2c55';

    card.innerHTML = `
      <div class="card-header">
        <span class="badge" style="background:${badgeColor}">${item.platformName}</span>
        <span class="time">${item.accessTime}</span>
      </div>
      
      <div class="card-body">
        ${breadcrumbHtml}
        ${articleDateHtml}
        
        <div class="page-title">${item.title}</div>
        
        <div class="section-label">URL Induk</div>
        <a href="${item.url}" target="_blank" class="url-box">${baseUrl}</a>
        
        <div class="section-label">Parameter Data</div>
        ${paramsHtml}

        ${openButtonHtml}
        ${previewHtml}
      </div>
    `;

    container.appendChild(card);

    // Event Listener untuk Tombol Per Artikel
    const viewBtn = card.querySelector('.open-viewer-btn');
    if (viewBtn) {
        viewBtn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            chrome.tabs.create({
                url: chrome.runtime.getURL(`viewer.html?id=${id}`)
            });
        });
    }
  });
}

// --- INITIALIZATION & LISTENERS ---

// 1. Init Load
chrome.storage.local.get(['visitHistory'], (result) => {
  renderList(result.visitHistory);
});

// 2. Storage Changed
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.visitHistory) {
    renderList(changes.visitHistory.newValue);
  }
});

// 3. Tab Activated (Update Status Box)
chrome.tabs.onActivated.addListener(() => {
  chrome.storage.local.get(['visitHistory'], (result) => {
    checkCurrentTabStatus(result.visitHistory || []);
  });
});

// 4. Tab Updated (Update Status Box)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.url) {
    chrome.storage.local.get(['visitHistory'], (result) => {
      checkCurrentTabStatus(result.visitHistory || []);
    });
  }
});

// 5. Tombol Buka SEMUA Artikel (Kompilasi)
document.getElementById('openAllBtn').addEventListener('click', () => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("viewer_all.html")
  });
});

// 6. Tombol Hapus Riwayat
document.getElementById('clearBtn').addEventListener('click', () => {
  if(confirm("Yakin ingin menghapus semua riwayat?")) {
    chrome.storage.local.set({ visitHistory: [] });
  }
});