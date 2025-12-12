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

// --- FUNGSI BARU: AMBIL TANGGAL ARTIKEL ---
function getArticleDate() {
  const dateElement = document.querySelector('.article-date');
  return dateElement ? dateElement.innerText.trim() : null;
}

function getCleanArticleContent() {
  const articleElement = document.querySelector('.article-main');
  if (!articleElement) return null;

  const clone = articleElement.cloneNode(true);
  const selectorsToRemove = [
    '.csat', '.knowledge-nav', '.recommended-articles', 
    '.breadcrumb-nav', '.article-title', '.article-date', '.toc-sidebar'
  ];

  selectorsToRemove.forEach(selector => {
    const elements = clone.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  });

  return clone.innerHTML.trim(); 
}

function captureAndSave() {
  const currentUrl = window.location.href;
  const cleanTitle = getSmartTitle();

  if (!cleanTitle) return;

  chrome.storage.local.get(['visitHistory'], (result) => {
    let history = result.visitHistory || [];
    
    const isAlreadySaved = history.some(item => item.url === currentUrl);
    if (isAlreadySaved) {
        console.log("⛔ URL sudah ada. Skip.");
        return; 
    }

    const platform = getPlatformInfo();
    const breadcrumbData = getBreadcrumb();
    const articleDateData = getArticleDate(); // <--- Ambil Tanggal
    const articleContentData = getCleanArticleContent();

    const dataPoint = {
      title: cleanTitle,
      articleDate: articleDateData, // <--- Simpan Tanggal
      breadcrumb: breadcrumbData,
      articleContent: articleContentData,
      url: currentUrl,
      platformName: platform.name,
      timestamp: Date.now(),
      accessTime: new Date().toLocaleString("id-ID", { 
          hour: '2-digit', minute:'2-digit', second:'2-digit' 
      })
    };

    history.push(dataPoint);
    
    chrome.storage.local.set({ visitHistory: history }, () => {
      console.log("✅ Data Tersimpan (Title, Date, Content).");
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "URL_CHANGED") {
    setTimeout(captureAndSave, 2000);
  }
});

window.addEventListener('load', () => {
  setTimeout(captureAndSave, 2000);
});