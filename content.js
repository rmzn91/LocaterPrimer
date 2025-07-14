// Seçici modu aktif mi?
let selectorMode = false;
let selectedElement = null;
let currentSelectorType = 'xpath';
let shadowDomSupport = false;
let iframeSupport = false;
let isPanelVisible = false;
let pendingSelectorToAdd = false;
let lastAddedSelector = null;
let lastAddedType = null;

// Active notification element
let activeNotification = null;

// Notification display function (updated)
function showNotification(message, isError = false) {
    // If there is an active notification, remove it first
    if (activeNotification && activeNotification.parentNode) {
        document.body.removeChild(activeNotification);
        activeNotification = null;
    }

    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: ${isError ? 'rgba(231, 76, 60, 0.9)' : 'rgba(52, 152, 219, 0.9)'};
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
    z-index: 10001;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  `;

    document.body.appendChild(notification);
    activeNotification = notification;

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease';

        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
                if (activeNotification === notification) {
                    activeNotification = null;
                }
            }
        }, 500);
    }, 3000);
}

// Create panel (only once)
const selectorPanel = document.createElement('div');
selectorPanel.id = 'xpath-css-selector-panel';
selectorPanel.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  width: 750px;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 10000;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: none;
  overflow: hidden;
`;
selectorPanel.innerHTML = `
  <div style="padding: 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background-color: #f8f9fa;">
    <h3 style="margin: 0; font-size: 16px; color: #2c3e50;">Element Selector Generator</h3>
    <div>
      <button id="minimize-panel" style="background: none; border: none; cursor: pointer; font-size: 16px; color: #7f8c8d; margin-right: 5px;">_</button>
      <button id="close-panel" style="background: none; border: none; cursor: pointer; font-size: 16px; color: #7f8c8d;">×</button>
    </div>
  </div>
  <div style="padding: 12px;">
    <div id="language-tool-container" style="margin-bottom: 16px; border: 2px solid #3498db; border-radius: 6px; padding: 10px; background: #f4faff; display: flex; gap: 12px; align-items: center;">
      <label for="language-select" style="font-size: 13px; color: #2c3e50; font-weight: 500;">Software Language:</label>
      <select id="language-select" style="padding: 5px 10px; border-radius: 4px; border: 1px solid #ccc;">
        <option value="java">Java</option>
        <option value="python">Python</option>
        <option value="csharp">C#</option>
        <option value="javascript">JavaScript</option>
        <option value="typescript">TypeScript</option>
        <option value="ruby">Ruby</option>
        <option value="kotlin">Kotlin</option>
      </select>
      <label for="tool-select" style="font-size: 13px; color: #2c3e50; font-weight: 500;">Tool:</label>
      <select id="tool-select" style="padding: 5px 10px; border-radius: 4px; border: 1px solid #ccc;">
        <option value="selenium">Selenium</option>
        <option value="cypress">Cypress</option>
        <option value="playwright">Playwright</option>
        <option value="webdriverio">WebdriverIO</option>
        <option value="testcafe">TestCafe</option>
        <option value="puppeteer">Puppeteer</option>
        <option value="selenide">Selenide</option>
        <option value="robotframework">Robot Framework</option>
      </select>
    </div>
    <div style="margin-bottom: 12px;">
      <button id="activate-panel-selector" style="background-color: #3498db; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; width: 100%;">Select Element</button>
    </div>
    <div style="margin-top: 16px;">
      <h4 style="margin: 0 0 8px; font-size: 14px; color: #2c3e50;">Result</h4>
      <div style="background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin-bottom: 8px; max-height: 100px; overflow-y: auto; word-break: break-all; font-family: monospace; font-size: 12px;" id="panel-selector-result">No element selected yet</div>
      <div id="panel-validation-result" style="margin: 8px 0; font-size: 12px; min-height: 18px;"></div>
      <button id="panel-copy-selector" style="background-color: #3498db; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; width: 100%;" disabled>Copy</button>
    </div>
    <div id="element-attributes" style="margin-top: 16px; display: none;">
      <h4 style="margin: 0 0 8px; font-size: 14px; color: #2c3e50;">Element Properties</h4>
      <div style="background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin-bottom: 8px; max-height: 200px; overflow-y: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background-color: #eee; text-align: left;">
              <th style="padding: 6px; border-bottom: 1px solid #ddd;">Property</th>
              <th style="padding: 6px; border-bottom: 1px solid #ddd;">Value</th>
              <th style="padding: 6px; border-bottom: 1px solid #ddd;">Matching</th>
              <th style="padding: 6px; border-bottom: 1px solid #ddd;">Process</th>
            </tr>
          </thead>
          <tbody id="attribute-list">
            <!-- Properties will be added here -->
          </tbody>
        </table>
      </div>
    </div>
    <div id="element-actions" style="margin-top: 16px; display: none;">
      <h4 style="margin: 0 0 8px; font-size: 14px; color: #2c3e50;">Element Operations</h4>
      <div style="background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin-bottom: 8px;">
        <div id="element-type-info" style="margin-bottom: 8px; font-size: 12px;">Element Type: <span id="element-type">-</span></div>
        <div id="click-action" style="margin-bottom: 8px;">
          <button id="perform-click" style="background-color: #3498db; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; width: 100%;">Click</button>
        </div>
        <div id="input-action" style="margin-bottom: 8px; display: none;">
          <div style="display: flex; gap: 5px; margin-bottom: 5px;">
            <input type="text" id="input-value" placeholder="Enter value" style="flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
            <button id="perform-input" style="background-color: #3498db; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Send</button>
          </div>
        </div>
        <div id="select-action" style="margin-bottom: 8px; display: none;">
          <div style="display: flex; gap: 5px; margin-bottom: 5px;">
            <select id="select-options" style="flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                <option value="">Select option</option>
            </select>
            <button id="perform-select" style="background-color: #3498db; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Select</button>
          </div>
        </div>
        <div id="checkbox-action" style="margin-bottom: 8px; display: none;">
          <button id="perform-checkbox" style="background-color: #3498db; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; width: 100%;">Change Status</button>
        </div>
      </div>
    </div>
    <div style="margin-top: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <h4 style="margin: 0; font-size: 14px; color: #2c3e50;">Selector List</h4>
        <button id="copy-all-selectors" style="margin-left: 12px; background-color: #27ae60; color: white; border: none; padding: 4px 10px; border-radius: 3px; cursor: pointer; font-size: 12px; vertical-align: middle;">Copy All</button>
        <button id="clear-history" style="background-color: #e74c3c; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px; float: right;">Clear List</button>
      </div>
      <div style="background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; max-height: 150px; overflow-y: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background-color: #eee; text-align: left;">
              <th style="padding: 6px; border-bottom: 1px solid #ddd;">Type</th>
              <th style="padding: 6px; border-bottom: 1px solid #ddd;">Selector</th>
              <th style="padding: 6px; border-bottom: 1px solid #ddd;">Process</th>
            </tr>
          </thead>
          <tbody id="selector-history">
            <!-- Selector history will be added here -->
          </tbody>
        </table>
      </div>
    </div>
  </div>
`;
document.body.appendChild(selectorPanel);
attachPanelEventHandlers();

// Style for highlight overlay
const overlayStyles = `
  position: absolute;
  background-color: rgba(52, 152, 219, 0.3);
  border: 2px solid rgba(41, 128, 185, 0.8);
  z-index: 10000;
  pointer-events: none;
  transition: all 0.2s ease;
`;

// Highlight overlay elementi
let highlightOverlay = document.createElement('div');
highlightOverlay.style.cssText = overlayStyles;
highlightOverlay.style.display = 'none';
document.body.appendChild(highlightOverlay);

// Panel olayları
document.getElementById('close-panel').addEventListener('click', function () {
    selectorPanel.style.display = 'none';
    isPanelVisible = false;
});

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
        closeButton.style.display = 'inline'; // Kapatma butonunu her zaman görünür tut
    }
});

document.getElementById('activate-panel-selector').addEventListener('click', function () {
    selectorMode = true;
    document.body.style.cursor = 'crosshair';
    showNotification('Element selection mode active. Click on an element.');

    // Listen to mouse over event
    document.addEventListener('mouseover', highlightElement);
    document.addEventListener('mouseout', removeHighlight);
});

// Sayfa içindeki tıklama olayını dinle
// Sayfa içindeki tıklama olayını dinle
document.addEventListener('click', function (event) {
    if (selectorMode) {
        event.preventDefault();
        event.stopPropagation();

        // Seçici modunu kapat
        selectorMode = false;
        document.body.style.cursor = '';

        // Highlight overlay'i gizle
        highlightOverlay.style.display = 'none';

        // Mouse over olaylarını kaldır
        document.removeEventListener('mouseover', highlightElement);
        document.removeEventListener('mouseout', removeHighlight);

        // Tıklanan elementi kaydet
        selectedElement = event.target;

        // Element özelliklerini göster
        showElementAttributes(selectedElement);

        // Element işlemlerini göster
        showElementActions(selectedElement);

        // Bildirim göster
        showNotification(`Element selected: <${selectedElement.tagName.toLowerCase()}>`);

        return false;
    }
}, true);

// Element üzerine gelince highlight yapma
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

// Highlight kaldırma
function removeHighlight() {
    if (!selectorMode) return;
    highlightOverlay.style.display = 'none';
}

