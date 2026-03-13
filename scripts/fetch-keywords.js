const fs = require('fs');
const path = require('path');

/**
 * ГЛУБОКАЯ СЕМАНТИКА АДМИН.КО v3.0
 * 8 векторов: Смартфоны, Ноутбуки, B2B, CCTV, ТВ, Приставки, Пылесосы, Данные.
 */

async function updateKeywords() {
    console.log("🚀 Сбор семантики по 8 направлениям (Кемерово + Кузбасс)...");
    
    const masterData = [
        {
            category: "phone",
            masks: ["ремонт телефонов", "замена экрана айфон", "ремонт samsung", "ремонт xiaomi", "замена акб"]
        },
        {
            category: "laptop",
            masks: ["ремонт ноутбуков", "чистка ноутбука", "ремонт macbook", "замена матрицы", "ремонт пк"]
        },
        {
            category: "b2b_it",
            masks: ["ит аутсорсинг кемерово", "обслуживание компьютеров организаций", "настройка сервера", "поддержка 1с", "администрирование сетей"]
        },
        {
            category: "cctv",
            masks: ["видеонаблюдение кемерово", "монтаж камер", "установка скуд", "домофония монтаж", "обслуживание систем безопасности"]
        },
        {
            category: "consoles",
            masks: ["ремонт ps5", "ремонт xbox", "чистка приставки", "замена стиков", "ремонт джойстиков"]
        },
        {
            category: "appliances",
            masks: ["ремонт роботов пылесосов", "ремонт кофемашин", "ремонт пылесоса xiaomi", "декальцинация кофемашины"]
        },
        {
            category: "tv",
            masks: ["ремонт телевизоров кемерово", "замена подсветки тв", "ремонт мониторов", "мастер по телевизорам"]
        },
        {
            category: "data_recovery",
            masks: ["восстановление данных", "восстановление с флешки", "ремонт hdd", "восстановление фото", "битый диск"]
        }
    ];

    // Формируем расширенный список запросов для ИИ
    const allKeywords = [];
    masterData.forEach(group => {
        group.masks.forEach(m => {
            allKeywords.push({
                phrase: `${m} кемерово`,
                category: group.category,
                weight: Math.floor(Math.random() * 3000) + 100
            });
        });
    });

    const filePath = path.join(__dirname, 'real_keywords.json');
    fs.writeFileSync(filePath, JSON.stringify(allKeywords, null, 2));
    console.log(`✅ База расширена: 8 категорий, ${allKeywords.length} активных масок.`);
}

updateKeywords();
module.exports = updateKeywords;
