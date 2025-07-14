function generateXPath(element) {
    if (!element) return '';

    // Element HTML elementi değilse (örn. text node)
    if (element.nodeType !== 1) {
        return '';
    }

    // Eğer ID varsa, doğrudan ID ile XPath oluştur
    if (element.id) {
        return `//*[@id="${element.id}"]`;
    }

    // Recursive olarak parent elementlere bakarak XPath oluştur
    const paths = [];

    // Eğer document.body'ye ulaştıysak veya element null ise dur
    while (element && element.nodeType === 1 && element !== document.body) {
        let index = 1;
        let sibling = element.previousSibling;

        // Aynı türdeki kardeş elementleri say
        while (sibling) {
            if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
                index++;
            }
            sibling = sibling.previousSibling;
        }

        // Element'in özel nitelikleri varsa, bunları kullan
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

        // XPath parçasını oluştur
        let pathPart;

        if (attributes.length > 0) {
            pathPart = `${element.tagName.toLowerCase()}[${attributes[0]}]`;
        } else {
            // Eğer aynı türde birden fazla element varsa, indeks ekle
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

    // XPath'i birleştir
    return `//${paths.join('/')}`;
}

function generateCssSelector(element) {
    if (!element) return '';

    // Element HTML elementi değilse (örn. text node)
    if (element.nodeType !== 1) {
        return '';
    }

    // Eğer ID varsa, doğrudan ID ile seçici oluştur
    if (element.id) {
        return `#${element.id}`;
    }

    // Recursive olarak parent elementlere bakarak seçici oluştur
    const paths = [];

    // Eğer document.body'ye ulaştıysak veya element null ise dur
    while (element && element.nodeType === 1 && element !== document.body) {
        let selector = element.tagName.toLowerCase();

        // ID varsa ekle
        if (element.id) {
            selector = `#${element.id}`;
            paths.unshift(selector);
            break;
        }

        // Class varsa ekle
        if (element.className && typeof element.className === 'string' && element.className.trim() !== '') {
            const classes = element.className.trim().split(/\s+/);
            if (classes.length > 0) {
                selector += `.${classes.join('.')}`;
            }
        }

        // Eğer bu seçici yeterince özgün değilse, nth-child ekle
        const siblings = element.parentNode ? Array.from(element.parentNode.children) : [];
        if (siblings.length > 1) {
            const index = siblings.indexOf(element) + 1;
            selector += `:nth-child(${index})`;
        }

        paths.unshift(selector);
        element = element.parentNode;
    }

    // CSS seçiciyi birleştir
    return paths.join(' > ');
}

function generateSelector(element, type) {
    if (!element) return '';

    if (type === 'xpath') {
        return generateXPath(element);
    } else {
        return generateCssSelector(element);
    }
}

// Seçici oluşturma ve işleme fonksiyonları
import { showNotification } from './utils.js';
import { highlightSelectedElement } from './highlight.js';
import { saveData } from './storage.js';

// Seçici modu aktif mi?
let selectorMode = false;
let selectedElement = null;
let currentSelectorType = 'xpath';
let shadowDomSupport = false;
let iframeSupport = false;

// Seçici geçmişine ekle
function addToSelectorHistory(type, selector) {
  // Fonksiyon içeriği
}

// Seçici ile element bulma
function findElementBySelector(selector, type) {
  // Fonksiyon içeriği
}

// Element işlemlerini göster
function showElementActions(element) {
  // Fonksiyon içeriği
}

// Element özelliklerini göster
function showElementAttributes(element) {
  // Fonksiyon içeriği
}

// Dışa aktarılacak fonksiyonlar
export { 
  selectorMode, 
  selectedElement, 
  currentSelectorType, 
  shadowDomSupport, 
  iframeSupport, 
  addToSelectorHistory, 
  findElementBySelector, 
  showElementActions, 
  showElementAttributes 
};

// Dışa aktarma
window.generateXPath = generateXPath;
window.generateCssSelector = generateCssSelector;
window.generateSelector = generateSelector;