//Copy selectors
document.getElementById('panel-copy-selector').addEventListener('click', function () {
    const selector = document.getElementById('panel-selector-result').textContent;
    const language = document.getElementById('language-select').value;
    const tool = document.getElementById('tool-select').value;
    const notationSelect = document.getElementById('notation-select');
    const notation = notationSelect && notationSelect.style.display !== 'none' ? notationSelect.value : null;

    function getCodeTemplate(language, tool, selector, notation, isFirst) {
        const isXpath = selector.startsWith('/') || selector.startsWith('(') || selector.startsWith('//*[@') || selector.startsWith('//');

        // Enhanced ID detection function
        function extractIdFromSelector(selector) {
            // XPath ID detection patterns
            let idXpathMatch = selector.match(/^\/\/\*\[@id=['"]([^'"]+)['"]\]$/);
            if (idXpathMatch) return idXpathMatch[1];

            // Check //tag[@id='value'] format
            idXpathMatch = selector.match(/^\/\/\w+\[@id=['"]([^'"]+)['"]\]$/);
            if (idXpathMatch) return idXpathMatch[1];

            // Check more complex XPath patterns with id
            idXpathMatch = selector.match(/\[@id=['"]([^'"]+)['"]\]/);
            if (idXpathMatch) return idXpathMatch[1];

            // CSS selector ID detection patterns
            let cssIdMatch = selector.match(/^#([a-zA-Z0-9_-]+)$/);
            if (cssIdMatch) return cssIdMatch[1];

            // CSS selector with other attributes but starting with ID
            cssIdMatch = selector.match(/^#([a-zA-Z0-9_-]+)/);
            if (cssIdMatch) return cssIdMatch[1];

            // CSS selector [id="value"] format
            cssIdMatch = selector.match(/^\[id=['"]([^'"]+)['"]\]$/);
            if (cssIdMatch) return cssIdMatch[1];

            // CSS selector tag[id="value"] format
            cssIdMatch = selector.match(/^\w+\[id=['"]([^'"]+)['"]\]$/);
            if (cssIdMatch) return cssIdMatch[1];

            return null;
        }

        // Extract ID from selector
        const extractedId = extractIdFromSelector(selector);
        const useIdSelector = extractedId !== null;

        function escapeQuotes(str) {
            return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        }

        // JAVA + SELENIUM
        if (language === 'java' && tool === 'selenium') {
            let header = isFirst ? '// Java + Selenium\n' : '';
            if (notation === 'FindBy') {
                if (useIdSelector) return `${header}@FindBy(id = "${extractedId}")\nWebElement element;`;
                return isXpath ? `${header}@FindBy(xpath = "${escapeQuotes(selector)}")\nWebElement element;`
                    : `${header}@FindBy(css = "${escapeQuotes(selector)}")\nWebElement element;`;
            } else {
                if (useIdSelector) return `${header}By locator = By.id("${extractedId}");`;
                return isXpath ? `${header}By locator = By.xpath("${escapeQuotes(selector)}");`
                    : `${header}By locator = By.cssSelector("${escapeQuotes(selector)}");`;
            }
        }

        // JAVA + PLAYWRIGHT
        if (language === 'java' && tool === 'playwright') {
            let header = isFirst ? '// Java + Playwright\n' : '';
            if (useIdSelector) return `${header}Locator locator = page.locator("#${extractedId}");`;
            return isXpath ? `${header}Locator locator = page.locator("xpath=${escapeQuotes(selector)}");`
                : `${header}Locator locator = page.locator("${escapeQuotes(selector)}");`;
        }

        // C# + SELENIUM
        if (language === 'csharp' && tool === 'selenium') {
            let header = isFirst ? '// C# + Selenium\n' : '';
            if (notation === 'FindBy') {
                if (useIdSelector) return `${header}[FindBy(How = How.Id, Using = "${extractedId}")]\nprivate IWebElement element;`;
                return isXpath ? `${header}[FindBy(How = How.XPath, Using = "${escapeQuotes(selector)}")]\nprivate IWebElement element;`
                    : `${header}[FindBy(How = How.CssSelector, Using = "${escapeQuotes(selector)}")]\nprivate IWebElement element;`;
            } else {
                if (useIdSelector) return `${header}By locator = By.Id("${extractedId}");`;
                return isXpath ? `${header}By locator = By.XPath("${escapeQuotes(selector)}");`
                    : `${header}By locator = By.CssSelector("${escapeQuotes(selector)}");`;
            }
        }

        // C# + PLAYWRIGHT
        if (language === 'csharp' && tool === 'playwright') {
            let header = isFirst ? '// C# + Playwright\n' : '';
            if (useIdSelector) return `${header}var locator = page.Locator("#${extractedId}");`;
            return isXpath ? `${header}var locator = page.Locator("xpath=${escapeQuotes(selector)}");`
                : `${header}var locator = page.Locator("${escapeQuotes(selector)}");`;
        }

        // PYTHON + SELENIUM
        if (language === 'python' && tool === 'selenium') {
            let header = isFirst ? '# Python + Selenium\n' : '';
            if (useIdSelector) return `${header}element = driver.find_element(By.ID, "${extractedId}")`;
            return isXpath ? `${header}element = driver.find_element(By.XPATH, "${escapeQuotes(selector)}")`
                : `${header}element = driver.find_element(By.CSS_SELECTOR, "${escapeQuotes(selector)}")`;
        }

        // PYTHON + PLAYWRIGHT
        if (language === 'python' && tool === 'playwright') {
            let header = isFirst ? '# Python + Playwright\n' : '';
            if (useIdSelector) return `${header}locator = page.locator("#${extractedId}")`;
            return isXpath ? `${header}locator = page.locator("xpath=${escapeQuotes(selector)}")`
                : `${header}locator = page.locator("${escapeQuotes(selector)}")`;
        }

        // PYTHON + ROBOT FRAMEWORK
        if (language === 'python' && tool === 'robotframework') {
            let header = isFirst ? '# Robot Framework\n' : '';
            if (useIdSelector) return `${header}Click Element  id=${extractedId}`;
            return isXpath ? `${header}Click Element  xpath=${escapeQuotes(selector)}`
                : `${header}Click Element  css=${escapeQuotes(selector)}`;
        }

        // JAVASCRIPT / TYPESCRIPT + SELENIUM
        if ((language === 'javascript' || language === 'typescript') && tool === 'selenium') {
            let header = isFirst ? '// JS/TS + Selenium\n' : '';
            if (useIdSelector) return `${header}const element = await driver.findElement(By.id("${extractedId}"));`;
            return isXpath ? `${header}const element = await driver.findElement(By.xpath("${escapeQuotes(selector)}"));`
                : `${header}const element = await driver.findElement(By.css("${escapeQuotes(selector)}"));`;
        }

        // JS/TS + CYPRESS
        if ((language === 'javascript' || language === 'typescript') && tool === 'cypress') {
            if (useIdSelector) return `// Cypress (JS/TS)\ncy.get("#${extractedId}")`;
            return isXpath ? `// Cypress (JS/TS) - cypress-xpath plugin gereklidir\ncy.xpath("${escapeQuotes(selector)}")`
                : `// Cypress (JS/TS)\ncy.get("${escapeQuotes(selector)}")`;
        }

        // JS/TS + PLAYWRIGHT
        if ((language === 'javascript' || language === 'typescript') && tool === 'playwright') {
            if (useIdSelector) return `// Playwright (JS/TS)\nawait page.locator('#${extractedId}')`;
            return isXpath ? `// Playwright (JS/TS)\nawait page.locator(\`xpath=${escapeQuotes(selector)}\`)`
                : `// Playwright (JS/TS)\nawait page.locator("${escapeQuotes(selector)}")`;
        }

        // JS/TS + PUPPETEER
        if ((language === 'javascript' || language === 'typescript') && tool === 'puppeteer') {
            if (useIdSelector) return `// Puppeteer (JS/TS)\nconst element = await page.$("#${extractedId}");`;
            return isXpath ? `// Puppeteer (JS/TS)\nconst elements = await page.$x("${escapeQuotes(selector)}");\nconst element = elements[0];`
                : `// Puppeteer (JS/TS)\nconst element = await page.$("${escapeQuotes(selector)}");`;
        }

        // RUBY + SELENIUM
        if (language === 'ruby' && tool === 'selenium') {
            let header = isFirst ? '# Ruby + Selenium\n' : '';
            if (useIdSelector) return `${header}element = driver.find_element(:id, "${extractedId}")`;
            return isXpath ? `${header}element = driver.find_element(:xpath, "${escapeQuotes(selector)}")`
                : `${header}element = driver.find_element(:css, "${escapeQuotes(selector)}")`;
        }

        // KOTLIN + SELENIUM
        if (language === 'kotlin' && tool === 'selenium') {
            let header = isFirst ? '// Kotlin + Selenium\n' : '';
            if (useIdSelector) return `${header}val element = driver.findElement(By.id("${extractedId}"))`;
            return isXpath ? `${header}val element = driver.findElement(By.xpath("${escapeQuotes(selector)}"))`
                : `${header}val element = driver.findElement(By.cssSelector("${escapeQuotes(selector)}"))`;
        }

        // KOTLIN + SELENIDE
        if (language === 'kotlin' && tool === 'selenide') {
            let header = isFirst ? '// Kotlin + Selenide\n' : '';
            if (useIdSelector) return `${header}val element = \$By.id("${extractedId}")`;
            return isXpath ? `${header}val element = \$By.xpath("${escapeQuotes(selector)}")`
                : `${header}val element = \$("${escapeQuotes(selector)}")`;
        }

        return selector;
    }

    const code = getCodeTemplate(language, tool, selector, notation, true);
    if (!code || code === 'No element selected yet') {
        showNotification('No selector to copy!', true);
        return;
    }

    const copyBtn = this;
    copyBtn.textContent = 'Copied!';
    copyBtn.style.backgroundColor = '#27ae60';

    navigator.clipboard.writeText(code)
        .then(() => {
            setTimeout(() => {
                copyBtn.textContent = 'Copy';
                copyBtn.style.backgroundColor = '#3498db';
            }, 2000);
        })
        .catch(err => {
            showNotification('Copy error: ' + err.message, true);
            setTimeout(() => {
                copyBtn.textContent = 'Copy';
                copyBtn.style.backgroundColor = '#3498db';
            }, 2000);
        });
});

// Seçici geçmişine ekle
const originalAddToSelectorHistory = function (type, selector) {
    const historyTable = document.getElementById('selector-history');
    // --- YENİ: Aynı tip ve seçici zaten varsa tekrar ekleme ---
    const existingRows = Array.from(historyTable.querySelectorAll('tr'));
    const alreadyExists = existingRows.some(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 2) return false;
        const rowType = cells[0].textContent.trim();
        // Selector hücresinden span'leri çıkar, sadece gerçek seçiciyi al
        let selectorCell = cells[1].cloneNode(true);
        selectorCell.querySelectorAll('span').forEach(span => span.remove());
        const rowSelector = selectorCell.textContent.trim();
        return rowType === type && rowSelector === selector;
    });
    if (alreadyExists) return; // Zaten varsa ekleme
    // --- SON YENİ ---
    const row = document.createElement('tr');
    row.style.borderBottom = '1px solid #ddd';

    // Seçici ile eşleşen element sayısını bul
    let matchCount = 0;
    try {
        if (type.startsWith('xpath')) {
            const result = document.evaluate(
                selector,
                document,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null
            );
            matchCount = result.snapshotLength;
        } else if (type === 'tagName') {
            matchCount = document.getElementsByTagName(selector).length;
        } else {
            matchCount = document.querySelectorAll(selector).length;
        }

    } catch (error) {
        console.error('Error calculating the number of matching elements:', error);
    }

    // Otomasyon aracı için uygun format bilgisi
    let automationFormat = '';
    if (type === 'tagName') {
        automationFormat = 'Tag Name';
    } else if (type === 'css-id') {
        automationFormat = 'CSS ID';
    } else if (type === 'css-name') {
        automationFormat = 'CSS Name';
    } else if (type === 'css-class') {
        automationFormat = 'CSS Class';
    } else if (type === 'xpath-class') {
        automationFormat = 'XPath Class';
    } else if (type === 'xpath-attr') {
        automationFormat = 'XPath Attribute';
    }

    row.innerHTML = `
    <td style="padding: 6px;">${automationFormat}</td>
    <td style="padding: 6px; word-break: break-all;">${selector} <span style="color: #7f8c8d; font-size: 10px;">(${matchCount} eşleşme)</span></td>
    <td style="padding: 6px;">
      <div style="display: flex; gap: 3px;">
        <button class="use-selector" style="background-color: #3498db; color: white; border: none; padding: 2px 5px; border-radius: 2px; cursor: pointer; font-size: 10px;">Use it</button>
        <button class="delete-selector" style="background-color: #e74c3c; color: white; border: none; padding: 2px 5px; border-radius: 2px; cursor: pointer; font-size: 10px;">Delete</button>
      </div>
    </td>
  `;

    historyTable.appendChild(row);

    // Kullan butonuna tıklama olayı
    row.querySelector('.use-selector').addEventListener('click', function () {
        let usedSelector = selector;
        let usedType = type.startsWith('xpath') ? 'xpath' : (type === 'tagName' ? 'tagName' : 'css');
        // Eğer CSS indexli seçici ise XPath'e çevir
        const nthOfTypeMatch = usedSelector.match(/^(.*)\:nth-of-type\((\d+)\)$/);
        if (usedType === 'css' && nthOfTypeMatch) {
            let baseSelector = nthOfTypeMatch[1];
            let index = nthOfTypeMatch[2];
            if (baseSelector.startsWith('[') && baseSelector.endsWith(']')) {
                usedSelector = `(//*${baseSelector})[${index}]`;
                usedType = 'xpath';
            } else if (baseSelector.startsWith('.')) {
                const className = baseSelector.slice(1);
                usedSelector = `(//*[contains(concat(' ',normalize-space(@class),' '),' ${className} ')])[${index}]`;
                usedType = 'xpath';
            } else if (baseSelector.startsWith('#')) {
                const idName = baseSelector.slice(1);
                usedSelector = `(//*[@id='${idName}'])[${index}]`;
                usedType = 'xpath';
            }
        }
        document.getElementById('panel-selector-result').textContent = usedSelector;
        document.getElementById('panel-copy-selector').disabled = false;

        // Find element using selector
        const element = findElementBySelector(usedSelector, usedType);
        if (element) {
            // Show element actions
            showElementActions(element);

            // Highlight element visually
            highlightSelectedElement(element, usedSelector, usedType);

            // Show element attributes
            showElementAttributes(element);

            // Show notification
            showNotification(`Selector used: ${usedSelector}`);
        } else {
            showNotification('No elements matching this selector were found', true);
        }
    });

    // Delete button click event
    row.querySelector('.delete-selector').addEventListener('click', function () {
        historyTable.removeChild(row);
        saveData(); // Update storage after deletion
    });

}

