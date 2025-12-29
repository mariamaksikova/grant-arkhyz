# Backend API для форм

Backend сервер для сохранения данных форм в базу данных SQLite.

## Установка

1. Установите Node.js (версия 14 или выше)
2. Установите зависимости:
```bash
npm install
```

## Запуск

### Режим разработки (с автоперезагрузкой):
```bash
npm run dev
```

### Продакшн режим:
```bash
npm start
```

Сервер запустится на `http://localhost:3000`

## ⚠️ ВАЖНО: Как открывать сайт

**НЕ открывайте файлы напрямую через file://**

Вместо этого:
1. Запустите сервер: `npm start`
2. Откройте в браузере: `http://localhost:3000` или `http://localhost:3000/index.html`

Если вы откроете файлы напрямую (file://), формы не будут работать из-за CORS ограничений!

## Проверка работы

После запуска сервера вы должны увидеть в терминале:
```
==================================================
✓ Сервер запущен на http://localhost:3000
✓ База данных: /path/to/database.db
✓ Статические файлы: /path/to/project
==================================================

Ожидание запросов...
```

При отправке формы в терминале появятся логи:
```
Получен запрос на /api/submit-form
Тип формы: booking
Данные: {...}
✓ Бронирование сохранено с ID: 1
```

## Структура базы данных

База данных SQLite создается автоматически в файле `database.db` при первом запуске.

### Таблицы:

1. **bookings** - бронирования номеров/домиков
   - id, type, booking_type, name, phone, email, check_in, check_out, bathhouse, message, timestamp, created_at

2. **reviews** - отзывы гостей
   - id, name, email, text, timestamp, created_at

3. **investments** - заявки на инвестиции
   - id, name, phone, timestamp, created_at

## API Endpoints

### POST /api/submit-form
Отправка данных формы (бронирование, отзыв, инвестиция)

### GET /api/bookings
Получение всех бронирований (для админки)

### GET /api/reviews
Получение всех отзывов

### GET /api/investments
Получение всех заявок на инвестиции

## Формат запроса

Все формы отправляют POST запросы на `/api/submit-form` с JSON телом:

### Форма бронирования
```json
{
  "type": "booking",
  "bookingType": "одноместный номер",
  "name": "Имя",
  "phone": "+7 XXX XXX-XX-XX",
  "email": "email@example.com",
  "checkIn": "2025-01-15",
  "checkOut": "2025-01-20",
  "bathhouse": true,
  "message": "Дополнительная информация",
  "timestamp": "2025-01-10T12:00:00.000Z"
}
```

### Форма отзывов
```json
{
  "type": "review",
  "name": "Имя",
  "email": "email@example.com",
  "text": "Текст отзыва",
  "timestamp": "2025-01-10T12:00:00.000Z"
}
```

### Форма инвестиций (start-sales.html)
```json
{
  "type": "investment",
  "name": "Имя",
  "phone": "+7 XXX XXX-XX-XX",
  "timestamp": "2025-01-10T12:00:00.000Z"
}
```

## Пример реализации (Node.js/Express)

```javascript
app.post('/api/submit-form', async (req, res) => {
  try {
    const formData = req.body;
    
    // Сохранение в базу данных или отправка на email
    // Например, через nodemailer или сохранение в MongoDB
    
    console.log('Form submitted:', formData);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing form:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
```

## Альтернативные решения

1. **Email отправка** - использовать сервисы типа SendGrid, Mailgun
2. **Google Forms** - интегрировать через Google Apps Script
3. **Telegram Bot** - отправлять уведомления в Telegram
4. **Webhook** - использовать сервисы типа Zapier, Make.com

