// Загрузка общих компонентов (header, footer)
document.addEventListener('DOMContentLoaded', function() {
    // === Инициализация Cookie Banner ===
    if (!localStorage.getItem('cookie-accepted')) {
        const banner = document.createElement('div');
        banner.id = 'cookie-banner';
        banner.className = 'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[100] transform transition-all duration-500 translate-y-0';
        banner.innerHTML = `
            <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 text-primary flex items-center justify-center">
                    <span class="material-symbols-outlined">cookie</span>
                </div>
                <div>
                    <h4 class="font-bold text-gray-900 dark:text-white mb-1">Мы используем cookies</h4>
                    <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                        Сайт предназначен для лиц 18+ и использует cookies для улучшения работы. Оставаясь на сайте, вы соглашаетесь с <a href="terms.html" class="text-primary hover:underline">правилами сервиса</a>.
                    </p>
                    <div class="flex gap-3">
                        <button id="accept-cookies" class="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-primary-hover transition-all">Принять</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(banner);

        document.getElementById('accept-cookies').addEventListener('click', () => {
            localStorage.setItem('cookie-accepted', 'true');
            banner.classList.add('opacity-0', 'translate-y-10');
            setTimeout(() => banner.remove(), 500);
        });
    }

    // Загрузка футера
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        fetch('footer.html')
            .then(response => response.text())
            .then(html => {
                footerContainer.innerHTML = html;

                // === Инициализация модального окна мессенджеров ===
                // Глобальные функции
                window.openMessengerModal = function() {
                    const modal = document.getElementById('messenger-modal');
                    if (modal) {
                        modal.classList.remove('hidden');
                        document.body.style.overflow = 'hidden';
                    }
                };

                window.closeMessengerModal = function() {
                    const modal = document.getElementById('messenger-modal');
                    if (modal) {
                        modal.classList.add('hidden');
                        document.body.style.overflow = '';
                        
                        // Сброс состояния формы через небольшую задержку
                        setTimeout(() => {
                            const form = document.getElementById('evaluation-form');
                            const success = document.getElementById('form-success');
                            const titleContainer = document.getElementById('modal-title')?.parentElement;
                            if (form && success) {
                                form.classList.remove('hidden');
                                success.classList.add('hidden');
                                if (titleContainer) titleContainer.classList.remove('hidden');
                            }
                        }, 300);
                    }
                };

                // Обработчик Escape
                document.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape') {
                        closeMessengerModal();
                    }
                });

                // Обработчики кнопок мессенджеров
                const messengerButtons = document.querySelectorAll('[data-messenger]');
                messengerButtons.forEach(btn => {
                    btn.addEventListener('click', function() {
                        handleFormSubmission(this.dataset.messenger);
                    });
                });

                // Обработчик кнопки "Перезвоните мне"
                const callbackBtn = document.querySelector('[data-callback]');
                if (callbackBtn) {
                    callbackBtn.addEventListener('click', function() {
                        handleFormSubmission('callback');
                    });
                }

                async function handleFormSubmission(type) {
                    const form = document.getElementById('evaluation-form');
                    const successContent = document.getElementById('form-success');
                    const modalTitle = document.getElementById('modal-title');
                    
                    if (!form) return;

                    const formData = new FormData(form);
                    const name = formData.get('name')?.trim() || '';
                    const phone = formData.get('phone')?.trim() || '';
                    const cleanPhone = phone.replace(/\D/g, '');
                    
                    // 1. ЛОГИКА ДЛЯ ПРЯМОГО ПЕРЕХОДА В МЕССЕНДЖЕРЫ (БЕЗ ВАЛИДАЦИИ)
                    if (type === 'telegram' || type === 'max') {
                        const masterPhone = '79502767171';
                        let text = '';
                        if (name || phone) {
                            text = encodeURIComponent(
                                `Здравствуйте! Меня зовут ${name || 'Клиент'}.\n` +
                                (phone ? `Мой телефон: ${phone}\n` : '') +
                                `У меня есть вопрос по ремонту техники.\n` +
                                `— Сообщение с сайта admin-ko.ru`
                            );
                        } else {
                            text = encodeURIComponent('Здравствуйте! У меня есть вопрос по ремонту техники.');
                        }
                        
                        let url = (type === 'telegram') 
                            ? `https://t.me/+${masterPhone}?text=${text}`
                            : `https://web.max.ru/200542952?text=${text}`;
                        
                        window.open(url, '_blank');
                        closeMessengerModal();
                        return; // Завершаем выполнение, никакой валидации ниже
                    }

                    // 2. ЛОГИКА ДЛЯ ОБРАТНОГО ЗВОНКА (СТРОГАЯ ВАЛИДАЦИЯ)
                    if (type === 'callback') {
                        const checkPolicy = document.getElementById('check-policy');
                        const checkConsent = document.getElementById('check-consent');
                        
                        if (!checkPolicy?.checked || !checkConsent?.checked) {
                            alert('Для заказа звонка необходимо дать согласие на обработку персональных данных.');
                            return;
                        }

                        if (cleanPhone.length < 10) {
                            alert('Пожалуйста, введите корректный номер телефона, чтобы мы могли вам перезвонить.');
                            return;
                        }

                        const btn = form.querySelector('[data-callback]');
                        const originalText = btn.innerHTML;
                        btn.disabled = true;
                        btn.innerHTML = '<span class="animate-spin material-symbols-outlined text-sm">sync</span> Отправка...';

                        try {
                            const response = await fetch('https://formspree.io/f/xpzeebde', {
                                method: 'POST',
                                body: formData,
                                headers: { 'Accept': 'application/json' }
                            });

                            if (response.ok) {
                                form.classList.add('hidden');
                                if(modalTitle) modalTitle.parentElement.classList.add('hidden');
                                successContent.classList.remove('hidden');
                                form.reset();
                            } else {
                                alert('Ошибка при отправке. Напишите нам в мессенджеры напрямую.');
                            }
                        } catch (error) {
                            alert('Ошибка сети. Пожалуйста, проверьте соединение.');
                        } finally {
                            btn.disabled = false;
                            btn.innerHTML = originalText;
                        }
                    }
                }

                // Инициализация FAQ (если есть на странице)
                const faqItems = document.querySelectorAll('.faq-item');
                faqItems.forEach(item => {
                    const button = item.querySelector('button');
                    const content = item.querySelector('.faq-content');
                    const icon = item.querySelector('.material-symbols-outlined');
                    
                    button.addEventListener('click', () => {
                        const isOpen = !content.classList.contains('hidden');
                        
                        // Close all other items
                        faqItems.forEach(otherItem => {
                            if (otherItem !== item) {
                                otherItem.querySelector('.faq-content').classList.add('hidden');
                                otherItem.querySelector('.material-symbols-outlined').style.transform = 'rotate(0deg)';
                            }
                        });

                        // Toggle current item
                        content.classList.toggle('hidden');
                        icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
                    });
                });

                // Убедимся, что кнопки openMessengerModal работают
                const triggerButtons = document.querySelectorAll('[onclick*="openMessengerModal"]');
                triggerButtons.forEach(btn => {
                    btn.onclick = function(e) {
                        e.preventDefault();
                        openMessengerModal();
                    };
                });
            })
            .catch(error => console.error('Ошибка загрузки футера:', error));
    }
});