// menu.js extraído de admin_box.js
// Función para inicializar el menú (con verificación de sesión)
function inicializarMenu() {
    // Verificar si hay usuario logueado
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    const tipoUsuario = sessionStorage.getItem('tipo_usuario');
    
    if (!usuarioLogueado || tipoUsuario !== 'cliente') {
        // Redirigir al login si no hay sesión válida
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const usuario = JSON.parse(usuarioLogueado);
        
        // Configurar información de usuario real
        const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`;
        const iniciales = `${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}`;
        
        document.getElementById('userName').textContent = nombreCompleto;
        document.getElementById('userAvatar').textContent = iniciales;
        
        // Configurar información móvil
        document.getElementById('mobileUserName').textContent = nombreCompleto;
        document.getElementById('mobileUserAvatar').textContent = iniciales;
        
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        // Redirigir al login si hay error
        window.location.href = 'login.html';
    }
}

// Función de logout
async function logout() {
    // Mostrar card de confirmación
    mostrarCardLogout();
}

// Función para mostrar card de logout
function mostrarCardLogout() {
    // Crear overlay difuminado
    let overlay = document.getElementById('overlay-logout');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'overlay-logout';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'rgba(44,62,80,0.45)';
        overlay.style.backdropFilter = 'blur(3px)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '99999';
        document.body.appendChild(overlay);
    }
    
    // Crear card
    let card = document.createElement('div');
    card.style.background = '#fff';
    card.style.borderRadius = '16px';
    card.style.boxShadow = '0 8px 32px rgba(44,62,80,0.18)';
    card.style.padding = '2em 1.2em 1.5em 1.2em';
    card.style.maxWidth = '90vw';
    card.style.width = '320px';
    card.style.textAlign = 'center';
    card.style.position = 'relative';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.alignItems = 'center';
    card.style.borderLeft = '7px solid #e74c3c';

    // Icono
    let icon = document.createElement('div');
    icon.innerHTML = '<i class="fas fa-sign-out-alt" style="font-size:2.3em;color:#e74c3c;"></i>';
    card.appendChild(icon);

    // Mensaje
    let msg = document.createElement('div');
    msg.textContent = '¿Estás seguro de que quieres cerrar sesión?';
    msg.style.margin = '1em 0 1.2em 0';
    msg.style.fontSize = '1.08em';
    msg.style.fontWeight = 'bold';
    msg.style.color = '#2c3e50';
    card.appendChild(msg);

    // Botones
    let buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '1rem';
    buttonContainer.style.marginTop = '0.5em';

    // Botón Cancelar
    let cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.style.background = '#95a5a6';
    cancelBtn.style.color = '#fff';
    cancelBtn.style.border = 'none';
    cancelBtn.style.borderRadius = '8px';
    cancelBtn.style.padding = '0.6em 1.5em';
    cancelBtn.style.fontSize = '0.98em';
    cancelBtn.style.fontWeight = 'bold';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.onclick = function() {
        overlay.remove();
    };
    buttonContainer.appendChild(cancelBtn);

    // Botón Confirmar
    let confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Cerrar Sesión';
    confirmBtn.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
    confirmBtn.style.color = '#fff';
    confirmBtn.style.border = 'none';
    confirmBtn.style.borderRadius = '8px';
    confirmBtn.style.padding = '0.6em 1.5em';
    confirmBtn.style.fontSize = '0.98em';
    confirmBtn.style.fontWeight = 'bold';
    confirmBtn.style.cursor = 'pointer';
    confirmBtn.onclick = async function() {
        // Ejecutar logout real
        await ejecutarLogout();
        overlay.remove();
    };
    buttonContainer.appendChild(confirmBtn);

    card.appendChild(buttonContainer);

    // Limpiar overlay y agregar card
    overlay.innerHTML = '';
    overlay.appendChild(card);
}

// Función para ejecutar el logout real
async function ejecutarLogout() {
    const token = sessionStorage.getItem('token_sesion');
    
    if (token) {
        try {
            // Cerrar sesión en el backend
            const response = await fetch('../backend/public/sesion.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'cerrar',
                    token: token
                })
            });
            
            const result = await response.json();
            console.log('Sesión cerrada:', result);
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    }
    
    // Limpiar datos de sesión
    sessionStorage.removeItem('usuario_logueado');
    sessionStorage.removeItem('tipo_usuario');
    sessionStorage.removeItem('token_sesion');
    
    // Mostrar mensaje de confirmación
    mostrarCardEmergente(true, 'Sesión cerrada correctamente');
    
    // Redirigir al login después de un breve delay
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1500);
}

// Función para mostrar card emergente (reutilizada del login)
function mostrarCardEmergente(success, message) {
    // Crear overlay difuminado
    let overlay = document.getElementById('overlay-msg');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'overlay-msg';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'rgba(44,62,80,0.45)';
        overlay.style.backdropFilter = 'blur(3px)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '99999';
        document.body.appendChild(overlay);
    }
    
    // Crear card
    let card = document.createElement('div');
    card.style.background = '#fff';
    card.style.borderRadius = '16px';
    card.style.boxShadow = '0 8px 32px rgba(44,62,80,0.18)';
    card.style.padding = '2em 1.2em 1.5em 1.2em';
    card.style.maxWidth = '90vw';
    card.style.width = '270px';
    card.style.textAlign = 'center';
    card.style.position = 'relative';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.alignItems = 'center';
    card.style.borderLeft = success ? '7px solid #27ae60' : '7px solid #e74c3c';

    // Icono
    let icon = document.createElement('div');
    icon.innerHTML = success
        ? '<i class="fas fa-check-circle" style="font-size:2.3em;color:#27ae60;"></i>'
        : '<i class="fas fa-times-circle" style="font-size:2.3em;color:#e74c3c;"></i>';
    card.appendChild(icon);

    // Mensaje
    let msg = document.createElement('div');
    msg.textContent = message;
    msg.style.margin = '1em 0 1.2em 0';
    msg.style.fontSize = '1.08em';
    msg.style.fontWeight = 'bold';
    msg.style.color = '#2c3e50';
    card.appendChild(msg);

    // Botón de cerrar (solo para errores o si es exitoso)
    if (!success || success) {
        let closeBtn = document.createElement('button');
        closeBtn.textContent = 'Cerrar';
        closeBtn.style.background = success ? 'linear-gradient(135deg, #27ae60, #2ecc71)' : 'linear-gradient(135deg, #e74c3c, #c0392b)';
        closeBtn.style.color = '#fff';
        closeBtn.style.border = 'none';
        closeBtn.style.borderRadius = '8px';
        closeBtn.style.padding = '0.6em 1.5em';
        closeBtn.style.fontSize = '0.98em';
        closeBtn.style.fontWeight = 'bold';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.marginTop = '0.5em';
        closeBtn.onclick = function() {
            overlay.remove();
        };
        card.appendChild(closeBtn);
    }

    // Auto-cerrar para mensajes de éxito después de 3 segundos
    if (success) {
        setTimeout(() => {
            if (overlay && overlay.parentNode) {
                overlay.remove();
            }
        }, 3000);
    }

    // Limpiar overlay y agregar card
    overlay.innerHTML = '';
    overlay.appendChild(card);
}

// Función para alternar el sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const toggleBtnHeader = document.getElementById('sidebarToggle');
    const toggleBtnMenu = document.getElementById('sidebarToggleMenu');
    const iconHeader = toggleBtnHeader.querySelector('i');
    const iconMenu = toggleBtnMenu ? toggleBtnMenu.querySelector('i') : null;
    if (window.innerWidth <= 600) {
        // Móvil: alterna menú desplegable
        sidebar.classList.toggle('menu-open');
        return;
    }
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('collapsed');
    if (sidebar.classList.contains('collapsed')) {
        if(toggleBtnHeader) toggleBtnHeader.style.display = 'none';
        if(toggleBtnMenu) toggleBtnMenu.style.display = 'flex';
    } else {
        if(toggleBtnHeader) toggleBtnHeader.style.display = 'flex';
        if(toggleBtnMenu) toggleBtnMenu.style.display = 'none';
    }
    iconHeader.className = 'fas fa-bars';
    if(iconMenu) iconMenu.className = 'fas fa-bars';
}

// Función para cerrar el menú móvil
function closeMobileMenu() {
    const mobileMenu = document.getElementById('sidebarMenuMobile');
    if (window.innerWidth <= 600) {
        mobileMenu.classList.remove('open');
    }
}

// Función para establecer menú activo y cambiar contenido
function setActiveMenu(menuItem) {
    // Remover clase active de todos los menús
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Agregar clase active al menú seleccionado
    menuItem.classList.add('active');
    
    // Usar data-view si existe para decidir la vista, sino usar texto del span
    const dataView = menuItem.getAttribute('data-view');
    const spanText = menuItem.querySelector('span')?.textContent?.trim() || '';
    const menuText = dataView || spanText;
    
    // Debug temporal
    console.log('[setActiveMenu] data-view:', dataView, 'span text:', spanText, 'menuText:', menuText);
    
    // Cambiar el contenido según la opción seleccionada
    cambiarContenido(menuText);
    
    // En móviles, cerrar el sidebar después de seleccionar
    if (window.innerWidth <= 600) {
        closeMobileMenu();
    }
}

// Navegar al formulario de reportes desde un espacio asignado
function goToReportFromAsignacion(idAsignacion) {
    try {
        sessionStorage.setItem('preselect_asignacion', String(idAsignacion));
        // Cambiar al menú Reportes y Horarios y enfocar el formulario
        const allMenus = Array.from(document.querySelectorAll('.menu-item'));
        const target = allMenus.find(el => el.getAttribute('data-view') === 'reportes-incidencias' || (el.querySelector('span') && el.querySelector('span').textContent.trim().includes('Reportes')));
        if (target) {
            setActiveMenu(target);
            // Esperar al render y preseleccionar
            setTimeout(() => {
                const sel = document.getElementById('reporteAsignacion');
                if (sel && sessionStorage.getItem('preselect_asignacion')) {
                    sel.value = sessionStorage.getItem('preselect_asignacion');
                }
                const form = document.getElementById('formEnviarReporte');
                if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 200);
        }
    } catch (e) {
        console.error('goToReportFromAsignacion error', e);
    }
}

// Navegar al formulario de cambio de horario desde un espacio asignado
function goToCambioHorarioFromAsignacion(idAsignacion) {
    try {
        sessionStorage.setItem('preselect_asignacion_cambio', String(idAsignacion));
        // Cambiar al menú Cambio de Horario y enfocar el formulario
        const allMenus = Array.from(document.querySelectorAll('.menu-item'));
        const target = allMenus.find(el => el.querySelector('span') && el.querySelector('span').textContent.trim() === 'Cambio de Horario');
        if (target) {
            setActiveMenu(target);
            // Esperar al render y preseleccionar
            setTimeout(() => {
                const sel = document.getElementById('chgAsignacion');
                if (sel && sessionStorage.getItem('preselect_asignacion_cambio')) {
                    sel.value = sessionStorage.getItem('preselect_asignacion_cambio');
                    sessionStorage.removeItem('preselect_asignacion_cambio');
                }
                const form = document.getElementById('formCambioHorario');
                if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 200);
        }
    } catch (e) {
        console.error('goToCambioHorarioFromAsignacion error', e);
    }
}
// Función para cambiar el contenido del panel principal
function cambiarContenido(opcion) {
    const container = document.querySelector('.container');
    // Normalizar la opción: aceptar data-view y textos visibles
    if (typeof opcion === 'string') {
        const k = opcion.toLowerCase().trim();
        console.log('[cambiarContenido] opcion original:', opcion, 'normalizada a minusculas:', k);
        if (
            k === 'reportes-incidencias' ||
            (k.includes('reportes') && k.includes('incid')) ||
            (k === 'reportes' && !k.includes('generar'))
        ) {
            opcion = 'Reportes';
            console.log('[cambiarContenido] mapeado a: Reportes');
        } else if (k === 'generar-reportes' || (k.includes('generar') && k.includes('reportes'))) {
            opcion = 'Generar Reportes';
            console.log('[cambiarContenido] mapeado a: Generar Reportes');
        }
    }
    
    switch(opcion) {
        case 'Generar Reportes':
            uiGenerarReportesCliente(container);
            inicializarGeneradorReportesCliente();
            break;
        case 'Inicio':
            container.innerHTML = `
                <div class="welcome-card">
                    <div class="geometric-line-1"></div>
                    <div class="geometric-dot-1"></div>
                    <div class="geometric-square-1"></div>
                    <div class="geometric-rect-1"></div>
                    <div class="geometric-triangle-1"></div>
                    <div class="geometric-line-2"></div>
                    <div class="geometric-dot-2"></div>
                    <div class="geometric-square-2"></div>
                    <div class="geometric-rect-2"></div>
                    <div class="geometric-triangle-2"></div>
                    <div class="geometric-line-3"></div>
                    <div class="geometric-dot-3"></div>
                    <div class="geometric-square-3"></div>
                    <div class="geometric-rect-3"></div>
                    <div class="geometric-triangle-3"></div>
                    <div class="geometric-line-4"></div>
                    <div class="geometric-dot-4"></div>
                    <div class="geometric-square-4"></div>
                    <div class="geometric-rect-4"></div>
                    <div class="geometric-triangle-4"></div>
                    <div class="geometric-line-5"></div>
                    <div class="geometric-dot-5"></div>
                    <div class="geometric-square-5"></div>
                    <div class="geometric-rect-5"></div>
                    <div class="geometric-triangle-5"></div>
                    <div class="geometric-line-6"></div>
                    <div class="geometric-dot-6"></div>
                    <div class="geometric-square-6"></div>
                    <div class="geometric-rect-6"></div>
                    <div class="geometric-triangle-6"></div>
                    <div class="geometric-line-7"></div>
                    <div class="geometric-dot-7"></div>
                    <div class="geometric-square-7"></div>
                    <div class="geometric-rect-7"></div>
                    <div class="geometric-triangle-7"></div>
                    <div class="geometric-line-8"></div>
                    <div class="geometric-dot-8"></div>
                    <div class="geometric-square-8"></div>
                    <div class="geometric-rect-8"></div>
                    <div class="geometric-triangle-8"></div>
                    <div class="geometric-line-9"></div>
                    <div class="geometric-dot-9"></div>
                    <div class="geometric-square-9"></div>
                    <div class="geometric-rect-9"></div>
                    <div class="geometric-triangle-9"></div>
                    <div class="geometric-line-10"></div>
                    <div class="geometric-dot-10"></div>
                    <div class="geometric-square-10"></div>
                    <div class="geometric-rect-10"></div>
                    <div class="geometric-triangle-10"></div>
                    <h2>Bienvenido al Panel de Cliente</h2>
                    <p>Gestiona tus espacios asignados</p>
                </div>

                <div class="dashboard-metrics" id="dashboardMetricsCliente">
                    <div class="dashboard-metrics-card">
                        <h3 style="margin-top:.25rem;">Resumen general</h3>
                        <div class="metrics-grid">
                            <div class="metric-card">
                                <div class="metric-title"><i class="fas fa-door-open"></i> Espacios asignados</div>
                                <div class="metric-values">
                                    <div><span class="metric-number" id="asig_total_c">-</span><span class="metric-label">Total</span></div>
                    </div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-title"><i class="fas fa-star"></i> Mis calificaciones de espacios</div>
                                <div class="metric-values">
                                    <div><span class="metric-number" id="cal_esp_mis_c">-</span><span class="metric-label">Total</span></div>
                                </div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-title"><i class="fas fa-exchange-alt"></i> Mis solicitudes de cambio de horario</div>
                                <div class="metric-values">
                                    <div><span class="metric-number" id="sol_total_cli">-</span><span class="metric-label">Total</span></div>
                                    <div><span class="metric-number" id="sol_aprobadas_cli">-</span><span class="metric-label">Aprobadas</span></div>
                                    <div><span class="metric-number" id="sol_rechazadas_cli">-</span><span class="metric-label">Rechazadas</span></div>
                                    <div><span class="metric-number" id="sol_pendientes_cli">-</span><span class="metric-label">Pendientes</span></div>
                                </div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-title"><i class="fas fa-flag"></i> Mis reportes</div>
                                <div class="metric-values">
                                    <div><span class="metric-number" id="rep_total_cli">-</span><span class="metric-label">Total</span></div>
                                    <div><span class="metric-number" id="rep_enviados_cli">-</span><span class="metric-label">Enviados</span></div>
                                    <div><span class="metric-number" id="rep_resueltos_cli">-</span><span class="metric-label">Resueltos</span></div>
                                    <div><span class="metric-number" id="rep_revisados_cli">-</span><span class="metric-label">Revisados</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            setTimeout(()=>{ try{ cargarDashboardCliente(); }catch(_){ } }, 100);
            break;
            
        case 'Mi Perfil':
            container.innerHTML = `
                <div class="welcome-card">
                    <div class="geometric-line-1"></div>
                    <div class="geometric-dot-1"></div>
                    <div class="geometric-square-1"></div>
                    <div class="geometric-rect-1"></div>
                    <div class="geometric-triangle-1"></div>
                    <div class="geometric-line-2"></div>
                    <div class="geometric-dot-2"></div>
                    <div class="geometric-square-2"></div>
                    <div class="geometric-rect-2"></div>
                    <div class="geometric-triangle-2"></div>
                    <div class="geometric-line-3"></div>
                    <div class="geometric-dot-3"></div>
                    <div class="geometric-square-3"></div>
                    <div class="geometric-rect-3"></div>
                    <div class="geometric-triangle-3"></div>
                    <div class="geometric-line-4"></div>
                    <div class="geometric-dot-4"></div>
                    <div class="geometric-square-4"></div>
                    <div class="geometric-rect-4"></div>
                    <div class="geometric-triangle-4"></div>
                    <div class="geometric-line-5"></div>
                    <div class="geometric-dot-5"></div>
                    <div class="geometric-square-5"></div>
                    <div class="geometric-rect-5"></div>
                    <div class="geometric-triangle-5"></div>
                    <div class="geometric-line-6"></div>
                    <div class="geometric-dot-6"></div>
                    <div class="geometric-square-6"></div>
                    <div class="geometric-rect-6"></div>
                    <div class="geometric-triangle-6"></div>
                    <div class="geometric-line-7"></div>
                    <div class="geometric-dot-7"></div>
                    <div class="geometric-square-7"></div>
                    <div class="geometric-rect-7"></div>
                    <div class="geometric-triangle-7"></div>
                    <div class="geometric-line-8"></div>
                    <div class="geometric-dot-8"></div>
                    <div class="geometric-square-8"></div>
                    <div class="geometric-rect-8"></div>
                    <div class="geometric-triangle-8"></div>
                    <div class="geometric-line-9"></div>
                    <div class="geometric-dot-9"></div>
                    <div class="geometric-square-9"></div>
                    <div class="geometric-rect-9"></div>
                    <div class="geometric-triangle-9"></div>
                    <div class="geometric-line-10"></div>
                    <div class="geometric-dot-10"></div>
                    <div class="geometric-square-10"></div>
                    <div class="geometric-rect-10"></div>
                    <div class="geometric-triangle-10"></div>
                    <h2>Mi Perfil de Cliente</h2>
                    <p>Gestiona tu información personal y credenciales</p>
                </div>
                
                <div class="profile-section">
                    <div class="profile-container">
                        <!-- Sección de Información Personal -->
                        <div class="profile-card">
                            <div class="profile-header">
                                <div class="profile-avatar">
                                    <i class="fas fa-user-circle"></i>
                                </div>
                                <div class="profile-info">
                                    <h3 id="profileName">Cargando...</h3>
                                    <p>Cliente</p>
                                </div>
                                <button class="edit-profile-btn" id="editProfileBtn" onclick="toggleEditProfile()">
                                    <i class="fas fa-edit"></i> Editar Perfil
                                </button>
                            </div>
                            
                            <div class="profile-form">
                                <div class="form-group">
                                    <label>Nombre de Usuario</label>
                                    <input type="text" id="profileNombreUsuario" placeholder="Tu nombre de usuario" disabled>
                                </div>
                                <div class="form-group">
                                    <label>Nombre</label>
                                    <input type="text" id="profileNombre" placeholder="Tu nombre" disabled>
                                </div>
                                <div class="form-group">
                                    <label>Apellido</label>
                                    <input type="text" id="profileApellido" placeholder="Tu apellido" disabled>
                                </div>
                                <div class="form-group">
                                    <label>Email</label>
                                    <input type="email" id="profileEmail" placeholder="tu@email.com" disabled>
                                </div>
                                <div class="form-group">
                                    <label>Teléfono</label>
                                    <input type="tel" id="profileTelefono" placeholder="+1234567890" disabled>
                                </div>
                                <div class="form-group">
                                    <label>Región</label>
                                    <select id="profileRegion" disabled>
                                        <option value="">Selecciona una región</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Ciudad</label>
                                    <select id="profileCiudad" disabled>
                                        <option value="">Selecciona una ciudad</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Dirección</label>
                                    <input type="text" id="profileDireccion" placeholder="Tu dirección" disabled>
                                </div>
                                <div class="profile-actions" id="profileActions" style="display: none;">
                                    <button class="save-btn" onclick="actualizarPerfil()">
                                        <i class="fas fa-save"></i> Guardar Cambios
                                    </button>
                                    <button class="cancel-btn" onclick="cancelarEdicion()">
                                        <i class="fas fa-times"></i> Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Sección de Cambio de Contraseña -->
                        <div class="password-card">
                            <div class="password-header">
                                <h3><i class="fas fa-lock"></i> Cambiar Contraseña</h3>
                                <p>Actualiza tu contraseña de acceso</p>
                            </div>
                            
                            <div class="password-form">
                                <div class="form-group">
                                    <label>Contraseña Actual</label>
                                    <input type="password" id="contrasenaActual" placeholder="Ingresa tu contraseña actual">
                                </div>
                                <div class="form-group">
                                    <label>Nueva Contraseña</label>
                                    <input type="password" id="nuevaContrasena" placeholder="Ingresa tu nueva contraseña">
                                </div>
                                <div class="form-group">
                                    <label>Confirmar Nueva Contraseña</label>
                                    <input type="password" id="confirmarContrasena" placeholder="Confirma tu nueva contraseña">
                                </div>
                                <button class="update-password-btn" onclick="cambiarContrasena()">
                                    <i class="fas fa-key"></i> Actualizar Contraseña
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            cargarDatosPerfil();
            break;
            
        case 'Mensajes':
            container.innerHTML = `
                <div class="welcome-card">
                    <div class="geometric-line-1"></div>
                    <div class="geometric-dot-1"></div>
                    <div class="geometric-square-1"></div>
                    <div class="geometric-rect-1"></div>
                    <div class="geometric-triangle-1"></div>
                    <div class="geometric-line-2"></div>
                    <div class="geometric-dot-2"></div>
                    <div class="geometric-square-2"></div>
                    <div class="geometric-rect-2"></div>
                    <div class="geometric-triangle-2"></div>
                    <div class="geometric-line-3"></div>
                    <div class="geometric-dot-3"></div>
                    <div class="geometric-square-3"></div>
                    <div class="geometric-rect-3"></div>
                    <div class="geometric-triangle-3"></div>
                    <div class="geometric-line-4"></div>
                    <div class="geometric-dot-4"></div>
                    <div class="geometric-square-4"></div>
                    <div class="geometric-rect-4"></div>
                    <div class="geometric-triangle-4"></div>
                    <div class="geometric-line-5"></div>
                    <div class="geometric-dot-5"></div>
                    <div class="geometric-square-5"></div>
                    <div class="geometric-rect-5"></div>
                    <div class="geometric-triangle-5"></div>
                    <div class="geometric-line-6"></div>
                    <div class="geometric-dot-6"></div>
                    <div class="geometric-square-6"></div>
                    <div class="geometric-rect-6"></div>
                    <div class="geometric-triangle-6"></div>
                    <div class="geometric-line-7"></div>
                    <div class="geometric-dot-7"></div>
                    <div class="geometric-square-7"></div>
                    <div class="geometric-rect-7"></div>
                    <div class="geometric-triangle-7"></div>
                    <div class="geometric-line-8"></div>
                    <div class="geometric-dot-8"></div>
                    <div class="geometric-square-8"></div>
                    <div class="geometric-rect-8"></div>
                    <div class="geometric-triangle-8"></div>
                    <div class="geometric-line-9"></div>
                    <div class="geometric-dot-9"></div>
                    <div class="geometric-square-9"></div>
                    <div class="geometric-rect-9"></div>
                    <div class="geometric-triangle-9"></div>
                    <div class="geometric-line-10"></div>
                    <div class="geometric-dot-10"></div>
                    <div class="geometric-square-10"></div>
                    <div class="geometric-rect-10"></div>
                    <div class="geometric-triangle-10"></div>
                    <h2>Mensajes</h2>
                    <p>Gestiona tus conversaciones y consultas</p>
                </div>
                
                <div class="messages-section">
                    <div class="messages-type-selector">
                        <div class="radio-group">
                            <label class="radio-option">
                                <input type="radio" name="messageType" value="asignacion" checked onchange="cargarMensajes('asignacion')">
                                <span class="radio-custom"></span>
                                <span class="radio-label">Mensajes de Asignación</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="messageType" value="consulta" onchange="cargarMensajes('consulta')">
                                <span class="radio-custom"></span>
                                <span class="radio-label">Mensajes de Consulta</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="messages-container" id="messagesContainer">
                        <div class="loading-message">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>Cargando mensajes...</p>
                        </div>
                    </div>
                    
                </div>
            `;
            
            // Inicializar mensajes
            configurarMensajes();
            cargarMensajes('asignacion');
            break;
        case 'Espacios Asignados':
            container.innerHTML = `
                <div class="welcome-card">
                    <div class="geometric-line-1"></div>
                    <div class="geometric-dot-1"></div>
                    <div class="geometric-square-1"></div>
                    <div class="geometric-rect-1"></div>
                    <div class="geometric-triangle-1"></div>
                    <div class="geometric-line-2"></div>
                    <div class="geometric-dot-2"></div>
                    <div class="geometric-square-2"></div>
                    <div class="geometric-rect-2"></div>
                    <div class="geometric-triangle-2"></div>
                    <div class="geometric-line-3"></div>
                    <div class="geometric-dot-3"></div>
                    <div class="geometric-square-3"></div>
                    <div class="geometric-rect-3"></div>
                    <div class="geometric-triangle-3"></div>
                    <div class="geometric-line-4"></div>
                    <div class="geometric-dot-4"></div>
                    <div class="geometric-square-4"></div>
                    <div class="geometric-rect-4"></div>
                    <div class="geometric-triangle-4"></div>
                    <div class="geometric-line-5"></div>
                    <div class="geometric-dot-5"></div>
                    <div class="geometric-square-5"></div>
                    <div class="geometric-rect-5"></div>
                    <div class="geometric-triangle-5"></div>
                    <div class="geometric-line-6"></div>
                    <div class="geometric-dot-6"></div>
                    <div class="geometric-square-6"></div>
                    <div class="geometric-rect-6"></div>
                    <div class="geometric-triangle-6"></div>
                    <div class="geometric-line-7"></div>
                    <div class="geometric-dot-7"></div>
                    <div class="geometric-square-7"></div>
                    <div class="geometric-rect-7"></div>
                    <div class="geometric-triangle-7"></div>
                    <div class="geometric-line-8"></div>
                    <div class="geometric-dot-8"></div>
                    <div class="geometric-square-8"></div>
                    <div class="geometric-rect-8"></div>
                    <div class="geometric-triangle-8"></div>
                    <div class="geometric-line-9"></div>
                    <div class="geometric-dot-9"></div>
                    <div class="geometric-square-9"></div>
                    <div class="geometric-rect-9"></div>
                    <div class="geometric-triangle-9"></div>
                    <div class="geometric-line-10"></div>
                    <div class="geometric-dot-10"></div>
                    <div class="geometric-square-10"></div>
                    <div class="geometric-rect-10"></div>
                    <div class="geometric-triangle-10"></div>
                    <h2>Espacios Asignados</h2>
                    <p>Revisa los espacios que tienes asignados</p>
                </div>
                
                <div class="assigned-spaces-section">
                    <div class="search-filters-card">
                        <h3><i class="fas fa-filter"></i> Filtros de Búsqueda</h3>
                        <div class="filters-grid">
                            <div class="filter-group">
                                <label for="filtroAdministrador">Administrador:</label>
                                <select id="filtroAdministrador" class="filter-select">
                                    <option value="">Todos los administradores</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label for="filtroUbicacion">Ubicación:</label>
                                <select id="filtroUbicacion" class="filter-select">
                                    <option value="">Todas las ubicaciones</option>
                                </select>
                            </div>
                        </div>
                        <div class="filter-actions">
                            <button class="btn-filter" onclick="aplicarFiltrosAsignados()">
                                <i class="fas fa-search"></i> Buscar Espacios
                            </button>
                            <button class="btn-clear" onclick="limpiarFiltrosAsignados()">
                                <i class="fas fa-times"></i> Limpiar Filtros
                            </button>
                        </div>
                    </div>
                    
                    <div class="spaces-results-card">
                        <div class="spaces-header">
                            <h3><i class="fas fa-building"></i> Espacios Asignados</h3>
                            <p>Revisa los espacios que tienes asignados</p>
                        </div>
                        <div id="listaEspaciosAsignados" class="spaces-list">
                            <div class="loading-message">
                                <i class="fas fa-spinner fa-spin"></i> Cargando espacios asignados...
                            </div>
                        </div>
                    </div>
                </div>
            `;
            cargarEspaciosAsignados();
            break;
        function inicializarFormularioReportes() {
            const select = document.getElementById('reporteAsignacion');
            const form = document.getElementById('formEnviarReporte');
            const cardsWrapper = document.getElementById('reportesList');
            if (!select || !form) return;
            (async () => {
                try {
                    const token = sessionStorage.getItem('token_sesion') || '';
                    const res = await fetch(`../backend/public/espacios_asignados.php?token=${encodeURIComponent(token)}`);
                    const data = await res.json();
                    console.log('[Reportes] espacios_asignados response:', data);
                    if (data.success && Array.isArray(data.espacios)) {
                        const opciones = data.espacios
                            .filter(e => e.id_asignacion)
                            .map(e => {
                                const nombre = e.nombre_espacio || 'Espacio';
                                const ubic = [e.ciudad, e.region].filter(Boolean).join(', ');
                                return `<option value="${e.id_asignacion}">${nombre}${ubic?` - ${ubic}`:''}</option>`;
                            }).join('');
                        select.innerHTML = '<option value="">Selecciona un espacio</option>' + opciones;
                        const pre = sessionStorage.getItem('preselect_asignacion');
                        if (pre) {
                            select.value = pre;
                            sessionStorage.removeItem('preselect_asignacion');
                        }
                    }
                } catch (err) {
                    console.error('Error cargando asignaciones para reportes', err);
                }
            })();

            async function cargarTablaReportes() {
                try {
                    const token = sessionStorage.getItem('token_sesion') || '';
                    const url = `../backend/public/envioreportes.php?token=${encodeURIComponent(token)}`;
                    console.log('[Reportes] GET url:', url);
                    const resp = await fetch(url);
                    const json = await resp.json();
                    console.log('[Reportes] GET response:', json);
                    if (!json.success) {
                        cardsWrapper.innerHTML = `<div style="color:#e74c3c; padding:1rem; text-align:center;">${json.message || 'No se pudieron cargar los reportes'}</div>`;
                        return;
                    }
                    const rows = Array.isArray(json.reportes) ? json.reportes : [];
                    if (!rows.length) {
                        cardsWrapper.innerHTML = '<div style="color:#888; padding:1rem; text-align:center;">No tienes reportes enviados.</div>';
                        return;
                    }
                    cardsWrapper.innerHTML = rows.map(r => {
                        const fecha = (r.fecha_creacion || '').replace('T',' ').substring(0,19);
                        const estado = (r.estado || '').toLowerCase();
                        const estadoClass = estado === 'resuelto' ? 'estado-resuelto' : (estado === 'revisado' ? 'estado-revisado' : 'estado-enviado');
                        const respondido = (r.respuesta_admin && r.respuesta_admin.trim().length) ? true : false;
                        const badgeResp = respondido ? '<span class="respuesta-badge respuesta-ok">Respuesta</span>' : '';
                        
                        let textoResp = '';
                        if (respondido) {
                            const respuestaCompleta = r.respuesta_admin || '';
                            const tieneMultiplesRespuestas = respuestaCompleta.includes('--- Nueva respuesta');
                            
                            if (tieneMultiplesRespuestas) {
                                // Mostrar todas las respuestas
                                const partes = respuestaCompleta.split('--- Nueva respuesta');
                                let todasLasRespuestas = '';
                                
                                // Primera respuesta
                                if (partes[0].trim()) {
                                    todasLasRespuestas += `<div class="respuesta-individual"><strong>Respuesta Original:</strong><br>${partes[0].trim().replace(/\n/g, '<br>')}</div>`;
                                }
                                
                                // Respuestas adicionales
                                for (let i = 1; i < partes.length; i++) {
                                    const parte = partes[i].trim();
                                    if (parte) {
                                        const fechaMatch = parte.match(/\(([^)]+)\)/);
                                        const fecha = fechaMatch ? fechaMatch[1] : 'Fecha no disponible';
                                        const contenido = parte.replace(/\([^)]+\)/, '').trim();
                                        const contenidoLimpio = contenido.replace(/^---\s*/, '').replace(/^Nueva respuesta\s*/, '').trim();
                                        if (contenidoLimpio) {
                                            todasLasRespuestas += `<div class="respuesta-individual"><strong>Respuesta Adicional (${fecha}):</strong><br>${contenidoLimpio.replace(/\n/g, '<br>')}</div>`;
                                        }
                                    }
                                }
                                
                                textoResp = `<div class="respuesta-text">${todasLasRespuestas}</div>`;
                            } else {
                                // Respuesta única
                                textoResp = `<div class="respuesta-text">${respuestaCompleta.replace(/\n/g, '<br>')}<br><small>${(r.fecha_respuesta||'').replace('T',' ').substring(0,19)}</small></div>`;
                            }
                        }
                        return `
                        <div class="reporte-card">
                            <div class="reporte-card__header">
                                <div class="reporte-card__title">${r.titulo || ''}</div>
                                <span class="estado-chip ${estadoClass}">${r.estado || ''}</span>
                                </div>
                            <div class="reporte-card__meta">
                                <span><i class="fas fa-calendar"></i> ${fecha}</span>
                                <span><i class="fas fa-building"></i> ${r.nombre_espacio || ''}</span>
                                </div>
                            <div class="reporte-card__respuesta">
                                <div class="reporte-card__motivo"><i class="fas fa-comment-dots"></i> ${r.contenido || 'Sin descripción disponible'}</div>
                                ${badgeResp}
                                ${textoResp ? `<div class="reporte-card__respuesta-text">${textoResp}</div>` : ''}
                            </div>
                            ${String(r.estado_admin||'').toLowerCase()==='pendiente' ? `<div style="display:flex; justify-content:flex-end; padding:.5rem 1rem 1rem;">
                                <button class="btn-delete-rating btn-delete-solicitud" data-id="${r.id_solicitud}" title="Eliminar solicitud">
                                    <i class="fas fa-trash"></i> Eliminar
                                </button>
                            </div>` : ''}
                        </div>`;
                    }).join('');
                    // Delegated click for delete buttons (avoid inline handlers)
                    try{
                        if (!wrapper._deleteBound){
                            wrapper.addEventListener('click', function(e){
                                const btn = e.target.closest('.btn-delete-solicitud');
                                if (!btn) return;
                                const id = btn.getAttribute('data-id');
                                if (!id) return;
                                const openFn = (window && typeof window.abrirConfirmacionEliminarSolicitud==='function')
                                    ? window.abrirConfirmacionEliminarSolicitud
                                    : function(idSolicitud){
                                        let ov=document.getElementById('confirmEliminarSolicitud');
                                        if(!ov){ ov=document.createElement('div'); ov.id='confirmEliminarSolicitud'; ov.className='confirmation-overlay'; document.body.appendChild(ov); }
                                        if (!(window && typeof window.cerrarConfirmacionEliminarSolicitud==='function')){
                                            window.cerrarConfirmacionEliminarSolicitud = function(){ const x=document.getElementById('confirmEliminarSolicitud'); if(x){ x.remove(); } };
                                        }
                                        if (!(window && typeof window.confirmarEliminarSolicitud==='function')){
                                            window.confirmarEliminarSolicitud = async function(idS){
                                                window.cerrarConfirmacionEliminarSolicitud();
                                                try{
                                                    const token=sessionStorage.getItem('token_sesion')||'';
                                                    const fd=new FormData(); fd.append('token', token); fd.append('id_solicitud', idS); fd.append('accion', 'eliminar');
                                                    const resp=await fetch('../backend/public/gestionar_solicitudes_horario.php', { method:'POST', body: fd });
                                                    const json=await resp.json();
                                                    if (!json.success){ mostrarCardEmergente(false, json.message||'No se pudo eliminar la solicitud'); return; }
                                                    mostrarCardEmergente(true, json.message||'Solicitud eliminada correctamente');
                                                    if (window.cargarSolicitudesCambioCliente) { await window.cargarSolicitudesCambioCliente(); }
                                                }catch(err){ mostrarCardEmergente(false, 'Error al eliminar la solicitud'); }
                                            };
                                        }
                                        ov.innerHTML=`
                                            <div class="confirmation-modal">
                                                <div class="confirmation-header"><i class="fas fa-trash"></i><h3>Eliminar solicitud</h3></div>
                                                <div class="confirmation-body">
                                                    <p>¿Seguro que deseas <strong>eliminar</strong> esta solicitud de cambio de horario?</p>
                                                    <div class="confirmation-warning">Solo puedes eliminar solicitudes en estado Pendiente.</div>
                                                </div>
                                                <div class="confirmation-actions">
                                                    <button class="btn-cancel" onclick="window.cerrarConfirmacionEliminarSolicitud()"><i class="fas fa-times"></i> Cancelar</button>
                                                    <button class="btn-confirm-delete" onclick="window.confirmarEliminarSolicitud(${Number(id)})"><i class="fas fa-trash"></i> Eliminar</button>
                                                </div>
                                            </div>`;
                                    };
                                openFn(Number(id));
                            });
                            wrapper._deleteBound = true;
                        }
                    }catch(_){}
                } catch (err) {
                    console.error('Error cargando reportes', err);
                    cardsWrapper.innerHTML = '<div style="color:#e74c3c; padding:1rem; text-align:center;">Error al cargar reportes</div>';
                }
            }

            cargarTablaReportes();

            form.addEventListener('submit', async (ev) => {
                ev.preventDefault();
                const id_asignacion = select.value.trim();
                const titulo = document.getElementById('reporteTitulo').value.trim();
                const contenido = document.getElementById('reporteContenido').value.trim();
                if (!id_asignacion || !titulo || !contenido) {
                    mostrarCardEmergente(false, 'Completa todos los campos');
                    return;
                }
                try {
                    const token = sessionStorage.getItem('token_sesion') || '';
                    const fd = new FormData();
                    fd.append('token', token);
                    fd.append('id_asignacion', id_asignacion);
                    fd.append('titulo', titulo);
                    fd.append('contenido', contenido);
                    const postUrl = '../backend/public/envioreportes.php';
                    console.log('[Reportes] POST to:', postUrl, 'payload:', { id_asignacion, titulo, contenido });
                    const resp = await fetch(postUrl, {
                        method: 'POST',
                        body: fd
                    });
                    const json = await resp.json();
                    console.log('[Reportes] POST response:', json);
                    if (json.success) {
                        mostrarCardEmergente(true, json.message || 'Reporte enviado');
                        form.reset();
                        cargarTablaReportes();
                    } else {
                        mostrarCardEmergente(false, json.message || 'No se pudo enviar');
                    }
                } catch (err) {
                    console.error('Error enviando reporte', err);
                    mostrarCardEmergente(false, 'Error del servidor');
                }
            });
        }

            async function cargarEspaciosAsignados() {
                const cont = document.getElementById('listaEspaciosAsignados');
                cont.innerHTML = '<div style="color:#888;text-align:center;padding:2rem;"><i class="fas fa-spinner fa-spin"></i> Cargando espacios asignados...</div>';
                try {
                    const token = sessionStorage.getItem('token_sesion') || '';
                    const res = await fetch(`../backend/public/espacios_asignados.php?token=${encodeURIComponent(token)}`);
                    const data = await res.json();
                    if (!data.success) {
                        cont.innerHTML = `<div style="color:#e74c3c;text-align:center;padding:2rem;">${data.message || 'No se pudieron cargar los espacios asignados.'}</div>`;
                        return;
                    }
                    if (!Array.isArray(data.espacios) || data.espacios.length === 0) {
                        cont.innerHTML = '<div style="color:#888;text-align:center;padding:2rem;">No tienes espacios asignados.</div>';
                        return;
                    }
                    // Poblar filtros básicos
                    const adminSelect = document.getElementById('filtroAdministrador');
                    const ubicacionSelect = document.getElementById('filtroUbicacion');
                    const admins = [...new Set(data.espacios.map(e => `${e.admin_nombre} ${e.admin_apellido}`))].filter(Boolean);
                    const ubicaciones = [...new Set(data.espacios.map(e => `${e.ciudad || ''}, ${e.region || ''}`.replace(/^,\s*/, '')))].filter(Boolean);
                    adminSelect.innerHTML = '<option value="">Todos los administradores</option>' + admins.map(a => `<option value="${a}">${a}</option>`).join('');
                    ubicacionSelect.innerHTML = '<option value="">Todas las ubicaciones</option>' + ubicaciones.map(u => `<option value="${u}">${u}</option>`).join('');

                    function render(lista) {
                        cont.innerHTML = lista.map(e => {
                            const admin = `${e.admin_nombre || ''} ${e.admin_apellido || ''}`.trim();
                            const ubic = [e.ciudad, e.region].filter(Boolean).join(', ');
                            const foto = Array.isArray(e.fotos) && e.fotos.length ? `../${e.fotos[0].replace(/^\/+/, '')}` : (e.foto1 ? `../${e.foto1.replace(/^\/+/, '')}` : '');
                            const nombreDia = e.nombre_dia || '';
                            const descHorario = e.descripcion_horario || '';
                            const horaIni = (e.hora_inicio ? String(e.hora_inicio).substring(0,5) : '');
                            const horaFin = (e.hora_fin ? String(e.hora_fin).substring(0,5) : '');
                            const rangoHora = (horaIni && horaFin) ? `${horaIni}-${horaFin}` : (horaIni || horaFin);
                            const rangoFecha = (e.fecha_inicio || e.fecha_termino) ? ` (${e.fecha_inicio || ''} a ${e.fecha_termino || ''})` : '';
                            const etiqueta = nombreDia || descHorario;
                            const horario = (etiqueta || rangoHora || rangoFecha)
                                ? `${etiqueta ? etiqueta + (rangoHora ? ' • ' : '') : ''}${rangoHora || ''}${rangoFecha}`
                                : 'Sin horario detallado';
                            const equip = Array.isArray(e.equipamiento) && e.equipamiento.length
                                ? e.equipamiento.map(it => `<span class="assign-chip"><span>${it.nombre_equipamiento}${it.cantidad?` (x${it.cantidad})`:''}</span></span>`).join(' ')
                                : '<span class="assign-chip-empty">Sin equipamiento registrado</span>';
                            const tipoEspacio = e.tipo_espacio || 'N/D';
                            const m2 = (e.metros_cuadrados !== undefined && e.metros_cuadrados !== null) ? Number(e.metros_cuadrados) : null;
                            const direccion = e.direccion || '';
                            const ubicacionInterna = e.ubicacion_interna || '';
                            // Obtener todas las imágenes disponibles (nueva estructura)
                            const imagenes = Array.isArray(e.fotos) && e.fotos.length ? e.fotos : [e.foto1].filter(Boolean);
                            const tieneImagenes = imagenes.length > 0;
                            const totalFotos = typeof e.num_fotos === 'number' && e.num_fotos > 0 ? e.num_fotos : imagenes.length;
                            
                            // Obtener icono según tipo de espacio
                            const iconoEspacio = obtenerIconoEspacio(tipoEspacio);
                            
                            return `
                                <div class="space-card" data-espacio-id="${e.id_espacio}">
                                    <div class="space-image-container" onclick="mostrarModalImagenesCliente(${e.id_espacio})" style="cursor: pointer;">
                                        ${foto ? `<img src="${foto}" alt="${e.nombre_espacio}" class="space-image">` : `<div class="space-icon-large"><i class="${iconoEspacio}"></i></div>`}
                                        ${tieneImagenes ? `
                                            <div class="image-gallery-indicator">
                                                <i class="fas fa-images"></i>
                                                <span>Ver más imágenes</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                    
                                    <div class="space-card-main">
                                        <div class="space-card-header">
                                            <div class="space-title-section">
                                                <h3 class="space-title">${e.nombre_espacio || 'Espacio'}</h3>
                                                <p class="space-type">${tipoEspacio}</p>
                                            </div>
                                            <div class="space-status-container">
                                                <div class="space-status assigned">
                                                    Asignado
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="space-card-content">
                                            <div class="space-info-grid">
                                                <div class="space-info-item">
                                                    <i class="fas fa-map-marker-alt"></i>
                                                    <span>${direccion || 'N/D'}, ${e.ciudad || 'N/D'}, ${e.region || 'N/D'}</span>
                                                </div>
                                                <div class="space-info-item">
                                                    <i class="fas fa-ruler"></i>
                                                    <span>${m2 !== null ? m2 : 'N/D'} m²</span>
                                                </div>
                                                ${ubicacionInterna !== 'N/D' ? `
                                                    <div class="space-info-item">
                                                        <i class="fas fa-door-open"></i>
                                                        <span>${ubicacionInterna}</span>
                                                    </div>
                                                ` : ''}
                                                <div class="space-info-item">
                                                    <i class="fas fa-user-tie"></i>
                                                    <span>${admin || 'N/D'}</span>
                                                </div>
                                                <div class="space-info-item">
                                                    <i class="fas fa-clock"></i>
                                                    <span>${horario}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="space-card-actions">
                                        <button class="report-btn" onclick="goToReportFromAsignacion(${e.id_asignacion})" title="Reporte">
                                            <i class="fas fa-file-alt"></i>
                                        </button>
                                        <button class="schedule-btn" onclick="goToCambioHorarioFromAsignacion(${e.id_asignacion})" title="Cambio de Horario">
                                            <i class="fas fa-calendar-alt"></i>
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('');
                    }

                    let lista = data.espacios;
                    render(lista);

                    function filtrar() {
                        const fAdmin = adminSelect.value || '';
                        const fUbic = ubicacionSelect.value || '';
                        const filtrada = data.espacios.filter(e => {
                            const admin = `${e.admin_nombre || ''} ${e.admin_apellido || ''}`.trim();
                            const ubic = [e.ciudad, e.region].filter(Boolean).join(', ');
                            const matchAdmin = !fAdmin || admin === fAdmin;
                            const matchUbic = !fUbic || ubic === fUbic;
                            return matchAdmin && matchUbic;
                        });
                        render(filtrada);
                    }

                    adminSelect.onchange = filtrar;
                    ubicacionSelect.onchange = filtrar;
                } catch (err) {
                    cont.innerHTML = '<div style="color:#e74c3c; padding:1rem; text-align:center;">Error al cargar los espacios.</div>';
                }
            }
            
            // Funciones para filtros de Espacios Asignados
            function aplicarFiltrosAsignados() {
                const adminSelect = document.getElementById('filtroAdministrador');
                const ubicacionSelect = document.getElementById('filtroUbicacion');
                const fAdmin = adminSelect.value || '';
                const fUbic = ubicacionSelect.value || '';
                
                // Obtener datos originales y aplicar filtros
                const cont = document.getElementById('listaEspaciosAsignados');
                const allCards = cont.querySelectorAll('.space-card');
                
                allCards.forEach(card => {
                    const adminText = card.querySelector('.space-info-item:nth-child(4) span')?.textContent || '';
                    const ubicText = card.querySelector('.space-info-item:first-child span')?.textContent || '';
                    
                    const matchAdmin = !fAdmin || adminText.includes(fAdmin);
                    const matchUbic = !fUbic || ubicText.includes(fUbic);
                    
                    if (matchAdmin && matchUbic) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            }
            
            function limpiarFiltrosAsignados() {
                const adminSelect = document.getElementById('filtroAdministrador');
                const ubicacionSelect = document.getElementById('filtroUbicacion');
                
                adminSelect.value = '';
                ubicacionSelect.value = '';
                
                // Mostrar todas las cards
                const cont = document.getElementById('listaEspaciosAsignados');
                const allCards = cont.querySelectorAll('.space-card');
                allCards.forEach(card => {
                    card.style.display = 'block';
                });
            }
            
            break;
        case 'Cambio de Horario':
            container.innerHTML = `
                <div class="welcome-card">
                    <div class="geometric-line-1"></div>
                    <div class="geometric-dot-1"></div>
                    <div class="geometric-square-1"></div>
                    <div class="geometric-rect-1"></div>
                    <div class="geometric-triangle-1"></div>
                    <div class="geometric-line-2"></div>
                    <div class="geometric-dot-2"></div>
                    <div class="geometric-square-2"></div>
                    <div class="geometric-rect-2"></div>
                    <div class="geometric-triangle-2"></div>
                    <div class="geometric-line-3"></div>
                    <div class="geometric-dot-3"></div>
                    <div class="geometric-square-3"></div>
                    <div class="geometric-rect-3"></div>
                    <div class="geometric-triangle-3"></div>
                    <div class="geometric-line-4"></div>
                    <div class="geometric-dot-4"></div>
                    <div class="geometric-square-4"></div>
                    <div class="geometric-rect-4"></div>
                    <div class="geometric-triangle-4"></div>
                    <div class="geometric-line-5"></div>
                    <div class="geometric-dot-5"></div>
                    <div class="geometric-square-5"></div>
                    <div class="geometric-rect-5"></div>
                    <div class="geometric-triangle-5"></div>
                    <div class="geometric-line-6"></div>
                    <div class="geometric-dot-6"></div>
                    <div class="geometric-square-6"></div>
                    <div class="geometric-rect-6"></div>
                    <div class="geometric-triangle-6"></div>
                    <div class="geometric-line-7"></div>
                    <div class="geometric-dot-7"></div>
                    <div class="geometric-square-7"></div>
                    <div class="geometric-rect-7"></div>
                    <div class="geometric-triangle-7"></div>
                    <div class="geometric-line-8"></div>
                    <div class="geometric-dot-8"></div>
                    <div class="geometric-square-8"></div>
                    <div class="geometric-rect-8"></div>
                    <div class="geometric-triangle-8"></div>
                    <div class="geometric-line-9"></div>
                    <div class="geometric-dot-9"></div>
                    <div class="geometric-square-9"></div>
                    <div class="geometric-rect-9"></div>
                    <div class="geometric-triangle-9"></div>
                    <div class="geometric-line-10"></div>
                    <div class="geometric-dot-10"></div>
                    <div class="geometric-square-10"></div>
                    <div class="geometric-rect-10"></div>
                    <div class="geometric-triangle-10"></div>
                    <h2>Cambio de Horario</h2>
                    <p>Solicita un cambio de horario para tus espacios asignados</p>
                </div>
                <div class="search-doctors-section">
                    <div class="search-doctors-card">
                        <h3>Enviar solicitud</h3>
                        <form id="formCambioHorario">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Espacio asignado</label>
                                    <select id="chgAsignacion" required>
                                        <option value="">Selecciona un espacio</option>
                                    </select>
                            </div>
                                <div class="form-group">
                                    <label>Nuevo horario</label>
                                    <input type="date" id="chgHorario" required />
                        </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group" style="grid-column:1 / -1">
                                    <label>Motivo</label>
                                    <textarea id="chgMotivo" rows="4" placeholder="Describe el motivo de la solicitud" required></textarea>
                        </div>
                            </div>
                            <button type="submit" class="update-password-btn"><i class="fas fa-paper-plane"></i> Enviar solicitud</button>
                        </form>
                        </div>
                </div>
                <div class="reports-section">
                    <div class="report-card reports-board">
                        <div class="reports-header">
                            <h3><i class="fas fa-clock"></i> Mis solicitudes de cambio de horario</h3>
                        </div>
                        <div id="solicitudesCambioList" class="reports-cards">Cargando solicitudes...</div>
                    </div>
                </div>
            `;
            // Poblar asignaciones
            (async () => {
                try {
                    const sel = document.getElementById('chgAsignacion');
                    const token = sessionStorage.getItem('token_sesion') || '';
                    const res = await fetch(`../backend/public/espacios_asignados.php?token=${encodeURIComponent(token)}`);
                    const data = await res.json();
                    if (data.success && Array.isArray(data.espacios)) {
                        sel.innerHTML = '<option value="">Selecciona un espacio</option>' + data.espacios.filter(e=>e.id_asignacion).map(e=>`<option value="${e.id_asignacion}">${e.nombre_espacio||'Espacio'} - ${[e.ciudad,e.region].filter(Boolean).join(', ')}</option>`).join('');
                        
                        // Preseleccionar si viene desde Espacios Asignados
                        const preselect = sessionStorage.getItem('preselect_asignacion_cambio');
                        if (preselect) {
                            sel.value = preselect;
                            sessionStorage.removeItem('preselect_asignacion_cambio');
                        }
                    }
                    const dateInput = document.getElementById('chgHorario');
                    if (dateInput) {
                        try { dateInput.min = new Date().toISOString().split('T')[0]; } catch(_) {}
                    }
                    await cargarSolicitudesCambio();
                } catch (e) { console.error('Error cargando asignaciones', e); }
            })();
            // Envío (placeholder)
            document.getElementById('formCambioHorario').addEventListener('submit', async (ev)=>{
                ev.preventDefault();
                const id_asignacion = (document.getElementById('chgAsignacion').value||'').trim();
                const fecha_solicitada = (document.getElementById('chgHorario').value||'').trim();
                const motivo = (document.getElementById('chgMotivo').value||'').trim();
                if (!id_asignacion || !fecha_solicitada || !motivo) {
                    mostrarCardEmergente(false, 'Completa todos los campos');
                    return;
                }
                try {
                    const token = sessionStorage.getItem('token_sesion') || '';
                    const fd = new FormData();
                    fd.append('token', token);
                    fd.append('id_asignacion', id_asignacion);
                    fd.append('fecha_solicitada', fecha_solicitada);
                    fd.append('motivo', motivo);
                    const resp = await fetch('../backend/public/solicitud_cambio_horario.php', { method:'POST', body: fd });
                    const json = await resp.json();
                    if (json.success) {
                        mostrarCardEmergente(true, json.message || 'Solicitud enviada');
                        ev.target.reset();
                        await cargarSolicitudesCambio();
                    } else {
                        mostrarCardEmergente(false, json.message || 'No se pudo enviar la solicitud');
                    }
                } catch (e) {
                    console.error('Error enviando solicitud', e);
                    mostrarCardEmergente(false, 'Error del servidor');
                }
            });

            async function cargarSolicitudesCambio() {
                const wrapper = document.getElementById('solicitudesCambioList');
                if (!wrapper) return;
                try {
                    const token = sessionStorage.getItem('token_sesion') || '';
                    const url = `../backend/public/solicitud_cambio_horario.php?token=${encodeURIComponent(token)}`;
                    const resp = await fetch(url);
                    const json = await resp.json();
                    if (!json.success) {
                        wrapper.innerHTML = `<div style="color:#e74c3c; padding:1rem; text-align:center;">${json.message || 'No se pudieron cargar las solicitudes'}</div>`;
                        return;
                    }
                    const rows = Array.isArray(json.solicitudes) ? json.solicitudes : [];
                    if (!rows.length) {
                        wrapper.innerHTML = '<div style="color:#888; padding:1rem; text-align:center;">No tienes solicitudes enviadas.</div>';
                        return;
                    }
                    wrapper.innerHTML = rows.map(r => {
                        const fechaSol = (r.fecha_solicitud || '').replace('T',' ').substring(0,19);
                        const fechaNueva = r.fecha_solicitada || '';
                        const fechaActualTxt = (r.actual_fecha_inicio || r.actual_fecha_termino)
                            ? `${r.actual_fecha_inicio || ''}${r.actual_fecha_termino ? ' a ' + r.actual_fecha_termino : ''}`
                            : 'Sin horario actual';
                        const estado = (r.estado_admin || '').toLowerCase();
                        const estadoClass = estado === 'aprobado' ? 'estado-resuelto' : (estado === 'rechazado' ? 'estado-revisado' : 'estado-enviado');
                        const respondido = (r.respuesta_admin && r.respuesta_admin.trim().length) ? true : false;
                        const badgeResp = respondido ? '<span class="respuesta-badge respuesta-ok">Respuesta</span>' : '';
                        const textoResp = respondido ? `<div class="respuesta-text">${(r.respuesta_admin||'').slice(0,160)}${(r.respuesta_admin||'').length>160?'...':''}${r.fecha_respuesta_admin?`<br><small>${(r.fecha_respuesta_admin||'').replace('T',' ').substring(0,19)}</small>`:''}</div>` : '';
                        const puedeEliminar = (String(r.estado_admin||'').toLowerCase()==='pendiente');
                        return `
                        <div class="reporte-card">
                            <div class="reporte-card__header">
                                <div class="reporte-card__title">${r.nombre_espacio || ''}</div>
                                <span class="estado-chip ${estadoClass}">${r.estado_admin || ''}</span>
                            </div>
                            <div class="reporte-card__meta">
                                <span><i class="fas fa-calendar-day"></i> Fecha solicitada: ${fechaNueva}</span>
                                <span><i class="fas fa-clock"></i> Fecha actual: ${fechaActualTxt}</span>
                            </div>
                            <div class="reporte-card__respuesta">
                                <div class="reporte-card__motivo"><i class="fas fa-comment-dots"></i> ${r.motivo ? r.motivo : 'Sin motivo'}</div>
                                ${badgeResp}
                                ${textoResp ? `<div class="reporte-card__respuesta-text">${textoResp}</div>` : ''}
                            </div>
                            ${puedeEliminar?`<div style="display:flex; justify-content:flex-end; padding:.5rem 1rem 1rem;">
                                <button class="btn-delete-rating btn-delete-solicitud" data-id="${r.id_solicitud}" title="Eliminar solicitud">
                                    <i class="fas fa-trash"></i> Eliminar
                                </button>
                            </div>`:''}
                        </div>`;
                    }).join('');
                    // Delegated click for delete buttons (avoid inline handlers)
                    try{
                        if (!wrapper._deleteBound){
                            wrapper.addEventListener('click', function(e){
                                const btn = e.target.closest('.btn-delete-solicitud');
                                if (!btn) return;
                                const id = btn.getAttribute('data-id');
                                if (!id) return;
                                const openFn = (window && typeof window.abrirConfirmacionEliminarSolicitud==='function')
                                    ? window.abrirConfirmacionEliminarSolicitud
                                    : function(idSolicitud){
                                        let ov=document.getElementById('confirmEliminarSolicitud');
                                        if(!ov){ ov=document.createElement('div'); ov.id='confirmEliminarSolicitud'; ov.className='confirmation-overlay'; document.body.appendChild(ov); }
                                        if (!(window && typeof window.cerrarConfirmacionEliminarSolicitud==='function')){
                                            window.cerrarConfirmacionEliminarSolicitud = function(){ const x=document.getElementById('confirmEliminarSolicitud'); if(x){ x.remove(); } };
                                        }
                                        if (!(window && typeof window.confirmarEliminarSolicitud==='function')){
                                            window.confirmarEliminarSolicitud = async function(idS){
                                                window.cerrarConfirmacionEliminarSolicitud();
                                                try{
                                                    const token=sessionStorage.getItem('token_sesion')||'';
                                                    const fd=new FormData(); fd.append('token', token); fd.append('id_solicitud', idS); fd.append('accion', 'eliminar');
                                                    const resp=await fetch('../backend/public/gestionar_solicitudes_horario.php', { method:'POST', body: fd });
                                                    const json=await resp.json();
                                                    if (!json.success){ mostrarCardEmergente(false, json.message||'No se pudo eliminar la solicitud'); return; }
                                                    mostrarCardEmergente(true, json.message||'Solicitud eliminada correctamente');
                                                    if (window.cargarSolicitudesCambioCliente) { await window.cargarSolicitudesCambioCliente(); }
                                                }catch(err){ mostrarCardEmergente(false, 'Error al eliminar la solicitud'); }
                                            };
                                        }
                                        ov.innerHTML=`
                                            <div class="confirmation-modal">
                                                <div class="confirmation-header"><i class="fas fa-trash"></i><h3>Eliminar solicitud</h3></div>
                                                <div class="confirmation-body">
                                                    <p>¿Seguro que deseas <strong>eliminar</strong> esta solicitud de cambio de horario?</p>
                                                    <div class="confirmation-warning">Solo puedes eliminar solicitudes en estado Pendiente.</div>
                                                </div>
                                                <div class="confirmation-actions">
                                                    <button class="btn-cancel" onclick="window.cerrarConfirmacionEliminarSolicitud()"><i class="fas fa-times"></i> Cancelar</button>
                                                    <button class="btn-confirm-delete" onclick="window.confirmarEliminarSolicitud(${Number(id)})"><i class="fas fa-trash"></i> Eliminar</button>
                                                </div>
                                            </div>`;
                                    };
                                openFn(Number(id));
                            });
                            wrapper._deleteBound = true;
                        }
                    }catch(_){}
                } catch (e) {
                    console.error('Error cargando solicitudes', e);
                    wrapper.innerHTML = '<div style="color:#e74c3c; padding:1rem; text-align:center;">Error al cargar solicitudes</div>';
                }
            }
            window.cargarSolicitudesCambioCliente = cargarSolicitudesCambio;
            break;
            
        case 'Calificaciones de Administrador':
            container.innerHTML = `
                <div class="welcome-card">
                    <div class="geometric-line-1"></div>
                    <div class="geometric-dot-1"></div>
                    <div class="geometric-square-1"></div>
                    <div class="geometric-rect-1"></div>
                    <div class="geometric-triangle-1"></div>
                    <div class="geometric-line-2"></div>
                    <div class="geometric-dot-2"></div>
                    <div class="geometric-square-2"></div>
                    <div class="geometric-rect-2"></div>
                    <div class="geometric-triangle-2"></div>
                    <div class="geometric-line-3"></div>
                    <div class="geometric-dot-3"></div>
                    <div class="geometric-square-3"></div>
                    <div class="geometric-rect-3"></div>
                    <div class="geometric-triangle-3"></div>
                    <div class="geometric-line-4"></div>
                    <div class="geometric-dot-4"></div>
                    <div class="geometric-square-4"></div>
                    <div class="geometric-rect-4"></div>
                    <div class="geometric-triangle-4"></div>
                    <div class="geometric-line-5"></div>
                    <div class="geometric-dot-5"></div>
                    <div class="geometric-square-5"></div>
                    <div class="geometric-rect-5"></div>
                    <div class="geometric-triangle-5"></div>
                    <div class="geometric-line-6"></div>
                    <div class="geometric-dot-6"></div>
                    <div class="geometric-square-6"></div>
                    <div class="geometric-rect-6"></div>
                    <div class="geometric-triangle-6"></div>
                    <div class="geometric-line-7"></div>
                    <div class="geometric-dot-7"></div>
                    <div class="geometric-square-7"></div>
                    <div class="geometric-rect-7"></div>
                    <div class="geometric-triangle-7"></div>
                    <div class="geometric-line-8"></div>
                    <div class="geometric-dot-8"></div>
                    <div class="geometric-square-8"></div>
                    <div class="geometric-rect-8"></div>
                    <div class="geometric-triangle-8"></div>
                    <div class="geometric-line-9"></div>
                    <div class="geometric-dot-9"></div>
                    <div class="geometric-square-9"></div>
                    <div class="geometric-rect-9"></div>
                    <div class="geometric-triangle-9"></div>
                    <div class="geometric-line-10"></div>
                    <div class="geometric-dot-10"></div>
                    <div class="geometric-square-10"></div>
                    <div class="geometric-rect-10"></div>
                    <div class="geometric-triangle-10"></div>
                    <div class="geometric-line-11"></div>
                    <div class="geometric-dot-11"></div>
                    <div class="geometric-square-11"></div>
                    <div class="geometric-rect-11"></div>
                    <div class="geometric-triangle-11"></div>
                    <div class="geometric-line-12"></div>
                    <div class="geometric-dot-12"></div>
                    <div class="geometric-square-12"></div>
                    <div class="geometric-rect-12"></div>
                    <div class="geometric-triangle-12"></div>
                    <div class="geometric-line-13"></div>
                    <div class="geometric-dot-13"></div>
                    <div class="geometric-square-13"></div>
                    <div class="geometric-rect-13"></div>
                    <div class="geometric-triangle-13"></div>
                    <div class="geometric-line-14"></div>
                    <div class="geometric-dot-14"></div>
                    <div class="geometric-square-14"></div>
                    <div class="geometric-rect-14"></div>
                    <div class="geometric-triangle-14"></div>
                    <div class="geometric-line-15"></div>
                    <div class="geometric-dot-15"></div>
                    <div class="geometric-square-15"></div>
                    <div class="geometric-rect-15"></div>
                    <div class="geometric-triangle-15"></div>
                    <div class="geometric-line-16"></div>
                    <div class="geometric-dot-16"></div>
                    <div class="geometric-square-16"></div>
                    <div class="geometric-rect-16"></div>
                    <div class="geometric-triangle-16"></div>
                    <div class="geometric-line-17"></div>
                    <div class="geometric-dot-17"></div>
                    <div class="geometric-square-17"></div>
                    <div class="geometric-rect-17"></div>
                    <div class="geometric-triangle-17"></div>
                    <div class="geometric-line-18"></div>
                    <div class="geometric-dot-18"></div>
                    <div class="geometric-square-18"></div>
                    <div class="geometric-rect-18"></div>
                    <div class="geometric-triangle-18"></div>
                    <div class="geometric-line-19"></div>
                    <div class="geometric-dot-19"></div>
                    <div class="geometric-square-19"></div>
                    <div class="geometric-rect-19"></div>
                    <div class="geometric-triangle-19"></div>
                    <div class="geometric-line-20"></div>
                    <div class="geometric-dot-20"></div>
                    <div class="geometric-square-20"></div>
                    <div class="geometric-rect-20"></div>
                    <div class="geometric-triangle-20"></div>
                    <h2>Calificaciones de Administrador</h2>
                    <p>Gestiona y revisa las calificaciones de los administradores</p>
                </div>

                <div class="calificaciones-section">

                    <!-- Formulario de calificación siempre visible -->
                    <div class="formulario-calificacion">
                        <h3>Calificar Administrador</h3>
                        <form id="formCalificacionAdmin" onsubmit="guardarCalificacionAdmin(event)">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="administradorSelect">Seleccionar Administrador *</label>
                                    <select id="administradorSelect" name="id_administrador" required>
                                        <option value="">Seleccionar administrador...</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label>Calificación *</label>
                                    <div class="rating-input">
                                        <div class="stars-input" id="starsInputAdmin">
                                            <i class="fas fa-star" data-rating="1"></i>
                                            <i class="fas fa-star" data-rating="2"></i>
                                            <i class="fas fa-star" data-rating="3"></i>
                                            <i class="fas fa-star" data-rating="4"></i>
                                            <i class="fas fa-star" data-rating="5"></i>
                                        </div>
                                        <span class="rating-text" id="ratingTextAdmin">Selecciona una calificación</span>
                                    </div>
                                    <input type="hidden" id="calificacionValueAdmin" name="calificacion" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="descripcionCalificacionAdmin">Descripción del Comportamiento *</label>
                                <textarea 
                                    id="descripcionCalificacionAdmin" 
                                    name="descripcion" 
                                    rows="3" 
                                    placeholder="Describe el comportamiento observado..."
                                    required
                                ></textarea>
                            </div>
                            
                            
                            <div class="form-actions">
                                <button type="submit" class="btn-primary">
                                    <i class="fas fa-save"></i>
                                    Guardar Calificación
                                </button>
                            </div>
                        </form>
                    </div>

                    <!-- Buscador de calificaciones por Nombre -->
                    <div class="buscar-calificaciones">
                        <h3>Buscar Calificaciones por Nombre</h3>
                        <div class="search-form">
                            <div class="form-group">
                                <label for="nombreBusquedaAdmin">Nombre del Administrador</label>
                                <div class="search-input-container">
                                    <input 
                                        type="text" 
                                        id="nombreBusquedaAdmin" 
                                        name="nombre_busqueda"
                                        placeholder="Ej: Juan Pérez"
                                        maxlength="50"
                                    >
                                    <button type="button" class="btn-search" onclick="buscarCalificacionesPorNombreAdmin()">
                                        <i class="fas fa-search"></i>
                                        Buscar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="calificaciones-list" id="calificacionesListAdmin">
                        <div class="loading-spinner">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>Cargando calificaciones...</p>
                        </div>
                    </div>
                </div>

                <!-- Modal para editar calificación -->
                <div id="modalEditarCalificacionAdmin" class="modal-overlay" style="display: none;">
                    <div class="modal-content modal-calificacion">
                        <div class="modal-header">
                            <h3>Editar Calificación</h3>
                            <button class="close-modal" onclick="cerrarModalEditarCalificacionAdmin()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form id="formEditarCalificacionAdmin" onsubmit="actualizarCalificacionAdmin(event)">
                                <div class="form-group">
                                    <label for="administradorSelectEditar">Administrador</label>
                                    <select id="administradorSelectEditar" name="id_administrador" required>
                                        <option value="">Seleccionar administrador...</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label>Calificación *</label>
                                    <div class="rating-input">
                                        <div class="stars-input" id="starsInputEditarAdmin">
                                            <i class="fas fa-star" data-rating="1"></i>
                                            <i class="fas fa-star" data-rating="2"></i>
                                            <i class="fas fa-star" data-rating="3"></i>
                                            <i class="fas fa-star" data-rating="4"></i>
                                            <i class="fas fa-star" data-rating="5"></i>
                                        </div>
                                        <span class="rating-text" id="ratingTextEditarAdmin">Selecciona una calificación</span>
                                    </div>
                                    <input type="hidden" id="calificacionValueEditarAdmin" name="calificacion" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="descripcionCalificacionEditarAdmin">Descripción del Comportamiento *</label>
                                    <textarea 
                                        id="descripcionCalificacionEditarAdmin" 
                                        name="descripcion" 
                                        rows="3" 
                                        placeholder="Describe el comportamiento observado..."
                                        required
                                    ></textarea>
                                </div>
                                
                                
                                <div class="modal-actions">
                                    <button type="button" class="btn-secondary" onclick="cerrarModalEditarCalificacionAdmin()">
                                        Cancelar
                                    </button>
                                    <button type="submit" class="btn-primary">
                                        <i class="fas fa-save"></i>
                                        Actualizar Calificación
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- Modal para mostrar calificaciones por Nombre -->
                <div id="modalCalificacionesNombreAdmin" class="modal-overlay" style="display: none;">
                    <div class="modal-content modal-calificaciones-nombre">
                        <div class="modal-header">
                            <h3>Calificaciones del Administrador</h3>
                            <button class="close-modal" onclick="cerrarModalCalificacionesNombreAdmin()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div id="administradorInfoNombre" class="cliente-info-nombre">
                                <!-- Información del administrador se carga aquí -->
                            </div>
                            <div id="calificacionesNombreListAdmin" class="calificaciones-nombre-list">
                                <div class="no-calificaciones">
                                    <i class="fas fa-star"></i>
                                    <p>No hay calificaciones registradas para este administrador</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            `;
            
            // Cargar calificaciones y administradores cuando se selecciona el menú
            setTimeout(() => {
                inicializarEstrellasAdmin();
                cargarAdministradorAsignado();
                // Cargar calificaciones después de que todo esté inicializado
                setTimeout(() => {
                    cargarCalificacionesAdmin();
                }, 50);
            }, 100);
            break;
        case 'Reportes':
            container.innerHTML = `
                <div class="welcome-card">
                    <div class="geometric-line-1"></div>
                    <div class="geometric-dot-1"></div>
                    <div class="geometric-square-1"></div>
                    <div class="geometric-rect-1"></div>
                    <div class="geometric-triangle-1"></div>
                    <div class="geometric-line-2"></div>
                    <div class="geometric-dot-2"></div>
                    <div class="geometric-square-2"></div>
                    <div class="geometric-rect-2"></div>
                    <div class="geometric-triangle-2"></div>
                    <div class="geometric-line-3"></div>
                    <div class="geometric-dot-3"></div>
                    <div class="geometric-square-3"></div>
                    <div class="geometric-rect-3"></div>
                    <div class="geometric-triangle-3"></div>
                    <div class="geometric-line-4"></div>
                    <div class="geometric-dot-4"></div>
                    <div class="geometric-square-4"></div>
                    <div class="geometric-rect-4"></div>
                    <div class="geometric-triangle-4"></div>
                    <div class="geometric-line-5"></div>
                    <div class="geometric-dot-5"></div>
                    <div class="geometric-square-5"></div>
                    <div class="geometric-rect-5"></div>
                    <div class="geometric-triangle-5"></div>
                    <div class="geometric-line-6"></div>
                    <div class="geometric-dot-6"></div>
                    <div class="geometric-square-6"></div>
                    <div class="geometric-rect-6"></div>
                    <div class="geometric-triangle-6"></div>
                    <div class="geometric-line-7"></div>
                    <div class="geometric-dot-7"></div>
                    <div class="geometric-square-7"></div>
                    <div class="geometric-rect-7"></div>
                    <div class="geometric-triangle-7"></div>
                    <div class="geometric-line-8"></div>
                    <div class="geometric-dot-8"></div>
                    <div class="geometric-square-8"></div>
                    <div class="geometric-rect-8"></div>
                    <div class="geometric-triangle-8"></div>
                    <div class="geometric-line-9"></div>
                    <div class="geometric-dot-9"></div>
                    <div class="geometric-square-9"></div>
                    <div class="geometric-rect-9"></div>
                    <div class="geometric-triangle-9"></div>
                    <div class="geometric-line-10"></div>
                    <div class="geometric-dot-10"></div>
                    <div class="geometric-square-10"></div>
                    <div class="geometric-rect-10"></div>
                    <div class="geometric-triangle-10"></div>
                    <h2>Reportes y Horarios</h2>
                    <p>Envía reportes sobre tus espacios asignados</p>
                </div>
                
                <div class="report-form-card">
                    <h3><i class="fas fa-file-alt"></i> Enviar Reporte de Incidencia</h3>
                    <form id="formEnviarReporte" class="report-form">
                        <div class="form-group">
                            <label for="reporteAsignacion">Espacio Asignado:</label>
                            <select id="reporteAsignacion" name="asignacion" required>
                                <option value="">Selecciona un espacio...</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="reporteTitulo">Título del Reporte:</label>
                            <input type="text" id="reporteTitulo" name="titulo" placeholder="Ej: Problema con el aire acondicionado" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="reporteContenido">Descripción del Problema:</label>
                            <textarea id="reporteContenido" name="contenido" placeholder="Describe detalladamente el problema o situación que deseas reportar..." rows="5" required></textarea>
                        </div>
                        
                        <button type="submit" class="btn-submit">
                            <i class="fas fa-paper-plane"></i> Enviar Reporte de Incidencia
                        </button>
                    </form>
                </div>
                
                <div class="reports-history-card">
                    <h3><i class="fas fa-history"></i> Historial de Reportes de Incidencias</h3>
                    <div id="reportesList" class="reports-list">
                        <div class="loading-message">
                            <i class="fas fa-spinner fa-spin"></i> Cargando reportes...
                        </div>
                    </div>
                </div>
            `;
            
            // Inicializar formulario de reportes
            inicializarFormularioReportes();
            cargarReportes();
            break;
            
        case 'Espacios Disponibles':
            container.innerHTML = `
                <div class="welcome-card">
                    <div class="geometric-line-1"></div>
                    <div class="geometric-dot-1"></div>
                    <div class="geometric-square-1"></div>
                    <div class="geometric-rect-1"></div>
                    <div class="geometric-triangle-1"></div>
                    <div class="geometric-line-2"></div>
                    <div class="geometric-dot-2"></div>
                    <div class="geometric-square-2"></div>
                    <div class="geometric-rect-2"></div>
                    <div class="geometric-triangle-2"></div>
                    <div class="geometric-line-3"></div>
                    <div class="geometric-dot-3"></div>
                    <div class="geometric-square-3"></div>
                    <div class="geometric-rect-3"></div>
                    <div class="geometric-triangle-3"></div>
                    <div class="geometric-line-4"></div>
                    <div class="geometric-dot-4"></div>
                    <div class="geometric-square-4"></div>
                    <div class="geometric-rect-4"></div>
                    <div class="geometric-triangle-4"></div>
                    <div class="geometric-line-5"></div>
                    <div class="geometric-dot-5"></div>
                    <div class="geometric-square-5"></div>
                    <div class="geometric-rect-5"></div>
                    <div class="geometric-triangle-5"></div>
                    <div class="geometric-line-6"></div>
                    <div class="geometric-dot-6"></div>
                    <div class="geometric-square-6"></div>
                    <div class="geometric-rect-6"></div>
                    <div class="geometric-triangle-6"></div>
                    <div class="geometric-line-7"></div>
                    <div class="geometric-dot-7"></div>
                    <div class="geometric-square-7"></div>
                    <div class="geometric-rect-7"></div>
                    <div class="geometric-triangle-7"></div>
                    <div class="geometric-line-8"></div>
                    <div class="geometric-dot-8"></div>
                    <div class="geometric-square-8"></div>
                    <div class="geometric-rect-8"></div>
                    <div class="geometric-triangle-8"></div>
                    <div class="geometric-line-9"></div>
                    <div class="geometric-dot-9"></div>
                    <div class="geometric-square-9"></div>
                    <div class="geometric-rect-9"></div>
                    <div class="geometric-triangle-9"></div>
                    <div class="geometric-line-10"></div>
                    <div class="geometric-dot-10"></div>
                    <div class="geometric-square-10"></div>
                    <div class="geometric-rect-10"></div>
                    <div class="geometric-triangle-10"></div>
                    <h2>Espacios Disponibles</h2>
                    <p>Explora y solicita espacios disponibles para tu uso</p>
                </div>
                
                <div class="available-spaces-section">
                    <div class="search-filters-card">
                        <h3><i class="fas fa-filter"></i> Filtros de Búsqueda</h3>
                        <div class="filters-grid">
                            <div class="filter-group">
                                <label for="filterRegion">Región:</label>
                                <select id="filterRegion" class="filter-select">
                                    <option value="">Todas las regiones</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label for="filterCiudad">Ciudad:</label>
                                <select id="filterCiudad" class="filter-select">
                                    <option value="">Todas las ciudades</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label for="filterTipo">Tipo de Espacio:</label>
                                <select id="filterTipo" class="filter-select">
                                    <option value="">Todos los tipos</option>
                                    <option value="Oficina">Oficina</option>
                                    <option value="Sala de reuniones">Sala de reuniones</option>
                                    <option value="Auditorio">Auditorio</option>
                                    <option value="Laboratorio">Laboratorio</option>
                                    <option value="Almacén">Almacén</option>
                                    <option value="Bodega">Bodega</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label for="filterMetros">Metros Cuadrados:</label>
                                <select id="filterMetros" class="filter-select">
                                    <option value="">Cualquier tamaño</option>
                                    <option value="0-50">0-50 m²</option>
                                    <option value="51-100">51-100 m²</option>
                                    <option value="101-200">101-200 m²</option>
                                    <option value="201+">201+ m²</option>
                                </select>
                            </div>
                        </div>
                        <div class="filter-actions">
                            <button class="btn-filter" onclick="aplicarFiltros()">
                                <i class="fas fa-search"></i> Buscar Espacios
                            </button>
                            <button class="btn-clear" onclick="limpiarFiltros()">
                                <i class="fas fa-times"></i> Limpiar Filtros
                            </button>
                        </div>
                    </div>
                    
                <div class="spaces-results-card">
                    <div class="spaces-header">
                        <h3><i class="fas fa-search"></i> Espacios Disponibles</h3>
                        <p>Explora y solicita espacios disponibles para tu uso</p>
                    </div>
                    <div id="espaciosDisponiblesList" class="spaces-list">
                        <div class="loading-message">
                            <i class="fas fa-spinner fa-spin"></i> Cargando espacios disponibles...
                        </div>
                    </div>
                </div>
                </div>
            `;
            
            // Inicializar la sección de espacios disponibles
            inicializarEspaciosDisponibles();
            break;
            
        case 'Privilegios':
            container.innerHTML = `
                <div class="welcome-card">
                    <div class="geometric-line-1"></div>
                    <div class="geometric-dot-1"></div>
                    <div class="geometric-square-1"></div>
                    <div class="geometric-rect-1"></div>
                    <div class="geometric-triangle-1"></div>
                    <div class="geometric-line-2"></div>
                    <div class="geometric-dot-2"></div>
                    <div class="geometric-square-2"></div>
                    <div class="geometric-rect-2"></div>
                    <div class="geometric-triangle-2"></div>
                    <div class="geometric-line-3"></div>
                    <div class="geometric-dot-3"></div>
                    <div class="geometric-square-3"></div>
                    <div class="geometric-rect-3"></div>
                    <div class="geometric-triangle-3"></div>
                    <div class="geometric-line-4"></div>
                    <div class="geometric-dot-4"></div>
                    <div class="geometric-square-4"></div>
                    <div class="geometric-rect-4"></div>
                    <div class="geometric-triangle-4"></div>
                    <div class="geometric-line-5"></div>
                    <div class="geometric-dot-5"></div>
                    <div class="geometric-square-5"></div>
                    <div class="geometric-rect-5"></div>
                    <div class="geometric-triangle-5"></div>
                    <div class="geometric-line-6"></div>
                    <div class="geometric-dot-6"></div>
                    <div class="geometric-square-6"></div>
                    <div class="geometric-rect-6"></div>
                    <div class="geometric-triangle-6"></div>
                    <div class="geometric-line-7"></div>
                    <div class="geometric-dot-7"></div>
                    <div class="geometric-square-7"></div>
                    <div class="geometric-rect-7"></div>
                    <div class="geometric-triangle-7"></div>
                    <div class="geometric-line-8"></div>
                    <div class="geometric-dot-8"></div>
                    <div class="geometric-square-8"></div>
                    <div class="geometric-rect-8"></div>
                    <div class="geometric-triangle-8"></div>
                    <div class="geometric-line-9"></div>
                    <div class="geometric-dot-9"></div>
                    <div class="geometric-square-9"></div>
                    <div class="geometric-rect-9"></div>
                    <div class="geometric-triangle-9"></div>
                    <div class="geometric-line-10"></div>
                    <div class="geometric-dot-10"></div>
                    <div class="geometric-square-10"></div>
                    <div class="geometric-rect-10"></div>
                    <div class="geometric-triangle-10"></div>
                    <h2>Privilegios de Administrador</h2>
                    <p>Obtén privilegios adicionales de administrador</p>
                </div>
                
                <div class="privileges-info-section">
                    <div class="privileges-info-card">
                        <div class="privileges-header">
                            <i class="fas fa-crown"></i>
                            <h3>Privilegios de Administrador</h3>
                        </div>
                        
                        <div class="privileges-content">
                            <div class="privileges-description">
                                <p>Como administrador tendrás acceso a:</p>
                        </div>
                            
                            <div class="privileges-features">
                                <div class="privilege-item">
                                    <div class="privilege-icon">
                                        <i class="fas fa-building"></i>
                                    </div>
                                    <div class="privilege-content">
                                        <h4>Gestión de Espacios</h4>
                                        <p>Crear, editar y administrar espacios médicos</p>
                                    </div>
                                </div>
                                
                                <div class="privilege-item">
                                    <div class="privilege-icon">
                                        <i class="fas fa-users"></i>
                                    </div>
                                    <div class="privilege-content">
                                        <h4>Gestión de Colaboradores</h4>
                                        <p>Administrar el personal de apoyo y colaboradores</p>
                                    </div>
                                </div>
                                
                                <div class="privilege-item">
                                    <div class="privilege-icon">
                                        <i class="fas fa-calendar-plus"></i>
                                    </div>
                                    <div class="privilege-content">
                                        <h4>Publicación de Espacios</h4>
                                        <p>Publicar espacios en arriendo y gestionar rentas</p>
                                    </div>
                                </div>
                                
                                <div class="privilege-item">
                                    <div class="privilege-icon">
                                        <i class="fas fa-star"></i>
                                    </div>
                                    <div class="privilege-content">
                                        <h4>Calificación de Clientes</h4>
                                        <p>Evaluar y calificar a los clientes del sistema</p>
                                    </div>
                                </div>
                                
                                <div class="privilege-item">
                                    <div class="privilege-icon">
                                        <i class="fas fa-chart-line"></i>
                                    </div>
                                    <div class="privilege-content">
                                        <h4>Reportes y Estadísticas</h4>
                                        <p>Acceder a reportes detallados y métricas del negocio</p>
                                    </div>
                                </div>
                                
                                <div class="privilege-item">
                                    <div class="privilege-icon">
                                        <i class="fas fa-cog"></i>
                                    </div>
                                    <div class="privilege-content">
                                        <h4>Configuración Avanzada</h4>
                                        <p>Personalizar configuraciones del sistema</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="privileges-benefits">
                                <h4>Beneficios Adicionales</h4>
                                <ul>
                                    <li><i class="fas fa-check"></i> <strong>Control total</strong> sobre tus espacios</li>
                                    <li><i class="fas fa-check"></i> <strong>Gestión de personal</strong> y colaboradores</li>
                                    <li><i class="fas fa-check"></i> <strong>Monetización</strong> de espacios mediante arriendos</li>
                                    <li><i class="fas fa-check"></i> <strong>Analytics avanzados</strong> para optimizar tu negocio</li>
                                    <li><i class="fas fa-check"></i> <strong>Prioridad</strong> en soporte técnico</li>
                                </ul>
                            </div>
                            
                            <div class="privileges-action">
                                <button class="btn-activate-privileges" onclick="mostrarConfirmacionActivarPrivilegiosAdmin()">
                                    <i class="fas fa-crown"></i>
                                    Activar Privilegios de Administrador
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
            
        
            
        default:
            // Mantener el contenido actual si no se reconoce la opción
            break;
    }
}

// ====== GENERAR REPORTES (Cliente) ======
function uiGenerarReportesCliente(container){
            container.innerHTML = `
                <div class="welcome-card">
            <div class="geometric-line-1"></div><div class="geometric-dot-1"></div><div class="geometric-square-1"></div><div class="geometric-rect-1"></div><div class="geometric-triangle-1"></div>
            <div class="geometric-line-2"></div><div class="geometric-dot-2"></div><div class="geometric-square-2"></div><div class="geometric-rect-2"></div><div class="geometric-triangle-2"></div>
            <div class="geometric-line-3"></div><div class="geometric-dot-3"></div><div class="geometric-square-3"></div><div class="geometric-rect-3"></div><div class="geometric-triangle-3"></div>
            <div class="geometric-line-4"></div><div class="geometric-dot-4"></div><div class="geometric-square-4"></div><div class="geometric-rect-4"></div><div class="geometric-triangle-4"></div>
            <div class="geometric-line-5"></div><div class="geometric-dot-5"></div><div class="geometric-square-5"></div><div class="geometric-rect-5"></div><div class="geometric-triangle-5"></div>
            <div class="geometric-line-6"></div><div class="geometric-dot-6"></div><div class="geometric-square-6"></div><div class="geometric-rect-6"></div><div class="geometric-triangle-6"></div>
            <div class="geometric-line-7"></div><div class="geometric-dot-7"></div><div class="geometric-square-7"></div><div class="geometric-rect-7"></div><div class="geometric-triangle-7"></div>
            <div class="geometric-line-8"></div><div class="geometric-dot-8"></div><div class="geometric-square-8"></div><div class="geometric-rect-8"></div><div class="geometric-triangle-8"></div>
            <div class="geometric-line-9"></div><div class="geometric-dot-9"></div><div class="geometric-square-9"></div><div class="geometric-rect-9"></div><div class="geometric-triangle-9"></div>
            <div class="geometric-line-10"></div><div class="geometric-dot-10"></div><div class="geometric-square-10"></div><div class="geometric-rect-10"></div><div class="geometric-triangle-10"></div>
            <h2>Generar Reportes</h2>
            <p>Crea y exporta reportes del sistema</p>
                </div>
        <div class="search-filters-card" style="margin:1rem 0;">
            <h3><i class="fas fa-filter"></i> Filtros del Reporte</h3>
            <div id="generarReportesFiltros" class="filters-grid">
                <div class="filter-group">
                    <label>Tipo de Reporte</label>
                    <select id="reporteTipo" class="filter-select">
                        <option value="asignaciones">Asignaciones de espacios</option>
                        <option value="solicitudes">Solicitudes de cambio de horario</option>
                        <option value="mis_reportes">Mis reportes enviados</option>
                    </select>
                        </div>
                <div class="filter-group">
                    <label>Desde</label>
                    <input type="date" id="reporteDesde" class="filter-select">
                        </div>
                <div class="filter-group">
                    <label>Hasta</label>
                    <input type="date" id="reporteHasta" class="filter-select">
                    </div>
                <div class="filter-group">
                    <label>Región</label>
                    <select id="reporteRegion" class="filter-select"><option value="">Todas</option></select>
                        </div>
                <div class="filter-group">
                    <label>Ciudad</label>
                    <select id="reporteCiudad" class="filter-select"><option value="">Todas</option></select>
                        </div>
                    </div>
            <div class="filter-actions">
                <button id="btnGenerarReporte" class="btn-filter"><i class="fas fa-sync-alt"></i> Generar</button>
                <button id="btnExportarPDF" class="btn-clear"><i class="fas fa-file-pdf"></i> Exportar PDF</button>
                </div>
        </div>
        <div id="reporteResultsCard" class="reports-results-card"><div class="reports-results-header"><h3><i class="fas fa-table"></i> Resultados del Reporte</h3><p id="reporteResumen" class="reports-results-subtitle"></p></div><div class="reports-results-body"><div id="reporteResultado"></div></div></div>
    `;
}

function inicializarGeneradorReportesCliente(){
    cargarRegionesParaReportesCliente();
    const selRegion=document.getElementById('reporteRegion'); if (selRegion) selRegion.onchange = actualizarCiudadesParaReportesCliente;
    const btnGen=document.getElementById('btnGenerarReporte'); if (btnGen) { btnGen.onclick = generarReporteCliente; } else { try{ mostrarCardEmergente(false,'No se encontró el botón Generar'); }catch(_){} }
    const btnPDF=document.getElementById('btnExportarPDF'); if (btnPDF) { btnPDF.onclick = exportarPDFReporteCliente; } else { try{ mostrarCardEmergente(false,'No se encontró el botón Exportar PDF'); }catch(_){} }
    const d=document.getElementById('reporteDesde'); const h=document.getElementById('reporteHasta');
    if (d && h){ d.addEventListener('change', function(){ if (this.value){ h.min=this.value; if (h.value && h.value < this.value) h.value=this.value; } else { h.removeAttribute('min'); } }); h.addEventListener('change', function(){ if (d.value && this.value && this.value < d.value) this.value=d.value; }); }
}
async function cargarRegionesParaReportesCliente(){ try{ const resp=await fetch('../backend/public/regiones_chile.php?action=regiones'); const json=await resp.json(); const sel=document.getElementById('reporteRegion'); if (!sel) return; if (json.success){ json.regiones.forEach(r=>{ const opt=document.createElement('option'); opt.value=r.nombre_region; opt.textContent=r.nombre_region; sel.appendChild(opt); }); } }catch(e){} }
async function actualizarCiudadesParaReportesCliente(){ try{ const nombreRegion=(document.getElementById('reporteRegion')||{}).value||''; const selC=document.getElementById('reporteCiudad'); if (!selC) return; selC.innerHTML='<option value="">Todas</option>'; if (!nombreRegion) return; const regResp=await fetch('../backend/public/regiones_chile.php?action=regiones'); const regJson=await regResp.json(); const region=(regJson.regiones||[]).find(r=>r.nombre_region===nombreRegion); if (!region) return; const resp=await fetch(`../backend/public/regiones_chile.php?action=ciudades&id_region=${region.id_region}`); const json=await resp.json(); if (json.success){ json.ciudades.forEach(c=>{ const opt=document.createElement('option'); opt.value=c.nombre_ciudad; opt.textContent=c.nombre_ciudad; selC.appendChild(opt); }); } }catch(e){} }
function leerFiltrosReporteCliente(){ return { tipo:(document.getElementById('reporteTipo')||{}).value||'asignaciones', desde:(document.getElementById('reporteDesde')||{}).value||'', hasta:(document.getElementById('reporteHasta')||{}).value||'', region:(document.getElementById('reporteRegion')||{}).value||'', ciudad:(document.getElementById('reporteCiudad')||{}).value||'' }; }

async function generarReporteCliente(){
    const filtros=leerFiltrosReporteCliente();
    const card=document.getElementById('reporteResultsCard');
    const cont=document.getElementById('reporteResultado');
    if (!cont || !card) { try{ mostrarCardEmergente(false,'Error de interfaz: contenedor de reportes no encontrado'); }catch(_){} return; }
    if (filtros.desde && filtros.hasta && filtros.hasta < filtros.desde){ try{ mostrarCardEmergente(false, 'La fecha "Hasta" no puede ser inferior a "Desde"'); }catch(_){} return; }
    cont.innerHTML='<div style="color:#888;padding:1rem;"><i class="fas fa-spinner fa-spin"></i> Generando...</div>';
    card.style.display='block';
    try{
        let data=[];
        switch(filtros.tipo){
            case 'asignaciones': data=await reporteClienteAsignaciones(filtros); break;
            case 'solicitudes': data=await reporteClienteSolicitudes(filtros); break;
            case 'mis_reportes': data=await reporteClienteMisReportes(filtros); break;
            default: data=[];
        }
        window.__datosReporteCliente = Array.isArray(data)?data:[];
        /* log removido: Generar (filas) */
        renderTablaReporteCliente(window.__datosReporteCliente);
        /* log removido: Render 0 filas */
    }catch(e){
        console.error('[Cliente][GenerarReporte] Error:', e);
        cont.innerHTML='<div style="color:#e74c3c;padding:1rem;">Error al generar el reporte</div>';
    }
}
function renderTablaReporteCliente(rows){ const cont=document.getElementById('reporteResultado'); const card=document.getElementById('reporteResultsCard'); const resumen=document.getElementById('reporteResumen'); if (!cont) return; if (!rows||!rows.length){ cont.innerHTML='<div style="color:#888;padding:1rem;">Sin resultados para los filtros seleccionados.</div>'; if (resumen) resumen.textContent=''; if (card) card.style.display='block'; return; } const cols=Object.keys(rows[0]); let html='<div style="overflow:auto;"><table class="reports-table">'; html+='<thead><tr>'+cols.map(c=>`<th>${c}</th>`).join('')+'</tr></thead>'; html+='<tbody>'+rows.map(r=>'<tr>'+cols.map(c=>`<td>${(r[c]==null)?'':String(r[c])}</td>`).join('')+'</tr>').join('')+'</tbody>'; html+='</table></div>'; cont.innerHTML=html; if (resumen){ let extra=''; if (rows[0]['Fecha asignación']!==undefined){ const fechas=rows.map(r=>String(r['Fecha asignación']||'').trim()).filter(Boolean).sort(); if (fechas.length){ extra = fechas.length===1 ? ` • Fecha asignación: ${fechas[0]}` : ` • Fecha asignación: ${fechas[0]} - ${fechas[fechas.length-1]}`; } } resumen.textContent=`Filas: ${rows.length}${extra}`; } if (card) card.style.display='block'; }
function getClienteIdFromSession(){ try{ const u=JSON.parse(sessionStorage.getItem('usuario_logueado')||'{}'); return u.id_usuario||''; }catch(e){ return ''; } }

async function cargarDashboardCliente(){
    try{
        const token = sessionStorage.getItem('token_sesion')||'';
        const idCliente = getClienteIdFromSession();
        const base = '../backend/public/';
        const [asigR, solR, repR] = await Promise.all([
            fetch(`${base}espacios_asignados.php?token=${encodeURIComponent(token)}`),
            fetch(`${base}gestionar_solicitudes_horario.php?token=${encodeURIComponent(token)}&id_usuario_cliente=${encodeURIComponent(idCliente)}`),
            fetch(`${base}envioreportes.php?token=${encodeURIComponent(token)}`)
        ]);

        // Espacios asignados
        let asigJson={}; try{ asigJson=await asigR.json(); }catch{ asigJson={}; }
        const espacios=(asigJson&&asigJson.success&&Array.isArray(asigJson.espacios))?asigJson.espacios:[];
        const asig_total=espacios.length;

        // Solicitudes del cliente
        let solJson={}; try{ solJson=await solR.json(); }catch{ solJson={}; }
        const solicitudes=(solJson&&solJson.success&&Array.isArray(solJson.solicitudes))?solJson.solicitudes:[];
        const sol_total=solicitudes.length;
        const sol_aprobadas=solicitudes.filter(s=>String(s.estado_admin||'').toLowerCase()==='aprobado').length;
        const sol_rechazadas=solicitudes.filter(s=>String(s.estado_admin||'').toLowerCase()==='rechazado').length;
        const sol_pendientes=sol_total - sol_aprobadas - sol_rechazadas;

        // Reportes del cliente
        let repJson={}; try{ repJson=await repR.json(); }catch{ repJson={}; }
        const reportes=(repJson&&repJson.success&&Array.isArray(repJson.reportes))?repJson.reportes: (Array.isArray(repJson)?repJson:[]);
        const rep_total=reportes.length;
        const lower=(v)=>String(v||'').toLowerCase();
        const rep_enviados=reportes.filter(r=>lower(r.estado)==='enviado').length;
        const rep_resueltos=reportes.filter(r=>lower(r.estado)==='resuelto').length;
        const rep_revisados=reportes.filter(r=>lower(r.estado)==='revisado').length;

        // Mis calificaciones de espacios (conteo desde backend)
        let cal_esp_mis=0;
        try{
            const r=await fetch('/GestionDeEspacios/backend/public/calificar_espacios.php', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:`action=obtener_calificaciones_de_cliente&id_usuario=${encodeURIComponent(idCliente)}` });
            const j=await r.json();
            if (j&&j.success&&(typeof j.total!=='undefined')) cal_esp_mis = Number(j.total)||0;
        }catch{ /* si no existe acción, dejar 0 */ }

        const setNum=(id,val)=>{ const el=document.getElementById(id); if (el) el.textContent=String(val); };
        setNum('asig_total_c', asig_total);
        setNum('cal_esp_mis_c', cal_esp_mis);
        setNum('sol_total_cli', sol_total);
        setNum('sol_aprobadas_cli', sol_aprobadas);
        setNum('sol_rechazadas_cli', sol_rechazadas);
        setNum('sol_pendientes_cli', sol_pendientes);
        setNum('rep_total_cli', rep_total);
        setNum('rep_enviados_cli', rep_enviados);
        setNum('rep_resueltos_cli', rep_resueltos);
        setNum('rep_revisados_cli', rep_revisados);
    }catch(e){ console.error('Dashboard cliente error', e); }
}

