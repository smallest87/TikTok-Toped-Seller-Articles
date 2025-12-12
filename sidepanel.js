// sidepanel.js

// --- FUNGSI 1: CEK STATUS TAB AKTIF VS DATABASE ---
function checkCurrentTabStatus(history) {
  const safeHistory = Array.isArray(history) ? history : [];
  const statusBox = document.getElementById('status-box');
  
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs.length === 0) return;
    
    const currentTab = tabs[0];
    const currentUrl = currentTab.url;

    // Cek apakah URL tab ini ada di history database
    const isExist = safeHistory.some(item => item.url === currentUrl);

    if (isExist) {
      statusBox.style.display = 'flex';
      statusBox.className = 'status-exist';
      statusBox.innerHTML = `<span>⚠️</span><span>Halaman ini sudah ada di database.</span>`;
    } else {
      if (currentUrl && (currentUrl.includes('tokopedia.com') || currentUrl.includes('tiktok.com'))) {
          statusBox.style.display = 'flex';
          statusBox.className = 'status-new';
          statusBox.innerHTML = `<span>🆕</span><span>Halaman baru! Sedang memproses...</span>`;
      } else {
          statusBox.style.display = 'none';
      }
    }
  });
}

// --- FUNGSI 2: RENDER DAFTAR RIWAYAT ---
function renderList(history) {
  const safeHistory = Array.isArray(history) ? history : [];
  checkCurrentTabStatus(safeHistory);

  const container = document.getElementById('list-container');
  container.innerHTML = '';

  if (safeHistory.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px 20px; color:#888;">
        <div style="font-size:24px; margin-bottom:10px;">📭</div>
        <div>Belum ada data terekam.</div>
      </div>`;
    return;
  }

  // Balik urutan agar yang terbaru di atas
  const reversedHistory = [...safeHistory].reverse();

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

    // B. Meta Data
    const breadcrumbHtml = item.breadcrumb 
        ? `<div class="breadcrumb-text">📂 ${item.breadcrumb}</div>` 
        : '';
    const articleDateHtml = item.articleDate 
        ? `<div style="font-size:10px; color:#555; margin-bottom:6px;">📅 Rilis: <b>${item.articleDate}</b></div>` 
        : '';

    // C. Actions
    let openButtonHtml = '';
    let previewHtml = '';

    if (item.articleContent) {
        openButtonHtml = `
          <button class="open-viewer-btn" data-id="${item.timestamp}">
            ↗️ Buka Artikel di Tab Baru
          </button>
        `;
        previewHtml = `
          <details class="article-details">
            <summary>📄 Lihat Preview</summary>
            <div class="article-content-container">${item.articleContent}</div>
          </details>
        `;
    }

    // D. Buat Card
    const card = document.createElement('div');
    card.className = 'card';
    const badgeColor = item.platformName === 'Tokopedia' ? '#03ac0e' : '#fe2c55';

    // Perhatikan: Tombol Hapus ditambahkan di sini
    card.innerHTML = `
      <button class="delete-item-btn" data-delete-id="${item.timestamp}" title="Hapus item ini">×</button>
      
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

    // E. Event Listener: Buka Artikel (Viewer)
    const viewBtn = card.querySelector('.open-viewer-btn');
    if (viewBtn) {
        viewBtn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            chrome.tabs.create({ url: chrome.runtime.getURL(`viewer.html?id=${id}`) });
        });
    }

    // F. Event Listener: Hapus Item (Delete)
    const deleteBtn = card.querySelector('.delete-item-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            const idToDelete = Number(e.target.getAttribute('data-delete-id'));
            
            if(confirm("Hapus item ini dari riwayat?")) {
                // Ambil data terbaru, filter yang mau dihapus, lalu simpan lagi
                chrome.storage.local.get(['visitHistory'], (result) => {
                    const currentHistory = result.visitHistory || [];
                    const newHistory = currentHistory.filter(i => i.timestamp !== idToDelete);
                    
                    chrome.storage.local.set({ visitHistory: newHistory }, () => {
                        console.log(`Item ${idToDelete} terhapus.`);
                    });
                });
            }
        });
    }
  });
}

// --- INITIALIZATION & LISTENERS ---

chrome.storage.local.get(['visitHistory'], (result) => {
  renderList(result.visitHistory);
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.visitHistory) {
    renderList(changes.visitHistory.newValue);
  }
});

chrome.tabs.onActivated.addListener(() => {
  chrome.storage.local.get(['visitHistory'], (result) => { checkCurrentTabStatus(result.visitHistory); });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.url) {
    chrome.storage.local.get(['visitHistory'], (result) => { checkCurrentTabStatus(result.visitHistory); });
  }
});

// Tombol Buka Semua
const openAllBtn = document.getElementById('openAllBtn');
if(openAllBtn) {
    openAllBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL("viewer_all.html") });
    });
}

// Tombol Hapus Semua
const clearBtn = document.getElementById('clearBtn');
if(clearBtn) {
    clearBtn.addEventListener('click', () => {
        if(confirm("Yakin ingin menghapus SEMUA riwayat?")) {
            chrome.storage.local.set({ visitHistory: [] });
        }
    });
}