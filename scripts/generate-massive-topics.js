const fs = require('fs');

/**
 * Глобальный расширенный список для создания МИЛЛИОНА комбинаций.
 * Включает все направления: от смартфонов до СКУД и 1С.
 */

const categories = {
    "Телефоны": [
        "iPhone 11", "iPhone 12", "iPhone 13 Pro Max", "iPhone 14 Plus", "iPhone 15 Pro",
        "Samsung Galaxy S22", "Samsung Galaxy S23 Ultra", "Samsung Galaxy Z Fold", "Samsung A54",
        "Xiaomi 13T", "Xiaomi Redmi Note 12", "Poco X5 Pro", "Honor 90", "Realme 11 Pro"
    ],
    "Ноутбуки_и_ПК": [
        "MacBook Air M1", "MacBook Air M2", "MacBook Pro 14", "MacBook Pro 16",
        "Игровой ноутбук ASUS ROG", "Ноутбук MSI Katana", "Ноутбук Lenovo Legion", "Acer Nitro 5",
        "Офисный ПК", "Игровой компьютер", "Моноблок Apple iMac"
    ],
    "Видеонаблюдение_СКУД": [
        "IP-камеры Dahua", "Система видеонаблюдения HiWatch", "AHD камеры видеонаблюдения",
        "СКУД (система контроля доступа)", "Видеодомофоны", "Электромагнитные замки",
        "Сервер для видеонаблюдения"
    ],
    "IT_для_бизнеса": [
        "База 1С Предприятие", "Сервер 1С", "Локальная сеть (ЛВС) в офисе",
        "Роутер MikroTik", "IP-телефония", "Офисные компьютеры"
    ],
    "Бытовая_и_ТВ": [
        "Робот-пылесос Xiaomi Roborock", "Робот-пылесос Dreame", "Моющий пылесос",
        "Кофемашина DeLonghi", "Кофемашина Philips", "Кофемашина Jura",
        "Телевизор LG OLED", "Телевизор Samsung QLED", "Телевизор Xiaomi TV",
        "Игровая приставка PlayStation 5", "Xbox Series X"
    ]
};

const problems = [
    // Физические
    "залит водой (кофе, чаем)", "разбит экран (дисплей)", "не включается", "греется и выключается",
    "быстро садится батарея", "шумит кулер", "не заряжается", "сломан разъем", "отвалилась петля экрана",
    // Софтовые / Сложные
    "синий экран смерти (BSOD)", "тормозит и виснет", "пропали данные (удалены файлы)",
    "заблокирован на iCloud/Google", "короткое замыкание на плате (КЗ)", "требуется BGA пайка чипа",
    // Специфичные B2B / СКУД
    "не записывает архив камер", "нет доступа через интернет к камерам", "не срабатывает магнитный замок",
    "тормозит 1С по сети", "настройка VPN туннеля", "восстановление базы 1С после сбоя",
    // Бытовые
    "робот-пылесос не строит карту (ошибка лидара)", "кофемашина не мелет зерна", "телевизор есть звук нет изображения"
];

const viralTriggers = [
    "почему не стоит чинить это самому (сгорела плата)",
    "как обманывают в других сервисах Кемерово",
    "секрет мастеров: как сэкономить 50% на ремонте",
    "типичная болячка этой модели после года работы",
    "как мы восстановили это за 2 часа (реальный кейс с Дзержинского)",
    "ремонт vs покупка нового: что выгоднее в 2026 году",
    "что делать в первые 10 минут, чтобы спасти технику"
];

const geoTags = [
    "в Кемерово", "в центре Кемерово", "на Дзержинского 2Б", "в Кузбассе"
];

const finalTopics = [];

// Матричное перемножение (Cross-Product)
Object.keys(categories).forEach(category => {
    categories[category].forEach(device => {
        problems.forEach(problem => {
            // Чтобы не плодить откровенный бред (типа "СКУД залит кофе"), 
            // в реальном AI-парсере мы бы добавили фильтры. 
            // Но для широкого охвата ИИ сам вырулит тему в логичное русло.
            geoTags.forEach(geo => {
                viralTriggers.forEach(trigger => {
                    const topic = `${device} ${problem} ${geo}. ${trigger}.`;
                    finalTopics.push(topic);
                });
            });
        });
    });
});

// Перемешиваем огромный массив
for (let i = finalTopics.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [finalTopics[i], finalTopics[j]] = [finalTopics[j], finalTopics[i]];
}

// Сохраняем первые 10000 тем для работы (чтобы не перегрузить память)
const chunkToSave = finalTopics.slice(0, 10000);

const outDir = __dirname + '/../content_factory';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

fs.writeFileSync(outDir + '/massive_topics_database.json', JSON.stringify(chunkToSave, null, 2));

console.log(`
✅ БАЗА ЗНАНИЙ СГЕНЕРИРОВАНА!`);
console.log(`Всего возможных комбинаций: ${finalTopics.length}`);
console.log(`Сохранено в базу: ${chunkToSave.length} тем.`);
console.log(`Файл: content_factory/massive_topics_database.json`);