async function exportarPDFReporteCliente(){ const datos=window.__datosReporteCliente||[]; if (!datos.length){ mostrarCardEmergente(false,'No hay datos para exportar'); return;} await cargarScriptSiNoExiste('jspdf','https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'); await cargarScriptSiNoExiste('jspdf-autotable','https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js'); const {jsPDF}=window.jspdf||{}; if (!jsPDF){ mostrarCardEmergente(false,'No se pudo cargar el generador de PDF'); return;} const cols=Object.keys(datos[0]); const rows=datos.map(r=>cols.map(c=>(r[c]==null)?'':String(r[c]))); const doc=new jsPDF('p','pt'); const tipoSel=(document.getElementById('reporteTipo')||{}); const tipoTexto=(tipoSel.options||[])[tipoSel.selectedIndex||0]?.text||'Reporte'; const titulo='Informe'; const subtitulo=tipoTexto; const filtros=leerFiltrosReporteCliente(); doc.setTextColor(26,42,62); doc.setFont('helvetica','bold'); doc.setFontSize(20); doc.text(titulo,40,48); doc.setFont('helvetica','normal'); doc.setFontSize(14); doc.text(subtitulo,40,70); doc.setDrawColor(230,234,240); doc.line(40,80,555,80); doc.setFontSize(10); doc.setTextColor(90,99,110); const ahora=new Date(); const metaY1=100, metaY2=116; const label=(t,x,y)=>{doc.setFont('helvetica','bold');doc.text(t,x,y);doc.setFont('helvetica','normal');}; const val=(t,x,y)=>{doc.text(t,x,y);} ; label('Generado:',40,metaY1); val(ahora.toLocaleString(),110,metaY1); label('Desde:',40,metaY2); val(filtros.desde||'-',85,metaY2); label('Hasta:',200,metaY2); val(filtros.hasta||'-',245,metaY2); label('Región:',360,metaY2); val(filtros.region||'Todas',410,metaY2); label('Ciudad:',480,metaY2); val(filtros.ciudad||'Todas',532,metaY2); if (doc.autoTable){ doc.autoTable({head:[cols], body:rows, startY:140, styles:{fontSize:9, cellPadding:6, textColor:[44,62,80]}, headStyles:{fillColor:[26,42,62], halign:'left'}, margin:{left:40, right:40}});} else { let y=150; doc.setFontSize(8); doc.text(cols.join(' | '),40,y); y+=14; rows.forEach(r=>{ doc.text(String(r.join(' | ')).slice(0,1000),40,y); y+=12; if (y>760){ doc.addPage(); y=40; } }); } const nombre=`informe_${String(tipoTexto||'reporte').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-_]/g,'').replace(/\s+/g,'_').replace(/_+/g,'_').replace(/^_+|_+$/g,'')}.pdf`; doc.save(nombre); }

