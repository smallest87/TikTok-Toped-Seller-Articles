// background.js

function sendMessageToContentScript(tabId, url) {
  // Kirim pesan ke content.js agar ia mengambil data terbaru
  chrome.tabs.sendMessage(tabId, { action: "URL_CHANGED", url: url })
    .catch(err => {
      // Error handling jika content script belum siap (wajar saat loading awal)
      console.log("Menunggu content script siap...");
    });
}

// 1. Deteksi Navigasi SPA (Pindah menu tanpa reload)
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.frameId === 0) { // Hanya frame utama
    sendMessageToContentScript(details.tabId, details.url);
  }
}, {
  url: [
    { hostContains: 'tokopedia.com' },
    { hostContains: 'tiktok.com' }
  ]
});

// 2. Deteksi Loading Awal / Refresh Halaman
chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId === 0) {
    sendMessageToContentScript(details.tabId, details.url);
  }
}, {
  url: [
    { hostContains: 'tokopedia.com' },
    { hostContains: 'tiktok.com' }
  ]
});