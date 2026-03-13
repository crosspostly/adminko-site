/**
 * Глобальный движок компонентов Админ.Ко v2026
 * Автоматически подгружает Header и Footer, управляет темой и модалками.
 */

async function loadComponent(id, fileName) {
    const placeholder = document.getElementById(id);
    if (!placeholder) return;

    // Определяем путь: если мы в подпапке (например, /blog/), нужно подняться выше
    const isSubfolder = window.location.pathname.includes('/blog/');
    const path = isSubfolder ? '../' + fileName : fileName;

    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Failed to load ${fileName}`);
        let html = await response.text();
        
        // Если мы в подпапке, исправляем ссылки в загруженном HTML
        if (isSubfolder) {
            html = html.replace(/href="(?!http|https|#)/g, 'href="../');
            html = html.replace(/src="(?!http|https)/g, 'src="../');
        }
        
        placeholder.innerHTML = html;
        
        // Инициализируем поиск, если это хедер
        if (id === 'header-placeholder') initSearch();
    } catch (err) {
        console.error(`Error loading ${fileName}:`, err);
    }
}

function initSearch() {
    const searchInput = document.getElementById('header-search');
    if (searchInput) {
        searchInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                window.location.href = (window.location.pathname.includes('/blog/') ? '../' : '') + 'price.html?search=' + encodeURIComponent(searchInput.value);
            }
        };
    }
}

// Глобальные функции
window.toggleDarkMode = function() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
};

window.toggleMobileMenu = function() {
    const menu = document.getElementById('mobile-menu');
    const icon = document.getElementById('mobile-menu-icon');
    if (!menu || !icon) return;
    menu.classList.toggle('hidden');
    icon.textContent = menu.classList.contains('hidden') ? 'menu' : 'close';
};

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
    }
};

// Применение темы
(function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }
    
    // Загрузка компонентов при старте
    document.addEventListener('DOMContentLoaded', () => {
        loadComponent('header-placeholder', 'header.html');
        loadComponent('footer-placeholder', 'footer.html');
    });
})();

document.addEventListener('DOMContentLoaded', function() {
    // Делегирование кликов для мессенджеров
    document.addEventListener('click', function(e) {
        // Если кликнули по обычной ссылке (телефон, почта или переход) - не мешаем браузеру
        if (e.target.closest('a[href^="tel:"]') || e.target.closest('a[href^="mailto:"]') || e.target.closest('a[href^="http"]')) {
            return;
        }

        const btn = e.target.closest('[data-messenger]');
        if (btn) {
            const type = btn.dataset.messenger;
            const phone = '79502767171';
            if (type === 'telegram') window.open('https://t.me/Varsmana', '_blank');
            else if (type === 'max' || type === 'wa') window.open('https://wa.me/' + phone, '_blank');
        }
    });

    // Обработка форм
    const form = document.getElementById('evaluation-form');
    if (form) {
        const submitBtn = form.querySelector('button[data-callback]');
        if (submitBtn) {
            submitBtn.onclick = async function(e) {
                e.preventDefault();
                const phoneInput = form.querySelector('input[name="phone"]');
                if (!phoneInput?.value || phoneInput.value.length < 7) {
                    alert("Пожалуйста, укажите ваш номер телефона");
                    return;
                }
                submitBtn.disabled = true;
                submitBtn.innerHTML = 'Отправка...';
                try {
                    const response = await fetch('https://formspree.io/f/mqakevve', {
                        method: 'POST',
                        body: new FormData(form),
                        headers: { 'Accept': 'application/json' }
                    });
                    if (response.ok) {
                        form.classList.add('hidden');
                        document.getElementById('form-success')?.classList.remove('hidden');
                    } else throw new Error();
                } catch (err) {
                    alert("Ошибка. Напишите в Telegram.");
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Жду звонка';
                }
            };
        }
    }
});