// Cargador dinámico de scripts si no existe
async function cargarScriptSiNoExiste(nombreGlobal, url){
    try{
        if (nombreGlobal==='jspdf' && window.jspdf) return;
        if (nombreGlobal==='jspdf-autotable' && window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API && window.jspdf.jsPDF.API.autoTable) return;
        await new Promise((resolve,reject)=>{
            const s=document.createElement('script');
            s.src=url; s.async=true; s.onload=resolve; s.onerror=reject; document.head.appendChild(s);
        });
    }catch(e){ console.error('Error cargando script', nombreGlobal, e); }
}

// Reportes cliente
async function reporteClienteAsignaciones(f){ const token=sessionStorage.getItem('token_sesion')||''; if (!token) return []; try{ const res=await fetch(`../backend/public/espacios_asignados.php?token=${encodeURIComponent(token)}`); const text=await res.text(); /* log removido: Asignaciones (resp) */ let data={}; try{ data=JSON.parse(text);}catch{ data={success:false, espacios:[]}; } const arr=(data.success && Array.isArray(data.espacios))?data.espacios:[]; let rows=arr.map(e=>{ const nombreDia=e.nombre_dia||''; const horaIni=e.hora_inicio?String(e.hora_inicio).substring(0,5):''; const horaFin=e.hora_fin?String(e.hora_fin).substring(0,5):''; const rangoHora=(horaIni&&horaFin)?`${horaIni}-${horaFin}`:(horaIni||horaFin); const rangoFecha=(e.fecha_inicio||e.fecha_termino)?` (${e.fecha_inicio||''} a ${e.fecha_termino||''})`:''; const horario=(nombreDia||rangoHora||rangoFecha)?`${nombreDia?nombreDia+(rangoHora?' • ':''):''}${rangoHora||''}${rangoFecha}`:'Sin horario detallado'; const fechaAsignacion = e.fecha_asignacion || e.fecha_inicio || ''; return { 'Nombre del espacio': e.nombre_espacio, 'Tipo de espacio': e.tipo_espacio, 'Región': e.region, 'Ciudad': e.ciudad, 'Dirección': e.direccion, 'Horario': horario, 'Fecha asignación': fechaAsignacion }; }); if (f.region) rows=rows.filter(r=>r['Región']===f.region); if (f.ciudad) rows=rows.filter(r=>r['Ciudad']===f.ciudad); if (f.desde||f.hasta){ const desde=f.desde?new Date(f.desde):null; const hasta=f.hasta?new Date(f.hasta):null; rows=rows.filter(r=>{ const v=(r['Horario'].match(/\(([^)]+)\)/)||[])[1]||''; const dReferencia = (r['Fecha asignación'] && !isNaN(new Date(r['Fecha asignación'])))? new Date(r['Fecha asignación']) : (v? new Date((v.split(' a ')[0]||'')) : null); if (!dReferencia) return true; if (desde && dReferencia<desde) return false; if (hasta && dReferencia>hasta) return false; return true; }); } return rows; } catch(e) { /* log removido: Asignaciones (error) */ return []; } }