// Highlight selected element visually
function highlightSelectedElement(element, selector, type) {
    // First clear existing highlights
    removeAllHighlights();

    // Find all elements matching the selector
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
        console.error('Error finding matching elements:', error);
    }

    // Highlight all matching elements
    matchingElements.forEach((el, index) => {
        const rect = el.getBoundingClientRect();

        const highlight = document.createElement('div');
        highlight.className = 'selector-highlight';

        // Different style for selected element
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

        // Add index label (start from 1)
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

    // Add style for animation
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

    // Show match information
    showNotification(`Total ${matchingElements.length} matches found. Selected element index: ${currentIndex + 1}`);

    // Remove highlight after 5 seconds
    setTimeout(() => {
        removeAllHighlights();
    }, 5000);
}

// Clear all highlights
function removeAllHighlights() {
    const highlights = document.querySelectorAll('.selector-highlight');
    highlights.forEach(highlight => {
        if (highlight.parentNode) {
            highlight.parentNode.removeChild(highlight);
        }
    });
}

// Show element attributes function
function showElementAttributes(element) {
    if (!element) return;

    const attributeList = document.getElementById('attribute-list');
    const elementAttributes = document.getElementById('element-attributes');
    const elementActions = document.getElementById('element-actions');

    // Clear property list
    attributeList.innerHTML = '';

    // Add element tag name
    const tagName = element.tagName.toLowerCase();

    // Find number of elements matching tag name
    const tagMatchCount = document.getElementsByTagName(tagName).length;

    const tagRow = document.createElement('tr');
    tagRow.style.borderBottom = '1px solid #ddd';
    // --- Matching > 1 ise Index ve input alanı göster ---
    let tagProcessCellHtml = '';
    if (tagMatchCount > 1) {
        tagProcessCellHtml = `
        <button id="index-btn-tagName-${tagName}" class="index-highlight-btn" style="background-color: #8e44ad; color: white; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 10px;">Index</button>
        <input id="index-input-tagName-${tagName}" type="number" min="1" max="${tagMatchCount}" value="1" style="width: 40px; font-size: 11px; padding: 2px 4px; border-radius: 2px; border: 1px solid #ccc;" />
        <button class="use-attribute" data-attr="tagName" data-value="${tagName}" style="background-color: #3498db; color: white; border: none; padding: 2px 5px; border-radius: 2px; cursor: pointer; font-size: 10px;">Add</button>
      `;
    } else {
        tagProcessCellHtml = `
        <button class="use-attribute" data-attr="tagName" data-value="${tagName}" style="background-color: #3498db; color: white; border: none; padding: 2px 5px; border-radius: 2px; cursor: pointer; font-size: 10px;">Add</button>
        <!--
        <button id="index-btn-tagName-${tagName}" class="index-highlight-btn" style="background-color: #8e44ad; color: white; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 10px;" disabled>Index</button>
        <input id="index-input-tagName-${tagName}" type="number" min="1" max="${tagMatchCount}" value="1" style="width: 40px; font-size: 11px; padding: 2px 4px; border-radius: 2px; border: 1px solid #ccc;" disabled />
        -->
      `;
    }
    tagRow.innerHTML = `
    <td style="padding: 6px; font-weight: bold;">tagName</td>
    <td style="padding: 6px;">${tagName}</td>
    <td style="padding: 6px; text-align: center;">${tagMatchCount}</td>
    <td style="padding: 6px; display: flex; gap: 4px; align-items: center;">
      ${tagProcessCellHtml}
    </td>
  `;
    attributeList.appendChild(tagRow);

    // Add all attributes
    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];

        // Find number of elements with this attribute
        let matchCount = 0;
        try {
            const xpath = `//${tagName}[@${attr.name}="${attr.value}"]`;
            const result = document.evaluate(
                xpath,
                document,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null
            );
            matchCount = result.snapshotLength;
        } catch (error) {
            console.error('Error calculating the number of matching elements:', error);
        }

        // Create property row
        const attrRow = document.createElement('tr');
        attrRow.style.borderBottom = '1px solid #ddd';

        // Different style for unique attribute
        const isUnique = (matchCount === 1);

        // Check for underscore in ID value
        let buttonColor = '#3498db';
        if (attr.name === 'id' && attr.value.includes('_')) {
            buttonColor = '#e74c3c'; // Red color
        } else if (isUnique) {
            buttonColor = '#27ae60'; // Green color (unique)
        }

        // Add index button, number input and add button to action cell
        const indexInputId = `index-input-${attr.name}-${attr.value}`.replace(/[^a-zA-Z0-9_-]/g, '');
        const indexBtnId = `index-btn-${attr.name}-${attr.value}`.replace(/[^a-zA-Z0-9_-]/g, '');
        const addBtnId = `add-btn-${attr.name}-${attr.value}`.replace(/[^a-zA-Z0-9_-]/g, '');

        // --- Matching > 1 ise Index ve input alanı göster ---
        let processCellHtml = '';
        if (matchCount > 1) {
            processCellHtml = `
            <button id="${indexBtnId}" class="index-highlight-btn" style="background-color: #8e44ad; color: white; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 10px;">Index</button>
            <input id="${indexInputId}" type="number" min="1" max="${matchCount}" value="1" style="width: 40px; font-size: 11px; padding: 2px 4px; border-radius: 2px; border: 1px solid #ccc;" />
            <button id="${addBtnId}" class="use-attribute" data-attr="${attr.name}" data-value="${attr.value}" style="background-color: ${buttonColor}; color: white; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 10px;">Add</button>
          `;
        } else {
            processCellHtml = `
            <button id="${addBtnId}" class="use-attribute" data-attr="${attr.name}" data-value="${attr.value}" style="background-color: ${buttonColor}; color: white; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 10px;">Add</button>
            <!--
            <button id="${indexBtnId}" class="index-highlight-btn" style="background-color: #8e44ad; color: white; border: none; padding: 2px 6px; border-radius: 2px; cursor: pointer; font-size: 10px;" disabled>Index</button>
            <input id="${indexInputId}" type="number" min="1" max="${matchCount}" value="1" style="width: 40px; font-size: 11px; padding: 2px 4px; border-radius: 2px; border: 1px solid #ccc;" disabled />
            -->
          `;
        }

        attrRow.innerHTML = `
      <td style="padding: 6px; font-weight: bold; ${isUnique ? 'color: #27ae60;' : ''}">${attr.name}</td>
      <td style="padding: 6px; ${isUnique ? 'color: #27ae60;' : ''}">${attr.value}</td>
      <td style="padding: 6px; text-align: center; ${isUnique ? 'color: #27ae60; font-weight: bold;' : ''}">${matchCount}</td>
      <td style="padding: 6px; display: flex; gap: 4px; align-items: center;">
        ${processCellHtml}
      </td>
    `;
        attributeList.appendChild(attrRow);

        // Index button click: highlight all matching elements with highlightSelectedElement
        setTimeout(() => {
            const indexBtn = document.getElementById(indexBtnId);
            if (indexBtn) {
                indexBtn.addEventListener('click', function () {
                    // Create selector
                    let selector = '';
                    let selectorType = '';
                    if (attr.name === 'tagName') {
                        selector = `//${attr.value}`;
                        selectorType = 'xpath';
                    } else if (attr.name === 'id') {
                        selector = `#${attr.value}`;
                        selectorType = 'css';
                    } else if (attr.name === 'name') {
                        selector = `[name="${attr.value}"]`;
                        selectorType = 'css';
                    } else if (attr.name === 'class') {
                        if (attr.value.includes(' ')) {
                            selector = `//${tagName}[@class="${attr.value}"]`;
                            selectorType = 'xpath';
                        } else {
                            selector = `.${attr.value}`;
                            selectorType = 'css';
                        }
                    } else if (attr.name === 'text()') {
                        selector = `//${tagName}[text()="${attr.value}"]`;
                        selectorType = 'xpath';
                    } else if (attr.name === 'contains()') {
                        selector = `//${tagName}[contains(text(),"${attr.value}")]`;
                        selectorType = 'xpath';
                    } else if (attr.name === 'button') {
                        selector = attr.value;
                        selectorType = 'xpath';
                    } else {
                        selector = `//${tagName}[@${attr.name}="${attr.value}"]`;
                        selectorType = 'xpath';
                    }
                    highlightSelectedElement(element, selector, selectorType);
                });
            }
        }, 0);

        // Add button click: create index-based selector with index from number input and add
        setTimeout(() => {
            const addBtn = document.getElementById(addBtnId);
            const indexInput = document.getElementById(indexInputId);
            if (addBtn && indexInput) {
                addBtn.addEventListener('click', function () {
                    const attrName = this.getAttribute('data-attr');
                    const attrValue = this.getAttribute('data-value');
                    let selector = '';
                    let selectorType = 'xpath'; // Always xpath
                    if (attrName === 'tagName') {
                        selector = `//${attrValue}`;
                    } else if (attrName === 'id') {
                        selector = `//*[@id='${attrValue}']`;
                    } else if (attrName === 'name') {
                        selector = `//*[@name='${attrValue}']`;
                    } else if (attrName === 'class') {
                        if (attrValue.includes(' ')) {
                            selector = `//${tagName}[@class='${attrValue}']`;
                        } else {
                            selector = `//*[contains(concat(' ',normalize-space(@class),' '),' ${attrValue} ')]`;
                        }
                    } else if (attrName === 'text()') {
                        selector = `//${tagName}[text()='${attrValue}']`;
                    } else if (attrName === 'contains()') {
                        selector = `//${tagName}[contains(text(),'${attrValue}')]`;
                    } else if (attrName === 'button') {
                        selector = attrValue;
                    } else {
                        selector = `//${tagName}[@${attrName}='${attrValue}']`;
                    }
                    let matchCount = 1;
                    try {
                        matchCount = document.evaluate(selector, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                    } catch { }
                    let index = parseInt(indexInput.value, 10);
                    if (!isNaN(index) && index >= 1 && index <= matchCount) {
                        if (matchCount > 1) {
                            selector = `(${selector})[${index}]`;
                        }
                        // Add to result and list always as xpath
                        document.getElementById('panel-selector-result').textContent = selector;
                        document.getElementById('panel-copy-selector').disabled = false;
                        let addType = 'xpath';
                        if (selector.includes('[@class=')) {
                            addType = 'xpath-class';
                        } else if (selector.includes('[@') || selector.includes('text()') || selector.includes('contains(')) {
                            addType = 'xpath-attr';
                        }
                        if (selector !== lastAddedSelector || addType !== lastAddedType) {
                            addToSelectorHistory(addType, selector);
                            lastAddedSelector = selector;
                            lastAddedType = addType;
                        }
                        pendingSelectorToAdd = false;
                        highlightSelectedElement(element, selector, 'xpath');
                        showNotification(`${attrName} attribute used to create xpath selector and added to the list`);
                    } else {
                        showNotification('Invalid index entered. Selector not added.', true);
                    }
                });
            }
        }, 0);
    }

    // Create XPath for special cases

    // 1. Text content
    if (element.textContent && element.textContent.trim()) {
        const textContent = element.textContent.trim();

        // Find number of elements matching text content
        let textMatchCount = 0;
        try {
            const xpath = `//${tagName}[text()="${textContent}"]`;
            const result = document.evaluate(
                xpath,
                document,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null
            );
            textMatchCount = result.snapshotLength;
        } catch (error) {
            console.error('Error calculating the number of text matches:', error);
        }

        // Create text row for text content
        const textRow = document.createElement('tr');
        textRow.style.borderBottom = '1px solid #ddd';

        // Different
        const isUnique = (textMatchCount === 1);

        textRow.innerHTML = `
      <td style="padding: 6px; font-weight: bold; ${isUnique ? 'color: #27ae60;' : ''}">text()</td>
      <td style="padding: 6px; ${isUnique ? 'color: #27ae60;' : ''}">${textContent.length > 30 ? textContent.substring(0, 30) + '...' : textContent}</td>
      <td style="padding: 6px; text-align: center; ${isUnique ? 'color: #27ae60; font-weight: bold;' : ''}">${textMatchCount}</td>
      <td style="padding: 6px;">
        <button class="use-attribute" data-attr="text()" data-value="${textContent}" style="background-color: ${isUnique ? '#27ae60' : '#3498db'}; color: white; border: none; padding: 2px 5px; border-radius: 2px; cursor: pointer; font-size: 10px;">Add</button>
      </td>
    `;
        attributeList.appendChild(textRow);

        // 2. Text content partially matching XPath (contains)
        if (textContent.length > 5) {
            const containsRow = document.createElement('tr');
            containsRow.style.borderBottom = '1px solid #ddd';

            // Find number of elements matching contains
            let containsMatchCount = 0;
            try {
                const xpath = `//${tagName}[contains(text(),"${textContent}")]`;
                const result = document.evaluate(
                    xpath,
                    document,
                    null,
                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                    null
                );
                containsMatchCount = result.snapshotLength;
            } catch (error) {
                console.error('Error calculating the number of contains matches:', error);
            }

            containsRow.innerHTML = `
          <td style="padding: 6px; font-weight: bold;">contains()</td>
          <td style="padding: 6px;">contains(text(),"${textContent.length > 30 ? textContent.substring(0, 30) + '...' : textContent}")</td>
          <td style="padding: 6px; text-align: center;">${containsMatchCount}</td>
          <td style="padding: 6px;">
            <button class="use-attribute" data-attr="contains()" data-value="${textContent}" style="background-color: #3498db; color: white; border: none; padding: 2px 5px; border-radius: 2px; cursor: pointer; font-size: 10px;">Add</button>
          </td>
        `;
            attributeList.appendChild(containsRow);
        }
    }

    // 3. <a> element and role="button" attribute detected as button
    if (tagName === 'a' && element.getAttribute('role') === 'button') {
        const buttonRow = document.createElement('tr');
        buttonRow.style.borderBottom = '1px solid #ddd';
        buttonRow.style.backgroundColor = 'rgba(241, 196, 15, 0.1)';

        // Find number of elements matching button
        let buttonMatchCount = 0;
        try {
            const xpath = `//a[@role="button"]`;
            const result = document.evaluate(
                xpath,
                document,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null
            );
            buttonMatchCount = result.snapshotLength;
        } catch (error) {
            console.error('Error calculating the number of button matches:', error);
        }

        // If button text exists, create a more specific XPath
        let buttonXPath = `//a[@role="button"]`;
        if (element.textContent && element.textContent.trim()) {
            const buttonText = element.textContent.trim();
            buttonXPath = `//a[@role="button" and text()="${buttonText}"]`;

            // Find number of elements matching button with text
            try {
                const result = document.evaluate(
                    buttonXPath,
                    document,
                    null,
                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                    null
                );
                buttonMatchCount = result.snapshotLength;
            } catch (error) {
                console.error('Error calculating the number of button text matches:', error);
            }
        }

        buttonRow.innerHTML = `
      <td style="padding: 6px; font-weight: bold; color: #d35400;">button</td>
      <td style="padding: 6px; color: #d35400;">${buttonXPath}</td>
      <td style="padding: 6px; text-align: center; color: #d35400;">${buttonMatchCount}</td>
      <td style="padding: 6px;">
        <button class="use-attribute" data-attr="button" data-value="${buttonXPath}" style="background-color: #e67e22; color: white; border: none; padding: 2px 5px; border-radius: 2px; cursor: pointer; font-size: 10px;">Add</button>
      </td>
    `;
        attributeList.appendChild(buttonRow);
    }

    // Add event listeners to use attribute buttons
    const useAttributeButtons = attributeList.querySelectorAll('.use-attribute');
    useAttributeButtons.forEach(
        button => {
            // If there is an index input in the same row, add event to this button (because it is already added below)
            const parentTd = button.parentElement;
            if (parentTd && parentTd.querySelector('input[type="number"]')) {
                // Remove possible old events by first replacing with a new button
                const newButton = button.cloneNode(true);
                parentTd.replaceChild(newButton, button);
                return;
            }
            // Remove possible old events by first replacing with a new button
            const newButton = button.cloneNode(true);
            button.parentElement.replaceChild(newButton, button);
            newButton.addEventListener('click', function () {
                const attrName = this.getAttribute('data-attr');
                const attrValue = this.getAttribute('data-value');

                let selector = '';
                let selectorType = '';
                let matchCount = 1;
                let tagNameForSelector = tagName;

                // Create smart selector based on attribute type
                if (attrName === 'tagName') {
                    selector = `//${attrValue}`;
                    selectorType = 'xpath';
                    // Find number of elements matching tag name
                    try {
                        matchCount = document.getElementsByTagName(attrValue).length;
                    } catch { }
                } else if (attrName === 'id') {
                    selector = `#${attrValue}`;
                    selectorType = 'css';
                    // Find number of elements matching id
                    try {
                        matchCount = document.querySelectorAll(selector).length;
                    } catch { }
                } else if (attrName === 'name') {
                    selector = `[name="${attrValue}"]`;
                    selectorType = 'css';
                    try {
                        matchCount = document.querySelectorAll(selector).length;
                    } catch { }
                } else if (attrName === 'class') {
                    if (attrValue.includes(' ')) {
                        selector = `//${tagName}[@class="${attrValue}"]`;
                        selectorType = 'xpath';
                        try {
                            matchCount = document.evaluate(selector, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                        } catch { }
                    } else {
                        selector = `.${attrValue}`;
                        selectorType = 'css';
                        try {
                            matchCount = document.querySelectorAll(selector).length;
                        } catch { }
                    }
                } else if (attrName === 'text()') {
                    selector = `//${tagName}[text()="${attrValue}"]`;
                    selectorType = 'xpath';
                    try {
                        matchCount = document.evaluate(selector, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                    } catch { }
                } else if (attrName === 'contains()') {
                    selector = `//${tagName}[contains(text(),"${attrValue}")]`;
                    selectorType = 'xpath';
                    try {
                        matchCount = document.evaluate(selector, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                    } catch { }
                } else if (attrName === 'button') {
                    selector = attrValue;
                    selectorType = 'xpath';
                    try {
                        matchCount = document.evaluate(selector, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                    } catch { }
                } else {
                    selector = `//${tagName}[@${attrName}="${attrValue}"]`;
                    selectorType = 'xpath';
                    try {
                        matchCount = document.evaluate(selector, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength;
                    } catch { }
                }

                // If there are multiple matches, ask user for index (automatic index 1 addition code remains here, because events are not added for those with index input)
                if (matchCount > 1) {
                    highlightSelectedElement(element, selector, selectorType);
                    if (selectorType === 'xpath') {
                        selector = `(${selector})[1]`;
                    } else if (selectorType === 'css') {
                        selector = `${selector}:nth-of-type(1)`;
                    }
                    showNotification('Multiple matches found, first match automatically added.');
                }

                document.getElementById('panel-selector-result').textContent = selector;
                document.getElementById('panel-copy-selector').disabled = false;

                let addType = selectorType;
                if (selectorType === 'css') {
                    if (selector.startsWith('#')) {
                        addType = 'css-id';
                    } else if (selector.startsWith('.')) {
                        addType = 'css-class';
                    } else if (selector.startsWith('[name=')) {
                        addType = 'css-name';
                    } else {
                        addType = 'css';
                    }
                } else if (selectorType === 'xpath') {
                    if (selector.includes('[@class=')) {
                        addType = 'xpath-class';
                    } else if (selector.includes('[@') || selector.includes('text()') || selector.includes('contains(')) {
                        addType = 'xpath-attr';
                    } else {
                        addType = 'xpath';
                    }
                } else if (selectorType === 'tagName') {
                    addType = 'tagName';
                }
                if (selector !== lastAddedSelector || addType !== lastAddedType) {
                    addToSelectorHistory(addType, selector);
                    lastAddedSelector = selector;
                    lastAddedType = addType;
                }
                pendingSelectorToAdd = false;
                highlightSelectedElement(element, selector, selectorType);
                showNotification(`${attrName} attribute used to create ${selectorType} selector and added to the list`);
            });
        }
    );

    // Show attributes section
    elementAttributes.style.display = 'block';
    elementActions.style.display = 'block';
}

// Show element actions function
function showElementActions(element) {
    if (!element) return;

    const elementType = determineElementType(element);
    const elementTypeSpan = document.getElementById('element-type');
    const elementActions = document.getElementById('element-actions');
    const clickAction = document.getElementById('click-action');
    const inputAction = document.getElementById('input-action');
    const selectAction = document.getElementById('select-action');
    const checkboxAction = document.getElementById('checkbox-action');


    // Show element type
    elementTypeSpan.textContent = elementType;
    elementActions.style.display = 'block';
    // Hide all operation fields

    clickAction.style.display = 'none';
    inputAction.style.display = 'none';
    selectAction.style.display = 'none';
    checkboxAction.style.display = 'none';

    // Show appropriate operations based on element type

    const tagName = element.tagName.toLowerCase();
    // Click operation - valid for most elements
    clickAction.style.display = 'block';

    document.getElementById('perform-click').onclick = function () {
        try {
            const selector = document.getElementById('panel-selector-result').textContent;
            const selectorType = (selector.startsWith('//') ? 'xpath' : 'css');
            let addType = selectorType;
            if (selectorType === 'css') {
                if (selector.startsWith('#')) {
                    addType = 'css-id';
                } else if (selector.startsWith('.')) {
                    addType = 'css-class';
                } else if (selector.startsWith('[name=')) {
                    addType = 'css-name';
                } else {
                    addType = 'css';
                }
            } else if (selectorType === 'xpath') {
                if (selector.includes('[@class=')) {
                    addType = 'xpath-class';
                } else if (selector.includes('[@') || selector.includes('text()') || selector.includes('contains(')) {
                    addType = 'xpath-attr';
                } else {
                    addType = 'xpath';
                }
            } else if (selectorType === 'tagName') {
                addType = 'tagName';
            }
            const doClick = () => {
                // 1 second delayed click operation
                setTimeout(() => {
                    if (element.tagName.toLowerCase() === 'a' && element.href) {
                        //window.open(element.href, '_blank');
                        window.location.href = element.href;
                        showNotification('Link opened in new tab and selector saved.');
                    } else {
                        const clickEvent = new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window
                        });
                        element.dispatchEvent(clickEvent);
                        showNotification('Element clicked');
                    }
                }, 1000); // 1 second delay
            };
            if (pendingSelectorToAdd && (selector !== lastAddedSelector || addType !== lastAddedType)) {
                addToSelectorHistory(addType, selector, function () {
                    lastAddedSelector = selector;
                    lastAddedType = addType;
                    pendingSelectorToAdd = false;
                    doClick();
                });
            } else if (!pendingSelectorToAdd && (selector !== lastAddedSelector || addType !== lastAddedType)) {
                addToSelectorHistory(addType, selector, function () {
                    lastAddedSelector = selector;
                    lastAddedType = addType;
                    doClick();
                });
            } else {
                doClick();
            }
        } catch (error) {
            showNotification('Click operation failed: ' + error.message, true);
        }
    };

    // Text input operation
    /*
    if ((tagName === 'input' && ['text', 'email', 'password', 'search', 'tel', 'url', 'number'].includes(element.type)) ||
        tagName === 'textarea') {
        inputAction.style.display = 'block';
        document.getElementById('input-value').value = element.value || '';
        document.getElementById('perform-input').onclick = function () {
            try {
                const selector = document.getElementById('panel-selector-result').textContent;
                const selectorType = (selector.startsWith('//') ? 'xpath' : 'css');
                let addType = selectorType;
                if (selectorType === 'css') {
                    if (selector.startsWith('#')) {
                        addType = 'css-id';
                    } else if (selector.startsWith('.')) {
                        addType = 'css-class';
                    } else if (selector.startsWith('[name=')) {
                        addType = 'css-name';
                    } else {
                        addType = 'css';
                    }
                } else if (selectorType === 'xpath') {
                    if (selector.includes('[@class=')) {
                        addType = 'xpath-class';
                    } else if (selector.includes('[@') || selector.includes('text()') || selector.includes('contains(')) {
                        addType = 'xpath-attr';
                    } else {
                        addType = 'xpath';
                    }
                } else if (selectorType === 'tagName') {
                    addType = 'tagName';
                }
                if (pendingSelectorToAdd && (selector !== lastAddedSelector || addType !== lastAddedType)) {
                    addToSelectorHistory(addType, selector, function () {
                        lastAddedSelector = selector;
                        lastAddedType = addType;
                        pendingSelectorToAdd = false;
                        // After saving, do the input operation
                        const inputValue = document.getElementById('input-value').value;
                        element.focus();
                        element.value = inputValue;
                        const inputEvent = new Event('input', { bubbles: true });
                        element.dispatchEvent(inputEvent);
                        const changeEvent = new Event('change', { bubbles: true });
                        element.dispatchEvent(changeEvent);
                                showNotification('Value sent');
                    });
                } else if (!pendingSelectorToAdd && (selector !== lastAddedSelector || addType !== lastAddedType)) {
                    addToSelectorHistory(addType, selector, function () {
                        lastAddedSelector = selector;
                        lastAddedType = addType;
                        // After saving, do the input operation
                        const inputValue = document.getElementById('input-value').value;
                        element.focus();
                        element.value = inputValue;
                        const inputEvent = new Event('input', { bubbles: true });
                        element.dispatchEvent(inputEvent);
                        const changeEvent = new Event('change', { bubbles: true });
                        element.dispatchEvent(changeEvent);
                        showNotification('Value sent');
                    });
                } else {
                    // If already added, do the input operation directly
                    const inputValue = document.getElementById('input-value').value;
                    element.focus();
                    element.value = inputValue;
                    const inputEvent = new Event('input', { bubbles: true });
                    element.dispatchEvent(inputEvent);
                    const changeEvent = new Event('change', { bubbles: true });
                    element.dispatchEvent(changeEvent);
                    showNotification('Value sent');
                }
            } catch (error) {
                showNotification('Value sending operation failed: ' + error.message, true);
            }
        };
    }*/
    // Text input operation
    if (tagName === 'input' && ['text', 'email', 'password', 'search', 'tel', 'url', 'number'].includes(element.type)) {
        inputAction.style.display = 'block';
        document.getElementById('input-value').value = element.value || '';
        document.getElementById('perform-input').onclick = function () {
            try {
                // Send only input value to the relevant form element
                const inputValue = document.getElementById('input-value').value;
                element.focus();
                element.value = inputValue;
                const inputEvent = new Event('input', { bubbles: true });
                element.dispatchEvent(inputEvent);
                const changeEvent = new Event('change', { bubbles: true });
                element.dispatchEvent(changeEvent);
                showNotification('Value sent');
            } catch (error) {
                showNotification('Value sending operation failed: ' + error.message, true);
            }
        };
    }
    /*
    //Dropdown operation
    if (tagName === 'select') {
        selectAction.style.display = 'block';
        const selectOptions = document.getElementById('select-options');
        selectOptions.innerHTML = '<option value="">Select option</option>';
        Array.from(element.options).forEach((option, index) => {
            const optionElement = document.createElement('option');
            optionElement.value = index;
            optionElement.textContent = option.textContent;
            selectOptions.appendChild(optionElement);
            if (option.selected) {
                selectOptions.value = index;
            }
        });
        document.getElementById('perform-select').onclick = function () {
            try {
                const selector = document.getElementById('panel-selector-result').textContent;
                const selectorType = (selector.startsWith('//') ? 'xpath' : 'css');
                let addType = selectorType;
                if (selectorType === 'css') {
                    if (selector.startsWith('#')) {
                        addType = 'css-id';
                    } else if (selector.startsWith('.')) {
                        addType = 'css-class';
                    } else if (selector.startsWith('[name=')) {
                        addType = 'css-name';
                    } else {
                        addType = 'css';
                    }
                } else if (selectorType === 'xpath') {
                    if (selector.includes('[@class=')) {
                        addType = 'xpath-class';
                    } else if (selector.includes('[@') || selector.includes('text()') || selector.includes('contains(')) {
                        addType = 'xpath-attr';
                    } else {
                        addType = 'xpath';
                    }
                } else if (selectorType === 'tagName') {
                    addType = 'tagName';
                }
                if (pendingSelectorToAdd && (selector !== lastAddedSelector || addType !== lastAddedType)) {
                    addToSelectorHistory(addType, selector, function () {
                        lastAddedSelector = selector;
                        lastAddedType = addType;
                        pendingSelectorToAdd = false;
                        // After saving, do the select operation
                        element.selectedIndex = parseInt(selectOptions.value, 10);
                        const changeEvent = new Event('change', { bubbles: true });
                        element.dispatchEvent(changeEvent);
                        showNotification('Option selected');
                    });
                } else if (!pendingSelectorToAdd && (selector !== lastAddedSelector || addType !== lastAddedType)) {
                    addToSelectorHistory(addType, selector, function () {
                        lastAddedSelector = selector;
                        lastAddedType = addType;
                        // After saving, do the select operation
                        element.selectedIndex = parseInt(selectOptions.value, 10);
                        const changeEvent = new Event('change', { bubbles: true });
                        element.dispatchEvent(changeEvent);
                        showNotification('Option selected');
                    });
                } else {
                    // If already added, do the select operation directly
                    element.selectedIndex = parseInt(selectOptions.value, 10);
                    const changeEvent = new Event('change', { bubbles: true });
                    element.dispatchEvent(changeEvent);
                    showNotification('Option selected');
                }
            } catch (error) {
                showNotification('Selection operation failed: ' + error.message, true);
            }
        };
    }
*/
    // Dropdown operation
    if (tagName === 'select') {
        selectAction.style.display = 'block';
        const selectOptions = document.getElementById('select-options');
        selectOptions.innerHTML = '<option value="">Select option</option>';
        Array.from(element.options).forEach((option, index) => {
            const optionElement = document.createElement('option');
            optionElement.value = index;
            optionElement.textContent = option.textContent;
            selectOptions.appendChild(optionElement);
            if (option.selected) {
                selectOptions.value = index;
            }
        });
        document.getElementById('perform-select').onclick = function () {
            try {
                // Do only select operation
                element.selectedIndex = parseInt(selectOptions.value, 10);
                const changeEvent = new Event('change', { bubbles: true });
                element.dispatchEvent(changeEvent);
                showNotification('Option selected');
            } catch (error) {
                showNotification('Selection operation failed: ' + error.message, true);
            }
        };
    }
    // Checkbox operation
    if (tagName === 'input' && element.type === 'checkbox') {
        checkboxAction.style.display = 'block';
        const checkboxButton = document.getElementById('perform-checkbox');
        checkboxButton.textContent = element.checked ? 'Remove Check' : 'Check it';
        checkboxButton.onclick = function () {
            try {
                // Do the checkbox operation only
                element.checked = !element.checked;
                const changeEvent = new Event('change', { bubbles: true });
                element.dispatchEvent(changeEvent);
                showNotification('Status changed');
            } catch (error) {
                showNotification('Status change operation failed: ' + error.message, true);
            }
        };
    }
    /*
    //Checkbox operation
    if (tagName === 'input' && element.type === 'checkbox') {
        checkboxAction.style.display = 'block';
        const checkboxButton = document.getElementById('perform-checkbox');
        checkboxButton.textContent = element.checked ? 'Remove Check' : 'Check it';
        checkboxButton.onclick = function () {
            try {
                const selector = document.getElementById('panel-selector-result').textContent;
                const selectorType = (selector.startsWith('//') ? 'xpath' : 'css');
                let addType = selectorType;
                if (selectorType === 'css') {
                    if (selector.startsWith('#')) {
                        addType = 'css-id';
                    } else if (selector.startsWith('.')) {
                        addType = 'css-class';
                    } else if (selector.startsWith('[name=')) {
                        addType = 'css-name';
                    } else {
                        addType = 'css';
                    }
                } else if (selectorType === 'xpath') {
                    if (selector.includes('[@class=')) {
                        addType = 'xpath-class';
                    } else if (selector.includes('[@') || selector.includes('text()') || selector.includes('contains(')) {
                        addType = 'xpath-attr';
                    } else {
                        addType = 'xpath';
                    }
                } else if (selectorType === 'tagName') {
                    addType = 'tagName';
                }
                if (pendingSelectorToAdd && (selector !== lastAddedSelector || addType !== lastAddedType)) {
                    addToSelectorHistory(addType, selector, function () {
                        lastAddedSelector = selector;
                        lastAddedType = addType;
                        pendingSelectorToAdd = false;
                            // After saving, do the checkbox operation
                        element.checked = !element.checked;
                        const changeEvent = new Event('change', { bubbles: true });
                        element.dispatchEvent(changeEvent);
                        showNotification('Status changed');
                    });
                } else if (!pendingSelectorToAdd && (selector !== lastAddedSelector || addType !== lastAddedType)) {
                    addToSelectorHistory(addType, selector, function () {
                        lastAddedSelector = selector;
                        lastAddedType = addType;
                        // After saving, do the checkbox operation
                        element.checked = !element.checked;
                        const changeEvent = new Event('change', { bubbles: true });
                        element.dispatchEvent(changeEvent);
                        showNotification('Status changed');
                    });
                } else {
                    // If already added, do the checkbox operation directly
                    element.checked = !element.checked;
                    const changeEvent = new Event('change', { bubbles: true });
                    element.dispatchEvent(changeEvent);
                    showNotification('Status changed');
                }
            } catch (error) {
                showNotification('Status change operation failed: ' + error.message, true);
            }
        };
    }
    */
}

// XPath generation function
function generateXPath(element) {
    if (!element) return '';

    // If element is not an HTML element (e.g. text node)
    if (element.nodeType !== 1) {
        return '';
    }

    // If ID exists, create XPath directly with ID
    if (element.id) {
        return `//*[@id="${element.id}"]`;
    }

    // Recursively look at parent elements and create XPath
    const paths = [];

    // If we've reached document.body or element is null, stop
    while (element && element.nodeType === 1 && element !== document.body) {
        let index = 1;
        let sibling = element.previousSibling;

        // Count siblings of the same type
        while (sibling) {
            if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
                index++;
            }
            sibling = sibling.previousSibling;
        }

        // If element has special attributes, use them
        const attributes = [];

        if (element.className && typeof element.className === 'string' && element.className.trim() !== '') {
            const classes = element.className.trim().split(/\s+/);
            if (classes.length > 0) {
                attributes.push(`contains(@class, "${classes[0]}")`);
            }
        }

        if (element.name) {
            attributes.push(`@name="${element.name}"`);
        }

        if (element.hasAttribute('data-testid')) {
            attributes.push(`@data-testid="${element.getAttribute('data-testid')}"`);
        }

        // Create XPath part
        let pathPart;

        if (attributes.length > 0) {
            pathPart = `${element.tagName.toLowerCase()}[${attributes[0]}]`;
        } else {
            // If there are multiple elements of the same type, add index
            const hasMultipleSiblings = index > 1 || element.nextSibling &&
                element.nextSibling.nodeType === 1 &&
                element.nextSibling.tagName === element.tagName;

            pathPart = hasMultipleSiblings ?
                `${element.tagName.toLowerCase()}[${index}]` :
                element.tagName.toLowerCase();
        }

        paths.unshift(pathPart);
        element = element.parentNode;
    }

    // Join XPath parts
    return `//${paths.join('/')}`;
}

// CSS selector generation function
function generateCssSelector(element) {
    if (!element) return '';

    // If element is not an HTML element (e.g. text node)
    if (element.nodeType !== 1) {
        return '';
    }

    // If ID exists, create selector directly with ID
    if (element.id) {
        return `#${element.id}`;
    }

    // Recursively look at parent elements and create selector
    const paths = [];

    // If we've reached document.body or element is null, stop
    while (element && element.nodeType === 1 && element !== document.body) {
        let selector = element.tagName.toLowerCase();

        // If ID exists, add it
        if (element.id) {
            selector = `#${element.id}`;
            paths.unshift(selector);
            break;
        }

        // If class exists, add it
        if (element.className && typeof element.className === 'string' && element.className.trim() !== '') {
            const classes = element.className.trim().split(/\s+/);
            if (classes.length > 0) {
                selector += `.${classes.join('.')}`;
            }
        }

        // If the selector is not sufficiently unique, add nth-child
        const siblings = element.parentNode ? Array.from(element.parentNode.children) : [];
        if (siblings.length > 1) {
            const index = siblings.indexOf(element) + 1;
            selector += `:nth-child(${index})`;
        }

        paths.unshift(selector);
        element = element.parentNode;
    }

    // Join CSS selectors
    return paths.join(' > ');
}

// Selector generation main function
function generateSelector(element, type) {
    if (!element) return '';

    if (type === 'xpath') {
        return generateXPath(element);
    } else {
        return generateCssSelector(element);
    }
}

// Selector validation function
function validateSelector(selector, type) {
    try {
        if (type === 'xpath') {
            // XPath validation
            const result = document.evaluate(
                selector,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            );

            return result.singleNodeValue !== null;
        } else {
            // CSS selector validation
            const elements = document.querySelectorAll(selector);
            return elements.length > 0;
        }
    } catch (error) {
        console.error('Selector validation error:', error);
        return false;
    }
}

// storage.js
function saveData(callback) {
    try {
        const historyTable = document.getElementById('selector-history');
        const historyRows = Array.from(historyTable.querySelectorAll('tr'));

        const selectorHistory = historyRows.map(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 2) return null;

            const type = cells[0].textContent.trim();
            // Remove spans from selector cell, only get the real selector
            let selectorCell = cells[1].cloneNode(true);
            selectorCell.querySelectorAll('span').forEach(span => span.remove());
            const selector = selectorCell.textContent.trim();

            // If selector is empty or only contains match count, don't save
            if (!selector || selector.match(/^\(\d+ eşleşme\)$/)) return null;

            return { type, selector };
        }).filter(Boolean);

        const panelPosition = {
            left: selectorPanel.style.left || '20px',
            top: selectorPanel.style.top || '20px'
        };

        chrome.storage.local.set({
            selectorHistory,
            panelPosition,
            isPanelVisible: selectorPanel.style.display === 'block'
        }, () => {
            console.log('Data saved:', { selectorHistory, panelPosition });
            if (typeof callback === 'function') callback();
        });
    } catch (error) {
        console.error('Save error:', error);
        if (typeof callback === 'function') callback(error);
    }
}

