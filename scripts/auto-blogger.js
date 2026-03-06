const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const API_KEY = process.env.GEMINI_API_KEY;
const ARTICLES_TO_GENERATE = 3; // Для теста сгенерируем 3 штуки, потом можно поставить 50
const OUTPUT_DIR = path.join(__dirname, '../site/public/blog');
const INDEX_FILE = path.join(OUTPUT_DIR, 'index.json');
const TOPICS_FILE = path.join(__dirname, 'topics.json');

const ai = new GoogleGenAI({ apiKey: API_KEY });
const systemPrompt = fs.readFileSync(path.join(__dirname, '../docs/AGENT_PROMPT.md'), 'utf-8');

// Загрузка индекса (чтобы знать, что уже сгенерировано и распланировано)
let blogIndex = [];
if (fs.existsSync(INDEX_FILE)) {
    blogIndex = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
}

// Загрузка пула тем
const allTopics = JSON.parse(fs.readFileSync(TOPICS_FILE, 'utf-8'));

// Вычисляем дату для следующей статьи (отложенная публикация)
// Публикуем по 5 статей в день.
function getNextPublishDate() {
    const today = new Date();
    today.setHours(8, 0, 0, 0); // Начало дня в 08:00
    
    if (blogIndex.length === 0) return today.toISOString();
    
    const lastArticle = blogIndex[blogIndex.length - 1];
    const lastDate = new Date(lastArticle.publish_date);
    
    // Считаем сколько статей уже запланировано на этот день
    const sameDayCount = blogIndex.filter(a => {
        const d = new Date(a.publish_date);
        return d.toDateString() === lastDate.toDateString();
    }).length;

    if (sameDayCount >= 5) {
        // Переносим на следующий день
        lastDate.setDate(lastDate.getDate() + 1);
        lastDate.setHours(8, 0, 0, 0);
    } else {
        // Добавляем пару часов
        lastDate.setHours(lastDate.getHours() + 2);
    }
    
    // Если дата оказалась в прошлом (мы давно не генерировали), ставим сегодня
    if (lastDate < new Date()) {
        const now = new Date();
        now.setHours(now.getHours() + 1);
        return now.toISOString();
    }
    
    return lastDate.toISOString();
}

async function generateArticle(topic) {
    console.log(`\n⏳ Генерирую: "${topic}"...`);
    
    const prompt = `Напиши статью на тему: "${topic}". Строго соблюдай правила из системного промпта. Сначала верни JSON блок с метаданными (title, description, slug). Slug должен быть только английскими буквами без пробелов (например: remont-iphone-13-kemerovo). Затем HTML код (обернутый в \`\`\`html) - только содержимое тега <article>, используя классы Tailwind CSS. Раздели абзацы, используй <h2>, <ul>.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.3,
            }
        });

        const text = response.text;
        
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/i);
        const htmlMatch = text.match(/```html\n([\s\S]*?)\n```/i);

        if (!jsonMatch || !htmlMatch) {
            console.error("ОШИБКА: Модель не вернула JSON или HTML блоки.");
            return null;
        }

        const meta = JSON.parse(jsonMatch[1]);
        const htmlContent = htmlMatch[1];
        const publishDate = getNextPublishDate();
        const fileName = `${meta.slug}.html`;

        // Шаблон страницы статьи
        const finalHtml = `<!DOCTYPE html>
<html lang="ru" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${meta.title} | Админ.Ко</title>
    <meta name="description" content="${meta.description}">
    <link rel="icon" href="/favicon.jpg" type="image/jpeg">
    <link rel="stylesheet" href="../styles.css?v=3.1">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
    <script>
        tailwind.config = { darkMode: 'class', theme: { extend: { colors: { primary: '#E50914' } } } }
    </script>
</head>
<body class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col min-h-screen">
    
    <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-4">
        <div class="max-w-4xl mx-auto px-4 flex justify-between items-center">
            <a href="../index.html" class="font-bold text-xl flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">build_circle</span> Админ.Ко
            </a>
            <a href="../blog.html" class="text-sm font-medium hover:text-primary transition-colors">← В блог</a>
        </div>
    </header>

    <main class="flex-grow max-w-3xl mx-auto px-4 py-12 w-full">
        <article class="prose dark:prose-invert prose-primary lg:prose-lg max-w-none bg-white dark:bg-gray-800 p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h1 class="text-3xl md:text-4xl font-extrabold mb-6 text-gray-900 dark:text-white leading-tight">${meta.title}</h1>
            <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-8 pb-8 border-b border-gray-100 dark:border-gray-700">
                <span class="material-symbols-outlined text-sm">calendar_today</span>
                <span>${new Date(publishDate).toLocaleDateString('ru-RU')}</span>
                <span class="material-symbols-outlined text-sm ml-4">schedule</span>
                <span>3 мин чтения</span>
            </div>
            
            <div class="space-y-6 text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                ${htmlContent}
            </div>

            <div class="mt-12 pt-8 border-t border-gray-100 dark:border-gray-700">
                <div class="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                        <h4 class="font-bold text-gray-900 dark:text-white mb-2">Нужен ремонт?</h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Бесплатная диагностика в Кемерово на ул. Дзержинского, 2Б</p>
                    </div>
                    <a href="tel:+79502767171" class="flex-shrink-0 bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors inline-flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">phone</span>
                        Позвонить
                    </a>
                </div>
            </div>
        </article>
    </main>

    <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8 text-center text-sm text-gray-500 mt-auto">
        &copy; 2014-2026 Сервисный центр «Админ.Ко». г. Кемерово, ул. Дзержинского, 2Б.
    </footer>
</body>
</html>`;

        fs.writeFileSync(path.join(OUTPUT_DIR, fileName), finalHtml);
        
        // Добавляем в индекс
        blogIndex.push({
            title: meta.title,
            description: meta.description,
            slug: meta.slug,
            publish_date: publishDate,
            topic_raw: topic
        });

        fs.writeFileSync(INDEX_FILE, JSON.stringify(blogIndex, null, 2));
        console.log(`✅ Сохранено: ${fileName} (Дата публикации: ${publishDate})`);
        return true;
    } catch (error) {
        console.error(`❌ Ошибка генерации:`, error.message);
        return false;
    }
}

async function runAutoBlogger() {
    if (!API_KEY) {
        console.error("КРИТИЧЕСКАЯ ОШИБКА: Не задан GEMINI_API_KEY");
        process.exit(1);
    }

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const generatedTopics = blogIndex.map(i => i.topic_raw);
    const pendingTopics = allTopics.filter(t => !generatedTopics.includes(t));

    if (pendingTopics.length === 0) {
        console.log("🎉 Все темы из пула сгенерированы!");
        return;
    }

    console.log(`🚀 Старт. В очереди ${pendingTopics.length} тем. Генерируем ${ARTICLES_TO_GENERATE} шт.`);
    
    for (let i = 0; i < ARTICLES_TO_GENERATE && i < pendingTopics.length; i++) {
        await generateArticle(pendingTopics[i]);
        // Пауза 6 секунд для соблюдения лимитов (15 RPM)
        if (i < ARTICLES_TO_GENERATE - 1) {
            console.log("Ожидание 6 секунд (Rate Limit)...");
            await new Promise(resolve => setTimeout(resolve, 6000));
        }
    }
    console.log(`🏁 Партия завершена.`);
}

runAutoBlogger();