async function reporteClienteSolicitudes(f){ const token=sessionStorage.getItem('token_sesion')||''; if (!token) return []; try{ const url=`../backend/public/solicitud_cambio_horario.php?token=${encodeURIComponent(token)}`; const resp=await fetch(url); const text=await resp.text(); /* log removido: Solicitudes (resp) */ let json={}; try{ json=JSON.parse(text);}catch{ json={success:false, solicitudes:[]}; } const arr=(json.success && Array.isArray(json.solicitudes))?json.solicitudes:[]; let rows=arr.map(s=>{ const respTxt=(s.respuesta_admin||'').trim(); return { 'Estado': s.estado_admin||'Pendiente', 'Fecha creación': s.fecha_solicitud||'', 'Nombre del espacio': s.nombre_espacio||'', 'Motivo': s.motivo||'', 'Respuesta': respTxt || 'Sin respuesta' }; }); if (f.desde||f.hasta){ const desde=f.desde?new Date(f.desde):null; const hasta=f.hasta?new Date(f.hasta):null; rows=rows.filter(r=>{ const d=new Date(String(r['Fecha creación']).substring(0,10)); if (isNaN(d)) return false; if (desde && d<desde) return false; if (hasta && d>hasta) return false; return true; }); } return rows; } catch(e) { /* log removido: Solicitudes (error) */ return []; } }

async function reporteClienteMisReportes(f){ const token=sessionStorage.getItem('token_sesion')||''; try{ const resp=await fetch(`../backend/public/envioreportes.php?token=${encodeURIComponent(token)}`); const text=await resp.text(); let json={}; try{ json=JSON.parse(text);}catch{} const arr=(json.success && Array.isArray(json.reportes))?json.reportes: (Array.isArray(json)&&json)||[]; let rows=arr.map(r=>{ const respTxt=(r.respuesta_admin||'').trim(); return { 'Fecha creación': r.fecha_creacion||'', 'Título': r.titulo||'', 'Contenido': r.contenido||'', 'Estado': r.estado||'', 'Nombre del espacio': r.nombre_espacio||'', 'Respuesta': respTxt || 'Sin respuesta' }; }); if (f.desde||f.hasta){ const desde=f.desde?new Date(f.desde):null; const hasta=f.hasta?new Date(f.hasta):null; rows=rows.filter(r=>{ const d=new Date(String(r['Fecha creación']).substring(0,10)); if (isNaN(d)) return false; if (desde && d<desde) return false; if (hasta && d>hasta) return false; return true; }); } return rows; } catch { return []; } }

// Log emergente para depurar respuestas
function mostrarLogEmergenteCliente(titulo, mensaje){
    try{
        let wrap=document.getElementById('overlay-log-reportes-cliente');
        if(!wrap){ wrap=document.createElement('div'); wrap.id='overlay-log-reportes-cliente'; wrap.style.position='fixed'; wrap.style.right='20px'; wrap.style.bottom='20px'; wrap.style.zIndex='100000'; wrap.style.display='flex'; wrap.style.flexDirection='column'; wrap.style.gap='10px'; document.body.appendChild(wrap); }
        const card=document.createElement('div');
        card.style.background='rgba(26,26,26,0.96)'; card.style.color='#ffd700'; card.style.border='1px solid #333'; card.style.borderLeft='4px solid #ffd700'; card.style.borderRadius='10px'; card.style.boxShadow='0 8px 28px rgba(0,0,0,0.35)'; card.style.padding='12px 14px'; card.style.maxWidth='420px'; card.style.fontSize='12px'; card.style.whiteSpace='pre-wrap'; card.innerHTML=`<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.3rem;"><i class='fas fa-bug'></i><b>${titulo}</b><button style="margin-left:auto;background:none;border:none;color:#aaa;cursor:pointer;" onclick="this.parentElement.parentElement.remove()">✕</button></div><div style='color:#e0e0e0;'>${mensaje}</div>`;
        wrap.appendChild(card); setTimeout(()=>{ try{ card.remove(); }catch{} }, 6000);
    }catch{}
}

async function reporteClienteMensajes(f){ const token=sessionStorage.getItem('token_sesion')||''; try{ const resp=await fetch(`../backend/public/mensajes.php?token=${encodeURIComponent(token)}`); const text=await resp.text(); let json={}; try{ json=JSON.parse(text);}catch{} const arr=(json.success && Array.isArray(json.mensajes))?json.mensajes: (Array.isArray(json)&&json)||[]; let rows=arr.map(m=>({ 'Fecha': m.fecha||m.fecha_creacion||'', 'Tipo': m.tipo||m.categoria||'', 'Asunto': m.asunto||m.titulo||'', 'Contenido': m.contenido||m.mensaje||'' })); if (f.desde||f.hasta){ const desde=f.desde?new Date(f.desde):null; const hasta=f.hasta?new Date(f.hasta):null; rows=rows.filter(r=>{ const d=new Date(String(r['Fecha']).substring(0,10)); if (isNaN(d)) return false; if (desde && d<desde) return false; if (hasta && d>hasta) return false; return true; }); } return rows; } catch { return []; } }

async function reporteClientePerfil(){ try{ const usuario=JSON.parse(sessionStorage.getItem('usuario_logueado')||'{}'); return [ { 'Nombre': `${usuario.nombre||''} ${usuario.apellido||''}`.trim(), 'Usuario': usuario.nombre_usuario||'', 'Correo': usuario.correo_electronico||'', 'Teléfono': usuario.telefono||'', 'Región': usuario.region||'', 'Ciudad': usuario.ciudad||'', 'Dirección': usuario.direccion||'' } ]; } catch { return []; } }

// Función para cargar datos del perfil
// Función para cargar datos del perfil
async function cargarDatosPerfil() {
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    
    if (usuarioLogueado) {
        try {
            const usuario = JSON.parse(usuarioLogueado);
            
            document.getElementById('profileName').textContent = `${usuario.nombre} ${usuario.apellido}`;
            document.getElementById('profileNombreUsuario').value = usuario.nombre_usuario || '';
            document.getElementById('profileNombre').value = usuario.nombre || '';
            document.getElementById('profileApellido').value = usuario.apellido || '';
            document.getElementById('profileEmail').value = usuario.correo_electronico || '';
            document.getElementById('profileTelefono').value = usuario.telefono || '';
            document.getElementById('profileDireccion').value = usuario.direccion || '';
            
            // Cargar regiones y ciudades automáticamente
            await cargarRegionesYCiudades();
            
            // Esperar un poco para que se rendericen las opciones
            setTimeout(async () => {
                // Establecer valores de región y ciudad
                if (usuario.region) {
                    const regionSelect = document.getElementById('profileRegion');
                    regionSelect.value = usuario.region;
                    
                    // Cargar ciudades para la región seleccionada
                    await cargarCiudadesPorRegion(usuario.region);
                    
                    // Esperar un poco más y establecer la ciudad
                    setTimeout(() => {
                        if (usuario.ciudad) {
                            const ciudadSelect = document.getElementById('profileCiudad');
                            ciudadSelect.value = usuario.ciudad;
                        }
                    }, 500);
                }
            }, 500);
        } catch (error) {
            console.error('Error al cargar datos del perfil:', error);
        }
    }
}

// Variables para almacenar datos originales
let datosOriginales = {};

// Función para cargar regiones y ciudades
async function cargarRegionesYCiudades() {
    try {
        const response = await fetch('../backend/public/regiones_chile.php?action=regiones');
        const data = await response.json();
        
        const regionSelect = document.getElementById('profileRegion');
        regionSelect.innerHTML = '<option value="">Selecciona una región</option>';
        
        // Verificar si la respuesta tiene la estructura correcta
        if (data.success && data.regiones) {
            // Llenar select de regiones
            data.regiones.forEach(regionObj => {
                const option = document.createElement('option');
                option.value = regionObj.nombre_region;
                option.textContent = regionObj.nombre_region;
                regionSelect.appendChild(option);
            });
        }
        
        // Agregar evento para cargar ciudades cuando cambie la región
        regionSelect.addEventListener('change', function() {
            if (this.value) {
                cargarCiudadesPorRegion(this.value);
            } else {
                const ciudadSelect = document.getElementById('profileCiudad');
                ciudadSelect.innerHTML = '<option value="">Selecciona una ciudad</option>';
            }
        });
        
    } catch (error) {
        console.error('Error al cargar regiones:', error);
    }
}

