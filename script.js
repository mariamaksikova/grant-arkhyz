// Определение базового URL для API
function getApiBaseUrl() {
    // Если открыто через localhost, используем относительный путь
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
        return '';
    }
    // Если открыто через file://, используем localhost
    return 'http://localhost:3000';
}

// Проверка доступности сервера при загрузке
async function checkServerAvailability() {
    const baseUrl = getApiBaseUrl();
    try {
        const response = await fetch(baseUrl + '/api/bookings', { method: 'GET' });
        if (response.ok) {
            console.log('✓ Сервер доступен');
            return true;
        }
    } catch (error) {
        console.warn('⚠ Сервер недоступен. Убедитесь, что backend запущен: npm start');
        return false;
    }
    return false;
}

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    console.log('✓ DOM загружен, инициализация...');
    
    // Проверка сервера (не блокируем выполнение)
    checkServerAvailability().catch(err => {
        console.warn('Проверка сервера не удалась:', err);
    });
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
        });

        // Close menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!navMenu.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
                navMenu.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
            }
        });
    }

    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href !== '') {
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    e.preventDefault();
                    const navbarHeight = 100;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Scroll to top functionality
    const scrollTopLinks = document.querySelectorAll('.scroll-top');
    scrollTopLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    });

    // Notification Toast Function
    function showNotification(message, type = 'success') {
        const toast = document.getElementById('notificationToast');
        const toastMessage = toast.querySelector('.toast-message');
        const toastIcon = toast.querySelector('.toast-icon');
        
        if (toast && toastMessage) {
            toastMessage.textContent = message;
            
            if (type === 'error') {
                toastIcon.textContent = '✕';
                toast.style.borderColor = '#d32f2f';
                toastIcon.style.background = '#d32f2f';
            } else {
                toastIcon.textContent = '✓';
                toast.style.borderColor = '#C9A55C';
                toastIcon.style.background = '#C9A55C';
            }
            
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 4000);
        }
    }


    // Валидация телефона
    function validatePhone(phone) {
        // Убираем все пробелы, скобки, дефисы
        const cleaned = phone.replace(/[\s\-\(\)]/g, '');
        // Проверяем формат: +7XXXXXXXXXX или 8XXXXXXXXXX или 7XXXXXXXXXX
        const phoneRegex = /^(\+?7|8)?[\d]{10}$/;
        return phoneRegex.test(cleaned);
    }

    // Валидация email
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Валидация имени (минимум 2 символа, только буквы и пробелы)
    function validateName(name) {
        const nameRegex = /^[а-яА-ЯёЁa-zA-Z\s]{2,}$/;
        return nameRegex.test(name.trim());
    }

    // Форматирование телефона для отображения
    function formatPhone(phone) {
        const cleaned = phone.replace(/[\s\-\(\)]/g, '');
        if (cleaned.startsWith('8')) {
            return '+7' + cleaned.substring(1);
        } else if (cleaned.startsWith('7')) {
            return '+' + cleaned;
        } else if (!cleaned.startsWith('+')) {
            return '+7' + cleaned;
        }
        return cleaned;
    }

    // Function to send form data to server
    async function sendFormData(formData, endpoint = '/api/submit-form') {
        const baseUrl = getApiBaseUrl();
        const fullUrl = baseUrl + endpoint;
        
        console.log('Отправка данных формы:', formData);
        console.log('Endpoint:', fullUrl);
        
        try {
            const response = await fetch(fullUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            console.log('Статус ответа:', response.status);
            console.log('OK:', response.ok);
            
            let result;
            const contentType = response.headers.get('content-type');
            console.log('Content-Type:', contentType);
            
            if (contentType && contentType.includes('application/json')) {
                try {
                    result = await response.json();
                    console.log('Результат от сервера:', result);
                } catch (jsonError) {
                    console.error('Ошибка парсинга JSON:', jsonError);
                    const text = await response.text();
                    console.error('Ответ сервера (текст):', text);
                    throw new Error(`Ошибка парсинга ответа сервера: ${jsonError.message}`);
                }
            } else {
                const text = await response.text();
                console.error('Ответ сервера не JSON:', text);
                throw new Error(`Сервер вернул не JSON ответ: ${text.substring(0, 100)}`);
            }
            
            if (!response.ok) {
                console.error('✗ HTTP ошибка:', response.status, result);
                return { success: false, error: result.error || `Ошибка сервера: ${response.status} ${response.statusText}` };
            }
            
            if (result.success) {
                console.log('✓ Данные успешно отправлены, ID:', result.id);
                return { success: true, id: result.id };
            } else {
                console.error('✗ Ошибка сервера:', result.error);
                return { success: false, error: result.error || 'Ошибка отправки данных' };
            }
        } catch (error) {
            console.error('✗ Ошибка отправки данных:', error);
            console.error('Детали ошибки:', error.message);
            
            // Проверяем, доступен ли сервер
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                return { 
                    success: false, 
                    error: 'Сервер недоступен. Убедитесь, что backend запущен: npm start в папке проекта' 
                };
            }
            
            return { success: false, error: 'Ошибка соединения: ' + error.message };
        }
    }

    // Review Form Handling
    console.log('Инициализация формы отзывов...');
    const reviewForm = document.getElementById('reviewForm');
    
    console.log('Форма отзывов найдена:', !!reviewForm);
    
    if (!reviewForm) {
        console.error('✗ Форма отзывов не найдена на странице!');
    } else {
        console.log('✓ Форма отзывов найдена, установка обработчика...');
        reviewForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('✓ Отправка формы отзыва...');
            
            const nameEl = document.getElementById('reviewName');
            const emailEl = document.getElementById('reviewEmail');
            const textEl = document.getElementById('reviewText');
            
            console.log('Элементы формы:', {
                name: !!nameEl,
                email: !!emailEl,
                text: !!textEl
            });
            
            if (!nameEl || !emailEl || !textEl) {
                console.error('✗ Не все элементы формы найдены!');
                showNotification('Ошибка: не все поля формы найдены', 'error');
                return;
            }
            
            const name = nameEl.value.trim();
            const email = emailEl.value.trim();
            const text = textEl.value.trim();
            
            console.log('Данные формы отзыва:', { name, email, textLength: text.length });

            // Валидация
            let errors = [];
            
            if (!name) {
                errors.push('Имя обязательно для заполнения');
            } else if (!validateName(name)) {
                errors.push('Имя должно содержать минимум 2 символа и только буквы');
            }
            
            if (!email) {
                errors.push('Email обязателен для заполнения');
            } else if (!validateEmail(email)) {
                errors.push('Введите корректный email адрес');
            }
            
            if (!text) {
                errors.push('Текст отзыва обязателен для заполнения');
            } else if (text.length < 10) {
                errors.push('Текст отзыва должен содержать минимум 10 символов');
            }

            if (errors.length > 0) {
                showNotification(errors.join('. '), 'error');
                return;
            }

            const formData = {
                type: 'review',
                name: name,
                email: email,
                text: text,
                timestamp: new Date().toISOString()
            };
            
            // Send to server
            const result = await sendFormData(formData);
            
            if (result.success) {
                showNotification('Спасибо за ваш отзыв! Он будет опубликован после модерации.');
                reviewForm.reset();
            } else {
                showNotification(result.error || 'Произошла ошибка. Попробуйте позже.', 'error');
            }
        });
        console.log('✓ Обработчик формы отзывов установлен');
    }

    // Sales Booking Form Handling
    const salesBookingForm = document.getElementById('salesBookingForm');
    if (salesBookingForm) {
        salesBookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('bookingName').value;
            const phone = document.getElementById('bookingPhone').value;
            const email = document.getElementById('bookingEmail').value;
            const guests = document.getElementById('bookingGuests').value;
            const checkIn = document.getElementById('bookingCheckIn').value;
            const checkOut = document.getElementById('bookingCheckOut').value;
            const offer = document.getElementById('bookingOffer').value;
            const message = document.getElementById('bookingMessage').value;

            if (name && phone && email && guests && checkIn && checkOut) {
                // Here you would typically send the data to a server
                alert('Спасибо за вашу заявку! Мы свяжемся с вами в течение 24 часов.');
                salesBookingForm.reset();
            } else {
                alert('Пожалуйста, заполните все обязательные поля.');
            }
        });

        // Set minimum date for date inputs (today)
        const today = new Date().toISOString().split('T')[0];
        const checkInInput = document.getElementById('bookingCheckIn');
        const checkOutInput = document.getElementById('bookingCheckOut');
        
        if (checkInInput) {
            checkInInput.setAttribute('min', today);
        }
        
        if (checkOutInput) {
            checkOutInput.setAttribute('min', today);
            // Update checkout min date when checkin changes
            if (checkInInput) {
                checkInInput.addEventListener('change', function() {
                    if (this.value) {
                        const checkInDate = new Date(this.value);
                        checkInDate.setDate(checkInDate.getDate() + 1);
                        checkOutInput.setAttribute('min', checkInDate.toISOString().split('T')[0]);
                    }
                });
            }
        }
    }

    // Add animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe cards and sections for animation
    const animateElements = document.querySelectorAll('.card, .house-card, .offer-card, .review-card, .included-item');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Booking Modal Handling
    console.log('Инициализация модального окна бронирования...');
    const bookingModal = document.getElementById('bookingModal');
    const bookingBtns = document.querySelectorAll('.booking-btn');
    const modalClose = document.querySelector('.modal-close');
    const bookingForm = document.getElementById('bookingForm');
    const bookingTypeSpan = document.getElementById('bookingType');

    console.log('Элементы найдены:', {
        modal: !!bookingModal,
        buttons: bookingBtns.length,
        close: !!modalClose,
        form: !!bookingForm,
        typeSpan: !!bookingTypeSpan
    });

    // Open modal when booking button is clicked
    if (bookingBtns && bookingBtns.length > 0) {
        bookingBtns.forEach((btn, index) => {
            console.log(`Установка обработчика для кнопки ${index + 1}`);
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const bookingType = this.getAttribute('data-type');
                console.log('Кнопка бронирования нажата, тип:', bookingType);
                console.log('Модальное окно:', bookingModal);
                console.log('Type span:', bookingTypeSpan);
                
                if (bookingTypeSpan) {
                    bookingTypeSpan.textContent = bookingType;
                } else {
                    console.error('bookingTypeSpan не найден!');
                }
                
                if (bookingModal) {
                    console.log('Открытие модального окна...');
                    // Убеждаемся, что модальное окно видно
                    bookingModal.style.display = 'block';
                    bookingModal.style.visibility = 'visible';
                    bookingModal.style.opacity = '1';
                    bookingModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    console.log('Модальное окно открыто, display:', bookingModal.style.display);
                    
                    // Проверка через небольшую задержку
                    setTimeout(() => {
                        const computedStyle = window.getComputedStyle(bookingModal);
                        const rect = bookingModal.getBoundingClientRect();
                        console.log('Позиция модального окна:', {
                            display: computedStyle.display,
                            visibility: computedStyle.visibility,
                            opacity: computedStyle.opacity,
                            zIndex: computedStyle.zIndex,
                            width: rect.width,
                            height: rect.height,
                            top: rect.top,
                            left: rect.left
                        });
                        
                        if (computedStyle.display === 'none') {
                            console.error('⚠ Модальное окно все еще скрыто! Принудительно показываем...');
                            bookingModal.setAttribute('style', 'display: block !important;');
                        }
                    }, 100);
                } else {
                    console.error('✗ Модальное окно не найдено! Проверьте, что элемент с id="bookingModal" существует в HTML.');
                }
            });
        });
        console.log('✓ Обработчики кнопок бронирования установлены:', bookingBtns.length);
    } else {
        console.error('✗ Кнопки бронирования не найдены! Количество:', bookingBtns ? bookingBtns.length : 0);
    }

    // Close modal when X is clicked
    if (modalClose) {
        modalClose.addEventListener('click', function() {
            if (bookingModal) {
                bookingModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }

    // Close modal when clicking outside
    if (bookingModal) {
        window.addEventListener('click', function(event) {
            if (event.target === bookingModal) {
                bookingModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }

    // Booking form submission
    console.log('Инициализация формы бронирования, форма найдена:', !!bookingForm);
    
    if (bookingForm) {
        bookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Отправка формы бронирования...');
            
            const name = document.getElementById('bookingName').value.trim();
            const phone = document.getElementById('bookingPhone').value.trim();
            const email = document.getElementById('bookingEmail').value.trim();
            const checkIn = document.getElementById('bookingCheckIn').value;
            const checkOut = document.getElementById('bookingCheckOut').value;
            const message = document.getElementById('bookingMessage').value.trim();
            const bathhouse = document.getElementById('bookingBathhouse').checked;
            const type = bookingTypeSpan ? bookingTypeSpan.textContent : '';
            
            console.log('Данные формы бронирования:', { name, phone, email, checkIn, checkOut, type });

            // Валидация
            let errors = [];
            
            if (!name) {
                errors.push('Имя обязательно для заполнения');
            } else if (!validateName(name)) {
                errors.push('Имя должно содержать минимум 2 символа и только буквы');
            }
            
            if (!phone) {
                errors.push('Телефон обязателен для заполнения');
            } else if (!validatePhone(phone)) {
                errors.push('Введите корректный номер телефона (например: +7 999 123-45-67 или 8 999 123-45-67)');
            }
            
            if (!email) {
                errors.push('Email обязателен для заполнения');
            } else if (!validateEmail(email)) {
                errors.push('Введите корректный email адрес');
            }
            
            if (!checkIn) {
                errors.push('Дата заезда обязательна для заполнения');
            }
            
            if (!checkOut) {
                errors.push('Дата выезда обязательна для заполнения');
            }
            
            if (checkIn && checkOut) {
                const checkInDate = new Date(checkIn);
                const checkOutDate = new Date(checkOut);
                if (checkOutDate <= checkInDate) {
                    errors.push('Дата выезда должна быть позже даты заезда');
                }
            }

            if (errors.length > 0) {
                showNotification(errors.join('. '), 'error');
                return;
            }

            // Форматируем телефон
            const formattedPhone = formatPhone(phone);
            
            let bookingDetails = type;
            if (bathhouse) {
                bookingDetails += ' + баня';
            }
            
            const formData = {
                type: 'booking',
                bookingType: type,
                name: name,
                phone: formattedPhone,
                email: email,
                checkIn: checkIn,
                checkOut: checkOut,
                bathhouse: bathhouse,
                message: message,
                timestamp: new Date().toISOString()
            };
            
            // Send to server
            const result = await sendFormData(formData);
            
            if (result.success) {
                showNotification('Спасибо за вашу заявку на бронирование ' + bookingDetails + '! Мы свяжемся с вами в ближайшее время.');
                bookingForm.reset();
                if (bookingModal) {
                    bookingModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            } else {
                showNotification(result.error || 'Произошла ошибка. Попробуйте позже.', 'error');
            }
        });

        // Set minimum date for date inputs (today)
        const today = new Date().toISOString().split('T')[0];
        const checkInInput = document.getElementById('bookingCheckIn');
        const checkOutInput = document.getElementById('bookingCheckOut');
        
        if (checkInInput) {
            checkInInput.setAttribute('min', today);
        }
        
        if (checkOutInput) {
            checkOutInput.setAttribute('min', today);
            // Update checkout min date when checkin changes
            if (checkInInput) {
                checkInInput.addEventListener('change', function() {
                    if (this.value) {
                        const checkInDate = new Date(this.value);
                        checkInDate.setDate(checkInDate.getDate() + 1);
                        checkOutInput.setAttribute('min', checkInDate.toISOString().split('T')[0]);
                    }
                });
            }
        }
    }
});




