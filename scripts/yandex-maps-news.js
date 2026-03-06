/**
 * Интеграция с Яндекс.Бизнес API (Опубликовать новость в карточке)
 * Документация: https://yandex.ru/dev/sprav/doc/ru/concepts/publish-news
 * 
 * Внимание: Для работы с API Яндекс.Бизнеса (Справочника) требуется 
 * OAuth-токен с правами управления организацией.
 */

const axios = require('axios');
require('dotenv').config(); // Загружаем переменные из .env

const YANDEX_TOKEN = process.env.YANDEX_API_TOKEN;
const ORG_ID = process.env.YANDEX_ORG_ID || '1071276806';

async function publishNewsToYandex(title, text, imageUrl) {
    if (!YANDEX_TOKEN) {
        console.error("ОШИБКА: YANDEX_API_TOKEN не найден в .env");
        return;
    }

    const url = `https://api.directory.yandex.net/v1/businesses/${ORG_ID}/news/`;

    // Формируем тело новости согласно API Яндекса
    const payload = {
        text: `${title}

${text}

Подробнее читайте на нашем сайте: https://admin-ko.ru`,
    };

    // Если есть картинка, Яндекс требует передавать ее URL или загружать отдельно.
    // Упрощенный вариант с текстом.
    
    try {
        console.log(`📤 Отправка новости в карточку Яндекса (ORG: ${ORG_ID})...`);
        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `OAuth ${YANDEX_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("✅ Новость успешно опубликована в Яндекс.Картах!");
        console.log("ID новости:", response.data.id);
    } catch (error) {
        console.error("❌ Ошибка при публикации в Яндекс:");
        if (error.response) {
            console.error(error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

// Пример использования (вызывается из content-orchestrator.js):
/*
const sampleTitle = "Как мы спасли базу 1С кемеровской фирмы за 2 часа";
const sampleText = "Очередной успешный кейс с улицы Дзержинского! Сгорел сервер, но мы успели вытащить данные...";
publishNewsToYandex(sampleTitle, sampleText);
*/

module.exports = { publishNewsToYandex };
