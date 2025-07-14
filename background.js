// Arka plan servisi
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  // Content script'ten gelen seçici bilgisini popup'a ilet
  if (message.action === 'selectorGenerated') {
    // Tüm açık popup'lara mesajı ilet
    chrome.runtime.sendMessage(message);
  }
});

// Eklenti simgesine tıklandığında paneli aç/kapat
chrome.action.onClicked.addListener((tab) => {
  // Aktif sekmeye mesaj gönder
  chrome.tabs.sendMessage(tab.id, { action: "togglePanel" }, function (response) {
    console.log("Panel durumu değiştirildi:", response);
  });
});

// Sekme güncellendiğinde (sayfa yenilendiğinde) çalışacak kod
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  // Sayfa tamamen yüklendiğinde
  if (changeInfo.status === 'complete') {
    // Sayfanın yüklenmesi için daha uzun bir süre bekle
    setTimeout(() => {
      // Aktif sekmeye mesaj gönder
      chrome.tabs.sendMessage(tabId, { action: "pageReloaded" }, function (response) {
        // Hata mesajını görmezden gel (content script henüz yüklenmemiş olabilir)
        console.log("Sayfa yenilendi mesajı gönderildi");
      });
    }, 1500); // Süreyi artır
  }
});

// Eklenti ilk yüklendiğinde veya güncellendiğinde çalışacak kod
chrome.runtime.onInstalled.addListener(function () {
  console.log('XPath ve CSS Seçici Üretici eklentisi yüklendi!');
});