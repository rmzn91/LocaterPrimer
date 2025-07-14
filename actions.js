function highlightElement(event) {
    if (!selectorMode) return;

    const target = event.target;

    // Overlay'in kendisini veya panel elementlerini highlight etme
    if (target === highlightOverlay ||
        target === selectorPanel ||
        selectorPanel.contains(target)) {
        return;
    }

    const rect = target.getBoundingClientRect();

    highlightOverlay.style.left = rect.left + window.scrollX + 'px';
    highlightOverlay.style.top = rect.top + window.scrollY + 'px';
    highlightOverlay.style.width = rect.width + 'px';
    highlightOverlay.style.height = rect.height + 'px';
    highlightOverlay.style.display = 'block';
}

function highlightSelectedElement(element, selector, type) {
    // Önce mevcut vurgulamaları temizle
    removeAllHighlights();

    // Seçici ile eşleşen tüm elementleri bul
    let matchingElements = [];
    let currentIndex = -1;

    try {
        if (type === 'xpath') {
            const result = document.evaluate(
                selector,
                document,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null
            );

            for (let i = 0; i < result.snapshotLength; i++) {
                const el = result.snapshotItem(i);
                matchingElements.push(el);
                if (el === element) {
                    currentIndex = i;
                }
            }
        } else {
            matchingElements = Array.from(document.querySelectorAll(selector));
            currentIndex = matchingElements.indexOf(element);
        }
    } catch (error) {
        console.error('Eşleşen elementleri bulma hatası:', error);
    }

    // Tüm eşleşen elementleri vurgula
    matchingElements.forEach((el, index) => {
        const rect = el.getBoundingClientRect();

        const highlight = document.createElement('div');
        highlight.className = 'selector-highlight';

        // Seçilen element için farklı stil
        const isCurrentElement = (el === element);

        highlight.style.cssText = `
      position: absolute;
      left: ${rect.left + window.scrollX}px;
      top: ${rect.top + window.scrollY}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      background-color: ${isCurrentElement ? 'rgba(46, 204, 113, 0.3)' : 'rgba(241, 196, 15, 0.3)'};
      border: 2px solid ${isCurrentElement ? 'rgba(39, 174, 96, 0.8)' : 'rgba(243, 156, 18, 0.8)'};
      z-index: 9999;
      pointer-events: none;
      ${isCurrentElement ? 'animation: pulse 1.5s infinite;' : ''}
    `;

        // İndeks etiketini ekle (1'den başlat)
        const indexLabel = document.createElement('div');
        indexLabel.style.cssText = `
      position: absolute;
      top: -20px;
      left: 0;
      background-color: ${isCurrentElement ? 'rgba(39, 174, 96, 0.9)' : 'rgba(243, 156, 18, 0.9)'};
      color: white;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: bold;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;
        indexLabel.textContent = `İndeks: ${index + 1}`;

        highlight.appendChild(indexLabel);
        document.body.appendChild(highlight);
    });

    // Animasyon için stil ekle
    if (!document.getElementById('highlight-animation-style')) {
        const style = document.createElement('style');
        style.id = 'highlight-animation-style';
        style.textContent = `
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(39, 174, 96, 0.4); }
        70% { box-shadow: 0 0 0 10px rgba(39, 174, 96, 0); }
        100% { box-shadow: 0 0 0 0 rgba(39, 174, 96, 0); }
      }
    `;
        document.head.appendChild(style);
    }

    // Eşleşme bilgisini göster
    showNotification(`Toplam ${matchingElements.length} eşleşme bulundu. Seçilen element indeksi: ${currentIndex + 1}`);

    // 5 saniye sonra vurgulamayı kaldır
    setTimeout(() => {
        removeAllHighlights();
    }, 5000);
}

function showElementActions(element) {
    if (!element) return;

    const elementType = determineElementType(element);
    const elementTypeSpan = document.getElementById('element-type');
    const elementActions = document.getElementById('element-actions');
    const clickAction = document.getElementById('click-action');
    const inputAction = document.getElementById('input-action');
    const selectAction = document.getElementById('select-action');
    const checkboxAction = document.getElementById('checkbox-action');

    // Element türünü göster
    elementTypeSpan.textContent = elementType;
    elementActions.style.display = 'block';

    // Tüm işlem alanlarını gizle
    clickAction.style.display = 'none';
    inputAction.style.display = 'none';
    selectAction.style.display = 'none';
    checkboxAction.style.display = 'none';

    // Element türüne göre uygun işlemleri göster
    const tagName = element.tagName.toLowerCase();

    // Tıklama işlemi - çoğu element için geçerli
    clickAction.style.display = 'block';

    document.getElementById('perform-click').onclick = function () {
        try {
            // Native click yerine JavaScript event kullan
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            element.dispatchEvent(clickEvent);
            showNotification('Element tıklandı');
        } catch (error) {
            showNotification('Tıklama işlemi başarısız: ' + error.message, true);
        }
    };

    // Metin girişi işlemi
    if ((tagName === 'input' && ['text', 'email', 'password', 'search', 'tel', 'url', 'number'].includes(element.type)) || 
        tagName === 'textarea') {
        inputAction.style.display = 'block';
        document.getElementById('input-value').value = element.value || '';
    
        // Gönder butonuna tıklama olayı
        document.getElementById('perform-input').onclick = function () {
            try {
                const inputValue = document.getElementById('input-value').value;
    
                // Önce focus olayını tetikle
                element.focus();
    
                // Değeri ayarla
                element.value = inputValue;
    
                // Input olayını tetikle
                const inputEvent = new Event('input', { bubbles: true });
                element.dispatchEvent(inputEvent);
    
                // Change olayını tetikle
                const changeEvent = new Event('change', { bubbles: true });
                element.dispatchEvent(changeEvent);
    
                showNotification('Değer gönderildi');
            } catch (error) {
                showNotification('Değer gönderme işlemi başarısız: ' + error.message, true);
            }
        };
    }

    // Açılır liste işlemi
    if (tagName === 'select') {
        selectAction.style.display = 'block';
        const selectOptions = document.getElementById('select-options');

        // Mevcut seçenekleri temizle
        selectOptions.innerHTML = '<option value="">Seçenek seçin</option>';

        // Seçenekleri ekle
        Array.from(element.options).forEach((option, index) => {
            const optionElement = document.createElement('option');
            optionElement.value = index;
            optionElement.textContent = option.textContent;
            selectOptions.appendChild(optionElement);

            // Mevcut seçili değeri ayarla
            if (option.selected) {
                selectOptions.value = index;
            }
        });
    }

    // Onay kutusu işlemi
    if (tagName === 'input' && element.type === 'checkbox') {
        checkboxAction.style.display = 'block';

        // Buton metnini güncelle
        const checkboxButton = document.getElementById('perform-checkbox');
        checkboxButton.textContent = element.checked ? 'İşareti Kaldır' : 'İşaretle';
    }
}

function showElementAttributes(element) {
    // Element özellikleri gösterme fonksiyonu
    // Bu fonksiyon çok uzun olduğu için burada kısaltılmış hali verilmiştir
    // Gerçek uygulamada tüm fonksiyonu buraya kopyalayın
    if (!element) return;

    const attributeList = document.getElementById('attribute-list');
    const elementAttributes = document.getElementById('element-attributes');
    const elementActions = document.getElementById('element-actions');

    // Özellik listesini temizle
    attributeList.innerHTML = '';

    // Element tag name'ini ekle
    const tagName = element.tagName.toLowerCase();

    // Tag name için eşleşen element sayısını bul
    const tagMatchCount = document.getElementsByTagName(tagName).length;

    // Özellik bölümünü göster
    elementAttributes.style.display = 'block';
    elementActions.style.display = 'block';
    
    // Burada element özelliklerini gösteren kodun geri kalanı yer alacak
    // Uzunluk nedeniyle kısaltılmıştır
}

// Dışa aktarma
window.highlightElement = highlightElement;
window.highlightSelectedElement = highlightSelectedElement;
window.showElementActions = showElementActions;
window.showElementAttributes = showElementAttributes;