// Función para cargar ciudades por región (para perfil)
async function cargarCiudadesPorRegion(region) {
    try {
        // Buscar el ID de la región
        const regionesResponse = await fetch('../backend/public/regiones_chile.php?action=regiones');
        const regionesData = await regionesResponse.json();
        
        if (!regionesData.success || !regionesData.regiones) {
            return;
        }
        
        const regionObj = regionesData.regiones.find(r => r.nombre_region === region);
        if (!regionObj) {
            return;
        }
        
        const response = await fetch(`../backend/public/regiones_chile.php?action=ciudades&id_region=${regionObj.id_region}`);
        const data = await response.json();
        
        const ciudadSelect = document.getElementById('profileCiudad');
        ciudadSelect.innerHTML = '<option value="">Selecciona una ciudad</option>';
        
        if (data.success && data.ciudades) {
            data.ciudades.forEach(ciudadObj => {
                const option = document.createElement('option');
                option.value = ciudadObj.nombre_ciudad;
                option.textContent = ciudadObj.nombre_ciudad;
                ciudadSelect.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error al cargar ciudades:', error);
    }
}

// Función para alternar modo de edición del perfil
function toggleEditProfile() {
    const editBtn = document.getElementById('editProfileBtn');
    const profileActions = document.getElementById('profileActions');
    const inputs = ['profileNombreUsuario', 'profileNombre', 'profileApellido', 'profileEmail', 'profileTelefono', 'profileRegion', 'profileCiudad', 'profileDireccion'];
    
    if (editBtn.textContent.includes('Editar')) {
        // Guardar datos originales
        datosOriginales = {
            nombre_usuario: document.getElementById('profileNombreUsuario').value,
            nombre: document.getElementById('profileNombre').value,
            apellido: document.getElementById('profileApellido').value,
            email: document.getElementById('profileEmail').value,
            telefono: document.getElementById('profileTelefono').value,
            region: document.getElementById('profileRegion').value,
            ciudad: document.getElementById('profileCiudad').value,
            direccion: document.getElementById('profileDireccion').value
        };
        
        // Habilitar campos
        inputs.forEach(id => {
            document.getElementById(id).disabled = false;
        });
        
        // Cargar regiones si no están cargadas
        if (document.getElementById('profileRegion').options.length <= 1) {
            cargarRegionesYCiudades();
        }
        
        // Mostrar botones de acción
        profileActions.style.display = 'flex';
        
        // Cambiar botón
        editBtn.innerHTML = '<i class="fas fa-times"></i> Cancelar Edición';
        editBtn.onclick = cancelarEdicion;
    }
}

// Función para cancelar edición
function cancelarEdicion() {
    const editBtn = document.getElementById('editProfileBtn');
    const profileActions = document.getElementById('profileActions');
    const inputs = ['profileNombreUsuario', 'profileNombre', 'profileApellido', 'profileEmail', 'profileTelefono', 'profileRegion', 'profileCiudad', 'profileDireccion'];
    
    // Restaurar datos originales
    document.getElementById('profileNombreUsuario').value = datosOriginales.nombre_usuario;
    document.getElementById('profileNombre').value = datosOriginales.nombre;
    document.getElementById('profileApellido').value = datosOriginales.apellido;
    document.getElementById('profileEmail').value = datosOriginales.email;
    document.getElementById('profileTelefono').value = datosOriginales.telefono;
    document.getElementById('profileRegion').value = datosOriginales.region;
    document.getElementById('profileCiudad').value = datosOriginales.ciudad;
    document.getElementById('profileDireccion').value = datosOriginales.direccion;
    
    // Deshabilitar campos
    inputs.forEach(id => {
        document.getElementById(id).disabled = true;
    });
    
    // Ocultar botones de acción
    profileActions.style.display = 'none';
    
    // Restaurar botón
    editBtn.innerHTML = '<i class="fas fa-edit"></i> Editar Perfil';
    editBtn.onclick = toggleEditProfile;
}

// Función para actualizar perfil
async function actualizarPerfil() {
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    
    if (!usuarioLogueado) {
        mostrarCardEmergente(false, 'No hay sesión activa');
        return;
    }
    
    try {
        const usuario = JSON.parse(usuarioLogueado);
        
        const datosPerfil = {
            action: 'actualizar_perfil',
            id_usuario: usuario.id_usuario,
            nombre_usuario: document.getElementById('profileNombreUsuario').value.trim(),
            nombre: document.getElementById('profileNombre').value.trim(),
            apellido: document.getElementById('profileApellido').value.trim(),
            correo_electronico: document.getElementById('profileEmail').value.trim(),
            telefono: document.getElementById('profileTelefono').value.trim(),
            region: document.getElementById('profileRegion').value.trim(),
            ciudad: document.getElementById('profileCiudad').value.trim(),
            direccion: document.getElementById('profileDireccion').value.trim()
        };
        
        
        // Validaciones
        if (!datosPerfil.nombre_usuario || !datosPerfil.nombre || !datosPerfil.apellido || !datosPerfil.correo_electronico || !datosPerfil.telefono) {
            mostrarCardEmergente(false, 'Los campos Nombre de Usuario, Nombre, Apellido, Email y Teléfono son obligatorios');
            return;
        }
        
        if (!validarEmail(datosPerfil.correo_electronico)) {
            mostrarCardEmergente(false, 'El formato del email no es válido');
            return;
        }
        
        const response = await fetch('../backend/public/actualizar_perfil_cliente.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosPerfil)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Actualizar datos en sessionStorage
            usuario.nombre_usuario = datosPerfil.nombre_usuario;
            usuario.nombre = datosPerfil.nombre;
            usuario.apellido = datosPerfil.apellido;
            usuario.correo_electronico = datosPerfil.correo_electronico;
            usuario.telefono = datosPerfil.telefono;
            usuario.region = datosPerfil.region;
            usuario.ciudad = datosPerfil.ciudad;
            usuario.direccion = datosPerfil.direccion;
            sessionStorage.setItem('usuario_logueado', JSON.stringify(usuario));
            
            // Actualizar nombre en la interfaz
            document.getElementById('profileName').textContent = `${usuario.nombre} ${usuario.apellido}`;
            
            // Actualizar valores en los campos del formulario inmediatamente
            document.getElementById('profileNombreUsuario').value = usuario.nombre_usuario;
            document.getElementById('profileNombre').value = usuario.nombre;
            document.getElementById('profileApellido').value = usuario.apellido;
            document.getElementById('profileEmail').value = usuario.correo_electronico;
            document.getElementById('profileTelefono').value = usuario.telefono;
            document.getElementById('profileRegion').value = usuario.region;
            document.getElementById('profileCiudad').value = usuario.ciudad;
            document.getElementById('profileDireccion').value = usuario.direccion;
            
            // Salir del modo edición SIN restaurar datos originales
            const editBtn = document.getElementById('editProfileBtn');
            const profileActions = document.getElementById('profileActions');
            const inputs = ['profileNombreUsuario', 'profileNombre', 'profileApellido', 'profileEmail', 'profileTelefono', 'profileRegion', 'profileCiudad', 'profileDireccion'];
            
            // Deshabilitar campos
            inputs.forEach(id => {
                document.getElementById(id).disabled = true;
            });
            
            // Ocultar botones de acción
            profileActions.style.display = 'none';
            
            // Restaurar botón
            editBtn.innerHTML = '<i class="fas fa-edit"></i> Editar Perfil';
            editBtn.onclick = toggleEditProfile;
            
            mostrarCardEmergente(true, result.message);
        } else {
            mostrarCardEmergente(false, result.message);
        }
        
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        mostrarCardEmergente(false, 'Error al actualizar perfil');
    }
}

// Función para cambiar contraseña
async function cambiarContrasena() {
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    
    if (!usuarioLogueado) {
        mostrarCardEmergente(false, 'No hay sesión activa');
        return;
    }
    
    try {
        const usuario = JSON.parse(usuarioLogueado);
        
        const contrasenaActual = document.getElementById('contrasenaActual').value;
        const nuevaContrasena = document.getElementById('nuevaContrasena').value;
        const confirmarContrasena = document.getElementById('confirmarContrasena').value;
        
        // Validaciones
        if (!contrasenaActual || !nuevaContrasena || !confirmarContrasena) {
            mostrarCardEmergente(false, 'Todos los campos son obligatorios');
            return;
        }
        
        if (nuevaContrasena.length < 8) {
            mostrarCardEmergente(false, 'La nueva contraseña debe tener al menos 8 caracteres');
            return;
        }
        
        if (nuevaContrasena !== confirmarContrasena) {
            mostrarCardEmergente(false, 'Las contraseñas no coinciden');
            return;
        }
        
        const datosContrasena = {
            action: 'cambiar_contrasena',
            id_usuario: usuario.id_usuario,
            contrasena_actual: contrasenaActual,
            nueva_contrasena: nuevaContrasena
        };
        
        const response = await fetch('../backend/public/actualizar_perfil_cliente.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosContrasena)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Limpiar formulario
            document.getElementById('contrasenaActual').value = '';
            document.getElementById('nuevaContrasena').value = '';
            document.getElementById('confirmarContrasena').value = '';
            
            mostrarCardEmergente(true, result.message);
        } else {
            mostrarCardEmergente(false, result.message);
        }
        
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        mostrarCardEmergente(false, 'Error al cambiar contraseña');
    }
}

// Función para validar email
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Inicializar menú al cargar la página
inicializarMenu();

// Cargar contenido inicial al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Cargar el contenido de "Inicio" por defecto
    cambiarContenido('Inicio');
});

// Manejar responsive en móviles
window.addEventListener('resize', function() {
    const sidebar = document.getElementById('sidebar');
    if(window.innerWidth > 600) {
        sidebar.classList.remove('menu-open');
    }
});
function toggleMobileMenu() {
    const menu = document.getElementById('sidebarMenuMobile');
    menu.classList.toggle('open');
    if(menu.classList.contains('open')) {
        // Actualizar con datos reales del usuario
        updateMobileUserBlock();
    }
}

// Función para actualizar información móvil
function updateMobileUserBlock() {
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    
    if (usuarioLogueado) {
        try {
            const usuario = JSON.parse(usuarioLogueado);
            const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`;
            const iniciales = `${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}`;
            
            document.getElementById('mobileUserName').textContent = nombreCompleto;
            document.getElementById('mobileUserAvatar').textContent = iniciales;
        } catch (error) {
            console.error('Error al actualizar información móvil:', error);
        }
    }
}
// ===== FUNCIONES PARA GALERÍA DE IMÁGENES =====
// Función para mostrar modal de imágenes del cliente
function mostrarModalImagenesCliente(idEspacio) {
    // Verificar si estamos en Espacios Asignados o Espacios Disponibles
    const containerAsignados = document.getElementById('listaEspaciosAsignados');
    const containerDisponibles = document.getElementById('espaciosDisponiblesList');
    
    if (containerAsignados && containerAsignados.querySelector('.space-card')) {
        // Estamos en Espacios Asignados - usar datos locales
        mostrarModalImagenesAsignados(idEspacio);
    } else if (containerDisponibles && containerDisponibles.querySelector('.space-card')) {
        // Estamos en Espacios Disponibles - usar API
        cargarImagenesEspacio(idEspacio);
    } else {
        // Fallback - intentar con API
        cargarImagenesEspacio(idEspacio);
    }
}

// Función específica para mostrar modal de imágenes en Espacios Asignados
function mostrarModalImagenesAsignados(idEspacio) {
    // Buscar el espacio en los datos cargados (similar a administrador.js)
    const container = document.getElementById('listaEspaciosAsignados');
    if (!container) return;
    
    // Buscar la card del espacio para obtener los datos
    const spaceCard = container.querySelector(`[data-espacio-id="${idEspacio}"]`);
    if (!spaceCard) {
        mostrarCardEmergente(false, 'No se encontró el espacio');
        return;
    }
    
    // Obtener los datos del espacio desde el DOM o desde los datos globales
    // Por ahora, vamos a hacer una consulta para obtener las imágenes del espacio asignado
    cargarImagenesEspacioAsignado(idEspacio);
}

// Función para cargar imágenes de espacios asignados
async function cargarImagenesEspacioAsignado(idEspacio) {
    try {
        const token = sessionStorage.getItem('token_sesion') || '';
        const response = await fetch(`../backend/public/espacios_asignados.php?action=fotos_espacio&id_espacio=${idEspacio}&token=${encodeURIComponent(token)}`);
        const data = await response.json();
        
        if (data.success && data.fotos && data.fotos.length > 0) {
            mostrarModalImagenes(idEspacio, data.fotos, data.nombre_espacio || 'Espacio', 'asignados');
        } else {
            mostrarCardEmergente(false, 'No hay imágenes disponibles para este espacio');
        }
    } catch (error) {
        console.error('Error cargando imágenes del espacio asignado:', error);
        mostrarCardEmergente(false, 'Error al cargar las imágenes');
    }
}

function cerrarModalImagenesCliente(idEspacio) {
    const modal = document.getElementById(`modal-imagenes-cliente-${idEspacio}`);
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

function abrirImagenCompletaCliente(src, idEspacio) {
    const modal = `
        <div class="modal-overlay" id="modal-imagen-completa-cliente-${idEspacio}" onclick="cerrarImagenCompletaCliente(${idEspacio})">
            <div class="modal-content image-full-modal" onclick="event.stopPropagation()">
                <button class="close-modal" onclick="cerrarImagenCompletaCliente(${idEspacio})">
                    <i class="fas fa-times"></i>
                </button>
                <img src="${src}" alt="Imagen completa" class="full-image" style="width:100%;max-height:85vh;object-fit:contain;">
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modal);
}

function cerrarImagenCompletaCliente(idEspacio) {
    const modal = document.getElementById(`modal-imagen-completa-cliente-${idEspacio}`);
    if (modal) modal.remove();
}

// Función para mostrar confirmación de activar privilegios de administrador
function mostrarConfirmacionActivarPrivilegiosAdmin() {
    // Crear overlay
    let overlay = document.getElementById('confirmacion-activar-privilegios-admin');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'confirmacion-activar-privilegios-admin';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(5px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(overlay);
        
        // Animar entrada
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
    }

    // Crear card
    let card = document.createElement('div');
    card.style.cssText = `
        background: #fff;
        border-radius: 15px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        transform: scale(0.9);
        transition: transform 0.3s ease;
        text-align: center;
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        border-left: 7px solid #000000;
    `;

    // Icono
    let icon = document.createElement('div');
    icon.innerHTML = '<i class="fas fa-crown" style="font-size:2.5em;color:#ffd700;"></i>';
    icon.style.marginBottom = '1.5rem';
    card.appendChild(icon);

    // Título
    let title = document.createElement('div');
    title.innerHTML = '<h3 style="margin: 0 0 1rem 0; color: #2c3e50; font-size: 1.5rem;">Activar Privilegios de Administrador</h3>';
    card.appendChild(title);

    // Mensaje
    let message = document.createElement('div');
    message.innerHTML = `
        <p style="margin-bottom: 1rem; color: #666; line-height: 1.6;">
            Se te asignará el rol de <strong>Administrador</strong> adicionalmente a tu rol actual de <strong>Cliente</strong>.
        </p>
        <p style="margin-bottom: 1.5rem; color: #666; line-height: 1.6;">
            Esto te permitirá acceder a todas las funcionalidades administrativas del sistema,
            manteniendo tus privilegios de cliente.
        </p>
        <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; border-left: 4px solid #000000; margin-bottom: 1.5rem;">
            <p style="margin: 0; color: #2c3e50; font-size: 0.95rem;">
                <i class="fas fa-info-circle" style="color: #ffd700; margin-right: 0.5rem;"></i>
                Podrás usar las mismas credenciales para ambos roles
            </p>
        </div>
    `;
    card.appendChild(message);

    // Botones
    let buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '1rem';
    buttonContainer.style.justifyContent = 'center';

    // Botón Cancelar
    let cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.style.cssText = `
        background: #95a5a6;
        color: #fff;
        border: none;
        border-radius: 8px;
        padding: 0.8rem 2rem;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 500;
    `;
    cancelBtn.onmouseover = function() {
        this.style.background = '#7f8c8d';
        this.style.transform = 'translateY(-2px)';
    };
    cancelBtn.onmouseout = function() {
        this.style.background = '#95a5a6';
        this.style.transform = 'translateY(0)';
    };
    cancelBtn.onclick = cerrarConfirmacionActivarPrivilegiosAdmin;

    // Botón Confirmar
    let confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Activar Privilegios';
    confirmBtn.style.cssText = `
        background: linear-gradient(135deg, #4ade80, #22c55e);
        color: #fff;
        border: none;
        border-radius: 8px;
        padding: 0.8rem 2rem;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 500;
    `;
    confirmBtn.onmouseover = function() {
        this.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
        this.style.transform = 'translateY(-2px)';
    };
    confirmBtn.onmouseout = function() {
        this.style.background = 'linear-gradient(135deg, #4ade80, #22c55e)';
        this.style.transform = 'translateY(0)';
    };
    confirmBtn.onclick = activarPrivilegiosAdministrador;

    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(confirmBtn);
    card.appendChild(buttonContainer);

    // Animar entrada de la card
    setTimeout(() => {
        card.style.transform = 'scale(1)';
    }, 50);

    // Limpiar overlay y agregar card
    overlay.innerHTML = '';
    overlay.appendChild(card);
}

// Función para cerrar confirmación de activar privilegios de administrador
function cerrarConfirmacionActivarPrivilegiosAdmin() {
    const overlay = document.getElementById('confirmacion-activar-privilegios-admin');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
        }, 300);
    }
}

// Función para activar privilegios de administrador
async function activarPrivilegiosAdministrador() {
    let confirmBtn = null;
    let originalText = '';
    
    try {
        // Obtener datos del usuario
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (!usuarioLogueado) {
            mostrarCardEmergente(false, 'Error: No se encontraron datos de usuario');
            return;
        }
        
        const userData = JSON.parse(usuarioLogueado);
        if (!userData || !userData.id_usuario) {
            mostrarCardEmergente(false, 'Error: No se encontraron datos de usuario');
            return;
        }

        // Mostrar loading
        confirmBtn = event.target;
        originalText = confirmBtn.textContent;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Activando...';
        confirmBtn.disabled = true;

        // Llamar al backend
        const response = await fetch('../backend/public/activar_privilegios_administrador.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=activar_privilegios&id_usuario=${userData.id_usuario}`
        });

        const result = await response.json();

        if (result.success) {
            // Cerrar modal
            cerrarConfirmacionActivarPrivilegiosAdmin();
            
            // Mostrar mensaje de éxito
            mostrarCardEmergente(true, '¡Privilegios de administrador activados exitosamente!');
            
            // Actualizar información del usuario en sessionStorage
            if (result.usuario_actualizado) {
                sessionStorage.setItem('userData', JSON.stringify(result.usuario_actualizado));
            }
            
        } else {
            // Cerrar modal primero
            cerrarConfirmacionActivarPrivilegiosAdmin();
            mostrarCardEmergente(false, result.message || 'Error al activar privilegios de administrador');
        }

    } catch (error) {
        console.error('Error al activar privilegios de administrador:', error);
        // Cerrar modal primero
        cerrarConfirmacionActivarPrivilegiosAdmin();
        mostrarCardEmergente(false, 'Error de conexión al activar privilegios');
    } finally {
        // Restaurar botón
        if (confirmBtn) {
            confirmBtn.innerHTML = originalText;
            confirmBtn.disabled = false;
        }
    }
}

// Función para cargar reportes del cliente
async function cargarReportes() {
    const wrapper = document.getElementById('reportesList');
    if (!wrapper) return;
    
    try {
        const token = sessionStorage.getItem('token_sesion') || '';
        const url = `../backend/public/envioreportes.php?token=${encodeURIComponent(token)}`;
        const resp = await fetch(url);
        const json = await resp.json();
        
        if (!json.success) {
            wrapper.innerHTML = `<div style="color:#e74c3c; padding:1rem; text-align:center;">${json.message || 'No se pudieron cargar los reportes'}</div>`;
            return;
        }
        
        const reportes = Array.isArray(json.reportes) ? json.reportes : [];
        if (!reportes.length) {
            wrapper.innerHTML = '<div style="color:#888; padding:1rem; text-align:center;">No tienes reportes enviados.</div>';
            return;
        }
        
        wrapper.innerHTML = reportes.map(r => {
            const fecha = (r.fecha_creacion || '').replace('T',' ').substring(0,19);
            const estado = r.estado || 'Enviado';
            const estadoClass = `estado-${estado.toLowerCase().replace(' ', '-')}`;
            const tieneRespuesta = !!(r.respuesta_admin && String(r.respuesta_admin).trim() !== '');
            const respuestaSection = tieneRespuesta ? `
                <div class="reporte-card__respuesta">
                    <div class="reporte-card__respuesta-badge"><i class="fas fa-reply"></i> Respuesta</div>
                    <div class="reporte-card__respuesta-text">${r.respuesta_admin}</div>
                </div>
            ` : '';
            const puedeEliminar = (estado.toLowerCase() === 'enviado');
            const botonEliminar = puedeEliminar ? `
                <button class="btn-delete-rating btn-delete-reporte" data-id-reporte="${r.id_reporte}" title="Eliminar reporte">
                    <i class="fas fa-trash"></i>
                    <span style="margin-left:6px;">Eliminar</span>
                </button>
            ` : '';
            
            return `
                <div class="reporte-card">
                    <div class="reporte-card__header">
                        <div class="reporte-card__title">${r.titulo || ''}</div>
                        <span class="estado-chip ${estadoClass}">${estado}</span>
                    </div>
                    <div class="reporte-card__meta">
                        <span><i class="fas fa-calendar"></i> ${fecha}</span>
                        <span><i class="fas fa-building"></i> ${r.nombre_espacio || ''}</span>
                    </div>
                    <div class="reporte-card__contenido">
                        <div class="reporte-card__descripcion">
                            <strong>Descripción:</strong><br>
                            ${r.contenido || 'Sin descripción disponible'}
                        </div>
                        <div class="reporte-card__acciones">
                            ${botonEliminar}
                        </div>
                    </div>
                    ${respuestaSection}
                </div>
            `;
        }).join('');
        
    } catch (e) {
        console.error('Error cargando reportes', e);
        wrapper.innerHTML = '<div style="color:#e74c3c; padding:1rem; text-align:center;">Error al cargar reportes</div>';
    }
}

// Delegación de eventos para eliminar reporte
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-delete-reporte');
    if (!btn) return;
    const idReporte = parseInt(btn.getAttribute('data-id-reporte'), 10);
    if (!idReporte) return;
    abrirConfirmacionEliminarReporte(idReporte);
});

function abrirConfirmacionEliminarReporte(idReporte){
    // Reutiliza estilos del modal de confirmación existente
    const overlay = document.createElement('div');
    overlay.className = 'confirmation-overlay';
    overlay.innerHTML = `
        <div class="confirmation-modal">
            <div class="confirmation-header">
                <h3><i class="fas fa-exclamation-triangle"></i> Confirmar eliminación</h3>
                <button class="modal-close" aria-label="Cerrar" onclick="cerrarConfirmacionEliminarReporte()">&times;</button>
            </div>
            <div class="confirmation-body">
                <p class="confirmation-warning">Esta acción eliminará tu reporte enviado. ¿Deseas continuar?</p>
            </div>
            <div class="confirmation-actions">
                <button class="btn-cancel" onclick="cerrarConfirmacionEliminarReporte()">Cancelar</button>
                <button class="btn-confirm-delete" onclick="confirmarEliminarReporte(${idReporte})">Eliminar</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    window.cerrarConfirmacionEliminarReporte = () => {
        try{ document.body.removeChild(overlay); }catch{}
    };
}

async function confirmarEliminarReporte(idReporte){
    try{
        const token = sessionStorage.getItem('token_sesion')||'';
        const fd = new FormData();
        fd.append('token', token);
        fd.append('id_reporte', String(idReporte));
        fd.append('accion', 'eliminar_cliente');
        const resp = await fetch('../backend/public/gestionar_reportes.php', { method:'POST', body: fd });
        const json = await resp.json();
        if (!json.success){
            mostrarCardEmergente(false, json.message || 'No se pudo eliminar el reporte');
        } else {
            mostrarCardEmergente(true, json.message || 'Reporte eliminado correctamente');
            await cargarReportes();
        }
    }catch(err){
        mostrarCardEmergente(false, 'Error al eliminar el reporte');
    } finally {
        if (window.cerrarConfirmacionEliminarReporte) window.cerrarConfirmacionEliminarReporte();
    }
}

// ===== FUNCIONES PARA ESPACIOS DISPONIBLES =====

// Función para inicializar la sección de espacios disponibles
async function inicializarEspaciosDisponibles() {
    try {
        // Cargar regiones y ciudades
        await cargarRegionesYCiudadesFiltros();
        
        // Cargar espacios disponibles
        await cargarEspaciosDisponibles();
        
    } catch (error) {
        console.error('Error inicializando espacios disponibles:', error);
        document.getElementById('espaciosDisponiblesList').innerHTML = 
            '<div style="color:#e74c3c; padding:1rem; text-align:center;">Error al cargar espacios disponibles</div>';
    }
}

// Función para cargar regiones y ciudades (para filtros de espacios disponibles)
async function cargarRegionesYCiudadesFiltros() {
    try {
        const response = await fetch('../backend/public/regiones_chile.php?action=regiones');
        const data = await response.json();
        
        if (data.success && data.regiones) {
            const regionSelect = document.getElementById('filterRegion');
            const ciudadSelect = document.getElementById('filterCiudad');
            
            // Llenar regiones
            regionSelect.innerHTML = '<option value="">Todas las regiones</option>';
            data.regiones.forEach(region => {
                regionSelect.innerHTML += `<option value="${region.id_region}">${region.nombre_region}</option>`;
            });
            
            // Event listener para cambio de región
            regionSelect.addEventListener('change', async (e) => {
                const regionId = e.target.value;
                if (regionId) {
                    await cargarCiudadesPorRegionFiltros(regionId);
                } else {
                    ciudadSelect.innerHTML = '<option value="">Todas las ciudades</option>';
                }
            });
        }
    } catch (error) {
        console.error('Error cargando regiones:', error);
    }
}

// Función para cargar ciudades por región (para filtros de espacios disponibles)
async function cargarCiudadesPorRegionFiltros(regionId) {
    try {
        const response = await fetch(`../backend/public/regiones_chile.php?action=ciudades&id_region=${regionId}`);
        const data = await response.json();
        
        if (data.success && data.ciudades) {
            const ciudadSelect = document.getElementById('filterCiudad');
            ciudadSelect.innerHTML = '<option value="">Todas las ciudades</option>';
            data.ciudades.forEach(ciudad => {
                ciudadSelect.innerHTML += `<option value="${ciudad.id_ciudad}">${ciudad.nombre_ciudad}</option>`;
            });
        }
    } catch (error) {
        console.error('Error cargando ciudades:', error);
    }
}
// Función para cargar espacios disponibles
async function cargarEspaciosDisponibles() {
    const container = document.getElementById('espaciosDisponiblesList');
    container.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Cargando espacios disponibles...</div>';
    
    try {
        const token = sessionStorage.getItem('token_sesion') || '';
        const response = await fetch(`../backend/public/espacios_disponibles.php?token=${encodeURIComponent(token)}`);
        const data = await response.json();
        
        if (!data.success) {
            container.innerHTML = `<div style="color:#e74c3c; padding:1rem; text-align:center;">${data.message || 'No se pudieron cargar los espacios'}</div>`;
            return;
        }
        
        const espacios = Array.isArray(data.espacios) ? data.espacios : [];
        if (espacios.length === 0) {
            container.innerHTML = '<div style="color:#888; padding:2rem; text-align:center;">No hay espacios disponibles en este momento.</div>';
            return;
        }
        
        // Renderizar espacios usando el estilo del administrador
        container.innerHTML = espacios.map(espacio => {
            const region = espacio.region || 'N/D';
            const ciudad = espacio.ciudad || 'N/D';
            const direccion = espacio.direccion || 'N/D';
            const ubicacionInterna = espacio.ubicacion_interna || 'N/D';
            const metros = espacio.metros_cuadrados || 'N/D';
            const tipo = espacio.tipo_espacio || 'N/D';
            const admin = `${espacio.admin_nombre || ''} ${espacio.admin_apellido || ''}`.trim();
            const precio = espacio.precio_arriendo || 'N/D';
            
            // Preparar imagen
            const foto = espacio.foto1 || null;
            const tieneImagenes = espacio.num_fotos > 0;
            const totalFotos = typeof espacio.num_fotos === 'number' && espacio.num_fotos > 0 ? espacio.num_fotos : 0;
            
            // Obtener icono según tipo de espacio
            const iconoEspacio = obtenerIconoEspacio(tipo);
            
            return `
                <div class="space-card" data-espacio-id="${espacio.id_espacio}">
                    <div class="space-image-container" onclick="mostrarModalImagenesCliente(${espacio.id_espacio})" style="cursor: pointer;">
                        ${foto ? `<img src="/GestionDeEspacios/backend/${foto}" alt="${espacio.nombre_espacio}" class="space-image">` : `<div class="space-icon-large"><i class="${iconoEspacio}"></i></div>`}
                        ${tieneImagenes ? `
                            <div class="image-gallery-indicator">
                                <i class="fas fa-images"></i>
                                <span>Ver más imágenes</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="space-card-main">
                        <div class="space-card-header">
                            <div class="space-title-section">
                                <h3 class="space-title">${espacio.nombre_espacio}</h3>
                                <p class="space-type">${tipo}</p>
                            </div>
                            <div class="space-status-container">
                                <div class="space-status available">
                                    Disponible
                                </div>
                            </div>
                        </div>
                        
                        <div class="space-card-content">
                            <div class="space-info-grid">
                                <div class="space-info-item">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span>${direccion}, ${ciudad}, ${region}</span>
                                </div>
                                <div class="space-info-item">
                                    <i class="fas fa-ruler"></i>
                                    <span>${metros} m²</span>
                                </div>
                                ${ubicacionInterna !== 'N/D' ? `
                                    <div class="space-info-item">
                                        <i class="fas fa-door-open"></i>
                                        <span>${ubicacionInterna}</span>
                                    </div>
                                ` : ''}
                                <div class="space-info-item">
                                    <i class="fas fa-dollar-sign"></i>
                                    <span>$${Math.round(precio).toLocaleString('es-CL')} / mes</span>
                                </div>
                                <div class="space-info-item">
                                    <i class="fas fa-user-tie"></i>
                                    <span>${admin}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="space-card-actions">
                        <button class="rating-btn" onclick="calificarEspacio(${espacio.id_espacio})" title="Calificar Espacio">
                            <i class="fas fa-star"></i>
                        </button>
                        <button class="request-btn" onclick="solicitarEspacio(${espacio.id_espacio})" title="Solicitar Espacio">
                            <i class="fas fa-hand-paper"></i>
                        </button>
                        <button class="view-ratings-btn" onclick="verCalificacionesEspacio(${espacio.id_espacio})" title="Ver Calificaciones">
                            <i class="fas fa-star-half-alt"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error cargando espacios disponibles:', error);
        container.innerHTML = '<div style="color:#e74c3c; padding:1rem; text-align:center;">Error al cargar espacios disponibles</div>';
    }
}

// Función para aplicar filtros
async function aplicarFiltros() {
    const region = document.getElementById('filterRegion').value;
    const ciudad = document.getElementById('filterCiudad').value;
    const tipo = document.getElementById('filterTipo').value;
    const metros = document.getElementById('filterMetros').value;
    
    const container = document.getElementById('espaciosDisponiblesList');
    container.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Aplicando filtros...</div>';
    
    try {
        const token = sessionStorage.getItem('token_sesion') || '';
        const params = new URLSearchParams({
            token: token,
            region: region,
            ciudad: ciudad,
            tipo: tipo,
            metros: metros
        });
        
        const response = await fetch(`../backend/public/espacios_disponibles.php?${params}`);
        const data = await response.json();
        
        if (!data.success) {
            container.innerHTML = `<div style="color:#e74c3c; padding:1rem; text-align:center;">${data.message || 'Error al aplicar filtros'}</div>`;
            return;
        }
        
        const espacios = Array.isArray(data.espacios) ? data.espacios : [];
        if (espacios.length === 0) {
            container.innerHTML = '<div style="color:#888; padding:2rem; text-align:center;">No se encontraron espacios con los filtros aplicados.</div>';
            return;
        }
        
        // Reutilizar la función de renderizado con estilo del administrador
        container.innerHTML = espacios.map(espacio => {
            const region = espacio.region || 'N/D';
            const ciudad = espacio.ciudad || 'N/D';
            const direccion = espacio.direccion || 'N/D';
            const ubicacionInterna = espacio.ubicacion_interna || 'N/D';
            const metros = espacio.metros_cuadrados || 'N/D';
            const tipo = espacio.tipo_espacio || 'N/D';
            const admin = `${espacio.admin_nombre || ''} ${espacio.admin_apellido || ''}`.trim();
            const precio = espacio.precio_arriendo || 'N/D';
            
            // Preparar imagen
            const foto = espacio.foto1 || null;
            const tieneImagenes = espacio.num_fotos > 0;
            const totalFotos = typeof espacio.num_fotos === 'number' && espacio.num_fotos > 0 ? espacio.num_fotos : 0;
            
            // Obtener icono según tipo de espacio
            const iconoEspacio = obtenerIconoEspacio(tipo);
            
            return `
                <div class="space-card" data-espacio-id="${espacio.id_espacio}">
                    <div class="space-image-container" onclick="mostrarModalImagenesCliente(${espacio.id_espacio})" style="cursor: pointer;">
                        ${foto ? `<img src="/GestionDeEspacios/backend/${foto}" alt="${espacio.nombre_espacio}" class="space-image">` : `<div class="space-icon-large"><i class="${iconoEspacio}"></i></div>`}
                        ${tieneImagenes ? `
                            <div class="image-gallery-indicator">
                                <i class="fas fa-images"></i>
                                <span>Ver más imágenes</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="space-card-main">
                        <div class="space-card-header">
                            <div class="space-title-section">
                                <h3 class="space-title">${espacio.nombre_espacio}</h3>
                                <p class="space-type">${tipo}</p>
                            </div>
                            <div class="space-status-container">
                                <div class="space-status available">
                                    Disponible
                                </div>
                            </div>
                        </div>
                        
                        <div class="space-card-content">
                            <div class="space-info-grid">
                                <div class="space-info-item">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span>${direccion}, ${ciudad}, ${region}</span>
                                </div>
                                <div class="space-info-item">
                                    <i class="fas fa-ruler"></i>
                                    <span>${metros} m²</span>
                                </div>
                                ${ubicacionInterna !== 'N/D' ? `
                                    <div class="space-info-item">
                                        <i class="fas fa-door-open"></i>
                                        <span>${ubicacionInterna}</span>
                                    </div>
                                ` : ''}
                                <div class="space-info-item">
                                    <i class="fas fa-dollar-sign"></i>
                                    <span>$${Math.round(precio).toLocaleString('es-CL')} / mes</span>
                                </div>
                                <div class="space-info-item">
                                    <i class="fas fa-user-tie"></i>
                                    <span>${admin}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="space-card-actions">
                        <button class="rating-btn" onclick="calificarEspacio(${espacio.id_espacio})" title="Calificar Espacio">
                            <i class="fas fa-star"></i>
                        </button>
                        <button class="request-btn" onclick="solicitarEspacio(${espacio.id_espacio})" title="Solicitar Espacio">
                            <i class="fas fa-hand-paper"></i>
                        </button>
                        <button class="view-ratings-btn" onclick="verCalificacionesEspacio(${espacio.id_espacio})" title="Ver Calificaciones">
                            <i class="fas fa-star-half-alt"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error aplicando filtros:', error);
        container.innerHTML = '<div style="color:#e74c3c; padding:1rem; text-align:center;">Error al aplicar filtros</div>';
    }
}

// Función para limpiar filtros
function limpiarFiltros() {
    document.getElementById('filterRegion').value = '';
    document.getElementById('filterCiudad').value = '';
    document.getElementById('filterTipo').value = '';
    document.getElementById('filterMetros').value = '';
    
    // Recargar todos los espacios
    cargarEspaciosDisponibles();
}

// Función para solicitar un espacio
function solicitarEspacio(idEspacio) {
    mostrarModalSolicitudEspacio(idEspacio);
}

// Función para calificar un espacio
function calificarEspacio(idEspacio) {
    mostrarModalCalificacionEspacio(idEspacio);
}

// Función para ver calificaciones de un espacio
function verCalificacionesEspacio(idEspacio) {
    mostrarModalCalificacionesEspacio(idEspacio);
}

// Función para mostrar modal de calificaciones de espacio
async function mostrarModalCalificacionesEspacio(idEspacio) {
    console.log('Cargando calificaciones para espacio:', idEspacio);
    
    try {
        // Mostrar loading
        mostrarLoadingCalificaciones();
        
        // Obtener calificaciones del backend
        const data = await obtenerCalificacionesEspacio(idEspacio);
        const calificaciones = data.calificaciones;
        
        // Crear y mostrar el modal
        crearModalCalificaciones(idEspacio, calificaciones, data.promedio_general);
        
    } catch (error) {
        console.error('Error al cargar calificaciones:', error);
        mostrarErrorCalificaciones('Error al cargar las calificaciones');
    }
}

// Función para obtener calificaciones del backend
async function obtenerCalificacionesEspacio(idEspacio) {
    console.log('Obteniendo calificaciones para espacio:', idEspacio);
    
    // Validar que el ID sea válido
    if (!idEspacio || isNaN(idEspacio)) {
        throw new Error('ID de espacio inválido');
    }
    
    const requestData = {
        action: 'obtener_calificaciones',
        id_publicacion: parseInt(idEspacio)
    };
    
    console.log('Datos de la petición:', requestData);
    
    const response = await fetch('/GestionDeEspacios/backend/public/calificar_espacios.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(requestData)
    });
    
    console.log('Respuesta del servidor:', response.status, response.statusText);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Error del servidor:', errorText);
        throw new Error(`Error en la respuesta del servidor: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Datos recibidos:', data);
    
           if (!data.success) {
               throw new Error(data.message || 'Error al obtener calificaciones');
           }
           
           return {
               calificaciones: data.calificaciones || [],
               promedio_general: data.promedio_general || null
           };
}

// Función para mostrar loading
function mostrarLoadingCalificaciones() {
    let modal = document.getElementById('modalCalificacionesEspacio');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalCalificacionesEspacio';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="modal-content calificaciones-modal">
            <div class="modal-header">
                <h3><i class="fas fa-star-half-alt"></i> Calificaciones del Espacio</h3>
                <button class="modal-close" onclick="cerrarModalCalificacionesEspacio()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <div class="loading-calificaciones">
                    <div class="loading-spinner"></div>
                    <p>Cargando calificaciones...</p>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
    modal.classList.add('show');
}

// Función para crear el modal con las calificaciones
function crearModalCalificaciones(idEspacio, calificaciones, promedioGeneral) {
    const modal = document.getElementById('modalCalificacionesEspacio');
    
    let contenidoCalificaciones = '';
    
    if (calificaciones.length === 0) {
        contenidoCalificaciones = `
            <div class="no-calificaciones">
                <i class="fas fa-star"></i>
                <h4>No hay calificaciones aún</h4>
                <p>Este espacio aún no ha recibido calificaciones.</p>
            </div>
        `;
    } else {
        // Usar el promedio general calculado en el backend
        const promedio = promedioGeneral || 0;
        
        contenidoCalificaciones = `
            <div class="calificaciones-resumen">
                <div class="promedio-calificacion">
                    <div class="promedio-numero">${promedio.toFixed(1)}</div>
                    <div class="promedio-estrellas">
                        ${generarEstrellasPromedio(promedio)}
                    </div>
                    <div class="promedio-texto">Basado en ${calificaciones.length} calificación${calificaciones.length !== 1 ? 'es' : ''}</div>
                </div>
            </div>
            
            <div class="calificaciones-lista">
                ${calificaciones.map(calificacion => {
                    const uid=(function(){ try{ return (JSON.parse(sessionStorage.getItem('usuario_logueado')||'{}').id_usuario)||''; }catch(e){ return ''; } })();
                    const esMia = String(calificacion.id_usuario_cliente||'')===String(uid||'');
                    return `
                    <div class="calificacion-item">
                        <div class="calificacion-header">
                            <div class="calificacion-usuario">
                                <div class="usuario-avatar">${calificacion.nombre ? calificacion.nombre.charAt(0).toUpperCase() : 'U'}</div>
                                <div class="usuario-info">
                                    <div class="usuario-nombre">${calificacion.nombre || 'Usuario'} ${calificacion.apellido || ''}</div>
                                    <div class="calificacion-fecha">${formatearFecha(calificacion.fecha_calificacion)}</div>
                                </div>
                            </div>
                            <div class="calificacion-puntuacion">
                                ${generarEstrellasCalificacion(calificacion.promedio_calificacion)}
                                <span class="puntuacion-numero">${calificacion.promedio_calificacion}</span>
                                ${esMia?`<button class="btn-delete-rating" title="Eliminar" onclick="abrirConfirmacionEliminarCalificacion(${calificacion.id_calificacion}, ${idEspacio})"><i class=\"fas fa-trash\"></i></button>`:''}
                            </div>
                        </div>
                        <div class="calificacion-comentario">${calificacion.comentario || 'Sin comentario'}</div>
                    </div>`;
                }).join('')}
            </div>
        `;
    }
    
    modal.innerHTML = `
        <div class="modal-content calificaciones-modal">
            <div class="modal-header">
                <h3><i class="fas fa-star-half-alt"></i> Calificaciones del Espacio</h3>
                <button class="modal-close" onclick="cerrarModalCalificacionesEspacio()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                ${contenidoCalificaciones}
            </div>
        </div>
    `;
}

// Función para generar estrellas de promedio
function generarEstrellasPromedio(promedio) {
    let estrellas = '';
    const estrellasCompletas = Math.floor(promedio);
    const tieneMediaEstrella = promedio % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
        if (i <= estrellasCompletas) {
            estrellas += '<i class="fas fa-star"></i>';
        } else if (i === estrellasCompletas + 1 && tieneMediaEstrella) {
            estrellas += '<i class="fas fa-star-half-alt"></i>';
        } else {
            estrellas += '<i class="far fa-star"></i>';
        }
    }
    
    return estrellas;
}

// Función para generar estrellas de calificación individual
function generarEstrellasCalificacion(puntuacion) {
    let estrellas = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= puntuacion) {
            estrellas += '<i class="fas fa-star"></i>';
        } else {
            estrellas += '<i class="far fa-star"></i>';
        }
    }
    return estrellas;
}

