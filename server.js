const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

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

// Инициализация базы данных PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Проверка подключения к базе данных
pool.on('connect', () => {
    console.log('✓ Подключено к базе данных PostgreSQL');
    console.log('✓ Режим:', process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT');
    initDatabase();
});

pool.on('error', (err) => {
    console.error('❌ Ошибка подключения к базе данных:', err.message);
    console.error('❌ DATABASE_URL:', process.env.DATABASE_URL ? 'установлен' : 'не установлен');
});

// Создание таблиц
async function initDatabase() {
    try {
        // Таблица для бронирований
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id SERIAL PRIMARY KEY,
                type VARCHAR(50) NOT NULL,
                booking_type VARCHAR(50),
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(50) NOT NULL,
                email VARCHAR(255) NOT NULL,
                check_in VARCHAR(50),
                check_out VARCHAR(50),
                bathhouse INTEGER DEFAULT 0,
                message TEXT,
                timestamp VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Таблица bookings готова');

        // Таблица для отзывов
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                text TEXT NOT NULL,
                timestamp VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Таблица reviews готова');

        // Таблица для инвестиций
        await pool.query(`
            CREATE TABLE IF NOT EXISTS investments (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(50) NOT NULL,
                timestamp VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Таблица investments готова');
    } catch (err) {
        console.error('❌ Ошибка создания таблиц:', err.message);
    }
}

// API endpoint для отправки форм
app.post('/api/submit-form', async (req, res) => {
    const formData = req.body;
    const { type } = formData;

    console.log('Получен запрос на /api/submit-form');
    console.log('Тип формы:', type);
    console.log('Данные:', JSON.stringify(formData, null, 2));

    try {
        if (type === 'booking') {
            // Сохранение бронирования
            const { bookingType, name, phone, email, checkIn, checkOut, bathhouse, message, timestamp } = formData;
            
            const result = await pool.query(
                `INSERT INTO bookings (type, booking_type, name, phone, email, check_in, check_out, bathhouse, message, timestamp)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 RETURNING id`,
                [type, bookingType, name, phone, email, checkIn, checkOut, bathhouse ? 1 : 0, message || '', timestamp]
            );
            
            console.log(`✓ Бронирование сохранено с ID: ${result.rows[0].id}`);
            res.json({ success: true, id: result.rows[0].id });
        } else if (type === 'review') {
            // Сохранение отзыва
            const { name, email, text, timestamp } = formData;
            
            const result = await pool.query(
                `INSERT INTO reviews (name, email, text, timestamp)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id`,
                [name, email, text, timestamp]
            );
            
            console.log(`✓ Отзыв сохранен с ID: ${result.rows[0].id}`);
            res.json({ success: true, id: result.rows[0].id });
        } else if (type === 'investment') {
            // Сохранение заявки на инвестиции
            const { name, phone, timestamp } = formData;
            
            const result = await pool.query(
                `INSERT INTO investments (name, phone, timestamp)
                 VALUES ($1, $2, $3)
                 RETURNING id`,
                [name, phone, timestamp]
            );
            
            console.log(`✓ Заявка на инвестиции сохранена с ID: ${result.rows[0].id}`);
            res.json({ success: true, id: result.rows[0].id });
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
app.get('/api/bookings', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Ошибка получения бронирований:', err.message);
        res.status(500).json({ success: false, error: 'Ошибка получения данных' });
    }
});

// API endpoint для получения всех отзывов
app.get('/api/reviews', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM reviews ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Ошибка получения отзывов:', err.message);
        res.status(500).json({ success: false, error: 'Ошибка получения данных' });
    }
});

// API endpoint для получения всех заявок на инвестиции
app.get('/api/investments', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM investments ORDER BY created_at DESC');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Ошибка получения заявок на инвестиции:', err.message);
        res.status(500).json({ success: false, error: 'Ошибка получения данных' });
    }
});

// API endpoint для удаления записи
app.delete('/api/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    let tableName;
    
    if (type === 'bookings') tableName = 'bookings';
    else if (type === 'reviews') tableName = 'reviews';
    else if (type === 'investments') tableName = 'investments';
    else {
        return res.status(400).json({ success: false, error: 'Неизвестный тип' });
    }
    
    try {
        const result = await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Запись не найдена' });
        }
        console.log(`✓ ${type} удален с ID: ${id}`);
        res.json({ success: true, message: 'Запись удалена' });
    } catch (err) {
        console.error(`Ошибка удаления ${type}:`, err.message);
        res.status(500).json({ success: false, error: 'Ошибка удаления данных' });
    }
});

// API endpoint для обновления записи
app.put('/api/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    const data = req.body;
    
    try {
        if (type === 'bookings') {
            const result = await pool.query(
                `UPDATE bookings SET 
                    booking_type = $1, name = $2, phone = $3, email = $4, 
                    check_in = $5, check_out = $6, bathhouse = $7, message = $8
                WHERE id = $9`,
                [data.booking_type, data.name, data.phone, data.email, 
                 data.check_in, data.check_out, data.bathhouse ? 1 : 0, data.message || '', id]
            );
            
            if (result.rowCount === 0) {
                return res.status(404).json({ success: false, error: 'Запись не найдена' });
            }
            
            console.log(`✓ Бронирование обновлено с ID: ${id}`);
            res.json({ success: true, message: 'Запись обновлена' });
        } else if (type === 'reviews') {
            const result = await pool.query(
                `UPDATE reviews SET name = $1, email = $2, text = $3 WHERE id = $4`,
                [data.name, data.email, data.text, id]
            );
            
            if (result.rowCount === 0) {
                return res.status(404).json({ success: false, error: 'Запись не найдена' });
            }
            
            console.log(`✓ Отзыв обновлен с ID: ${id}`);
            res.json({ success: true, message: 'Запись обновлена' });
        } else if (type === 'investments') {
            const result = await pool.query(
                `UPDATE investments SET name = $1, phone = $2 WHERE id = $3`,
                [data.name, data.phone, id]
            );
            
            if (result.rowCount === 0) {
                return res.status(404).json({ success: false, error: 'Запись не найдена' });
            }
            
            console.log(`✓ Заявка на инвестиции обновлена с ID: ${id}`);
            res.json({ success: true, message: 'Запись обновлена' });
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
    console.log(`✓ База данных: PostgreSQL`);
    console.log(`✓ DATABASE_URL: ${process.env.DATABASE_URL ? '✓ установлен' : '✗ НЕ УСТАНОВЛЕН!'}`);
    if (process.env.NODE_ENV === 'production') {
        console.log(`✓ Режим: Production`);
        console.log(`✓ Админка защищена (username: ${ADMIN_USERNAME})`);
    } else {
        console.log(`✓ Режим: Development`);
    }
    console.log('='.repeat(50));
    console.log('\n✓ Ожидание запросов...\n');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nЗакрытие соединений...');
    await pool.end();
    console.log('База данных закрыта');
    process.exit(0);
});
