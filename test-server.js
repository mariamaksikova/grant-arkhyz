// Простой тест для проверки работы сервера
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
        process.exit(1);
    } else {
        console.log('✓ Подключено к базе данных SQLite');
        testDatabase();
    }
});

function testDatabase() {
    // Проверка таблиц
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
        if (err) {
            console.error('Ошибка проверки таблиц:', err.message);
            process.exit(1);
        }
        
        console.log('\nТаблицы в базе данных:');
        rows.forEach(row => {
            console.log('  -', row.name);
        });
        
        // Проверка данных
        console.log('\nПроверка данных:');
        
        db.get("SELECT COUNT(*) as count FROM bookings", [], (err, row) => {
            if (err) {
                console.error('Ошибка проверки bookings:', err.message);
            } else {
                console.log('  Бронирования:', row.count);
            }
        });
        
        db.get("SELECT COUNT(*) as count FROM reviews", [], (err, row) => {
            if (err) {
                console.error('Ошибка проверки reviews:', err.message);
            } else {
                console.log('  Отзывы:', row.count);
            }
        });
        
        db.get("SELECT COUNT(*) as count FROM investments", [], (err, row) => {
            if (err) {
                console.error('Ошибка проверки investments:', err.message);
            } else {
                console.log('  Инвестиции:', row.count);
            }
            
            // Показать последние записи
            console.log('\nПоследние 5 бронирований:');
            db.all("SELECT id, name, phone, booking_type, created_at FROM bookings ORDER BY created_at DESC LIMIT 5", [], (err, rows) => {
                if (err) {
                    console.error('Ошибка:', err.message);
                } else {
                    if (rows.length === 0) {
                        console.log('  Нет данных');
                    } else {
                        rows.forEach(row => {
                            console.log(`  ID: ${row.id}, ${row.name}, ${row.phone}, ${row.booking_type || 'N/A'}, ${row.created_at}`);
                        });
                    }
                }
                
                db.close();
                process.exit(0);
            });
        });
    });
}

