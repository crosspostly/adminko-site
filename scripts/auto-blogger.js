const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;
const OUTPUT_DIR = path.join(__dirname, '../site/public/blog');
const INDEX_FILE = path.join(OUTPUT_DIR, 'index.json');
const PRIORITIZED_TOPICS_FILE = path.join(__dirname, 'prioritized_topics.json');

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
const systemPrompt = fs.readFileSync(path.join(__dirname, '../docs/AGENT_PROMPT.md'), 'utf-8');

const headerHtmlRaw = fs.readFileSync(path.join(__dirname, '../site/public/header.html'), 'utf-8');
const footerHtmlRaw = fs.readFileSync(path.join(__dirname, '../site/public/footer.html'), 'utf-8');

const headerHtml = headerHtmlRaw.replace(/href="/g, 'href="../').replace(/src="/g, 'src="../');
const footerHtml = footerHtmlRaw.replace(/href="/g, 'href="../').replace(/src="/g, 'src="../').replace(/src='"/g, "src='../");

let blogIndex = [];
if (fs.existsSync(INDEX_FILE)) {
    blogIndex = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
}

function getNextPublishDate() {
    const today = new Date();
    today.setHours(8, 0, 0, 0);
    if (blogIndex.length === 0) return today.toISOString();
    const lastDate = new Date(blogIndex[blogIndex.length - 1].publish_date);
    lastDate.setHours(lastDate.getHours() + 2); // Новое расписание: каждые 2 часа при ручном запуске
    return lastDate < today ? today.toISOString() : lastDate.toISOString();
}

async function generateDeepArticle(task) {
    const topic = task.topic;
    const keywords = task.keywords || [];
    
    console.log(`\n🚀 ЗАПУСК ГЕНЕРАЦИИ: "${topic}"`);
    console.log(`🔑 Ключевые слова: ${keywords.join(', ')}`);

    try {
        // ЭТАП 1: СОЗДАНИЕ ПЛАНА (СХЕМЫ)
        const planPrompt = `ТЫ — ВЕДУЩИЙ ИНЖЕНЕР СЦ АДМИН.КО. Создай подробный план продающей технической статьи на тему: "${topic}". 
        ОБЯЗАТЕЛЬНО ИСПОЛЬЗУЙ КЛЮЧИ ДЛЯ СЕО: ${keywords.join(', ')}.
        План должен включать 5-6 глав (Диагностика, Процесс ремонта, Почему мы, Цена). 
        Верни ТОЛЬКО JSON массив строк.`;
        
        const planResult = await model.generateContent(planPrompt);
        const sections = JSON.parse(planResult.response.text().replace(/```json|```/g, '').trim());
        console.log(`✅ План создан: ${sections.length} глав.`);

        // ЭТАП 2: ПРОРАБОТКА ГЛАВ
        let articleBody = "";
        for (const section of sections) {
            console.log(`  └─ Пишем главу: ${section}...`);
            const sectionPrompt = `${systemPrompt}\n\nНАПИШИ ПОДРОБНУЮ ГЛАВУ СТАТЬИ.\nТема: "${topic}"\nГлава: "${section}"\nКЛЮЧЕВЫЕ СЛОВА ДЛЯ ВШИВАНИЯ: ${keywords.join(', ')}.`;
            const sectionResult = await model.generateContent(sectionPrompt);
            articleBody += `\n<section>\n${sectionResult.response.text()}\n</section>\n`;
        }

        // ЭТАП 3: МЕТАДАННЫЕ
        const metaPrompt = `Для статьи "${topic}" создай JSON: {"title": "SEO Title", "description": "SEO Description", "slug": "slug"}. КЛЮЧИ: ${keywords.join(', ')}.`;
        const metaResult = await model.generateContent(metaPrompt);
        const metaRaw = metaResult.response.text();
        const jsonMatch = metaRaw.match(/\{[\s\S]*\}/);
        const meta = JSON.parse(jsonMatch[0]);

        // ЭТАП 4: СЛОЙ РЕДАКТОРА
        const editorPrompt = `ТЫ — ГЛАВНЫЙ РЕДАКТОР. Очисти HTML статью ниже от JSON и мусора. Оставь ключи SEO: ${keywords.join(', ')}.\nСТАТЬЯ:\n${articleBody}`;
        const editorResult = await model.generateContent(editorPrompt);
        articleBody = editorResult.response.text().replace(/```html|```/g, '').trim();
        articleBody = articleBody.replace(/\{[^{}]*"(?:title|description|slug)"[^{}]*\}/gi, '');

        const publishDate = getNextPublishDate();
        const fileName = `${meta.slug}.html`;

        const finalHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>${meta.title} | Админ.Ко</title>
    <meta name="description" content="${meta.description}">
    <link rel="stylesheet" href="../styles.css?v=3.3">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col min-h-screen">
    ${headerHtml}
    <main class="flex-grow max-w-4xl mx-auto px-4 py-12 w-full">
        <article class="prose dark:prose-invert max-w-none bg-white dark:bg-gray-800 p-8 md:p-16 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-gray-700">
            ${articleBody}
        </article>
    </main>
    ${footerHtml}
    <script src="../components.js?v=3.3"></script>
</body>
</html>`;

        fs.writeFileSync(path.join(OUTPUT_DIR, fileName), finalHtml);
        blogIndex.push({ title: meta.title, description: meta.description, slug: meta.slug, publish_date: publishDate, topic_raw: topic });
        fs.writeFileSync(INDEX_FILE, JSON.stringify(blogIndex, null, 2));
        
        console.log(`✅ ГОТОВО: ${fileName}`);
        return true;
    } catch (e) {
        console.error("❌ Ошибка:", e.message);
        return false;
    }
}

async function run() {
    if (!fs.existsSync(PRIORITIZED_TOPICS_FILE)) return;
    const topics = JSON.parse(fs.readFileSync(PRIORITIZED_TOPICS_FILE, 'utf-8'));
    const generated = blogIndex.map(i => i.topic_raw);
    const pending = topics.filter(t => !generated.includes(t.topic));

    if (pending.length > 0) {
        await generateDeepArticle(pending[0]);
    }
}

run();