// content.js
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(loadData, 1000); // Load when DOM is fully ready
});

// Save data before page refresh/close
window.addEventListener('beforeunload', saveData);

// Update loadData function: if selector-history table doesn't exist, try again with a short delay
function loadData(retryCount = 0) {
    const MAX_RETRIES = 20; // 20 x 100ms = 2 seconds
    const historyTable = document.getElementById("selector-history");
    if (!historyTable) {
        if (retryCount < MAX_RETRIES) {
            setTimeout(() => loadData(retryCount + 1), 100);
        }
        return;
    }
    chrome.storage.local.get([
        "selectorHistory", "panelPosition", "isPanelVisible"
    ], (result) => {
        // Set panel position and size
        if (result.panelPosition) {
            selectorPanel.style.left = result.panelPosition.left;
            selectorPanel.style.top = result.panelPosition.top;
            if (result.panelPosition.width) selectorPanel.style.width = result.panelPosition.width;
            if (result.panelPosition.height) selectorPanel.style.height = result.panelPosition.height;
        }
        window.isPanelVisible = result.isPanelVisible;
        selectorPanel.style.display = result.isPanelVisible ? "block" : "none";
        // Load selector history
        if (result.selectorHistory?.length > 0) {
            historyTable.innerHTML = "";
            result.selectorHistory.forEach((item) => {
                // Fix type matching (XPath Attribute → xpath-attr etc.)
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
                        console.warn("Unknown type:", item.type);
                        return;
                }
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
    });
}

// Make
let isDragging = false;
let dragOffsetX, dragOffsetY;

// Start dragging when panel header is clicked
selectorPanel.querySelector('div:first-child').addEventListener('mousedown', function (e) {
    // Start dragging when minimize and close buttons are clicked
    if (e.target.id === 'minimize-panel' || e.target.id === 'close-panel') {
        return;
    }

    isDragging = true;
    dragOffsetX = e.clientX - selectorPanel.getBoundingClientRect().left;
    dragOffsetY = e.clientY - selectorPanel.getBoundingClientRect().top;

    // Prevent selection during dragging
    e.preventDefault();
});

// When mouse moves, drag the panel
document.addEventListener('mousemove', function (e) {
    if (!isDragging) return;

    const x = e.clientX - dragOffsetX;
    const y = e.clientY - dragOffsetY;

    // Check screen boundaries
    const maxX = window.innerWidth - selectorPanel.offsetWidth;
    const maxY = window.innerHeight - selectorPanel.offsetHeight;

    selectorPanel.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
    selectorPanel.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
});

// When mouse is released, stop dragging and save data
document.addEventListener('mouseup', function () {
    if (isDragging) {
        isDragging = false;
        selectorPanel.style.cursor = '';
        saveData();
    }
});

// Hide panel after page load
window.addEventListener('load', function () {
    if (selectorPanel) {
        selectorPanel.style.display = 'none';
        isPanelVisible = false;
    }
});


// Find element by selector function
function findElementBySelector(selector, type) {
    try {
        if (type === 'xpath') {
            const result = document.evaluate(
                selector,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            );
            return result.singleNodeValue;
        } else if (type === 'tagName') {
            return document.getElementsByTagName(selector)[0];
        } else {
            return document.querySelector(selector);
        }
    } catch (error) {
        console.error('Element finding error:', error);
        return null;
    }
}

// Determine element type function
function determineElementType(element) {
    if (!element) return 'Bilinmeyen';

    const tagName = element.tagName.toLowerCase();

    if (tagName === 'input') {
        return `Input (${element.type || 'text'})`;
    } else if (tagName === 'select') {
        return 'Select';
    } else if (tagName === 'textarea') {
        return 'Textarea';
    } else if (tagName === 'button') {
        return 'Button';
    } else if (tagName === 'a') {
        return 'Link';
    } else {
        return tagName;
    }
}

// Keyboard shortcut to show/hide extension (Ctrl+Shift+X)
document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.shiftKey && event.key === 'X') {
        if (isPanelVisible) {
            selectorPanel.style.display = 'none';
            isPanelVisible = false;
        } else {
            selectorPanel.style.display = 'block';
            isPanelVisible = true;
        }
    }
});

