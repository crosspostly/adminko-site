const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const PUBLIC_DIR = path.join(__dirname, '../site/public');
const BLOG_DIR = path.join(PUBLIC_DIR, 'blog');
const BLOG_INDEX_FILE = path.join(BLOG_DIR, 'index.json');
const TOPICS_FILE = path.join(__dirname, 'prioritized_topics.json');
const SYSTEM_PROMPT_PATH = path.join(__dirname, '../docs/AGENT_PROMPT.md');

const systemPrompt = fs.readFileSync(SYSTEM_PROMPT_PATH, 'utf-8');

/**
 * ФАБРИКА ДИЗАЙНА
 */
const Layout = {
    yellowBlock: (content) => `
        <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-6 my-8 rounded-r-2xl shadow-sm">
            ${content}
        </div>`,
    
    blueBlock: (content) => `
        <div class="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-[2rem] border-l-4 border-blue-500 my-10">
            ${content}
        </div>`,

    ctaBlock: `
        <div class="mt-16 mb-12 p-8 md:p-12 bg-primary rounded-[3rem] shadow-2xl shadow-primary/20 text-center relative overflow-hidden group">
            <div class="relative z-10">
                <h3 class="text-3xl md:text-4xl font-black mb-4 text-white uppercase italic">Спросите инженера</h3>
                <p class="mb-8 text-white/90 text-lg md:text-xl font-medium max-w-xl mx-auto">Диагностика в «Админ.Ко» всегда 0₽. Опишите проблему, и мы назовем цену ремонта за 5 минут.</p>
                <div class="flex justify-center">
                    <button onclick="openMessengerModal()" class="bg-white text-primary px-10 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-xl active:scale-95 flex items-center gap-3 uppercase tracking-widest">
                        <span class="material-symbols-outlined">chat</span>
                        Бесплатная консультация
                    </button>
                </div>
            </div>
            <span class="material-symbols-outlined absolute -right-8 -bottom-8 text-[15rem] text-white/10 rotate-12 pointer-events-none">build_circle</span>
        </div>`
};

/**
 * ФУНКЦИЯ ОЧИСТКИ ОТ MARKDOWN (v4.1)
 */
