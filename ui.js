// Panel oluşturma
const selectorPanel = document.createElement('div');
selectorPanel.id = 'xpath-css-selector-panel';
selectorPanel.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  width: 500px;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 10000;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: none;
  overflow: hidden;
`;

// Panel içeriği
selectorPanel.innerHTML = `
  <div style="padding: 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background-color: #f8f9fa;">
    <h3 style="margin: 0; font-size: 16px; color: #2c3e50;">Element Seçici Üretici</h3>
    <div>
      <button id="minimize-panel" style="background: none; border: none; cursor: pointer; font-size: 16px; color: #7f8c8d; margin-right: 5px;">_</button>
      <button id="close-panel" style="background: none; border: none; cursor: pointer; font-size: 16px; color: #7f8c8d;">×</button>
    </div>
  </div>
  
  <div style="padding: 12px;">
    <div style="margin-bottom: 12px;">
      <button id="activate-panel-selector" style="background-color: #3498db; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; width: 100%;">Element Seç</button>
    </div>
    
    <div style="margin-top: 16px;">
      <h4 style="margin: 0 0 8px; font-size: 14px; color: #2c3e50;">Sonuç</h4>
      <div style="background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin-bottom: 8px; max-height: 100px; overflow-y: auto; word-break: break-all; font-family: monospace; font-size: 12px;" id="panel-selector-result">Henüz bir element seçilmedi</div>
      <div id="panel-validation-result" style="margin: 8px 0; font-size: 12px; min-height: 18px;"></div>
      <button id="panel-copy-selector" style="background-color: #3498db; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; width: 100%;" disabled>Kopyala</button>
    </div>
    
    <div id="element-attributes" style="margin-top: 16px; display: none;">
      <h4 style="margin: 0 0 8px; font-size: 14px; color: #2c3e50;">Element Özellikleri</h4>
      <div style="background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin-bottom: 8px; max-height: 200px; overflow-y: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background-color: #eee; text-align: left;">
              <th style="padding: 6px; border-bottom: 1px solid #ddd;">Özellik</th>
              <th style="padding: 6px; border-bottom: 1px solid #ddd;">Değer</th>
              <th style="padding: 6px; border-bottom: 1px solid #ddd;">Eşleşme</th>
              <th style="padding: 6px; border-bottom: 1px solid #ddd;">İşlem</th>
            </tr>
          </thead>
          <tbody id="attribute-list">
            <!-- Element özellikleri buraya eklenecek -->
          </tbody>
        </table>
      </div>
    </div>
    
    <div id="element-actions" style="margin-top: 16px; display: none;">
      <h4 style="margin: 0 0 8px; font-size: 14px; color: #2c3e50;">Element İşlemleri</h4>
      <div style="display: flex; gap: 8px;">
        <button id="panel-generate-xpath" style="flex: 1; background-color: #3498db; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">XPath Oluştur</button>
        <button id="panel-generate-css" style="flex: 1; background-color: #3498db; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">CSS Oluştur</button>
      </div>
    </div>
    
    <div style="margin-top: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <h4 style="margin: 0; font-size: 14px; color: #2c3e50;">Seçici Listesi</h4>
        <button id="clear-history" style="background-color: #e74c3c; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;">Listeyi Temizle</button>
      </div>
      <div style="background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; max-height: 150px; overflow-y: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background-color: #eee; text-align: left;">
              <th style="padding: 6px; border-bottom: 1px solid #ddd;">Tür</th>
              <th style="padding: 6px; border-bottom: 1px solid #ddd;">Seçici</th>
              <th style="padding: 6px; border-bottom: 1px solid #ddd;">İşlem</th>
            </tr>
          </thead>
          <tbody id="selector-history">
            <!-- Seçici geçmişi buraya eklenecek -->
          </tbody>
        </table>
      </div>
    </div>
  </div>