// When panel is closed, only hide it and save data
document.getElementById('close-panel').addEventListener('click', function () {
    selectorPanel.style.display = 'none';
    isPanelVisible = false;
    saveData();
});

// List clearing button event listener
document.getElementById('clear-history').addEventListener('click', function () {
    const historyTable = document.getElementById('selector-history');
    historyTable.innerHTML = ''; // Clear all selector history
    showNotification('Selector list cleared');

    // If you're using storage, clear it too
    try {
        chrome.storage.local.remove('selectorHistory', function () {
            console.log('Selector history cleared from storage');
        });
    } catch (error) {
        console.error('Storage clearing error:', error);
    }
});

// Hide extension at start
selectorPanel.style.display = 'none';
isPanelVisible = false;

// Update addToSelectorHistory function
addToSelectorHistory = function (type, selector, callback) {
    console.log('[addToSelectorHistory]', type, selector);
    originalAddToSelectorHistory(type, selector);
    saveData(callback);
};

// Listen to Chrome extension messages
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === "togglePanel") {
        if (selectorPanel.style.display === 'none' || selectorPanel.style.display === '') {
            selectorPanel.style.display = 'block';
            isPanelVisible = true;
        } else {
            selectorPanel.style.display = 'none';
            isPanelVisible = false;
        }
        sendResponse && sendResponse({ visible: isPanelVisible });
    }
    if (message.action === 'pageReloaded') {
        // If you want to automatically open the panel when the page is reloaded, add it here
        // selectorPanel.style.display = 'block';
        // isPanelVisible = true;
    }
});

