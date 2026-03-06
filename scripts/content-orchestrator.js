const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GEMINI_API_KEY;
const systemPrompt = fs.readFileSync(path.join(__dirname, '../docs/AGENT_PROMPT.md'), 'utf-8');

const BASE_PATH = path.join(__dirname, '../content_factory');

async function generateMultiChannelContent(topic) {
    if (!API_KEY) throw new Error("GEMINI_API_KEY не задан");
    const genAI = new GoogleGenerativeAI(API_KEY);
    // Используем актуальную модель из списка
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    console.log(`\n🚀 Запуск фабрики для темы: "${topic}"`);

    const fullPrompt = `${systemPrompt}\n\nЗАДАНИЕ:
    Тема: "${topic}".
    Сделай 3 варианта контента:
    1. WEBSITE: Статья для блога (SEO/GEO). HTML формат (только содержимое <article>), лонгрид 4000 знаков.
    2. ZEN: Пост для Яндекс.Дзена. Формат сторителлинга, упор на личный опыт мастера и эмоции. 3000 знаков.
    3. SOCIAL: Короткий пост для VK/Telegram. Текст с эмодзи, списком "боли" и четким призывом. 1000 знаков.
    
    Верни результат СТРОГО в формате JSON:
    {
      "slug": "url-friendly-name",
      "website": "html content...",
      "zen": "text content...",
      "social": "text content...",
      "metadata": { "title": "...", "description": "..." }
    }
    `;

    try {
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        let text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Не удалось спарсить JSON");
        
        const data = JSON.parse(jsonMatch[0]);

        const dirs = ['website/seo', 'social/zen', 'social/vk_telegram'];
        dirs.forEach(d => {
            const fullPath = path.join(BASE_PATH, d);
            if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
        });

        const datePrefix = new Date().toISOString().split('T')[0];
        const fileName = `${datePrefix}-${data.slug}`;

        fs.writeFileSync(path.join(BASE_PATH, `website/seo/${fileName}.html`), data.website);
        fs.writeFileSync(path.join(BASE_PATH, `social/zen/${fileName}.txt`), data.zen);
        fs.writeFileSync(path.join(BASE_PATH, `social/vk_telegram/${fileName}.txt`), data.social);

        console.log(`✅ Успех: ${data.slug}`);
        return true;
    } catch (e) {
        console.error("Ошибка:", e.message);
        return false;
    }
}

module.exports = { generateMultiChannelContent };
