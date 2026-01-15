// Sistema de gestión de temas oscuro/claro
(function() {
    'use strict';

    // Variables de temas
    const themes = {
        dark: {
            name: 'dark',
            icon: 'fa-moon',
            label: 'Tema Oscuro'
        },
        light: {
            name: 'light',
            icon: 'fa-sun',
            label: 'Tema Claro'
        }
    };

    // Función para obtener el tema guardado
    function getSavedTheme() {
        const saved = localStorage.getItem('theme');
        return saved === 'light' ? 'light' : 'dark'; // Por defecto tema oscuro
    }

    // Función para guardar el tema
    function saveTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    // Función para actualizar el logo del sidebar según el tema
    function updateSidebarLogo(theme) {
        const sidebarLogos = document.querySelectorAll('.sidebar-header img');
        sidebarLogos.forEach(img => {
            if (theme === 'light') {
                img.src = 'images/NextFlow_Logo_Titulo-preview.png';
            } else {
                img.src = 'images/logo_next_blanco_sinfondo.png';
            }
        });
    }

    // Función para actualizar el logo del header en index.html y quienessomos.html
    function updateIndexHeaderLogo(theme) {
        // Logo del navbar principal (links con clase logo-link-large)
        const headerLogos = document.querySelectorAll('nav.navbar .logo-link-large img');
        headerLogos.forEach(img => {
            if (theme === 'light') {
                img.src = 'images/NextFlow_Logo-preview.png';
            } else {
                // Mantener el logo por defecto (versión blanca) en modo oscuro
                img.src = 'images/NextFlow_Logo_blanco.png';
            }
        });

        // Logo del menú móvil (dentro del contenedor del menú móvil)
        const mobileMenuLogos = document.querySelectorAll('#mobileMenu .logo-link-large img');
        mobileMenuLogos.forEach(img => {
            if (theme === 'light') {
                img.src = 'images/NextFlow_Logo-preview.png';
            } else {
                // Restaurar el logo de color en oscuro como estaba en el HTML
                img.src = 'images/NextFlow_Logo.png';
            }
        });
    }

    // Función para aplicar el tema al documento
    function applyTheme(theme) {
        const html = document.documentElement;
        html.setAttribute('data-theme', theme);
        html.classList.remove('theme-dark', 'theme-light');
        html.classList.add(`theme-${theme}`);
        
        // Actualizar iconos del botón de tema
        updateThemeButtons(theme);
        
        // Actualizar logo del sidebar
        updateSidebarLogo(theme);
        // Actualizar logo del header en index
        updateIndexHeaderLogo(theme);
    }

    // Función para actualizar los iconos de los botones de tema
    function updateThemeButtons(theme) {
        const themeButtons = document.querySelectorAll('.theme-toggle-btn');
        themeButtons.forEach(btn => {
            const icon = btn.querySelector('i');
            if (icon) {
                // Remover clases anteriores
                icon.classList.remove('fa-moon', 'fa-sun');
                // Agregar clase del icono correspondiente
                icon.classList.add(themes[theme].icon);
            }
            // Actualizar título/aria-label
            btn.setAttribute('title', `Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`);
            btn.setAttribute('aria-label', `Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`);
        });
    }

    // Función para cambiar el tema
    function toggleTheme() {
        const currentTheme = getSavedTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        saveTheme(newTheme);
        applyTheme(newTheme);
        
        // Disparar evento personalizado para que otros scripts puedan reaccionar
        document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
    }

    // Función para inicializar el tema
    function initTheme() {
        const savedTheme = getSavedTheme();
        applyTheme(savedTheme);
    }

    // Función para crear el botón de cambio de tema
    function createThemeButton(container, position = 'beforeend') {
        // Verificar si ya existe un botón de tema
        if (container.querySelector('.theme-toggle-btn')) {
            return;
        }

        const button = document.createElement('button');
        button.className = 'theme-toggle-btn';
        button.setAttribute('title', 'Cambiar tema');
        button.setAttribute('aria-label', 'Cambiar tema');
        button.innerHTML = `<i class="fas ${themes[getSavedTheme()].icon}"></i>`;
        button.onclick = toggleTheme;
        
        container.insertAdjacentElement(position, button);
        updateThemeButtons(getSavedTheme());
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initTheme();
            // Asegurar que el logo se actualice después de que el DOM esté completamente cargado
            setTimeout(function() {
                const theme = getSavedTheme();
                updateSidebarLogo(theme);
                updateIndexHeaderLogo(theme);
            }, 100);
        });
    } else {
        initTheme();
        // Asegurar que el logo se actualice después de que el DOM esté completamente cargado
        setTimeout(function() {
            const theme = getSavedTheme();
            updateSidebarLogo(theme);
            updateIndexHeaderLogo(theme);
        }, 100);
    }
    
    // Escuchar cambios de tema para actualizar el logo
    document.addEventListener('themeChanged', function(e) {
        updateSidebarLogo(e.detail.theme);
        updateIndexHeaderLogo(e.detail.theme);
    });

    // Exponer funciones globalmente
    window.themeToggle = {
        toggle: toggleTheme,
        getCurrentTheme: getSavedTheme,
        init: initTheme,
        createButton: createThemeButton
    };
})();