// Reload data when page is loaded
window.addEventListener('load', function () {
    setTimeout(loadData, 500);
});

// Hide extension at start
document.addEventListener('DOMContentLoaded', function () {
    selectorPanel.style.display = 'none';
    isPanelVisible = false;
    setTimeout(loadData, 500); // Wait for page to load completely
});


document.addEventListener('mouseup', function () {
    if (isDragging) {
        isDragging = false;
        saveData(); // Save when position changes
    }
});


// Find element by selector function
function findElementBySelector(selector, type) {
    try {
        if (type === 'xpath') {
            const result = document.evaluate(
                selector,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            );
            return result.singleNodeValue;
        } else if (type === 'tagName') {
            return document.getElementsByTagName(selector)[0];
        } else {
            return document.querySelector(selector);
        }
    } catch (error) {
        console.error('Element finding error:', error);
        return null;
    }
}

// Determine element type function
function determineElementType(element) {
    if (!element) return 'Unknown';

    const tagName = element.tagName.toLowerCase();

    if (tagName === 'input') {
        return `Input (${element.type || 'text'})`;
    } else if (tagName === 'select') {
        return 'Select';
    } else if (tagName === 'textarea') {
        return 'Textarea';
    } else if (tagName === 'button') {
        return 'Button';
    } else if (tagName === 'a') {
        return 'Link';
    } else {
        return tagName;
    }
}

// Keyboard shortcut to show/hide extension (Ctrl+Shift+X)
document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.shiftKey && event.key === 'X') {
        if (isPanelVisible) {
            selectorPanel.style.display = 'none';
            isPanelVisible = false;
        } else {
            selectorPanel.style.display = 'block';
            isPanelVisible = true;
        }
    }
});

// When panel is closed, only hide it and save data
document.getElementById('close-panel').addEventListener('click', function () {
    selectorPanel.style.display = 'none';
    isPanelVisible = false;
    saveData();
});

// List clearing button event listener
document.getElementById('clear-history').addEventListener('click', function () {
    const historyTable = document.getElementById('selector-history');
    historyTable.innerHTML = ''; // Clear all selector history
    showNotification('Selector list cleared');

    // If you're using storage, clear it too
    try {
        chrome.storage.local.remove('selectorHistory', function () {
            console.log('Selector history cleared from storage');
        });
    } catch (error) {
        console.error('Storage clearing error:', error);
    }
});

// Keyboard shortcut to show/hide extension (Ctrl+Shift+X)
document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.shiftKey && event.key === 'X') {
        if (isPanelVisible) {
            selectorPanel.style.display = 'none';
            isPanelVisible = false;
        } else {
            selectorPanel.style.display = 'block';
            isPanelVisible = true;
        }
    }
});

// When panel is closed, only hide it and save data
document.getElementById('close-panel').addEventListener('click', function () {
    selectorPanel.style.display = 'none';
    isPanelVisible = false;
    saveData();
});

// List clearing button event listener
document.getElementById('clear-history').addEventListener('click', function () {
    const historyTable = document.getElementById('selector-history');
    historyTable.innerHTML = ''; // Clear all selector history
    showNotification('Selector list cleared');

    // If you're using storage, clear it too
    try {
        chrome.storage.local.remove('selectorHistory', function () {
            console.log('Selector history cleared from storage');
        });
    } catch (error) {
        console.error('Storage clearing error:', error);
    }
});

