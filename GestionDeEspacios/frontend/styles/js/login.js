// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Funcionalidad para mostrar/ocultar contraseña
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default button behavior
            e.stopPropagation(); // Stop event propagation
            
            const currentType = passwordInput.getAttribute('type');
            const newType = currentType === 'password' ? 'text' : 'password';
            
            passwordInput.setAttribute('type', newType);
            passwordInput.type = newType; // Ensure type is applied
            
            const icon = togglePasswordBtn.querySelector('i');
            if (newType === 'text') {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
                togglePasswordBtn.setAttribute('aria-label', 'Ocultar contraseña');
            } else {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
                togglePasswordBtn.setAttribute('aria-label', 'Mostrar contraseña');
            }
            
            passwordInput.focus(); // Keep focus on the input
        });
    }
    
    // Interceptar el submit para enviar por AJAX
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => data[key] = value);

    // Validar que los campos no estén vacíos
    if (!data.identificador || !data.password) {
        mostrarCardEmergente(false, 'Por favor complete todos los campos');
        return;
    }

    try {
        console.log('Enviando request a:', form.action);
        const response = await fetch(form.action, {
            method: 'POST',
            body: formData
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        let result;
        try {
            result = await response.json();
            console.log('Response JSON:', result);
        } catch (err) {
            const text = await response.text();
            console.log('Response text:', text);
            result = { success: false, message: text || 'Error inesperado en el servidor.' };
        }

        if (result.success) {
            // Debug: Mostrar información de redirección
            console.log('Login exitoso - Datos del resultado:', result);
            
            // Si el usuario tiene múltiples roles, mostrar selector
            if (result.multiple_roles) {
                console.log('Usuario con múltiples roles:', result.roles);
                mostrarSelectorRoles(result.usuario, result.roles);
            } else {
                console.log('URL de redirección:', result.redirect_url);
                console.log('Tipo de usuario:', result.tipo_usuario);
                console.log('Rol del usuario:', result.usuario.rol);
                
                // Guardar información del usuario en sessionStorage
                sessionStorage.setItem('usuario_logueado', JSON.stringify(result.usuario));
                sessionStorage.setItem('tipo_usuario', result.tipo_usuario);
                if (result.token_sesion) {
                    sessionStorage.setItem('token_sesion', result.token_sesion);
                }
                
                // Mostrar mensaje de éxito y redirigir
                mostrarCardEmergente(true, `Bienvenido ${result.usuario.nombre} ${result.usuario.apellido}`);
                
                // Redirigir después de un breve delay
                setTimeout(() => {
                    console.log('Redirigiendo a:', result.redirect_url);
                    window.location.href = result.redirect_url;
                }, 1500);
            }
        } else {
            mostrarCardEmergente(false, result.message);
        }
    } catch (error) {
        mostrarCardEmergente(false, 'Error de conexión. Intente nuevamente.');
    }
    });

    // Función para abrir modal de recuperar contraseña
    document.getElementById('olvidastePasswordLink').addEventListener('click', function(e) {
        e.preventDefault();
        const modal = document.getElementById('modalRecuperarPassword');
        modal.classList.add('modal-visible');
    });

    // Cerrar modal al hacer clic fuera
    document.getElementById('modalRecuperarPassword').addEventListener('click', function(e) {
        if (e.target.id === 'modalRecuperarPassword') {
            cerrarModalRecuperar();
        }
    });
});

// Card emergente centrada con fondo difuminado
function mostrarCardEmergente(success, message) {
    // Crear overlay difuminado
    let overlay = document.getElementById('overlay-msg');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'overlay-msg';
        overlay.className = 'overlay-message';
        document.body.appendChild(overlay);
    }
    
    // Crear card
    let card = document.createElement('div');
    card.className = success ? 'message-card message-success' : 'message-card message-error';

    // Icono
    let icon = document.createElement('div');
    icon.className = 'message-icon';
    icon.innerHTML = success
        ? '<i class="fas fa-check-circle"></i>'
        : '<i class="fas fa-times-circle"></i>';
    card.appendChild(icon);

    // Mensaje
    let msg = document.createElement('div');
    msg.className = 'message-text';
    msg.textContent = message;
    card.appendChild(msg);

    // Botón cerrar (para todos los casos)
    let btn = document.createElement('button');
    btn.textContent = 'Cerrar';
    btn.className = success ? 'message-btn-success' : 'message-btn-error';
    btn.onclick = function() {
        overlay.remove();
    };
    card.appendChild(btn);

    // Limpiar overlay y agregar card
    overlay.innerHTML = '';
    overlay.appendChild(card);
}

