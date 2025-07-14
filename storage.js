// Veri saklama ve geri yükleme fonksiyonları
import { selectorPanel } from './ui.js';
import { addToSelectorHistory } from './selectors.js';

// Seçici geçmişini sakla
function saveData() {
  try {
    // Panel görünürlük durumunu kaydet
    const isPanelVisible = selectorPanel.style.display !== 'none';

    // Seçici geçmişini al
    const historyTable = document.getElementById('selector-history');
    const historyRows = historyTable ? Array.from(historyTable.querySelectorAll('tr')) : [];

    const selectorHistory = historyRows.map(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 2) {
        // Seçici türü ve değerini al
        const type = cells[0].textContent;
        const selector = cells[1].textContent.split('(')[0].trim(); // Eşleşme sayısını kaldır
        console.log(type);
        return { type, selector };
      }
      return null;
    }).filter(item => item !== null);

    // Panel pozisyonunu ve boyutunu al
    const panelPosition = {
      left: selectorPanel.style.left || '20px',
      top: selectorPanel.style.top || '20px',
      width: selectorPanel.style.width || selectorPanel.offsetWidth + 'px',
      height: selectorPanel.style.height || selectorPanel.offsetHeight + 'px'
    };

    // Verileri kaydederken isPanelVisible'ı doğru şekilde al
    chrome.storage.local.set(
      {
        selectorHistory, // Seçici listesi
        panelPosition,   // Panel pozisyonu
        isPanelVisible: selectorPanel.style.display === "block" // Panel görünürlüğü
      },
      () => {
        // Debug için kaydedilen verileri konsola yazdır
        console.log("KAYDEDİLDİ:", {
          selectorHistory,
          panelPosition,
          isPanelVisible: selectorPanel.style.display === "block"
        });
      }
    );
  } catch (error) {
    console.error("Kaydetme hatası:", error);
  }
}

// Verileri geri yükle
function loadData() {
  chrome.storage.local.get(
    ["selectorHistory", "panelPosition", "isPanelVisible"], // Tüm verileri al
    (result) => {
      // Debug için yüklenen verileri konsola yazdır
      console.log("YÜKLENEN VERİLER:", result);

      // Panel pozisyonunu ve boyutunu ayarla
      if (result.panelPosition) {
        selectorPanel.style.left = result.panelPosition.left;
        selectorPanel.style.top = result.panelPosition.top;
        if (result.panelPosition.width) selectorPanel.style.width = result.panelPosition.width;
        if (result.panelPosition.height) selectorPanel.style.height = result.panelPosition.height;
      }

      // Global değişkeni güncelle
      window.isPanelVisible = result.isPanelVisible;
      selectorPanel.style.display = result.isPanelVisible ? "block" : "none";

      // Seçici geçmişini yükle
      if (result.selectorHistory?.length > 0) {
        const historyTable = document.getElementById("selector-history");
        if (historyTable) {
          historyTable.innerHTML = ""; // Eski verileri temizle

          result.selectorHistory.forEach((item) => {
            // Tür eşleştirmesini düzelt (XPath Attribute → xpath-attr vb.)
            let selectorType;
            switch (item.type) {
              case "XPath Class":
                selectorType = "xpath-class";
                break;
              case "XPath Attribute":
                selectorType = "xpath-attr";
                break;
              case "CSS ID":
                selectorType = "css-id";
                break;
              case "CSS Name":
                selectorType = "css-name";
                break;
              case "CSS Class":
                selectorType = "css-class";
                break;
              case "Tag Name":
                selectorType = "tagName";
                break;
              default:
                console.warn("Bilinmeyen tür:", item.type);
                return;
            }

            // Geçmişe ekle - window öneki olmadan çağır
            if (typeof window.originalAddToSelectorHistory === 'function') {
              window.originalAddToSelectorHistory(selectorType, item.selector);
            } else if (typeof window.addToSelectorHistory === 'function') {
              window.addToSelectorHistory(selectorType, item.selector);
            } else if (typeof originalAddToSelectorHistory === 'function') {
              originalAddToSelectorHistory(selectorType, item.selector);
            } else if (typeof addToSelectorHistory === 'function') {
              addToSelectorHistory(selectorType, item.selector);
            }
          });
        }
      }
    }
  );
}

// Sayfa yüklendiğinde verileri geri yükle
document.addEventListener('DOMContentLoaded', function () {
  setTimeout(loadData, 1000); // Sayfanın tamamen yüklenmesi için biraz daha uzun süre bekle
});

// Dışa aktarılacak fonksiyonlar
export { saveData, loadData };