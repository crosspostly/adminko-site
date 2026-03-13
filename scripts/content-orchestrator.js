const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * ТОТАЛЬНЫЙ РОТАТОР v3.0
 * Обеспечивает ежедневное покрытие 8 направлений.
 */

const INDEX_FILE = path.join(__dirname, '../site/public/blog/index.json');
const PRIORITIZED_TOPICS_FILE = path.join(__dirname, 'prioritized_topics.json');

const CATEGORIES = ['phone', 'laptop', 'b2b_it', 'cctv', 'consoles', 'appliances', 'tv', 'data_recovery'];

async function orchestrate() {
    console.log("🚀 Запуск Тотального Ротатора (8 ниш в день)...");

    if (!fs.existsSync(PRIORITIZED_TOPICS_FILE)) {
        execSync('node scripts/ai-keyword-analyzer.js', { stdio: 'inherit' });
    }

    let topics = JSON.parse(fs.readFileSync(PRIORITIZED_TOPICS_FILE, 'utf-8'));
    
    // Определяем какую категорию писать сейчас
    // Логика: находим категорию, которая была опубликована давнее всего
    const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
    
    let targetCategory = 'phone';
    const lastUses = {};
    CATEGORIES.forEach(cat => {
        const lastArt = [...index].reverse().find(a => a.category === cat);
        lastUses[cat] = lastArt ? new Date(lastArt.publish_date).getTime() : 0;
    });

    // Берем ту категорию, где время последней публикации минимально
    targetCategory = Object.keys(lastUses).reduce((a, b) => lastUses[a] < lastUses[b] ? a : b);

    console.log(`🎯 Целевая категория на этот запуск: [${targetCategory.toUpperCase()}]`);

    const task = topics.find(t => t.category === targetCategory);

    if (task) {
        // Перемещаем задачу в начало для auto-blogger
        const remaining = topics.filter(t => t !== task);
        fs.writeFileSync(PRIORITIZED_TOPICS_FILE, JSON.stringify([task, ...remaining], null, 2));
        
        try {
            execSync('node scripts/auto-blogger.js', { stdio: 'inherit' });
            console.log(`✅ Направление ${targetCategory} обновлено.`);
        } catch (e) {
            console.error("❌ Ошибка:", e.message);
        }
    } else {
        console.log(`⚠️ Нет тем для ${targetCategory}. Пополняем базу...`);
        execSync('node scripts/ai-keyword-analyzer.js', { stdio: 'inherit' });
    }
}

orchestrate();
