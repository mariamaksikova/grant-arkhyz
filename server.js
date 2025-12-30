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

// Главная страница - перенаправление на старт продаж (должно быть ДО express.static)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'start-sales.html'));
});

// Защита админки (базовая аутентификация)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'grant2025';

app.get('/admin.html', (req, res, next) => {
    const auth = req.headers.authorization;
    
    if (!auth) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"');
        return res.status(401).send('Требуется авторизация');
    }
    
    const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
    const username = credentials[0];
    const password = credentials[1];
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        next();
    } else {
        res.setHeader('WWW-Authenticate', 'Basic realm="Admin Panel"');
        return res.status(401).send('Неверные учетные данные');
    }
});

// Ping endpoint для предотвращения засыпания (каждые 5 минут)
app.get('/ping', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Статические файлы
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

// API endpoint для удаления записи
app.delete('/api/:type/:id', (req, res) => {
    const { type, id } = req.params;
    let tableName;
    
    if (type === 'bookings') tableName = 'bookings';
    else if (type === 'reviews') tableName = 'reviews';
    else if (type === 'investments') tableName = 'investments';
    else {
        return res.status(400).json({ success: false, error: 'Неизвестный тип' });
    }
    
    db.run(`DELETE FROM ${tableName} WHERE id = ?`, [id], function(err) {
        if (err) {
            console.error(`Ошибка удаления ${type}:`, err.message);
            return res.status(500).json({ success: false, error: 'Ошибка удаления данных' });
        }
        console.log(`✓ ${type} удален с ID: ${id}`);
        res.json({ success: true, message: 'Запись удалена' });
    });
});

// API endpoint для обновления записи
app.put('/api/:type/:id', (req, res) => {
    const { type, id } = req.params;
    const data = req.body;
    
    try {
        if (type === 'bookings') {
            db.run(
                `UPDATE bookings SET 
                    booking_type = ?, name = ?, phone = ?, email = ?, 
                    check_in = ?, check_out = ?, bathhouse = ?, message = ?
                WHERE id = ?`,
                [data.booking_type, data.name, data.phone, data.email, 
                 data.check_in, data.check_out, data.bathhouse ? 1 : 0, data.message || '', id],
                function(err) {
                    if (err) {
                        console.error('Ошибка обновления бронирования:', err.message);
                        return res.status(500).json({ success: false, error: 'Ошибка обновления данных' });
                    }
                    console.log(`✓ Бронирование обновлено с ID: ${id}`);
                    res.json({ success: true, message: 'Запись обновлена' });
                }
            );
        } else if (type === 'reviews') {
            db.run(
                `UPDATE reviews SET name = ?, email = ?, text = ? WHERE id = ?`,
                [data.name, data.email, data.text, id],
                function(err) {
                    if (err) {
                        console.error('Ошибка обновления отзыва:', err.message);
                        return res.status(500).json({ success: false, error: 'Ошибка обновления данных' });
                    }
                    console.log(`✓ Отзыв обновлен с ID: ${id}`);
                    res.json({ success: true, message: 'Запись обновлена' });
                }
            );
        } else if (type === 'investments') {
            db.run(
                `UPDATE investments SET name = ?, phone = ? WHERE id = ?`,
                [data.name, data.phone, id],
                function(err) {
                    if (err) {
                        console.error('Ошибка обновления заявки на инвестиции:', err.message);
                        return res.status(500).json({ success: false, error: 'Ошибка обновления данных' });
                    }
                    console.log(`✓ Заявка на инвестиции обновлена с ID: ${id}`);
                    res.json({ success: true, message: 'Запись обновлена' });
                }
            );
        } else {
            res.status(400).json({ success: false, error: 'Неизвестный тип' });
        }
    } catch (error) {
        console.error('Ошибка обновления:', error);
        res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
    }
});

// Автоматический ping для предотвращения засыпания (каждые 4 минуты)
if (process.env.NODE_ENV === 'production') {
    const SITE_URL = process.env.SITE_URL || 'https://grantarkhyz.onrender.com';
    const PING_INTERVAL = 4 * 60 * 1000; // 4 минуты
    
    function pingSelf() {
        const https = require('https');
        const url = new URL(SITE_URL);
        
        const options = {
            hostname: url.hostname,
            port: 443,
            path: '/ping',
            method: 'GET',
            timeout: 10000
        };

        const req = https.request(options, (res) => {
            console.log(`[${new Date().toISOString()}] ✓ Keep-alive ping успешен`);
        });

        req.on('error', (err) => {
            console.error(`[${new Date().toISOString()}] ✗ Keep-alive ping ошибка:`, err.message);
        });

        req.on('timeout', () => {
            req.destroy();
        });

        req.end();
    }

    // Первый ping через 1 минуту после запуска
    setTimeout(pingSelf, 60 * 1000);
    
    // Затем каждые 4 минуты
    setInterval(pingSelf, PING_INTERVAL);
    
    console.log(`✓ Keep-alive активен (ping каждые ${PING_INTERVAL / 1000} секунд)`);
}

// Запуск сервера
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`✓ Сервер запущен на http://localhost:${PORT}`);
    console.log(`✓ База данных: ${dbPath}`);
    console.log(`✓ Статические файлы: ${__dirname}`);
    if (process.env.NODE_ENV === 'production') {
        console.log(`✓ Режим: Production`);
        console.log(`✓ Админка защищена (username: ${ADMIN_USERNAME})`);
    }
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

