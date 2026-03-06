const fs = require('fs');

// Обычные устройства
const devices = [
    "iPhone 11", "iPhone 12", "iPhone 13", "iPhone 14", "iPhone 15", "iPhone 16",
    "MacBook Air M1", "MacBook Air M2", "MacBook Pro M3",
    "Samsung Galaxy S23", "Samsung Galaxy S24", "Samsung A54",
    "Xiaomi 13 Ultra", "Redmi Note 13", "Poco F5",
    "Sony PlayStation 5", "Xbox Series X", "Nintendo Switch OLED",
    "Робот-пылесос Roborock S8", "Робот-пылесос Dreame X30",
    "Кофемашина Jura E8", "Кофемашина DeLonghi PrimaDonna",
    "Телевизор LG C3 OLED", "Телевизор Samsung QN90",
    "Ноутбук ASUS ROG Zephyrus", "Ноутбук MSI Raider", "Ноутбук Lenovo Legion"
];

// Виральные углы ( angles )
const viralAngles = [
    "как сэкономить на ремонте в Кемерово",
    "шокирующая правда о запчастях",
    "почему это ломается сразу после гарантии",
    "секретная настройка для ускорения",
    "что делать если залит водой (инструкция)",
    "почему не стоит чинить это самому",
    "как отличить оригинал от подделки",
    "типичная болячка модели: как избежать",
    "реальный кейс спасения на Дзержинского",
    "лучшие аксессуары для этой модели в 2026 году"
];

const topics = [];

// Генерируем матрицу
for (let d of devices) {
    for (let a of viralAngles) {
        topics.push(`${d}: ${a}. Экспертный разбор от Админ.Ко (Кемерово).`);
    }
}

// Добавляем B2B темы
const b2bTopics = [
    "Видеонаблюдение для магазина в Кемерово: как ловить воров",
    "Настройка серверов 1С: чтобы ничего не тормозило",
    "Монтаж ЛВС в офисе: от проекта до запуска за 3 дня",
    "Обслуживание компьютеров для юрлиц: почему аутсорс дешевле штатного админа"
];

const finalPool = [...topics, ...b2bTopics];

// Перемешиваем
for (let i = finalPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [finalPool[i], finalPool[j]] = [finalPool[j], finalPool[i]];
}

fs.writeFileSync(__dirname + '/topics.json', JSON.stringify(finalPool, null, 2));
console.log(`✅ База тем расширена до: ${finalPool.length}`);
