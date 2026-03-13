const fs = require('fs');
const path = require('path');

/**
 * Скрипт тотальной синхронизации UI Админ.Ко
 * Гарантирует 100% идентичность Хедера и Футера на всех страницах.
 */

const PUBLIC_DIR = path.join(__dirname, '../site/public');
const MASTER_HEADER = fs.readFileSync(path.join(PUBLIC_DIR, 'header.html'), 'utf-8');
const MASTER_FOOTER = fs.readFileSync(path.join(PUBLIC_DIR, 'footer.html'), 'utf-8');

function syncFile(filePath, isSubfolder = false) {
    let html = fs.readFileSync(filePath, 'utf-8');
    
    // Подготовка контента с учетом вложенности
    let header = MASTER_HEADER;
    let footer = MASTER_FOOTER;
    
    if (isSubfolder) {
        header = header.replace(/href="(?!http|https|#|tel:|mailto:)/g, 'href="../');
        header = header.replace(/src="(?!http|https)/g, 'src="../');
        footer = footer.replace(/href="(?!http|https|#|tel:|mailto:)/g, 'href="../');
        footer = footer.replace(/src="(?!http|https)/g, 'src="../');
    }

    // 1. Очистка старых блоков (ищем всё от начала body до первого значимого контента и от конца контента до конца body)
    // Мы сохраняем всё, что находится между основным контентом
    
    const bodyMatch = html.match(/<body[\s\S]*?>/);
    if (!bodyMatch) return;
    
    const bodyStartTag = bodyMatch[0];
    
    // Пытаемся найти границы основного контента
    // Обычно контент начинается с первого <section> или <main> после навигации
    // и заканчивается перед первой секцией с картой или <footer>
    
    let content = html;
    
    // Удаляем всё до первого <section> или <main>, который не является навигацией
    content = content.replace(/[\s\S]*?<body[\s\S]*?>/, '');
    
    // Удаляем старую навигацию если она есть
    content = content.replace(/<div class="brand-stripes[\s\S]*?<\/nav>/, '');
    content = content.replace(/<nav[\s\S]*?<\/nav>/, '');
    content = content.replace(/<div id="header-placeholder"><\/div>/, '');

    // Удаляем старый футер и карту
    content = content.replace(/<!-- Карта -->[\s\S]*?<\/footer>/, '');
    content = content.replace(/<footer[\s\S]*?<\/footer>/, '');
    content = content.replace(/<div id="footer-placeholder"><\/div>/, '');
    content = content.replace(/<div id="messenger-modal"[\s\S]*?<\/div>\s*<\/div>/, ''); // Удаляем старую модалку
    
    // Удаляем лишние скрипты подгрузки
    content = content.replace(/<script>\s*fetch\('header\.html'\)[\s\S]*?<\/script>/g, '');
    content = content.replace(/<script>\s*fetch\('footer\.html'\)[\s\S]*?<\/script>/g, '');
    content = content.replace(/<script src="components\.js.*?<\/script>/g, '');

    content = content.trim();

    // Сборка финального HTML
    const finalHtml = html.split(bodyStartTag)[0] + 
        bodyStartTag + "\n" +
        header + "\n" +
        content + "\n" +
        footer + "\n" +
        `<script src="${isSubfolder ? '../' : ''}components.js?v=3.3"></script>\n` +
        "</body>\n</html>";

    fs.writeFileSync(filePath, finalHtml);
    console.log(`✅ Synced: ${path.basename(filePath)}`);
}

// Синхронизируем корень
const rootFiles = fs.readdirSync(PUBLIC_DIR).filter(f => f.endsWith('.html') && f !== 'header.html' && f !== 'footer.html');
rootFiles.forEach(f => syncFile(path.join(PUBLIC_DIR, f), false));

// Синхронизируем блог
const blogDir = path.join(PUBLIC_DIR, 'blog');
if (fs.existsSync(blogDir)) {
    const blogFiles = fs.readdirSync(blogDir).filter(f => f.endsWith('.html'));
    blogFiles.forEach(f => syncFile(path.join(blogDir, f), true));
}

console.log("\n🚀 ТОТАЛЬНАЯ СИНХРОНИЗАЦИЯ ЗАВЕРШЕНА. Везде одинаково!");