function cleanMarkdown(text) {
    let clean = text.replace(/```html/g, '').replace(/```/g, '').replace(/&nbsp;/g, ' ').trim();
    clean = clean.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');
    clean = clean.replace(/^### (.*$)/gm, '<h3 class="text-2xl font-black mt-12 mb-6 text-gray-900 dark:text-white uppercase tracking-tighter">$1</h3>');
    clean = clean.replace(/^## (.*$)/gm, '<h2 class="text-3xl font-black mt-16 mb-8 text-gray-900 dark:text-white uppercase tracking-tighter italic border-l-8 border-primary pl-6">$1</h2>');
    clean = clean.replace(/^[\s]*[-*•] (.*)/gm, '<li class="relative pl-8 mb-4 before:content-[\\'—\\'] before:absolute before:left-0 before:text-primary before:font-black text-lg">$1</li>');
    
    // Стилизация цен и сроков
    clean = clean.replace(/^(Цена|Примерная цена|Сроки|Диагностика)[^:]*:(.*$)/gm, 
        '<div class="bg-gray-100 dark:bg-gray-800/50 p-6 rounded-2xl border-l-4 border-gray-400 my-8">' +
        '<strong class="block uppercase tracking-widest text-xs text-gray-500 mb-2">$1</strong>' +
        '<p class="text-xl font-bold text-gray-900 dark:text-white m-0">$2</p></div>');

    // Разбивка на абзацы
    const lines = clean.split('\\n');
    let finalHtml = '';
    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        if (trimmed.startsWith('<h') || trimmed.startsWith('<li') || trimmed.startsWith('<div')) {
            finalHtml += trimmed + '\\n';
        } else {
            const isPointHeader = trimmed.startsWith('<strong>');
            const spacingClass = isPointHeader ? 'mt-10 mb-4' : 'mb-8';
            finalHtml += \`<p class="\${spacingClass} leading-relaxed text-gray-700 dark:text-gray-300 font-medium text-lg lg:text-xl">\${trimmed}</p>\\n\`;
        }
    });
    return finalHtml;
}

async function generateDeepArticle(topicData) {
    const { topic } = topicData;
    console.log(\`\\n🛠️  Запуск конвейера для статьи: "\${topic}"\`);

    try {
        console.log("  [1/4] Генерация мета-данных...");
        const metaPrompt = \`Для темы "\${topic}" создай SEO данные (город Кемерово). Верни ТОЛЬКО JSON: {"title": "...", "description": "...", "slug": "..."}\`;
        const metaRes = await model.generateContent(metaPrompt);
        const metaText = metaRes.response.text();
        const jsonMatch = metaText.match(/\\{[\\s\\S]*\\}/);
        if (!jsonMatch) throw new Error("Не удалось распарсить JSON мета-данных");
        const meta = JSON.parse(jsonMatch[0]);

        console.log("  [2/4] Проектирование плана...");
        const planPrompt = \`ТЫ — ВЕДУЩИЙ ИНЖЕНЕР. Создай план статьи: "\${topic}". Верни ТОЛЬКО JSON массив из 4 названий глав.\`;
        const planRes = await model.generateContent(planPrompt);
        const sectionsText = planRes.response.text();
        const sectionsMatch = sectionsText.match(/\\[[\\s\\S]*\\]/);
        if (!sectionsMatch) throw new Error("Не удалось распарсить JSON плана");
        const sections = JSON.parse(sectionsMatch[0]);

        console.log("  [3/4] Написание текста по главам...");
        let chapters = [];
        for (const section of sections) {
            const chapterPrompt = \`\${systemPrompt}\\n\\nНАПИШИ ГЛАВУ: "\${section}" (Тема: \${topic})\\nТРЕБОВАНИЯ: Выдавай ТОЛЬКО HTML (h2, p, ul). Если уместно - используй названия оборудования. Пиши кратко, как инженер. НИКАКОГО MARKDOWN (**, #, -)!\`;
            const chapterRes = await model.generateContent(chapterPrompt);
            chapters.push(cleanMarkdown(chapterRes.response.text()));
        }

        console.log("  [4/4] Финальная сборка и верстка...");
        
        const blitzPrompt = \`Напиши краткий Blitz-Answer для статьи "\${topic}" (Цена, Срок, Диагностика в Кемерово). Выдай ТОЛЬКО текст без Markdown.\`;
        const blitzRes = await model.generateContent(blitzPrompt);
        const blitzHtml = cleanMarkdown(blitzRes.response.text());

        const nuancePrompt = \`Напиши один важный технический нюанс или секрет для темы "\${topic}". Выдай ТОЛЬКО текст без Markdown.\`;
        const nuanceRes = await model.generateContent(nuancePrompt);
        const nuanceHtml = cleanMarkdown(nuanceRes.response.text());

        let finalBody = \`
            <!-- CONTENT START -->
            <section>\${chapters[0]}</section>
            \${Layout.yellowBlock(blitzHtml)}
            <section>\${chapters[1]}</section>
            \${Layout.blueBlock(nuanceHtml)}
            \${Layout.ctaBlock}
            <section>\${chapters[2] || ''}</section>
            <section class="mt-8">\${chapters[3] || ''}</section>
            <!-- CONTENT END -->
        \`;

        const MASTER_HEADER = fs.readFileSync(path.join(PUBLIC_DIR, 'header.html'), 'utf-8').replace(/href="(?!http|https|#|tel:|mailto:)/g, 'href="../').replace(/src="(?!http)/g, 'src="../');
        const MASTER_FOOTER = fs.readFileSync(path.join(PUBLIC_DIR, 'footer.html'), 'utf-8').replace(/href="(?!http|https|#|tel:|mailto:)/g, 'href="../').replace(/src="(?!http)/g, 'src="../');

        const jsonLd = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": meta.title,
            "description": meta.description,
            "datePublished": new Date().toISOString(),
            "author": { "@type": "Organization", "name": "Админ.Ко" }
        };

        const finalHtml = \`<!DOCTYPE html>
<html lang="ru" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>\${meta.title} | Админ.Ко</title>
    <meta name="description" content="\${meta.description}">
    <link rel="canonical" href="https://admin-ko.ru/blog/\${meta.slug}.html">
    <script type="application/ld+json">\${JSON.stringify(jsonLd)}</script>
    <link rel="icon" href="../favicon.jpg" type="image/jpeg">
    <link rel="stylesheet" href="../styles.css?v=3.4">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
    <script>
        tailwind.config = { darkMode: 'class', theme: { extend: { colors: { primary: '#E50914' } } } }
        if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        }
    </script>
</head>
<body class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col min-h-screen transition-colors duration-300">
\${MASTER_HEADER}
<main class="flex-grow max-w-4xl mx-auto px-4 py-12 md:py-20 w-full">
    <article class="prose prose-lg dark:prose-invert max-w-none bg-white dark:bg-gray-800 p-8 md:p-16 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-gray-700">
        <header class="mb-12 md:mb-20">
            <div class="flex items-center gap-3 text-xs font-bold text-primary uppercase tracking-widest mb-6 italic">
                <span class="px-3 py-1 bg-primary/10 rounded-full border border-primary/20">Инженерный кейс</span>
                <span class="text-gray-400">Лаборатория Админ.Ко</span>
            </div>
            <h1 class="text-4xl md:text-6xl font-black mb-8 leading-tight tracking-tighter text-gray-900 dark:text-white uppercase italic">\${meta.title}</h1>
            <time class="hidden" itemprop="datePublished" datetime="\${new Date().toISOString()}"></time>
        </header>
        \${finalBody}
    </article>
</main>
\${MASTER_FOOTER}
<script src="../components.js?v=3.4"></script>
</body>
</html>\`;

        fs.writeFileSync(path.join(BLOG_DIR, \`\${meta.slug}.html\`), finalHtml);
        console.log(\`✅ Конвейер завершен: \${meta.slug}.html\`);
    } catch (e) {
        console.error(\`❌ Сбой конвейера: \`, e.message);
    }
}

if (require.main === module) {
    async function run() {
        const topics = JSON.parse(fs.readFileSync(TOPICS_FILE, 'utf-8'));
        if (topics.length > 0) {
            await generateDeepArticle(topics[0]);
            // Удаляем выполненную задачу
            const remaining = topics.slice(1);
            fs.writeFileSync(TOPICS_FILE, JSON.stringify(remaining, null, 2));
        }
    }
    run();
}

module.exports = { generateDeepArticle };
