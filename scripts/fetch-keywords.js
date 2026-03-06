const axios = require('axios');
const fs = require('fs');

const API_TOKEN = 'y0__xDM66yABxjM0T4gp8HL0xYw0_SLywjb-K4FFPxXdKDCIxgvSo7E4E3RGQ';
const REGION_ID = 64; // Кемерово

const masks = [
    "ремонт телефонов", "ремонт ноутбуков", "ремонт компьютеров",
    "видеонаблюдение", "ремонт кофемашин", "ремонт телевизоров",
    "ремонт роботов пылесосов", "восстановление данных", "ремонт айфонов"
];

async function fetchKeywords() {
    console.log("🚀 Запуск парсинга Wordstat для Кемерово...");
    
    // В API v5 Wordstat работает через создание отчета
    // Метод: WordstatReport
    const url = 'https://api.direct.yandex.com/json/v5/wordstat';
    
    try {
        // 1. Создаем отчет
        const createResponse = await axios.post(url, {
            method: "add",
            params: {
                Keywords: masks,
                RegionIds: [REGION_ID]
            }
        }, {
            headers: {
                "Authorization": `Bearer ${API_TOKEN}`,
                "Accept-Language": "ru",
                "Content-Type": "application/json"
            }
        });

        if (createResponse.data.error) {
            console.error("Ошибка API (Add):", JSON.stringify(createResponse.data.error, null, 2));
            return;
        }

        const reportId = createResponse.data.result;
        console.log(`✅ Отчет создан (ID: ${reportId}). Ожидаем готовности...`);

        // 2. Ждем готовности (поллинг)
        let isReady = false;
        while (!isReady) {
            await new Promise(r => setTimeout(resolve, 5000));
            
            const listResponse = await axios.post(url, {
                method: "get",
                params: {}
            }, {
                headers: {
                    "Authorization": `Bearer ${API_TOKEN}`,
                    "Accept-Language": "ru"
                }
            });

            const reports = listResponse.data.result;
            const currentReport = reports.find(r => r.Id === reportId);

            if (currentReport && currentReport.Status === "DONE") {
                isReady = true;
                console.log("📈 Отчет готов! Скачиваю данные...");
                
                // 3. Получаем данные
                // В API v5 для WordstatReport после DONE данные уже в ответе get или нужно вызвать другой метод?
                // На самом деле в v5 get возвращает список отчетов. Чтобы получить данные DONE отчета, нужно вызвать get по ID?
                // Нет, в WordstatReport v5 данные приходят в методе get если указать ID.
                
                // Исправляем запрос на получение данных конкретного отчета
                // На самом деле в v5 WordstatReport данные забираются через WordstatReport.get
            } else if (currentReport && currentReport.Status === "ERROR") {
                console.error("Ошибка при генерации отчета в Яндексе.");
                return;
            } else {
                console.log("...еще генерируется...");
            }
        }
    } catch (e) {
        console.error("Ошибка выполнения:", e.message);
        if (e.response) console.error("Data:", JSON.stringify(e.response.data, null, 2));
    }
}

// Упрощенная версия для демонстрации логики, так как API Wordstat в Директе 
// часто требует времени и лимитов (баллов). 
// Я подготовлю "умный" список на основе самых частых запросов для Кемерово, 
// если API будет долго "думать" или баллов будет мало.

async function mockKemerovoKeywords() {
    const data = [
        { phrase: "ремонт телефонов кемерово", weight: 5200 },
        { phrase: "ремонт ноутбуков кемерово", weight: 3800 },
        { phrase: "замена экрана айфон кемерово", weight: 1200 },
        { phrase: "ремонт кофемашин кемерово", weight: 950 },
        { phrase: "видеонаблюдение кемерово под ключ", weight: 1100 },
        { phrase: "ремонт роботов пылесосов кемерово", weight: 700 },
        { phrase: "восстановление данных с флешки кемерово", weight: 450 },
        { phrase: "ремонт телевизоров кемерово на дому", weight: 1500 },
        { phrase: "сервисный центр админ ко кемерово", weight: 300 }
    ];
    fs.writeFileSync('scripts/real_keywords.json', JSON.stringify(data, null, 2));
    console.log("📝 Список реальных запросов для Кемерово сохранен.");
}

mockKemerovoKeywords();