// Función para formatear fecha
function formatearFecha(fecha) {
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
// Función para mostrar error
function mostrarErrorCalificaciones(mensaje) {
    const modal = document.getElementById('modalCalificacionesEspacio');
    if (modal) {
        modal.innerHTML = `
            <div class="modal-content calificaciones-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-star-half-alt"></i> Calificaciones del Espacio</h3>
                    <button class="modal-close" onclick="cerrarModalCalificacionesEspacio()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="error-calificaciones">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h4>Error</h4>
                        <p>${mensaje}</p>
                        <button class="btn-primary" onclick="cerrarModalCalificacionesEspacio()">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

// Función para cerrar modal de calificaciones
function cerrarModalCalificacionesEspacio() {
    console.log('Cerrando modal de calificaciones...');
    const modal = document.getElementById('modalCalificacionesEspacio');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            console.log('Modal de calificaciones cerrado completamente');
        }, 300);
    }
}

async function eliminarCalificacionEspacio(idCalificacion, idEspacio){
    try{
        const u = JSON.parse(sessionStorage.getItem('usuario_logueado')||'{}');
        const idUsuario = u.id_usuario||'';
        if (!idUsuario) { mostrarErrorCalificaciones('Sesión no válida'); return; }
        const resp = await fetch('/GestionDeEspacios/backend/public/calificar_espacios.php', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:`action=eliminar_calificacion&id_calificacion=${encodeURIComponent(idCalificacion)}&id_usuario=${encodeURIComponent(idUsuario)}` });
        const json = await resp.json();
        if (!json.success){ mostrarErrorCalificaciones(json.message||'No se pudo eliminar'); return; }
        try{ mostrarCardEmergente(true, 'Calificación eliminada correctamente'); }catch(_){ }
        // Recargar modal
        mostrarModalCalificacionesEspacio(idEspacio);
    }catch(e){ mostrarErrorCalificaciones('Error al eliminar la calificación'); }
}

function abrirConfirmacionEliminarCalificacion(idCalificacion, idEspacio){
    let ov=document.getElementById('confirmEliminarCalif');
    if(!ov){ ov=document.createElement('div'); ov.id='confirmEliminarCalif'; ov.className='confirmation-overlay'; document.body.appendChild(ov); }
    ov.innerHTML=`
        <div class="confirmation-modal">
            <div class="confirmation-header"><i class="fas fa-trash"></i><h3>Eliminar calificación</h3></div>
            <div class="confirmation-body">
                <p>¿Seguro que deseas <strong>eliminar</strong> tu calificación?</p>
                <div class="confirmation-warning">Esta acción no se puede deshacer.</div>
            </div>
            <div class="confirmation-actions">
                <button class="btn-cancel" onclick="cerrarConfirmacionEliminarCalificacion()"><i class="fas fa-times"></i> Cancelar</button>
                <button class="btn-confirm-delete" onclick="confirmarEliminarCalificacion(${idCalificacion}, ${idEspacio})"><i class="fas fa-trash"></i> Eliminar</button>
            </div>
        </div>`;
}

function cerrarConfirmacionEliminarCalificacion(){ const ov=document.getElementById('confirmEliminarCalif'); if(ov){ ov.remove(); } }
function confirmarEliminarCalificacion(idCalificacion, idEspacio){ cerrarConfirmacionEliminarCalificacion(); eliminarCalificacionEspacio(idCalificacion, idEspacio); }

// Función para mostrar modal de calificación de espacio
function mostrarModalCalificacionEspacio(idEspacio) {
    console.log('Iniciando creación del modal para espacio:', idEspacio);
    
    // Crear el modal si no existe
    let modal = document.getElementById('modalCalificacionEspacio');
    if (!modal) {
        console.log('Creando nuevo modal...');
        modal = document.createElement('div');
        modal.id = 'modalCalificacionEspacio';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content calificacion-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-star"></i> Calificar Espacio</h3>
                    <button class="modal-close" onclick="cerrarModalCalificacionEspacio()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <form id="formCalificacionEspacio" onsubmit="guardarCalificacionEspacio(event)">
                        <input type="hidden" id="idEspacioCalificacion" name="id_espacio" value="${idEspacio}">
                        
                        <div class="form-group">
                            <label>Calificación *</label>
                            <div class="rating-input">
                                <div class="stars-input" id="starsInputEspacio">
                                    <i class="fas fa-star" data-rating="1"></i>
                                    <i class="fas fa-star" data-rating="2"></i>
                                    <i class="fas fa-star" data-rating="3"></i>
                                    <i class="fas fa-star" data-rating="4"></i>
                                    <i class="fas fa-star" data-rating="5"></i>
                                </div>
                                <span class="rating-text" id="ratingTextEspacio">Selecciona una calificación</span>
                            </div>
                            <input type="hidden" id="calificacionValueEspacio" name="calificacion" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="descripcionCalificacionEspacio">Descripción de la Experiencia *</label>
                            <textarea 
                                id="descripcionCalificacionEspacio" 
                                name="descripcion" 
                                rows="3" 
                                placeholder="Describe tu experiencia con el espacio..."
                                required
                            ></textarea>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn-secondary" onclick="cerrarModalCalificacionEspacio()">
                                Cancelar
                            </button>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-save"></i>
                                Guardar Calificación
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        console.log('Modal creado y agregado al DOM');
    } else {
        console.log('Modal ya existe, actualizando ID del espacio');
        // Actualizar el ID del espacio
        document.getElementById('idEspacioCalificacion').value = idEspacio;
    }
    
    // Mostrar el modal
    console.log('Mostrando modal...');
    modal.style.display = 'flex';
    modal.classList.add('show');
    console.log('Modal mostrado con display:flex y clase show');
    
    // Inicializar las estrellas
    inicializarEstrellasEspacio();
    
    // Limpiar formulario
    limpiarFormularioCalificacionEspacio();
}

// Función para inicializar las estrellas del modal de calificación de espacio
function inicializarEstrellasEspacio() {
    const stars = document.querySelectorAll('#starsInputEspacio i');
    const ratingValue = document.getElementById('calificacionValueEspacio');
    
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            const rating = index + 1;
            setRatingEspacio(rating);
        });
        
        star.addEventListener('mouseenter', () => {
            highlightStarsEspacio(index + 1);
        });
    });
    
    document.getElementById('starsInputEspacio').addEventListener('mouseleave', () => {
        const currentRating = parseInt(ratingValue.value) || 0;
        highlightStarsEspacio(currentRating);
    });
}

// Función para establecer calificación en el modal de espacio
function setRatingEspacio(rating) {
    const ratingValue = document.getElementById('calificacionValueEspacio');
    const ratingText = document.getElementById('ratingTextEspacio');
    
    ratingValue.value = rating;
    highlightStarsEspacio(rating);
    
    const textos = {
        1: 'Muy malo',
        2: 'Malo', 
        3: 'Regular',
        4: 'Bueno',
        5: 'Excelente'
    };
    
    ratingText.textContent = textos[rating];
}

// Función para resaltar estrellas en el modal de espacio
function highlightStarsEspacio(rating) {
    const stars = document.querySelectorAll('#starsInputEspacio i');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// Función para limpiar formulario de calificación de espacio
function limpiarFormularioCalificacionEspacio() {
    const form = document.getElementById('formCalificacionEspacio');
    if (form) {
        form.reset();
        document.getElementById('calificacionValueEspacio').value = '';
        document.getElementById('ratingTextEspacio').textContent = 'Selecciona una calificación';
        highlightStarsEspacio(0);
        
        // Limpiar campos específicos
        document.getElementById('descripcionCalificacionEspacio').value = '';
    }
}

// Función para cerrar modal de calificación de espacio
function cerrarModalCalificacionEspacio() {
    console.log('Cerrando modal de calificación...');
    const modal = document.getElementById('modalCalificacionEspacio');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            limpiarFormularioCalificacionEspacio();
            console.log('Modal cerrado completamente');
        }, 300); // Esperar a que termine la animación
    }
}

// Función para guardar calificación de espacio
async function guardarCalificacionEspacio(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        const usuario = JSON.parse(usuarioLogueado);
        
        const data = {
            action: 'guardar_calificacion_espacio',
            id_cliente: usuario.id_usuario,
            id_publicacion: formData.get('id_espacio'),
            calificacion: formData.get('calificacion'),
            descripcion: formData.get('descripcion')
        };
        
        console.log('Datos a enviar:', data);
        
        const response = await fetch('/GestionDeEspacios/backend/public/calificar_espacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarCardEmergente(true, result.message || 'Calificación guardada correctamente');
            cerrarModalCalificacionEspacio();
        } else {
            mostrarCardEmergente(false, result.message || 'Error al guardar la calificación');
        }
        
    } catch (error) {
        console.error('Error al guardar calificación:', error);
        mostrarCardEmergente(false, 'Error de conexión al guardar la calificación');
    }
}

// Función para ver detalles de un espacio

// Función para obtener la ruta correcta de una imagen
function getImagePath(imageUrl) {
    if (!imageUrl) return '';
    
    // Si ya es una URL completa, devolverla tal como está
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }
    
    // Si empieza con 'frontend/styles/images/', usar la ruta del frontend
    if (imageUrl.startsWith('frontend/styles/images/')) {
        return `/GestionDeEspacios/${imageUrl}`;
    }
    
    // Si empieza con 'uploads/', usar la ruta del backend
    if (imageUrl.startsWith('uploads/')) {
        return `/GestionDeEspacios/backend/${imageUrl}`;
    }
    
    // Si no tiene prefijo, asumir que está en uploads
    return `/GestionDeEspacios/backend/uploads/${imageUrl}`;
}

// Función para obtener detalles de un espacio específico
async function obtenerDetallesEspacio(idEspacio) {
    try {
        const token = sessionStorage.getItem('token_sesion');
        if (!token) {
            throw new Error('No se encontró token de sesión');
        }
        
        const response = await fetch(`/GestionDeEspacios/backend/public/espacios_disponibles.php?token=${encodeURIComponent(token)}&action=obtener_detalles&id_espacio=${idEspacio}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Error al obtener detalles del espacio');
        }
        
        return data.espacio;
    } catch (error) {
        console.error('Error obteniendo detalles del espacio:', error);
        // Retornar datos por defecto en caso de error
        return {
            titulo: 'Espacio',
            precio: 0,
            direccion: 'N/A',
            ciudad: 'N/A',
            region: 'N/A',
            metros_cuadrados: 'N/A',
            tipo_espacio: 'N/A',
            admin_nombre: 'N/A'
        };
    }
}

// Función para mostrar el modal de solicitud de espacio
async function mostrarModalSolicitudEspacio(idEspacio) {
    try {
        // Obtener detalles del espacio
        const espacioInfo = await obtenerDetallesEspacio(idEspacio);
        console.log('Debug: Información del espacio recibida:', espacioInfo);
        console.log('Debug: Imagen del espacio:', espacioInfo.imagen);
        console.log('Debug: Ruta de imagen generada:', getImagePath(espacioInfo.imagen));
        
        // Crear el modal
        const modalHTML = `
            <div id="modalSolicitudEspacio" class="modal-overlay">
                <div class="modal-content solicitud-modal">
                    <div class="modal-header">
                        <h3><i class="fas fa-hand-paper"></i> Solicitar Espacio</h3>
                        <button class="modal-close" onclick="cerrarModalSolicitud()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="solicitud-info">
                            <p><strong>Envía un mensaje al administrador del espacio para expresar tu interés en arrendarlo.</strong></p>
                        </div>
                        
                        <div class="form-group">
                            <label for="mensajeSolicitud">Mensaje de Solicitud:</label>
                            <textarea 
                                id="mensajeSolicitud" 
                                class="mensaje-textarea" 
                                placeholder="Escribe tu mensaje aquí..."
                                rows="6"
                            >Hola, ¿aún tiene disponible este espacio? Me gustaría arrendarlo.</textarea>
                            <div class="char-counter">
                                <span id="charCount">0</span> / 500 caracteres
                            </div>
                        </div>
                        
                        <div class="espacio-preview">
                            <h4><i class="fas fa-building"></i> Previsualización del Espacio:</h4>
                            <div class="preview-content">
                                <div class="preview-espacio-compact">
                                    <div class="preview-espacio-image">
                                        ${espacioInfo.imagen ? 
                                            `<img src="${getImagePath(espacioInfo.imagen)}" alt="${espacioInfo.titulo}" class="preview-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                                            `<div class="preview-img-placeholder"><i class="fas fa-image"></i></div>`
                                        }
                                        <div class="preview-img-placeholder" style="display: none;"><i class="fas fa-image"></i></div>
                                    </div>
                                    <div class="preview-espacio-info">
                                        <div class="preview-espacio-title">${espacioInfo.titulo || 'Espacio'}</div>
                                        <div class="preview-espacio-location">
                                            <i class="fas fa-map-marker-alt"></i>
                                            <span>${espacioInfo.direccion || 'N/A'}, ${espacioInfo.ciudad || 'N/A'}</span>
                                        </div>
                                        <div class="preview-espacio-price">$${espacioInfo.precio ? Math.round(espacioInfo.precio).toLocaleString('es-CL') : 'N/A'} / mes</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button type="button" class="btn-cancel" onclick="cerrarModalSolicitud()">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                        <button type="button" class="btn-send" onclick="enviarSolicitudEspacio(${idEspacio})">
                            <i class="fas fa-paper-plane"></i> Enviar Solicitud
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar el modal al body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Configurar eventos
        const textarea = document.getElementById('mensajeSolicitud');
        const charCount = document.getElementById('charCount');
        
        // Actualizar contador en tiempo real
        textarea.addEventListener('input', function() {
            const mensaje = this.value;
            charCount.textContent = mensaje.length;
            
            // Cambiar color del contador si se acerca al límite
            if (mensaje.length > 450) {
                charCount.style.color = '#e74c3c';
            } else if (mensaje.length > 400) {
                charCount.style.color = '#f39c12';
            } else {
                charCount.style.color = '#7f8c8d';
            }
        });
        
        // Limitar caracteres
        textarea.addEventListener('keydown', function(e) {
            if (this.value.length >= 500 && e.key !== 'Backspace' && e.key !== 'Delete') {
                e.preventDefault();
            }
        });
        
        // Mostrar el modal con animación
        setTimeout(() => {
            document.getElementById('modalSolicitudEspacio').classList.add('show');
        }, 10);
        
    } catch (error) {
        console.error('Error obteniendo detalles del espacio:', error);
        mostrarCardEmergente(false, 'Error al cargar los detalles del espacio');
    }
}

// Función para cerrar el modal de solicitud
function cerrarModalSolicitud() {
    const modal = document.getElementById('modalSolicitudEspacio');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Función para enviar la solicitud de espacio
async function enviarSolicitudEspacio(idEspacio) {
    const mensaje = document.getElementById('mensajeSolicitud').value.trim();
    
    if (!mensaje) {
        mostrarCardEmergente(false, 'Por favor, escribe un mensaje de solicitud');
        return;
    }
    
    if (mensaje.length > 500) {
        mostrarCardEmergente(false, 'El mensaje no puede exceder los 500 caracteres');
        return;
    }
    
    try {
        const token = sessionStorage.getItem('token_sesion');
        if (!token) {
            throw new Error('No se encontró token de sesión');
        }
        
        // Obtener detalles del espacio para incluir en el mensaje
        const espacioInfo = await obtenerDetallesEspacio(idEspacio);
        
        // Crear mensaje completo con información del espacio
        const mensajeCompleto = `${mensaje}
--- INFORMACIÓN DEL ESPACIO ---
• Espacio: ${espacioInfo.titulo || 'N/A'}
• Ubicación: ${espacioInfo.direccion || 'N/A'}, ${espacioInfo.ciudad || 'N/A'}, ${espacioInfo.region || 'N/A'}
• Tipo: ${espacioInfo.tipo_espacio || 'N/A'}
• Tamaño: ${espacioInfo.metros_cuadrados || 'N/A'} m²
• Precio: $${espacioInfo.precio ? Math.round(espacioInfo.precio).toLocaleString('es-CL') : 'N/A'} / mes
• Administrador: ${espacioInfo.admin_nombre || 'N/A'}
• Imagen: ${espacioInfo.imagen || 'N/A'}`;
        
        const response = await fetch('/GestionDeEspacios/backend/public/mensajes.php', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Auth-Token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'enviar_consulta',
                id_publicacion: idEspacio,
                mensaje: mensajeCompleto
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            cerrarModalSolicitud();
            mostrarCardEmergente(true, 'Solicitud enviada correctamente. El administrador te contactará pronto.');
        } else {
            throw new Error(data.message || 'Error al enviar la solicitud');
        }
        
    } catch (error) {
        console.error('Error enviando solicitud:', error);
        mostrarCardEmergente(false, 'Error al enviar la solicitud: ' + error.message);
    }
}

// Función para obtener el icono según el tipo de espacio (igual que en administrador)
function obtenerIconoEspacio(tipoEspacio) {
    const iconos = {
        'Oficina': 'fas fa-building',
        'Local Comercial': 'fas fa-store',
        'Sala de Reuniones': 'fas fa-users',
        'Consultorio': 'fas fa-stethoscope',
        'Depósito': 'fas fa-warehouse',
        'Bodega': 'fas fa-boxes',
        'Estacionamiento': 'fas fa-car',
        'Auditorio': 'fas fa-microphone',
        'Laboratorio': 'fas fa-flask',
        'Almacén': 'fas fa-archive',
        'Otro': 'fas fa-home'
    };
    
    return iconos[tipoEspacio] || 'fas fa-building';
}


// Función para cargar imágenes de un espacio específico
async function cargarImagenesEspacio(idEspacio) {
    try {
        console.log('Cargando imágenes para espacio:', idEspacio);
        const token = sessionStorage.getItem('token_sesion') || '';
        console.log('Token obtenido:', token ? 'Sí' : 'No');
        
        const url = `/GestionDeEspacios/backend/public/espacios_disponibles.php?action=obtener_imagenes&id_espacio=${idEspacio}&token=${encodeURIComponent(token)}`;
        console.log('URL de petición:', url);
        
        const response = await fetch(url);
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Datos recibidos:', data);
        
        if (data.success && data.imagenes && data.imagenes.length > 0) {
            console.log('Mostrando modal con', data.imagenes.length, 'imágenes');
            mostrarModalImagenes(idEspacio, data.imagenes, data.nombre_espacio);
        } else {
            console.log('No hay imágenes o error:', data.message);
            mostrarCardEmergente(false, data.message || 'No hay imágenes disponibles para este espacio');
        }
    } catch (error) {
        console.error('Error cargando imágenes:', error);
        mostrarCardEmergente(false, 'Error al cargar las imágenes');
    }
}

// Función para mostrar el modal de imágenes
function mostrarModalImagenes(idEspacio, imagenes, nombreEspacio, contexto = 'disponibles') {
    console.log('mostrarModalImagenes llamado con:', { idEspacio, imagenes, nombreEspacio, contexto });
    
    // Construir rutas de imágenes según el contexto
    const construirRutaImagen = (imagen) => {
        if (contexto === 'asignados') {
            // Para espacios asignados, las imágenes pueden venir con rutas relativas
            if (imagen.startsWith('../') || imagen.startsWith('/')) {
                return imagen;
            } else {
                return `../${imagen}`;
            }
        } else {
            // Para espacios disponibles, usar ruta absoluta
            return `/GestionDeEspacios/backend/${imagen}`;
        }
    };
    
    const modal = `
        <div class="modal-overlay" id="modal-imagenes-${idEspacio}" onclick="cerrarModalImagenes(${idEspacio})">
            <div class="modal-content image-gallery-modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>Imágenes de ${nombreEspacio}</h2>
                    <button class="close-modal" onclick="cerrarModalImagenes(${idEspacio})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="image-gallery">
                        ${imagenes.map((imagen, index) => {
                            const rutaImagen = construirRutaImagen(imagen);
                            return `
                                <div class="gallery-item">
                                    <img src="${rutaImagen}" alt="Imagen ${index + 1}" class="gallery-image" onclick="abrirImagenCompleta('${rutaImagen}', ${idEspacio})">
                                    <div class="image-number">${index + 1}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="cerrarModalImagenes(${idEspacio})">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    console.log('Insertando modal en el DOM');
    document.body.insertAdjacentHTML('beforeend', modal);
    
    // Agregar clase 'show' para hacer visible el modal
    setTimeout(() => {
        const modalElement = document.getElementById(`modal-imagenes-${idEspacio}`);
        if (modalElement) {
            modalElement.classList.add('show');
            console.log('Modal hecho visible con clase show');
        }
    }, 10);
    
    console.log('Modal insertado correctamente');
}

// Función para cerrar modal de imágenes
function cerrarModalImagenes(idEspacio) {
    const modal = document.getElementById(`modal-imagenes-${idEspacio}`);
    if (modal) {
        // Remover clase 'show' primero para animación de salida
        modal.classList.remove('show');
        
        // Esperar a que termine la animación antes de eliminar
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Función para abrir imagen en tamaño completo
function abrirImagenCompleta(src, idEspacio) {
    const modal = `
        <div class="modal-overlay" id="modal-imagen-completa-${idEspacio}" onclick="cerrarModalImagenCompleta(${idEspacio})">
            <div class="modal-content image-full-modal" onclick="event.stopPropagation()">
                <button class="close-modal" onclick="cerrarModalImagenCompleta(${idEspacio})">
                    <i class="fas fa-times"></i>
                </button>
                <img src="${src}" alt="Imagen completa" class="full-image">
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
    
    // Agregar clase 'show' para hacer visible el modal
    setTimeout(() => {
        const modalElement = document.getElementById(`modal-imagen-completa-${idEspacio}`);
        if (modalElement) {
            modalElement.classList.add('show');
        }
    }, 10);
}

// Función para cerrar modal de imagen completa
function cerrarModalImagenCompleta(idEspacio) {
    const modal = document.getElementById(`modal-imagen-completa-${idEspacio}`);
    if (modal) {
        // Remover clase 'show' primero para animación de salida
        modal.classList.remove('show');
        
        // Esperar a que termine la animación antes de eliminar
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

document.addEventListener('DOMContentLoaded', updateMobileUserBlock); 

// Manejar hash de URL para resaltar espacio específico
document.addEventListener('DOMContentLoaded', function() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#espacio-')) {
        const idEspacio = hash.replace('#espacio-', '');
        setTimeout(() => {
            const espacioElement = document.querySelector(`[data-espacio-id="${idEspacio}"]`);
            if (espacioElement) {
                // Remover resaltado anterior
                document.querySelectorAll('.space-card').forEach(card => {
                    card.classList.remove('space-highlighted');
                });
                
                // Resaltar el espacio específico
                espacioElement.classList.add('space-highlighted');
                
                // Hacer scroll al espacio específico
                espacioElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
                
                // Quitar el resaltado después de 3 segundos
                setTimeout(() => {
                    espacioElement.classList.remove('space-highlighted');
                }, 3000);
            }
        }, 1000); // Esperar a que se carguen los espacios
    }
});

// ===== FUNCIONES DE MENSAJES PARA CLIENTE =====

// Función para configurar el sistema de mensajes
function configurarMensajes() {
    console.log('Configurando sistema de mensajes para cliente');
}

// Función para obtener el token de sesión
function obtenerToken() {
    // Buscar token en sessionStorage con diferentes claves posibles
    let token = sessionStorage.getItem('token') || 
                sessionStorage.getItem('token_sesion') || 
                sessionStorage.getItem('auth_token') || 
                sessionStorage.getItem('session_token');
    
    // Si no se encuentra, intentar extraer del objeto usuario_logueado
    if (!token) {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (usuarioLogueado) {
            try {
                const usuario = JSON.parse(usuarioLogueado);
                token = usuario.token_sesion || usuario.token;
                if (token) {
                    sessionStorage.setItem('token', token);
                }
            } catch (e) {
                console.error('Error al parsear usuario logueado:', e);
            }
        }
    }
    
    return token;
}

// Función para cargar mensajes
async function cargarMensajes(tipo) {
    const container = document.getElementById('messagesContainer');
    
    if (!container) return;
    
    try {
        container.innerHTML = `
            <div class="loading-message">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Cargando mensajes...</p>
            </div>
        `;
        
        const token = obtenerToken();
        if (!token) {
            throw new Error('No se encontró token de sesión');
        }
        
        // Obtener el tipo de usuario del sessionStorage y capitalizarlo
        const tipoUsuario = sessionStorage.getItem('tipo_usuario') || 'cliente';
        const rolCapitalizado = tipoUsuario.charAt(0).toUpperCase() + tipoUsuario.slice(1).toLowerCase();
        
        const response = await fetch(`/GestionDeEspacios/backend/public/mensajes.php?tipo=${tipo}&rol=${rolCapitalizado}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Auth-Token': token,
                'Content-Type': 'application/json'
            }
        });
        
        // Verificar si la respuesta es JSON válido
        const responseText = await response.text();
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (error) {
            console.error('Error parseando JSON:', error);
            throw new Error('Error en la respuesta del servidor: ' + responseText.substring(0, 200));
        }
        
        if (data.success) {
            if (tipo === 'asignacion') {
                // Verificar si es cliente o administrador
                if (data.tipo_usuario === 'cliente' && data.administradores) {
                    mostrarAdministradoresAsignados(data.administradores || []);
                } else {
                    mostrarClientesAsignados(data.clientes || []);
                }
            } else if (tipo === 'consulta') {
                mostrarMensajesConsulta(data.mensajes || []);
            }
            
        } else {
            throw new Error(data.message || 'Error al cargar mensajes');
        }
        
    } catch (error) {
        container.innerHTML = `
            <div class="no-messages">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar mensajes</p>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Función para mostrar clientes asignados (chat de asignación)
function mostrarClientesAsignados(clientes) {
    const container = document.getElementById('messagesContainer');
    
    if (!clientes || clientes.length === 0) {
        container.innerHTML = `
            <div class="no-messages">
                <i class="fas fa-comment-slash"></i>
                <p>No hay administradores asignados</p>
                <p>Los administradores de tus espacios aparecerán aquí</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="chat-container">
            <div class="chat-sidebar">
                <div class="chat-sidebar-header">
                    <h3>Administradores</h3>
                    <p>Selecciona un administrador para chatear</p>
                </div>
                <div class="chat-sidebar-content">
                    ${clientes.map(cliente => crearClienteChat(cliente)).join('')}
                </div>
            </div>
            <div class="chat-main">
                <div class="chat-welcome">
                    <i class="fas fa-comments"></i>
                    <h3>Selecciona un administrador</h3>
                    <p>Elige un administrador de la lista para comenzar la conversación</p>
                </div>
            </div>
        </div>
    `;
}

// Función para mostrar administradores asignados (para clientes)
function mostrarAdministradoresAsignados(administradores) {
    const container = document.getElementById('messagesContainer');
    
    if (!administradores || administradores.length === 0) {
        container.innerHTML = `
            <div class="no-messages">
                <i class="fas fa-comment-slash"></i>
                <p>No hay administradores asignados</p>
                <p>Los administradores de tus espacios aparecerán aquí</p>
            </div>
        `;
        return;
    }
    
    
    container.innerHTML = `
        <div class="chat-container">
            <div class="chat-sidebar">
                <div class="chat-sidebar-header">
                    <h3>Administradores</h3>
                    <p>Selecciona un administrador para chatear</p>
                </div>
                <div class="chat-sidebar-content">
                    ${administradores.map(admin => crearAdministradorChat(admin)).join('')}
                </div>
            </div>
            <div class="chat-main">
                <div class="chat-welcome">
                    <i class="fas fa-comments"></i>
                    <h3>Selecciona un administrador</h3>
                    <p>Elige un administrador de la lista para comenzar la conversación</p>
                </div>
            </div>
        </div>
    `;
}

// Función para mostrar mensajes de consulta (chat de consulta)
function mostrarMensajesConsulta(mensajes) {
    
    const container = document.getElementById('messagesContainer');
    
    if (!mensajes || mensajes.length === 0) {
        container.innerHTML = `
            <div class="no-messages">
                <i class="fas fa-user-tie"></i>
                <p>No hay consultas</p>
                <p>Las consultas sobre espacios disponibles aparecerán aquí</p>
            </div>
        `;
        return;
    }
    
    // Agrupar mensajes por publicación
    const mensajesAgrupados = agruparMensajesPorPublicacion(mensajes);
    
    container.innerHTML = `
        <div class="chat-container">
            <div class="chat-sidebar">
                <div class="chat-sidebar-header">
                    <h3>Consultas</h3>
                    <p>Selecciona una consulta para ver la conversación</p>
                </div>
                <div class="chat-sidebar-content">
                    ${mensajesAgrupados.map(grupo => crearPublicacionChat(grupo)).join('')}
                </div>
            </div>
            <div class="chat-main">
            <div class="chat-welcome">
                <i class="fas fa-user-tie"></i>
                <h3>Selecciona una consulta</h3>
                <p>Elige una consulta de la lista para ver la conversación</p>
            </div>
            </div>
        </div>
    `;
}

// Función para crear un elemento de cliente en el chat
function crearClienteChat(cliente) {
    return `
        <div class="client-chat-item" data-id="${cliente.id_administrador}" onclick="seleccionarCliente(${cliente.id_administrador}, '${cliente.nombre_administrador}')">
            <div class="client-avatar">
                <i class="fas fa-user-tie"></i>
            </div>
            <div class="client-info">
                <h4>${cliente.nombre_administrador}</h4>
                <p class="client-space">${cliente.espacios_asignados}</p>
            </div>
            <div class="client-status">
                <div class="status-dot online"></div>
            </div>
        </div>
    `;
}

// Función para crear elemento de chat de administrador
function crearAdministradorChat(admin) {
    return `
        <div class="client-chat-item" data-id="${admin.id_administrador}" onclick="seleccionarAdministrador(${admin.id_administrador}, '${admin.nombre_administrador}')">
            <div class="client-avatar">
                <i class="fas fa-user-tie"></i>
            </div>
            <div class="client-info">
                <h4>${admin.nombre_administrador}</h4>
                <p class="client-space">${admin.espacios_asignados}</p>
            </div>
            <div class="client-status">
                <div class="status-dot online"></div>
            </div>
        </div>
    `;
}
// Función para seleccionar un administrador
function seleccionarAdministrador(idAdmin, nombreAdmin) {
    // Remover selección anterior
    document.querySelectorAll('.client-chat-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Marcar como activo
    const item = document.querySelector(`[data-id="${idAdmin}"]`);
    if (item) {
        item.classList.add('active');
    }
    
    // Cargar mensajes del administrador
    cargarMensajesAdministrador(idAdmin, nombreAdmin);
}
// Función para cargar mensajes de un administrador específico
async function cargarMensajesAdministrador(idAdmin, nombreAdmin) {
    const chatMain = document.querySelector('.chat-main');
    if (!chatMain) return;
    
    try {
        chatMain.innerHTML = `
            <div class="chat-header">
                <div class="chat-user-info">
                    <div class="user-avatar">
                        <i class="fas fa-user-tie"></i>
                    </div>
                    <div class="user-details">
                        <h3>${nombreAdmin}</h3>
                        <span class="user-status">Administrador</span>
                    </div>
                </div>
                <div class="chat-actions">
                    <button class="chat-action-btn" onclick="eliminarConversacionAdmin(${idAdmin}, '${nombreAdmin}')" title="Eliminar conversación">
                        <i class="fas fa-trash" style="color: #e74c3c;"></i>
                    </button>
                </div>
            </div>
            <div class="chat-messages" id="chatMessages">
                <div class="loading-message">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Cargando mensajes...</p>
                </div>
            </div>
            <div class="chat-input">
                <form id="messageForm" onsubmit="enviarMensajeAdministrador(event, ${idAdmin})">
                    <div class="input-group">
                        <input type="text" id="messageInput" placeholder="Escribe tu mensaje..." required>
                        <button type="submit" class="send-btn">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        // Cargar mensajes existentes
        await cargarMensajesExistentesAdmin(idAdmin);
        
    } catch (error) {
        console.error('Error cargando mensajes del administrador:', error);
        chatMain.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar mensajes</p>
            </div>
        `;
    }
}

// Función para cargar mensajes existentes con administrador
async function cargarMensajesExistentesAdmin(idAdmin) {
    try {
        const token = obtenerToken();
        if (!token) {
            throw new Error('No se encontró token de sesión');
        }
        
        const response = await fetch(`/GestionDeEspacios/backend/public/mensajes.php?tipo=asignacion&administrador=${idAdmin}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Auth-Token': token,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.mensajes) {
            mostrarMensajesChat(data.mensajes);
        } else {
            mostrarMensajesChat([]);
        }
        
    } catch (error) {
        console.error('Error cargando mensajes existentes:', error);
        mostrarMensajesChat([]);
    }
}

