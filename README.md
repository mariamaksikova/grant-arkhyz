# 🏔️ Эко-отель Grant Eco-Arkhyz

Сайт эко-отеля Grant Eco-Arkhyz с бэкендом на Node.js/Express и PostgreSQL, админ-панелью для управления заявками.

## ✨ Возможности

- 📝 Формы бронирования номеров и домиков
- 💬 Форма отзывов
- 💰 Форма заявок на инвестиции
- 🔐 Админ-панель с управлением заявками (CRUD операции)
- ✅ Валидация всех форм
- 📱 Адаптивный дизайн

## 🚀 Быстрый старт

### Локальная установка

```bash
# Установка зависимостей
npm install

# Настройка базы данных
# Создайте PostgreSQL базу данных и установите переменную окружения:
# DATABASE_URL=postgresql://user:password@localhost:5432/database

# Запуск сервера
npm start

# Откройте в браузере
# http://localhost:3000
```

### Админ-панель

```
http://localhost:3000/admin.html
```

**Доступ:** Защищена базовой аутентификацией
- **Username:** `admin` (или через переменную окружения `ADMIN_USERNAME`)
- **Password:** `grant2025` (или через переменную окружения `ADMIN_PASSWORD`)

**На продакшене:** Измените пароль через переменные окружения в Render.com:
- `ADMIN_USERNAME` = ваш логин
- `ADMIN_PASSWORD` = ваш пароль

## 📋 Структура проекта

```
grand-eco-arkhyz/
├── index.html          # Главная страница
├── start-sales.html    # Страница старта продаж
├── admin.html          # Админ-панель
├── script.js           # Клиентский JavaScript
├── styles.css          # Стили
├── server.js           # Backend сервер
├── package.json        # Зависимости
└── images/            # Изображения
```

## 🛠️ Технологии

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express
- **База данных:** PostgreSQL
- **Хостинг:** Готов к деплою на Render, Railway, Heroku

## 🔐 Защита админки

Админ-панель защищена базовой HTTP-аутентификацией:
- **По умолчанию:** `admin` / `grant2025`
- **На продакшене:** Настройте через переменные окружения:
  - `ADMIN_USERNAME` - ваш логин
  - `ADMIN_PASSWORD` - ваш пароль

## 🔄 Keep-Alive (предотвращение засыпания)

Сервер автоматически отправляет ping каждые 4 минуты для предотвращения засыпания на бесплатном плане Render.com.

## 🔗 Ссылки

- **GitHub:** https://github.com/mariamaksikova/grant-arkhyz
- **Сайт:** https://grantarkhyz.ru

## 📝 Лицензия

ISC