// Recreate panel function
function ensurePanelExists() {
    if (!document.getElementById('xpath-css-selector-panel')) {
        document.body.appendChild(selectorPanel);
        selectorPanel.style.display = isPanelVisible ? 'block' : 'none';
    }
    if (!document.getElementById('selector-history')) {
        // Re-add panel content (if needed, re-create panel content)
        selectorPanel.innerHTML = `
          <div style="padding: 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background-color: #f8f9fa;">
            <h3 style="margin: 0; font-size: 16px; color: #2c3e50;">Primer Locator Generator</h3>
            <div>
              <button id="minimize-panel" style="background: none; border: none; cursor: pointer; font-size: 16px; color: #7f8c8d; margin-right: 5px;">_</button>
              <button id="close-panel" style="background: none; border: none; cursor: pointer; font-size: 16px; color: #7f8c8d;">×</button>
            </div>
          </div>
          <div style="padding: 12px;">
            <div style="margin-bottom: 12px;">
              <button id="activate-panel-selector" style="background-color: #3498db; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; width: 100%;">Select Element</button>
            </div>
            <div style="margin-top: 16px;">
              <h4 style="margin: 0 0 8px; font-size: 14px; color: #2c3e50;">Result</h4>
              <div style="background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin-bottom: 8px; max-height: 100px; overflow-y: auto; word-break: break-all; font-family: monospace; font-size: 12px;" id="panel-selector-result">No element selected yet</div>
              <div id="panel-validation-result" style="margin: 8px 0; font-size: 12px; min-height: 18px;"></div>
              <button id="panel-copy-selector" style="background-color: #3498db; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; width: 100%;" disabled>Copy</button>
            </div>
            <div id="element-attributes" style="margin-top: 16px; display: none;">
              <h4 style="margin: 0 0 8px; font-size: 14px; color: #2c3e50;">Element Properties</h4>
              <div style="background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin-bottom: 8px; max-height: 200px; overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                  <thead>
                    <tr style="background-color: #eee; text-align: left;">
                      <th style="padding: 6px; border-bottom: 1px solid #ddd;">Feature</th>
                      <th style="padding: 6px; border-bottom: 1px solid #ddd;">Value</th>
                      <th style="padding: 6px; border-bottom: 1px solid #ddd;">Matching</th>
                      <th style="padding: 6px; border-bottom: 1px solid #ddd;">Process</th>
                    </tr>
                  </thead>
                  <tbody id="attribute-list">
                    <!-- Features will be added here -->
                  </tbody>
                </table>
              </div>
            </div>
            <div id="element-actions" style="margin-top: 16px; display: none;">
              <h4 style="margin: 0 0 8px; font-size: 14px; color: #2c3e50;">Element Operations</h4>
              <div style="background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin-bottom: 8px;">
                <div id="element-type-info" style="margin-bottom: 8px; font-size: 12px;">Element Type: <span id="element-type">-</span></div>
                <div id="click-action" style="margin-bottom: 8px;">
                  <button id="perform-click" style="background-color: #3498db; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; width: 100%;">Click</button>
                </div>
                <div id="input-action" style="margin-bottom: 8px; display: none;">
                  <div style="display: flex; gap: 5px; margin-bottom: 5px;">
                    <input type="text" id="input-value" placeholder="Değer girin" style="flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                    <button id="perform-input" style="background-color: #3498db; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Send</button>
                  </div>
                </div>
                <div id="select-action" style="margin-bottom: 8px; display: none;">
                  <div style="display: flex; gap: 5px; margin-bottom: 5px;">
                    <select id="select-options" style="flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                      <option value="">Seçenek seçin</option>
                    </select>
                    <button id="perform-select" style="background-color: #3498db; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Select</button>
                  </div>
                </div>
                <div id="checkbox-action" style="margin-bottom: 8px; display: none;">
                  <button id="perform-checkbox" style="background-color: #3498db; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; width: 100%;">Change Status</button>
                </div>
              </div>
            </div>
            <div style="margin-top: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <h4 style="margin: 0; font-size: 14px; color: #2c3e50;">Seçici Listesi</h4>
                <button id="clear-history" style="background-color: #e74c3c; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;">Clear List</button>
              </div>
              <div style="background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; max-height: 150px; overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                  <thead>
                    <tr style="background-color: #eee; text-align: left;">
                      <th style="padding: 6px; border-bottom: 1px solid #ddd;">Type</th>
                      <th style="padding: 6px; border-bottom: 1px solid #ddd;">Selector</th>
                      <th style="padding: 6px; border-bottom: 1px solid #ddd;">Process</th>
                    </tr>
                  </thead>
                  <tbody id="selector-history">
                    <!-- Selector history will be added here -->
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;
        // If panel is recreated, if there is a selected element, show it again
        if (window.selectedElement) {
            showElementAttributes(window.selectedElement);
        }
    }
}

// Add listeners for SPA transitions
(function () {
    // Wrap pushState and replaceState
    const _pushState = history.pushState;
    const _replaceState = history.replaceState;
    history.pushState = function () {
        saveData();
        const result = _pushState.apply(this, arguments);
        window.dispatchEvent(new Event('spa-navigation'));
        return result;
    };
    history.replaceState = function () {
        saveData();
        const result = _replaceState.apply(this, arguments);
        window.dispatchEvent(new Event('spa-navigation'));
        return result;
    };
    // First saveData, then panel and history load with popstate and special event
    window.addEventListener('popstate', function () {
        saveData();
        ensurePanelExists();
        setTimeout(() => loadData(0), 500);
    });
    window.addEventListener('spa-navigation', function () {
        saveData();
        ensurePanelExists();
        setTimeout(() => loadData(0), 500);
    });
})();

// --- LANGUAGE-TOOL-NOTATION RELATIONS ---
const languageToolMap = {
    java: [
        { value: 'selenium', label: 'Selenium', notations: ['FindBy', 'By'] },
        { value: 'selenide', label: 'Selenide', notations: ['By'] },
        { value: 'playwright', label: 'Playwright', notations: [] }
    ],
    python: [
        { value: 'selenium', label: 'Selenium', notations: ['By'] },
        { value: 'playwright', label: 'Playwright', notations: [] },
        { value: 'robotframework', label: 'Robot Framework', notations: [] }
    ],
    csharp: [
        { value: 'selenium', label: 'Selenium', notations: ['FindBy', 'By'] },
        { value: 'playwright', label: 'Playwright', notations: [] }
    ],
    javascript: [
        { value: 'selenium', label: 'Selenium', notations: ['By'] },
        { value: 'playwright', label: 'Playwright', notations: [] },
        { value: 'cypress', label: 'Cypress', notations: [] },
        { value: 'puppeteer', label: 'Puppeteer', notations: [] }
    ],
    typescript: [
        { value: 'selenium', label: 'Selenium', notations: ['By'] },
        { value: 'playwright', label: 'Playwright', notations: [] },
        { value: 'cypress', label: 'Cypress', notations: [] },
        { value: 'puppeteer', label: 'Puppeteer', notations: [] }
    ],
    ruby: [
        { value: 'selenium', label: 'Selenium', notations: ['By'] }
    ],
    kotlin: [
        { value: 'selenium', label: 'Selenium', notations: ['By'] },
        { value: 'selenide', label: 'Selenide', notations: ['By'] }
    ]
};

// --- ADD NOTATION COMBOBOX TO PANEL HTML ---
const languageToolContainer = document.getElementById('language-tool-container');
const notationSelectHTML = `
  <label for="notation-select" style="font-size: 13px; color: #2c3e50; font-weight: 500;">Notation:</label>
  <select id="notation-select" style="padding: 5px 10px; border-radius: 4px; border: 1px solid #ccc; min-width: 90px;"></select>
`;
languageToolContainer.insertAdjacentHTML('beforeend', notationSelectHTML);

const languageSelect = document.getElementById('language-select');
const toolSelect = document.getElementById('tool-select');
const notationSelect = document.getElementById('notation-select');

// --- UPDATE TOOL LIST DYNAMICALLY ---
function updateToolOptions() {
    const lang = languageSelect.value;
    const tools = languageToolMap[lang] || [];
    toolSelect.innerHTML = '';
    tools.forEach(tool => {
        const opt = document.createElement('option');
        opt.value = tool.value;
        opt.textContent = tool.label;
        toolSelect.appendChild(opt);
    });
    updateNotationOptions();
}

// --- UPDATE NOTATION LIST DYNAMICALLY ---
function updateNotationOptions() {
    const lang = languageSelect.value;
    const toolVal = toolSelect.value;
    const toolObj = (languageToolMap[lang] || []).find(t => t.value === toolVal);
    notationSelect.innerHTML = '';
    if (toolObj && toolObj.notations.length > 0) {
        notationSelect.style.display = '';
        toolObj.notations.forEach(not => {
            const opt = document.createElement('option');
            opt.value = not;
            opt.textContent = not;
            notationSelect.appendChild(opt);
        });
    } else {
        notationSelect.style.display = 'none';
    }
}

languageSelect.addEventListener('change', updateToolOptions);
toolSelect.addEventListener('change', updateNotationOptions);

// Set initial values when page loads
updateToolOptions();

// --- COPY ALL BUTTON FUNCTION ---
document.getElementById('copy-all-selectors').addEventListener('click', function () {
    const language = document.getElementById('language-select').value;
    const tool = document.getElementById('tool-select').value;
    const notationSelect = document.getElementById('notation-select');
    const notation = notationSelect && notationSelect.style.display !== 'none' ? notationSelect.value : null;
    const historyTable = document.getElementById('selector-history');
    const rows = historyTable.querySelectorAll('tr');

    if (rows.length === 0) {
        showNotification('Selector list is empty!', true);
        return;
    }

    let getCodeTemplate = window.getCodeTemplate;
    if (!getCodeTemplate) {
        getCodeTemplate = function (language, tool, selector, notation, isFirst) {
            const isXpath = selector.startsWith('/') || selector.startsWith('(') || selector.startsWith('//*[@') || selector.startsWith('//');

            // Enhanced ID detection function
            function extractIdFromSelector(selector) {
                // XPath ID detection patterns
                let idXpathMatch = selector.match(/^\/\/\*\[@id=['"]([^'"]+)['"]\]$/);
                if (idXpathMatch) return idXpathMatch[1];

                // Check //tag[@id='value'] format
                idXpathMatch = selector.match(/^\/\/\w+\[@id=['"]([^'"]+)['"]\]$/);
                if (idXpathMatch) return idXpathMatch[1];

                // Check more complex XPath patterns with id
                idXpathMatch = selector.match(/\[@id=['"]([^'"]+)['"]\]/);
                if (idXpathMatch) return idXpathMatch[1];

                // CSS selector ID detection patterns
                let cssIdMatch = selector.match(/^#([a-zA-Z0-9_-]+)$/);
                if (cssIdMatch) return cssIdMatch[1];

                // CSS selector with other attributes but starting with ID
                cssIdMatch = selector.match(/^#([a-zA-Z0-9_-]+)/);
                if (cssIdMatch) return cssIdMatch[1];

                // CSS selector [id="value"] format
                cssIdMatch = selector.match(/^\[id=['"]([^'"]+)['"]\]$/);
                if (cssIdMatch) return cssIdMatch[1];

                // CSS selector tag[id="value"] format
                cssIdMatch = selector.match(/^\w+\[id=['"]([^'"]+)['"]\]$/);
                if (cssIdMatch) return cssIdMatch[1];

                return null;
            }

            // Extract ID from selector
            const extractedId = extractIdFromSelector(selector);
            const useIdSelector = extractedId !== null;

            // String escape helper function
            function escapeQuotes(str) {
                return str.replace(/"/g, '\\"');
            }

            // JAVA
            if (language === 'java' && tool === 'selenium') {
                if (notation === 'FindBy') {
                    let header = isFirst ? '// Java + Selenium\n' : '';
                    if (useIdSelector) return `${header}@FindBy(id = "${extractedId}")\nWebElement element;`;
                    if (isXpath) return `${header}@FindBy(xpath = "${escapeQuotes(selector)}")\nWebElement element;`;
                    return `${header}@FindBy(css = "${escapeQuotes(selector)}")\nWebElement element;`;
                }
                let header = isFirst ? '// Java + Selenium\n' : '';
                if (useIdSelector) return `${header}By locator = By.id("${extractedId}");`;
                if (isXpath) return `${header}By locator = By.xpath("${escapeQuotes(selector)}");`;
                return `${header}By locator = By.cssSelector("${escapeQuotes(selector)}");`;
            }

            if (language === 'java' && tool === 'selenide') {
                let header = isFirst ? '// Java + Selenide\n' : '';
                if (useIdSelector) return `${header}SelenideElement element = $(By.id("${extractedId}"));`;
                if (isXpath) return `${header}SelenideElement element = $(By.xpath("${escapeQuotes(selector)}"));`;
                return `${header}SelenideElement element = $("${escapeQuotes(selector)}");`;
            }

            if (language === 'java' && tool === 'playwright') {
                let header = isFirst ? '// Java + Playwright\n' : '';
                if (useIdSelector) return `${header}Locator element = page.locator("#${extractedId}");`;
                if (isXpath) return `${header}Locator element = page.locator("xpath=${escapeQuotes(selector)}");`;
                return `${header}Locator element = page.locator("${escapeQuotes(selector)}");`;
            }

            // PYTHON
            if (language === 'python' && tool === 'selenium') {
                let header = isFirst ? '# Python + Selenium\n' : '';
                if (useIdSelector) return `${header}element = driver.find_element(By.ID, "${extractedId}")`;
                if (isXpath) return `${header}element = driver.find_element(By.XPATH, "${escapeQuotes(selector)}")`;
                return `${header}element = driver.find_element(By.CSS_SELECTOR, "${escapeQuotes(selector)}")`;
            }

            if (language === 'python' && tool === 'playwright') {
                let header = isFirst ? '# Python + Playwright\n' : '';
                if (useIdSelector) return `${header}element = page.locator("#${extractedId}")`;
                if (isXpath) return `${header}element = page.locator("xpath=${escapeQuotes(selector)}")`;
                return `${header}element = page.locator("${escapeQuotes(selector)}")`;
            }

            if (language === 'python' && tool === 'robotframework') {
                let header = isFirst ? '# Robot Framework\n' : '';
                if (useIdSelector) return `${header}Click Element    id=${extractedId}`;
                if (isXpath) return `${header}Click Element    xpath=${escapeQuotes(selector)}`;
                return `${header}Click Element    css=${escapeQuotes(selector)}`;
            }

            // C#
            if (language === 'csharp' && tool === 'selenium') {
                if (notation === 'FindBy') {
                    let header = isFirst ? '// C# + Selenium\n' : '';
                    if (useIdSelector) return `${header}[FindBy(How = How.Id, Using = "${extractedId}")]\nprivate IWebElement element;`;
                    if (isXpath) return `${header}[FindBy(How = How.XPath, Using = "${escapeQuotes(selector)}")]\nprivate IWebElement element;`;
                    return `${header}[FindBy(How = How.CssSelector, Using = "${escapeQuotes(selector)}")]\nprivate IWebElement element;`;
                }
                let header = isFirst ? '// C# + Selenium\n' : '';
                if (useIdSelector) return `${header}var element = driver.FindElement(By.Id("${extractedId}"));`;
                if (isXpath) return `${header}var element = driver.FindElement(By.XPath("${escapeQuotes(selector)}"));`;
                return `${header}var element = driver.FindElement(By.CssSelector("${escapeQuotes(selector)}"));`;
            }

            if (language === 'csharp' && tool === 'playwright') {
                let header = isFirst ? '// C# + Playwright\n' : '';
                if (useIdSelector) return `${header}var element = await page.Locator("#${extractedId}");`;
                if (isXpath) return `${header}var element = await page.Locator("xpath=${escapeQuotes(selector)}");`;
                return `${header}var element = await page.Locator("${escapeQuotes(selector)}");`;
            }

            // JAVASCRIPT/TYPESCRIPT
            if ((language === 'javascript' || language === 'typescript') && tool === 'selenium') {
                let header = isFirst ? '// JS/TS + Selenium\n' : '';
                if (useIdSelector) return `${header}const element = await driver.findElement(By.id("${extractedId}"));`;
                if (isXpath) return `${header}const element = await driver.findElement(By.xpath("${escapeQuotes(selector)}"));`;
                return `${header}const element = await driver.findElement(By.css("${escapeQuotes(selector)}"));`;
            }

            if ((language === 'javascript' || language === 'typescript') && tool === 'playwright') {
                let header = isFirst ? '// Playwright (JS/TS)\n' : '';
                if (useIdSelector) return `${header}const element = page.locator('#${extractedId}');`;
                if (isXpath) return `${header}const element = page.locator(\`xpath=${escapeQuotes(selector)}\`);`;
                return `${header}const element = page.locator("${escapeQuotes(selector)}");`;
            }

            if ((language === 'javascript' || language === 'typescript') && tool === 'cypress') {
                let header = isFirst ? '// Cypress (JS/TS)\n' : '';
                if (useIdSelector) return `${header}cy.get("#${extractedId}")`;
                if (isXpath) return `${header}cy.xpath("${escapeQuotes(selector)}")`;
                return `${header}cy.get("${escapeQuotes(selector)}")`;
            }

            if ((language === 'javascript' || language === 'typescript') && tool === 'puppeteer') {
                let header = isFirst ? '// Puppeteer (JS/TS)\n' : '';
                if (useIdSelector) return `${header}const element = await page.$("#${extractedId}");`;
                if (isXpath) return `${header}const elements = await page.$x("${escapeQuotes(selector)}");\nconst element = elements[0];`;
                return `${header}const element = await page.$("${escapeQuotes(selector)}");`;
            }

            // RUBY
            if (language === 'ruby' && tool === 'selenium') {
                let header = isFirst ? '# Ruby + Selenium\n' : '';
                if (useIdSelector) return `${header}element = driver.find_element(:id, "${extractedId}")`;
                if (isXpath) return `${header}element = driver.find_element(:xpath, "${escapeQuotes(selector)}")`;
                return `${header}element = driver.find_element(:css, "${escapeQuotes(selector)}")`;
            }

            // KOTLIN
            if (language === 'kotlin' && tool === 'selenium') {
                let header = isFirst ? '// Kotlin + Selenium\n' : '';
                if (useIdSelector) return `${header}val element = driver.findElement(By.id("${extractedId}"))`;
                if (isXpath) return `${header}val element = driver.findElement(By.xpath("${escapeQuotes(selector)}"))`;
                return `${header}val element = driver.findElement(By.cssSelector("${escapeQuotes(selector)}"))`;
            }

            if (language === 'kotlin' && tool === 'selenide') {
                let header = isFirst ? '// Kotlin + Selenide\n' : '';
                if (useIdSelector) return `${header}val element = \$By.id("${extractedId}")`;
                if (isXpath) return `${header}val element = \$By.xpath("${escapeQuotes(selector)}")`;
                return `${header}val element = \$("${escapeQuotes(selector)}")`;
            }

            // Default (plain selector)
            return selector;
        };
    }

    let allCode = '';
    rows.forEach((row, idx) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
            const type = cells[0].textContent.trim();
            let selectorCell = cells[1].cloneNode(true);
            selectorCell.querySelectorAll('span').forEach(span => span.remove());
            let selector = selectorCell.textContent.trim();

            allCode += getCodeTemplate(language, tool, selector, notation, idx === 0) + '\n\n';
        }
    });

    navigator.clipboard.writeText(allCode.trim())
        .then(() => {
            showNotification('All codes copied to clipboard!');
        })
        .catch(err => {
            showNotification('Copy all error: ' + err.message, true);
        });
});
// Function to centralize panel event handlers
function attachPanelEventHandlers() {
    // Close panel
    const closeBtn = document.getElementById('close-panel');
    if (closeBtn) {
        closeBtn.onclick = function () {
            selectorPanel.style.display = 'none';
            isPanelVisible = false;
            if (typeof saveData === 'function') saveData();
        };
    }
    // Minimize panel
    const minimizeBtn = document.getElementById('minimize-panel');
    if (minimizeBtn) {
        minimizeBtn.onclick = function () {
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
        };
    }
    // Element selection
    const activateBtn = document.getElementById('activate-panel-selector');
    if (activateBtn) {
        activateBtn.onclick = function () {
            selectorMode = true;
            document.body.style.cursor = 'crosshair';
            showNotification('Element selection mode active. Click on an element.');
            document.addEventListener('mouseover', highlightElement);
            document.addEventListener('mouseout', removeHighlight);
        };
    }
    // Copy all
    const copyAllBtn = document.getElementById('copy-all-selectors');
    if (copyAllBtn) {
        copyAllBtn.onclick = function () {
            const language = document.getElementById('language-select').value;
            const tool = document.getElementById('tool-select').value;
            const notationSelect = document.getElementById('notation-select');
            const notation = notationSelect && notationSelect.style.display !== 'none' ? notationSelect.value : null;
            const historyTable = document.getElementById('selector-history');
            const rows = historyTable.querySelectorAll('tr');
            if (rows.length === 0) {
                showNotification('Selector list is empty!', true);
                return;
            }
            let getCodeTemplate = window.getCodeTemplate;
            if (!getCodeTemplate) {
                getCodeTemplate = function (language, tool, selector, notation) {
                    const isXpath = selector.startsWith('/') || selector.startsWith('(') || selector.startsWith('//*[@') || selector.startsWith('//');
                    if (language === 'java' && tool === 'selenium') {
                        if (notation === 'FindBy') {
                            if (isXpath) return `// Java + Selenium\n@FindBy(xpath = \"${selector}\")\nWebElement element;`;
                            else return `// Java + Selenium\n@FindBy(css = \"${selector}\")\nWebElement element;`;
                        }
                        if (notation === 'By' || !notation) {
                            if (isXpath) return `// Java + Selenium\nBy locator = By.xpath(\"${selector}\");`;
                            else return `// Java + Selenium\nBy locator = By.cssSelector(\"${selector}\");`;
                        }
                    }
                    if (language === 'java' && tool === 'selenide') {
                        if (isXpath) return `// Java + Selenide\nSelenideElement element = $(By.xpath(\"${selector}\"));`;
                        else return `// Java + Selenide\nSelenideElement element = $(\"${selector}\");`;
                    }
                    if (language === 'python' && tool === 'selenium') {
                        if (notation === 'By' || !notation) {
                            if (isXpath) return `# Python + Selenium\nelement = driver.find_element(By.XPATH, \"${selector}\")`;
                            else return `# Python + Selenium\nelement = driver.find_element(By.CSS_SELECTOR, \"${selector}\")`;
                        }
                    }
                    if (language === 'python' && tool === 'robotframework') {
                        if (isXpath) return `# Robot Framework\nClick Element    xpath=${selector}`;
                        else return `# Robot Framework\nClick Element    css=${selector}`;
                    }
                    if (language === 'csharp' && tool === 'selenium') {
                        if (notation === 'FindBy') {
                            if (isXpath) return `// C# + Selenium\n[FindBy(How = How.XPath, Using = \"${selector}\")]\nprivate IWebElement element;`;
                            else return `// C# + Selenium\n[FindBy(How = How.CssSelector, Using = \"${selector}\")]\nprivate IWebElement element;`;
                        }
                        if (notation === 'By' || !notation) {
                            if (isXpath) return `// C# + Selenium\nvar element = driver.FindElement(By.XPath(\"${selector}\"));`;
                            else return `// C# + Selenium\nvar element = driver.FindElement(By.CssSelector(\"${selector}\"));`;
                        }
                    }
                    if ((language === 'javascript' || language === 'typescript') && tool === 'selenium') {
                        if (isXpath) return `// JS/TS + Selenium\nconst element = await driver.findElement(By.xpath(\"${selector}\"));`;
                        else return `// JS/TS + Selenium\nconst element = await driver.findElement(By.css(\"${selector}\"));`;
                    }
                    if ((language === 'javascript' || language === 'typescript') && tool === 'cypress') {
                        if (isXpath) return `// Cypress (JS/TS)\ncy.xpath(\"${selector}\")`;
                        else return `// Cypress (JS/TS)\ncy.get(\"${selector}\")`;
                    }
                    if ((language === 'javascript' || language === 'typescript') && tool === 'playwright') {
                        if (isXpath) return `// Playwright (JS/TS)\nawait page.locator('xpath=${selector}')`;
                        else return `// Playwright (JS/TS)\nawait page.locator('${selector}')`;
                    }
                    if ((language === 'javascript' || language === 'typescript') && tool === 'puppeteer') {
                        if (isXpath) return `// Puppeteer (JS/TS)\nconst [element] = await page.$x(\"${selector}\");`;
                        else return `// Puppeteer (JS/TS)\nconst element = await page.$(\"${selector}\");`;
                    }
                    if ((language === 'javascript' || language === 'typescript') && tool === 'webdriverio') {
                        if (isXpath) return `// WebdriverIO (JS/TS)\nconst element = await $(\"${selector}\");`;
                        else return `// WebdriverIO (JS/TS)\nconst element = await $(\"${selector}\");`;
                    }
                    if ((language === 'javascript' || language === 'typescript') && tool === 'testcafe') {
                        if (isXpath) return `// TestCafe (JS/TS)\nconst element = Selector(() => document.evaluate(\"${selector}\", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue);`;
                        else return `// TestCafe (JS/TS)\nconst element = Selector(\"${selector}\");`;
                    }
                    if (language === 'ruby' && tool === 'selenium') {
                        if (isXpath) return `# Ruby + Selenium\nelement = driver.find_element(:xpath, \"${selector}\")`;
                        else return `# Ruby + Selenium\nelement = driver.find_element(:css, \"${selector}\")`;
                    }
                    if (language === 'kotlin' && tool === 'selenium') {
                        if (isXpath) return `// Kotlin + Selenium\nval element = driver.findElement(By.xpath(\"${selector}\"))`;
                        else return `// Kotlin + Selenium\nval element = driver.findElement(By.cssSelector(\"${selector}\"))`;
                    }
                    if (language === 'kotlin' && tool === 'selenide') {
                        if (isXpath) return `// Kotlin + Selenide\nval element = \$(By.xpath(\"${selector}\"))`;
                        else return `// Kotlin + Selenide\nval element = \$(\"${selector}\")`;
                    }
                    return selector;
                };
            }
            let allCode = '';
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2) {
                    const type = cells[0].textContent.trim();
                    const selector = cells[1].textContent.split('(')[0].trim();
                    allCode += getCodeTemplate(language, tool, selector, notation) + '\n\n';
                }
            });
            navigator.clipboard.writeText(allCode.trim())
                .then(() => {
                    showNotification('All codes copied to clipboard!');
                })
                .catch(err => {
                    showNotification('Copy all error: ' + err.message, true);
                });
        };
    }
    // Clear list
    const clearBtn = document.getElementById('clear-history');
    if (clearBtn) {
        clearBtn.onclick = function () {
            const historyTable = document.getElementById('selector-history');
            historyTable.innerHTML = '';
            showNotification('Selector list cleared');
            try {
                chrome.storage.local.remove('selectorHistory', function () {
                    console.log('Selector history cleared from storage');
                });
            } catch (error) {
                console.error('Storage clearing error:', error);
            }
        };
    }
}