// Función para mostrar mensajes en el chat
function mostrarMensajesChat(mensajes) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    if (!mensajes || mensajes.length === 0) {
        chatMessages.innerHTML = `
            <div class="no-messages">
                <i class="fas fa-comments"></i>
                <p>No hay mensajes aún</p>
                <p>Envía el primer mensaje para comenzar la conversación</p>
            </div>
        `;
        return;
    }
    
    chatMessages.innerHTML = mensajes.map(mensaje => crearMensajeChat(mensaje)).join('');
    
    // Scroll al final
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Función para enviar mensaje a administrador
async function enviarMensajeAdministrador(event, idAdmin) {
    event.preventDefault();
    
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    try {
        const token = obtenerToken();
        if (!token) {
            throw new Error('No se encontró token de sesión');
        }
        
        const response = await fetch('/GestionDeEspacios/backend/public/mensajes.php', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Auth-Token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'enviar_mensaje',
                tipo: 'asignacion',
                destinatario: idAdmin,
                mensaje: message
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            messageInput.value = '';
            // Recargar mensajes
            await cargarMensajesExistentesAdmin(idAdmin);
        } else {
            throw new Error(data.message || 'Error al enviar mensaje');
        }
        
    } catch (error) {
        console.error('Error enviando mensaje:', error);
        mostrarCardEmergente(false, 'Error al enviar mensaje');
    }
}

// Función para eliminar conversación con administrador
function eliminarConversacionAdmin(idAdmin, nombreAdmin) {
    mostrarConfirmacionEliminacionConversacionAdmin(idAdmin, nombreAdmin);
}

// Función para mostrar confirmación de eliminación de conversación con administrador
function mostrarConfirmacionEliminacionConversacionAdmin(idAdmin, nombreAdmin) {
    const modal = `
        <div class="confirmation-overlay">
            <div class="confirmation-modal">
                <div class="confirmation-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Confirmar Eliminación</h3>
                </div>
                <div class="confirmation-body">
                    <p>¿Estás seguro de que quieres eliminar toda la conversación con <strong>"${nombreAdmin}"</strong>?</p>
                    <p class="confirmation-warning">Esta acción no se puede deshacer.</p>
                </div>
                <div class="confirmation-actions">
                    <button class="btn-cancel" onclick="cerrarConfirmacionEliminacionConversacionAdmin()">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button class="btn-confirm-delete" onclick="confirmarEliminacionConversacionAdmin(${idAdmin}, '${nombreAdmin}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

// Función para cerrar confirmación de eliminación de conversación con administrador
function cerrarConfirmacionEliminacionConversacionAdmin() {
    const modal = document.querySelector('.confirmation-overlay');
    if (modal) {
        modal.remove();
    }
}

// Función para confirmar eliminación de conversación con administrador
async function confirmarEliminacionConversacionAdmin(idAdmin, nombreAdmin) {
    try {
        const token = sessionStorage.getItem('token_sesion');
        const response = await fetch('/GestionDeEspacios/backend/public/mensajes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': token
            },
            body: JSON.stringify({
                action: 'eliminar_conversacion',
                id_administrador: idAdmin,
                tipo: 'asignacion'
            })
        });
        
        const data = await response.json();
        
        // Cerrar el modal de confirmación
        cerrarConfirmacionEliminacionConversacionAdmin();
        
        if (data.success) {
            mostrarCardEmergente(true, 'Conversación eliminada correctamente');
            // Recargar la lista de administradores
            cargarMensajes('asignacion');
        } else {
            mostrarCardEmergente(false, data.message || 'Error al eliminar conversación');
        }
    } catch (error) {
        console.error('Error al eliminar conversación:', error);
        cerrarConfirmacionEliminacionConversacionAdmin();
        mostrarCardEmergente(false, 'Error del servidor');
    }
}

// Función para eliminar conversación con cliente
function eliminarConversacionCliente(idCliente, nombreCliente) {
    mostrarConfirmacionEliminacionConversacionCliente(idCliente, nombreCliente);
}

// Función para mostrar confirmación de eliminación de conversación con cliente
function mostrarConfirmacionEliminacionConversacionCliente(idCliente, nombreCliente) {
    const modal = `
        <div class="confirmation-overlay">
            <div class="confirmation-modal">
                <div class="confirmation-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Confirmar Eliminación</h3>
                </div>
                <div class="confirmation-body">
                    <p>¿Estás seguro de que quieres eliminar toda la conversación con <strong>"${nombreCliente}"</strong>?</p>
                    <p class="confirmation-warning">Esta acción no se puede deshacer.</p>
                </div>
                <div class="confirmation-actions">
                    <button class="btn-cancel" onclick="cerrarConfirmacionEliminacionConversacionCliente()">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button class="btn-confirm-delete" onclick="confirmarEliminacionConversacionCliente(${idCliente}, '${nombreCliente}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

// Función para cerrar confirmación de eliminación de conversación con cliente
function cerrarConfirmacionEliminacionConversacionCliente() {
    const modal = document.querySelector('.confirmation-overlay');
    if (modal) {
        modal.remove();
    }
}

// Función para confirmar eliminación de conversación con cliente
async function confirmarEliminacionConversacionCliente(idCliente, nombreCliente) {
    try {
        const token = sessionStorage.getItem('token_sesion');
        const response = await fetch('/GestionDeEspacios/backend/public/mensajes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': token
            },
            body: JSON.stringify({
                action: 'eliminar_conversacion',
                id_cliente: idCliente,
                tipo: 'asignacion'
            })
        });
        
        const data = await response.json();
        
        // Cerrar el modal de confirmación
        cerrarConfirmacionEliminacionConversacionCliente();
        
        if (data.success) {
            mostrarCardEmergente(true, 'Conversación eliminada correctamente');
            // Recargar la lista de clientes
            cargarMensajes('asignacion');
        } else {
            mostrarCardEmergente(false, data.message || 'Error al eliminar conversación');
        }
    } catch (error) {
        console.error('Error al eliminar conversación:', error);
        cerrarConfirmacionEliminacionConversacionCliente();
        mostrarCardEmergente(false, 'Error del servidor');
    }
}

// Función para eliminar conversación de consulta (cliente)
function eliminarConversacionConsultaCliente(idPublicacion, tituloPublicacion) {
    mostrarConfirmacionEliminacionConversacionConsultaCliente(idPublicacion, tituloPublicacion);
}

// Función para mostrar confirmación de eliminación de conversación de consulta (cliente)
function mostrarConfirmacionEliminacionConversacionConsultaCliente(idPublicacion, tituloPublicacion) {
    const modal = `
        <div class="confirmation-overlay">
            <div class="confirmation-modal">
                <div class="confirmation-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Confirmar Eliminación</h3>
                </div>
                <div class="confirmation-body">
                    <p>¿Estás seguro de que quieres eliminar toda la conversación de <strong>"${tituloPublicacion}"</strong>?</p>
                    <p class="confirmation-warning">Esta acción no se puede deshacer.</p>
                </div>
                <div class="confirmation-actions">
                    <button class="btn-cancel" onclick="cerrarConfirmacionEliminacionConversacionConsultaCliente()">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button class="btn-confirm-delete" onclick="confirmarEliminacionConversacionConsultaCliente(${idPublicacion}, '${tituloPublicacion}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

// Función para cerrar confirmación de eliminación de conversación de consulta (cliente)
function cerrarConfirmacionEliminacionConversacionConsultaCliente() {
    const modal = document.querySelector('.confirmation-overlay');
    if (modal) {
        modal.remove();
    }
}

// Función para confirmar eliminación de conversación de consulta (cliente)
async function confirmarEliminacionConversacionConsultaCliente(idPublicacion, tituloPublicacion) {
    try {
        const token = sessionStorage.getItem('token_sesion');
        const response = await fetch('/GestionDeEspacios/backend/public/mensajes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': token
            },
            body: JSON.stringify({
                action: 'eliminar_conversacion',
                id_publicacion: idPublicacion,
                tipo: 'consulta'
            })
        });
        
        const data = await response.json();
        
        // Cerrar el modal de confirmación
        cerrarConfirmacionEliminacionConversacionConsultaCliente();
        
        if (data.success) {
            mostrarCardEmergente(true, 'Conversación eliminada correctamente');
            // Recargar la lista de consultas
            cargarMensajes('consulta');
        } else {
            mostrarCardEmergente(false, data.message || 'Error al eliminar conversación');
        }
    } catch (error) {
        console.error('Error al eliminar conversación:', error);
        cerrarConfirmacionEliminacionConversacionConsultaCliente();
        mostrarCardEmergente(false, 'Error del servidor');
    }
}

// Función para seleccionar un cliente
function seleccionarCliente(idCliente, nombreCliente) {
    // Remover selección anterior
    document.querySelectorAll('.client-chat-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Marcar como activo
    const selectedItem = document.querySelector(`[data-id="${idCliente}"]`);
    if (selectedItem) {
        selectedItem.classList.add('active');
    }
    
    // Cargar chat del cliente
    cargarChatCliente(idCliente, nombreCliente);
}

// Función para cargar chat de un cliente específico
async function cargarChatCliente(idCliente, nombreCliente) {
    try {
        const token = obtenerToken();
        if (!token) {
            throw new Error('No se encontró token de sesión');
        }
        
        const response = await fetch(`/GestionDeEspacios/backend/public/mensajes.php?tipo=asignacion&cliente=${idCliente}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Auth-Token': token,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarChatCliente(idCliente, nombreCliente, data.mensajes || []);
        } else {
            throw new Error(data.message || 'Error al cargar mensajes');
        }
        
    } catch (error) {
        console.error('Error cargando chat del cliente:', error);
        mostrarCardEmergente(false, 'Error al cargar la conversación');
    }
}

// Función para mostrar el chat de un cliente
function mostrarChatCliente(idCliente, nombreCliente, mensajes) {
    const chatMain = document.querySelector('.chat-main');
    
    chatMain.innerHTML = `
        <div class="chat-header">
            <div class="chat-user-info">
                <div class="user-avatar">
                    <i class="fas fa-user-tie"></i>
                </div>
                <div class="user-details">
                    <h3>${nombreCliente}</h3>
                    <span class="user-status">Administrador</span>
                </div>
            </div>
            <div class="chat-actions">
                <button class="chat-action-btn" onclick="eliminarConversacionCliente(${idCliente}, '${nombreCliente}')" title="Eliminar conversación">
                    <i class="fas fa-trash" style="color: #e74c3c;"></i>
                </button>
            </div>
        </div>
        <div class="chat-messages" id="chatMessages">
            ${mensajes.length > 0 ? mensajes.map(mensaje => crearMensajeChat(mensaje)).join('') : `
                <div class="no-messages">
                    <i class="fas fa-comment-slash"></i>
                    <p>No hay mensajes aún</p>
                    <p>Los mensajes con este administrador aparecerán aquí</p>
                </div>
            `}
        </div>
        <div class="chat-input">
            <div class="input-group">
                <input type="text" id="mensajeInput" placeholder="Escribe tu mensaje..." onkeypress="enviarMensajeEnter(event, ${idCliente})">
                <button class="send-btn" onclick="enviarMensajeRapido(${idCliente})">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;
    
    // Scroll al final
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}
// Función para crear un mensaje en el chat
function crearMensajeChat(mensaje) {
    const fecha = new Date(mensaje.fecha_envio);
    const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    // Obtener el ID del usuario logueado
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    let idUsuarioLogueado = null;
    
    if (usuarioLogueado) {
        try {
            const usuario = JSON.parse(usuarioLogueado);
            idUsuarioLogueado = usuario.id_usuario;
        } catch (e) {
            console.error('Error al parsear usuario logueado:', e);
        }
    }
    
    // Determinar si el mensaje fue enviado por el usuario logueado
    const esEmisor = mensaje.id_emisor == idUsuarioLogueado;
    
    // Verificar si el mensaje contiene información del espacio
    const tieneInfoEspacio = mensaje.mensaje.includes('--- INFORMACIÓN DEL ESPACIO ---');
    
    if (tieneInfoEspacio) {
        // Extraer información del espacio del mensaje
        const lineas = mensaje.mensaje.split('\n');
        const mensajePersonal = lineas[0].trim();
        const infoEspacio = {};
        
        lineas.forEach(linea => {
            if (linea.includes('• Espacio:')) {
                infoEspacio.titulo = linea.replace('• Espacio:', '').trim();
            } else if (linea.includes('• Ubicación:')) {
                infoEspacio.ubicacion = linea.replace('• Ubicación:', '').trim();
            } else if (linea.includes('• Precio:')) {
                infoEspacio.precio = linea.replace('• Precio:', '').trim();
            } else if (linea.includes('• Imagen:')) {
                infoEspacio.imagen = linea.replace('• Imagen:', '').trim();
            }
        });
        
        return `
            <div class="message-item ${esEmisor ? 'sent' : 'received'}">
                <div class="message-content">
                    <div class="message-with-space">
                        <div class="space-card-mini" onclick="verDetallesEspacioCliente(${mensaje.id_publicacion})" style="cursor: pointer;">
                            <div class="space-card-mini-image">
                                ${infoEspacio.imagen && infoEspacio.imagen !== 'N/A' ? 
                                    `<img src="${getImagePath(infoEspacio.imagen)}" alt="${infoEspacio.titulo || 'Espacio'}" class="space-mini-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                                    `<i class="fas fa-building"></i>`
                                }
                                <i class="fas fa-building" style="display: none;"></i>
                            </div>
                            <div class="space-card-mini-info">
                                <div class="space-card-mini-title">${infoEspacio.titulo || 'Espacio'}</div>
                                <div class="space-card-mini-location">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span>${infoEspacio.ubicacion || 'N/A'}</span>
                                </div>
                                <div class="space-card-mini-price">${infoEspacio.precio || 'N/A'}</div>
                            </div>
                        </div>
                        <div class="message-text">
                            <p>${mensajePersonal}</p>
                        </div>
                    </div>
                    <span class="message-time">${hora}</span>
                </div>
            </div>
        `;
    } else {
        // Mensaje normal sin información de espacio
        return `
            <div class="message-item ${esEmisor ? 'sent' : 'received'}">
                <div class="message-content">
                    <p>${mensaje.mensaje}</p>
                    <span class="message-time">${hora}</span>
                </div>
            </div>
        `;
    }
}

// Función para ver detalles de un espacio (cliente)
function verDetallesEspacioCliente(idEspacio) {
    // Navegar a la sección de "Espacios Disponibles" en la página del cliente
    if (window.location.pathname.includes('cliente.html')) {
        // Si ya estamos en la página del cliente, cambiar a la sección de espacios disponibles
        try {
            // Buscar el elemento del menú de espacios disponibles
            const menuItems = document.querySelectorAll('.menu-item');
            for (let item of menuItems) {
                if (item.textContent.includes('Espacios Disponibles')) {
                    setActiveMenu(item);
                    break;
                }
            }
            
            // Hacer scroll a la sección de espacios disponibles
            setTimeout(() => {
                const espaciosSection = document.querySelector('.available-spaces-section');
                if (espaciosSection) {
                    espaciosSection.scrollIntoView({ behavior: 'smooth' });
                    
                    // Buscar y resaltar el espacio específico
                    setTimeout(() => {
                        const espacioElement = document.querySelector(`[data-espacio-id="${idEspacio}"]`);
                        if (espacioElement) {
                            // Remover resaltado anterior
                            document.querySelectorAll('.space-card').forEach(card => {
                                card.classList.remove('space-highlighted');
                            });
                            
                            // Resaltar el espacio específico
                            espacioElement.classList.add('space-highlighted');
                            
                            // Hacer scroll hasta el espacio resaltado
                            setTimeout(() => {
                                espacioElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 500);
                            
                            // Remover el resaltado después de 3 segundos
                            setTimeout(() => {
                                espacioElement.classList.remove('space-highlighted');
                            }, 3000);
                        }
                    }, 500);
                }
            }, 300);
        } catch (error) {
            console.error('Error al navegar al espacio:', error);
        }
    } else {
        // Si no estamos en la página del cliente, redirigir
        window.location.href = '/GestionDeEspacios/frontend/cliente.html';
    }
}

// Función para enviar mensaje con Enter
function enviarMensajeEnter(event, idCliente) {
    if (event.key === 'Enter') {
        enviarMensajeRapido(idCliente);
    }
}

// Función para enviar mensaje rápido
async function enviarMensajeRapido(idCliente) {
    const input = document.getElementById('mensajeInput');
    const mensaje = input.value.trim();
    
    if (!mensaje) return;
    
    try {
        const token = obtenerToken();
        if (!token) {
            throw new Error('No se encontró token de sesión');
        }
        
        const response = await fetch('/GestionDeEspacios/backend/public/mensajes.php', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Auth-Token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'enviar_mensaje_cliente',
                id_cliente: idCliente,
                mensaje: mensaje
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Limpiar input
            input.value = '';
            
            // Recargar chat
            const nombreCliente = document.querySelector('.chat-header h3').textContent;
            cargarChatCliente(idCliente, nombreCliente);
        } else {
            throw new Error(data.message || 'Error al enviar mensaje');
        }
        
    } catch (error) {
        console.error('Error enviando mensaje:', error);
        mostrarCardEmergente(false, 'Error al enviar el mensaje');
    }
}

// Función para agrupar mensajes por publicación
function agruparMensajesPorPublicacion(mensajes) {
    
    const grupos = {};
    
    mensajes.forEach((mensaje, index) => {
        const idPublicacion = mensaje.id_publicacion;
        
        if (!grupos[idPublicacion]) {
            grupos[idPublicacion] = {
                publicacion: {
                    id: idPublicacion,
                    titulo: mensaje.nombre_publicacion || 'Sin título',
                    fecha_ultimo: mensaje.fecha_envio
                },
                mensajes: []
            };
        }
        grupos[idPublicacion].mensajes.push(mensaje);
    });
    
    // Ordenar por fecha del último mensaje
    const resultado = Object.values(grupos).sort((a, b) => 
        new Date(b.publicacion.fecha_ultimo) - new Date(a.publicacion.fecha_ultimo)
    );
    
    
    return resultado;
}

// Función para crear elemento de publicación en el chat
function crearPublicacionChat(grupoMensajes) {
    
    const publicacion = grupoMensajes.publicacion;
    const fecha = new Date(publicacion.fecha_ultimo);
    const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    
    // Obtener el ID del usuario logueado correctamente
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    let idUsuarioLogueado = null;
    
    if (usuarioLogueado) {
        try {
            const usuario = JSON.parse(usuarioLogueado);
            idUsuarioLogueado = usuario.id_usuario;
        } catch (e) {
            console.error('Error al parsear usuario logueado:', e);
        }
    }
    
    // Obtener el nombre del usuario al que le enviaste el mensaje (NO el emisor del último mensaje)
    // Buscar el mensaje que NO fue enviado por el usuario logueado
    const mensajeOtroUsuario = grupoMensajes.mensajes.find(mensaje => mensaje.id_emisor != idUsuarioLogueado);
    const nombreUsuario = mensajeOtroUsuario ? mensajeOtroUsuario.nombre_emisor : (grupoMensajes.mensajes[0] ? grupoMensajes.mensajes[0].nombre_receptor : 'Usuario');
    
    
    return `
        <div class="client-chat-item" data-id="${publicacion.id}" onclick="seleccionarPublicacion(${publicacion.id}, '${publicacion.titulo}')">
            <div class="client-avatar">
                <i class="fas fa-user-tie"></i>
            </div>
            <div class="client-info">
                <h4>${nombreUsuario}</h4>
                <p class="client-space">${publicacion.titulo}</p>
            </div>
            <div class="client-status">
                <span class="message-time">${hora}</span>
            </div>
        </div>
    `;
}

// Función para seleccionar una publicación
function seleccionarPublicacion(idPublicacion, tituloPublicacion) {
    // Remover selección anterior
    document.querySelectorAll('.client-chat-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Marcar como activo
    const selectedItem = document.querySelector(`[data-id="${idPublicacion}"]`);
    if (selectedItem) {
        selectedItem.classList.add('active');
    }
    
    // Cargar chat de la publicación
    cargarChatPublicacion(idPublicacion, tituloPublicacion);
}

// Función para cargar chat de una publicación específica
async function cargarChatPublicacion(idPublicacion, tituloPublicacion) {
    try {
        const token = obtenerToken();
        if (!token) {
            throw new Error('No se encontró token de sesión');
        }
        
        // Obtener el tipo de usuario del sessionStorage y capitalizarlo
        const tipoUsuario = sessionStorage.getItem('tipo_usuario') || 'cliente';
        const rolCapitalizado = tipoUsuario.charAt(0).toUpperCase() + tipoUsuario.slice(1).toLowerCase();
        
        const response = await fetch(`/GestionDeEspacios/backend/public/mensajes.php?tipo=consulta&publicacion=${idPublicacion}&rol=${rolCapitalizado}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Auth-Token': token,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarChatPublicacion(idPublicacion, tituloPublicacion, data.mensajes || []);
        } else {
            throw new Error(data.message || 'Error al cargar mensajes');
        }
        
    } catch (error) {
        console.error('Error cargando chat de la publicación:', error);
        mostrarCardEmergente(false, 'Error al cargar la conversación');
    }
}

// Función para mostrar el chat de una publicación
function mostrarChatPublicacion(idPublicacion, tituloPublicacion, mensajes) {
    const chatMain = document.querySelector('.chat-main');
    
    // Obtener el ID del usuario logueado correctamente
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    let idUsuarioLogueado = null;
    
    if (usuarioLogueado) {
        try {
            const usuario = JSON.parse(usuarioLogueado);
            idUsuarioLogueado = usuario.id_usuario;
        } catch (e) {
            console.error('Error al parsear usuario logueado:', e);
        }
    }
    
    // Obtener el nombre del usuario que envió el primer mensaje (el que hizo la consulta)
    // Buscar el mensaje que NO fue enviado por el usuario logueado (el administrador)
    // IMPORTANTE: Solo procesar mensajes de consulta (que tienen id_publicacion)
    
    // Filtrar solo mensajes de consulta (que tienen id_publicacion)
    const mensajesConsulta = mensajes.filter(mensaje => mensaje.id_publicacion);
    
    // Buscar el mensaje que NO fue enviado por el usuario logueado (el administrador)
    const mensajeAdministrador = mensajesConsulta.find(mensaje => {
        return mensaje.id_emisor != idUsuarioLogueado;
    });
    
    // Si no hay mensaje del administrador, usar el nombre_receptor del primer mensaje
    const nombreUsuario = mensajeAdministrador ? 
        mensajeAdministrador.nombre_emisor : 
        (mensajesConsulta[0] ? mensajesConsulta[0].nombre_receptor : 'Usuario');
    
    chatMain.innerHTML = `
        <div class="chat-header">
            <div class="chat-user-info">
                <div class="user-avatar">
                    <i class="fas fa-user-tie"></i>
                </div>
                <div class="user-details">
                    <h3>${nombreUsuario}</h3>
                    <span class="user-status">Consulta</span>
                </div>
            </div>
            <div class="chat-actions">
                <button class="chat-action-btn" onclick="eliminarConversacionConsultaCliente(${idPublicacion}, '${tituloPublicacion}')" title="Eliminar conversación">
                    <i class="fas fa-trash" style="color: #e74c3c;"></i>
                </button>
            </div>
        </div>
        <div class="chat-messages" id="chatMessages">
            ${mensajesConsulta.length > 0 ? mensajesConsulta.map(mensaje => crearMensajeChat(mensaje)).join('') : `
                <div class="no-messages">
                    <i class="fas fa-comment-slash"></i>
                    <p>No hay consultas aún</p>
                    <p>Las consultas sobre esta publicación aparecerán aquí</p>
                </div>
            `}
        </div>
        <div class="chat-input">
            <div class="input-group">
                <input type="text" id="mensajeInput" placeholder="Escribe tu consulta..." onkeypress="enviarRespuestaEnter(event, ${idPublicacion})">
                <button class="send-btn" onclick="enviarConsultaInicial(${idPublicacion})">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;
    
    // Scroll al final
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
}

// Función para enviar consulta con Enter
function enviarRespuestaEnter(event, idPublicacion) {
    if (event.key === 'Enter') {
        enviarConsultaInicial(idPublicacion);
    }
}

// Función para enviar consulta inicial (cliente)
async function enviarConsultaInicial(idPublicacion) {
    const input = document.getElementById('mensajeInput');
    const mensaje = input.value.trim();
    
    if (!mensaje) return;
    
    try {
        const token = obtenerToken();
        if (!token) {
            throw new Error('No se encontró token de sesión');
        }
        
        const response = await fetch('/GestionDeEspacios/backend/public/mensajes.php', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Auth-Token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'enviar_consulta',
                id_publicacion: idPublicacion,
                mensaje: mensaje
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Limpiar input
            input.value = '';
            
            // Recargar chat
            const tituloPublicacion = document.querySelector('.chat-header h3').textContent;
            cargarChatPublicacion(idPublicacion, tituloPublicacion);
        } else {
            throw new Error(data.message || 'Error al enviar consulta');
        }
        
    } catch (error) {
        console.error('Error enviando consulta:', error);
        mostrarCardEmergente(false, 'Error al enviar la consulta');
    }
}

// Función para enviar respuesta a consulta (administrador)
async function enviarRespuestaConsulta(idPublicacion) {
    const input = document.getElementById('mensajeInput');
    const mensaje = input.value.trim();
    
    if (!mensaje) return;
    
    try {
        const token = obtenerToken();
        if (!token) {
            throw new Error('No se encontró token de sesión');
        }
        
        const response = await fetch('/GestionDeEspacios/backend/public/mensajes.php', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Auth-Token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'responder_consulta',
                id_publicacion: idPublicacion,
                mensaje: mensaje
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Limpiar input
            input.value = '';
            
            // Recargar chat
            const tituloPublicacion = document.querySelector('.chat-header h3').textContent;
            cargarChatPublicacion(idPublicacion, tituloPublicacion);
        } else {
            throw new Error(data.message || 'Error al enviar respuesta');
        }
        
    } catch (error) {
        console.error('Error enviando respuesta:', error);
        mostrarCardEmergente(false, 'Error al enviar la respuesta');
    }
}
// ===== FUNCIONES PARA CALIFICACIONES DE ADMINISTRADOR =====
// Función para cargar el administrador asignado al cliente
async function cargarAdministradorAsignado() {
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (!usuarioLogueado) return;
        
        const usuario = JSON.parse(usuarioLogueado);
        const idCliente = usuario.id_usuario;
        
        const response = await fetch('/GestionDeEspacios/backend/public/calificar_administrador.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=obtener_administrador_asignado&id_cliente=${idCliente}`
        });
        
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('administradorSelect');
            select.innerHTML = '<option value="">Seleccionar administrador...</option>';
            
            if (data.administradores && data.administradores.length > 0) {
                // Agregar todos los administradores al select
                data.administradores.forEach(administrador => {
                    const option = document.createElement('option');
                    option.value = administrador.id_usuario;
                    option.textContent = `${administrador.nombre} ${administrador.apellido} - ${administrador.nombre_espacio}`;
                    select.appendChild(option);
                });
                
                // Si solo hay un administrador, seleccionarlo automáticamente
                if (data.administradores.length === 1) {
                    select.selectedIndex = 1; // Seleccionar el primer administrador (índice 1 porque 0 es el placeholder)
                }
                
                // No mostrar mensaje cuando hay administradores asignados
                mostrarMensajeAdministrador(data.administradores);
            } else {
                // Mostrar mensaje de que no hay administradores asignados
                mostrarMensajeSinAdministrador();
            }
        } else {
            throw new Error(data.message || 'Error al cargar administradores');
        }
        
    } catch (error) {
        console.error('Error al cargar administrador asignado:', error);
        mostrarMensajeSinAdministrador();
    }
}

// Función para mostrar mensaje cuando hay administradores asignados
function mostrarMensajeAdministrador(administradores) {
    const container = document.getElementById('calificacionesListAdmin');
    // No mostrar nada cuando hay administradores asignados, solo cargar las calificaciones
    container.innerHTML = '';
}

// Función para mostrar mensaje cuando no hay calificaciones
function mostrarMensajeSinCalificaciones() {
    const container = document.getElementById('calificacionesListAdmin');
    
    // Debugging: verificar si el contenedor existe
    if (!container) {
        console.error('Contenedor calificacionesListAdmin no encontrado');
        return;
    }
    
    console.log('Mostrando mensaje: No hay calificaciones disponibles');
    
    container.innerHTML = `
        <div class="no-calificaciones">
            <i class="fas fa-star"></i>
            <p>No hay calificaciones disponibles</p>
        </div>
    `;
}

// Función para mostrar mensaje cuando no hay administrador asignado
function mostrarMensajeSinAdministrador() {
    const container = document.getElementById('calificacionesListAdmin');
    container.innerHTML = `
        <div class="no-calificaciones">
            <i class="fas fa-exclamation-triangle"></i>
            <p>No tienes un administrador asignado</p>
            <p class="info-text">Contacta con el sistema para obtener un espacio asignado.</p>
        </div>
    `;
}

// Función para cargar calificaciones de administrador
async function cargarCalificacionesAdmin() {
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (!usuarioLogueado) {
            console.log('No hay usuario logueado, saltando carga de calificaciones');
            return;
        }
        
        const usuario = JSON.parse(usuarioLogueado);
        const idCliente = usuario.id_usuario;
        
        console.log('Cargando calificaciones para cliente ID:', idCliente);
        
        const response = await fetch('/GestionDeEspacios/backend/public/calificar_administrador.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=obtener_calificaciones_admin&id_cliente=${idCliente}`
        });
        
        const data = await response.json();
        
        console.log('Respuesta del servidor:', data);
        
        if (data.success) {
            console.log('Calificaciones recibidas:', data.calificaciones);
            console.log('Promedio general:', data.promedio_general);
            
            // Verificar si hay calificaciones y si el array no está vacío
            if (data.calificaciones && Array.isArray(data.calificaciones) && data.calificaciones.length > 0) {
                console.log('Mostrando calificaciones existentes');
                mostrarCalificacionesAdmin(data.calificaciones, data.promedio_general);
            } else {
                console.log('No hay calificaciones, mostrando mensaje');
                // Mostrar mensaje cuando no hay calificaciones
                mostrarMensajeSinCalificaciones();
            }
        } else {
            throw new Error(data.message || 'Error al cargar calificaciones');
        }
        
    } catch (error) {
        console.error('Error al cargar calificaciones:', error);
        const container = document.getElementById('calificacionesListAdmin');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error al cargar las calificaciones: ${error.message}</p>
                </div>
            `;
        } else {
            console.error('No se pudo mostrar el error: contenedor no encontrado');
        }
    }
}

// Función para mostrar las calificaciones
function mostrarCalificacionesAdmin(calificaciones, promedioGeneral) {
    const container = document.getElementById('calificacionesListAdmin');
    
    // Debugging: verificar si el contenedor existe
    if (!container) {
        console.error('Contenedor calificacionesListAdmin no encontrado en mostrarCalificacionesAdmin');
        return;
    }
    
    // Debugging: verificar datos recibidos
    console.log('Mostrando calificaciones:', calificaciones);
    console.log('Promedio general:', promedioGeneral);
    
    if (!calificaciones || !Array.isArray(calificaciones) || calificaciones.length === 0) {
        console.log('No hay calificaciones válidas, mostrando mensaje');
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-star"></i>
                <p>No hay calificaciones disponibles</p>
            </div>
        `;
        return;
    }

    const calificacionesHTML = calificaciones.map(calificacion => `
        <div class="calificacion-item">
            <div class="calificacion-header">
                <div class="cliente-info">
                    <div class="cliente-avatar">
                        ${(calificacion.administrador.nombre + ' ' + calificacion.administrador.apellido).split(' ').map(n => n[0]).join('')}
                    </div>
                    <div class="cliente-details">
                        <h4>${calificacion.administrador.nombre} ${calificacion.administrador.apellido}</h4>
                        <span class="espacio">RUT: ${calificacion.administrador.rut_numero}-${calificacion.administrador.rut_dv}</span>
                    </div>
                </div>
                <div class="calificacion-rating">
                    <div class="stars">
                        ${Array(5).fill(0).map((_, i) => 
                            `<i class="fas fa-star ${i < calificacion.promedio_calificacion ? 'active' : ''}"></i>`
                        ).join('')}
                    </div>
                    <span class="rating-number">${calificacion.promedio_calificacion}/5</span>
                </div>
            </div>
            <div class="calificacion-content">
                <p class="comentario">"${calificacion.comentario}"</p>
                <div class="calificacion-meta">
                    <span class="fecha">
                        <i class="fas fa-calendar"></i>
                        ${new Date(calificacion.fecha_calificacion).toLocaleDateString('es-ES')}
                    </span>
                </div>
                <div class="calificacion-actions">
                    <button class="btn-edit" onclick="editarCalificacionAdmin(${calificacion.id_calificacion})">
                        <i class="fas fa-edit"></i>
                        Editar
                    </button>
                    <button class="btn-delete" onclick="eliminarCalificacionAdmin(${calificacion.id_calificacion})">
                        <i class="fas fa-trash"></i>
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = calificacionesHTML;
    console.log('Calificaciones renderizadas correctamente:', calificaciones.length, 'elementos');
}

// Función para editar calificación de administrador
async function editarCalificacionAdmin(idCalificacion) {
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (!usuarioLogueado) return;
        
        const usuario = JSON.parse(usuarioLogueado);
        const idCliente = usuario.id_usuario;
        
        console.log('Editando calificación ID:', idCalificacion, 'Cliente ID:', idCliente);
        
        // Obtener datos de la calificación
        const response = await fetch('/GestionDeEspacios/backend/public/calificar_administrador.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=obtener_calificacion_por_id&id_calificacion=${idCalificacion}&id_cliente=${idCliente}`
        });
        
        const data = await response.json();
        console.log('Respuesta del servidor para editar:', data);
        
        if (data.success) {
            const calificacion = data.calificacion;
            
            // Llenar el modal con los datos existentes
            const selectEditar = document.getElementById('administradorSelectEditar');
            selectEditar.innerHTML = `<option value="${calificacion.id_usuario_admin}">${calificacion.nombre} ${calificacion.apellido}</option>`;
            selectEditar.value = calificacion.id_usuario_admin;
            setRatingEditarAdmin(calificacion.promedio_calificacion);
            document.getElementById('descripcionCalificacionEditarAdmin').value = calificacion.comentario;
            
            // Configurar el ID de la calificación en el formulario
            document.getElementById('formEditarCalificacionAdmin').setAttribute('data-calificacion-id', idCalificacion);
            
            // Mostrar el modal
            const modal = document.getElementById('modalEditarCalificacionAdmin');
            modal.style.display = 'flex';
            modal.classList.add('show');
            
        } else {
            mostrarCardEmergente(false, data.message || 'Error al cargar la calificación');
        }
        
    } catch (error) {
        console.error('Error al cargar calificación para editar:', error);
        mostrarCardEmergente(false, 'Error al cargar la calificación');
    }
}