// Función para mostrar selector de roles
function mostrarSelectorRoles(usuario, roles) {
    // Crear overlay difuminado
    let overlay = document.getElementById('overlay-roles');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'overlay-roles';
        overlay.className = 'overlay-roles';
        document.body.appendChild(overlay);
    }
    
    // Crear card
    let card = document.createElement('div');
    card.className = 'role-selector-card';

    // Icono
    let icon = document.createElement('div');
    icon.className = 'role-selector-icon';
    icon.innerHTML = '<i class="fas fa-users"></i>';
    card.appendChild(icon);

    // Título
    let title = document.createElement('h3');
    title.className = 'role-selector-title';
    title.textContent = 'Selecciona tu rol';
    card.appendChild(title);

    // Mensaje
    let msg = document.createElement('p');
    msg.className = 'role-selector-message';
    msg.textContent = `Hola ${usuario.nombre}, tienes acceso a múltiples roles. Selecciona con cuál deseas iniciar sesión:`;
    card.appendChild(msg);

    // Selector de roles
    let selectContainer = document.createElement('div');
    selectContainer.className = 'role-selector-container';
    
    let select = document.createElement('select');
    select.id = 'rolSelector';
    select.className = 'role-selector-select';
    
    // Agregar opción por defecto
    let defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Selecciona un rol...';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);
    
    // Agregar roles disponibles
    roles.forEach(rol => {
        let option = document.createElement('option');
        option.value = rol;
        option.textContent = getRolDisplayName(rol);
        select.appendChild(option);
    });
    
    selectContainer.appendChild(select);
    card.appendChild(selectContainer);

    // Botones
    let buttonContainer = document.createElement('div');
    buttonContainer.className = 'role-selector-actions';

    // Botón cancelar
    let cancelBtn = document.createElement('button');
    cancelBtn.className = 'role-selector-btn-cancel';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.onclick = function() {
        overlay.remove();
    };
    buttonContainer.appendChild(cancelBtn);

    // Botón continuar
    let continueBtn = document.createElement('button');
    continueBtn.className = 'role-selector-btn-continue';
    continueBtn.textContent = 'Continuar';
    continueBtn.onclick = function() {
        const rolSeleccionado = select.value;
        if (rolSeleccionado) {
            iniciarSesionConRol(usuario, rolSeleccionado);
        } else {
            mostrarCardEmergente(false, 'Por favor selecciona un rol');
        }
    };
    buttonContainer.appendChild(continueBtn);

    card.appendChild(buttonContainer);

    // Limpiar overlay y agregar card
    overlay.innerHTML = '';
    overlay.appendChild(card);
}

// Función para obtener nombre display del rol
function getRolDisplayName(rol) {
    const nombres = {
        'AdminSistema': '👑 Administrador del Sistema',
        'Administrador': '🏢 Administrador',
        'Colaboradores': '👩‍💼 Colaborador',
        'Cliente': '👤 Cliente'
    };
    return nombres[rol] || rol;
}

// Función para iniciar sesión con rol específico
async function iniciarSesionConRol(usuario, rol) {
    try {
        // Obtener credenciales del formulario
        const identificador = document.getElementById('identificador').value;
        const password = document.getElementById('password').value;
        
        const response = await fetch('/GestionDeEspacios/backend/public/login_rol_especifico.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `identificador=${encodeURIComponent(identificador)}&password=${encodeURIComponent(password)}&rol=${encodeURIComponent(rol)}`
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Cerrar selector de roles
            const overlay = document.getElementById('overlay-roles');
            if (overlay) overlay.remove();
            
            // Guardar información del usuario en sessionStorage
            sessionStorage.setItem('usuario_logueado', JSON.stringify(result.usuario));
            sessionStorage.setItem('tipo_usuario', result.tipo_usuario);
            if (result.token_sesion) {
                sessionStorage.setItem('token_sesion', result.token_sesion);
            }
            
            // Mostrar mensaje de éxito y redirigir
            mostrarCardEmergente(true, `Bienvenido ${result.usuario.nombre} ${result.usuario.apellido} como ${getRolDisplayName(rol)}`);
            
            // Redirigir después de un breve delay
            setTimeout(() => {
                window.location.href = result.redirect_url;
            }, 1500);
        } else {
            mostrarCardEmergente(false, result.message);
        }
    } catch (error) {
        mostrarCardEmergente(false, 'Error de conexión. Intente nuevamente.');
    }
}

// Función para cerrar modal de recuperar contraseña
function cerrarModalRecuperar() {
    const modal = document.getElementById('modalRecuperarPassword');
    modal.classList.remove('modal-visible');
    document.getElementById('formRecuperarPassword').reset();
}

// Función para enviar solicitud de recuperación
async function enviarRecuperacion(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Cerrar modal inmediatamente
    cerrarModalRecuperar();
    
    // Mostrar mensaje de éxito inmediatamente
    mostrarCardEmergente(true, 'Correo de recuperación enviado. Revisa tu bandeja de entrada.');

    // Enviar solicitud en segundo plano
    try {
        await fetch('/GestionDeEspacios/backend/public/recuperar_password.php', {
            method: 'POST',
            body: formData
        });
    } catch (error) {
        // Los errores se loguean en el backend, no mostramos nada al usuario
    }
}

