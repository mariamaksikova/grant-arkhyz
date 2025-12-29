const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Инициализация базы данных
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
    } else {
        console.log('Подключено к базе данных SQLite');
        initDatabase();
    }
});

// Создание таблиц
function initDatabase() {
    // Таблица для бронирований
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        booking_type TEXT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        check_in TEXT,
        check_out TEXT,
        bathhouse INTEGER DEFAULT 0,
        message TEXT,
        timestamp TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Ошибка создания таблицы bookings:', err.message);
        } else {
            console.log('Таблица bookings готова');
        }
    });

    // Таблица для отзывов
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        text TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Ошибка создания таблицы reviews:', err.message);
        } else {
            console.log('Таблица reviews готова');
        }
    });

    // Таблица для инвестиций
    db.run(`CREATE TABLE IF NOT EXISTS investments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Ошибка создания таблицы investments:', err.message);
        } else {
            console.log('Таблица investments готова');
        }
    });
}

// API endpoint для отправки форм
app.post('/api/submit-form', (req, res) => {
    const formData = req.body;
    const { type } = formData;

    console.log('Получен запрос на /api/submit-form');
    console.log('Тип формы:', type);
    console.log('Данные:', JSON.stringify(formData, null, 2));

    try {
        if (type === 'booking') {
            // Сохранение бронирования
            const { bookingType, name, phone, email, checkIn, checkOut, bathhouse, message, timestamp } = formData;
            
            db.run(
                `INSERT INTO bookings (type, booking_type, name, phone, email, check_in, check_out, bathhouse, message, timestamp)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [type, bookingType, name, phone, email, checkIn, checkOut, bathhouse ? 1 : 0, message || '', timestamp],
                function(err) {
                    if (err) {
                        console.error('Ошибка сохранения бронирования:', err.message);
                        console.error('Детали ошибки:', err);
                        return res.status(500).json({ success: false, error: 'Ошибка сохранения данных: ' + err.message });
                    }
                    console.log(`✓ Бронирование сохранено с ID: ${this.lastID}`);
                    res.json({ success: true, id: this.lastID });
                }
            );
        } else if (type === 'review') {
            // Сохранение отзыва
            const { name, email, text, timestamp } = formData;
            
            db.run(
                `INSERT INTO reviews (name, email, text, timestamp)
                 VALUES (?, ?, ?, ?)`,
                [name, email, text, timestamp],
                function(err) {
                    if (err) {
                        console.error('Ошибка сохранения отзыва:', err.message);
                        console.error('Детали ошибки:', err);
                        return res.status(500).json({ success: false, error: 'Ошибка сохранения данных: ' + err.message });
                    }
                    console.log(`✓ Отзыв сохранен с ID: ${this.lastID}`);
                    res.json({ success: true, id: this.lastID });
                }
            );
        } else if (type === 'investment') {
            // Сохранение заявки на инвестиции
            const { name, phone, timestamp } = formData;
            
            db.run(
                `INSERT INTO investments (name, phone, timestamp)
                 VALUES (?, ?, ?)`,
                [name, phone, timestamp],
                function(err) {
                    if (err) {
                        console.error('Ошибка сохранения заявки на инвестиции:', err.message);
                        console.error('Детали ошибки:', err);
                        return res.status(500).json({ success: false, error: 'Ошибка сохранения данных: ' + err.message });
                    }
                    console.log(`✓ Заявка на инвестиции сохранена с ID: ${this.lastID}`);
                    res.json({ success: true, id: this.lastID });
                }
            );
        } else {
            console.error('✗ Неизвестный тип формы:', type);
            res.status(400).json({ success: false, error: 'Неизвестный тип формы: ' + type });
        }
    } catch (error) {
        console.error('✗ Ошибка обработки запроса:', error);
        console.error('Детали ошибки:', error.stack);
        res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера: ' + error.message });
    }
});

// API endpoint для получения всех бронирований (для админки)
app.get('/api/bookings', (req, res) => {
    db.all('SELECT * FROM bookings ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            console.error('Ошибка получения бронирований:', err.message);
            return res.status(500).json({ success: false, error: 'Ошибка получения данных' });
        }
        res.json({ success: true, data: rows });
    });
});

// API endpoint для получения всех отзывов
app.get('/api/reviews', (req, res) => {
    db.all('SELECT * FROM reviews ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            console.error('Ошибка получения отзывов:', err.message);
            return res.status(500).json({ success: false, error: 'Ошибка получения данных' });
        }
        res.json({ success: true, data: rows });
    });
});

// API endpoint для получения всех заявок на инвестиции
app.get('/api/investments', (req, res) => {
    db.all('SELECT * FROM investments ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            console.error('Ошибка получения заявок на инвестиции:', err.message);
            return res.status(500).json({ success: false, error: 'Ошибка получения данных' });
        }
        res.json({ success: true, data: rows });
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`✓ Сервер запущен на http://localhost:${PORT}`);
    console.log(`✓ База данных: ${dbPath}`);
    console.log(`✓ Статические файлы: ${__dirname}`);
    console.log('='.repeat(50));
    console.log('\nОжидание запросов...\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Ошибка закрытия базы данных:', err.message);
        } else {
            console.log('База данных закрыта');
        }
        process.exit(0);
    });
});

