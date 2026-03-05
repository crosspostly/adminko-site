# Доступ к сайту Adminko

## 🌐 Публичный доступ через nip.io

Сайт доступен по следующим адресам (используется ваш публичный IP):

### HTTP (порт 80):
- http://34-51-195-14.nip.io
- http://www.34-51-195-14.nip.io
- http://adminko.34-51-195-14.nip.io

### Примеры страниц:
- Главная: http://34-51-195-14.nip.io/
- Услуги: http://34-51-195-14.nip.io/services-consumer.html
- Цены: http://34-51-195-14.nip.io/price.html
- О нас: http://34-51-195-14.nip.io/about.html

---

## 🔧 Конфигурация

**Nginx статус:**
```bash
sudo systemctl status nginx
```

**Путь к сайту:**
```
/home/varsmana/adminko_site/site/public
```

**Конфиг nginx:**
```
/etc/nginx/sites-available/adminko
```

**Лог ошибок:**
```
/var/log/nginx/adminko_site.error.log
```

---

## 📝 Примечания

- **nip.io** - бесплатный wildcard DNS сервис
- Любое поддоменное имя с вашим IP будет работать: `anything.34-51-195-14.nip.io`
- Для постоянного HTTPS домена потребуется купить домен и настроить SSL

---

## 🚀 Обновление сайта

```bash
cd /home/varsmana/adminko_site
git pull origin main
```
