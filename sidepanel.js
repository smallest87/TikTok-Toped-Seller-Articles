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
  checkCurrentTabStatus(history); // Update status bar

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

  // Data terbaru di paling atas
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

    // B. Breadcrumb
    const breadcrumbHtml = item.breadcrumb 
        ? `<div class="breadcrumb-text">📂 ${item.breadcrumb}</div>` 
        : '';

    // C. Article Content Logic (Tombol & Preview)
    let openButtonHtml = '';
    let previewHtml = '';

    if (item.articleContent) {
        // Tombol Buka di Tab Baru (Membawa timestamp sebagai ID)
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

    // D. Buat Card Element
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

    // E. Event Listener untuk Tombol "Buka di Tab Baru"
    // Kita tambahkan listener spesifik untuk tombol di dalam card ini
    const viewBtn = card.querySelector('.open-viewer-btn');
    if (viewBtn) {
        viewBtn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            // Buka viewer.html dengan parameter ID
            chrome.tabs.create({
                url: chrome.runtime.getURL(`viewer.html?id=${id}`)
            });
        });
    }
  });
}

// --- INITIALIZATION & LISTENERS ---

// 1. Ambil data saat panel dibuka
chrome.storage.local.get(['visitHistory'], (result) => {
  const history = result.visitHistory || [];
  renderList(history);
});

// 2. Listener Storage Change
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.visitHistory) {
    renderList(changes.visitHistory.newValue);
  }
});

// 3. Listener Active Tab (untuk update status bar)
chrome.tabs.onActivated.addListener(() => {
  chrome.storage.local.get(['visitHistory'], (result) => {
    checkCurrentTabStatus(result.visitHistory || []);
  });
});

// 4. Listener URL Update (untuk update status bar)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.url) {
    chrome.storage.local.get(['visitHistory'], (result) => {
      checkCurrentTabStatus(result.visitHistory || []);
    });
  }
});

// Tombol Hapus Riwayat
document.getElementById('clearBtn').addEventListener('click', () => {
  if(confirm("Hapus semua riwayat?")) {
    chrome.storage.local.set({ visitHistory: [] });
  }
});