// Call attachPanelEventHandlers when panel is created and after each innerHTML update
attachPanelEventHandlers();

// Call ensurePanelExists function
function ensurePanelExists() {
    if (!document.getElementById('xpath-css-selector-panel')) {
        document.body.appendChild(selectorPanel);
        selectorPanel.style.display = isPanelVisible ? 'block' : 'none';
    }
    if (!document.getElementById('selector-history')) {
        // Re-add panel content (if needed, re-create panel content)
        selectorPanel.innerHTML = `
          <div style="padding: 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background-color: #f8f9fa;">
            <h3 style="margin: 0; font-size: 16px; color: #2c3e50;">Element Selector Generator</h3>
            <div>
              <button id="minimize-panel" style="background: none; border: none; cursor: pointer; font-size: 16px; color: #7f8c8d; margin-right: 5px;">_</button>
              <button id="close-panel" style="background: none; border: none; cursor: pointer; font-size: 16px; color: #7f8c8d;">×</button>
            </div>
          </div>
          <div style="padding: 12px;">
            <div style="margin-bottom: 12px;">
              <button id="activate-panel-selector" style="background-color: #3498db; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; width: 100%;">Select Element</button>
            </div>
            <div style="margin-top: 16px;">
              <h4 style="margin: 0 0 8px; font-size: 14px; color: #2c3e50;">Output</h4>
              <div style="background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin-bottom: 8px; max-height: 100px; overflow-y: auto; word-break: break-all; font-family: monospace; font-size: 12px;" id="panel-selector-result">No element selected yet</div>
              <div id="panel-validation-result" style="margin: 8px 0; font-size: 12px; min-height: 18px;"></div>
              <button id="panel-copy-selector" style="background-color: #3498db; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; width: 100%;" disabled>Copy</button>
            </div>
            <div id="element-attributes" style="margin-top: 16px; display: none;">
              <h4 style="margin: 0 0 8px; font-size: 14px; color: #2c3e50;">Element Properties</h4>
              <div style="background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin-bottom: 8px; max-height: 200px; overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                  <thead>
                    <tr style="background-color: #eee; text-align: left;">
                      <th style="padding: 6px; border-bottom: 1px solid #ddd;">Feature</th>
                      <th style="padding: 6px; border-bottom: 1px solid #ddd;">Value</th>
                      <th style="padding: 6px; border-bottom: 1px solid #ddd;">Matching</th>
                      <th style="padding: 6px; border-bottom: 1px solid #ddd;">Process</th>
                    </tr>
                  </thead>
                  <tbody id="attribute-list">
                    <!-- Features will be added here -->
                  </tbody>
                </table>
              </div>
            </div>
            <div id="element-actions" style="margin-top: 16px; display: none;">
              <h4 style="margin: 0 0 8px; font-size: 14px; color: #2c3e50;">Element Operations</h4>
              <div style="background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin-bottom: 8px;">
                <div id="element-type-info" style="margin-bottom: 8px; font-size: 12px;">Element Type: <span id="element-type">-</span></div>
                <div id="click-action" style="margin-bottom: 8px;">
                  <button id="perform-click" style="background-color: #3498db; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; width: 100%;">Click</button>
                </div>
                <div id="input-action" style="margin-bottom: 8px; display: none;">
                  <div style="display: flex; gap: 5px; margin-bottom: 5px;">
                    <input type="text" id="input-value" placeholder="Enter value" style="flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                    <button id="perform-input" style="background-color: #3498db; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Send</button>
                  </div>
                </div>
                <div id="select-action" style="margin-bottom: 8px; display: none;">
                  <div style="display: flex; gap: 5px; margin-bottom: 5px;">
                    <select id="select-options" style="flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                      <option value="">Select option</option>
                    </select>
                    <button id="perform-select" style="background-color: #3498db; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Select</button>
                  </div>
                </div>
                <div id="checkbox-action" style="margin-bottom: 8px; display: none;">
                  <button id="perform-checkbox" style="background-color: #3498db; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; width: 100%;">Change Status</button>
                </div>
              </div>
            </div>
            <div style="margin-top: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <h4 style="margin: 0; font-size: 14px; color: #2c3e50;">Selector List</h4>
                <button id="clear-history" style="background-color: #e74c3c; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;">Clear List</button>
              </div>
              <div style="background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; max-height: 150px; overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                  <thead>
                    <tr style="background-color: #eee; text-align: left;">
                      <th style="padding: 6px; border-bottom: 1px solid #ddd;">Type</th>
                      <th style="padding: 6px; border-bottom: 1px solid #ddd;">Selector</th>
                      <th style="padding: 6px; border-bottom: 1px solid #ddd;">Process</th>
                    </tr>
                  </thead>
                  <tbody id="selector-history">
                    <!-- Selector history will be added here -->
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;
        // If panel is recreated, if there is a selected element, show it again
        if (window.selectedElement) {
            showElementAttributes(window.selectedElement);
        }
    }
}