`;

// Panel sürükleme için değişkenler
let isDragging = false;
let dragOffsetX, dragOffsetY;

// Panel başlığına tıklandığında sürüklemeyi başlat
selectorPanel.querySelector('div:first-child').addEventListener('mousedown', function (e) {
    // Minimize ve close butonlarına tıklandığında sürüklemeyi başlatma
    if (e.target.id === 'minimize-panel' || e.target.id === 'close-panel') {
        return;
    }

    isDragging = true;
    dragOffsetX = e.clientX - selectorPanel.getBoundingClientRect().left;
    dragOffsetY = e.clientY - selectorPanel.getBoundingClientRect().top;

    // Sürükleme sırasında seçimi engelle
    e.preventDefault();
});

// Fare hareket ettiğinde paneli sürükle
document.addEventListener('mousemove', function (e) {
    if (isDragging) {
        selectorPanel.style.left = (e.clientX - dragOffsetX) + 'px';
        selectorPanel.style.top = (e.clientY - dragOffsetY) + 'px';
    }
});

// Fare bırakıldığında sürüklemeyi bitir
document.addEventListener('mouseup', function () {
    if (isDragging) {
        isDragging = false;
        // Veri saklama fonksiyonu storage.js'de tanımlanacak
        if (typeof saveData === 'function') {
            saveData();
        }
    }
});

// Minimize butonuna tıklama olayı
document.getElementById('minimize-panel').addEventListener('click', function () {
    const panelContent = selectorPanel.querySelector('div:nth-child(2)');
    const closeButton = document.getElementById('close-panel');

    if (panelContent.style.display === 'none') {
        panelContent.style.display = 'block';
        this.textContent = '_';
        closeButton.style.display = 'inline';
    } else {
        panelContent.style.display = 'none';
        this.textContent = '□';
        closeButton.style.display = 'inline';
    }
});

// Kapat butonuna tıklama olayı
document.getElementById('close-panel').addEventListener('click', function () {
    selectorPanel.style.display = 'none';
    isPanelVisible = false;
    // Veri saklama fonksiyonu storage.js'de tanımlanacak
    if (typeof saveData === 'function') {
        saveData();
    }
});

// Listeyi temizleme butonu için olay dinleyicisi
document.getElementById('clear-history').addEventListener('click', function () {
    const historyTable = document.getElementById('selector-history');
    historyTable.innerHTML = ''; // Tüm seçici geçmişini temizle

    // Bildirim gösterme fonksiyonu utils.js'de tanımlanacak
    if (typeof showNotification === 'function') {
        showNotification('Seçici listesi temizlendi');
    }

    // Eğer storage kullanıyorsanız, storage'ı da temizleyin
    if (typeof chrome !== 'undefined' && chrome.storage) {
        try {
            chrome.storage.local.remove('selectorHistory', function () {
                console.log('Seçici geçmişi storage\'dan temizlendi');
            });
        } catch (error) {
            console.error('Storage temizleme hatası:', error);
        }
    }
});

// Paneli sayfaya eklemeden önce resize handle ekle
const resizeHandle = document.createElement('div');
resizeHandle.style.cssText = `
  position: absolute;
  width: 16px;
  height: 16px;
  right: 0;
  bottom: 0;
  cursor: se-resize;
  background: linear-gradient(135deg, #ccc 40%, #fff 60%);
  z-index: 10001;
  border-bottom-right-radius: 8px;
`;
selectorPanel.appendChild(resizeHandle);

let isResizing = false;
let lastMouseX, lastMouseY, startWidth, startHeight;

resizeHandle.addEventListener('mousedown', function (e) {
    isResizing = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    startWidth = selectorPanel.offsetWidth;
    startHeight = selectorPanel.offsetHeight;
    document.body.style.userSelect = 'none';
    e.preventDefault();
});

document.addEventListener('mousemove', function (e) {
    if (isResizing) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        let newWidth = Math.max(300, startWidth + dx);
        let newHeight = Math.max(200, startHeight + dy);
        selectorPanel.style.width = newWidth + 'px';
        selectorPanel.style.height = newHeight + 'px';
    }
});

document.addEventListener('mouseup', function (e) {
    if (isResizing) {
        isResizing = false;
        document.body.style.userSelect = '';
        // Panel boyutu değiştiğinde event tetikle
        const resizeEvent = new Event('panelResized');
        selectorPanel.dispatchEvent(resizeEvent);
        if (typeof saveData === 'function') {
            saveData();
        }
    }
});

// Paneli sayfaya ekle
document.body.appendChild(selectorPanel);

// Dışa aktarılacak değişkenler ve fonksiyonlar
export { selectorPanel };