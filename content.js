// content.js

function getPlatformInfo() {
  const url = window.location.href;
  if (url.includes("tokopedia.com")) return { name: "Tokopedia", class: "tokopedia" };
  if (url.includes("tiktok.com")) return { name: "TikTok Shop", class: "tiktok" };
  return { name: "Unknown", class: "unknown" };
}

function getSmartTitle() {
  const articleHeading = document.querySelector('.article-title');
  if (articleHeading && articleHeading.innerText.trim().length > 0) {
    return articleHeading.innerText.trim();
  }
  const metaTitle = document.querySelector('meta[property="og:title"]');
  return metaTitle ? metaTitle.content.trim() : document.title;
}

function getBreadcrumb() {
  const navElement = document.querySelector('.breadcrumb-nav');
  if (navElement) {
    const items = navElement.querySelectorAll('.breadcrumb-item');
    return Array.from(items).map(item => item.innerText.trim()).join(' › ');
  }
  return null; 
}

// --- FUNGSI BARU: AMBIL & BERSIHKAN KONTEN ARTIKEL ---
function getCleanArticleContent() {
  // 1. Target elemen induk artikel
  const articleElement = document.querySelector('.article-main');
  
  if (!articleElement) return null;

  // 2. Clone elemen (PENTING: Agar halaman asli tidak terhapus)
  const clone = articleElement.cloneNode(true);

  // 3. Daftar Selector yang ingin DIHAPUS (Dikecualikan)
  const selectorsToRemove = [
    '.csat',                  // Feedback Section
    '.knowledge-nav',         // Navigasi Next/Prev
    '.recommended-articles',  // Artikel Rekomendasi
    '.breadcrumb-nav',        // Breadcrumb (karena sudah diambil terpisah)
    '.article-title',         // Judul (karena sudah diambil terpisah)
    '.article-date',          // Tanggal (opsional, agar bersih)
    '.toc-sidebar'            // Daftar isi (biasanya mengganggu di tampilan mobile/sidepanel)
  ];

  // 4. Hapus elemen-elemen tersebut dari Clone
  selectorsToRemove.forEach(selector => {
    const elements = clone.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  });

  // 5. Kembalikan HTML bersih
  // .innerHTML akan mengambil struktur HTML (termasuk gambar, bold, list, tabel)
  // .innerText jika Anda hanya ingin teks polos tanpa formatting
  return clone.innerHTML.trim(); 
}

function captureAndSave() {
  const currentUrl = window.location.href;
  const cleanTitle = getSmartTitle();

  if (!cleanTitle) return;

  chrome.storage.local.get(['visitHistory'], (result) => {
    let history = result.visitHistory || [];
    
    // Cek Duplikat
    const isAlreadySaved = history.some(item => item.url === currentUrl);
    if (isAlreadySaved) {
        console.log("⛔ URL sudah ada. Skip.");
        return; 
    }

    const platform = getPlatformInfo();
    
    // Ambil Data
    const breadcrumbData = getBreadcrumb();
    const articleContentData = getCleanArticleContent(); // <--- Data Artikel Bersih

    const dataPoint = {
      title: cleanTitle,
      breadcrumb: breadcrumbData,
      articleContent: articleContentData, // Simpan HTML Artikel
      url: currentUrl,
      platformName: platform.name,
      timestamp: Date.now(),
      accessTime: new Date().toLocaleString("id-ID", { 
          hour: '2-digit', minute:'2-digit', second:'2-digit' 
      })
    };

    history.push(dataPoint);
    
    chrome.storage.local.set({ visitHistory: history }, () => {
      console.log("✅ Data Lengkap Tersimpan (dengan Artikel).");
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "URL_CHANGED") {
    setTimeout(captureAndSave, 2000); // Naikkan timeout sedikit untuk load konten berat
  }
});

window.addEventListener('load', () => {
  setTimeout(captureAndSave, 2000);
});