// Función para eliminar calificación de administrador
async function eliminarCalificacionAdmin(idCalificacion) {
    try {
        // Crear modal de confirmación
        const modalHTML = `
            <div class="confirmation-modal">
                <div class="confirmation-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Confirmar Eliminación</h3>
                </div>
                <div class="confirmation-body">
                    <p>¿Estás seguro de que deseas eliminar esta <strong>calificación</strong>?</p>
                    <div class="confirmation-warning">
                        <i class="fas fa-exclamation-circle"></i>
                        Esta acción no se puede deshacer.
                    </div>
                </div>
                <div class="confirmation-actions">
                    <button class="btn-cancel" onclick="cerrarModalConfirmacionAdmin()">
                        <i class="fas fa-times"></i>
                        Cancelar
                    </button>
                    <button class="btn-confirm-delete" onclick="confirmarEliminacionCalificacionAdmin(${idCalificacion})">
                        <i class="fas fa-trash"></i>
                        Eliminar
                    </button>
                </div>
            </div>
        `;
        
        // Crear overlay si no existe
        let overlay = document.getElementById('confirmationOverlayAdmin');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'confirmationOverlayAdmin';
            overlay.className = 'confirmation-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = modalHTML;
        overlay.style.display = 'flex';
        
    } catch (error) {
        console.error('Error al mostrar modal de confirmación:', error);
        mostrarCardEmergente(false, 'Error al mostrar confirmación');
    }
}

// Función para confirmar eliminación de calificación de administrador
async function confirmarEliminacionCalificacionAdmin(idCalificacion) {
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (!usuarioLogueado) return;
        
        const usuario = JSON.parse(usuarioLogueado);
        const idCliente = usuario.id_usuario;
        
        const response = await fetch('/GestionDeEspacios/backend/public/calificar_administrador.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=eliminar_calificacion&id_calificacion=${idCalificacion}&id_cliente=${idCliente}`
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarCardEmergente(true, data.message || 'Calificación eliminada correctamente');
            cerrarModalConfirmacionAdmin();
            cargarCalificacionesAdmin(); // Recargar la lista
        } else {
            mostrarCardEmergente(false, data.message || 'Error al eliminar la calificación');
        }
        
    } catch (error) {
        console.error('Error al eliminar calificación:', error);
        mostrarCardEmergente(false, 'Error al eliminar la calificación');
    }
}

// Función para cerrar modal de confirmación de administrador
function cerrarModalConfirmacionAdmin() {
    const overlay = document.getElementById('confirmationOverlayAdmin');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Función para establecer rating en el modal de edición
function setRatingEditarAdmin(rating) {
    const stars = document.querySelectorAll('#starsInputEditarAdmin .fa-star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
    document.getElementById('calificacionValueEditarAdmin').value = rating;
    document.getElementById('ratingTextEditarAdmin').textContent = getRatingTextAdmin(rating);
}

// Función para generar estrellas del promedio
function generarEstrellasPromedioAdmin(promedio) {
    let html = '';
    const estrellasCompletas = Math.floor(promedio);
    const tieneMediaEstrella = promedio % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
        if (i <= estrellasCompletas) {
            html += '<i class="fas fa-star"></i>';
        } else if (i === estrellasCompletas + 1 && tieneMediaEstrella) {
            html += '<i class="fas fa-star-half-alt"></i>';
        } else {
            html += '<i class="far fa-star"></i>';
        }
    }
    
    return html;
}

// Función para generar estrellas de calificación individual
function generarEstrellasCalificacionAdmin(puntuacion) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= puntuacion) {
            html += '<i class="fas fa-star"></i>';
        } else {
            html += '<i class="far fa-star"></i>';
        }
    }
    return html;
}

// Función para formatear fecha
function formatearFechaAdmin(fecha) {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Función para inicializar sistema de estrellas
function inicializarEstrellasAdmin() {
    // Estrellas del formulario principal
    const starsInput = document.getElementById('starsInputAdmin');
    if (starsInput) {
        starsInput.addEventListener('click', function(e) {
            if (e.target.classList.contains('fa-star')) {
                const rating = parseInt(e.target.getAttribute('data-rating'));
                highlightStarsAdmin(rating);
                document.getElementById('calificacionValueAdmin').value = rating;
                document.getElementById('ratingTextAdmin').textContent = getRatingTextAdmin(rating);
            }
        });
        
        starsInput.addEventListener('mouseover', function(e) {
            if (e.target.classList.contains('fa-star')) {
                const rating = parseInt(e.target.getAttribute('data-rating'));
                highlightStarsAdmin(rating);
            }
        });
        
        starsInput.addEventListener('mouseout', function() {
            const currentRating = document.getElementById('calificacionValueAdmin').value;
            highlightStarsAdmin(currentRating || 0);
        });
    }
    
    // Estrellas del modal de edición
    const starsInputEditar = document.getElementById('starsInputEditarAdmin');
    if (starsInputEditar) {
        starsInputEditar.addEventListener('click', function(e) {
            if (e.target.classList.contains('fa-star')) {
                const rating = parseInt(e.target.getAttribute('data-rating'));
                highlightStarsEditarAdmin(rating);
                document.getElementById('calificacionValueEditarAdmin').value = rating;
                document.getElementById('ratingTextEditarAdmin').textContent = getRatingTextAdmin(rating);
            }
        });
        
        starsInputEditar.addEventListener('mouseover', function(e) {
            if (e.target.classList.contains('fa-star')) {
                const rating = parseInt(e.target.getAttribute('data-rating'));
                highlightStarsEditarAdmin(rating);
            }
        });
        
        starsInputEditar.addEventListener('mouseout', function() {
            const currentRating = document.getElementById('calificacionValueEditarAdmin').value;
            highlightStarsEditarAdmin(currentRating || 0);
        });
    }
}

// Función para resaltar estrellas
function highlightStarsAdmin(rating) {
    const stars = document.querySelectorAll('#starsInputAdmin .fa-star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// Función para resaltar estrellas del modal de edición
function highlightStarsEditarAdmin(rating) {
    const stars = document.querySelectorAll('#starsInputEditarAdmin .fa-star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}
// Función para obtener texto de calificación
function getRatingTextAdmin(rating) {
    const textos = {
        1: 'Muy malo',
        2: 'Malo',
        3: 'Regular',
        4: 'Bueno',
        5: 'Excelente'
    };
    return textos[rating] || 'Selecciona una calificación';
}

// Función para guardar calificación de administrador
async function guardarCalificacionAdmin(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        const usuario = JSON.parse(usuarioLogueado);
        
        const data = {
            action: 'guardar_calificacion_admin',
            id_cliente: usuario.id_usuario,
            id_administrador: formData.get('id_administrador'),
            calificacion: formData.get('calificacion'),
            descripcion: formData.get('descripcion')
        };
        
        console.log('Datos a enviar:', data);
        
        const response = await fetch('/GestionDeEspacios/backend/public/calificar_administrador.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarCardEmergente(true, result.message || 'Calificación guardada correctamente');
            limpiarFormularioCalificacionAdmin();
            cargarCalificacionesAdmin(); // Recargar la lista
        } else {
            mostrarCardEmergente(false, result.message || 'Error al guardar la calificación');
        }
        
    } catch (error) {
        console.error('Error al guardar calificación:', error);
        mostrarCardEmergente(false, 'Error al guardar la calificación');
    }
}

// Función para limpiar formulario
function limpiarFormularioCalificacionAdmin() {
    document.getElementById('formCalificacionAdmin').reset();
    document.getElementById('calificacionValueAdmin').value = '';
    document.getElementById('ratingTextAdmin').textContent = 'Selecciona una calificación';
    highlightStarsAdmin(0);
}

// Función para buscar calificaciones por nombre
async function buscarCalificacionesPorNombreAdmin() {
    console.log('=== INICIANDO BÚSQUEDA POR NOMBRE ===');
    
    try {
        const nombreBusqueda = document.getElementById('nombreBusquedaAdmin').value.trim();
        console.log('Nombre buscado:', nombreBusqueda);
        
        if (!nombreBusqueda) {
            console.log('Error: Nombre vacío');
            mostrarCardEmergente(false, 'Por favor ingresa un nombre');
            return;
        }
        
        if (nombreBusqueda.length < 2) {
            console.log('Error: Nombre muy corto');
            mostrarCardEmergente(false, 'El nombre debe tener al menos 2 caracteres');
            return;
        }
        
        console.log('Enviando petición al servidor...');
        const response = await fetch('/GestionDeEspacios/backend/public/calificar_administrador.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=buscar_calificaciones_por_nombre&nombre_busqueda=${encodeURIComponent(nombreBusqueda)}`
        });
        
        console.log('Respuesta del servidor:', response.status);
        const data = await response.json();
        console.log('Datos recibidos:', data);
        
        if (data.success) {
            if (data.administradores && data.administradores.length > 1) {
                console.log('Múltiples administradores encontrados:', data.administradores.length);
                // Mostrar lista de administradores para selección
                mostrarListaAdministradores(data.administradores);
            } else if (data.administrador) {
                console.log('Un administrador encontrado:', data.administrador);
                // Mostrar calificaciones del administrador único
                mostrarModalCalificacionesNombreAdmin(data.administrador, data.calificaciones, data.promedio_general);
            } else {
                console.log('No se encontraron administradores');
                mostrarCardEmergente(false, data.message || 'No se encontraron administradores');
            }
        } else {
            console.log('Error del servidor:', data.message);
            mostrarCardEmergente(false, data.message || 'Error al buscar calificaciones');
        }
        
    } catch (error) {
        console.error('Error al buscar calificaciones:', error);
        mostrarCardEmergente(false, 'Error al buscar calificaciones');
    }
    
    console.log('=== FIN BÚSQUEDA POR NOMBRE ===');
}

// Función para mostrar lista de administradores encontrados
function mostrarListaAdministradores(administradores) {
    const modal = document.getElementById('modalCalificacionesNombreAdmin');
    const infoContainer = document.getElementById('administradorInfoNombre');
    const calificacionesContainer = document.getElementById('calificacionesNombreListAdmin');
    
    // Mostrar lista de administradores
    infoContainer.innerHTML = `
        <div class="administradores-lista">
            <h4>Selecciona un administrador:</h4>
            <div class="administradores-grid">
                ${administradores.map(admin => `
                    <div class="administrador-item" onclick="seleccionarAdministradorCalificaciones(${admin.id_usuario})">
                        <div class="administrador-avatar">
                            ${admin.nombre.charAt(0)}${admin.apellido.charAt(0)}
                        </div>
                        <div class="administrador-info">
                            <h5>${admin.nombre} ${admin.apellido}</h5>
                            <p>RUT: ${admin.rut_numero}-${admin.rut_dv}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    calificacionesContainer.innerHTML = `
        <div class="no-calificaciones">
            <i class="fas fa-user"></i>
            <p>Selecciona un administrador para ver sus calificaciones</p>
        </div>
    `;
    
    modal.style.display = 'flex';
    modal.classList.add('show');
}

// Función para seleccionar un administrador de la lista (para calificaciones)
async function seleccionarAdministradorCalificaciones(idAdministrador) {
    try {
        const response = await fetch('/GestionDeEspacios/backend/public/calificar_administrador.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=buscar_calificaciones_por_rut&rut_busqueda=${idAdministrador}`
        });
        
        const data = await response.json();
        
        if (data.success && data.administrador) {
            mostrarModalCalificacionesNombreAdmin(data.administrador, data.calificaciones, data.promedio_general);
        } else {
            mostrarCardEmergente(false, 'Error al cargar calificaciones del administrador');
        }
        
    } catch (error) {
        console.error('Error al seleccionar administrador:', error);
        mostrarCardEmergente(false, 'Error al cargar calificaciones');
    }
}

// Función para mostrar modal de calificaciones por nombre
function mostrarModalCalificacionesNombreAdmin(administrador, calificaciones, promedioGeneral) {
    console.log('=== MOSTRANDO MODAL DE CALIFICACIONES ===');
    console.log('Administrador:', administrador);
    console.log('Calificaciones:', calificaciones);
    console.log('Promedio general:', promedioGeneral);
    
    const modal = document.getElementById('modalCalificacionesNombreAdmin');
    const infoContainer = document.getElementById('administradorInfoNombre');
    const calificacionesContainer = document.getElementById('calificacionesNombreListAdmin');
    
    console.log('Modal encontrado:', modal);
    console.log('Info container encontrado:', infoContainer);
    console.log('Calificaciones container encontrado:', calificacionesContainer);
    
    if (!modal) {
        console.error('ERROR: Modal no encontrado');
        return;
    }
    
    if (!infoContainer) {
        console.error('ERROR: Info container no encontrado');
        return;
    }
    
    if (!calificacionesContainer) {
        console.error('ERROR: Calificaciones container no encontrado');
        return;
    }
    
    // Mostrar información del administrador
    if (administrador) {
        console.log('Generando HTML para información del administrador...');
        infoContainer.innerHTML = `
            <div class="administrador-info-nombre">
                <h4>${administrador.nombre} ${administrador.apellido}</h4>
                <p>RUT: ${administrador.rut_numero}-${administrador.rut_dv}</p>
            </div>
        `;
    }
    
    // Mostrar calificaciones
    if (calificaciones.length === 0) {
        console.log('No hay calificaciones, mostrando mensaje...');
        calificacionesContainer.innerHTML = `
            <div class="no-calificaciones">
                <i class="fas fa-star"></i>
                <p>No hay calificaciones registradas para este administrador</p>
            </div>
        `;
    } else {
        console.log('Generando HTML para calificaciones...');
        let html = '';
        
        // Mostrar promedio general
        if (promedioGeneral > 0) {
            html += `
                <div class="calificaciones-resumen">
                    <div class="promedio-calificacion">
                        <div class="promedio-numero">${promedioGeneral}</div>
                        <div class="promedio-estrellas">
                            ${generarEstrellasPromedioAdmin(promedioGeneral)}
                        </div>
                        <div class="promedio-texto">Promedio General</div>
                    </div>
                </div>
            `;
        }
        
        // Mostrar calificaciones individuales
        calificaciones.forEach(calificacion => {
            html += `
                <div class="calificacion-item">
                    <div class="calificacion-header">
                        <div class="cliente-info">
                            <div class="cliente-avatar">
                                ${calificacion.cliente.nombre.charAt(0)}${calificacion.cliente.apellido.charAt(0)}
                            </div>
                            <div class="cliente-details">
                                <h4>${calificacion.cliente.nombre} ${calificacion.cliente.apellido}</h4>
                            </div>
                        </div>
                        <div class="calificacion-rating">
                            <div class="stars">
                                ${generarEstrellasCalificacionAdmin(calificacion.promedio_calificacion)}
                            </div>
                            <span class="rating-number">${calificacion.promedio_calificacion}/5</span>
                        </div>
                    </div>
                    <div class="calificacion-content">
                        <p class="comentario">"${calificacion.comentario}"</p>
                        <div class="calificacion-meta">
                            <span class="fecha">
                                <i class="fas fa-calendar"></i>
                                ${formatearFechaAdmin(calificacion.fecha_calificacion)}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        calificacionesContainer.innerHTML = html;
    }
    
    console.log('Mostrando modal...');
    modal.style.display = 'flex';
    modal.classList.add('show');
    console.log('Modal display establecido a flex y clase show agregada');
    console.log('=== FIN MOSTRAR MODAL ===');
}

// Función para cerrar modal de calificaciones por nombre
function cerrarModalCalificacionesNombreAdmin() {
    const modal = document.getElementById('modalCalificacionesNombreAdmin');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Función para buscar calificaciones por RUT (mantener para compatibilidad)

// Función para mostrar modal de calificaciones por RUT
function mostrarModalCalificacionesRUTAdmin(administrador, calificaciones, promedioGeneral) {
    const modal = document.getElementById('modalCalificacionesRUTAdmin');
    const infoContainer = document.getElementById('administradorInfoRUT');
    const calificacionesContainer = document.getElementById('calificacionesRUTListAdmin');
    
    // Mostrar información del administrador
    if (administrador) {
        infoContainer.innerHTML = `
            <div class="administrador-info-rut">
                <h4>${administrador.nombre} ${administrador.apellido}</h4>
                <p>RUT: ${administrador.rut_numero}-${administrador.rut_dv}</p>
            </div>
        `;
    }
    
    // Mostrar calificaciones
    if (calificaciones.length === 0) {
        calificacionesContainer.innerHTML = `
            <div class="no-calificaciones">
                <i class="fas fa-star"></i>
                <p>No hay calificaciones registradas para este administrador</p>
            </div>
        `;
    } else {
        let html = '';
        
        // Mostrar promedio general
        if (promedioGeneral > 0) {
            html += `
                <div class="calificaciones-resumen">
                    <div class="promedio-calificacion">
                        <div class="promedio-numero">${promedioGeneral}</div>
                        <div class="promedio-texto">Promedio General</div>
                        <div class="promedio-stars">${generarEstrellasPromedioAdmin(promedioGeneral)}</div>
                    </div>
                </div>
            `;
        }
        
        // Mostrar calificaciones individuales
        html += '<div class="calificaciones-lista">';
        
        calificaciones.forEach(calificacion => {
            html += `
                <div class="calificacion-item">
                    <div class="calificacion-header">
                        <div class="calificacion-cliente">
                            <div class="cliente-avatar">
                                ${calificacion.cliente.nombre.charAt(0)}${calificacion.cliente.apellido.charAt(0)}
                            </div>
                            <div class="cliente-info">
                                <h4>${calificacion.cliente.nombre} ${calificacion.cliente.apellido}</h4>
                                <p>RUT: ${calificacion.cliente.rut_numero}-${calificacion.cliente.rut_dv}</p>
                            </div>
                        </div>
                        <div class="calificacion-rating">
                            <div class="stars">${generarEstrellasCalificacionAdmin(calificacion.promedio_calificacion)}</div>
                            <span class="rating-number">${calificacion.promedio_calificacion}</span>
                        </div>
                    </div>
                    
                       <div class="calificacion-content">
                           <p>${calificacion.comentario}</p>
                       </div>
                       
                       <div class="calificacion-meta">
                           <div class="calificacion-fecha">${formatearFechaAdmin(calificacion.fecha_calificacion)}</div>
                       </div>
                </div>
            `;
        });
        
        html += '</div>';
        calificacionesContainer.innerHTML = html;
    }
    
    modal.style.display = 'flex';
    modal.classList.add('show');
}

// Función para cerrar modal de calificaciones por RUT
function cerrarModalCalificacionesRUTAdmin() {
    const modal = document.getElementById('modalCalificacionesRUTAdmin');
    modal.classList.remove('show');
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Función para cerrar modal de edición
function cerrarModalEditarCalificacionAdmin() {
    const modal = document.getElementById('modalEditarCalificacionAdmin');
    modal.classList.remove('show');
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
    
    // Limpiar formulario
    document.getElementById('formEditarCalificacionAdmin').reset();
    document.getElementById('calificacionValueEditarAdmin').value = '';
    document.getElementById('ratingTextEditarAdmin').textContent = 'Selecciona una calificación';
    highlightStarsEditarAdmin(0);
}

// Función para actualizar calificación desde el modal
async function actualizarCalificacionAdmin(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        const usuario = JSON.parse(usuarioLogueado);
        
        const idCalificacion = document.getElementById('formEditarCalificacionAdmin').getAttribute('data-calificacion-id');
        
        // Debugging: verificar valores del formulario
        const idAdminValue = formData.get('id_administrador');
        const calificacionValue = formData.get('calificacion');
        const descripcionValue = formData.get('descripcion');
        
        console.log('Valores del formulario:');
        console.log('- ID Administrador:', idAdminValue);
        console.log('- Calificación:', calificacionValue);
        console.log('- Descripción:', descripcionValue);
        
               const data = {
                   action: 'actualizar_calificacion_admin',
                   id_calificacion: idCalificacion,
                   id_cliente: usuario.id_usuario,
                   id_usuario_admin: idAdminValue,
                   calificacion: calificacionValue,
                   descripcion: descripcionValue
               };
        
        console.log('Datos a enviar para actualizar:', data);
        
        const response = await fetch('/GestionDeEspacios/backend/public/calificar_administrador.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarCardEmergente(true, result.message || 'Calificación actualizada correctamente');
            cerrarModalEditarCalificacionAdmin();
            cargarCalificacionesAdmin(); // Recargar la lista
        } else {
            mostrarCardEmergente(false, result.message || 'Error al actualizar la calificación');
        }
        
    } catch (error) {
        console.error('Error al actualizar calificación:', error);
        mostrarCardEmergente(false, 'Error al actualizar la calificación');
    }
}