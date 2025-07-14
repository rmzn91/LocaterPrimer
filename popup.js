document.addEventListener('DOMContentLoaded', function() {
  const activateButton = document.getElementById('activate-selector');
  const copyButton = document.getElementById('copy-selector');
  const selectorResult = document.getElementById('selector-result');
  const validationResult = document.getElementById('validation-result');
  const selectorTypeRadios = document.getElementsByName('selector-type');
  const shadowDomCheckbox = document.getElementById('shadow-dom');
  const iframeCheckbox = document.getElementById('iframe-support');
  
  let currentSelectorType = 'xpath';
  
  // Seçici tipini belirle
  selectorTypeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      currentSelectorType = this.value;
      
      // Eğer zaten bir sonuç varsa, yeni seçici tipine göre güncelle
      if (selectorResult.textContent !== 'Henüz bir element seçilmedi') {
        sendMessageToActiveTab({
          action: 'updateSelectorType',
          selectorType: currentSelectorType
        });
      }
    });
  });
  
  // Element seçme modunu aktifleştir
  activateButton.addEventListener('click', function() {
    // Aktif sekmeye mesaj gönder
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const activeTab = tabs[0];
      
      chrome.tabs.sendMessage(activeTab.id, {
        action: 'activateSelector',
        selectorType: currentSelectorType,
        shadowDomSupport: shadowDomCheckbox.checked,
        iframeSupport: iframeCheckbox.checked
      });
      
      // Popup'ı kapat (kullanıcı element seçebilsin diye)
      window.close();
    });
  });
  
  // Kopyalama butonu
  copyButton.addEventListener('click', function() {
    const textToCopy = selectorResult.textContent;
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        // Kopyalama başarılı olduğunda butonu güncelle
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Kopyalandı!';
        copyButton.style.backgroundColor = '#27ae60';
        
        setTimeout(() => {
          copyButton.textContent = originalText;
          copyButton.style.backgroundColor = '';
        }, 1500);
      })
      .catch(err => {
        console.error('Kopyalama hatası:', err);
      });
  });
  
  // Aktif sekmeye mesaj gönderme yardımcı fonksiyonu
  function sendMessageToActiveTab(message) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, message);
      }
    });
  }
  
  // Background'dan gelen mesajları dinle
  chrome.runtime.onMessage.addListener(function(message) {
    if (message.action === 'selectorGenerated') {
      selectorResult.textContent = message.selector;
      copyButton.disabled = false;
      
      // Seçicinin doğruluğunu kontrol et
      if (message.isValid) {
        validationResult.textContent = 'Seçici doğrulandı ✓';
        validationResult.className = 'validation-result validation-success';
      } else {
        validationResult.textContent = 'Seçici doğrulanamadı ✗';
        validationResult.className = 'validation-result validation-error';
      }
    }
  });
});