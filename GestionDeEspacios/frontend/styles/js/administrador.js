// menu.js extraído de admin_box.js
// Función para inicializar el menú (con verificación de sesión)
function inicializarMenu() {
    // Verificar si hay usuario logueado
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    const tipoUsuario = sessionStorage.getItem('tipo_usuario');
    
    if (!usuarioLogueado || tipoUsuario !== 'administrador') {
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

// Función para ir a Registrar Espacios
function irARegistrarEspacios() {
    // Buscar el elemento del menú "Registrar Espacios"
    const menuItems = document.querySelectorAll('.menu-item');
    let registrarEspaciosItem = null;
    
    menuItems.forEach(item => {
        const span = item.querySelector('span');
        if (span && span.textContent === 'Registrar Espacios') {
            registrarEspaciosItem = item;
        }
    });
    
    if (registrarEspaciosItem) {
        setActiveMenu(registrarEspaciosItem);
    } else {
        console.error('No se encontró el menú "Registrar Espacios"');
        // Fallback: cambiar contenido directamente
        cambiarContenido('Registrar Espacios');
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
    
    // Detectar vista por atributo data-view si existe, sino usar texto del span
    const dataView = menuItem.getAttribute('data-view');
    const menuText = dataView ? dataView : menuItem.querySelector('span').textContent;
    
    // Cambiar el contenido según la opción seleccionada
    cambiarContenido(menuText);
    
    // En móviles, cerrar el sidebar después de seleccionar
    if (window.innerWidth <= 600) {
        closeMobileMenu();
    }
}
// Función para cambiar el contenido del panel principal
function cambiarContenido(opcion) {
    const container = document.querySelector('.container');
    // Normalizar la opción para tolerar cambios de texto en el menú
    if (typeof opcion === 'string') {
        const k = opcion.toLowerCase().trim();
        // Mapear claves de data-view directamente
        if (k === 'reportes-incidencias') {
            opcion = 'Reportes de Incidencias';
        } else if (k === 'generar-reportes') {
            opcion = 'Generar Reportes';
        } else if (k === 'solicitudes-horario') {
            opcion = 'Solicitudes Cambio de Horario';
        } else if (k.includes('reportes de incidencias') || (k.includes('reportes') && k.includes('incid'))) {
            opcion = 'Reportes de Incidencias';
        } else if (k === 'reportes') { // compatibilidad con nombre anterior
            opcion = 'Reportes de Incidencias';
        } else if (k.includes('generar') && k.includes('reportes')) {
            opcion = 'Generar Reportes';
        }
    }
    
    switch(opcion) {
		case 'Generar Reportes':
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
					<h2>Generar Reportes</h2>
					<p>Crea y exporta reportes del sistema</p>
				</div>
				<div class="search-filters-card">
					<h3><i class="fas fa-filter"></i> Filtros del Reporte</h3>
					<div id="generarReportesFiltros" class="filters-grid">
						<div class="filter-group">
							<label>Tipo de Reporte</label>
						<select id="reporteTipo" class="filter-select">
							<option value="asignaciones">Asignaciones de espacios</option>
							<option value="historial_asignaciones">Historial de clientes asignados</option>
							<option value="publicaciones">Publicaciones de arriendo</option>
							<option value="colaboradores">Colaboradores</option>
							<option value="calificaciones">Calificaciones de clientes</option>
							<option value="reportes">Reportes recibidos</option>
							<option value="solicitudes">Solicitudes de cambio de horario</option>
							<option value="pagos">Mis pagos realizados</option>
						</select>
						</div>
						<div class="filter-group">
							<label>Desde</label>
							<input type="date" id="reporteDesde" class="filter-select" placeholder="dd-mm-aaaa">
						</div>
						<div class="filter-group">
							<label>Hasta</label>
							<input type="date" id="reporteHasta" class="filter-select" placeholder="dd-mm-aaaa">
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
				<div id="reporteResultsCard" class="reports-results-card" style="display:none;">
					<div class="reports-results-header">
						<h3><i class="fas fa-table"></i> Resultados del Reporte</h3>
						<p id="reporteResumen" class="reports-results-subtitle"></p>
					</div>
					<div class="reports-results-body">
						<div id="reporteResultado"></div>
					</div>
				</div>
			`;
			inicializarGeneradorReportes();
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
                    <h2>Bienvenido al Panel de Administración</h2>
                    <p>Gestiona tus Espacios desde aquí</p>
                </div>

                <div class="subscription-info" id="subscriptionInfo">
                    <div class="subscription-card inicio">
                        <h3>Información de Suscripción</h3>
                        <div class="subscription-details">
                            <div class="subscription-plan">
                                <span class="plan-name" id="planName">Cargando...</span>
                                <span class="plan-price" id="planPrice"></span>
                            </div>
                            <div class="usage-stats">
                                <div class="stat-item">
                                    <i class="fas fa-building"></i>
                                    <div class="stat-content">
                                        <span class="stat-label">Espacios</span>
                                        <div class="stat-bar">
                                            <div class="stat-progress" id="espaciosProgress"></div>
                                        </div>
                                        <span class="stat-text" id="espaciosText">0/0</span>
                                    </div>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-calendar-alt"></i>
                                    <div class="stat-content">
                                        <span class="stat-label">Publicaciones</span>
                                        <div class="stat-bar">
                                            <div class="stat-progress" id="publicacionesProgress"></div>
                                        </div>
                                        <span class="stat-text" id="publicacionesText">0/0</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-metrics" id="dashboardMetrics">
                    <div class="dashboard-metrics-card">
                        <h3 style="margin-top:.25rem;">Resumen general</h3>
                        <div class="metrics-grid">
                        <div class="metric-card">
                            <div class="metric-title"><i class="fas fa-flag"></i> Reportes recibidos</div>
                            <div class="metric-values">
                                <div><span class="metric-number" id="rep_total">-</span><span class="metric-label">Total</span></div>
                                <div><span class="metric-number" id="rep_resueltos">-</span><span class="metric-label">Resueltos</span></div>
                                <div><span class="metric-number" id="rep_revisados">-</span><span class="metric-label">Revisados</span></div>
                                <div><span class="metric-number" id="rep_pendientes">-</span><span class="metric-label">Pendientes</span></div>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-title"><i class="fas fa-exchange-alt"></i> Solicitudes de cambio de horario</div>
                            <div class="metric-values">
                                <div><span class="metric-number" id="sol_total">-</span><span class="metric-label">Total</span></div>
                                <div><span class="metric-number" id="sol_aprobadas">-</span><span class="metric-label">Aprobadas</span></div>
                                <div><span class="metric-number" id="sol_rechazadas">-</span><span class="metric-label">Rechazadas</span></div>
                                <div><span class="metric-number" id="sol_pendientes">-</span><span class="metric-label">Pendientes</span></div>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-title"><i class="fas fa-user-check"></i> Calificaciones a clientes</div>
                            <div class="metric-values">
                                <div><span class="metric-number" id="cal_cli_total">-</span><span class="metric-label">Total</span></div>
                            </div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-title"><i class="fas fa-door-open"></i> Calificaciones de espacios</div>
                            <div class="metric-values">
                                <div><span class="metric-number" id="cal_esp_total">-</span><span class="metric-label">Total</span></div>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>

            `;
            
            // Cargar información de suscripción después de mostrar el contenido
            setTimeout(() => {
                cargarInformacionSuscripcion();
                try { cargarDashboardAdmin(); } catch(_){ }
            }, 100);
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
                    <h2>Mi Perfil de Administrador</h2>
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
                                    <p>Administrador del Sistema</p>
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

                        <!-- Sección de Mi Suscripción -->
                        <div class="subscription-card">
                            <div class="subscription-header">
                                <h3><i class="fas fa-crown"></i> Mi Suscripción Actual</h3>
                                <p>Información de tu plan de suscripción</p>
                            </div>
                            
                            <div class="subscription-content">
                                <div class="subscription-info">
                                    <div class="info-item">
                                        <label>Plan de Suscripción</label>
                                        <span id="subscriptionName">Cargando...</span>
                                    </div>
                                    <div class="info-item">
                                        <label>Cantidad de espacios para gestionar</label>
                                        <span id="subscriptionSpaces">Cargando...</span>
                                    </div>
                                </div>
                                <div class="subscription-actions">
                                    <button class="change-subscription-btn" onclick="cambiarSuscripcion()">
                                        <i class="fas fa-exchange-alt"></i> Cambiar Suscripción
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            cargarDatosPerfil();
            cargarDatosSuscripcion();
            break;
        case 'Registrar Espacios':
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
                    <h2>Registrar Nuevo Espacio</h2>
                    <p>Completa la información para registrar un nuevo espacio</p>
                </div>

                <div class="usage-header" id="espaciosUsageHeader">
                    <div class="usage-info">
                        <i class="fas fa-building"></i>
                        <div class="usage-details">
                            <span class="usage-title">Uso de Espacios</span>
                            <span class="usage-text" id="espaciosUsageText">Cargando información...</span>
                        </div>
                    </div>
                </div>
                
                <div class="register-space-section">
                    <div class="register-space-card">
                        <div class="form-header">
                            <h3><i class="fas fa-building"></i> Registrar Nuevo Espacio</h3>
                            <p>Completa los datos para crear un nuevo espacio</p>
                        </div>
                        
                        <form class="register-space-form" id="registerSpaceForm" onsubmit="registrarEspacio(event)">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="nombreEspacio">Nombre del Espacio *</label>
                                    <input type="text" id="nombreEspacio" name="nombre_espacio" placeholder="Ej: Consultorio 1" required>
                                </div>
                                <div class="form-group">
                                    <label for="tipoEspacio">Tipo de Espacio *</label>
                                    <select id="tipoEspacio" name="tipo_espacio" required>
                                        <option value="">Selecciona un tipo</option>
                                        <option value="Consultorio">Consultorio</option>
                                        <option value="Sala de Procedimientos">Sala de Procedimientos</option>
                                        <option value="Sala de Espera">Sala de Espera</option>
                                        <option value="Oficina">Oficina</option>
                                        <option value="Laboratorio">Laboratorio</option>
                                        <option value="Farmacia">Farmacia</option>
                                        <option value="Recepción">Recepción</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="metrosCuadrados">Metros Cuadrados *</label>
                                    <input type="number" id="metrosCuadrados" name="metros_cuadrados" step="0.01" min="1" placeholder="Ej: 25.50" required>
                                </div>
                                <div class="form-group">
                                    <label for="region">Región *</label>
                                    <select id="region" name="region" required>
                                        <option value="">Selecciona una región</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="direccion">Dirección *</label>
                                    <input type="text" id="direccion" name="direccion" placeholder="Dirección completa del espacio" required>
                                </div>
                                <div class="form-group">
                                    <label for="ciudad">Ciudad *</label>
                                    <select id="ciudad" name="ciudad" required>
                                        <option value="">Selecciona una ciudad</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="ubicacionInterna">Ubicación Interna</label>
                                <input type="text" id="ubicacionInterna" name="ubicacion_interna" placeholder="Ej: Planta baja, Oficina 201">
                            </div>
                            
                            <div class="form-group">
                                <label>Fotos del Espacio (Máximo 5 fotos)</label>
                                <div class="photo-upload-grid">
                                    <div class="photo-upload-item">
                                        <input type="file" id="foto1" name="foto1" accept="image/*" onchange="previewImage(this, 'preview1')">
                                        <label for="foto1" class="photo-upload-label">
                                            <i class="fas fa-camera"></i>
                                            <span>IMG</span>
                                        </label>
                                        <div id="preview1" class="photo-preview"></div>
                                    </div>
                                    <div class="photo-upload-item">
                                        <input type="file" id="foto2" name="foto2" accept="image/*" onchange="previewImage(this, 'preview2')">
                                        <label for="foto2" class="photo-upload-label">
                                            <i class="fas fa-camera"></i>
                                            <span>IMG</span>
                                        </label>
                                        <div id="preview2" class="photo-preview"></div>
                                    </div>
                                    <div class="photo-upload-item">
                                        <input type="file" id="foto3" name="foto3" accept="image/*" onchange="previewImage(this, 'preview3')">
                                        <label for="foto3" class="photo-upload-label">
                                            <i class="fas fa-camera"></i>
                                            <span>IMG</span>
                                        </label>
                                        <div id="preview3" class="photo-preview"></div>
                                    </div>
                                    <div class="photo-upload-item">
                                        <input type="file" id="foto4" name="foto4" accept="image/*" onchange="previewImage(this, 'preview4')">
                                        <label for="foto4" class="photo-upload-label">
                                            <i class="fas fa-camera"></i>
                                            <span>IMG</span>
                                        </label>
                                        <div id="preview4" class="photo-preview"></div>
                                    </div>
                                    <div class="photo-upload-item">
                                        <input type="file" id="foto5" name="foto5" accept="image/*" onchange="previewImage(this, 'preview5')">
                                        <label for="foto5" class="photo-upload-label">
                                            <i class="fas fa-camera"></i>
                                            <span>IMG</span>
                                        </label>
                                        <div id="preview5" class="photo-preview"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Equipamiento del Espacio</label>
                                <div class="equipment-section">
                                    <div class="equipment-list" id="equipmentList">
                                        <!-- Los equipos se agregarán dinámicamente aquí -->
                                    </div>
                                    <button type="button" class="add-equipment-btn" onclick="agregarEquipamiento()">
                                        <i class="fas fa-plus"></i> Agregar Equipamiento
                                    </button>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Horarios del Espacio</label>
                                <div class="schedule-section">
                                    <div class="schedule-list" id="scheduleList">
                                        <!-- Los horarios se agregarán dinámicamente aquí -->
                                    </div>
                                    <button type="button" class="add-schedule-btn" onclick="agregarHorario()">
                                        <i class="fas fa-plus"></i> Agregar Horario
                                    </button>
                                </div>
                            </div>
                            
                            <button type="submit" class="register-btn">
                                <i class="fas fa-plus-circle"></i> Registrar Espacio
                            </button>
                        </form>
                    </div>
                </div>
            `;
            cargarRegionesYCiudadesEspacios();
            
            // Cargar información de uso de espacios
            setTimeout(() => {
                cargarInformacionUsoEspacios();
            }, 100);
            break;
        case 'Gestionar Espacios':
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
                    <h2>Gestionar Espacios</h2>
                    <p>Administra los espacios disponibles </p>
                </div>
                
                <div class="manage-section">
                    
                    <div class="spaces-grid" id="spacesGrid">
                        <div class="loading-spaces">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>Cargando espacios...</p>
                        </div>
                    </div>
                </div>
            `;
            cargarEspacios();
            break;
        case 'Gestionar Médicos':
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
                    <h2>Gestionar Médicos</h2>
                    <p>Administra el personal médico, especialidades y horarios</p>
                </div>
                
                <div class="manage-section">
                    <div class="action-bar">
                        <button class="add-btn">
                            <i class="fas fa-plus"></i> Agregar Médico
                        </button>
                        <div class="search-box">
                            <input type="text" placeholder="Buscar médico...">
                            <i class="fas fa-search"></i>
                        </div>
                    </div>
                    
                    <div class="doctors-list">
                        <div class="doctor-item">
                            <div class="doctor-avatar">JD</div>
                            <div class="doctor-info">
                                <h4>Dr. Juan Pérez</h4>
                                <p>Cardiología</p>
                            </div>
                            <div class="doctor-actions">
                                <button class="edit-btn"><i class="fas fa-edit"></i></button>
                                <button class="delete-btn"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                        
                        <div class="doctor-item">
                            <div class="doctor-avatar">ML</div>
                            <div class="doctor-info">
                                <h4>Dra. María López</h4>
                                <p>Pediatría</p>
                            </div>
                            <div class="doctor-actions">
                                <button class="edit-btn"><i class="fas fa-edit"></i></button>
                                <button class="delete-btn"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
        case 'Gestionar Colaboradores':
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
                    <h2>Gestionar Colaboradores</h2>
                    <p>Administra la base de datos de colaboradores y sus perfiles</p>
                </div>
                
                 <div class="manage-section">
                     <!-- Formulario de registro/edición -->
                     <div id="formulario-colaborador" class="register-colaborador-section">
                         <div class="register-form-container">
                             <div class="form-header">
                                <h3 id="titulo-formulario"><i class="fas fa-user-tie"></i> Registrar Nuevo Colaborador</h3>
                                <p>Completa los datos para crear un nuevo colaborador</p>
                             </div>
                         <form id="formColaborador" onsubmit="procesarFormularioColaborador(event)">
                             <input type="hidden" id="id_colaborador_edit" name="id_colaborador" value="">
                             
                             <div class="form-row">
                                 <div class="form-group">
                                     <label for="nombre_usuario">Nombre de Usuario *</label>
                                     <input type="text" id="nombre_usuario" name="nombre_usuario" required>
                                 </div>
                                 
                                 <div class="form-group">
                                     <label for="contrasena">Contraseña *</label>
                                     <input type="password" id="contrasena" name="contrasena" required minlength="6">
                                 </div>
                             </div>
                             
                             <div class="form-row">
                                 <div class="form-group">
                                     <label for="rut">RUT *</label>
                                     <input type="text" id="rut" name="rut" placeholder="12345678" required maxlength="8">
                                 </div>
                                 <div class="form-group">
                                     <label for="dv">DV *</label>
                                     <input type="text" id="dv" name="dv" placeholder="9" required maxlength="1">
                                 </div>
                             </div>
                             
                             <div class="form-row">
                                 <div class="form-group">
                                     <label for="nombre">Nombre *</label>
                                     <input type="text" id="nombre" name="nombre" required>
                                 </div>
                                 <div class="form-group">
                                     <label for="apellido">Apellido *</label>
                                     <input type="text" id="apellido" name="apellido" required>
                                 </div>
                             </div>
                             
                             <div class="form-group">
                                 <label for="correo_electronico">Correo Electrónico *</label>
                                 <input type="email" id="correo_electronico" name="correo_electronico" required>
                             </div>
                             
                             <div class="form-group">
                                 <label for="telefono">Teléfono</label>
                                 <input type="tel" id="telefono" name="telefono">
                             </div>
                             
                             <div class="form-row">
                                 <div class="form-group">
                                     <label for="region">Región</label>
                                     <select id="region" name="region" onchange="cargarCiudades()">
                                         <option value="">Seleccionar región...</option>
                                     </select>
                                 </div>
                                 <div class="form-group">
                                     <label for="ciudad">Ciudad</label>
                                     <select id="ciudad" name="ciudad">
                                         <option value="">Seleccionar ciudad...</option>
                                     </select>
                                 </div>
                             </div>
                             
                             <div class="form-group">
                                 <label for="direccion">Dirección</label>
                                 <textarea id="direccion" name="direccion" rows="3"></textarea>
                             </div>
                             
                             <div class="form-group">
                                 <label class="checkbox-label">
                                     <input type="checkbox" id="activo" name="activo" checked>
                                     <span class="checkmark"></span>
                                     Colaborador activo
                                 </label>
                             </div>
                             
                             <div class="form-actions">
                                 <button type="button" class="cancel-btn" onclick="cerrarFormularioColaborador()">
                                     <i class="fas fa-times"></i> Cancelar
                                 </button>
                                 <button type="submit" class="submit-btn">
                                     <i class="fas fa-save"></i> <span id="texto-boton">Registrar</span>
                                 </button>
                             </div>
                         </form>
                         </div>
                     </div>
                    
                    <div id="colaboradores-list" class="colaboradores-list">
                        <!-- Lista de colaboradores se cargará aquí -->
                    </div>
                </div>

                <!-- Modal para editar colaborador -->
                <div id="modalEditarColaborador" class="modal-overlay" style="display: none;">
                    <div class="modal-content modal-colaborador">
                        <div class="modal-header">
                            <h3><i class="fas fa-user-tie"></i> Editar Colaborador</h3>
                            <p>Modifica los datos de la colaborador seleccionada</p>
                            <button class="close-modal" onclick="cerrarModalEditarColaborador()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form id="formEditarColaborador" onsubmit="actualizarColaborador(event)">
                                <input type="hidden" id="id_colaborador_modal" name="id_colaborador" value="">
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="nombre_usuario_modal">Nombre de Usuario *</label>
                                        <input type="text" id="nombre_usuario_modal" name="nombre_usuario" required>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="contrasena_modal">Nueva Contraseña</label>
                                        <input type="password" id="contrasena_modal" name="contrasena" placeholder="Dejar vacío para mantener la actual">
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="rut_modal">RUT *</label>
                                        <input type="text" id="rut_modal" name="rut" placeholder="12345678" required maxlength="8">
                                    </div>
                                    <div class="form-group">
                                        <label for="dv_modal">DV *</label>
                                        <input type="text" id="dv_modal" name="dv" placeholder="9" required maxlength="1">
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="nombre_modal">Nombre *</label>
                                        <input type="text" id="nombre_modal" name="nombre" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="apellido_modal">Apellido *</label>
                                        <input type="text" id="apellido_modal" name="apellido" required>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="correo_electronico_modal">Correo Electrónico *</label>
                                    <input type="email" id="correo_electronico_modal" name="correo_electronico" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="telefono_modal">Teléfono</label>
                                    <input type="tel" id="telefono_modal" name="telefono">
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="region_modal">Región</label>
                                        <select id="region_modal" name="region" onchange="cargarCiudadesModal()">
                                            <option value="">Seleccionar región...</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="ciudad_modal">Ciudad</label>
                                        <select id="ciudad_modal" name="ciudad">
                                            <option value="">Seleccionar ciudad...</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="direccion_modal">Dirección</label>
                                    <textarea id="direccion_modal" name="direccion" rows="3"></textarea>
                                </div>
                                
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="activo_modal" name="activo" checked>
                                        <span class="checkmark"></span>
                                        Colaborador activo
                                    </label>
                                </div>
                                
                                <div class="modal-actions">
                                    <button type="button" class="cancel-btn" onclick="cerrarModalEditarColaborador()">
                                        <i class="fas fa-times"></i> Cancelar
                                    </button>
                                    <button type="submit" class="submit-btn">
                                        <i class="fas fa-save"></i> Actualizar Colaborador
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            // Cargar colaboradores cuando se selecciona el menú
            setTimeout(() => {
                cargarColaboradores();
            }, 100);
            break;
            
        case 'Publicar Arriendo':
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
                    <h2>Publicar Arriendo</h2>
                    <p>Completa la información para publicar tu espacio en arriendo</p>
                </div>

                <div class="usage-header" id="arriendoUsageHeader">
                    <div class="usage-info">
                        <i class="fas fa-calendar-alt"></i>
                        <div class="usage-details">
                            <span class="usage-title">Uso de Publicaciones</span>
                            <span class="usage-text" id="arriendoUsageText">Cargando información...</span>
                        </div>
                    </div>
                </div>
                
                <div class="register-space-section">
                    <div class="register-space-card">
                        <div class="form-header">
                            <h3><i class="fas fa-calendar-alt"></i> Publicar Arriendo</h3>
                            <p>Completa los datos para publicar tu espacio en arriendo</p>
                        </div>
                        
                        <form class="register-space-form" id="publicarArriendoForm" onsubmit="publicarArriendo(event)">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="tituloArriendo">Título de la Publicación *</label>
                                    <input type="text" id="tituloArriendo" name="titulo" placeholder="Ej: Oficina moderna en el centro" required maxlength="100">
                                </div>
                                <div class="form-group">
                                    <label for="tipoEspacioArriendo">Tipo de Espacio *</label>
                                    <select id="tipoEspacioArriendo" name="tipo_espacio" required>
                                        <option value="">Selecciona un tipo</option>
                                        <option value="Oficina">Oficina</option>
                                        <option value="Local Comercial">Local Comercial</option>
                                        <option value="Sala de Reuniones">Sala de Reuniones</option>
                                        <option value="Consultorio">Consultorio</option>
                                        <option value="Depósito">Depósito</option>
                                        <option value="Bodega">Bodega</option>
                                        <option value="Estacionamiento">Estacionamiento</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="descripcionArriendo">Descripción *</label>
                                <textarea id="descripcionArriendo" name="descripcion" rows="4" placeholder="Describe tu espacio, sus características y ventajas..." required></textarea>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="metrosCuadradosArriendo">Metros Cuadrados *</label>
                                    <input type="number" id="metrosCuadradosArriendo" name="metros_cuadrados" step="0.01" min="1" placeholder="Ej: 25.50" required>
                                </div>
                                <div class="form-group">
                                    <label for="precioArriendo">Precio de Arriendo (CLP) *</label>
                                    <input type="number" id="precioArriendo" name="precio_arriendo" step="0.01" min="1" placeholder="Ej: 150000" required>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="regionArriendo">Región *</label>
                                    <select id="regionArriendo" name="region" required onchange="cargarCiudadesArriendo()">
                                        <option value="">Selecciona una región</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="ciudadArriendo">Ciudad *</label>
                                    <select id="ciudadArriendo" name="ciudad" required>
                                        <option value="">Selecciona una ciudad</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="direccionArriendo">Dirección *</label>
                                <input type="text" id="direccionArriendo" name="direccion" placeholder="Dirección completa del espacio" required maxlength="255">
                            </div>
                            
                            <div class="form-group">
                                <label for="equipamientoArriendo">Equipamiento Incluido</label>
                                <textarea id="equipamientoArriendo" name="equipamiento" rows="3" placeholder="Lista el equipamiento que incluye el arriendo (muebles, equipos, etc.)"></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label>Fotos del Espacio (Máximo 5 fotos)</label>
                                <div class="photo-upload-grid">
                                    <div class="photo-upload-item">
                                        <input type="file" id="foto1" name="foto1" accept="image/*" onchange="previewImage(this, 'preview1')">
                                        <label for="foto1" class="photo-upload-label">
                                            <i class="fas fa-camera"></i>
                                            <span>IMG</span>
                                        </label>
                                        <div id="preview1" class="photo-preview"></div>
                                    </div>
                                    <div class="photo-upload-item">
                                        <input type="file" id="foto2" name="foto2" accept="image/*" onchange="previewImage(this, 'preview2')">
                                        <label for="foto2" class="photo-upload-label">
                                            <i class="fas fa-camera"></i>
                                            <span>IMG</span>
                                        </label>
                                        <div id="preview2" class="photo-preview"></div>
                                    </div>
                                    <div class="photo-upload-item">
                                        <input type="file" id="foto3" name="foto3" accept="image/*" onchange="previewImage(this, 'preview3')">
                                        <label for="foto3" class="photo-upload-label">
                                            <i class="fas fa-camera"></i>
                                            <span>IMG</span>
                                        </label>
                                        <div id="preview3" class="photo-preview"></div>
                                    </div>
                                    <div class="photo-upload-item">
                                        <input type="file" id="foto4" name="foto4" accept="image/*" onchange="previewImage(this, 'preview4')">
                                        <label for="foto4" class="photo-upload-label">
                                            <i class="fas fa-camera"></i>
                                            <span>IMG</span>
                                        </label>
                                        <div id="preview4" class="photo-preview"></div>
                                    </div>
                                    <div class="photo-upload-item">
                                        <input type="file" id="foto5" name="foto5" accept="image/*" onchange="previewImage(this, 'preview5')">
                                        <label for="foto5" class="photo-upload-label">
                                            <i class="fas fa-camera"></i>
                                            <span>IMG</span>
                                        </label>
                                        <div id="preview5" class="photo-preview"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="register-btn">
                                    <i class="fas fa-paper-plane"></i> Publicar Arriendo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <div class="arriendos-sistema-section">
                    <div class="arriendos-header">
                        <h3><i class="fas fa-calendar-alt"></i> Mis Publicaciones de Arriendo</h3>
                        <p>Gestiona tus espacios publicados en arriendo</p>
                    </div>
                    <div id="arriendosList" class="arriendos-grid">
                        <div class="loading-spinner">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>Cargando publicaciones...</p>
                        </div>
                    </div>
                </div>
            `;
            
            // Cargar regiones al mostrar el formulario
            cargarRegionesArriendo();
            // Cargar arriendos del usuario
            cargarArriendosUsuario();
            
            // Cargar información de uso de publicaciones
            setTimeout(() => {
                cargarInformacionUsoPublicaciones();
            }, 100);
            break;
        case 'Calificaciones de Clientes':
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
                    <h2>Calificaciones de Clientes</h2>
                    <p>Gestiona y revisa las calificaciones de tus clientes</p>
                </div>

                <div class="calificaciones-section">

                    <!-- Formulario de calificación siempre visible -->
                    <div class="formulario-calificacion">
                        <h3>Calificar Cliente</h3>
                        <form id="formCalificacion" onsubmit="guardarCalificacion(event)">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="clienteSelect">Seleccionar Cliente *</label>
                                    <select id="clienteSelect" name="id_cliente" required>
                                        <option value="">Seleccionar cliente...</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label>Calificación *</label>
                                    <div class="rating-input">
                                        <div class="stars-input" id="starsInput">
                                            <i class="fas fa-star" data-rating="1"></i>
                                            <i class="fas fa-star" data-rating="2"></i>
                                            <i class="fas fa-star" data-rating="3"></i>
                                            <i class="fas fa-star" data-rating="4"></i>
                                            <i class="fas fa-star" data-rating="5"></i>
                                        </div>
                                        <span class="rating-text" id="ratingText">Selecciona una calificación</span>
                                    </div>
                                    <input type="hidden" id="calificacionValue" name="calificacion" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="descripcionCalificacion">Descripción del Comportamiento *</label>
                                <textarea 
                                    id="descripcionCalificacion" 
                                    name="descripcion" 
                                    rows="3" 
                                    placeholder="Describe el comportamiento observado..."
                                    required
                                ></textarea>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="tipoComportamiento">Tipo de Comportamiento *</label>
                                    <select id="tipoComportamiento" name="tipo_comportamiento" required>
                                        <option value="">Seleccionar tipo...</option>
                                        <option value="Positivo">Positivo</option>
                                        <option value="Negativo">Negativo</option>
                                        <option value="Neutro">Neutro</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="nivelGravedad">Nivel de Gravedad *</label>
                                    <select id="nivelGravedad" name="nivel_gravedad" required>
                                        <option value="">Seleccionar nivel...</option>
                                        <option value="1">1 - Muy Bueno</option>
                                        <option value="2">2 - Bueno</option>
                                        <option value="3">3 - Regular</option>
                                        <option value="4">4 - Malo</option>
                                        <option value="5">5 - Muy Malo</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn-primary">
                                    <i class="fas fa-save"></i>
                                    Guardar Calificación
                                </button>
                            </div>
                        </form>
                    </div>

                    <!-- Buscador de calificaciones por RUT -->
                    <div class="buscar-calificaciones">
                        <h3>Buscar Calificaciones por RUT</h3>
                        <div class="search-form">
                            <div class="form-group">
                                <label for="rutBusqueda">RUT del Cliente</label>
                                <div class="search-input-container">
                                    <input 
                                        type="text" 
                                        id="rutBusqueda" 
                                        name="rut_busqueda"
                                        placeholder="Ej: 12.345.678-9"
                                        maxlength="12"
                                    >
                                    <button type="button" class="btn-search" onclick="buscarCalificacionesPorRUT()">
                                        <i class="fas fa-search"></i>
                                        Buscar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="calificaciones-list" id="calificacionesList">
                        <div class="loading-spinner">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>Cargando calificaciones...</p>
                        </div>
                    </div>
                </div>

                <!-- Modal para editar calificación -->
                <div id="modalEditarCalificacion" class="modal-overlay" style="display: none;">
                    <div class="modal-content modal-calificacion">
                        <div class="modal-header">
                            <h3>Editar Calificación</h3>
                            <button class="close-modal" onclick="cerrarModalEditarCalificacion()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form id="formEditarCalificacion" onsubmit="actualizarCalificacion(event)">
                                <div class="form-group">
                                    <label for="clienteSelectEditar">Cliente</label>
                                    <select id="clienteSelectEditar" name="id_cliente" required disabled>
                                        <option value="">Seleccionar cliente...</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label>Calificación *</label>
                                    <div class="rating-input">
                                        <div class="stars-input" id="starsInputEditar">
                                            <i class="fas fa-star" data-rating="1"></i>
                                            <i class="fas fa-star" data-rating="2"></i>
                                            <i class="fas fa-star" data-rating="3"></i>
                                            <i class="fas fa-star" data-rating="4"></i>
                                            <i class="fas fa-star" data-rating="5"></i>
                                        </div>
                                        <span class="rating-text" id="ratingTextEditar">Selecciona una calificación</span>
                                    </div>
                                    <input type="hidden" id="calificacionValueEditar" name="calificacion" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="descripcionCalificacionEditar">Descripción del Comportamiento *</label>
                                    <textarea 
                                        id="descripcionCalificacionEditar" 
                                        name="descripcion" 
                                        rows="3" 
                                        placeholder="Describe el comportamiento observado..."
                                        required
                                    ></textarea>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="tipoComportamientoEditar">Tipo de Comportamiento *</label>
                                        <select id="tipoComportamientoEditar" name="tipo_comportamiento" required>
                                            <option value="">Seleccionar tipo...</option>
                                            <option value="Positivo">Positivo</option>
                                            <option value="Negativo">Negativo</option>
                                            <option value="Neutro">Neutro</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="nivelGravedadEditar">Nivel de Gravedad *</label>
                                        <select id="nivelGravedadEditar" name="nivel_gravedad" required>
                                            <option value="">Seleccionar nivel...</option>
                                            <option value="1">1 - Muy Bueno</option>
                                            <option value="2">2 - Bueno</option>
                                            <option value="3">3 - Regular</option>
                                            <option value="4">4 - Malo</option>
                                            <option value="5">5 - Muy Malo</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="modal-actions">
                                    <button type="button" class="btn-secondary" onclick="cerrarModalEditarCalificacion()">
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

                <!-- Modal para mostrar calificaciones por RUT -->
                <div id="modalCalificacionesRUT" class="modal-overlay" style="display: none;">
                    <div class="modal-content modal-calificaciones-rut">
                        <div class="modal-header">
                            <h3>Calificaciones del Cliente</h3>
                            <button class="close-modal" onclick="cerrarModalCalificacionesRUT()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div id="clienteInfoRUT" class="cliente-info-rut">
                                <!-- Información del cliente se carga aquí -->
                            </div>
                            <div id="calificacionesRUTList" class="calificaciones-rut-list">
                                <div class="loading-spinner">
                                    <i class="fas fa-spinner fa-spin"></i>
                                    <p>Cargando calificaciones...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            `;
            
            // Cargar calificaciones y clientes cuando se selecciona el menú
            setTimeout(() => {
                cargarCalificaciones();
                cargarClientesCalificables();
                configurarEstrellasEditar(); // Configurar estrellas del modal
            }, 100);
            break;
            
        case 'Reportes de Incidencias':
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
                    <h2>Gestionar Reportes de Incidencias</h2>
                    <p>Revisa y responde los reportes de incidencias de tus espacios</p>
                </div>
                
                <div class="reports-section">
                    <div class="reports-board">
                        <div class="reports-header">
                            <h3>Reportes de Incidencias Recibidos</h3>
                            <div class="filter-actions">
                                <select id="filterEstado" class="filter-select">
                                    <option value="">Todos los estados</option>
                                    <option value="Enviado">Recibido</option>
                                    <option value="Revisado">Revisado</option>
                                    <option value="Resuelto">Resuelto</option>
                                </select>
                            </div>
                        </div>
                        <div id="reportesList" class="reports-cards">Cargando reportes...</div>
                    </div>
                </div>
            `;
            cargarReportes();
            break;
            
        case 'Solicitudes Cambio de Horario':
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
                    <h2>Gestionar Solicitudes de Cambio de Horario</h2>
                    <p>Revisa y gestiona las solicitudes de cambio de horario de tus espacios</p>
                </div>
                
                <div class="reports-section">
                    <div class="reports-board">
                        <div class="reports-header">
                            <h3>Solicitudes Recibidas</h3>
                            <div class="filter-actions">
                                <select id="filterEstadoSolicitud" class="filter-select">
                                    <option value="">Todos los estados</option>
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="Aprobado">Aprobado</option>
                                    <option value="Rechazado">Rechazado</option>
                                </select>
                            </div>
                        </div>
                        <div id="solicitudesList" class="reports-cards">Cargando solicitudes...</div>
                    </div>
                </div>
            `;
            cargarSolicitudesHorario();
            break;
            
        case 'Suscripciones':
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
                    <h2>Suscripciones</h2>
                    <p>Gestiona tu plan de suscripción y espacios disponibles</p>
                </div>
                
                <div id="suscripcionContent">
                    <div style="text-align:center;padding:2rem;">
                        <i class="fas fa-spinner fa-spin" style="font-size:2em;color:#3498db;"></i>
                        <p>Cargando información de suscripción...</p>
                    </div>
                </div>
            `;
            cargarInformacionSuscripcion();
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
                    <h2>Privilegios del Sistema</h2>
                    <p>Obten los privilegios de cliente en el sistema</p>
                </div>
                
                <div class="privileges-info-section">
                    <div class="privileges-info-card">
                        <div class="privileges-header">
                            <i class="fas fa-user-check"></i>
                            <h3>Privilegios de Cliente</h3>
                        </div>
                        <div class="privileges-content">
                            <p class="privileges-description">
                                Como administrador, también tienes acceso a <strong>privilegios de cliente</strong> que te permiten 
                                utilizar el sistema desde la perspectiva del usuario final.
                            </p>
                            
                            <div class="privileges-features">
                                <div class="privilege-item">
                                    <i class="fas fa-building"></i>
                                    <div class="privilege-content">
                                        <h4>Espacios Asignados</h4>
                                        <p>Visualizar y gestionar los espacios que tienes asignados como cliente</p>
                                    </div>
                                </div>
                                
                                <div class="privilege-item">
                                    <i class="fas fa-clock"></i>
                                    <div class="privilege-content">
                                        <h4>Solicitudes de Horario</h4>
                                        <p>Realizar solicitudes de cambio de horario para tus espacios asignados</p>
                                    </div>
                                </div>
                                
                                <div class="privilege-item">
                                    <i class="fas fa-chart-bar"></i>
                                    <div class="privilege-content">
                                        <h4>Reportes y Estadísticas</h4>
                                        <p>Acceder a reportes personalizados de tu uso del sistema</p>
                                    </div>
                                </div>
                                
                                <div class="privilege-item">
                                    <i class="fas fa-user"></i>
                                    <div class="privilege-content">
                                        <h4>Perfil de Cliente</h4>
                                        <p>Mantener actualizada tu información personal y preferencias</p>
                                    </div>
                                </div>
                                
                            </div>
                            
                            <div class="privileges-benefits">
                                <h4>Beneficios de los Privilegios de Cliente:</h4>
                                <ul>
                                    <li><i class="fas fa-check-circle"></i> <strong>Experiencia completa:</strong> Prueba el sistema desde la perspectiva del usuario final</li>
                                    <li><i class="fas fa-check-circle"></i> <strong>Mejor gestión:</strong> Comprende mejor las necesidades de tus clientes</li>
                                    <li><i class="fas fa-check-circle"></i> <strong>Doble funcionalidad:</strong> Administra espacios y úsalos como cliente</li>
                                    <li><i class="fas fa-check-circle"></i> <strong>Optimización:</strong> Identifica oportunidades de mejora en tus servicios</li>
                                </ul>
                            </div>
                            
                            <div class="privileges-action">
                                <button class="btn-activate-privileges" onclick="mostrarConfirmacionActivarPrivilegios()">
                                    <i class="fas fa-user-plus"></i>
                                    Activar Privilegios de Cliente
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
            `;
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
                    <p>Gestiona los mensajes del sistema</p>
                </div>
                
                <!-- Selector de tipo de mensajes -->
                <div class="messages-type-selector">
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="messageType" value="asignacion" checked>
                            <span class="radio-custom"></span>
                            <span class="radio-label">
                                <i class="fas fa-building"></i>
                                Mensajes de Asignación
                            </span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="messageType" value="consulta">
                            <span class="radio-custom"></span>
                            <span class="radio-label">
                                <i class="fas fa-user-tie"></i>
                                Mensajes de Consulta
                            </span>
                        </label>
                    </div>
                </div>
                
                <!-- Contenedor de mensajes -->
                <div class="messages-container">
                    <div id="messagesList" class="messages-list">
                        <!-- Los mensajes se cargarán aquí dinámicamente -->
                    </div>
                </div>
                
                <!-- Botones de acción -->
                <div class="messages-actions">
                </div>
                
                
            `;
            // Configurar eventos para los mensajes
            configurarMensajes();
            cargarMensajes('asignacion'); // Cargar mensajes de asignación por defecto
            break;
            
        default:
            // Mantener el contenido actual si no se reconoce la opción
            break;
    }
}

// Función para cargar datos del perfil
async function cargarDatosPerfil() {
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    
    if (usuarioLogueado) {
        try {
            const usuario = JSON.parse(usuarioLogueado);
            
            // Debug: Mostrar datos del usuario
            console.log('Datos del usuario en cargarDatosPerfil:', usuario);
            console.log('Región del usuario:', usuario.region);
            console.log('Ciudad del usuario:', usuario.ciudad);
            
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

// Función para cargar ciudades por región
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
        
        const response = await fetch('../backend/public/actualizar_perfil.php', {
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
        
        const response = await fetch('../backend/public/actualizar_perfil.php', {
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

// Función para cargar datos de la suscripción
async function cargarDatosSuscripcion() {
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    
    if (usuarioLogueado) {
        try {
            const usuario = JSON.parse(usuarioLogueado);
            
            // Hacer petición para obtener datos de la suscripción
            const response = await fetch('../backend/public/obtener_suscripcion.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_suscripcion: usuario.id_suscripcion
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                const suscripcion = result.suscripcion;
                
                // Actualizar los elementos en la interfaz
                document.getElementById('subscriptionName').textContent = suscripcion.nombre_suscripcion;
                document.getElementById('subscriptionSpaces').textContent = suscripcion.cantidad_espacios;
            } else {
                // Mostrar valores por defecto si hay error
                document.getElementById('subscriptionName').textContent = 'No disponible';
                document.getElementById('subscriptionSpaces').textContent = 'No disponible';
            }
        } catch (error) {
            console.error('Error al cargar datos de suscripción:', error);
            // Mostrar valores por defecto en caso de error
            document.getElementById('subscriptionName').textContent = 'Error al cargar';
            document.getElementById('subscriptionSpaces').textContent = 'Error al cargar';
        }
    }
}

// Función para cambiar suscripción
function cambiarSuscripcion() {
    mostrarCardEmergente(false, 'Función de cambio de suscripción próximamente disponible');
}

// Función para cargar regiones y ciudades para el formulario de espacios
async function cargarRegionesYCiudadesEspacios() {
    try {
        const response = await fetch('../backend/public/regiones_chile.php?action=regiones');
        const data = await response.json();
        
        if (data.success && data.regiones) {
            const regionSelect = document.getElementById('region');
            regionSelect.innerHTML = '<option value="">Selecciona una región</option>';
            
            // Llenar select de regiones
            data.regiones.forEach(region => {
                const option = document.createElement('option');
                option.value = region.nombre_region;
                option.textContent = region.nombre_region;
                regionSelect.appendChild(option);
            });
            
            // Agregar evento para cargar ciudades cuando cambie la región
            regionSelect.addEventListener('change', function() {
                if (this.value) {
                    cargarCiudadesPorRegionEspacios(this.value);
                } else {
                    const ciudadSelect = document.getElementById('ciudad');
                    ciudadSelect.innerHTML = '<option value="">Selecciona una ciudad</option>';
                }
            });
        } else {
            console.error('Error al cargar regiones:', data.message || 'Error desconocido');
        }
        
    } catch (error) {
        console.error('Error al cargar regiones:', error);
    }
}

// Función para cargar ciudades por región para el formulario de espacios
async function cargarCiudadesPorRegionEspacios(region) {
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
        
        const ciudadSelect = document.getElementById('ciudad');
        ciudadSelect.innerHTML = '<option value="">Selecciona una ciudad</option>';
        
        if (data.success && data.ciudades) {
            data.ciudades.forEach(ciudad => {
                const option = document.createElement('option');
                option.value = ciudad.nombre_ciudad;
                option.textContent = ciudad.nombre_ciudad;
                ciudadSelect.appendChild(option);
            });
        } else {
            console.error('Error al cargar ciudades:', data.message || 'Error desconocido');
        }
        
    } catch (error) {
        console.error('Error al cargar ciudades:', error);
    }
}

// Función para previsualizar imágenes
function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview" style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px;">
                <button type="button" onclick="removeImage('${input.id}', '${previewId}')" style="position: absolute; top: 5px; right: 5px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px;">×</button>
            `;
            preview.style.position = 'relative';
        };
        
        reader.readAsDataURL(input.files[0]);
    }
}

// Función para remover imagen
function removeImage(inputId, previewId) {
    document.getElementById(inputId).value = '';
    document.getElementById(previewId).innerHTML = '';
}

// Función para remover foto (para arriendos)
function removePhoto(inputId, previewId) {
    document.getElementById(inputId).value = '';
    document.getElementById(previewId).innerHTML = '';
    
    // Agregar campo oculto para indicar que la foto fue eliminada
    const form = document.getElementById('editarArriendoForm');
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = inputId.replace('edit', 'remove');
    hiddenInput.value = 'true';
    
    // Remover input anterior si existe
    const existingInput = form.querySelector(`input[name="${inputId.replace('edit', 'remove')}"]`);
    if (existingInput) {
        existingInput.remove();
    }
    
    form.appendChild(hiddenInput);
}
// Variable para contar equipos agregados
let equipmentCounter = 0;
// Variable para contar horarios agregados
let scheduleCounter = 0;
// Función para agregar equipamiento
function agregarEquipamiento() {
    equipmentCounter++;
    
    const equipmentList = document.getElementById('equipmentList');
    const equipmentItem = document.createElement('div');
    equipmentItem.className = 'equipment-item';
    equipmentItem.id = `equipment-${equipmentCounter}`;
    
    equipmentItem.innerHTML = `
        <div class="equipment-header">
            <h4>Equipamiento ${equipmentCounter}</h4>
            <button type="button" class="remove-equipment-btn" onclick="removerEquipamiento(${equipmentCounter})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="equipment-fields">
            <div class="form-row">
                <div class="form-group">
                    <label>Nombre del Equipamiento *</label>
                    <input type="text" name="equipamiento[${equipmentCounter}][nombre]" placeholder="Ej: Mesa de examen" required>
                </div>
                <div class="form-group">
                    <label>Cantidad *</label>
                    <input type="number" name="equipamiento[${equipmentCounter}][cantidad]" min="1" value="1" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Tipo de Equipamiento</label>
                    <input type="text" name="equipamiento[${equipmentCounter}][tipo]" placeholder="Ej: Médico, Tecnológico, Mueble">
                </div>
                <div class="form-group">
                    <label>Estado</label>
                    <select name="equipamiento[${equipmentCounter}][estado]">
                        <option value="Disponible">Disponible</option>
                        <option value="En Uso">En Uso</option>
                        <option value="Mantenimiento">Mantenimiento</option>
                        <option value="Fuera de Servicio">Fuera de Servicio</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Descripción del Equipamiento</label>
                    <input type="text" name="equipamiento[${equipmentCounter}][descripcion]" placeholder="Descripción del equipamiento">
                </div>
                <div class="form-group">
                    <label>Descripción del Tipo</label>
                    <input type="text" name="equipamiento[${equipmentCounter}][descripcion_tipo]" placeholder="Descripción específica del tipo">
                </div>
            </div>
        </div>
    `;
    
    equipmentList.appendChild(equipmentItem);
}

// Función para remover equipamiento
function removerEquipamiento(id) {
    const equipmentItem = document.getElementById(`equipment-${id}`);
    if (equipmentItem) {
        equipmentItem.remove();
        
        // Recontar y renumerar los elementos restantes
        const equipmentList = document.getElementById('equipmentList');
        const remainingItems = equipmentList.querySelectorAll('.equipment-item');
        
        // Si no quedan elementos, reiniciar el contador
        if (remainingItems.length === 0) {
            equipmentCounter = 0;
        } else {
            // Renumerar los elementos restantes
            remainingItems.forEach((item, index) => {
                const newId = index + 1;
                item.id = `equipment-${newId}`;
                
                // Actualizar el título
                const title = item.querySelector('h4');
                if (title) {
                    title.textContent = `Equipamiento ${newId}`;
                }
                
                // Actualizar el onclick del botón de eliminar
                const removeBtn = item.querySelector('.remove-equipment-btn');
                if (removeBtn) {
                    removeBtn.setAttribute('onclick', `removerEquipamiento(${newId})`);
                }
                
                // Actualizar los nombres de los inputs
                const inputs = item.querySelectorAll('input, select');
                inputs.forEach(input => {
                    const name = input.getAttribute('name');
                    if (name) {
                        const newName = name.replace(/\[\d+\]/, `[${newId}]`);
                        input.setAttribute('name', newName);
                    }
                });
            });
            
            // Actualizar el contador al último número usado
            equipmentCounter = remainingItems.length;
        }
    }
}
// Función para agregar horario
function agregarHorario() {
    scheduleCounter++;
    
    const scheduleList = document.getElementById('scheduleList');
    const scheduleItem = document.createElement('div');
    scheduleItem.className = 'schedule-item';
    scheduleItem.id = `schedule-${scheduleCounter}`;
    
    scheduleItem.innerHTML = `
        <div class="schedule-header">
            <h4>Horario ${scheduleCounter}</h4>
            <button type="button" class="remove-schedule-btn" onclick="removerHorario(${scheduleCounter})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="schedule-fields">
            <div class="form-row">
                <div class="form-group">
                    <label>Tipo de Horario *</label>
                    <select name="horarios[${scheduleCounter}][nombre_dia]" required>
                        <option value="">Selecciona un tipo</option>
                        <option value="Lunes a Viernes">Lunes a Viernes</option>
                        <option value="Lunes a Sábado">Lunes a Sábado</option>
                        <option value="Lunes a Domingo">Lunes a Domingo</option>
                        <option value="Martes a Viernes">Martes a Viernes</option>
                        <option value="Martes a Sábado">Martes a Sábado</option>
                        <option value="Martes a Domingo">Martes a Domingo</option>
                        <option value="Miércoles a Viernes">Miércoles a Viernes</option>
                        <option value="Miércoles a Sábado">Miércoles a Sábado</option>
                        <option value="Miércoles a Domingo">Miércoles a Domingo</option>
                        <option value="Jueves a Viernes">Jueves a Viernes</option>
                        <option value="Jueves a Sábado">Jueves a Sábado</option>
                        <option value="Jueves a Domingo">Jueves a Domingo</option>
                        <option value="Viernes a Domingo">Viernes a Domingo</option>
                        <option value="Sábado y Domingo">Sábado y Domingo</option>
                        <option value="Solo Sábado">Solo Sábado</option>
                        <option value="Solo Domingo">Solo Domingo</option>
                        <option value="Personalizado">Personalizado</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Descripción</label>
                    <input type="text" name="horarios[${scheduleCounter}][descripcion]" placeholder="Ej: Horario de atención matutino">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Hora de Inicio *</label>
                    <input type="time" name="horarios[${scheduleCounter}][hora_inicio]" required>
                </div>
                <div class="form-group">
                    <label>Hora de Fin *</label>
                    <input type="time" name="horarios[${scheduleCounter}][hora_fin]" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Fecha de Inicio *</label>
                    <input type="date" name="horarios[${scheduleCounter}][fecha_inicio]" required>
                </div>
                <div class="form-group">
                    <label>Fecha de Término *</label>
                    <input type="date" name="horarios[${scheduleCounter}][fecha_termino]" required>
                </div>
            </div>
        </div>
    `;
    
    scheduleList.appendChild(scheduleItem);
}

// Función para remover horario
function removerHorario(id) {
    const scheduleItem = document.getElementById(`schedule-${id}`);
    if (scheduleItem) {
        scheduleItem.remove();
        
        // Verificar si quedan horarios
        const scheduleList = document.getElementById('scheduleList');
        const remainingItems = scheduleList.querySelectorAll('.schedule-item');
        
        if (remainingItems.length === 0) {
            // Si no quedan horarios, resetear el contador
            scheduleCounter = 0;
        } else {
            // Renumerar los horarios restantes y ajustar el contador
            let newIndex = 0;
            remainingItems.forEach(item => {
                // Actualizar el ID del elemento
                item.id = `schedule-${newIndex + 1}`;
                
                // Actualizar el título
                item.querySelector('h4').textContent = `Horario ${newIndex + 1}`;
                
                // Actualizar el botón de eliminar
                const removeBtn = item.querySelector('.remove-schedule-btn');
                if (removeBtn) {
                    removeBtn.setAttribute('onclick', `removerHorario(${newIndex + 1})`);
                }
                
                // Actualizar los nombres de los inputs
                const inputs = item.querySelectorAll('input, select');
                inputs.forEach(input => {
                    const name = input.getAttribute('name');
                    if (name) {
                        const newName = name.replace(/\[\d+\]/, `[${newIndex}]`);
                        input.setAttribute('name', newName);
                    }
                });
                
                newIndex++;
            });
            
            // Ajustar el contador al número de elementos restantes
            scheduleCounter = remainingItems.length;
        }
    }
}
// Función para registrar espacio
async function registrarEspacio(event) {
    event.preventDefault();
    
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    
    if (!usuarioLogueado) {
        mostrarCardEmergente(false, 'No hay sesión activa');
        return;
    }
    
    try {
        const usuario = JSON.parse(usuarioLogueado);
        const formData = new FormData();
        
        // Agregar datos del formulario
        formData.append('action', 'registrar_espacio');
        formData.append('id_administrador', usuario.id_usuario);
        formData.append('nombre_espacio', document.getElementById('nombreEspacio').value.trim());
        formData.append('tipo_espacio', document.getElementById('tipoEspacio').value);
        formData.append('metros_cuadrados', document.getElementById('metrosCuadrados').value);
        formData.append('ciudad', document.getElementById('ciudad').value);
        formData.append('region', document.getElementById('region').value);
        formData.append('direccion', document.getElementById('direccion').value.trim());
        formData.append('ubicacion_interna', document.getElementById('ubicacionInterna').value.trim());
        formData.append('disponible', '1'); // Siempre disponible por defecto
        
        // Agregar archivos de fotos
        const fotoInputs = ['foto1', 'foto2', 'foto3', 'foto4', 'foto5'];
        fotoInputs.forEach(fotoId => {
            const fileInput = document.getElementById(fotoId);
            if (fileInput.files[0]) {
                formData.append(fotoId, fileInput.files[0]);
            }
        });
        
        // Agregar datos del equipamiento
        const equipmentItems = document.querySelectorAll('.equipment-item');
        const equipamiento = [];
        
        equipmentItems.forEach((item, index) => {
            const nombre = item.querySelector(`input[name="equipamiento[${index + 1}][nombre]"]`)?.value;
            const cantidad = item.querySelector(`input[name="equipamiento[${index + 1}][cantidad]"]`)?.value;
            const descripcion = item.querySelector(`input[name="equipamiento[${index + 1}][descripcion]"]`)?.value;
            const estado = item.querySelector(`select[name="equipamiento[${index + 1}][estado]"]`)?.value;
            const tipo = item.querySelector(`input[name="equipamiento[${index + 1}][tipo]"]`)?.value;
            const descripcion_tipo = item.querySelector(`input[name="equipamiento[${index + 1}][descripcion_tipo]"]`)?.value;
            
            if (nombre && cantidad) {
                equipamiento.push({
                    nombre: nombre.trim(),
                    cantidad: parseInt(cantidad),
                    descripcion: descripcion ? descripcion.trim() : '',
                    estado: estado || 'Disponible',
                    tipo: tipo ? tipo.trim() : '',
                    descripcion_tipo: descripcion_tipo ? descripcion_tipo.trim() : ''
                });
            }
        });
        
        formData.append('equipamiento', JSON.stringify(equipamiento));
        
        // Agregar datos de horarios
        const scheduleItems = document.querySelectorAll('.schedule-item');
        const horarios = [];
        
        // Debug: Log de elementos encontrados
        console.log('Elementos de horarios encontrados:', scheduleItems.length);
        
        scheduleItems.forEach((item, index) => {
            console.log(`Procesando horario ${index + 1}:`, item);
            
            const nombre_dia = item.querySelector(`select[name="horarios[${index + 1}][nombre_dia]"]`)?.value;
            const hora_inicio = item.querySelector(`input[name="horarios[${index + 1}][hora_inicio]"]`)?.value;
            const hora_fin = item.querySelector(`input[name="horarios[${index + 1}][hora_fin]"]`)?.value;
            const fecha_inicio = item.querySelector(`input[name="horarios[${index + 1}][fecha_inicio]"]`)?.value;
            const fecha_termino = item.querySelector(`input[name="horarios[${index + 1}][fecha_termino]"]`)?.value;
            const descripcion = item.querySelector(`input[name="horarios[${index + 1}][descripcion]"]`)?.value;
            
            console.log(`Horario ${index + 1} datos:`, {
                nombre_dia, hora_inicio, hora_fin, fecha_inicio, fecha_termino, descripcion
            });
            
            // Debug: Mostrar valores específicos para identificar qué falta
            console.log(`Campos específicos del horario ${index + 1}:`);
            console.log('- nombre_dia:', nombre_dia, '(tipo:', typeof nombre_dia, ')');
            console.log('- hora_inicio:', hora_inicio, '(tipo:', typeof hora_inicio, ')');
            console.log('- hora_fin:', hora_fin, '(tipo:', typeof hora_fin, ')');
            console.log('- fecha_inicio:', fecha_inicio, '(tipo:', typeof fecha_inicio, ')');
            console.log('- fecha_termino:', fecha_termino, '(tipo:', typeof fecha_termino, ')');
            console.log('- descripcion:', descripcion, '(tipo:', typeof descripcion, ')');
            
            if (nombre_dia && hora_inicio && hora_fin && fecha_inicio && fecha_termino) {
                horarios.push({
                    nombre_dia: nombre_dia.trim(),
                    hora_inicio: hora_inicio,
                    hora_fin: hora_fin,
                    fecha_inicio: fecha_inicio,
                    fecha_termino: fecha_termino,
                    descripcion: descripcion ? descripcion.trim() : ''
                });
                console.log(`Horario ${index + 1} agregado al array`);
            } else {
                console.log(`Horario ${index + 1} no cumple validaciones`);
            }
        });
        
        formData.append('horarios', JSON.stringify(horarios));
        
        // Debug: Log de horarios a enviar
        console.log('Horarios a enviar:', horarios);
        
        // Validaciones
        if (!formData.get('nombre_espacio') || !formData.get('tipo_espacio') || !formData.get('metros_cuadrados') || !formData.get('ciudad') || !formData.get('region') || !formData.get('direccion')) {
            mostrarCardEmergente(false, 'Los campos marcados con * son obligatorios');
            return;
        }
        
        if (parseFloat(formData.get('metros_cuadrados')) <= 0) {
            mostrarCardEmergente(false, 'Los metros cuadrados deben ser mayor a 0');
            return;
        }
        
        const response = await fetch('../backend/public/gestionarespacios.php', {
            method: 'POST',
            body: formData
        });
        
        // Verificar si la respuesta es JSON válido
        const responseText = await response.text();
        console.log('Respuesta del servidor:', responseText);
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (error) {
            console.error('Error al parsear JSON:', error);
            console.error('Respuesta del servidor:', responseText);
            mostrarCardEmergente(false, 'Error del servidor: La respuesta no es JSON válido. Verifica la consola para más detalles.');
            return;
        }
        
        if (result.success) {
            // Limpiar formulario
            document.getElementById('registerSpaceForm').reset();
            
            // Limpiar previews de imágenes
            for (let i = 1; i <= 5; i++) {
                document.getElementById(`preview${i}`).innerHTML = '';
            }
            
            // Limpiar equipamiento
            document.getElementById('equipmentList').innerHTML = '';
            equipmentCounter = 0;
            
            // Limpiar horarios
            document.getElementById('scheduleList').innerHTML = '';
            scheduleCounter = 0;
            
            mostrarCardEmergente(true, result.message);
        } else {
            mostrarCardEmergente(false, result.message);
        }
        
    } catch (error) {
        console.error('Error al registrar espacio:', error);
        mostrarCardEmergente(false, 'Error al registrar espacio');
    }
}

// Variables globales para espacios
let espaciosData = [];

// Función para cargar espacios desde el backend
async function cargarEspacios() {
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    
    if (!usuarioLogueado) {
        mostrarCardEmergente(false, 'No hay sesión activa');
        return;
    }
    
    try {
        const usuario = JSON.parse(usuarioLogueado);
        
        const response = await fetch('../backend/public/asignarespacio.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=obtener_espacios_completos&id_administrador=${usuario.id_usuario}`
        });
        
        const result = await response.json();
        
        if (result.success) {
            espaciosData = result.espacios;
            mostrarEspacios(espaciosData);
        } else {
            mostrarCardEmergente(false, result.message);
            mostrarEspaciosVacios();
        }
        
    } catch (error) {
        console.error('Error al cargar espacios:', error);
        mostrarCardEmergente(false, 'Error al cargar espacios');
        mostrarEspaciosVacios();
    }
}

// Función para mostrar espacios en cards
function mostrarEspacios(espacios) {
    const spacesGrid = document.getElementById('spacesGrid');
    
    if (!espacios || espacios.length === 0) {
        mostrarEspaciosVacios();
        return;
    }
    
    spacesGrid.innerHTML = espacios.map(espacio => crearCardEspacio(espacio)).join('');
}

// Función para crear una card de espacio
function crearCardEspacio(espacio) {
    // Debug: mostrar datos del espacio en consola
    console.log('Datos del espacio:', espacio);
    
    const iconoEspacio = obtenerIconoEspacio(espacio.tipo_espacio);
    const estadoClase = espacio.disponible === 1 ? 'available' : (espacio.disponible === 2 ? 'no-schedule' : 'unavailable');
    const estadoTexto = espacio.estado_disponibilidad || (espacio.disponible === 1 ? 'Disponible' : espacio.disponible === 2 ? 'Sin Horarios Disponibles' : 'No Disponible');
    
    // Estado de asignación
    const asignacionClase = espacio.esta_asignado ? 'assigned' : 'not-assigned';
    const asignacionTexto = espacio.esta_asignado ? 'Asignado' : 'No Asignado';
    
    // Obtener la primera foto si existe
    const fotoPrincipal = espacio.foto1 ? `<img src="../${espacio.foto1}" alt="${espacio.nombre_espacio}" class="space-image">` : '';
    
    // Contar imágenes disponibles
    const imagenesDisponibles = [espacio.foto1, espacio.foto2, espacio.foto3, espacio.foto4, espacio.foto5].filter(foto => foto).length;
    const indicadorImagenes = imagenesDisponibles > 1 ? `
        <div class="image-gallery-indicator">
            <i class="fas fa-images"></i>
            <span>Ver más imágenes</span>
        </div>
    ` : '';
    
    return `
        <div class="space-card" data-espacio-id="${espacio.id_espacio}">
            <div class="space-image-container" onclick="mostrarModalImagenes(${espacio.id_espacio})" style="cursor: pointer;">
                ${fotoPrincipal ? fotoPrincipal : `<div class="space-icon-large"><i class="${iconoEspacio}"></i></div>`}
                ${indicadorImagenes}
            </div>
            
            <div class="space-card-main">
                <div class="space-card-header">
                    <div class="space-title-section">
                        <h3 class="space-title">${espacio.nombre_espacio}</h3>
                        <p class="space-type">${espacio.tipo_espacio}</p>
                    </div>
                    <div class="space-status-container">
                        <div class="space-status ${estadoClase}">
                            ${estadoTexto}
                        </div>
                    </div>
                </div>
                
                <div class="space-card-content">
                    <div class="space-info-grid">
                        <div class="space-info-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${espacio.direccion}, ${espacio.nombre_ciudad || 'Sin ciudad'}, ${espacio.nombre_region || 'Sin región'}</span>
                        </div>
                        <div class="space-info-item">
                            <i class="fas fa-ruler"></i>
                            <span>${espacio.metros_cuadrados} m²</span>
                        </div>
                        ${espacio.ubicacion_interna ? `
                            <div class="space-info-item">
                                <i class="fas fa-door-open"></i>
                                <span>${espacio.ubicacion_interna}</span>
                            </div>
                        ` : ''}
                        <div class="space-info-item">
                            <i class="fas fa-tools"></i>
                            <span>${espacio.equipamiento.length} equipos</span>
                        </div>
                        <div class="space-info-item">
                            <i class="fas fa-clock"></i>
                            <span>${espacio.horarios.length} horarios</span>
                        </div>
                        ${espacio.esta_asignado ? `
                            <div class="space-info-item assigned-client">
                                <i class="fas fa-user"></i>
                                <span>${obtenerNombreClienteAsignado(espacio)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <div class="space-card-actions">
                <button class="view-btn" onclick="verDetallesEspacio(${espacio.id_espacio})" title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="edit-btn" onclick="editarEspacio(${espacio.id_espacio})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                ${espacio.disponible === 1 ? `
                    <button class="assign-btn" onclick="mostrarModalAsignar(${espacio.id_espacio})" title="Asignar Espacio">
                        <i class="fas fa-user-plus"></i>
                    </button>
                ` : ''}
                <button class="delete-btn" onclick="eliminarEspacio(${espacio.id_espacio})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

// Función para obtener el icono según el tipo de espacio
function obtenerIconoEspacio(tipoEspacio) {
    const iconos = {
        'Consultorio': 'fas fa-user-md',
        'Sala de Procedimientos': 'fas fa-procedures',
        'Sala de Espera': 'fas fa-users',
        'Oficina': 'fas fa-briefcase',
        'Laboratorio': 'fas fa-flask',
        'Farmacia': 'fas fa-pills',
        'Recepción': 'fas fa-receipt',
        'Otro': 'fas fa-building'
    };
    return iconos[tipoEspacio] || 'fas fa-building';
}

// Función para obtener el nombre del cliente asignado
function obtenerNombreClienteAsignado(espacio) {
    // Verificar diferentes posibles estructuras de datos
    if (espacio.cliente_asignado) {
        if (espacio.cliente_asignado.nombre && espacio.cliente_asignado.apellido) {
            return `${espacio.cliente_asignado.nombre} ${espacio.cliente_asignado.apellido}`;
        }
        if (espacio.cliente_asignado.nombre_completo) {
            return espacio.cliente_asignado.nombre_completo;
        }
    }
    
    // Verificar si hay datos del cliente en otras propiedades
    if (espacio.cliente_nombre && espacio.cliente_apellido) {
        return `${espacio.cliente_nombre} ${espacio.cliente_apellido}`;
    }
    
    if (espacio.nombre_cliente) {
        return espacio.nombre_cliente;
    }
    
    // Si hay ID de usuario pero no nombre, mostrar el ID
    if (espacio.id_usuario_asignado) {
        return `Usuario ID: ${espacio.id_usuario_asignado}`;
    }
    
    // Si no hay información del cliente, mostrar mensaje genérico
    return 'Cliente no identificado';
}
// Función para mostrar cuando no hay espacios
function mostrarEspaciosVacios() {
    const spacesGrid = document.getElementById('spacesGrid');
    spacesGrid.innerHTML = `
        <div class="empty-spaces">
            <i class="fas fa-building"></i>
            <h3>No hay espacios registrados</h3>
            <p>Comienza agregando tu primer espacio</p>
            <button class="add-first-btn" onclick="irARegistrarEspacios()">
                <i class="fas fa-plus"></i> Agregar Primer Espacio
            </button>
        </div>
    `;
}


// Función para ver detalles del espacio
function verDetallesEspacio(idEspacio) {
    const espacio = espaciosData.find(e => e.id_espacio == idEspacio);
    if (espacio) {
        mostrarModalDetalles(espacio);
    }
}
// Función para mostrar modal de detalles
function mostrarModalDetalles(espacio) {
    const modal = `
        <div class="modal-overlay modal-detalles-espacio" onclick="cerrarModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>${espacio.nombre_espacio}</h2>
                    <button class="close-modal" onclick="cerrarModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="space-details-grid">
                        <div class="detail-section">
                            <h3>Información General</h3>
                            <p><strong>Tipo:</strong> ${espacio.tipo_espacio}</p>
                            <p><strong>Metros Cuadrados:</strong> ${espacio.metros_cuadrados} m²</p>
                            <p><strong>Ubicación:</strong> ${espacio.direccion}</p>
                            <p><strong>Ciudad:</strong> ${espacio.nombre_ciudad || 'Sin ciudad'}, ${espacio.nombre_region || 'Sin región'}</p>
                            ${espacio.ubicacion_interna ? `<p><strong>Ubicación Interna:</strong> ${espacio.ubicacion_interna}</p>` : ''}
                            <p><strong>Estado:</strong> ${espacio.disponible ? 'Disponible' : 'No Disponible'}</p>
                        </div>
                        
        ${espacio.esta_asignado && espacio.clientes_asignados && espacio.clientes_asignados.length > 0 ? `
                        <div class="detail-section">
            <h3><i class="fas fa-users"></i> Clientes Asignados</h3>
            <div class="assigned-clients-info">
                ${espacio.clientes_asignados.map((cliente, index) => `
                    <div class="client-assignment-item">
                        <div class="client-card-assigned">
                            <div class="client-avatar-assigned">
                                ${cliente.nombre.charAt(0)}${cliente.apellido.charAt(0)}
                            </div>
                            <div class="client-details-assigned">
                                <h4>${cliente.nombre} ${cliente.apellido}</h4>
                                <p><strong>RUT:</strong> ${cliente.rut}</p>
                                <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
                                ${cliente.email ? `<p><strong>Email:</strong> ${cliente.email}</p>` : ''}
                            </div>
                        </div>
                        
                        ${cliente.horario_asignado ? `
                        <div class="assigned-client-schedule">
                            <h5><i class="fas fa-clock"></i> Horario Asignado</h5>
                            <div class="schedule-list-assigned">
                                <div class="schedule-item-assigned">
                                    <div class="schedule-time">
                                        <i class="fas fa-clock"></i>
                                        <span>${cliente.horario_asignado.hora_inicio} - ${cliente.horario_asignado.hora_fin}</span>
                                    </div>
                                    <div class="schedule-details">
                                        <strong>${cliente.horario_asignado.nombre_dia}</strong>
                                        <div class="schedule-dates">
                                            <i class="fas fa-calendar"></i>
                                            <span>${cliente.horario_asignado.fecha_inicio} - ${cliente.horario_asignado.fecha_termino}</span>
                                        </div>
                                        ${cliente.horario_asignado.descripcion ? `
                                            <div class="schedule-description">
                                                <i class="fas fa-info-circle"></i>
                                                <span>${cliente.horario_asignado.descripcion}</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                        ` : `
                        <div class="no-schedule-info">
                            <p><i class="fas fa-exclamation-triangle"></i> Este cliente no tiene un horario específico asignado</p>
                        </div>
                        `}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : `
        <div class="detail-section">
            <h3><i class="fas fa-user"></i> Cliente Asignado</h3>
            <div class="no-assignment-info">
                <p><i class="fas fa-info-circle"></i> Este espacio no tiene clientes asignados</p>
            </div>
        </div>
        `}
                        
                        <div class="detail-section">
                            <h3><i class="fas fa-tools"></i> Equipamiento (${espacio.equipamiento.length})</h3>
                            ${espacio.equipamiento.length > 0 ? 
                                espacio.equipamiento.map(equipo => `
                                    <div class="equipment-item-detail">
                                        <strong>${equipo.nombre_equipamiento}</strong> - Cantidad: ${equipo.cantidad}
                                        ${equipo.descripcion ? `<br><small>${equipo.descripcion}</small>` : ''}
                                        <span class="equipment-status ${equipo.estado.toLowerCase().replace(' ', '-')}">${equipo.estado}</span>
                                    </div>
                                `).join('') : 
                                '<p>No hay equipamiento registrado</p>'
                            }
                        </div>
                        
                        <div class="detail-section">
                            <h3><i class="fas fa-clock"></i> Horarios (${espacio.horarios.length})</h3>
                            ${espacio.horarios.length > 0 ? 
                                espacio.horarios.map(horario => `
                                    <div class="schedule-item-detail">
                                        <strong>${horario.nombre_dia}</strong><br>
                                        <i class="fas fa-clock"></i> ${horario.hora_inicio} - ${horario.hora_fin}<br>
                                        <i class="fas fa-calendar"></i> <small>Desde: ${horario.fecha_inicio} hasta: ${horario.fecha_termino}</small>
                                        ${horario.descripcion ? `<br><small><i class="fas fa-info"></i> ${horario.descripcion}</small>` : ''}
                                    </div>
                                `).join('') : 
                                '<p>No hay horarios registrados</p>'
                            }
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="cerrarModal()">Cerrar</button>
                    <button class="btn-primary" onclick="editarEspacio(${espacio.id_espacio})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

// Función para cerrar modal
function cerrarModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Función para editar espacio
async function editarEspacio(idEspacio) {
    cerrarModal();
    
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    
    if (!usuarioLogueado) {
        mostrarCardEmergente(false, 'No hay sesión activa');
        return;
    }
    
    try {
        const usuario = JSON.parse(usuarioLogueado);
        
        
        const response = await fetch('../backend/public/asignarespacio.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=obtener_espacio_por_id&id_espacio=${idEspacio}&id_administrador=${usuario.id_usuario}`
        });
        
        const result = await response.json();
        
        if (result.success) {
            await mostrarModalEdicion(result.espacio);
        } else {
            mostrarCardEmergente(false, result.message || 'Error al cargar los datos del espacio');
        }
    } catch (error) {
        console.error('Error al cargar espacio:', error);
        mostrarCardEmergente(false, 'Error al cargar los datos del espacio');
    }
}
// Función para mostrar modal de edición
async function mostrarModalEdicion(espacio) {
    const modal = `
        <div class="modal-overlay" onclick="cerrarModalEdicion()">
            <div class="modal-content edit-space-modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2><i class="fas fa-edit"></i> Editar Espacio: ${espacio.nombre_espacio}</h2>
                    <button class="close-modal" onclick="cerrarModalEdicion()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="editSpaceForm" enctype="multipart/form-data">
                        <input type="hidden" name="id_espacio" value="${espacio.id_espacio}">
                        <input type="hidden" name="action" value="actualizar_espacio">
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="edit_nombre_espacio">Nombre del Espacio *</label>
                                <input type="text" id="edit_nombre_espacio" name="nombre_espacio" value="${espacio.nombre_espacio}" required>
                            </div>
                            <div class="form-group">
                                <label for="edit_tipo_espacio">Tipo de Espacio *</label>
                                <select id="edit_tipo_espacio" name="tipo_espacio" required>
                                    <option value="Oficina" ${espacio.tipo_espacio === 'Oficina' ? 'selected' : ''}>Oficina</option>
                                    <option value="Sala de Reuniones" ${espacio.tipo_espacio === 'Sala de Reuniones' ? 'selected' : ''}>Sala de Reuniones</option>
                                    <option value="Auditorio" ${espacio.tipo_espacio === 'Auditorio' ? 'selected' : ''}>Auditorio</option>
                                    <option value="Sala de Conferencias" ${espacio.tipo_espacio === 'Sala de Conferencias' ? 'selected' : ''}>Sala de Conferencias</option>
                                    <option value="Espacio de Coworking" ${espacio.tipo_espacio === 'Espacio de Coworking' ? 'selected' : ''}>Espacio de Coworking</option>
                                    <option value="Sala de Capacitación" ${espacio.tipo_espacio === 'Sala de Capacitación' ? 'selected' : ''}>Sala de Capacitación</option>
                                    <option value="Otro" ${espacio.tipo_espacio === 'Otro' ? 'selected' : ''}>Otro</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="edit_metros_cuadrados">Metros Cuadrados *</label>
                                <input type="number" id="edit_metros_cuadrados" name="metros_cuadrados" value="${espacio.metros_cuadrados}" step="0.01" min="0" required>
                            </div>
                            <div class="form-group">
                                <label for="edit_disponible">Estado</label>
                                <select id="edit_disponible" name="disponible">
                                    <option value="1" ${espacio.disponible === 1 ? 'selected' : ''}>Disponible</option>
                                    <option value="2" ${espacio.disponible === 2 ? 'selected' : ''}>Sin Horarios Disponibles</option>
                                    <option value="0" ${espacio.disponible === 0 ? 'selected' : ''}>No Disponible</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="edit_region">Región *</label>
                                <select id="edit_region" name="region" required onchange="cargarCiudadesPorRegionEdicion(this.value)">
                                    <option value="">Seleccionar Región</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="edit_ciudad">Ciudad *</label>
                                <select id="edit_ciudad" name="ciudad" required>
                                    <option value="">Seleccionar Ciudad</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="edit_direccion">Dirección *</label>
                                <input type="text" id="edit_direccion" name="direccion" value="${espacio.direccion}" required>
                            </div>
                            <div class="form-group">
                                <label for="edit_ubicacion_interna">Ubicación Interna</label>
                                <input type="text" id="edit_ubicacion_interna" name="ubicacion_interna" value="${espacio.ubicacion_interna || ''}">
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h3><i class="fas fa-images"></i> Imágenes del Espacio</h3>
                            <div class="photo-upload-grid">
                                ${[1,2,3,4,5].map(num => `
                                    <div class="photo-upload-item">
                                        <label class="photo-upload-label" for="edit_foto${num}">
                                            <i class="fas fa-camera"></i>
                                            <span>IMG</span>
                                        </label>
                                        <input type="file" id="edit_foto${num}" name="foto${num}" accept="image/*" onchange="previewImage(this, 'edit_preview${num}')">
                                        <div id="edit_preview${num}" class="photo-preview">
                                            ${espacio[`foto${num}`] ? `<img src="../${espacio[`foto${num}`]}" alt="Foto ${num}">` : ''}
                                        </div>
                                        ${espacio[`foto${num}`] ? `
                                            <div class="photo-actions">
                                                <button type="button" onclick="eliminarFoto('foto${num}')" class="remove-image-btn">
                                                    <i class="fas fa-trash"></i> Eliminar
                                                </button>
                                                <input type="hidden" name="eliminar_foto${num}" value="0" id="eliminar_foto${num}" data-url="${espacio[`foto${num}`]}">
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h3><i class="fas fa-tools"></i> Equipamiento</h3>
                            <div id="edit_equipment_list" class="equipment-list">
                                ${espacio.equipamiento.map((equipo, index) => `
                                    <div class="equipment-item" data-index="${index}">
                                        <div class="equipment-header">
                                            <h4>Equipo ${index + 1}</h4>
                                            <button type="button" class="remove-equipment-btn" onclick="removerEquipamientoEdicion(${index})">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                        <div class="equipment-fields">
                                            <div class="form-row">
                                                <div class="form-group">
                                                    <label>Nombre del Equipo</label>
                                                    <input type="text" name="equipamiento[${index}][nombre]" value="${equipo.nombre_equipamiento}" required>
                                                </div>
                                                <div class="form-group">
                                                    <label>Cantidad</label>
                                                    <input type="number" name="equipamiento[${index}][cantidad]" value="${equipo.cantidad}" min="1" required>
                                                </div>
                                            </div>
                                            <div class="form-row">
                                                <div class="form-group">
                                                    <label>Descripción</label>
                                                    <textarea name="equipamiento[${index}][descripcion]" rows="2">${equipo.descripcion || ''}</textarea>
                                                </div>
                                                <div class="form-group">
                                                    <label>Estado</label>
                                                    <select name="equipamiento[${index}][estado]">
                                                        <option value="Disponible" ${equipo.estado === 'Disponible' ? 'selected' : ''}>Disponible</option>
                                                        <option value="En Mantenimiento" ${equipo.estado === 'En Mantenimiento' ? 'selected' : ''}>En Mantenimiento</option>
                                                        <option value="No Disponible" ${equipo.estado === 'No Disponible' ? 'selected' : ''}>No Disponible</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="form-row">
                                                <div class="form-group">
                                                    <label>Tipo de Equipamiento</label>
                                                    <input type="text" name="equipamiento[${index}][tipo]" value="${equipo.tipo || ''}" placeholder="Ej: Médico, Tecnológico, Mueble">
                                                </div>
                                                <div class="form-group">
                                                    <label>Descripción del Tipo</label>
                                                    <input type="text" name="equipamiento[${index}][descripcion_tipo]" value="${equipo.descripcion_tipo || ''}" placeholder="Descripción específica del tipo">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            <button type="button" class="add-equipment-btn" onclick="agregarEquipamientoEdicion()">
                                <i class="fas fa-plus"></i> Agregar Equipamiento
                            </button>
                        </div>
                        
                        <div class="form-section">
                            <h3><i class="fas fa-clock"></i> Horarios</h3>
                            <div id="edit_schedule_list" class="schedule-list">
                                ${espacio.horarios.map((horario, index) => `
                                    <div class="schedule-item" data-index="${index}">
                                        <div class="schedule-header">
                                            <h4>Horario ${index + 1}</h4>
                                            <button type="button" class="remove-schedule-btn" onclick="removerHorarioEdicion(${index})">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                        <div class="schedule-fields">
                                            <input type="hidden" name="horarios[${index}][id_horario]" value="${horario.id_horario || ''}">
                                            <div class="form-row">
                                                <div class="form-group">
                                                    <label>Tipo de Horario</label>
                                                    <select name="horarios[${index}][nombre_dia]" required>
                                                        <option value="">Selecciona un tipo</option>
                        <option value="Lunes a Viernes" ${horario.nombre_dia === 'Lunes a Viernes' ? 'selected' : ''}>Lunes a Viernes</option>
                        <option value="Lunes a Sábado" ${horario.nombre_dia === 'Lunes a Sábado' ? 'selected' : ''}>Lunes a Sábado</option>
                        <option value="Lunes a Domingo" ${horario.nombre_dia === 'Lunes a Domingo' ? 'selected' : ''}>Lunes a Domingo</option>
                        <option value="Martes a Viernes" ${horario.nombre_dia === 'Martes a Viernes' ? 'selected' : ''}>Martes a Viernes</option>
                        <option value="Martes a Sábado" ${horario.nombre_dia === 'Martes a Sábado' ? 'selected' : ''}>Martes a Sábado</option>
                        <option value="Martes a Domingo" ${horario.nombre_dia === 'Martes a Domingo' ? 'selected' : ''}>Martes a Domingo</option>
                        <option value="Miércoles a Viernes" ${horario.nombre_dia === 'Miércoles a Viernes' ? 'selected' : ''}>Miércoles a Viernes</option>
                        <option value="Miércoles a Sábado" ${horario.nombre_dia === 'Miércoles a Sábado' ? 'selected' : ''}>Miércoles a Sábado</option>
                        <option value="Miércoles a Domingo" ${horario.nombre_dia === 'Miércoles a Domingo' ? 'selected' : ''}>Miércoles a Domingo</option>
                        <option value="Jueves a Viernes" ${horario.nombre_dia === 'Jueves a Viernes' ? 'selected' : ''}>Jueves a Viernes</option>
                        <option value="Jueves a Sábado" ${horario.nombre_dia === 'Jueves a Sábado' ? 'selected' : ''}>Jueves a Sábado</option>
                        <option value="Jueves a Domingo" ${horario.nombre_dia === 'Jueves a Domingo' ? 'selected' : ''}>Jueves a Domingo</option>
                        <option value="Viernes a Sábado" ${horario.nombre_dia === 'Viernes a Sábado' ? 'selected' : ''}>Viernes a Sábado</option>
                        <option value="Viernes a Domingo" ${horario.nombre_dia === 'Viernes a Domingo' ? 'selected' : ''}>Viernes a Domingo</option>
                        <option value="Sábado a Domingo" ${horario.nombre_dia === 'Sábado a Domingo' ? 'selected' : ''}>Sábado a Domingo</option>
                        <option value="Solo Lunes" ${horario.nombre_dia === 'Solo Lunes' ? 'selected' : ''}>Solo Lunes</option>
                        <option value="Solo Martes" ${horario.nombre_dia === 'Solo Martes' ? 'selected' : ''}>Solo Martes</option>
                        <option value="Solo Miércoles" ${horario.nombre_dia === 'Solo Miércoles' ? 'selected' : ''}>Solo Miércoles</option>
                        <option value="Solo Jueves" ${horario.nombre_dia === 'Solo Jueves' ? 'selected' : ''}>Solo Jueves</option>
                        <option value="Solo Viernes" ${horario.nombre_dia === 'Solo Viernes' ? 'selected' : ''}>Solo Viernes</option>
                        <option value="Solo Sábado" ${horario.nombre_dia === 'Solo Sábado' ? 'selected' : ''}>Solo Sábado</option>
                        <option value="Solo Domingo" ${horario.nombre_dia === 'Solo Domingo' ? 'selected' : ''}>Solo Domingo</option>
                                                    </select>
                                                </div>
                                                <div class="form-group">
                                                    <label>Descripción</label>
                                                    <input type="text" name="horarios[${index}][descripcion]" value="${horario.descripcion || ''}">
                                                </div>
                                            </div>
                                            <div class="form-row">
                                                <div class="form-group">
                                                    <label>Hora de Inicio</label>
                                                    <input type="time" name="horarios[${index}][hora_inicio]" value="${horario.hora_inicio}" required>
                                                </div>
                                                <div class="form-group">
                                                    <label>Hora de Fin</label>
                                                    <input type="time" name="horarios[${index}][hora_fin]" value="${horario.hora_fin}" required>
                                                </div>
                                            </div>
                                            <div class="form-row">
                                                <div class="form-group">
                                                    <label>Fecha de Inicio</label>
                                                    <input type="date" name="horarios[${index}][fecha_inicio]" value="${horario.fecha_inicio}" required>
                                                </div>
                                                <div class="form-group">
                                                    <label>Fecha de Término</label>
                                                    <input type="date" name="horarios[${index}][fecha_termino]" value="${horario.fecha_termino}" required>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            <button type="button" class="add-schedule-btn" onclick="agregarHorarioEdicion()">
                                <i class="fas fa-plus"></i> Agregar Horario
                            </button>
                        </div>
                        
                        <div class="form-section">
                            <h3><i class="fas fa-users"></i> Gestión de Asignaciones</h3>
                            <div id="edit_assignments_list" class="assignments-list">
                                ${espacio.clientes_asignados && espacio.clientes_asignados.length > 0 ? `
                                    ${espacio.clientes_asignados.map((cliente, index) => `
                                        <div class="assignment-item" data-assignment-id="${cliente.id_asignacion}">
                                            <div class="assignment-header">
                                                <div class="client-info">
                                                    <div class="client-avatar-small">
                                                        ${cliente.nombre.charAt(0)}${cliente.apellido.charAt(0)}
                                                    </div>
                                                    <div class="client-details-small">
                                                        <h4>${cliente.nombre} ${cliente.apellido}</h4>
                                                        <p><strong>RUT:</strong> ${cliente.rut}</p>
                                                        <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
                                                    </div>
                                                </div>
                                                <div class="assignment-actions">
                                                    <button type="button" class="edit-assignment-btn" onclick="editarAsignacion(${cliente.id_asignacion}, ${cliente.id_usuario})" title="Editar Asignación">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button type="button" class="remove-assignment-btn" onclick="eliminarAsignacion(${cliente.id_asignacion}, '${cliente.nombre} ${cliente.apellido}')" title="Eliminar Asignación">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            ${cliente.horario_asignado ? `
                                                <div class="assignment-schedule">
                                                    <h5><i class="fas fa-clock"></i> Horario Asignado</h5>
                                                    <div class="schedule-info">
                                                        <span class="schedule-time">${cliente.horario_asignado.hora_inicio} - ${cliente.horario_asignado.hora_fin}</span>
                                                        <span class="schedule-type">${cliente.horario_asignado.nombre_dia}</span>
                                                        <span class="schedule-dates">${cliente.horario_asignado.fecha_inicio} - ${cliente.horario_asignado.fecha_termino}</span>
                                                    </div>
                                                </div>
                                            ` : `
                                                <div class="no-schedule-assignment">
                                                    <p><i class="fas fa-exclamation-triangle"></i> Sin horario específico asignado</p>
                                                </div>
                                            `}
                                        </div>
                                    `).join('')}
                                ` : `
                                    <div class="no-assignments-info">
                                        <p><i class="fas fa-info-circle"></i> Este espacio no tiene clientes asignados</p>
                                    </div>
                                `}
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="cerrarModalEdicion()">Cancelar</button>
                    <button class="btn-primary" onclick="guardarCambiosEspacio()">
                        <i class="fas fa-save"></i> Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modal);
    
    // Cargar regiones y ciudades para edición
    await cargarRegionesYCiudadesEdicion();
    
    // Esperar un poco para asegurar que las opciones se hayan renderizado
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Establecer valores de región y ciudad
    if (espacio.nombre_region) {
        document.getElementById('edit_region').value = espacio.nombre_region;
        await cargarCiudadesPorRegionEdicion(espacio.nombre_region);
        
        // Esperar un poco más para que se carguen las ciudades
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (espacio.nombre_ciudad) {
            document.getElementById('edit_ciudad').value = espacio.nombre_ciudad;
        }
    }

    // Guardar referencia del espacio en edición para otros modales
    window.espacioActualEdicion = espacio;
}

// Función para cargar regiones en modal de edición
async function cargarRegionesYCiudadesEdicion() {
    try {
        const response = await fetch('../backend/public/regiones_chile.php?action=regiones');
        const data = await response.json();
        
        if (data.success) {
            const regionSelect = document.getElementById('edit_region');
            if (regionSelect) {
                regionSelect.innerHTML = '<option value="">Seleccionar Región</option>';
                data.regiones.forEach(region => {
                    const option = document.createElement('option');
                    option.value = region.nombre_region;
                    option.textContent = region.nombre_region;
                    regionSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error al cargar regiones:', error);
    }
}

// Función para cargar ciudades por región en modal de edición
async function cargarCiudadesPorRegionEdicion(region) {
    try {
        // Primero obtener el ID de la región
        const regionesResponse = await fetch('../backend/public/regiones_chile.php?action=regiones');
        const regionesData = await regionesResponse.json();
        
        if (!regionesData.success) {
            throw new Error('Error al obtener regiones');
        }
        
        const regionObj = regionesData.regiones.find(r => r.nombre_region === region);
        if (!regionObj) {
            throw new Error('Región no encontrada');
        }
        
        // Ahora obtener las ciudades para esa región
        const response = await fetch(`../backend/public/regiones_chile.php?action=ciudades&id_region=${regionObj.id_region}`);
        const data = await response.json();
        
        if (data.success) {
            const ciudadSelect = document.getElementById('edit_ciudad');
            if (ciudadSelect) {
                ciudadSelect.innerHTML = '<option value="">Seleccionar Ciudad</option>';
                data.ciudades.forEach(ciudad => {
                    const option = document.createElement('option');
                    option.value = ciudad.nombre_ciudad;
                    option.textContent = ciudad.nombre_ciudad;
                    ciudadSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error al cargar ciudades:', error);
    }
}

// Función para agregar equipamiento en modal de edición
function agregarEquipamientoEdicion() {
    const equipmentList = document.getElementById('edit_equipment_list');
    const currentCount = equipmentList.children.length;
    const newIndex = currentCount;
    
    const equipmentItem = document.createElement('div');
    equipmentItem.className = 'equipment-item';
    equipmentItem.setAttribute('data-index', newIndex);
    
    equipmentItem.innerHTML = `
        <div class="equipment-header">
            <h4>Equipo ${newIndex + 1}</h4>
            <button type="button" class="remove-equipment-btn" onclick="removerEquipamientoEdicion(${newIndex})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="equipment-fields">
            <div class="form-row">
                <div class="form-group">
                    <label>Nombre del Equipo</label>
                    <input type="text" name="equipamiento[${newIndex}][nombre]" required>
                </div>
                <div class="form-group">
                    <label>Cantidad</label>
                    <input type="number" name="equipamiento[${newIndex}][cantidad]" min="1" required>
                </div>
            </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Descripción</label>
                        <textarea name="equipamiento[${newIndex}][descripcion]" rows="2"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Estado</label>
                        <select name="equipamiento[${newIndex}][estado]">
                            <option value="Disponible">Disponible</option>
                            <option value="En Mantenimiento">En Mantenimiento</option>
                            <option value="No Disponible">No Disponible</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Tipo de Equipamiento</label>
                        <input type="text" name="equipamiento[${newIndex}][tipo]" placeholder="Ej: Médico, Tecnológico, Mueble">
                    </div>
                    <div class="form-group">
                        <label>Descripción del Tipo</label>
                        <input type="text" name="equipamiento[${newIndex}][descripcion_tipo]" placeholder="Descripción específica del tipo">
                    </div>
                </div>
        </div>
    `;
    
    equipmentList.appendChild(equipmentItem);
}

// Función para remover equipamiento en modal de edición
function removerEquipamientoEdicion(index) {
    const equipmentList = document.getElementById('edit_equipment_list');
    const equipmentItem = equipmentList.querySelector(`[data-index="${index}"]`);
    if (equipmentItem) {
        equipmentItem.remove();
        
        // Renumerar los elementos restantes
        const remainingItems = equipmentList.querySelectorAll('.equipment-item');
        remainingItems.forEach((item, newIndex) => {
            item.setAttribute('data-index', newIndex);
            item.querySelector('h4').textContent = `Equipo ${newIndex + 1}`;
            
            // Actualizar los nombres de los inputs
            const inputs = item.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                const name = input.getAttribute('name');
                if (name) {
                    const newName = name.replace(/\[\d+\]/, `[${newIndex}]`);
                    input.setAttribute('name', newName);
                }
            });
            
            // Actualizar el onclick del botón de eliminar
            const removeBtn = item.querySelector('.remove-equipment-btn');
            if (removeBtn) {
                removeBtn.setAttribute('onclick', `removerEquipamientoEdicion(${newIndex})`);
            }
        });
    }
}
// Función para agregar horario en modal de edición
function agregarHorarioEdicion() {
    const scheduleList = document.getElementById('edit_schedule_list');
    const currentCount = scheduleList.children.length;
    const newIndex = currentCount;
    
    const scheduleItem = document.createElement('div');
    scheduleItem.className = 'schedule-item';
    scheduleItem.setAttribute('data-index', newIndex);
    
    scheduleItem.innerHTML = `
        <div class="schedule-header">
            <h4>Horario ${newIndex + 1}</h4>
            <button type="button" class="remove-schedule-btn" onclick="removerHorarioEdicion(${newIndex})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="schedule-fields">
            <div class="form-row">
                <div class="form-group">
                    <label>Tipo de Horario</label>
                        <select name="horarios[${newIndex}][nombre_dia]" required>
                        <option value="">Selecciona un tipo</option>
                        <option value="Lunes a Viernes">Lunes a Viernes</option>
                        <option value="Lunes a Sábado">Lunes a Sábado</option>
                        <option value="Lunes a Domingo">Lunes a Domingo</option>
                        <option value="Martes a Viernes">Martes a Viernes</option>
                        <option value="Martes a Sábado">Martes a Sábado</option>
                        <option value="Martes a Domingo">Martes a Domingo</option>
                        <option value="Miércoles a Viernes">Miércoles a Viernes</option>
                        <option value="Miércoles a Sábado">Miércoles a Sábado</option>
                        <option value="Miércoles a Domingo">Miércoles a Domingo</option>
                        <option value="Jueves a Viernes">Jueves a Viernes</option>
                        <option value="Jueves a Sábado">Jueves a Sábado</option>
                        <option value="Jueves a Domingo">Jueves a Domingo</option>
                        <option value="Viernes a Sábado">Viernes a Sábado</option>
                        <option value="Viernes a Domingo">Viernes a Domingo</option>
                        <option value="Sábado a Domingo">Sábado a Domingo</option>
                        <option value="Solo Lunes">Solo Lunes</option>
                        <option value="Solo Martes">Solo Martes</option>
                        <option value="Solo Miércoles">Solo Miércoles</option>
                        <option value="Solo Jueves">Solo Jueves</option>
                        <option value="Solo Viernes">Solo Viernes</option>
                        <option value="Solo Sábado">Solo Sábado</option>
                        <option value="Solo Domingo">Solo Domingo</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Descripción</label>
                    <input type="text" name="horarios[${newIndex}][descripcion]">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Hora de Inicio</label>
                    <input type="time" name="horarios[${newIndex}][hora_inicio]" required>
                </div>
                <div class="form-group">
                    <label>Hora de Fin</label>
                    <input type="time" name="horarios[${newIndex}][hora_fin]" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Fecha de Inicio</label>
                    <input type="date" name="horarios[${newIndex}][fecha_inicio]" required>
                </div>
                <div class="form-group">
                    <label>Fecha de Término</label>
                    <input type="date" name="horarios[${newIndex}][fecha_termino]" required>
                </div>
            </div>
        </div>
    `;
    
    scheduleList.appendChild(scheduleItem);
}

// Función para remover horario en modal de edición
function removerHorarioEdicion(index) {
    const scheduleList = document.getElementById('edit_schedule_list');
    const scheduleItem = scheduleList.querySelector(`[data-index="${index}"]`);
    if (scheduleItem) {
        scheduleItem.remove();
        
        // Renumerar los elementos restantes
        const remainingItems = scheduleList.querySelectorAll('.schedule-item');
        remainingItems.forEach((item, newIndex) => {
            item.setAttribute('data-index', newIndex);
            item.querySelector('h4').textContent = `Horario ${newIndex + 1}`;
            
            // Actualizar los nombres de los inputs
            const inputs = item.querySelectorAll('input, select');
            inputs.forEach(input => {
                const name = input.getAttribute('name');
                if (name) {
                    const newName = name.replace(/\[\d+\]/, `[${newIndex}]`);
                    input.setAttribute('name', newName);
                }
            });
            
            // Actualizar el onclick del botón de eliminar
            const removeBtn = item.querySelector('.remove-schedule-btn');
            if (removeBtn) {
                removeBtn.setAttribute('onclick', `removerHorarioEdicion(${newIndex})`);
            }
        });
    }
}

// Función para eliminar foto en modal de edición
function eliminarFoto(fotoCampo) {
    const indexStr = fotoCampo.replace('foto', '');
    const previewId = `edit_preview${indexStr}`;
    const eliminarInput = document.getElementById(`eliminar_foto${indexStr}`);
    const fileInput = document.getElementById(`edit_foto${indexStr}`);
    
    // Marcar para eliminar en el backend usando URL exacta si está disponible
    if (eliminarInput) {
        const url = eliminarInput.getAttribute('data-url');
        eliminarInput.value = url && url.trim().length ? url : '1';
    }
    
    // Limpiar preview
    const preview = document.getElementById(previewId);
    if (preview) {
        preview.innerHTML = '';
    }
    
    // Limpiar file input
    if (fileInput) {
        fileInput.value = '';
    }
    
    // Ocultar botones de acción
    const photoItem = document.querySelector(`#edit_foto${fotoCampo.replace('foto', '')}`).closest('.photo-upload-item');
    const photoActions = photoItem.querySelector('.photo-actions');
    if (photoActions) {
        photoActions.style.display = 'none';
    }
}

// Función para editar asignación
function editarAsignacion(idAsignacion, idCliente) {
    // Por ahora, mostrar mensaje de funcionalidad en desarrollo
    mostrarCardEmergente(false, 'Función de editar asignación en desarrollo');
}

// Función para eliminar asignación
async function eliminarAsignacion(idAsignacion, nombreCliente) {
    mostrarConfirmacionEliminacion(idAsignacion, nombreCliente);
}

// Función para mostrar confirmación de eliminación
function mostrarConfirmacionEliminacion(idAsignacion, nombreCliente) {
    const modal = `
        <div class="modal-overlay" style="z-index: 10000;">
            <div class="confirmation-modal">
                <div class="confirmation-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Confirmar Eliminación</h3>
                </div>
                <div class="confirmation-body">
                    <p>¿Estás seguro de que deseas eliminar la asignación de <strong>${nombreCliente}</strong>?</p>
                    <p class="confirmation-warning">Esta acción no se puede deshacer.</p>
                </div>
                <div class="confirmation-actions">
                    <button class="btn-cancel" onclick="cerrarConfirmacionEliminacion()">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button class="btn-confirm-delete" onclick="confirmarEliminacionAsignacion(${idAsignacion})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

// Función para cerrar confirmación
function cerrarConfirmacionEliminacion() {
    const modal = document.querySelector('.confirmation-modal');
    if (modal) {
        modal.closest('.modal-overlay').remove();
    }
}

// Función para confirmar eliminación
async function confirmarEliminacionAsignacion(idAsignacion) {
    cerrarConfirmacionEliminacion();
    
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    
    if (!usuarioLogueado) {
        mostrarCardEmergente(false, 'No hay sesión activa');
        return;
    }
    
    try {
        const usuario = JSON.parse(usuarioLogueado);
        
        const response = await fetch('../backend/public/asignarespacio.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=eliminar_asignacion&id_asignacion=${idAsignacion}&id_administrador=${usuario.id_usuario}`
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarCardEmergente(true, result.message);
            cerrarModalEdicion();
            // Recargar la lista de espacios
            await cargarEspacios();
        } else {
            mostrarCardEmergente(false, result.message || 'Error al eliminar la asignación');
        }
    } catch (error) {
        console.error('Error al eliminar asignación:', error);
        mostrarCardEmergente(false, 'Error al eliminar la asignación');
    }
}

// Función para cerrar modal de edición
function cerrarModalEdicion() {
    const modal = document.querySelector('.edit-space-modal');
    if (modal) {
        modal.closest('.modal-overlay').remove();
    }
}

// Modal para editar una asignación (cambiar horario o intercambiar)
function editarAsignacion(idAsignacion, idCliente) {
    const espacio = window.espacioActualEdicion;
    if (!espacio) return;

    const asignacionActual = (espacio.clientes_asignados || []).find(c => c.id_asignacion === idAsignacion);
    
    // Obtener horarios asignados (excluyendo el actual)
    const horariosAsignados = (espacio.clientes_asignados || [])
        .filter(c => c.id_asignacion !== idAsignacion)
        .map(c => c.id_horario)
        .filter(id => id !== null && id !== undefined);
    
    // Obtener el horario actual de la asignación que se está editando
    const horarioActual = asignacionActual?.id_horario;
    
    // Filtrar horarios disponibles (no asignados y no el actual)
    const horariosDisponibles = (espacio.horarios || []).filter(h => 
        !horariosAsignados.includes(h.id_horario) && h.id_horario !== horarioActual
    );

    const modal = `
        <div class="modal-overlay modal-editar-asignacion" onclick="cerrarModalEditarAsignacion()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2><i class="fas fa-exchange-alt"></i> Editar Asignación</h2>
                    <button class="close-modal" onclick="cerrarModalEditarAsignacion()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-section">
                        <h3>Cambiar a otro horario disponible</h3>
                        <div class="form-group">
                            <label>Horario actual</label>
                            <div class="readonly-field">${asignacionActual?.horario_asignado ? `${asignacionActual.horario_asignado.hora_inicio} - ${asignacionActual.horario_asignado.hora_fin} (${asignacionActual.horario_asignado.nombre_dia})` : 'Sin horario'}</div>
                        </div>
                        <div class="form-group">
                            <label>Nuevo horario</label>
                            <select id="nuevoHorarioSelect">
                                <option value="">Seleccionar horario</option>
                                ${horariosDisponibles.map(h => `
                                    <option value="${h.id_horario}">${h.hora_inicio} - ${h.hora_fin} (${h.nombre_dia})</option>
                                `).join('')}
                            </select>
                        </div>
                        ${horariosDisponibles.length === 0 ? '<p class="no-options-message"><i class="fas fa-info-circle"></i> No hay horarios disponibles para cambiar</p>' : ''}
                        <button class="btn-primary" onclick="confirmarActualizarAsignacion(${idAsignacion})" ${horariosDisponibles.length === 0 ? 'disabled' : ''}><i class="fas fa-check"></i> Guardar cambio</button>
                    </div>
                    <hr>
                    <div class="form-section">
                        <h3>Intercambiar horario con otro cliente</h3>
                        <div class="form-group">
                            <label>Seleccionar otra asignación</label>
                            <select id="asignacionSwapSelect">
                                <option value="">Seleccionar cliente</option>
                                ${(espacio.clientes_asignados || []).filter(c => c.id_asignacion !== idAsignacion).map(c => `
                                    <option value="${c.id_asignacion}">${c.nombre} ${c.apellido} ${c.horario_asignado ? `- ${c.horario_asignado.hora_inicio} - ${c.horario_asignado.hora_fin}` : ''}</option>
                                `).join('')}
                            </select>
                        </div>
                        <button class="btn-secondary" onclick="confirmarIntercambiarHorarios(${idAsignacion})"><i class="fas fa-exchange-alt"></i> Intercambiar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);
}

function cerrarModalEditarAsignacion() {
    const modals = document.querySelectorAll('.modal-overlay');
    if (modals.length > 0) {
        const top = modals[modals.length - 1];
        top.remove();
    }
}
async function confirmarActualizarAsignacion(idAsignacion) {
    const espacio = window.espacioActualEdicion;
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    if (!usuarioLogueado || !espacio) return;
    const usuario = JSON.parse(usuarioLogueado);
    const nuevoHorario = document.getElementById('nuevoHorarioSelect').value;
    if (!nuevoHorario) {
        mostrarCardEmergente(false, 'Selecciona un horario');
        return;
    }
    try {
        const resp = await fetch('../backend/public/asignarespacio.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=actualizar_asignacion&id_asignacion=${idAsignacion}&id_horario=${nuevoHorario}&id_administrador=${usuario.id_usuario}`
        });
        const result = await resp.json();
        if (result.success) {
            mostrarCardEmergente(true, result.message);
            cerrarModalEditarAsignacion();
            cerrarModalEdicion();
            cargarEspacios();
        } else {
            mostrarCardEmergente(false, result.message);
        }
    } catch (e) {
        console.error(e);
        mostrarCardEmergente(false, 'Error al actualizar asignación');
    }
}

async function confirmarIntercambiarHorarios(idAsignacion) {
    const espacio = window.espacioActualEdicion;
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    if (!usuarioLogueado || !espacio) return;
    const usuario = JSON.parse(usuarioLogueado);
    const otraAsignacion = document.getElementById('asignacionSwapSelect').value;
    if (!otraAsignacion) {
        mostrarCardEmergente(false, 'Selecciona otra asignación');
        return;
    }
    try {
        const resp = await fetch('../backend/public/asignarespacio.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=intercambiar_horarios&id_asignacion_1=${idAsignacion}&id_asignacion_2=${otraAsignacion}&id_administrador=${usuario.id_usuario}`
        });
        const result = await resp.json();
        if (result.success) {
            mostrarCardEmergente(true, result.message);
            cerrarModalEditarAsignacion();
            cerrarModalEdicion();
            cargarEspacios();
        } else {
            mostrarCardEmergente(false, result.message);
        }
    } catch (e) {
        console.error(e);
        mostrarCardEmergente(false, 'Error al intercambiar horarios');
    }
}

// Función para guardar cambios del espacio
async function guardarCambiosEspacio() {
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    
    if (!usuarioLogueado) {
        mostrarCardEmergente(false, 'No hay sesión activa');
        return;
    }
    
    try {
        const usuario = JSON.parse(usuarioLogueado);
        const form = document.getElementById('editSpaceForm');
        const formData = new FormData(form);
        
        // Agregar ID del administrador
        formData.append('id_administrador', usuario.id_usuario);
        
        // Recopilar equipamiento
        const equipamiento = [];
        const equipmentItems = document.querySelectorAll('#edit_equipment_list .equipment-item');
        equipmentItems.forEach((item, index) => {
            const nombre = item.querySelector(`input[name="equipamiento[${index}][nombre]"]`)?.value;
            const cantidad = item.querySelector(`input[name="equipamiento[${index}][cantidad]"]`)?.value;
            const descripcion = item.querySelector(`textarea[name="equipamiento[${index}][descripcion]"]`)?.value;
            const estado = item.querySelector(`select[name="equipamiento[${index}][estado]"]`)?.value;
            const tipo = item.querySelector(`input[name="equipamiento[${index}][tipo]"]`)?.value;
            const descripcion_tipo = item.querySelector(`input[name="equipamiento[${index}][descripcion_tipo]"]`)?.value;
            
            if (nombre && cantidad) {
                equipamiento.push({
                    nombre: nombre,
                    cantidad: cantidad,
                    descripcion: descripcion || '',
                    estado: estado || 'Disponible',
                    tipo: (tipo || '').trim(),
                    descripcion_tipo: (descripcion_tipo || '').trim()
                });
            }
        });
        formData.append('equipamiento', JSON.stringify(equipamiento));
        
        // Recopilar horarios
        const horarios = [];
        const scheduleItems = document.querySelectorAll('#edit_schedule_list .schedule-item');
        scheduleItems.forEach((item, index) => {
            const id_horario = item.querySelector(`input[name="horarios[${index}][id_horario]"]`)?.value;
            const nombre_dia = item.querySelector(`select[name="horarios[${index}][nombre_dia]"]`)?.value;
            const hora_inicio = item.querySelector(`input[name="horarios[${index}][hora_inicio]"]`)?.value;
            const hora_fin = item.querySelector(`input[name="horarios[${index}][hora_fin]"]`)?.value;
            const fecha_inicio = item.querySelector(`input[name="horarios[${index}][fecha_inicio]"]`)?.value;
            const fecha_termino = item.querySelector(`input[name="horarios[${index}][fecha_termino]"]`)?.value;
            const descripcion = item.querySelector(`input[name="horarios[${index}][descripcion]"]`)?.value;
            
            if (nombre_dia && hora_inicio && hora_fin && fecha_inicio && fecha_termino) {
                const horario = {
                    nombre_dia: nombre_dia,
                    hora_inicio: hora_inicio,
                    hora_fin: hora_fin,
                    fecha_inicio: fecha_inicio,
                    fecha_termino: fecha_termino,
                    descripcion: descripcion || ''
                };
                
                // Incluir id_horario si existe (para horarios existentes)
                if (id_horario && id_horario.trim() !== '') {
                    horario.id_horario = parseInt(id_horario);
                }
                
                horarios.push(horario);
            }
        });
        formData.append('horarios', JSON.stringify(horarios));
        
        // Mostrar loading
        mostrarCardEmergente(true, 'Guardando cambios...');
        
        const response = await fetch('../backend/public/asignarespacio.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarCardEmergente(true, result.message);
            cerrarModalEdicion();
            // Recargar la lista de espacios
            await cargarEspacios();
        } else {
            mostrarCardEmergente(false, result.message || 'Error al actualizar el espacio');
        }
    } catch (error) {
        console.error('Error al guardar cambios:', error);
        mostrarCardEmergente(false, 'Error al guardar los cambios');
    }
}

// Función para eliminar espacio
async function eliminarEspacio(idEspacio) {
    const espacio = espaciosData.find(e => e.id_espacio == idEspacio);
    if (!espacio) return;
    
    mostrarConfirmacionEliminacionEspacio(idEspacio, espacio.nombre_espacio);
}

// Función para mostrar confirmación de eliminación de espacio
function mostrarConfirmacionEliminacionEspacio(idEspacio, nombreEspacio) {
    const modal = `
        <div class="modal-overlay" style="z-index: 10000;">
            <div class="confirmation-modal">
                <div class="confirmation-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Confirmar Eliminación</h3>
                </div>
                <div class="confirmation-body">
                    <p>¿Estás seguro de que deseas eliminar el espacio <strong>"${nombreEspacio}"</strong>?</p>
                    <p class="confirmation-warning">Esta acción no se puede deshacer.</p>
                </div>
                <div class="confirmation-actions">
                    <button class="btn-cancel" onclick="cerrarConfirmacionEliminacionEspacio()">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button class="btn-confirm-delete" onclick="confirmarEliminacionEspacio(${idEspacio})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

// Función para cerrar confirmación de eliminación de espacio
function cerrarConfirmacionEliminacionEspacio() {
    const modal = document.querySelector('.confirmation-modal');
    if (modal) {
        modal.closest('.modal-overlay').remove();
    }
}

// Función para confirmar eliminación de espacio
async function confirmarEliminacionEspacio(idEspacio) {
    cerrarConfirmacionEliminacionEspacio();
    
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    
    if (!usuarioLogueado) {
        mostrarCardEmergente(false, 'No hay sesión activa');
        return;
    }
    
    try {
        const usuario = JSON.parse(usuarioLogueado);
        
        const response = await fetch('../backend/public/asignarespacio.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=eliminar_espacio_completo&id_espacio=${idEspacio}&id_administrador=${usuario.id_usuario}`
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarCardEmergente(true, result.message);
            cargarEspacios(); // Recargar la lista
        } else {
            mostrarCardEmergente(false, result.message);
        }
        
    } catch (error) {
        console.error('Error al eliminar espacio:', error);
        mostrarCardEmergente(false, 'Error al eliminar espacio');
    }
}

// Función para mostrar modal de asignación
function mostrarModalAsignar(idEspacio) {
    const espacio = espaciosData.find(e => e.id_espacio == idEspacio);
    if (!espacio) return;
    
    const modal = `
        <div class="modal-overlay modal-asignar-espacio" onclick="cerrarModalAsignacion()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>Asignar Espacio</h2>
                    <button class="close-modal" onclick="cerrarModalAsignacion()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="assign-space-info">
                        <h3>${espacio.nombre_espacio}</h3>
                        <p><strong>Tipo:</strong> ${espacio.tipo_espacio}</p>
                        <p><strong>Ubicación:</strong> ${espacio.nombre_ciudad || 'Sin ciudad'}, ${espacio.nombre_region || 'Sin región'}</p>
                    </div>
                    
                    <div class="form-group">
                        <label for="clienteSearch">Buscar Cliente por RUT:</label>
                        <div class="client-search-container">
                            <input type="text" id="clienteSearch" class="form-control" placeholder="Ingresa el RUT del cliente (ej: 12345678-9)" autocomplete="off">
                            <div class="search-results" id="searchResults" style="display: none;"></div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Cliente Seleccionado:</label>
                        <div id="selectedClient" class="selected-client-info" style="display: none;">
                            <div class="client-card">
                                <div class="client-avatar" id="selectedClientAvatar">-</div>
                                <div class="client-details">
                                    <h4 id="selectedClientName">-</h4>
                                    <p id="selectedClientRut">-</p>
                                    <p id="selectedClientPhone">-</p>
                                </div>
                                <button type="button" class="clear-selection-btn" onclick="limpiarSeleccionCliente()">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="horarioSelect">Seleccionar Horario:</label>
                        <select id="horarioSelect" class="form-control" required>
                            <option value="">Selecciona un horario</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Confirmación:</label>
                        <p class="confirmation-text">¿Estás seguro de que deseas asignar este espacio al cliente seleccionado?</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="cerrarModalAsignacion()">Cancelar</button>
                    <button class="btn-primary" onclick="asignarEspacio(${idEspacio})" id="confirmAssignBtn" disabled>
                        <i class="fas fa-user-plus"></i> Asignar Espacio
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
    espacioActual = espacio;
    configurarBuscadorClientes();
    cargarHorariosEspacio(espacio);
}
// Variables globales para el buscador de clientes
let clientesData = [];
let clienteSeleccionado = null;
let espacioActual = null;
// Función para configurar el buscador de clientes
function configurarBuscadorClientes() {
    const searchInput = document.getElementById('clienteSearch');
    const searchResults = document.getElementById('searchResults');
    
    // Cargar todos los clientes al inicializar
    cargarTodosLosClientes();
    
    // Configurar evento de búsqueda
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        if (query.length < 3) {
            searchResults.style.display = 'none';
            return;
        }
        
        buscarClientes(query);
    });
    
    // Ocultar resultados al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.client-search-container')) {
            searchResults.style.display = 'none';
        }
    });
}

// Función para cargar todos los clientes
async function cargarTodosLosClientes() {
    try {
        const response = await fetch('../backend/public/asignarespacio.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'action=obtener_clientes'
        });
        
        const result = await response.json();
        
        if (result.success) {
            clientesData = result.clientes;
        } else {
            console.error('Error al cargar clientes:', result.message);
        }
            
    } catch (error) {
        console.error('Error al cargar clientes:', error);
    }
}

// Función para buscar clientes por RUT
function buscarClientes(query) {
    console.log('=== BUSCAR CLIENTES ===');
    console.log('Query de búsqueda:', query);
    console.log('Clientes disponibles:', clientesData);
    
    const searchResults = document.getElementById('searchResults');
    
    // Filtrar clientes por RUT
    const clientesFiltrados = clientesData.filter(cliente => 
        cliente.rut.toLowerCase().includes(query.toLowerCase())
    );
    
    console.log('Clientes filtrados:', clientesFiltrados);
    
    if (clientesFiltrados.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No se encontraron clientes con ese RUT</div>';
        console.log('No se encontraron resultados');
    } else {
        const htmlResultados = clientesFiltrados.map(cliente => `
            <div class="client-result-item" onclick="seleccionarCliente(${cliente.id_usuario})">
                <div class="client-avatar-small">${cliente.nombre.charAt(0)}${cliente.apellido.charAt(0)}</div>
                <div class="client-info">
                    <div class="client-name">${cliente.nombre} ${cliente.apellido}</div>
                    <div class="client-rut">RUT: ${cliente.rut}</div>
                    <div class="client-phone">Tel: ${cliente.telefono}</div>
                </div>
            </div>
        `).join('');
        
        console.log('HTML generado:', htmlResultados);
        searchResults.innerHTML = htmlResultados;
    }
    
    searchResults.style.display = 'block';
    console.log('=== FIN BUSCAR CLIENTES ===');
}

// Función para seleccionar un cliente
function seleccionarCliente(idCliente) {
    console.log('=== SELECCIONAR CLIENTE ===');
    console.log('ID Cliente recibido:', idCliente);
    console.log('Clientes disponibles:', clientesData);
    
    const cliente = clientesData.find(c => c.id_usuario == idCliente);
    console.log('Cliente encontrado:', cliente);
    
    if (!cliente) {
        console.error('Cliente no encontrado con ID:', idCliente);
        return;
    }
    
    clienteSeleccionado = cliente;
    console.log('Cliente seleccionado:', clienteSeleccionado);
    
    // Ocultar resultados de búsqueda
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
        searchResults.style.display = 'none';
        console.log('Resultados de búsqueda ocultados');
    } else {
        console.error('Elemento searchResults no encontrado');
    }
    
    // Limpiar campo de búsqueda
    const clienteSearch = document.getElementById('clienteSearch');
    if (clienteSearch) {
        clienteSearch.value = '';
        console.log('Campo de búsqueda limpiado');
    } else {
        console.error('Elemento clienteSearch no encontrado');
    }
    
    // Mostrar cliente seleccionado
    mostrarClienteSeleccionado(cliente);
    
    // Habilitar botón de confirmación
    const confirmBtn = document.getElementById('confirmAssignBtn');
    if (confirmBtn) {
        confirmBtn.disabled = false;
        console.log('Botón de confirmación habilitado');
    } else {
        console.error('Elemento confirmAssignBtn no encontrado');
    }
    
    console.log('=== FIN SELECCIONAR CLIENTE ===');
}

// Función para mostrar el cliente seleccionado
function mostrarClienteSeleccionado(cliente) {
    const selectedClient = document.getElementById('selectedClient');
    const avatar = document.getElementById('selectedClientAvatar');
    const name = document.getElementById('selectedClientName');
    const rut = document.getElementById('selectedClientRut');
    const phone = document.getElementById('selectedClientPhone');
    
    avatar.textContent = `${cliente.nombre.charAt(0)}${cliente.apellido.charAt(0)}`;
    name.textContent = `${cliente.nombre} ${cliente.apellido}`;
    rut.textContent = `RUT: ${cliente.rut}`;
    phone.textContent = `Tel: ${cliente.telefono}`;
    
    selectedClient.style.display = 'block';
}

// Función para limpiar la selección de cliente
function limpiarSeleccionCliente() {
    clienteSeleccionado = null;
    
    // Ocultar cliente seleccionado
    document.getElementById('selectedClient').style.display = 'none';
    
    // Deshabilitar botón de confirmación
    document.getElementById('confirmAssignBtn').disabled = true;
    
    // Limpiar campo de búsqueda
    document.getElementById('clienteSearch').value = '';
}
// Función para cargar horarios del espacio
async function cargarHorariosEspacio(espacio) {
    const horarioSelect = document.getElementById('horarioSelect');
    horarioSelect.innerHTML = '<option value="">Cargando horarios disponibles...</option>';
    
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (!usuarioLogueado) {
            mostrarCardEmergente(false, 'No hay sesión activa');
            return;
        }
        
        const usuario = JSON.parse(usuarioLogueado);
        
        const response = await fetch('../backend/public/asignarespacio.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=obtener_horarios_disponibles&id_espacio=${espacio.id_espacio}&id_administrador=${usuario.id_usuario}`
        });
        
        const result = await response.json();
        
        if (result.success) {
            horarioSelect.innerHTML = '<option value="">Selecciona un horario</option>';
            
            if (result.horarios_disponibles && result.horarios_disponibles.length > 0) {
                result.horarios_disponibles.forEach((horario, index) => {
                    const option = document.createElement('option');
                    option.value = horario.id_horario; // Usar ID del horario como valor
                    option.textContent = `${horario.nombre_dia} - ${horario.hora_inicio} a ${horario.hora_fin}`;
                    horarioSelect.appendChild(option);
                });
                
                // Mostrar información de disponibilidad
                const infoText = document.createElement('div');
                infoText.className = 'horarios-info';
                infoText.innerHTML = `
                    <small class="text-muted">
                        <i class="fas fa-info-circle"></i> 
                        ${result.horarios_disponibles_count} de ${result.total_horarios} horarios disponibles
                    </small>
                `;
                horarioSelect.parentNode.appendChild(infoText);
                
            } else {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No hay horarios disponibles para asignar';
                option.disabled = true;
                horarioSelect.appendChild(option);
                
                // Mostrar información de no disponibilidad
                const infoText = document.createElement('div');
                infoText.className = 'horarios-info no-available';
                infoText.innerHTML = `
                    <small class="text-warning">
                        <i class="fas fa-exclamation-triangle"></i> 
                        Todos los horarios están asignados (${result.total_horarios} horarios)
                    </small>
                `;
                horarioSelect.parentNode.appendChild(infoText);
            }
            
            // Agregar evento para habilitar/deshabilitar botón
            horarioSelect.addEventListener('change', function() {
                const confirmBtn = document.getElementById('confirmAssignBtn');
                confirmBtn.disabled = !this.value || !clienteSeleccionado;
            });
            
        } else {
            horarioSelect.innerHTML = '<option value="">Error al cargar horarios</option>';
            mostrarCardEmergente(false, result.message || 'Error al cargar horarios disponibles');
        }
        
    } catch (error) {
        console.error('Error al cargar horarios:', error);
        horarioSelect.innerHTML = '<option value="">Error al cargar horarios</option>';
        mostrarCardEmergente(false, 'Error al cargar horarios disponibles');
    }
}

// Función para asignar espacio
async function asignarEspacio(idEspacio) {
    if (!clienteSeleccionado) {
        mostrarCardEmergente(false, 'Por favor selecciona un cliente');
        return;
    }
    
    const horarioSelect = document.getElementById('horarioSelect');
    if (!horarioSelect.value) {
        mostrarCardEmergente(false, 'Por favor selecciona un horario');
        return;
    }
    
    try {
        const horarioId = parseInt(horarioSelect.value);
        
        const response = await fetch('../backend/public/asignarespacio.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=asignar_espacio&id_espacio=${idEspacio}&id_cliente=${clienteSeleccionado.id_usuario}&id_horario=${horarioId}`
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarCardEmergente(true, result.message);
            cerrarModalAsignacion();
            cargarEspacios(); // Recargar la lista
        } else {
            mostrarCardEmergente(false, result.message);
        }
        
    } catch (error) {
        console.error('Error al asignar espacio:', error);
        mostrarCardEmergente(false, 'Error al asignar espacio');
    }
}

// Función para cerrar modal de asignación
function cerrarModalAsignacion() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Función para mostrar modal de imágenes
function mostrarModalImagenes(idEspacio) {
    const espacio = espaciosData.find(e => e.id_espacio == idEspacio);
    if (!espacio) return;
    
    // Obtener todas las imágenes disponibles
    const imagenes = [espacio.foto1, espacio.foto2, espacio.foto3, espacio.foto4, espacio.foto5].filter(foto => foto);
    
    if (imagenes.length === 0) {
        mostrarCardEmergente(false, 'No hay imágenes disponibles para este espacio');
        return;
    }
    
    const modal = `
        <div class="modal-overlay" id="modal-imagenes-${idEspacio}" onclick="cerrarModalImagenes(${idEspacio})">
            <div class="modal-content image-gallery-modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>Imágenes de ${espacio.nombre_espacio}</h2>
                    <button class="close-modal" onclick="cerrarModalImagenes(${idEspacio})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="image-gallery">
                        ${imagenes.map((imagen, index) => `
                            <div class="gallery-item">
                                <img src="../${imagen}" alt="Imagen ${index + 1}" class="gallery-image" onclick="abrirImagenCompleta('../${imagen}', ${idEspacio})">
                                <div class="image-number">${index + 1}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="cerrarModalImagenes(${idEspacio})">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

// Función para cerrar modal de imágenes
function cerrarModalImagenes(idEspacio) {
    const modal = document.getElementById(`modal-imagenes-${idEspacio}`);
    if (modal) {
        modal.remove();
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
}

// Función para cerrar modal de imagen completa
function cerrarModalImagenCompleta(idEspacio) {
    const modal = document.getElementById(`modal-imagen-completa-${idEspacio}`);
    if (modal) {
        modal.remove();
    }
}
// ==================== FUNCIONES PARA ACTIVAR PRIVILEGIOS DE CLIENTE ====================
// Función para mostrar confirmación de activación de privilegios
function mostrarConfirmacionActivarPrivilegios() {
    // Crear overlay difuminado
    let overlay = document.getElementById('overlay-activar-privilegios');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'overlay-activar-privilegios';
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
    
    // Crear card de confirmación
    let card = document.createElement('div');
    card.style.background = '#fff';
    card.style.borderRadius = '16px';
    card.style.boxShadow = '0 8px 32px rgba(44,62,80,0.18)';
    card.style.padding = '2.5rem 2rem 2rem 2rem';
    card.style.maxWidth = '90vw';
    card.style.width = '450px';
    card.style.textAlign = 'center';
    card.style.position = 'relative';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.alignItems = 'center';
    card.style.borderLeft = '7px solid #000000';

    // Icono
    let icon = document.createElement('div');
    icon.innerHTML = '<i class="fas fa-user-plus" style="font-size:2.5em;color:#ffd700;"></i>';
    icon.style.marginBottom = '1.5rem';
    card.appendChild(icon);

    // Título
    let title = document.createElement('div');
    title.textContent = 'Activar Privilegios de Cliente';
    title.style.fontSize = '1.4rem';
    title.style.fontWeight = 'bold';
    title.style.color = '#2c3e50';
    title.style.marginBottom = '1rem';
    card.appendChild(title);

    // Mensaje
    let message = document.createElement('div');
    message.innerHTML = `
        <p style="margin-bottom: 1rem; color: #666; line-height: 1.6;">
            Se te asignará el rol de <strong>Cliente</strong> adicionalmente a tu rol actual de <strong>Administrador</strong>.
        </p>
        <p style="margin-bottom: 1.5rem; color: #666; line-height: 1.6;">
            Esto te permitirá acceder a todas las funcionalidades del sistema desde la perspectiva del cliente,
            manteniendo tus privilegios de administrador.
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
    buttonContainer.style.marginTop = '1rem';

    // Botón Cancelar
    let cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.style.background = '#95a5a6';
    cancelBtn.style.color = '#fff';
    cancelBtn.style.border = 'none';
    cancelBtn.style.borderRadius = '8px';
    cancelBtn.style.padding = '0.8rem 2rem';
    cancelBtn.style.fontSize = '1rem';
    cancelBtn.style.fontWeight = '600';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.style.transition = 'all 0.3s ease';
    cancelBtn.onclick = function() {
        cerrarConfirmacionActivarPrivilegios();
    };

    // Botón Confirmar
    let confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Activar Privilegios';
    confirmBtn.style.background = 'linear-gradient(135deg, #4ade80, #22c55e)';
    confirmBtn.style.color = '#fff';
    confirmBtn.style.border = 'none';
    confirmBtn.style.borderRadius = '8px';
    confirmBtn.style.padding = '0.8rem 2rem';
    confirmBtn.style.fontSize = '1rem';
    confirmBtn.style.fontWeight = '600';
    confirmBtn.style.cursor = 'pointer';
    confirmBtn.style.transition = 'all 0.3s ease';
    confirmBtn.onclick = function() {
        confirmBtn.disabled = true;
        cancelBtn.disabled = true;
        confirmBtn.textContent = 'Activando...';
        activarPrivilegiosCliente();
    };

    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(confirmBtn);
    card.appendChild(buttonContainer);

    // Limpiar overlay y agregar card
    overlay.innerHTML = '';
    overlay.appendChild(card);
}

// Función para cerrar la confirmación
function cerrarConfirmacionActivarPrivilegios() {
    const overlay = document.getElementById('overlay-activar-privilegios');
    if (overlay) {
        overlay.remove();
    }
}

// Función para activar privilegios de cliente
async function activarPrivilegiosCliente() {
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (!usuarioLogueado) {
            mostrarCardEmergente(false, 'Error: No hay sesión activa');
            cerrarConfirmacionActivarPrivilegios();
            return;
        }

        const usuario = JSON.parse(usuarioLogueado);
        const idUsuario = usuario.id_usuario;

        const response = await fetch('../backend/public/activar_privilegios_cliente.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=activar_privilegios&id_usuario=${idUsuario}`
        });

        const result = await response.json();

        if (result.success) {
            mostrarCardEmergente(true, '¡Privilegios de cliente activados correctamente!');
            cerrarConfirmacionActivarPrivilegios();
            
            // Actualizar información del usuario en sessionStorage si es necesario
            if (result.usuario_actualizado) {
                sessionStorage.setItem('usuario_logueado', JSON.stringify(result.usuario_actualizado));
            }
        } else {
            mostrarCardEmergente(false, result.message || 'Error al activar privilegios de cliente');
            cerrarConfirmacionActivarPrivilegios();
        }

    } catch (error) {
        console.error('Error al activar privilegios:', error);
        mostrarCardEmergente(false, 'Error de conexión al activar privilegios');
        cerrarConfirmacionActivarPrivilegios();
    }
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
// ==================== FUNCIONES PARA PUBLICAR ARRIENDO ====================

// Función para cargar regiones en el formulario de arriendo
async function cargarRegionesArriendo() {
    try {
        const response = await fetch('../backend/public/regiones_chile.php?action=regiones');
        const data = await response.json();
        
    if (data.success) {
            const regionSelect = document.getElementById('regionArriendo');
            regionSelect.innerHTML = '<option value="">Selecciona una región</option>';
            
        data.regiones.forEach(region => {
            const option = document.createElement('option');
            option.value = region.nombre_region;
            option.textContent = region.nombre_region;
            regionSelect.appendChild(option);
        });
        }
    } catch (error) {
        console.error('Error al cargar regiones:', error);
    }
}

// Función para cargar ciudades en publicar arriendo
async function cargarCiudadesArriendo() {
    const regionSelect = document.getElementById('regionArriendo');
    const ciudadSelect = document.getElementById('ciudadArriendo');
    
    if (!regionSelect || !ciudadSelect) return;
    
    const regionSeleccionada = regionSelect.value;
    
    if (!regionSeleccionada) {
        ciudadSelect.innerHTML = '<option value="">Selecciona una ciudad</option>';
        return;
    }
    
    try {
        // Obtener id_region por nombre y luego cargar ciudades
        const regionesResp = await fetch('../backend/public/regiones_chile.php?action=regiones');
        const regionesData = await regionesResp.json();
        if (!regionesData.success) return;
        const regionObj = (regionesData.regiones || []).find(r => r.nombre_region === regionSeleccionada);
        if (!regionObj) return;
        const response = await fetch(`../backend/public/regiones_chile.php?action=ciudades&id_region=${regionObj.id_region}`);
        const data = await response.json();
        
        ciudadSelect.innerHTML = '<option value="">Selecciona una ciudad</option>';
        
        if (data.success && data.ciudades) {
            data.ciudades.forEach(ciudad => {
                const option = document.createElement('option');
                option.value = ciudad.nombre_ciudad;
                option.textContent = ciudad.nombre_ciudad;
                ciudadSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar ciudades:', error);
    }
}

// Función para cargar arriendos del usuario
async function cargarArriendosUsuario() {
    try {
        const token = sessionStorage.getItem('token_sesion');
        const response = await fetch(`/GestionDeEspacios/backend/public/gestionar_arriendo.php?action=obtener_publicaciones&token=${token}`);
        const data = await response.json();
        
        const container = document.getElementById('arriendosList');
        
        if (data.success && data.publicaciones.length > 0) {
            container.innerHTML = data.publicaciones.map(arriendo => `
                <div class="arriendo-card">
                    <div class="arriendo-image">
                        ${arriendo.fotos ? (() => {
                            const primeraFoto = arriendo.fotos.split('|')[0];
                            return primeraFoto ? `<img src="/GestionDeEspacios/backend/${primeraFoto}" alt="${arriendo.titulo}">` : '<div class="no-image"><i class="fas fa-home"></i></div>';
                        })() : '<div class="no-image"><i class="fas fa-home"></i></div>'}
                    </div>
                    <div class="arriendo-info">
                        <h4>${arriendo.titulo}</h4>
                        <p class="arriendo-location"><i class="fas fa-map-marker-alt"></i> ${arriendo.ciudad}, ${arriendo.region}</p>
                        <p class="arriendo-description">${arriendo.descripcion.substring(0, 100)}${arriendo.descripcion.length > 100 ? '...' : ''}</p>
                        <div class="arriendo-details">
                            <span class="detail-item"><i class="fas fa-ruler-combined"></i> ${arriendo.metros_cuadrados} m²</span>
                            <span class="detail-item"><i class="fas fa-tag"></i> ${arriendo.tipo_espacio}</span>
                            <span class="detail-item"><i class="fas fa-dollar-sign"></i> $${parseInt(arriendo.precio_arriendo).toLocaleString()}</span>
                        </div>
                        <div class="arriendo-status">
                            <span class="status-badge ${arriendo.estado.toLowerCase()}">${arriendo.estado}</span>
                            <span class="arriendo-date">Publicado: ${new Date(arriendo.fecha_publicacion).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div class="arriendo-actions">
                        <button class="btn-action view" onclick="verDetallesArriendo(${arriendo.id_publicacion})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action ratings" onclick="verCalificacionesArriendo(${arriendo.id_publicacion})" title="Ver calificaciones">
                            <i class="fas fa-star-half-alt"></i>
                        </button>
                        <button class="btn-action edit" onclick="editarArriendo(${arriendo.id_publicacion})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action delete" onclick="eliminarArriendo(${arriendo.id_publicacion})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `
                <div class="no-arriendos">
                    <i class="fas fa-home"></i>
                    <h3>No tienes publicaciones de arriendo</h3>
                    <p>Comienza publicando tu primer espacio en arriendo</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error al cargar arriendos:', error);
        document.getElementById('arriendosList').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar las publicaciones</p>
            </div>
        `;
    }
}

// Función para ver calificaciones del arriendo
async function verCalificacionesArriendo(idPublicacion) {
    try {
        // Mostrar loading
        mostrarLoadingCalificacionesAdmin();
        
        // Obtener calificaciones del backend
        const data = await obtenerCalificacionesArriendo(idPublicacion);
        const calificaciones = data.calificaciones;
        
        // Crear y mostrar el modal
        crearModalCalificacionesAdmin(idPublicacion, calificaciones, data.promedio_general);
        
    } catch (error) {
        console.error('Error al cargar calificaciones:', error);
        mostrarErrorCalificacionesAdmin('Error al cargar las calificaciones');
    }
}

// Función para obtener calificaciones del backend
async function obtenerCalificacionesArriendo(idPublicacion) {
    console.log('Obteniendo calificaciones para publicación:', idPublicacion);
    
    // Validar que el ID sea válido
    if (!idPublicacion || isNaN(idPublicacion)) {
        throw new Error('ID de publicación inválido');
    }
    
    const requestData = {
        action: 'obtener_calificaciones',
        id_publicacion: parseInt(idPublicacion)
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
function mostrarLoadingCalificacionesAdmin() {
    let modal = document.getElementById('modalCalificacionesArriendo');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalCalificacionesArriendo';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="modal-content calificaciones-modal">
            <div class="modal-header">
                <h3><i class="fas fa-star-half-alt"></i> Calificaciones del Arriendo</h3>
                <button class="modal-close" onclick="cerrarModalCalificacionesArriendo()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <div class="loading-calificaciones">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Cargando calificaciones...</p>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
    modal.classList.add('show');
}

// Función para crear el modal con las calificaciones
function crearModalCalificacionesAdmin(idPublicacion, calificaciones, promedioGeneral) {
    const modal = document.getElementById('modalCalificacionesArriendo');
    
    let contenidoCalificaciones = '';
    
    if (calificaciones.length === 0) {
        contenidoCalificaciones = `
            <div class="no-calificaciones">
                <i class="fas fa-star"></i>
                <h4>No hay calificaciones aún</h4>
                <p>Este arriendo aún no ha recibido calificaciones.</p>
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
                        ${generarEstrellasPromedioAdmin(promedio)}
                    </div>
                    <div class="promedio-texto">Basado en ${calificaciones.length} calificación${calificaciones.length !== 1 ? 'es' : ''}</div>
                </div>
            </div>
            
            <div class="calificaciones-lista">
                ${calificaciones.map(calificacion => `
                    <div class="calificacion-item">
                        <div class="calificacion-header">
                            <div class="calificacion-usuario">
                                <div class="usuario-avatar">
                                    ${calificacion.nombre ? calificacion.nombre.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div class="usuario-info">
                                    <div class="usuario-nombre">${calificacion.nombre || 'Usuario'} ${calificacion.apellido || ''}</div>
                                    <div class="calificacion-fecha">${formatearFechaAdmin(calificacion.fecha_calificacion)}</div>
                                </div>
                            </div>
                            <div class="calificacion-puntuacion">
                                ${generarEstrellasCalificacionAdmin(calificacion.promedio_calificacion)}
                                <span class="puntuacion-numero">${calificacion.promedio_calificacion}</span>
                            </div>
                        </div>
                        <div class="calificacion-comentario">
                            ${calificacion.comentario || 'Sin comentario'}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    modal.innerHTML = `
        <div class="modal-content calificaciones-modal">
            <div class="modal-header">
                <h3><i class="fas fa-star-half-alt"></i> Calificaciones del Arriendo</h3>
                <button class="modal-close" onclick="cerrarModalCalificacionesArriendo()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                ${contenidoCalificaciones}
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
    modal.classList.add('show');
}

// Función para generar estrellas de promedio
function generarEstrellasPromedioAdmin(promedio) {
    let estrellas = '';
    const estrellasCompletas = Math.floor(promedio);
    const tieneMediaEstrella = promedio % 1 >= 0.5;
    
    // Estrellas completas
    for (let i = 0; i < estrellasCompletas; i++) {
        estrellas += '<i class="fas fa-star"></i>';
    }
    
    // Media estrella
    if (tieneMediaEstrella) {
        estrellas += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Estrellas vacías
    const estrellasVacias = 5 - estrellasCompletas - (tieneMediaEstrella ? 1 : 0);
    for (let i = 0; i < estrellasVacias; i++) {
        estrellas += '<i class="far fa-star"></i>';
    }
    
    return estrellas;
}

// Función para generar estrellas de calificación individual
function generarEstrellasCalificacionAdmin(puntuacion) {
    let estrellas = '';
    const puntuacionNum = parseFloat(puntuacion);
    
    for (let i = 1; i <= 5; i++) {
        if (i <= puntuacionNum) {
            estrellas += '<i class="fas fa-star"></i>';
        } else {
            estrellas += '<i class="far fa-star"></i>';
        }
    }
    
    return estrellas;
}

// Función para formatear fecha
function formatearFechaAdmin(fecha) {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Función para mostrar error
function mostrarErrorCalificacionesAdmin(mensaje) {
    let modal = document.getElementById('modalCalificacionesArriendo');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalCalificacionesArriendo';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="modal-content calificaciones-modal">
            <div class="modal-header">
                <h3><i class="fas fa-star-half-alt"></i> Calificaciones del Arriendo</h3>
                <button class="modal-close" onclick="cerrarModalCalificacionesArriendo()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <div class="error-calificaciones">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Error</h4>
                    <p>${mensaje}</p>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
    modal.classList.add('show');
}

// Función para cerrar modal de calificaciones
function cerrarModalCalificacionesArriendo() {
    console.log('Cerrando modal de calificaciones...');
    const modal = document.getElementById('modalCalificacionesArriendo');
    
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            console.log('Modal de calificaciones cerrado completamente');
        }, 300);
    }
}

// Función para ver detalles del arriendo
async function verDetallesArriendo(id) {
    try {
        const token = sessionStorage.getItem('token_sesion');
        const response = await fetch(`/GestionDeEspacios/backend/public/gestionar_arriendo.php?action=obtener_publicaciones&token=${token}`);
        const data = await response.json();
        
        if (data.success) {
            const arriendo = data.publicaciones.find(a => a.id_publicacion == id);
            if (arriendo) {
                mostrarModalDetallesArriendo(arriendo);
            } else {
                mostrarCardEmergente(false, 'No se encontró la publicación');
            }
        } else {
            mostrarCardEmergente(false, 'Error al cargar los detalles');
        }
    } catch (error) {
        console.error('Error al cargar detalles:', error);
        mostrarCardEmergente(false, 'Error al cargar los detalles');
    }
}

// Función para mostrar el modal de detalles
function mostrarModalDetallesArriendo(arriendo) {
    const modal = `
        <div class="modal-overlay modal-detalles-arriendo" onclick="cerrarModalDetalles()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>${arriendo.titulo}</h2>
                    <button class="close-modal" onclick="cerrarModalDetalles()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="space-details-grid">
                        <div class="detail-section">
                            <h3><i class="fas fa-info-circle"></i> Información General</h3>
                            <p><strong>Tipo de Espacio:</strong> ${arriendo.tipo_espacio}</p>
                            <p><strong>Metros Cuadrados:</strong> ${arriendo.metros_cuadrados} m²</p>
                            <p><strong>Precio de Arriendo:</strong> $${parseInt(arriendo.precio_arriendo).toLocaleString()} /mes</p>
                            <p><strong>Ubicación:</strong> ${arriendo.direccion}</p>
                            <p><strong>Ciudad:</strong> ${arriendo.ciudad}, ${arriendo.region}</p>
                            <p><strong>Estado:</strong> <span class="status-badge ${arriendo.estado.toLowerCase()}">${arriendo.estado}</span></p>
                            <p><strong>Fecha de Publicación:</strong> ${new Date(arriendo.fecha_publicacion).toLocaleDateString('es-ES', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</p>
                        </div>
                        
                        <div class="detail-section">
                            <h3><i class="fas fa-align-left"></i> Descripción</h3>
                            <p>${arriendo.descripcion}</p>
                        </div>
                        
                        ${arriendo.equipamiento ? `
                        <div class="detail-section">
                            <h3><i class="fas fa-tools"></i> Equipamiento Incluido</h3>
                            <p>${arriendo.equipamiento}</p>
                        </div>
                        ` : ''}
                        
                        <div class="detail-section">
                            <h3><i class="fas fa-images"></i> Imágenes del Espacio</h3>
                            <div class="arriendo-images-grid">
                                ${arriendo.fotos ? (() => {
                                    const fotosArray = arriendo.fotos.split('|').filter(foto => foto.trim() !== '');
                                    if (fotosArray.length > 0) {
                                        return fotosArray.map(foto => `
                                            <div class="arriendo-image-item">
                                                <img src="/GestionDeEspacios/backend/${foto}" alt="${arriendo.titulo}">
                                            </div>
                                        `).join('');
                                    } else {
                                        return `
                                            <div class="no-images-info">
                                                <i class="fas fa-image"></i>
                                                <p>No hay imágenes disponibles</p>
                                            </div>
                                        `;
                                    }
                                })() : `
                                    <div class="no-images-info">
                                        <i class="fas fa-image"></i>
                                        <p>No hay imágenes disponibles</p>
                                    </div>
                                `}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="cerrarModalDetalles()">Cerrar</button>
                    <button class="btn-primary" onclick="editarArriendo(${arriendo.id_publicacion})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
    document.body.style.overflow = 'hidden';
}

// Función para cerrar el modal de detalles
function cerrarModalDetalles() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}
// Función para editar arriendo
async function editarArriendo(id) {
    try {
        const token = sessionStorage.getItem('token_sesion');
        const response = await fetch(`/GestionDeEspacios/backend/public/gestionar_arriendo.php?action=obtener_publicaciones&token=${token}`);
        const data = await response.json();
        
        if (data.success) {
            const arriendo = data.publicaciones.find(a => a.id_publicacion == id);
            if (arriendo) {
                mostrarModalEditarArriendo(arriendo);
            } else {
                mostrarCardEmergente(false, 'No se encontró la publicación');
            }
        } else {
            mostrarCardEmergente(false, 'Error al cargar los datos');
        }
    } catch (error) {
        console.error('Error al cargar datos:', error);
        mostrarCardEmergente(false, 'Error al cargar los datos');
    }
}
// Función para mostrar modal de edición de arriendo
function mostrarModalEditarArriendo(arriendo) {
    const modal = `
        <div class="modal-overlay modal-editar-arriendo" onclick="cerrarModalEditarArriendo()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>Editar Publicación de Arriendo</h2>
                    <button class="close-modal" onclick="cerrarModalEditarArriendo()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="editarArriendoForm" onsubmit="guardarEdicionArriendo(event, ${arriendo.id_publicacion})">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editTituloArriendo">Título de la Publicación *</label>
                                <input type="text" id="editTituloArriendo" name="titulo" value="${arriendo.titulo}" required>
                            </div>
                            <div class="form-group">
                                <label for="editPrecioArriendo">Precio de Arriendo (CLP) *</label>
                                <input type="number" id="editPrecioArriendo" name="precio_arriendo" value="${arriendo.precio_arriendo}" min="0" step="1000" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="editDescripcionArriendo">Descripción *</label>
                            <textarea id="editDescripcionArriendo" name="descripcion" rows="4" required>${arriendo.descripcion}</textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editRegionArriendo">Región *</label>
                                <select id="editRegionArriendo" name="region" required onchange="cargarCiudadesEditar()">
                                    <option value="">Selecciona una región</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="editCiudadArriendo">Ciudad *</label>
                                <select id="editCiudadArriendo" name="ciudad" required>
                                    <option value="">Selecciona una ciudad</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="editDireccionArriendo">Dirección *</label>
                            <input type="text" id="editDireccionArriendo" name="direccion" value="${arriendo.direccion}" required>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editMetrosCuadradosArriendo">Metros Cuadrados *</label>
                                <input type="number" id="editMetrosCuadradosArriendo" name="metros_cuadrados" value="${arriendo.metros_cuadrados}" min="1" step="0.01" required>
                            </div>
                            <div class="form-group">
                                <label for="editTipoEspacioArriendo">Tipo de Espacio *</label>
                                <select id="editTipoEspacioArriendo" name="tipo_espacio" required>
                                    <option value="Oficina" ${arriendo.tipo_espacio === 'Oficina' ? 'selected' : ''}>Oficina</option>
                                    <option value="Local Comercial" ${arriendo.tipo_espacio === 'Local Comercial' ? 'selected' : ''}>Local Comercial</option>
                                    <option value="Sala de Reuniones" ${arriendo.tipo_espacio === 'Sala de Reuniones' ? 'selected' : ''}>Sala de Reuniones</option>
                                    <option value="Consultorio" ${arriendo.tipo_espacio === 'Consultorio' ? 'selected' : ''}>Consultorio</option>
                                    <option value="Depósito" ${arriendo.tipo_espacio === 'Depósito' ? 'selected' : ''}>Depósito</option>
                                    <option value="Bodega" ${arriendo.tipo_espacio === 'Bodega' ? 'selected' : ''}>Bodega</option>
                                    <option value="Estacionamiento" ${arriendo.tipo_espacio === 'Estacionamiento' ? 'selected' : ''}>Estacionamiento</option>
                                    <option value="Otro" ${arriendo.tipo_espacio === 'Otro' ? 'selected' : ''}>Otro</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="editEquipamientoArriendo">Equipamiento Incluido</label>
                            <textarea id="editEquipamientoArriendo" name="equipamiento" rows="3" placeholder="Lista el equipamiento que incluye el arriendo (muebles, equipos, etc.)">${arriendo.equipamiento || ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>Imágenes del Espacio (Máximo 5 fotos)</label>
                            <div class="photo-upload-grid">
                                <div class="photo-upload-item">
                                    <input type="file" id="editFoto1" name="foto1" accept="image/*" onchange="previewImage(this, 'editPreview1')">
                                    <label for="editFoto1" class="photo-upload-label">
                                        <i class="fas fa-camera"></i>
                                        <span>IMG</span>
                                    </label>
                                    <div id="editPreview1" class="photo-preview">
                                        ${arriendo.foto1 ? `<img src="/GestionDeEspacios/backend/${arriendo.foto1}" alt="Foto actual"><button type="button" class="remove-photo" onclick="removePhoto('editFoto1', 'editPreview1')"><i class="fas fa-times"></i></button>` : ''}
                                    </div>
                                </div>
                                <div class="photo-upload-item">
                                    <input type="file" id="editFoto2" name="foto2" accept="image/*" onchange="previewImage(this, 'editPreview2')">
                                    <label for="editFoto2" class="photo-upload-label">
                                        <i class="fas fa-camera"></i>
                                        <span>IMG</span>
                                    </label>
                                    <div id="editPreview2" class="photo-preview">
                                        
                                    </div>
                                </div>
                                <div class="photo-upload-item">
                                    <input type="file" id="editFoto3" name="foto3" accept="image/*" onchange="previewImage(this, 'editPreview3')">
                                    <label for="editFoto3" class="photo-upload-label">
                                        <i class="fas fa-camera"></i>
                                        <span>IMG</span>
                                    </label>
                                    <div id="editPreview3" class="photo-preview">
                                        
                                    </div>
                                </div>
                                <div class="photo-upload-item">
                                    <input type="file" id="editFoto4" name="foto4" accept="image/*" onchange="previewImage(this, 'editPreview4')">
                                    <label for="editFoto4" class="photo-upload-label">
                                        <i class="fas fa-camera"></i>
                                        <span>IMG</span>
                                    </label>
                                    <div id="editPreview4" class="photo-preview">
                                        
                                    </div>
                                </div>
                                <div class="photo-upload-item">
                                    <input type="file" id="editFoto5" name="foto5" accept="image/*" onchange="previewImage(this, 'editPreview5')">
                                    <label for="editFoto5" class="photo-upload-label">
                                        <i class="fas fa-camera"></i>
                                        <span>IMG</span>
                                    </label>
                                    <div id="editPreview5" class="photo-preview">
                                        
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" onclick="cerrarModalEditarArriendo()">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-save"></i> Guardar Cambios
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
    document.body.style.overflow = 'hidden';
    
    // Cargar regiones y ciudades
    cargarRegionesEditar();
    // Cargar todas las fotos actuales para previsualización
    (async () => {
        try {
            const token = sessionStorage.getItem('token_sesion') || '';
            const resp = await fetch(`/GestionDeEspacios/backend/public/gestionar_arriendo.php?action=obtener_fotos&token=${encodeURIComponent(token)}&id_publicacion=${arriendo.id_publicacion}`);
            const data = await resp.json();
            if (data.success && Array.isArray(data.fotos)) {
                const previews = [
                    document.getElementById('editPreview1'),
                    document.getElementById('editPreview2'),
                    document.getElementById('editPreview3'),
                    document.getElementById('editPreview4'),
                    document.getElementById('editPreview5')
                ];
                data.fotos.slice(0, 5).forEach((f, idx) => {
                    if (previews[idx]) {
                        previews[idx].innerHTML = `<img src="/GestionDeEspacios/backend/${f.url_imagen}" alt="Foto actual"><button type="button" class="remove-photo" onclick="removePhoto('editFoto${idx+1}', 'editPreview${idx+1}')"><i class=\"fas fa-times\"></i></button>`;
                    }
                });
            }
        } catch (e) { console.error('Error al cargar fotos actuales:', e); }
    })();
    // Establecer la región y ciudad actual
    setTimeout(() => {
        document.getElementById('editRegionArriendo').value = arriendo.region;
        cargarCiudadesEditar();
        setTimeout(() => {
            document.getElementById('editCiudadArriendo').value = arriendo.ciudad;
        }, 500);
    }, 500);
}

// Función para cargar regiones en el modal de edición
async function cargarRegionesEditar() {
    try {
        const response = await fetch('../backend/public/regiones_chile.php?action=regiones');
        const data = await response.json();
        
        const select = document.getElementById('editRegionArriendo');
        select.innerHTML = '<option value="">Selecciona una región</option>';
        
    if (data.success && data.regiones) {
            data.regiones.forEach(region => {
                const option = document.createElement('option');
            option.value = region.nombre_region;
            option.textContent = region.nombre_region;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar regiones:', error);
    }
}

// Función para cargar ciudades en el modal de edición
async function cargarCiudadesEditar() {
    const region = document.getElementById('editRegionArriendo').value;
    if (!region) return;
    
    try {
        const formData = new FormData();
        formData.append('region', region);
        
        const regionesResp = await fetch('../backend/public/regiones_chile.php?action=regiones');
        const regionesData = await regionesResp.json();
        if (!regionesData.success) return;
        const regionObj = (regionesData.regiones || []).find(r => r.nombre_region === region);
        if (!regionObj) return;
        const response = await fetch(`../backend/public/regiones_chile.php?action=ciudades&id_region=${regionObj.id_region}`);
        const data = await response.json();
        
        const select = document.getElementById('editCiudadArriendo');
        select.innerHTML = '<option value="">Selecciona una ciudad</option>';
        
    if (data.success && data.ciudades) {
            data.ciudades.forEach(ciudad => {
                const option = document.createElement('option');
            option.value = ciudad.nombre_ciudad;
            option.textContent = ciudad.nombre_ciudad;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar ciudades:', error);
    }
}

// Función para cerrar modal de edición
function cerrarModalEditarArriendo() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

// Función para guardar edición de arriendo
async function guardarEdicionArriendo(event, idArriendo) {
    event.preventDefault();
    
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    if (!usuarioLogueado) {
        mostrarCardEmergente(false, 'No hay sesión activa');
        return;
    }
    
    try {
        const usuario = JSON.parse(usuarioLogueado);
        const formData = new FormData();
        
        // Agregar datos del formulario
        formData.append('action', 'editar_arriendo');
        formData.append('token', sessionStorage.getItem('token_sesion'));
        formData.append('id_publicacion', idArriendo);
        formData.append('titulo', document.getElementById('editTituloArriendo').value.trim());
        formData.append('descripcion', document.getElementById('editDescripcionArriendo').value.trim());
        formData.append('region', document.getElementById('editRegionArriendo').value);
        formData.append('ciudad', document.getElementById('editCiudadArriendo').value);
        formData.append('direccion', document.getElementById('editDireccionArriendo').value.trim());
        formData.append('metros_cuadrados', document.getElementById('editMetrosCuadradosArriendo').value);
        formData.append('tipo_espacio', document.getElementById('editTipoEspacioArriendo').value);
        formData.append('equipamiento', document.getElementById('editEquipamientoArriendo').value.trim());
        formData.append('precio_arriendo', document.getElementById('editPrecioArriendo').value);
        
        // Debug: log de datos enviados
        console.log('[EditarArriendo] Payload:', {
            id_publicacion: idArriendo,
            titulo: document.getElementById('editTituloArriendo').value.trim(),
            descripcion: document.getElementById('editDescripcionArriendo').value.trim(),
            region: document.getElementById('editRegionArriendo').value,
            ciudad: document.getElementById('editCiudadArriendo').value,
            direccion: document.getElementById('editDireccionArriendo').value.trim(),
            metros_cuadrados: document.getElementById('editMetrosCuadradosArriendo').value,
            tipo_espacio: document.getElementById('editTipoEspacioArriendo').value,
            equipamiento: document.getElementById('editEquipamientoArriendo').value.trim(),
            precio_arriendo: document.getElementById('editPrecioArriendo').value
        });

        // Agregar fotos si existen
        const fotos = ['editFoto1', 'editFoto2', 'editFoto3', 'editFoto4', 'editFoto5'];
        fotos.forEach((fotoId, index) => {
            const fileInput = document.getElementById(fotoId);
            if (fileInput.files[0]) {
                formData.append(`foto${index + 1}`, fileInput.files[0]);
            }
        });
        
        // Agregar información de fotos eliminadas
        const fotosEliminadas = ['removeFoto1', 'removeFoto2', 'removeFoto3', 'removeFoto4', 'removeFoto5'];
        fotosEliminadas.forEach((removeId, index) => {
            const removeInput = document.querySelector(`input[name="${removeId}"]`);
            if (removeInput && removeInput.value === 'true') {
                formData.append(`remove_foto${index + 1}`, 'true');
            }
        });
        
        const response = await fetch('/GestionDeEspacios/backend/public/gestionar_arriendo.php', {
            method: 'POST',
            body: formData
        });
        
        const text = await response.text();
        let result;
        try { result = JSON.parse(text); } catch (e) {
            console.error('[EditarArriendo] Respuesta no JSON:', text);
            mostrarCardEmergente(false, 'Respuesta no válida del servidor');
            return;
        }
        
        if (result.success) {
            mostrarCardEmergente(true, result.message);
            cerrarModalEditarArriendo();
            cargarArriendosUsuario(); // Recargar la lista
        } else {
            try { console.error('Editar Arriendo - Debug backend:', result.debug || {}); } catch {}
            if (result.debug) {
                console.error('[EditarArriendo] Debug stringify:', JSON.stringify(result.debug));
            }
            mostrarCardEmergente(false, result.message);
        }
        
    } catch (error) {
        console.error('Error al editar arriendo:', error);
        mostrarCardEmergente(false, 'Error al editar el arriendo');
    }
}

// Función para eliminar arriendo
async function eliminarArriendo(id) {
    // Obtener el título del arriendo para mostrarlo en la confirmación
    const token = sessionStorage.getItem('token_sesion');
    try {
        const response = await fetch(`/GestionDeEspacios/backend/public/gestionar_arriendo.php?action=obtener_publicaciones&token=${token}`);
        const data = await response.json();
        
        if (data.success) {
            const arriendo = data.publicaciones.find(a => a.id_publicacion == id);
            if (arriendo) {
                mostrarConfirmacionEliminacionArriendo(id, arriendo.titulo);
            } else {
                mostrarCardEmergente(false, 'No se encontró la publicación');
            }
        } else {
            mostrarCardEmergente(false, 'Error al cargar los datos');
        }
    } catch (error) {
        console.error('Error al cargar datos:', error);
        mostrarCardEmergente(false, 'Error al cargar los datos');
    }
}

// Función para mostrar confirmación de eliminación de arriendo
function mostrarConfirmacionEliminacionArriendo(idArriendo, tituloArriendo) {
    const modal = `
        <div class="modal-overlay" style="z-index: 10000;">
            <div class="confirmation-modal">
                <div class="confirmation-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Confirmar Eliminación</h3>
                </div>
                <div class="confirmation-body">
                    <p>¿Estás seguro de que deseas eliminar la publicación <strong>"${tituloArriendo}"</strong>?</p>
                    <p class="confirmation-warning">Esta acción no se puede deshacer.</p>
                </div>
                <div class="confirmation-actions">
                    <button class="btn-cancel" onclick="cerrarConfirmacionEliminacionArriendo()">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button class="btn-confirm-delete" onclick="confirmarEliminacionArriendo(${idArriendo})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

// Función para cerrar confirmación de eliminación de arriendo
function cerrarConfirmacionEliminacionArriendo() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Función para confirmar eliminación de arriendo
async function confirmarEliminacionArriendo(id) {
    cerrarConfirmacionEliminacionArriendo();
    
    try {
        const formData = new FormData();
        formData.append('action', 'eliminar_publicacion');
        formData.append('id', id);
        formData.append('token', sessionStorage.getItem('token_sesion'));
        
        const response = await fetch('/GestionDeEspacios/backend/public/gestionar_arriendo.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarCardEmergente(true, data.message);
            cargarArriendosUsuario(); // Recargar la lista
        } else {
            mostrarCardEmergente(false, data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarCardEmergente(false, 'Error al eliminar la publicación');
    }
}
// Función para publicar arriendo
async function publicarArriendo(event) {
    event.preventDefault();
    
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    
    if (!usuarioLogueado) {
        mostrarCardEmergente(false, 'No hay sesión activa');
        return;
    }
    
    try {
        const usuario = JSON.parse(usuarioLogueado);
        const formData = new FormData();
        
        // Agregar datos del formulario
        formData.append('action', 'publicar_arriendo');
        formData.append('token', sessionStorage.getItem('token_sesion'));
        formData.append('id_usuario', usuario.id_usuario);
        formData.append('titulo', document.getElementById('tituloArriendo').value.trim());
        formData.append('descripcion', document.getElementById('descripcionArriendo').value.trim());
        formData.append('region', document.getElementById('regionArriendo').value);
        formData.append('ciudad', document.getElementById('ciudadArriendo').value);
        formData.append('direccion', document.getElementById('direccionArriendo').value.trim());
        formData.append('metros_cuadrados', document.getElementById('metrosCuadradosArriendo').value);
        formData.append('tipo_espacio', document.getElementById('tipoEspacioArriendo').value);
        formData.append('equipamiento', document.getElementById('equipamientoArriendo').value.trim());
        formData.append('precio_arriendo', document.getElementById('precioArriendo').value);
        formData.append('estado', 'Publicado');
        
        // Agregar fotos si existen
        const fotos = ['foto1', 'foto2', 'foto3', 'foto4', 'foto5'];
        fotos.forEach((fotoId, index) => {
            const fileInput = document.getElementById(fotoId);
            if (fileInput.files[0]) {
                formData.append(`foto${index + 1}`, fileInput.files[0]);
            }
        });
        
        const response = await fetch('/GestionDeEspacios/backend/public/gestionar_arriendo.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarCardEmergente(true, result.message);
            // Limpiar formulario
            document.getElementById('publicarArriendoForm').reset();
            // Limpiar previews de imágenes
            fotos.forEach(fotoId => {
                const previewId = fotoId.replace('foto', 'preview');
                document.getElementById(previewId).innerHTML = '';
            });
            // Limpiar ciudades
            document.getElementById('ciudadArriendo').innerHTML = '<option value="">Selecciona una ciudad</option>';
            // Recargar lista de arriendos
            cargarArriendosUsuario();
        } else {
            mostrarCardEmergente(false, result.message);
        }
        
    } catch (error) {
        console.error('Error al publicar arriendo:', error);
        mostrarCardEmergente(false, 'Error al publicar el arriendo');
    }
}

// ==================== FUNCIONES PARA GESTIONAR SECRETARIAS ====================

// Variable global para almacenar colaboradores
let colaboradoresData = [];

// Función para cargar colaboradores
async function cargarColaboradores() {
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (!usuarioLogueado) {
            mostrarCardEmergente(false, 'Error: No hay sesión activa');
            return;
        }
        
        const usuario = JSON.parse(usuarioLogueado);
        const idAdministrador = usuario.id_usuario;
        
        const response = await fetch('/GestionDeEspacios/backend/public/gestionar_colaboradores.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=obtener_colaboradores&id_administrador=${idAdministrador}`
        });
        
        const data = await response.json();
        
        if (data.success) {
            colaboradoresData = data.colaboradores;
            renderizarColaboradores();
            // Cargar regiones para los selects
            cargarRegiones();
        } else {
            mostrarCardEmergente(false, data.message);
        }
    } catch (error) {
        console.error('Error al cargar colaboradores:', error);
        mostrarCardEmergente(false, 'Error al cargar colaboradores');
    }
}

// Función para renderizar la lista de colaboradores
function renderizarColaboradores(colaboradores = colaboradoresData) {
    const container = document.getElementById('colaboradores-list');
    if (!container) return;
    
    // Crear la sección de colaboradores con el mismo estilo que AdminSistema
    container.innerHTML = `
        <div class="colaboradores-sistema-section">
            <div class="colaboradores-header">
                <h3><i class="fas fa-user-tie"></i> Colaboradores del Sistema</h3>
                <p>Lista de todos los colaboradores registrados (${colaboradores.length} colaboradores)</p>
            </div>
            
            <div class="colaboradores-grid" id="colaboradoresGrid">
                ${colaboradores.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-user-tie"></i>
                        <h3>No hay colaboradores registrados</h3>
                        <p>Comienza agregando tu primer colaborador</p>
                    </div>
                ` : colaboradores.map(colaborador => `
                    <div class="colaborador-card" data-id="${colaborador.id_colaborador}">
                        <div class="colaborador-card-header">
                            <div class="colaborador-avatar">
                                ${colaborador.nombre.charAt(0)}${colaborador.apellido.charAt(0)}
                            </div>
                            <div class="colaborador-title">
                                <h4>${colaborador.nombre} ${colaborador.apellido}</h4>
                            </div>
                        </div>
                        <p class="colaborador-rol colaborador">
                            <i class="fas fa-user-tag"></i> Colaborador
                        </p>
                        <div class="colaborador-info">
                            <div class="colaborador-details">
                                <p><i class="fas fa-id-card"></i> ${colaborador.rut}</p>
                                <p><i class="fas fa-envelope"></i> ${colaborador.correo_electronico}</p>
                                <p><i class="fas fa-user"></i> ${colaborador.nombre_usuario}</p>
                                ${colaborador.telefono ? `<p><i class="fas fa-phone"></i> ${colaborador.telefono}</p>` : ''}
                                ${colaborador.region ? `<p><i class="fas fa-map-marker-alt"></i> ${colaborador.region}${colaborador.ciudad ? ', ' + colaborador.ciudad : ''}</p>` : ''}
                            </div>
                        </div>
                        <div class="colaborador-actions">
                            <button class="colaborador-edit-btn" onclick="editarColaborador(${colaborador.id_colaborador})" title="Editar colaborador">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="colaborador-delete-btn" onclick="eliminarColaborador(${colaborador.id_colaborador})" title="Eliminar colaborador">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Funciones para acciones de colaboradores (ya están implementadas en el código existente)

// Función para filtrar colaboradores (ya no se usa)

// Función para inicializar formulario en modo registro
function inicializarFormularioRegistro() {
    const titulo = document.getElementById('titulo-formulario');
    const textoBoton = document.getElementById('texto-boton');
    const form = document.getElementById('formColaborador');
    
    if (!titulo || !textoBoton || !form) return;
    
    // Limpiar formulario
    form.reset();
    document.getElementById('id_colaborador_edit').value = '';
    
    // Configurar para registro
    titulo.textContent = 'Registrar Nuevo Colaborador';
    textoBoton.textContent = 'Registrar';
    
    // Restaurar campo contraseña para registro
    const contrasenaField = document.getElementById('contrasena');
    contrasenaField.placeholder = '';
    contrasenaField.required = true;
}

// Función para mostrar formulario de registro de colaborador (ya no se usa, el formulario está siempre visible)

// Función para cerrar formulario
function cerrarFormularioColaborador() {
    inicializarFormularioRegistro();
}
// Función unificada para procesar formulario de colaborador
async function procesarFormularioColaborador(event) {
    event.preventDefault();
    
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (!usuarioLogueado) {
            mostrarCardEmergente(false, 'Error: No hay sesión activa');
            return;
        }
        
        const usuario = JSON.parse(usuarioLogueado);
        const formData = new FormData(event.target);
        const idColaborador = document.getElementById('id_colaborador_edit').value;
        const esEdicion = idColaborador !== '';
        
        // Debug: Mostrar información del usuario
        console.log('Usuario logueado:', usuario);
        console.log('ID Administrador:', usuario.id_usuario);
        
        // Combinar RUT y DV
        const rut = formData.get('rut');
        const dv = formData.get('dv');
        const rutCompleto = `${rut}-${dv}`;
        
        const data = {
            action: esEdicion ? 'actualizar_colaborador' : 'registrar_colaborador',
            id_administrador: usuario.id_usuario,
            nombre_usuario: formData.get('nombre_usuario'),
            contrasena: formData.get('contrasena'),
            rut: rutCompleto,
            nombre: formData.get('nombre'),
            apellido: formData.get('apellido'),
            correo_electronico: formData.get('correo_electronico'),
            telefono: formData.get('telefono'),
            region: formData.get('region'),
            ciudad: formData.get('ciudad'),
            direccion: formData.get('direccion'),
            activo: formData.get('activo') ? '1' : '0'
        };
        
        // Agregar ID de colaborador si es edición
        if (esEdicion) {
            data.id_colaborador = idColaborador;
        }
        
        // Agregar nueva contraseña si se proporciona en edición
        if (esEdicion && formData.get('contrasena')) {
            data.nueva_contrasena = formData.get('contrasena');
        }
        
        // Debug: Mostrar datos que se van a enviar
        console.log('Datos a enviar:', data);
        
        const response = await fetch('/GestionDeEspacios/backend/public/gestionar_colaboradores.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(data)
        });
        
        const result = await response.json();
        
        // Debug: Mostrar respuesta del servidor
        console.log('Respuesta del servidor:', result);
        
        if (result.success) {
            mostrarCardEmergente(true, result.message);
            inicializarFormularioRegistro();
            cargarColaboradores();
        } else {
            mostrarCardEmergente(false, result.message);
        }
    } catch (error) {
        console.error('Error al procesar colaborador:', error);
        mostrarCardEmergente(false, 'Error al procesar colaborador');
    }
}

// Función para editar colaborador
async function editarColaborador(idColaborador) {
    try {
        const colaborador = colaboradoresData.find(s => s.id_colaborador == idColaborador);
        if (!colaborador) {
            mostrarCardEmergente(false, 'Colaborador no encontrada');
            return;
        }
        
        // Llenar formulario del modal con datos de la colaborador
        console.log('Colaborador encontrada:', colaborador);
        console.log('ID Colaborador a asignar:', colaborador.id_colaborador);
        
        document.getElementById('id_colaborador_modal').value = colaborador.id_colaborador;
        
        // Verificar que se asignó correctamente
        const idAsignado = document.getElementById('id_colaborador_modal').value;
        console.log('ID asignado al campo:', idAsignado);
        
        document.getElementById('nombre_usuario_modal').value = colaborador.nombre_usuario;
        document.getElementById('contrasena_modal').value = ''; // No mostrar contraseña actual
        
        // Separar RUT y DV
        const rutCompleto = colaborador.rut || '';
        const rutPartes = rutCompleto.split('-');
        document.getElementById('rut_modal').value = rutPartes[0] || '';
        document.getElementById('dv_modal').value = rutPartes[1] || '';
        
        document.getElementById('nombre_modal').value = colaborador.nombre;
        document.getElementById('apellido_modal').value = colaborador.apellido;
        document.getElementById('correo_electronico_modal').value = colaborador.correo_electronico;
        document.getElementById('telefono_modal').value = colaborador.telefono || '';
        document.getElementById('direccion_modal').value = colaborador.direccion || '';
        document.getElementById('activo_modal').checked = colaborador.activo == 1;
        
        // Cargar regiones primero con la región actual seleccionada
        await cargarRegionesModal(colaborador.region);
        
        // Cargar ciudades si hay región seleccionada, con la ciudad actual seleccionada
        if (colaborador.region) {
            await cargarCiudadesModal(colaborador.ciudad);
        }
        
        // Mostrar el modal
        document.getElementById('modalEditarColaborador').style.display = 'flex';
        
    } catch (error) {
        console.error('Error al editar colaborador:', error);
        mostrarCardEmergente(false, 'Error al cargar datos de la colaborador');
    }
}

// Función para cerrar modal de editar colaborador
function cerrarModalEditarColaborador() {
    document.getElementById('modalEditarColaborador').style.display = 'none';
    
    // Limpiar formulario del modal
    document.getElementById('formEditarColaborador').reset();
    document.getElementById('id_colaborador_modal').value = '';
}

// Función para cargar regiones en el modal
async function cargarRegionesModal(regionActual = null) {
    const regionSelect = document.getElementById('region_modal');
    
    try {
        const response = await fetch('../backend/public/regiones_chile.php?action=regiones');
        
        const data = await response.json();
        
        if (data.success) {
            regionSelect.innerHTML = '<option value="">Seleccionar región...</option>';
            data.regiones.forEach(region => {
                const nombreRegion = region.nombre_region;
                const selected = (regionActual && nombreRegion === regionActual) ? 'selected' : '';
                regionSelect.innerHTML += `<option value="${nombreRegion}" ${selected}>${nombreRegion}</option>`;
            });
        }
    } catch (error) {
        console.error('Error al cargar regiones:', error);
    }
}
// Función para cargar ciudades en el modal
async function cargarCiudadesModal(ciudadActual = null) {
    const regionSelect = document.getElementById('region_modal');
    const ciudadSelect = document.getElementById('ciudad_modal');
    
    const regionSeleccionada = regionSelect.value;
    
    if (!regionSeleccionada) {
        ciudadSelect.innerHTML = '<option value="">Seleccionar ciudad...</option>';
        return;
    }
    
    try {
        const regionesResp = await fetch('../backend/public/regiones_chile.php?action=regiones');
        const regionesData = await regionesResp.json();
        if (!regionesData.success) return;
        const regionObj = (regionesData.regiones || []).find(r => r.nombre_region === regionSeleccionada);
        if (!regionObj) return;
        const response = await fetch(`../backend/public/regiones_chile.php?action=ciudades&id_region=${regionObj.id_region}`);
        
        const data = await response.json();
        
        if (data.success) {
            ciudadSelect.innerHTML = '<option value="">Seleccionar ciudad...</option>';
            data.ciudades.forEach(ciudad => {
                const nombreCiudad = ciudad.nombre_ciudad;
                const selected = (ciudadActual && nombreCiudad === ciudadActual) ? 'selected' : '';
                ciudadSelect.innerHTML += `<option value="${nombreCiudad}" ${selected}>${nombreCiudad}</option>`;
            });
        }
    } catch (error) {
        console.error('Error al cargar ciudades:', error);
    }
}

// Función para actualizar colaborador desde el modal
async function actualizarColaborador(event) {
    event.preventDefault();
    
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (!usuarioLogueado) {
            mostrarCardEmergente(false, 'Error: No hay sesión activa');
            return;
        }
        
        const usuario = JSON.parse(usuarioLogueado);
        const formData = new FormData(event.target);
        const idColaborador = document.getElementById('id_colaborador_modal').value;
        
        // Combinar RUT y DV
        const rut = formData.get('rut');
        const dv = formData.get('dv');
        const rutCompleto = `${rut}-${dv}`;
        
        const data = {
            action: 'actualizar_colaborador',
            id_colaborador: idColaborador,
            id_administrador: usuario.id_usuario,
            nombre_usuario: formData.get('nombre_usuario'),
            contrasena: formData.get('contrasena'),
            rut: rutCompleto,
            nombre: formData.get('nombre'),
            apellido: formData.get('apellido'),
            correo_electronico: formData.get('correo_electronico'),
            telefono: formData.get('telefono'),
            region: formData.get('region'),
            ciudad: formData.get('ciudad'),
            direccion: formData.get('direccion'),
            activo: formData.get('activo') ? '1' : '0'
        };
        
        // Agregar nueva contraseña si se proporciona
        if (formData.get('contrasena')) {
            data.nueva_contrasena = formData.get('contrasena');
        }
        
        console.log('Datos a enviar para actualizar:', data);
        console.log('ID Colaborador:', idColaborador);
        console.log('ID Administrador:', usuario.id_usuario);
        console.log('Dirección específica:', data.direccion);
        console.log('Tipo de dirección:', typeof data.direccion);
        
        const response = await fetch('/GestionDeEspacios/backend/public/gestionar_colaboradores.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarCardEmergente(true, result.message || 'Colaborador actualizada correctamente');
            cerrarModalEditarColaborador();
            cargarColaboradores(); // Recargar la lista
        } else {
            mostrarCardEmergente(false, result.message || 'Error al actualizar la colaborador');
        }
        
    } catch (error) {
        console.error('Error al actualizar colaborador:', error);
        mostrarCardEmergente(false, 'Error al actualizar la colaborador');
    }
}

// Función para eliminar colaborador
async function eliminarColaborador(idColaborador) {
    try {
        const colaborador = colaboradoresData.find(s => s.id_colaborador == idColaborador);
        if (!colaborador) {
            mostrarCardEmergente(false, 'Colaborador no encontrada');
            return;
        }
        
        // Mostrar modal de confirmación
        mostrarConfirmacionEliminacionColaborador(idColaborador, colaborador.nombre, colaborador.apellido);
    } catch (error) {
        console.error('Error al eliminar colaborador:', error);
        mostrarCardEmergente(false, 'Error al eliminar colaborador');
    }
}
// Función para mostrar modal de confirmación de eliminación de colaborador
function mostrarConfirmacionEliminacionColaborador(idColaborador, nombre, apellido) {
    const modal = `
        <div class="modal-overlay" style="z-index: 10000;">
            <div class="confirmation-modal">
                <div class="confirmation-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Confirmar Eliminación</h3>
                </div>
                <div class="confirmation-body">
                    <p>¿Estás seguro de que deseas eliminar la colaborador <strong>"${nombre} ${apellido}"</strong>?</p>
                    <p class="confirmation-warning">Esta acción no se puede deshacer.</p>
                </div>
                <div class="confirmation-actions">
                    <button class="btn-cancel" onclick="cerrarConfirmacionEliminacionColaborador()">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button class="btn-confirm-delete" onclick="confirmarEliminacionColaborador(${idColaborador})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

// Función para cerrar modal de confirmación de eliminación de colaborador
function cerrarConfirmacionEliminacionColaborador() {
    const modal = document.querySelector('.confirmation-modal');
    if (modal) {
        modal.closest('.modal-overlay').remove();
    }
}

// Función para confirmar eliminación de colaborador
async function confirmarEliminacionColaborador(idColaborador) {
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (!usuarioLogueado) {
            mostrarCardEmergente(false, 'Error: No hay sesión activa');
            cerrarConfirmacionEliminacionColaborador();
            return;
        }
        
        const usuario = JSON.parse(usuarioLogueado);
        
        const response = await fetch('/GestionDeEspacios/backend/public/gestionar_colaboradores.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=eliminar_colaborador&id_colaborador=${idColaborador}&id_administrador=${usuario.id_usuario}`
        });
        
        const result = await response.json();
        
        cerrarConfirmacionEliminacionColaborador();
        
        if (result.success) {
            mostrarCardEmergente(true, result.message);
            cargarColaboradores();
        } else {
            mostrarCardEmergente(false, result.message);
        }
    } catch (error) {
        console.error('Error al eliminar colaborador:', error);
        cerrarConfirmacionEliminacionColaborador();
        mostrarCardEmergente(false, 'Error al eliminar colaborador');
    }
}

// ==================== FUNCIONES PARA CARGAR REGIONES Y CIUDADES ====================

// Función para cargar regiones al inicializar
async function cargarRegiones() {
    try {
        const response = await fetch('../backend/public/regiones_chile.php?action=regiones');
        const data = await response.json();
        
        if (data.success) {
            const regionSelect = document.getElementById('region');
            if (regionSelect) {
                regionSelect.innerHTML = '<option value="">Seleccionar región...</option>';
                data.regiones.forEach(region => {
                    const option = document.createElement('option');
                    option.value = region.nombre_region;
                    option.textContent = region.nombre_region;
                    regionSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error al cargar regiones:', error);
    }
}

// Función para cargar ciudades cuando se seleccione una región (formulario registrar colaborador)
async function cargarCiudades() {
    const regionSelect = document.getElementById('region');
    const ciudadSelect = document.getElementById('ciudad');
    if (!regionSelect || !ciudadSelect) return;

    const regionSeleccionada = regionSelect.value;
    ciudadSelect.innerHTML = '<option value="">Seleccionar ciudad...</option>';
    if (!regionSeleccionada) {
        console.log('[Colaboradors] No hay región seleccionada aún.');
        return;
    }

    try {
        const regionesResponse = await fetch('../backend/public/regiones_chile.php?action=regiones');
        const regionesData = await regionesResponse.json();
        console.log('[Colaboradors] Regiones cargadas:', regionesData);
        if (!regionesData.success || !regionesData.regiones) {
            console.warn('[Colaboradors] No se pudieron obtener regiones.');
            return;
        }

        const selNorm = (regionSeleccionada || '').trim().toLowerCase();
        const regionObj = regionesData.regiones.find(r => (r.nombre_region || '').trim().toLowerCase() === selNorm);
        if (!regionObj) {
            console.warn('[Colaboradors] No se encontró la región seleccionada en la lista:', regionSeleccionada);
            return;
        }

        const urlCiudades = `../backend/public/regiones_chile.php?action=ciudades&id_region=${regionObj.id_region}`;
        console.log('[Colaboradors] Cargando ciudades desde:', urlCiudades, 'para id_region:', regionObj.id_region);
        const response = await fetch(urlCiudades);
        const data = await response.json();
        console.log('[Colaboradors] Ciudades respuesta:', data);
        if (data.success && Array.isArray(data.ciudades)) {
            data.ciudades.forEach(ciudad => {
                const option = document.createElement('option');
                option.value = ciudad.nombre_ciudad;
                option.textContent = ciudad.nombre_ciudad;
                ciudadSelect.appendChild(option);
            });
            console.log(`[Colaboradors] ${data.ciudades.length} ciudades cargadas para región ${regionSeleccionada}`);
        } else {
            console.warn('[Colaboradors] Respuesta de ciudades no exitosa o sin arreglo de ciudades.');
        }
    } catch (error) {
        console.error('[Colaboradors] Error al cargar ciudades:', error);
    }
}

// Función para cargar información de uso de espacios
async function cargarInformacionUsoEspacios() {
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (!usuarioLogueado) return;
        
        const usuario = JSON.parse(usuarioLogueado);
        const idAdministrador = usuario.id_usuario;
        
        // Cargar contadores
        const contadoresResponse = await fetch('/GestionDeEspacios/backend/public/contador_espacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=obtener_contadores&id_administrador=${idAdministrador}`
        });
        
        const contadoresData = await contadoresResponse.json();
        
        if (contadoresData.success) {
            const contadores = contadoresData.contadores;
            const elementosDisponibles = contadores.espacios_disponibles;
            
            document.getElementById('espaciosUsageText').textContent = 
                `Has publicado ${contadores.total_espacios} espacios. Te quedan ${elementosDisponibles} espacios disponibles.`;
            
            // Cambiar color según disponibilidad
            const headerElement = document.getElementById('espaciosUsageHeader');
            const iconElement = headerElement.querySelector('i');
            
            if (elementosDisponibles === 0) {
                // Sin espacios disponibles - Rojo
                headerElement.style.borderLeftColor = '#e74c3c';
                iconElement.style.color = '#e74c3c';
            } else {
                // Con espacios disponibles - Verde
                headerElement.style.borderLeftColor = '#27ae60';
                iconElement.style.color = '#27ae60';
            }
        }
        
    } catch (error) {
        console.error('Error al cargar información de uso de espacios:', error);
        document.getElementById('espaciosUsageText').textContent = 'Error al cargar información';
    }
}

// Función para cargar información de uso de publicaciones
async function cargarInformacionUsoPublicaciones() {
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (!usuarioLogueado) return;
        
        const usuario = JSON.parse(usuarioLogueado);
        const idAdministrador = usuario.id_usuario;
        
        // Cargar contadores
        const contadoresResponse = await fetch('/GestionDeEspacios/backend/public/contador_espacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=obtener_contadores&id_administrador=${idAdministrador}`
        });
        
        const contadoresData = await contadoresResponse.json();
        
        if (contadoresData.success) {
            const contadores = contadoresData.contadores;
            const publicacionesDisponibles = contadores.publicaciones_disponibles;
            
            document.getElementById('arriendoUsageText').textContent = 
                `Has publicado ${contadores.total_publicaciones} arriendos. Te quedan ${publicacionesDisponibles} publicaciones disponibles.`;
            
            // Cambiar color según disponibilidad
            const headerElement = document.getElementById('arriendoUsageHeader');
            if (publicacionesDisponibles === 0) {
                headerElement.style.borderLeftColor = '#e74c3c';
                headerElement.style.backgroundColor = '#fdf2f2';
            } else if (publicacionesDisponibles <= 2) {
                headerElement.style.borderLeftColor = '#f39c12';
                headerElement.style.backgroundColor = '#fef9e7';
            } else {
                headerElement.style.borderLeftColor = '#27ae60';
                headerElement.style.backgroundColor = '#f0f9f0';
            }
        }
        
    } catch (error) {
        console.error('Error al cargar información de uso de publicaciones:', error);
        document.getElementById('arriendoUsageText').textContent = 'Error al cargar información';
    }
}

// Función para cargar información de suscripción y contadores
async function cargarInformacionSuscripcion() {
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (!usuarioLogueado) return;
        
        const usuario = JSON.parse(usuarioLogueado);
        const idAdministrador = usuario.id_usuario;
        
        // Detectar si estamos en la pantalla de Suscripciones
        const suscripcionContent = document.getElementById('suscripcionContent');
        if (suscripcionContent) {
            // Cargar contenido completo de la pantalla de Suscripciones
            await cargarPantallaSuscripciones(suscripcionContent, idAdministrador);
            return;
        }
        
        // Comportamiento original para el dashboard (si existen los elementos)
        const contadoresResponse = await fetch('/GestionDeEspacios/backend/public/contador_espacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=obtener_contadores&id_administrador=${idAdministrador}`
        });
        
        const contadoresData = await contadoresResponse.json();
        
        if (contadoresData.success) {
            const contadores = contadoresData.contadores;
            
            // Actualizar información de suscripción (si existe el elemento)
            const planNameEl = document.getElementById('planName');
            if (planNameEl) planNameEl.textContent = contadores.suscripcion;
            
            // Actualizar contador de espacios
            const espaciosPorcentaje = (contadores.total_espacios / contadores.limite_espacios) * 100;
            const espaciosProgress = document.getElementById('espaciosProgress');
            const espaciosText = document.getElementById('espaciosText');
            if (espaciosProgress) espaciosProgress.style.width = `${espaciosPorcentaje}%`;
            if (espaciosText) espaciosText.textContent = `${contadores.total_espacios}/${contadores.limite_espacios}`;
            
            // Actualizar contador de publicaciones
            const publicacionesPorcentaje = (contadores.total_publicaciones / contadores.limite_publicaciones) * 100;
            const publicacionesProgress = document.getElementById('publicacionesProgress');
            const publicacionesText = document.getElementById('publicacionesText');
            if (publicacionesProgress) publicacionesProgress.style.width = `${publicacionesPorcentaje}%`;
            if (publicacionesText) publicacionesText.textContent = `${contadores.total_publicaciones}/${contadores.limite_publicaciones}`;
            
            // Cambiar color de la barra según el uso
            if (espaciosProgress) {
                if (espaciosPorcentaje >= 90) {
                    espaciosProgress.style.backgroundColor = '#e74c3c';
                } else if (espaciosPorcentaje >= 70) {
                    espaciosProgress.style.backgroundColor = '#f39c12';
                } else {
                    espaciosProgress.style.backgroundColor = '#27ae60';
                }
            }
            
            if (publicacionesProgress) {
                if (publicacionesPorcentaje >= 90) {
                    publicacionesProgress.style.backgroundColor = '#e74c3c';
                } else if (publicacionesPorcentaje >= 70) {
                    publicacionesProgress.style.backgroundColor = '#f39c12';
                } else {
                    publicacionesProgress.style.backgroundColor = '#27ae60';
                }
            }
        }
        
    } catch (error) {
        console.error('Error al cargar información de suscripción:', error);
    }
}
// Función para cargar la pantalla completa de Suscripciones
async function cargarPantallaSuscripciones(container, idAdministrador) {
    try {
        // Cargar información de la suscripción actual y planes disponibles
        const [contadoresRes, planesRes] = await Promise.all([
            fetch('/GestionDeEspacios/backend/public/contador_espacios.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `action=obtener_contadores&id_administrador=${idAdministrador}`
            }),
            fetch('../backend/public/suscripciones.php?action=listar')
        ]);
        
        const contadoresData = await contadoresRes.json();
        const planesData = await planesRes.json();
        
        const contadores = contadoresData.success ? contadoresData.contadores : null;
        const planes = planesData.success && Array.isArray(planesData.suscripciones) ? planesData.suscripciones : [];
        
        // Obtener información de la suscripción actual (fechas)
        let fechaInicio = 'N/A';
        let fechaFin = 'N/A';
        if (contadores && contadores.suscripcion) {
            try {
                const usuario = JSON.parse(sessionStorage.getItem('usuario_logueado'));
                if (usuario && usuario.id_suscripcion) {
                    const suscRes = await fetch('../backend/public/obtener_suscripcion.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id_suscripcion: usuario.id_suscripcion })
                    });
                    const suscData = await suscRes.json();
                    if (suscData.success && suscData.suscripcion) {
                        fechaInicio = suscData.suscripcion.fecha_inicio || 'N/A';
                        fechaFin = suscData.suscripcion.fecha_fin || 'N/A';
                    }
                }
            } catch (e) { console.error('Error al obtener fechas de suscripción:', e); }
        }
        
        const espaciosPorcentaje = contadores ? Math.round((contadores.total_espacios / contadores.limite_espacios) * 100) : 0;
        const publicacionesPorcentaje = contadores ? Math.round((contadores.total_publicaciones / contadores.limite_publicaciones) * 100) : 0;
        
        let espaciosColor = '#27ae60';
        if (espaciosPorcentaje >= 90) espaciosColor = '#e74c3c';
        else if (espaciosPorcentaje >= 70) espaciosColor = '#f39c12';
        
        let publicacionesColor = '#27ae60';
        if (publicacionesPorcentaje >= 90) publicacionesColor = '#e74c3c';
        else if (publicacionesPorcentaje >= 70) publicacionesColor = '#f39c12';
        
        container.innerHTML = `
            <div class="subscription-info-section">
                <div class="subscription-current-card">
                    <div class="subscription-current-header">
                        <div class="subscription-crown-icon">
                            <i class="fas fa-crown"></i>
                        </div>
                        <div>
                            <h3 class="subscription-header-title">Mi Suscripción Actual</h3>
                            <p class="subscription-header-subtitle">Plan activo y uso de recursos</p>
                        </div>
                    </div>
                    
                    <div class="subscription-info-grid">
                        <div class="subscription-info-item">
                            <div class="subscription-info-label">Plan Actual</div>
                            <div class="subscription-info-value-gold">${contadores ? contadores.suscripcion : 'Sin plan'}</div>
                        </div>
                        <div class="subscription-info-item">
                            <div class="subscription-info-label">Vigencia</div>
                            <div class="subscription-info-value">${fechaInicio} - ${fechaFin}</div>
                        </div>
                    </div>
                    
                    <div class="subscription-usage-section">
                        <div class="subscription-usage-header">
                            <div class="subscription-usage-label">
                                <i class="fas fa-building"></i>Espacios
                            </div>
                            <div class="subscription-usage-value">
                                ${contadores ? `${contadores.total_espacios}/${contadores.limite_espacios}` : '0/0'} (${espaciosPorcentaje}%)
                            </div>
                        </div>
                        <div class="subscription-progress-bar">
                            <div class="subscription-progress-fill" style="width:${espaciosPorcentaje}%;background:${espaciosColor};"></div>
                        </div>
                    </div>
                    
                    <div class="subscription-usage-section" style="margin-top: 1.5rem;">
                        <div class="subscription-usage-header">
                            <div class="subscription-usage-label">
                                <i class="fas fa-handshake"></i>Publicaciones de Arriendo
                            </div>
                            <div class="subscription-usage-value">
                                ${contadores ? `${contadores.total_publicaciones}/${contadores.limite_publicaciones}` : '0/0'} (${publicacionesPorcentaje}%)
                            </div>
                        </div>
                        <div class="subscription-progress-bar">
                            <div class="subscription-progress-fill" style="width:${publicacionesPorcentaje}%;background:${publicacionesColor};"></div>
                        </div>
                    </div>
                </div>
                
                <div class="subscription-plans-card">
                    <div class="subscription-plans-header">
                        <i class="fas fa-list subscription-plans-header-icon"></i>
                        <h3 class="subscription-plans-header-title">Planes Disponibles</h3>
                    </div>
                    
                    ${planes.length === 0 ? `
                        <div class="subscription-plans-empty">
                            <i class="fas fa-info-circle"></i>
                            <p>No hay planes disponibles en este momento.</p>
                        </div>
                    ` : `
                        <div class="subscription-plans-grid">
                            ${planes.map(plan => {
                                const esPlanActual = contadores && contadores.suscripcion && contadores.suscripcion.toLowerCase() === plan.nombre_plan.toLowerCase();
                                return `
                                    <div class="subscription-plan-card ${esPlanActual ? 'subscription-plan-card-current' : ''}">
                                        ${esPlanActual ? `<div class="subscription-plan-badge"><i class="fas fa-check-circle"></i> Plan Actual</div>` : ''}
                                        <h4 class="subscription-plan-title">${plan.nombre_plan}</h4>
                                        <div class="subscription-plan-price">
                                            $${parseFloat(plan.precio).toLocaleString('es-CL')}
                                        </div>
                                        <div class="subscription-plan-features">
                                            <i class="fas fa-building"></i>
                                            <strong>${plan.cantidad_espacios}</strong> espacios disponibles
                                        </div>
                                        ${!esPlanActual ? `
                                            <button onclick="abrirModalSeleccionPlan(${plan.id_plan}, '${plan.nombre_plan}', ${plan.precio}, ${plan.cantidad_espacios})" class="subscription-plan-btn">
                                                Seleccionar Plan
                                            </button>
                                        ` : `
                                            <button disabled class="subscription-plan-btn-disabled">
                                                Plan Actual
                                            </button>
                                        `}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error al cargar pantalla de suscripciones:', error);
        container.innerHTML = `
            <div class="subscription-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar la información de suscripción. Por favor, intenta nuevamente.</p>
            </div>
        `;
    }
}
// Función para abrir modal de selección de plan
function abrirModalSeleccionPlan(idPlan, nombrePlan, precio, cantidadEspacios) {
    const precioFmt = `$${parseFloat(precio).toLocaleString('es-CL')}`;
    const modal = `
        <div class="modal-overlay modal-seleccion-plan" onclick="cerrarModalSeleccionPlan()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3><i class="fas fa-crown"></i> Confirmar Plan</h3>
                    <button class="close-modal" onclick="cerrarModalSeleccionPlan()"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="subscription-plan-card subscription-plan-card-current subscription-plan-card-modal">
                        <h4 class="subscription-plan-title subscription-plan-title-modal">${nombrePlan}</h4>
                        <div class="subscription-plan-price">${precioFmt}</div>
                        <div class="subscription-plan-features"><i class="fas fa-building"></i> <strong>${cantidadEspacios}</strong> espacios disponibles</div>
                    </div>
                    <div class="subscription-modal-description">
                        Al realizar el pago, tu suscripción cambiará a <strong>${nombrePlan}</strong>.
                    </div>
                    <div class="subscription-modal-actions">
                        <button class="subscription-plan-btn subscription-plan-btn-cancel" onclick="cerrarModalSeleccionPlan()"><i class="fas fa-times"></i> Cancelar</button>
                        <button class="subscription-plan-btn" onclick="iniciarPagoPlan(${idPlan}, '${nombrePlan}', ${precio})"><i class="fas fa-credit-card"></i> Pagar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

// Función para cerrar modal de selección de plan
function cerrarModalSeleccionPlan() {
    const modal = document.querySelector('.modal-seleccion-plan');
    if (modal) modal.remove();
}

// Función para confirmar cambio de plan (sin pago)
async function confirmarCambioPlan(idPlan, nombrePlan) {
    try {
        await cambiarPlan(idPlan, nombrePlan);
        cerrarModalSeleccionPlan();
    } catch (e) {
        console.error('Error al confirmar cambio de plan:', e);
        mostrarCardEmergente(false, 'Error al confirmar el cambio de plan');
    }
}

// Función para iniciar proceso de pago
async function iniciarPagoPlan(idPlan, nombrePlan, precio) {
    try {
        const usuario = JSON.parse(sessionStorage.getItem('usuario_logueado'));
        if (!usuario) {
            mostrarCardEmergente(false, 'No se pudo obtener información del usuario');
            return;
        }
        
        // Cerrar modal y redirigir directamente al endpoint que genera el formulario HTML
        cerrarModalSeleccionPlan();
        
        // Crear un formulario temporal para enviar los datos
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '../backend/public/procesar_pago.php';
        form.style.display = 'none';
        
        const inputPlan = document.createElement('input');
        inputPlan.type = 'hidden';
        inputPlan.name = 'id_plan';
        inputPlan.value = idPlan;
        form.appendChild(inputPlan);
        
        const inputUsuario = document.createElement('input');
        inputUsuario.type = 'hidden';
        inputUsuario.name = 'id_usuario';
        inputUsuario.value = usuario.id_usuario;
        form.appendChild(inputUsuario);
        
        document.body.appendChild(form);
        form.submit();
    } catch (error) {
        console.error('Error al iniciar pago:', error);
        mostrarCardEmergente(false, 'Error al procesar el pago');
    }
}

// Función para cambiar de plan
async function cambiarPlan(idPlan, nombrePlan) {
    try {
        const usuario = JSON.parse(sessionStorage.getItem('usuario_logueado'));
        if (!usuario) {
            mostrarCardEmergente(false, 'No se pudo obtener información del usuario');
            return;
        }
        
        const response = await fetch('../backend/public/suscripciones.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'actualizar',
                id_administrador: usuario.id_usuario,
                id_plan: idPlan
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarCardEmergente(true, `Plan "${nombrePlan}" asignado correctamente`);
            // Recargar información de suscripción
            cargarInformacionSuscripcion();
            // Actualizar sessionStorage si es necesario
            if (usuario.id_suscripcion) {
                // Recargar información del usuario podría requerir un refresh del login
            }
        } else {
            mostrarCardEmergente(false, result.message || 'Error al cambiar el plan');
        }
    } catch (error) {
        console.error('Error al cambiar plan:', error);
        mostrarCardEmergente(false, 'Error de conexión al cambiar el plan');
    }
}

// Función para cargar calificaciones de clientes
async function cargarCalificaciones() {
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (!usuarioLogueado) return;
        
        const usuario = JSON.parse(usuarioLogueado);
        const idAdministrador = usuario.id_usuario;
        
        // Cargar estadísticas
        const statsResponse = await fetch('/GestionDeEspacios/backend/public/calificar_clientes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=obtener_estadisticas&id_administrador=${idAdministrador}`
        });
        
        const statsData = await statsResponse.json();
        
        if (statsData.success) {
            actualizarEstadisticas(statsData.estadisticas);
        }
        
        // Cargar calificaciones
        const calificacionesResponse = await fetch('/GestionDeEspacios/backend/public/calificar_clientes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=obtener_calificaciones&id_administrador=${idAdministrador}`
        });
        
        const calificacionesData = await calificacionesResponse.json();
        
        if (calificacionesData.success) {
            mostrarCalificaciones(calificacionesData.calificaciones);
        } else {
            throw new Error(calificacionesData.message || 'Error al cargar calificaciones');
        }
        
    } catch (error) {
        console.error('Error al cargar calificaciones:', error);
        document.getElementById('calificacionesList').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar las calificaciones: ${error.message}</p>
            </div>
        `;
    }
}
// Función para mostrar las calificaciones
function mostrarCalificaciones(calificaciones) {
    const container = document.getElementById('calificacionesList');
    
    if (calificaciones.length === 0) {
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
                        ${(calificacion.cliente_nombre + ' ' + calificacion.cliente_apellido).split(' ').map(n => n[0]).join('')}
                    </div>
                    <div class="cliente-details">
                        <h4>${calificacion.cliente_nombre} ${calificacion.cliente_apellido}</h4>
                        <span class="espacio">${calificacion.espacio}</span>
                    </div>
                </div>
                <div class="calificacion-rating">
                    <div class="stars">
                        ${Array(5).fill(0).map((_, i) => 
                            `<i class="fas fa-star ${i < calificacion.calificacion ? 'active' : ''}"></i>`
                        ).join('')}
                    </div>
                    <span class="rating-number">${calificacion.calificacion}/5</span>
                </div>
            </div>
            <div class="calificacion-content">
                <p class="comentario">"${calificacion.comentario}"</p>
                <div class="calificacion-meta">
                    <span class="fecha">
                        <i class="fas fa-exclamation-circle"></i>
                        ${calificacion.tipo_comportamiento || 'Sin tipo'}
                    </span>
                    <span class="fecha">
                        <i class="fas fa-thermometer-half"></i>
                        Gravedad: ${calificacion.nivel_gravedad != null ? getGravedadTexto(calificacion.nivel_gravedad) : 'N/D'}
                    </span>
                    <span class="fecha">
                        <i class="fas fa-calendar"></i>
                        ${new Date(calificacion.fecha_registro).toLocaleDateString('es-ES')}
                    </span>
                </div>
                <div class="calificacion-actions">
                    <button class="btn-edit" onclick="editarCalificacion(${calificacion.id_comportamiento})">
                        <i class="fas fa-edit"></i>
                        Editar
                    </button>
                    <button class="btn-delete" onclick="eliminarCalificacion(${calificacion.id_comportamiento})">
                        <i class="fas fa-trash"></i>
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = calificacionesHTML;
}

// Función para cargar ciudades según la región seleccionada
async function cargarCiudades() {
    const regionSelect = document.getElementById('region');
    const ciudadSelect = document.getElementById('ciudad');
    
    if (!regionSelect || !ciudadSelect) return;
    
    const regionSeleccionada = regionSelect.value;
    
    // Limpiar ciudades
    ciudadSelect.innerHTML = '<option value="">Seleccionar ciudad...</option>';
    
    if (!regionSeleccionada) return;
    
    try {
        const regionesResp = await fetch('../backend/public/regiones_chile.php?action=regiones');
        const regionesData = await regionesResp.json();
        if (!regionesData.success) return;
        const regionObj = (regionesData.regiones || []).find(r => r.nombre_region === regionSeleccionada);
        if (!regionObj) return;
        const response = await fetch(`../backend/public/regiones_chile.php?action=ciudades&id_region=${regionObj.id_region}`);
        
        const data = await response.json();
        
        if (data.success) {
            data.ciudades.forEach(ciudad => {
                const option = document.createElement('option');
                option.value = ciudad.nombre_ciudad;
                option.textContent = ciudad.nombre_ciudad;
                ciudadSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar ciudades:', error);
    }
}
// Función para actualizar estadísticas
function actualizarEstadisticas(stats) {
    // Actualizar calificación promedio
    const promedioElement = document.querySelector('.rating-number');
    if (promedioElement) {
        promedioElement.textContent = stats.promedio;
    }
    
    // Actualizar total de reseñas
    const totalElement = document.querySelector('.stat-number');
    if (totalElement) {
        totalElement.textContent = stats.total_calificaciones;
    }
    
    // Actualizar calificaciones positivas (4 y 5 estrellas)
    const positivasElement = document.querySelector('.calificaciones-stats .stat-card:last-child .stat-number');
    if (positivasElement) {
        positivasElement.textContent = stats.calificaciones_4 + stats.calificaciones_5;
    }
}

// Función para cargar clientes calificables
async function cargarClientesCalificables() {
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (!usuarioLogueado) return;
        
        const usuario = JSON.parse(usuarioLogueado);
        const idAdministrador = usuario.id_usuario;
        
        // Cargar clientes calificables
        const response = await fetch('/GestionDeEspacios/backend/public/calificar_clientes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=obtener_clientes_calificables&id_administrador=${idAdministrador}`
        });
        
        const data = await response.json();
        
        if (data.success) {
            cargarClientesEnSelect(data.clientes);
        } else {
            mostrarCardEmergente(false, data.message || 'Error al cargar clientes');
        }
        
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        mostrarCardEmergente(false, 'Error al cargar la lista de clientes');
    }
}

// Función para cargar clientes en el select
function cargarClientesEnSelect(clientes) {
    const select = document.getElementById('clienteSelect');
    select.innerHTML = '<option value="">Seleccionar cliente...</option>';
    
    clientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.id_cliente;
        option.textContent = `${cliente.nombre} ${cliente.apellido} - ${cliente.nombre_espacio}`;
        option.dataset.idAsignacion = cliente.id_asignacion;
        option.dataset.calificacionExistente = cliente.calificacion_existente || '';
        select.appendChild(option);
    });
    
    // Configurar eventos para las estrellas
    configurarEstrellas();
}

// Función para configurar eventos de las estrellas
function configurarEstrellas() {
    const stars = document.querySelectorAll('#starsInput i');
    const ratingText = document.getElementById('ratingText');
    const ratingValue = document.getElementById('calificacionValue');
    
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            const rating = index + 1;
            setRating(rating);
        });
        
        star.addEventListener('mouseenter', () => {
            highlightStars(index + 1);
        });
    });
    
    document.getElementById('starsInput').addEventListener('mouseleave', () => {
        const currentRating = parseInt(ratingValue.value) || 0;
        highlightStars(currentRating);
    });
}

// Función para establecer calificación
function setRating(rating) {
    const ratingValue = document.getElementById('calificacionValue');
    const ratingText = document.getElementById('ratingText');
    
    ratingValue.value = rating;
    highlightStars(rating);
    
    const textos = {
        1: 'Muy malo',
        2: 'Malo', 
        3: 'Regular',
        4: 'Bueno',
        5: 'Excelente'
    };
    
    ratingText.textContent = textos[rating];
}

// Función para resaltar estrellas
function highlightStars(rating) {
    const stars = document.querySelectorAll('#starsInput i');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// Función para limpiar formulario de calificación
function limpiarFormularioCalificacion() {
    document.getElementById('formCalificacion').reset();
    document.getElementById('calificacionValue').value = '';
    document.getElementById('ratingText').textContent = 'Selecciona una calificación';
    highlightStars(0);
    
    // Limpiar campos específicos
    document.getElementById('descripcionCalificacion').value = '';
    document.getElementById('tipoComportamiento').value = '';
    document.getElementById('nivelGravedad').value = '';
}

// Función para guardar calificación
async function guardarCalificacion(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        const usuario = JSON.parse(usuarioLogueado);
        
        const data = {
            action: 'guardar_calificacion',
            id_administrador: usuario.id_usuario,
            id_cliente: formData.get('id_cliente'),
            calificacion: formData.get('calificacion'),
            descripcion: formData.get('descripcion'),
            tipo_comportamiento: formData.get('tipo_comportamiento'),
            nivel_gravedad: formData.get('nivel_gravedad')
        };
        
        console.log('Datos a enviar:', data);
        
        const response = await fetch('/GestionDeEspacios/backend/public/calificar_clientes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarCardEmergente(true, result.message || 'Calificación guardada correctamente');
            limpiarFormularioCalificacion();
            cargarCalificaciones(); // Recargar la lista
        } else {
            mostrarCardEmergente(false, result.message || 'Error al guardar la calificación');
        }
        
    } catch (error) {
        console.error('Error al guardar calificación:', error);
        mostrarCardEmergente(false, 'Error al guardar la calificación');
    }
}

// Función para editar calificación
async function editarCalificacion(idCalificacion) {
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (!usuarioLogueado) return;
        
        const usuario = JSON.parse(usuarioLogueado);
        const idAdministrador = usuario.id_usuario;
        
        console.log('Editando calificación ID:', idCalificacion, 'Administrador ID:', idAdministrador);
        
        // Obtener datos de la calificación
        const response = await fetch('/GestionDeEspacios/backend/public/calificar_clientes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=obtener_calificacion_por_id&id_calificacion=${idCalificacion}&id_administrador=${idAdministrador}`
        });
        
        const data = await response.json();
        console.log('Respuesta del servidor para editar:', data);
        
        if (data.success) {
            const calificacion = data.calificacion;
            
            // Llenar el modal con los datos existentes
            document.getElementById('clienteSelectEditar').value = calificacion.id_cliente;
            document.getElementById('clienteSelectEditar').innerHTML = `<option value="${calificacion.id_cliente}">${calificacion.nombre} ${calificacion.apellido}</option>`;
            setRatingEditar(calificacion.calificacion);
            document.getElementById('descripcionCalificacionEditar').value = calificacion.comentario;
            document.getElementById('tipoComportamientoEditar').value = calificacion.tipo_comportamiento;
            document.getElementById('nivelGravedadEditar').value = calificacion.nivel_gravedad;
            
            // Configurar el ID de la calificación en el formulario
            document.getElementById('formEditarCalificacion').setAttribute('data-calificacion-id', idCalificacion);
            
            // Mostrar el modal
            document.getElementById('modalEditarCalificacion').style.display = 'flex';
            
        } else {
            mostrarCardEmergente(false, data.message || 'Error al cargar la calificación');
        }
        
    } catch (error) {
        console.error('Error al cargar calificación para editar:', error);
        mostrarCardEmergente(false, 'Error al cargar la calificación');
    }
}
// Función para eliminar calificación
async function eliminarCalificacion(idCalificacion) {
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
                    <button class="btn-cancel" onclick="cerrarModalConfirmacion()">
                        <i class="fas fa-times"></i>
                        Cancelar
                    </button>
                    <button class="btn-confirm-delete" onclick="confirmarEliminacionCalificacion(${idCalificacion})">
                        <i class="fas fa-trash"></i>
                        Eliminar
                    </button>
                </div>
            </div>
        `;
        
        // Agregar el modal al overlay existente
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) {
            overlay.innerHTML = modalHTML;
            overlay.style.display = 'flex';
        } else {
            // Crear nuevo overlay si no existe
            const newOverlay = document.createElement('div');
            newOverlay.className = 'modal-overlay';
            newOverlay.innerHTML = modalHTML;
            document.body.appendChild(newOverlay);
        }
        
    } catch (error) {
        console.error('Error al mostrar modal de confirmación:', error);
        mostrarCardEmergente(false, 'Error al mostrar la confirmación');
    }
}

// Función para cerrar modal de confirmación
function cerrarModalConfirmacion() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.innerHTML = '';
    }
}
// Función para confirmar eliminación de calificación
async function confirmarEliminacionCalificacion(idCalificacion) {
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (!usuarioLogueado) return;
        
        const usuario = JSON.parse(usuarioLogueado);
        const idAdministrador = usuario.id_usuario;
        
        const response = await fetch('/GestionDeEspacios/backend/public/calificar_clientes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=eliminar_calificacion&id_calificacion=${idCalificacion}&id_administrador=${idAdministrador}`
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarCardEmergente(true, result.message || 'Calificación eliminada correctamente');
            cerrarModalConfirmacion();
            cargarCalificaciones(); // Recargar la lista
        } else {
            mostrarCardEmergente(false, result.message || 'Error al eliminar la calificación');
            cerrarModalConfirmacion();
        }
        
    } catch (error) {
        console.error('Error al eliminar calificación:', error);
        mostrarCardEmergente(false, 'Error al eliminar la calificación');
        cerrarModalConfirmacion();
    }
}

// Función para configurar estrellas del modal de edición
function configurarEstrellasEditar() {
    const stars = document.querySelectorAll('#starsInputEditar .fa-star');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            setRatingEditar(rating);
        });
        
        star.addEventListener('mouseenter', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            highlightStarsEditar(rating);
        });
    });
    
    document.getElementById('starsInputEditar').addEventListener('mouseleave', function() {
        const currentRating = parseInt(document.getElementById('calificacionValueEditar').value) || 0;
        highlightStarsEditar(currentRating);
    });
}

// Función para establecer calificación en el modal de edición
function setRatingEditar(rating) {
    document.getElementById('calificacionValueEditar').value = rating;
    highlightStarsEditar(rating);
    
    const ratingTexts = {
        1: 'Muy malo',
        2: 'Malo', 
        3: 'Regular',
        4: 'Bueno',
        5: 'Muy bueno'
    };
    
    document.getElementById('ratingTextEditar').textContent = ratingTexts[rating] || 'Selecciona una calificación';
}

// Función para resaltar estrellas en el modal de edición
function highlightStarsEditar(rating) {
    const stars = document.querySelectorAll('#starsInputEditar .fa-star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// Función para cerrar modal de edición
function cerrarModalEditarCalificacion() {
    document.getElementById('modalEditarCalificacion').style.display = 'none';
    
    // Limpiar formulario del modal
    document.getElementById('formEditarCalificacion').reset();
    document.getElementById('calificacionValueEditar').value = '';
    document.getElementById('ratingTextEditar').textContent = 'Selecciona una calificación';
    highlightStarsEditar(0);
}

// Función para actualizar calificación desde el modal
async function actualizarCalificacion(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        const usuario = JSON.parse(usuarioLogueado);
        
        const idCalificacion = document.getElementById('formEditarCalificacion').getAttribute('data-calificacion-id');
        
        const data = {
            action: 'actualizar_calificacion',
            id_calificacion: idCalificacion,
            id_administrador: usuario.id_usuario,
            id_cliente: formData.get('id_cliente'),
            calificacion: formData.get('calificacion'),
            descripcion: formData.get('descripcion'),
            tipo_comportamiento: formData.get('tipo_comportamiento'),
            nivel_gravedad: formData.get('nivel_gravedad')
        };
        
        console.log('Datos a enviar para actualizar:', data);
        
        const response = await fetch('/GestionDeEspacios/backend/public/calificar_clientes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarCardEmergente(true, result.message || 'Calificación actualizada correctamente');
            cerrarModalEditarCalificacion();
            cargarCalificaciones(); // Recargar la lista
        } else {
            mostrarCardEmergente(false, result.message || 'Error al actualizar la calificación');
        }
        
    } catch (error) {
        console.error('Error al actualizar calificación:', error);
        mostrarCardEmergente(false, 'Error al actualizar la calificación');
    }
}

// Función para buscar calificaciones por RUT
async function buscarCalificacionesPorRUT() {
    try {
        const rutInput = document.getElementById('rutBusqueda');
        const rut = rutInput.value.trim();
        
        if (!rut) {
            mostrarCardEmergente(false, 'Por favor ingresa un RUT válido');
            return;
        }
        
        // Validar formato básico de RUT
        const rutRegex = /^[0-9]+[0-9kK]?$/;
        if (!rutRegex.test(rut.replace(/\./g, '').replace(/-/g, ''))) {
            mostrarCardEmergente(false, 'Por favor ingresa un RUT válido');
            return;
        }
        
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (!usuarioLogueado) return;
        
        const usuario = JSON.parse(usuarioLogueado);
        const idAdministrador = usuario.id_usuario;
        
        // Mostrar modal de carga
        document.getElementById('modalCalificacionesRUT').style.display = 'flex';
        
        const response = await fetch('/GestionDeEspacios/backend/public/calificar_clientes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=buscar_calificaciones_por_rut&rut=${rut}&id_administrador=${idAdministrador}`
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarCalificacionesPorRUT(result.cliente, result.calificaciones);
        } else {
            mostrarCardEmergente(false, result.message || 'No se encontraron calificaciones para este RUT');
            cerrarModalCalificacionesRUT();
        }
        
    } catch (error) {
        console.error('Error al buscar calificaciones por RUT:', error);
        mostrarCardEmergente(false, 'Error al buscar calificaciones');
        cerrarModalCalificacionesRUT();
    }
}
// Función para mostrar las calificaciones encontradas por RUT
function mostrarCalificacionesPorRUT(cliente, calificaciones) {
    const clienteInfoContainer = document.getElementById('clienteInfoRUT');
    const calificacionesContainer = document.getElementById('calificacionesRUTList');
    
    // Mostrar información del cliente
    clienteInfoContainer.innerHTML = `
        <div class="cliente-card-rut">
            <div class="cliente-avatar-rut">
                ${cliente.nombre.charAt(0)}${cliente.apellido.charAt(0)}
            </div>
            <div class="cliente-details-rut">
                <h4>${cliente.nombre} ${cliente.apellido}</h4>
                <p><strong>RUT:</strong> ${cliente.rut}</p>
                <p><strong>Email:</strong> ${cliente.email}</p>
                <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
            </div>
        </div>
    `;
    
    // Mostrar calificaciones
    if (calificaciones.length === 0) {
        calificacionesContainer.innerHTML = `
            <div class="no-data">
                <i class="fas fa-star"></i>
                <p>No hay calificaciones registradas para este cliente</p>
            </div>
        `;
        return;
    }
    
    const calificacionesHTML = calificaciones.map(calificacion => `
        <div class="calificacion-item-rut">
            <div class="calificacion-header-rut">
                <div class="espacio-info">
                    <h5>${calificacion.espacio}</h5>
                    <span class="fecha-rut">
                        <i class="fas fa-calendar"></i>
                        ${new Date(calificacion.fecha_registro).toLocaleDateString('es-ES')}
                    </span>
                    <span class="calificado-por-rut">
                        <i class="fas fa-user"></i>
                        Calificado por: ${calificacion.calificado_por}
                    </span>
                </div>
                <div class="calificacion-rating-rut">
                    <div class="stars">
                        ${Array(5).fill(0).map((_, i) => 
                            `<i class="fas fa-star ${i < calificacion.calificacion ? 'active' : ''}"></i>`
                        ).join('')}
                    </div>
                    <span class="rating-number">${calificacion.calificacion}/5</span>
                </div>
            </div>
            <div class="calificacion-content-rut">
                <p class="comentario-rut">"${calificacion.descripcion}"</p>
                <div class="calificacion-meta-rut">
                    <span class="tipo-comportamiento ${calificacion.tipo_comportamiento.toLowerCase()}">
                        <i class="fas fa-tag"></i>
                        ${calificacion.tipo_comportamiento}
                    </span>
                    <span class="nivel-gravedad">
                        <i class="fas fa-exclamation-triangle"></i>
                        Nivel: ${getGravedadTexto(calificacion.nivel_gravedad)}
                    </span>
                </div>
            </div>
        </div>
    `).join('');
    
    calificacionesContainer.innerHTML = calificacionesHTML;
}

// Función para cerrar modal de calificaciones por RUT
function cerrarModalCalificacionesRUT() {
    document.getElementById('modalCalificacionesRUT').style.display = 'none';
    document.getElementById('rutBusqueda').value = '';
}

// ===== FUNCIONES PARA GESTIONAR REPORTES =====

// Cargar reportes del administrador
async function cargarReportes() {
    const wrapper = document.getElementById('reportesList');
    if (!wrapper) return;
    
    try {
        const token = sessionStorage.getItem('token_sesion') || '';
        const url = `../backend/public/gestionar_reportes.php?token=${encodeURIComponent(token)}`;
        const resp = await fetch(url);
        const json = await resp.json();
        
        if (!json.success) {
            wrapper.innerHTML = `<div style="color:#e74c3c; padding:1rem; text-align:center;">${json.message || 'No se pudieron cargar los reportes'}</div>`;
            return;
        }
        
        const reportes = Array.isArray(json.reportes) ? json.reportes : [];
        if (!reportes.length) {
            wrapper.innerHTML = '<div style="color:#888; padding:1rem; text-align:center;">No tienes reportes pendientes.</div>';
            return;
        }
        
        wrapper.innerHTML = reportes.map(r => {
            const fecha = (r.fecha_creacion || '').replace('T',' ').substring(0,19);
            const estado = (r.estado || '').toLowerCase();
            const estadoClass = estado === 'resuelto' ? 'estado-resuelto' : (estado === 'revisado' ? 'estado-revisado' : 'estado-enviado');
            const estadoTexto = estado === 'enviado' ? 'Recibido' : (r.estado || '');
            const respondido = (r.respuesta_admin && r.respuesta_admin.trim().length) ? true : false;
            const badgeResp = respondido ? '<span class="respuesta-badge respuesta-ok">Respuesta</span>' : '<span class="respuesta-badge respuesta-none">Sin respuesta</span>';
            
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
                            // Extraer solo el contenido después de la fecha
                            const contenido = parte.replace(/\([^)]+\)/, '').trim();
                            // Limpiar cualquier separador o texto residual
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
                    <span class="estado-chip ${estadoClass}">${estadoTexto}</span>
                </div>
                <div class="reporte-card__meta">
                    <span><i class="fas fa-calendar"></i> ${fecha}</span>
                    <span><i class="fas fa-building"></i> ${r.nombre_espacio || ''}</span>
                    <span><i class="fas fa-user"></i> ${r.nombre || ''} ${r.apellido || ''}</span>
                </div>
                <div class="reporte-card__contenido">
                    <div class="reporte-card__descripcion">
                        <strong>Descripción:</strong><br>
                        ${r.contenido || ''}
                    </div>
                    <div class="reporte-card__cliente-info">
                        <strong>Cliente:</strong> ${r.nombre || ''} ${r.apellido || ''}<br>
                        <strong>Email:</strong> ${r.correo_electronico || ''}<br>
                        <strong>Teléfono:</strong> ${r.telefono || 'N/A'}<br>
                        <strong>Espacio:</strong> ${r.nombre_espacio || ''} (${r.tipo_espacio || ''})<br>
                        <strong>Ubicación:</strong> ${r.ciudad || ''}, ${r.region || ''}
                    </div>
                </div>
                <div class="reporte-card__respuesta">
                    ${badgeResp}
                    ${textoResp ? `<div class="reporte-card__respuesta-text">${textoResp}</div>` : ''}
                </div>
                <div class="reporte-card__actions">
                    <button class="btn-responder" onclick="abrirModalRespuesta(${r.id_reporte})">
                        <i class="fas fa-reply"></i> Responder
                    </button>
                </div>
            </div>`;
        }).join('');
        
        // Configurar filtro
        const filterSelect = document.getElementById('filterEstado');
        if (filterSelect) {
            filterSelect.onchange = () => filtrarReportes();
        }
        
    } catch (e) {
        console.error('Error cargando reportes', e);
        wrapper.innerHTML = '<div style="color:#e74c3c; padding:1rem; text-align:center;">Error al cargar reportes</div>';
    }
}

// Filtrar reportes por estado
function filtrarReportes() {
    const filterEstado = document.getElementById('filterEstado').value;
    const cards = document.querySelectorAll('.reporte-card');
    
    cards.forEach(card => {
        const estadoChip = card.querySelector('.estado-chip');
        const estado = estadoChip ? estadoChip.textContent.trim() : '';
        
        if (!filterEstado || estado === filterEstado) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Abrir modal para responder reporte
function abrirModalRespuesta(idReporte) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'modalRespuesta';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Responder Reporte de Incidencia</h3>
                <button class="close-modal" onclick="cerrarModalRespuesta()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="formRespuesta">
                    <div class="form-group">
                        <label>Respuesta</label>
                        <textarea id="respuestaTexto" rows="6" placeholder="Escribe tu respuesta aquí..." required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Nuevo Estado</label>
                        <select id="nuevoEstado" required>
                            <option value="Revisado">Revisado</option>
                            <option value="Resuelto">Resuelto</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="cerrarModalRespuesta()">Cancelar</button>
                        <button type="submit" class="btn-primary">Enviar Respuesta</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('formRespuesta').addEventListener('submit', async (e) => {
        e.preventDefault();
        await enviarRespuesta(idReporte);
    });
}

// Enviar respuesta del reporte
async function enviarRespuesta(idReporte) {
    try {
        const respuesta = document.getElementById('respuestaTexto').value.trim();
        const nuevoEstado = document.getElementById('nuevoEstado').value;
        
        if (!respuesta) {
            mostrarCardEmergente(false, 'La respuesta no puede estar vacía');
            return;
        }
        
        const token = sessionStorage.getItem('token_sesion') || '';
        const data = {
            token: token,
            id_reporte: idReporte,
            accion: 'responder',
            respuesta: respuesta,
            nuevo_estado: nuevoEstado
        };
        
        const resp = await fetch('../backend/public/gestionar_reportes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const json = await resp.json();
        
        if (json.success) {
            mostrarCardEmergente(true, json.message);
            cerrarModalRespuesta();
            cargarReportes();
        } else {
            mostrarCardEmergente(false, json.message);
        }
        
    } catch (e) {
        console.error('Error enviando respuesta', e);
        mostrarCardEmergente(false, 'Error del servidor');
    }
}


// Cerrar modal de respuesta
function cerrarModalRespuesta() {
    const modal = document.getElementById('modalRespuesta');
    if (modal) {
        modal.remove();
    }
}
// ===== FUNCIONES PARA GESTIONAR SOLICITUDES DE CAMBIO DE HORARIO =====
// Cargar solicitudes de cambio de horario
async function cargarSolicitudesHorario() {
    const wrapper = document.getElementById('solicitudesList');
    if (!wrapper) return;
    
    try {
        const token = sessionStorage.getItem('token_sesion') || '';
        const url = `../backend/public/gestionar_solicitudes_horario.php?token=${encodeURIComponent(token)}`;
        const resp = await fetch(url);
        const json = await resp.json();
        
        if (!json.success) {
            wrapper.innerHTML = `<div style="color:#e74c3c; padding:1rem; text-align:center;">${json.message || 'No se pudieron cargar las solicitudes'}</div>`;
            return;
        }
        
        const solicitudes = Array.isArray(json.solicitudes) ? json.solicitudes : [];
        if (!solicitudes.length) {
            wrapper.innerHTML = '<div style="color:#888; padding:1rem; text-align:center;">No tienes solicitudes de cambio de horario.</div>';
            return;
        }
        
        wrapper.innerHTML = solicitudes.map(s => {
            const fechaSolicitud = (s.fecha_solicitud || '').replace('T',' ').substring(0,19);
            const estado = (s.estado_admin || 'Pendiente').toLowerCase();
            const estadoClass = estado === 'aprobado' ? 'estado-resuelto' : (estado === 'rechazado' ? 'estado-revisado' : 'estado-enviado');
            const respondido = (s.respuesta_admin && s.respuesta_admin.trim().length) ? true : false;
            const badgeResp = respondido ? '<span class="respuesta-badge respuesta-ok">Respuesta</span>' : '<span class="respuesta-badge respuesta-none">Sin respuesta</span>';
            const textoResp = respondido ? `<div class="respuesta-text">${s.respuesta_admin.replace(/\n/g, '<br>')}<br><small>${(s.fecha_respuesta_admin||'').replace('T',' ').substring(0,19)}</small></div>` : '';
            
            let fechaActualTxt = 'Sin horario actual';
            if (s.actual_fecha_inicio && s.actual_fecha_termino) {
                fechaActualTxt = `${s.actual_fecha_inicio} a ${s.actual_fecha_termino}`;
            }
            
            return `
            <div class="reporte-card">
                <div class="reporte-card__header">
                    <div class="reporte-card__title">Solicitud de Cambio de Horario</div>
                    <span class="estado-chip ${estadoClass}">${s.estado_admin || 'Pendiente'}</span>
                </div>
                <div class="reporte-card__meta">
                    <span><i class="fas fa-calendar"></i> ${fechaSolicitud}</span>
                    <span><i class="fas fa-building"></i> ${s.nombre_espacio || ''}</span>
                    <span><i class="fas fa-user"></i> ${s.nombre || ''} ${s.apellido || ''}</span>
                </div>
                <div class="reporte-card__contenido">
                    <div class="reporte-card__descripcion">
                        <strong>Motivo de la solicitud:</strong><br>
                        ${s.motivo || ''}
                    </div>
                    <div class="reporte-card__cliente-info">
                        <strong>Cliente:</strong> ${s.nombre || ''} ${s.apellido || ''}<br>
                        <strong>Email:</strong> ${s.correo_electronico || ''}<br>
                        <strong>Teléfono:</strong> ${s.telefono || 'N/A'}<br>
                        <strong>Espacio:</strong> ${s.nombre_espacio || ''} (${s.tipo_espacio || ''})<br>
                        <strong>Ubicación:</strong> ${s.ciudad || ''}, ${s.region || ''}<br>
                        <strong>Fecha actual:</strong> ${fechaActualTxt}<br>
                        <strong>Nueva fecha solicitada:</strong> ${s.fecha_solicitada || ''}
                    </div>
                </div>
                <div class="reporte-card__respuesta">
                    ${badgeResp}
                    ${textoResp ? `<div class="reporte-card__respuesta-text">${textoResp}</div>` : ''}
                </div>
                <div class="reporte-card__actions">
                    ${s.estado_admin === 'Pendiente' ? `
                        <button class="btn-aprobar" onclick="abrirModalAprobarSolicitud(${s.id_solicitud})">
                            <i class="fas fa-check"></i> Aprobar
                        </button>
                        <button class="btn-rechazar" onclick="abrirModalRechazarSolicitud(${s.id_solicitud})">
                            <i class="fas fa-times"></i> Rechazar
                        </button>
                    ` : ''}
                </div>
            </div>`;
        }).join('');
        
        // Configurar filtro
        const filterSelect = document.getElementById('filterEstadoSolicitud');
        if (filterSelect) {
            filterSelect.onchange = () => filtrarSolicitudes();
        }
        
    } catch (e) {
        console.error('Error cargando solicitudes', e);
        wrapper.innerHTML = '<div style="color:#e74c3c; padding:1rem; text-align:center;">Error al cargar solicitudes</div>';
    }
}
// Filtrar solicitudes por estado
function filtrarSolicitudes() {
    const filterEstado = document.getElementById('filterEstadoSolicitud').value;
    const cards = document.querySelectorAll('.reporte-card');
    
    cards.forEach(card => {
        const estadoChip = card.querySelector('.estado-chip');
        const estado = estadoChip ? estadoChip.textContent.trim() : '';
        
        if (!filterEstado || estado === filterEstado) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Abrir modal para aprobar solicitud
function abrirModalAprobarSolicitud(idSolicitud) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'modalAprobarSolicitud';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Aprobar Solicitud de Cambio de Horario</h3>
                <button class="close-modal" onclick="cerrarModalAprobarSolicitud()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="formAprobarSolicitud">
                    <div class="form-group">
                        <label>Respuesta de aprobación</label>
                        <textarea id="respuestaAprobacion" rows="4" placeholder="Escribe tu respuesta de aprobación..." required></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="cerrarModalAprobarSolicitud()">Cancelar</button>
                        <button type="submit" class="btn-primary">Aprobar Solicitud</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('formAprobarSolicitud').addEventListener('submit', async (e) => {
        e.preventDefault();
        await aprobarSolicitud(idSolicitud);
    });
}
// Abrir modal para rechazar solicitud
function abrirModalRechazarSolicitud(idSolicitud) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'modalRechazarSolicitud';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Rechazar Solicitud de Cambio de Horario</h3>
                <button class="close-modal" onclick="cerrarModalRechazarSolicitud()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="formRechazarSolicitud">
                    <div class="form-group">
                        <label>Motivo del rechazo</label>
                        <textarea id="respuestaRechazo" rows="4" placeholder="Explica el motivo del rechazo..." required></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="cerrarModalRechazarSolicitud()">Cancelar</button>
                        <button type="submit" class="btn-primary">Rechazar Solicitud</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('formRechazarSolicitud').addEventListener('submit', async (e) => {
        e.preventDefault();
        await rechazarSolicitud(idSolicitud);
    });
}

// Aprobar solicitud
async function aprobarSolicitud(idSolicitud) {
    const submitBtn = document.querySelector('#formAprobarSolicitud button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        const respuesta = document.getElementById('respuestaAprobacion').value.trim();
        
        if (!respuesta) {
            mostrarCardEmergente(false, 'La respuesta no puede estar vacía');
            return;
        }
        
        // Mostrar estado de carga
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        
        const token = sessionStorage.getItem('token_sesion') || '';
        const data = {
            token: token,
            id_solicitud: idSolicitud,
            accion: 'aprobar',
            respuesta: respuesta
        };
        
        const resp = await fetch('../backend/public/gestionar_solicitudes_horario.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const json = await resp.json();
        
        if (json.success) {
            mostrarCardEmergente(true, json.message);
            cerrarModalAprobarSolicitud();
            cargarSolicitudesHorario();
        } else {
            mostrarCardEmergente(false, json.message);
        }
        
    } catch (e) {
        console.error('Error aprobando solicitud', e);
        mostrarCardEmergente(false, 'Error del servidor');
    } finally {
        // Restaurar botón
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
    }
}

// Rechazar solicitud
async function rechazarSolicitud(idSolicitud) {
    const submitBtn = document.querySelector('#formRechazarSolicitud button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        const respuesta = document.getElementById('respuestaRechazo').value.trim();
        
        if (!respuesta) {
            mostrarCardEmergente(false, 'El motivo del rechazo no puede estar vacío');
            return;
        }
        
        // Mostrar estado de carga
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        
        const token = sessionStorage.getItem('token_sesion') || '';
        const data = {
            token: token,
            id_solicitud: idSolicitud,
            accion: 'rechazar',
            respuesta: respuesta
        };
        
        const resp = await fetch('../backend/public/gestionar_solicitudes_horario.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const json = await resp.json();
        
        if (json.success) {
            mostrarCardEmergente(true, json.message);
            cerrarModalRechazarSolicitud();
            cargarSolicitudesHorario();
        } else {
            mostrarCardEmergente(false, json.message);
        }
        
    } catch (e) {
        console.error('Error rechazando solicitud', e);
        mostrarCardEmergente(false, 'Error del servidor');
    } finally {
        // Restaurar botón
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
    }
}


// Cerrar modales
function cerrarModalAprobarSolicitud() {
    const modal = document.getElementById('modalAprobarSolicitud');
    if (modal) modal.remove();
}

function cerrarModalRechazarSolicitud() {
    const modal = document.getElementById('modalRechazarSolicitud');
    if (modal) modal.remove();
}

// Función para convertir número de gravedad a texto
function getGravedadTexto(nivel) {
    if (nivel == null || nivel === '') return 'N/D';
    
    const gravedadMap = {
        '1': 'Muy Bueno',
        '2': 'Bueno', 
        '3': 'Regular',
        '4': 'Malo',
        '5': 'Muy Malo'
    };
    
    return gravedadMap[nivel.toString()] || 'N/D';
}
// ==================== GENERADOR DE REPORTES (ADMIN) ====================
let datosReporteActual = [];

async function inicializarGeneradorReportes() {
	try {
		await cargarRegionesParaReportes();
		const selRegion = document.getElementById('reporteRegion');
		if (selRegion) selRegion.onchange = actualizarCiudadesParaReportes;
	} catch {}

	const btnGenerar = document.getElementById('btnGenerarReporte');
	const btnExportar = document.getElementById('btnExportarPDF');
	if (btnGenerar) btnGenerar.onclick = generarReporte;
	if (btnExportar) btnExportar.onclick = exportarPDFReporte;

	// Reglas de validación de fechas: Hasta >= Desde
	const inputDesde = document.getElementById('reporteDesde');
	const inputHasta = document.getElementById('reporteHasta');
	if (inputDesde && inputHasta) {
		inputDesde.addEventListener('change', function() {
			if (this.value) {
				inputHasta.min = this.value;
				if (inputHasta.value && inputHasta.value < this.value) {
					inputHasta.value = this.value;
				}
			} else {
				inputHasta.removeAttribute('min');
			}
		});
		inputHasta.addEventListener('change', function() {
			if (inputDesde.value && this.value && this.value < inputDesde.value) {
				this.value = inputDesde.value;
			}
		});
	}
}

async function cargarRegionesParaReportes() {
	const regionSel = document.getElementById('reporteRegion');
	if (!regionSel) return;
	try {
		const resp = await fetch('../backend/public/regiones_chile.php?action=regiones');
		const json = await resp.json();
		if (json.success && Array.isArray(json.regiones)) {
			json.regiones.forEach(r => {
				const opt = document.createElement('option');
				opt.value = r.nombre_region;
				opt.textContent = r.nombre_region;
				regionSel.appendChild(opt);
			});
		}
	} catch {}
}

async function actualizarCiudadesParaReportes() {
	const regionSel = document.getElementById('reporteRegion');
	const ciudadSel = document.getElementById('reporteCiudad');
	if (!regionSel || !ciudadSel) return;
	ciudadSel.innerHTML = '<option value="">Todas</option>';
	const nombreRegion = regionSel.value;
	if (!nombreRegion) return;
	try {
		const regResp = await fetch('../backend/public/regiones_chile.php?action=regiones');
		const regJson = await regResp.json();
		const region = (regJson.regiones||[]).find(r => r.nombre_region === nombreRegion);
		if (!region) return;
		const resp = await fetch(`../backend/public/regiones_chile.php?action=ciudades&id_region=${region.id_region}`);
		const json = await resp.json();
		if (json.success) {
			json.ciudades.forEach(c => {
				const opt = document.createElement('option');
				opt.value = c.nombre_ciudad;
				opt.textContent = c.nombre_ciudad;
				ciudadSel.appendChild(opt);
			});
		}
	} catch {}
}

function leerFiltrosReporte() {
	return {
		tipo: (document.getElementById('reporteTipo')||{}).value || 'asignaciones',
		desde: (document.getElementById('reporteDesde')||{}).value || '',
		hasta: (document.getElementById('reporteHasta')||{}).value || '',
		region: (document.getElementById('reporteRegion')||{}).value || '',
		ciudad: (document.getElementById('reporteCiudad')||{}).value || ''
	};
}

async function generarReporte() {
	const filtros = leerFiltrosReporte();
    // Validar rango de fechas
    if (filtros.desde && filtros.hasta && filtros.hasta < filtros.desde) {
        mostrarCardEmergente(false, 'La fecha "Hasta" no puede ser inferior a "Desde"');
        return;
    }
const contCard = document.getElementById('reporteResultsCard');
const cont = document.getElementById('reporteResultado');
if (cont) cont.innerHTML = '<div style="color:#888;padding:1rem;"><i class="fas fa-spinner fa-spin"></i> Generando...</div>';
if (contCard) contCard.style.display = '';
	try {
		let data = [];
		switch (filtros.tipo) {
			case 'asignaciones':
				data = await reporteAsignaciones(filtros);
				break;
			case 'historial_asignaciones':
				data = await reporteHistorialAsignaciones(filtros);
				break;
			case 'publicaciones':
				data = await reportePublicaciones(filtros);
				break;
			case 'colaboradores':
				data = await reporteColaboradores(filtros);
				break;
			case 'calificaciones':
				data = await reporteCalificaciones(filtros);
				break;
			case 'reportes':
				data = await reporteReportes(filtros);
				break;
			case 'solicitudes':
				data = await reporteSolicitudes(filtros);
				break;
			case 'pagos':
				data = await reportePagos(filtros);
				break;
		}
		datosReporteActual = data;
		renderTablaReporte(data);
	} catch (e) {
		if (cont) cont.innerHTML = '<div style="color:#e74c3c;padding:1rem;">Error al generar el reporte</div>';
	}
}

function renderTablaReporte(rows) {
    const cont = document.getElementById('reporteResultado');
    const card = document.getElementById('reporteResultsCard');
    const resumen = document.getElementById('reporteResumen');
    if (!cont) return;
    if (!rows || !rows.length) {
        cont.innerHTML = '<div style="color:#888;padding:1rem;">Sin resultados para los filtros seleccionados.</div>';
        if (resumen) resumen.textContent = '';
        if (card) card.style.display = '';
        return;
    }
	const cols = Object.keys(rows[0]);
    let html = '<div style="overflow:auto;"><table class="reports-table">';
    html += '<thead><tr>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr></thead>';
    html += '<tbody>' + rows.map(r => '<tr>' + cols.map(c => `<td>${safe(r[c])}</td>`).join('') + '</tr>').join('') + '</tbody>';
	html += '</table></div>';
	cont.innerHTML = html;
    if (resumen) resumen.textContent = `Filas: ${rows.length}`;
    if (card) card.style.display = '';
}

function safe(v) {
	if (v == null) return '';
	if (typeof v === 'object') return JSON.stringify(v);
	return String(v);
}
async function exportarPDFReporte() {
    if (!datosReporteActual || !datosReporteActual.length) {
        mostrarCardEmergente(false, 'No hay datos para exportar');
        return;
    }
    // Cargar jsPDF y autotable si no existen
    await cargarScriptSiNoExiste('jspdf', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    await cargarScriptSiNoExiste('jspdf-autotable', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js');

    const { jsPDF } = window.jspdf || {};
    if (!jsPDF || !window.jspdf || !window.jspdf.jsPDF) {
        mostrarCardEmergente(false, 'No se pudo cargar el generador de PDF');
        return;
    }

    const cols = Object.keys(datosReporteActual[0]);
    const rows = datosReporteActual.map(r => cols.map(c => safe(r[c])));

    const doc = new jsPDF('p', 'pt');
    const ahora = new Date();
    const tipoSel = (document.getElementById('reporteTipo')||{});
    const tipoTexto = (tipoSel.options||[])[tipoSel.selectedIndex||0]?.text || 'Reporte';
    const titulo = 'Informe';
    const subtitulo = tipoTexto;
    const filtros = leerFiltrosReporte();

    // Encabezado estilizado
    doc.setTextColor(26, 42, 62); // #1A2A3E
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(titulo, 40, 48);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text(subtitulo, 40, 70);

    // Línea divisoria
    doc.setDrawColor(230, 234, 240); // #E6EAF0
    doc.line(40, 80, 555, 80);

    // Metadatos en dos columnas
    doc.setFontSize(10);
    doc.setTextColor(90, 99, 110);
    const metaY1 = 100;
    const metaY2 = 116;
    const label = (t, x, y) => { doc.setFont('helvetica','bold'); doc.text(t, x, y); doc.setFont('helvetica','normal'); };
    const val = (t, x, y) => { doc.text(t, x, y); };

    label('Generado:', 40, metaY1); val(ahora.toLocaleString(), 110, metaY1);
    label('Desde:', 40, metaY2);     val(filtros.desde || '-', 85, metaY2);
    label('Hasta:', 200, metaY2);    val(filtros.hasta || '-', 245, metaY2);
    label('Región:', 360, metaY2);   val(filtros.region || 'Todas', 410, metaY2);
    label('Ciudad:', 480, metaY2);   val(filtros.ciudad || 'Todas', 532, metaY2);

    if (doc.autoTable) {
            doc.autoTable({
                head: [cols],
                body: rows,
                startY: 140,
                styles: { fontSize: 9, cellPadding: 6, textColor: [44, 62, 80] },
                headStyles: { fillColor: [26, 42, 62], halign: 'left', textColor: [255, 255, 255] },
                margin: { left: 40, right: 40 }
            });
    } else {
        // Fallback simple si no cargó autotable
        let y = 150;
        doc.setFontSize(8);
        // Encabezados
        doc.text(cols.join(' | '), 40, y);
        y += 14;
        rows.forEach(r => {
            doc.text(String(r.join(' | ')).slice(0,1000), 40, y);
            y += 12;
            if (y > 760) { doc.addPage(); y = 40; }
        });
    }

    const nombre = `informe_${slugifyNombre(tipoTexto)}.pdf`;
    doc.save(nombre);
}

function cargarScriptSiNoExiste(key, src) {
    return new Promise(resolve => {
        if (key === 'jspdf' && window.jspdf && window.jspdf.jsPDF) return resolve();
        if (key === 'jspdf-autotable' && window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API && window.jspdf.jsPDF.API.autoTable) return resolve();
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => setTimeout(resolve, 50);
        s.onerror = () => resolve();
        document.head.appendChild(s);
    });
}

function slugifyNombre(texto) {
    try {
        return String(texto || 'reporte')
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar acentos
            .replace(/[^a-z0-9\s-_]/g, '')
            .replace(/\s+/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '');
    } catch {
        return 'reporte';
    }
}

function csvCell(val) {
	if (val == null) return '';
	let s = typeof val === 'object' ? JSON.stringify(val) : String(val);
	s = s.replace(/"/g, '""');
	if (s.search(/([,\n"])/g) >= 0) {
		return '"' + s + '"';
	}
	return s;
}

// ----- Constructores de datos por tipo -----
async function reporteEspacios(f) {
	const usuario = JSON.parse(sessionStorage.getItem('usuario_logueado')||'{}');
	const resp = await fetch('../backend/public/asignarespacio.php', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: `action=obtener_espacios_completos&id_administrador=${usuario.id_usuario||''}`
	});
	const json = await resp.json();
	const arr = json.success ? (json.espacios||[]) : [];
	return arr
		.filter(e => (!f.region || (e.nombre_region||'')===f.region) && (!f.ciudad || (e.nombre_ciudad||'')===f.ciudad))
		.map(e => ({
			id_espacio: e.id_espacio,
			nombre_espacio: e.nombre_espacio,
			tipo_espacio: e.tipo_espacio,
			metros_cuadrados: e.metros_cuadrados,
			region: e.nombre_region,
			ciudad: e.nombre_ciudad,
			direccion: e.direccion,
			disponibilidad: e.estado_disponibilidad || (e.disponible===1?'Disponible': e.disponible===2?'Sin Horarios':'No Disponible'),
			asignado: e.esta_asignado ? 'Sí' : 'No'
		}));
}

async function reporteAsignaciones(f) {
    // Cargar espacios con detalle y derivar asignaciones actuales
    const usuario = JSON.parse(sessionStorage.getItem('usuario_logueado')||'{}');
    const resp = await fetch('../backend/public/asignarespacio.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `action=obtener_espacios_completos&id_administrador=${usuario.id_usuario||''}`
    });
    const json = await resp.json();
    const arr = json.success ? (json.espacios||[]) : [];
    // Intentar leer campos de fechas de asignación más comunes
    const rows = arr
        .filter(e => e.esta_asignado)
        .filter(e => (!f.region || (e.nombre_region||'')===f.region) && (!f.ciudad || (e.nombre_ciudad||'')===f.ciudad))
        .map(e => {
            const fc = e.fecha_creacion_asignacion || e.fecha_creacion || e.asignacion_fecha_creacion || '';
            return {
                'Nombre del espacio': e.nombre_espacio,
                'Tipo de espacio': e.tipo_espacio,
                'Región': e.nombre_region,
                'Ciudad': e.nombre_ciudad,
                'Dirección': e.direccion,
                'Fecha creación': fc
            };
        });
    // Filtrar por rango de fechas si corresponde (usamos fecha de creación como referencia)
    if (f.desde || f.hasta) {
        const desde = f.desde ? new Date(f.desde) : null;
        const hasta = f.hasta ? new Date(f.hasta) : null;
        return rows.filter(r => {
            const valor = r['Fecha creación'];
            if (!valor) return false;
            const d = new Date(String(valor).substring(0,10));
            if (desde && d < desde) return false;
            if (hasta && d > hasta) return false;
            return true;
        });
    }
    return rows;
}

async function reporteHistorialAsignaciones(f) {
    const usuario = JSON.parse(sessionStorage.getItem('usuario_logueado')||'{}');
    const resp = await fetch('../backend/public/asignarespacio.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `action=obtener_espacios_completos&id_administrador=${usuario.id_usuario||''}`
    });
    const json = await resp.json();
    const espacios = json.success ? (json.espacios||[]) : [];
    // Aplanar todos los clientes asignados (histórico si viene del backend)
    let rows = [];
    espacios
        .filter(e => (!f.region || (e.nombre_region||'')===f.region) && (!f.ciudad || (e.nombre_ciudad||'')===f.ciudad))
        .forEach(e => {
            const lista = Array.isArray(e.clientes_asignados) ? e.clientes_asignados : [];
            lista.forEach(c => {
                const hi = c.horario_asignado || {};
                const fi = hi.fecha_inicio || c.fecha_inicio_asignacion || '';
                const ff = hi.fecha_termino || c.fecha_termino_asignacion || '';
                rows.push({
                    'Nombre del espacio': e.nombre_espacio,
                    'Tipo de espacio': e.tipo_espacio,
                    'Cliente': `${c.nombre||''} ${c.apellido||''}`.trim(),
                    'RUT': c.rut || '',
                    'Teléfono': c.telefono || '',
                    'Región': e.nombre_region || '',
                    'Ciudad': e.nombre_ciudad || '',
                    'Fecha inicio': fi,
                    'Fecha término': ff
                });
            });
        });
    if (f && (f.desde || f.hasta)) {
        const desde = f.desde ? new Date(f.desde) : null;
        const hasta = f.hasta ? new Date(f.hasta) : null;
        rows = rows.filter(r => {
            const valor = r['Fecha inicio'];
            if (!valor) return false;
            const d = new Date(String(valor).substring(0,10));
            if (desde && d < desde) return false;
            if (hasta && d > hasta) return false;
            return true;
        });
    }
    return rows;
}

async function reportePublicaciones(f) {
    const token = sessionStorage.getItem('token_sesion')||'';
    const resp = await fetch(`/GestionDeEspacios/backend/public/gestionar_arriendo.php?action=obtener_publicaciones&token=${encodeURIComponent(token)}`);
    const json = await resp.json();
    const pubs = json.success ? (json.publicaciones||[]) : [];
    const rows = pubs
        .filter(p => (!f.region || (p.region||'')===f.region) && (!f.ciudad || (p.ciudad||'')===f.ciudad))
        .map(p => {
            const fc = p.fecha_creacion || p.fecha_publicacion || p.created_at || '';
            return {
                'Título': p.titulo,
                'Tipo de espacio': p.tipo_espacio,
                'Metros cuadrados': p.metros_cuadrados,
                'Región': p.region,
                'Ciudad': p.ciudad,
                'Dirección': p.direccion,
                'Precio arriendo': p.precio_arriendo,
                'Fecha creación': fc
            };
        });
    if (f.desde || f.hasta) {
        const desde = f.desde ? new Date(f.desde) : null;
        const hasta = f.hasta ? new Date(f.hasta) : null;
        return rows.filter(r => {
            const valor = r['Fecha creación'];
            if (!valor) return false;
            const d = new Date(String(valor).substring(0,10));
            if (desde && d < desde) return false;
            if (hasta && d > hasta) return false;
            return true;
        });
    }
    return rows;
}
async function reporteColaboradores(f) {
	const usuario = JSON.parse(sessionStorage.getItem('usuario_logueado')||'{}');
	const resp = await fetch('/GestionDeEspacios/backend/public/gestionar_colaboradores.php', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: `action=obtener_colaboradores&id_administrador=${usuario.id_usuario||''}`
	});
	const json = await resp.json();
	const cols = json.success ? (json.colaboradores||[]) : [];
    const rows = cols.map(c => {
        const fc = c.fecha_creacion || c.created_at || '';
        return {
            'Nombre': `${c.nombre} ${c.apellido}`,
            'RUT': c.rut,
            'Correo': c.correo_electronico,
            'Usuario': c.nombre_usuario,
            'Teléfono': c.telefono || '',
            'Región': c.region || '',
            'Ciudad': c.ciudad || '',
            'Fecha creación': fc
        };
    });
    if (f && (f.desde || f.hasta)) {
        const desde = f.desde ? new Date(f.desde) : null;
        const hasta = f.hasta ? new Date(f.hasta) : null;
        return rows.filter(r => {
            const valor = r['Fecha creación'];
            if (!valor) return false;
            const d = new Date(String(valor).substring(0,10));
            if (desde && d < desde) return false;
            if (hasta && d > hasta) return false;
            return true;
        });
    }
    return rows;
}
async function reporteCalificaciones(f) {
	const usuario = JSON.parse(sessionStorage.getItem('usuario_logueado')||'{}');
	const resp = await fetch('/GestionDeEspacios/backend/public/calificar_clientes.php', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: `action=obtener_calificaciones&id_administrador=${usuario.id_usuario||''}`
	});
	const json = await resp.json();
	const arr = json.success ? (json.calificaciones||[]) : [];
    const rows = arr.map(c => {
        const fc = c.fecha_registro || c.fecha_creacion || '';
        return {
            'Cliente': `${c.cliente_nombre} ${c.cliente_apellido}`,
            'Espacio': c.espacio,
            'Calificación': c.calificacion,
            'Tipo': c.tipo_comportamiento || '',
            'Gravedad': (typeof getGravedadTexto==='function') ? getGravedadTexto(c.nivel_gravedad) : (c.nivel_gravedad||''),
            'Fecha creación': fc
        };
    });
    if (f && (f.desde || f.hasta)) {
        const desde = f.desde ? new Date(f.desde) : null;
        const hasta = f.hasta ? new Date(f.hasta) : null;
        return rows.filter(r => {
            const valor = r['Fecha creación'];
            if (!valor) return false;
            const d = new Date(String(valor).substring(0,10));
            if (desde && d < desde) return false;
            if (hasta && d > hasta) return false;
            return true;
        });
    }
    return rows;
}

async function reporteReportes(f) {
    const token = sessionStorage.getItem('token_sesion')||'';
    const resp = await fetch(`../backend/public/gestionar_reportes.php?token=${encodeURIComponent(token)}`);
    const json = await resp.json();
    const arr = json.success ? (json.reportes||[]) : [];
    const rows = arr.map(r => ({
        'Estado': r.estado,
        'Fecha creación': r.fecha_creacion,
        'Título': r.titulo,
        'Contenido': r.contenido || '',
        'Nombre del espacio': r.nombre_espacio,
        'Cliente': `${r.nombre||''} ${r.apellido||''}`.trim(),
        'Región': r.region||'',
        'Ciudad': r.ciudad||''
    }));
    if (f && (f.desde || f.hasta)) {
        const desde = f.desde ? new Date(f.desde) : null;
        const hasta = f.hasta ? new Date(f.hasta) : null;
        return rows.filter(r => {
            const valor = r['Fecha creación'];
            if (!valor) return false;
            const d = new Date(String(valor).substring(0,10));
            if (desde && d < desde) return false;
            if (hasta && d > hasta) return false;
            return true;
        });
    }
    return rows;
}

async function reporteSolicitudes(f) {
    const token = sessionStorage.getItem('token_sesion')||'';
    const resp = await fetch(`../backend/public/gestionar_solicitudes_horario.php?token=${encodeURIComponent(token)}`);
    const json = await resp.json();
    const arr = json.success ? (json.solicitudes||[]) : [];
    const rows = arr.map(s => ({
        'Estado': s.estado_admin || 'Pendiente',
        'Fecha creación': s.fecha_solicitud,
        'Nombre del espacio': s.nombre_espacio || '',
        'Motivo': s.motivo || '',
        'Cliente': `${s.nombre||''} ${s.apellido||''}`.trim(),
        'Región': s.region || '',
        'Ciudad': s.ciudad || ''
    }));
    if (f && (f.desde || f.hasta)) {
        const desde = f.desde ? new Date(f.desde) : null;
        const hasta = f.hasta ? new Date(f.hasta) : null;
        return rows.filter(r => {
            const valor = r['Fecha creación'];
            if (!valor) return false;
            const d = new Date(String(valor).substring(0,10));
            if (desde && d < desde) return false;
            if (hasta && d > hasta) return false;
            return true;
        });
    }
    return rows;
}

async function reportePagos(f) {
    const usuario = JSON.parse(sessionStorage.getItem('usuario_logueado')||'{}');
    const resp = await fetch(`/GestionDeEspacios/backend/public/gestionar_pagos.php?action=obtener_pagos&id_administrador=${usuario.id_usuario||''}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const json = await resp.json();
    let arr = json.success ? (json.pagos||[]) : [];
    
    // Filtrar por fechas si hay filtros
    if (f && (f.desde || f.hasta)) {
        const desde = f.desde ? new Date(f.desde) : null;
        const hasta = f.hasta ? new Date(f.hasta) : null;
        arr = arr.filter(p => {
            const fecha = p.fecha_pago || '';
            if (!fecha) return false;
            const d = new Date(fecha.substring(0,10));
            if (desde && d < desde) return false;
            if (hasta && d > hasta) return false;
            return true;
        });
    }
    
    const rows = arr.map(p => {
        // Formatear fecha
        const fecha = p.fecha_pago || '';
        const fechaFormateada = fecha ? new Date(fecha).toLocaleDateString('es-ES') : '';
        
        // Formatear monto
        const monto = parseFloat(p.monto_total || 0);
        const montoFormateado = monto.toLocaleString('es-CL', { 
            style: 'currency', 
            currency: 'CLP' 
        });
        
        // Formatear estado
        const estados = {
            'completado': 'Completado',
            'pendiente': 'Pendiente',
            'fallido': 'Fallido',
            'reembolsado': 'Reembolsado'
        };
        const estadoFormateado = estados[p.estado] || p.estado;
        
        return {
            'ID Pago': p.id_pago,
            'Plan': p.nombre_plan || 'N/A',
            'Método de Pago': p.metodo_pago || 'N/A',
            'Monto Total': montoFormateado,
            'Cuotas': p.cantidad_cuotas || 1,
            'Estado': estadoFormateado,
            'Fecha Pago': fechaFormateada,
            'Transacción ID': p.transaccion_id || 'N/A'
        };
    });
    
    return rows;
}

// ==================== FUNCIONES PARA MENSAJES ====================

// Función para obtener o crear token
function obtenerToken() {
    // Intentar obtener token de diferentes fuentes
    let token = sessionStorage.getItem('token');
    if (!token) {
        token = sessionStorage.getItem('token_sesion');
    }
    if (!token) {
        token = sessionStorage.getItem('auth_token');
    }
    if (!token) {
        token = sessionStorage.getItem('session_token');
    }
    
    // Si no hay token, intentar obtenerlo del usuario logueado
    if (!token) {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (usuarioLogueado) {
            try {
                const usuario = JSON.parse(usuarioLogueado);
                if (usuario.token) {
                    token = usuario.token;
                    sessionStorage.setItem('token', token);
                }
            } catch (e) {
                console.error('Error al parsear usuario logueado:', e);
            }
        }
    }
    
    return token;
}

// Función para configurar los eventos de los mensajes
function configurarMensajes() {
    // Event listeners para los radio buttons
    const radioButtons = document.querySelectorAll('input[name="messageType"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                cargarMensajes(this.value);
            }
        });
    });

    // Event listener para el botón de actualizar
    const refreshBtn = document.getElementById('refreshMessages');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            const selectedType = document.querySelector('input[name="messageType"]:checked').value;
            cargarMensajes(selectedType);
        });
    }

    // Event listener para marcar todos como leídos
    const markAllReadBtn = document.getElementById('markAllRead');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', function() {
            const selectedType = document.querySelector('input[name="messageType"]:checked').value;
            marcarTodosComoLeidos(selectedType);
        });
    }
}
// Función para cargar mensajes según el tipo
async function cargarMensajes(tipo) {
    const messagesList = document.getElementById('messagesList');
    if (!messagesList) return;

    // Mostrar loading
    messagesList.innerHTML = `
        <div class="loading-messages">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Cargando mensajes...</p>
        </div>
    `;

    try {
        // Obtener token usando la función mejorada
        const token = obtenerToken();
        
        // Debug: mostrar información del sessionStorage
        console.log('SessionStorage keys:', Object.keys(sessionStorage));
        console.log('Token encontrado:', token);
        console.log('Usuario logueado:', sessionStorage.getItem('usuario_logueado'));
        
        if (!token) {
            console.error('No se encontró token en sessionStorage');
            console.log('Contenido completo del sessionStorage:', sessionStorage);
            mostrarMensajesVacios(tipo);
            return;
        }
        
        // Obtener el tipo de usuario del sessionStorage y capitalizarlo
        const tipoUsuario = sessionStorage.getItem('tipo_usuario') || 'administrador';
        const rolCapitalizado = tipoUsuario.charAt(0).toUpperCase() + tipoUsuario.slice(1).toLowerCase();
        
        const response = await fetch(`/GestionDeEspacios/backend/public/mensajes.php?tipo=${tipo}&rol=${rolCapitalizado}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Auth-Token': token
            }
        });

        const data = await response.json();

        if (data.success) {
            if (tipo === 'asignacion') {
                // Debug: mostrar información en consola
                console.log('Debug info:', data.debug);
                console.log('Clientes encontrados:', data.clientes);
                console.log('Token usado:', token);
                
                mostrarClientesAsignados(data.clientes);
        } else {
            if (tipo === 'consulta') {
                mostrarMensajesConsulta(data.mensajes);
            } else {
                mostrarMensajes(data.mensajes, tipo);
            }
        }
        } else {
            console.error('Error en la respuesta:', data);
            if (tipo === 'asignacion') {
                mostrarClientesVacios();
            } else {
                mostrarMensajesVacios(tipo);
            }
        }
    } catch (error) {
        console.error('Error al cargar mensajes:', error);
        mostrarMensajesVacios(tipo);
    }
}

// Función para mostrar los mensajes en la interfaz
function mostrarMensajes(mensajes, tipo) {
    const messagesList = document.getElementById('messagesList');
    
    if (!mensajes || mensajes.length === 0) {
        mostrarMensajesVacios(tipo);
        return;
    }

    const tipoTexto = tipo === 'asignacion' ? 'Asignación' : 'Consulta';
    
    messagesList.innerHTML = `
        <div class="messages-header">
            <h3>Mensajes de ${tipoTexto}</h3>
            <span class="message-count">${mensajes.length} mensaje(s)</span>
        </div>
        <div class="messages-grid">
            ${mensajes.map(mensaje => crearCardMensaje(mensaje, tipo)).join('')}
        </div>
    `;
}

// Función para crear una card de mensaje
function crearCardMensaje(mensaje, tipo) {
    const fecha = new Date(mensaje.fecha_envio);
    const fechaFormateada = fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const icono = tipo === 'asignacion' ? 'fas fa-building' : 'fas fa-question-circle';
    const claseNoLeido = mensaje.leido ? '' : 'unread';
    
    return `
        <div class="message-card ${claseNoLeido}" data-id="${mensaje.id_mensaje}">
            <div class="message-header">
                <div class="message-icon">
                    <i class="${icono}"></i>
                </div>
                <div class="message-info">
                    <h4>${mensaje.nombre_emisor}</h4>
                    <span class="message-time">${fechaFormateada}</span>
                </div>
                <div class="message-actions">
                    ${!mensaje.leido ? '<span class="unread-badge">Nuevo</span>' : ''}
                    <button class="mark-read-btn" onclick="marcarComoLeido(${mensaje.id_mensaje}, '${tipo}')" title="Marcar como leído">
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            </div>
            <div class="message-content">
                <p>${mensaje.mensaje}</p>
            </div>
            <div class="message-footer">
                <span class="message-type">${tipo === 'asignacion' ? 'Asignación' : 'Consulta'}</span>
                ${mensaje.nombre_espacio ? `<span class="space-name">${mensaje.nombre_espacio}</span>` : ''}
            </div>
        </div>
    `;
}

// Función para mostrar mensajes vacíos
function mostrarMensajesVacios(tipo) {
    const messagesList = document.getElementById('messagesList');
    const tipoTexto = tipo === 'asignacion' ? 'Asignación' : 'Consulta';
    
    messagesList.innerHTML = `
        <div class="empty-messages">
            <div class="empty-icon">
                <i class="fas fa-inbox"></i>
            </div>
            <h3>No hay mensajes de ${tipoTexto}</h3>
            <p>No tienes mensajes de ${tipoTexto.toLowerCase()} en este momento.</p>
        </div>
    `;
}

// Función para mostrar clientes asignados
function mostrarClientesAsignados(clientes) {
    const messagesList = document.getElementById('messagesList');
    
    if (!clientes || clientes.length === 0) {
        mostrarClientesVacios();
        return;
    }
    
    messagesList.innerHTML = `
        <div class="chat-container">
            <div class="chat-sidebar">
                <div class="chat-header">
                    <h3>Clientes Asignados</h3>
                    <span class="client-count">${clientes.length} cliente(s)</span>
                </div>
                <div class="clients-list">
                    ${clientes.map(cliente => crearClienteChat(cliente)).join('')}
                </div>
            </div>
            <div class="chat-main">
                <div class="chat-placeholder">
                    <div class="placeholder-icon">
                        <i class="fas fa-comments"></i>
                    </div>
                    <h3>Selecciona un cliente</h3>
                    <p>Elige un cliente de la lista para comenzar la conversación</p>
                </div>
            </div>
        </div>
    `;
}

// Función para crear un elemento de cliente en el chat
function crearClienteChat(cliente) {
    return `
        <div class="client-chat-item" data-id="${cliente.id_cliente}" onclick="seleccionarClienteMensajes(${cliente.id_cliente}, '${cliente.nombre_cliente}')">
            <div class="client-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="client-info">
                <h4>${cliente.nombre_cliente}</h4>
                <p class="client-space">${cliente.espacios_asignados}</p>
            </div>
            <div class="client-status">
                <div class="status-dot online"></div>
            </div>
        </div>
    `;
}

// Función para crear una card de cliente (mantener para compatibilidad)
function crearCardCliente(cliente) {
    return `
        <div class="client-card" data-id="${cliente.id_cliente}">
            <div class="client-header">
                <div class="client-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="client-info">
                    <h4>${cliente.nombre_cliente}</h4>
                    <p class="client-email">${cliente.telefono || 'Sin teléfono'}</p>
                    <p class="client-location">${cliente.nombre_region || ''} ${cliente.nombre_ciudad || ''}</p>
                </div>
                <div class="client-actions">
                    <button class="send-message-btn" onclick="abrirModalEnviarMensaje(${cliente.id_cliente}, '${cliente.nombre_cliente}')">
                        <i class="fas fa-paper-plane"></i>
                        Enviar Mensaje
                    </button>
                </div>
            </div>
            <div class="client-details">
                <div class="client-spaces">
                    <h5>Espacios Asignados (${cliente.total_espacios}):</h5>
                    <div class="spaces-list">
                        <div class="space-item">
                            <i class="fas fa-building"></i>
                            <span>${cliente.espacios_asignados}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Función para mostrar mensajes de consulta con estilo de chat
function mostrarMensajesConsulta(mensajes) {
    console.log('=== MOSTRAR MENSAJES CONSULTA ===');
    console.log('Mensajes recibidos:', mensajes);
    console.log('Cantidad de mensajes:', mensajes ? mensajes.length : 0);
    
    const messagesList = document.getElementById('messagesList');
    
    if (!mensajes || mensajes.length === 0) {
        console.log('No hay mensajes, mostrando estado vacío');
        mostrarMensajesConsultaVacios();
        return;
    }
    
    // Agrupar mensajes por cliente
    console.log('Agrupando mensajes por cliente...');
    const mensajesAgrupados = agruparMensajesPorCliente(mensajes);
    console.log('Mensajes agrupados:', mensajesAgrupados);
    console.log('Cantidad de grupos:', Object.keys(mensajesAgrupados).length);
    
    messagesList.innerHTML = `
        <div class="chat-container">
            <div class="chat-sidebar">
                <div class="chat-header">
                    <h3>Consultas por Cliente</h3>
                    <span class="client-count">${Object.keys(mensajesAgrupados).length} cliente(s)</span>
                </div>
                <div class="clients-list">
                    ${Object.keys(mensajesAgrupados).map(clave => 
                        crearClienteConsultaChat(mensajesAgrupados[clave])
                    ).join('')}
                </div>
            </div>
            <div class="chat-main">
                <div class="chat-placeholder">
                    <div class="placeholder-icon">
                        <i class="fas fa-user-tie"></i>
                    </div>
                    <h3>Selecciona una consulta</h3>
                    <p>Elige una publicación de la lista para ver las consultas</p>
                </div>
            </div>
        </div>
    `;
}

// Función para agrupar mensajes por cliente (para consultas)
function agruparMensajesPorCliente(mensajes) {
    const agrupados = {};
    
    // Obtener el ID del usuario logueado correctamente
    const usuarioLogueado = JSON.parse(sessionStorage.getItem('usuario_logueado') || '{}');
    const idUsuarioLogueado = parseInt(usuarioLogueado.id_usuario || 0);
    
    console.log('=== DEBUG AGRUPACIÓN MENSAJES CONSULTA ===');
    console.log('Usuario logueado completo:', usuarioLogueado);
    console.log('ID Usuario Logueado:', idUsuarioLogueado);
    console.log('Total mensajes recibidos:', mensajes.length);
    console.log('Mensajes:', mensajes);
    
    mensajes.forEach((mensaje, index) => {
        console.log(`--- Mensaje ${index + 1} ---`);
        console.log('ID Emisor:', mensaje.id_emisor);
        console.log('ID Receptor:', mensaje.id_receptor);
        console.log('Nombre Emisor:', mensaje.nombre_emisor);
        console.log('Nombre Receptor:', mensaje.nombre_receptor);
        
        // Determinar quién es el cliente (el que NO es el usuario logueado)
        const clienteId = mensaje.id_emisor === idUsuarioLogueado ? mensaje.id_receptor : mensaje.id_emisor;
        const clave = `${clienteId}_${mensaje.id_publicacion}`; // Cliente + Publicación
        
        console.log('Cliente ID calculado:', clienteId);
        console.log('Clave de agrupación:', clave);
        console.log('¿Es diferente al usuario logueado?', clienteId !== idUsuarioLogueado);
        
        // Solo procesar si hay un cliente diferente al usuario logueado
        if (clienteId !== idUsuarioLogueado) {
            if (!agrupados[clave]) {
                agrupados[clave] = {
                    cliente: {
                        id: clienteId,
                        nombre: mensaje.id_emisor === idUsuarioLogueado ? mensaje.nombre_receptor : mensaje.nombre_emisor,
                        publicacion_id: mensaje.id_publicacion,
                        publicacion_titulo: mensaje.nombre_publicacion || 'Sin título',
                        ultimo_mensaje: mensaje.mensaje,
                        fecha_ultimo: mensaje.fecha_envio
                    },
                    mensajes: []
                };
                console.log('Nuevo grupo creado para:', agrupados[clave].cliente.nombre);
            }
            agrupados[clave].mensajes.push(mensaje);
            console.log('Mensaje agregado al grupo');
        } else {
            console.log('Mensaje ignorado (es del usuario logueado)');
        }
    });
    
    console.log('Grupos finales:', Object.keys(agrupados));
    console.log('=== FIN DEBUG ===');
    
    return agrupados;
}

// Función para agrupar mensajes por publicación
function agruparMensajesPorPublicacion(mensajes) {
    const agrupados = {};
    
    mensajes.forEach(mensaje => {
        const publicacionId = mensaje.id_publicacion || 'sin_publicacion';
        if (!agrupados[publicacionId]) {
            agrupados[publicacionId] = {
                publicacion: {
                    id: mensaje.id_publicacion,
                    titulo: mensaje.nombre_publicacion || 'Sin título',
                    ultimo_mensaje: mensaje.mensaje,
                    fecha_ultimo: mensaje.fecha_envio
                },
                mensajes: []
            };
        }
        agrupados[publicacionId].mensajes.push(mensaje);
    });
    
    return agrupados;
}

// Función para crear elemento de cliente en el chat de consultas
function crearClienteConsultaChat(grupoMensajes) {
    const cliente = grupoMensajes.cliente;
    const fecha = new Date(cliente.fecha_ultimo);
    const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    return `
        <div class="client-chat-item" data-id="${cliente.id}" data-publicacion="${cliente.publicacion_id}" onclick="seleccionarClienteConsulta(${cliente.id}, ${cliente.publicacion_id}, '${cliente.nombre}')">
            <div class="client-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="client-info">
                <h4>${cliente.nombre}</h4>
                <p class="client-space">${cliente.publicacion_titulo}</p>
            </div>
            <div class="client-status">
                <span class="message-time">${hora}</span>
            </div>
        </div>
    `;
}

// Función para crear elemento de publicación en el chat
function crearPublicacionChat(grupoMensajes) {
    const publicacion = grupoMensajes.publicacion;
    const fecha = new Date(publicacion.fecha_ultimo);
    const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    // Obtener el nombre del usuario que envió el último mensaje
    const ultimoMensaje = grupoMensajes.mensajes[grupoMensajes.mensajes.length - 1];
    const nombreUsuario = ultimoMensaje ? ultimoMensaje.nombre_emisor : 'Usuario';
    
    return `
        <div class="client-chat-item" data-id="${publicacion.id}" onclick="seleccionarPublicacion(${publicacion.id}, '${publicacion.titulo}')">
            <div class="client-avatar">
                <i class="fas fa-user-tie"></i>
            </div>
            <div class="client-info">
                <h4>${nombreUsuario}</h4>
                <p class="client-space">${publicacion.ultimo_mensaje}</p>
            </div>
            <div class="client-status">
                <span class="message-time">${hora}</span>
            </div>
        </div>
    `;
}

// Función para seleccionar un cliente en consultas
function seleccionarClienteConsulta(idCliente, idPublicacion, nombreCliente) {
    // Remover selección anterior
    document.querySelectorAll('.client-chat-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Marcar como activo
    const selectedItem = document.querySelector(`[data-id="${idCliente}"][data-publicacion="${idPublicacion}"]`);
    if (selectedItem) {
        selectedItem.classList.add('active');
    }
    
    // Cargar chat de la consulta
    cargarChatConsulta(idCliente, idPublicacion, nombreCliente);
}
// Función para cargar chat de una consulta específica
async function cargarChatConsulta(idCliente, idPublicacion, nombreCliente) {
    try {
        const token = obtenerToken();
        if (!token) {
            throw new Error('No se encontró token de sesión');
        }
        
        // Obtener el tipo de usuario del sessionStorage y capitalizarlo
        const tipoUsuario = sessionStorage.getItem('tipo_usuario') || 'administrador';
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
            mostrarChatConsulta(idCliente, idPublicacion, nombreCliente, data.mensajes || []);
        } else {
            throw new Error(data.message || 'Error al cargar mensajes');
        }
        
    } catch (error) {
        console.error('Error cargando chat de consulta:', error);
        mostrarCardEmergente(false, 'Error al cargar la conversación');
    }
}
// Función para mostrar el chat de una consulta
function mostrarChatConsulta(idCliente, idPublicacion, nombreCliente, mensajes) {
    const chatMain = document.querySelector('.chat-main');
    
    // Filtrar solo mensajes de esta consulta específica
    const mensajesConsulta = mensajes.filter(mensaje => 
        mensaje.id_publicacion == idPublicacion && 
        (mensaje.id_emisor == idCliente || mensaje.id_receptor == idCliente)
    );
    
    chatMain.innerHTML = `
        <div class="chat-header">
            <div class="chat-user-info">
                <div class="user-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="user-details">
                    <h3>${nombreCliente}</h3>
                    <span class="user-status">Consulta</span>
                </div>
            </div>
            <div class="chat-actions">
                <button class="chat-action-btn" onclick="eliminarConversacionConsulta(${idPublicacion}, ${idCliente}, '${nombreCliente}')" title="Eliminar conversación">
                    <i class="fas fa-trash" style="color: #e74c3c;"></i>
                </button>
            </div>
        </div>
        <div class="chat-messages" id="chatMessages">
            ${mensajesConsulta.length > 0 ? mensajesConsulta.map(mensaje => crearMensajeChat(mensaje)).join('') : `
                <div class="no-messages">
                    <i class="fas fa-comment-slash"></i>
                    <p>No hay mensajes aún</p>
                    <p>Los mensajes de esta consulta aparecerán aquí</p>
                </div>
            `}
        </div>
        <div class="chat-input">
            <div class="input-group">
                <input type="text" id="mensajeInput" placeholder="Escribe tu respuesta..." onkeypress="enviarRespuestaEnter(event, ${idPublicacion}, ${idCliente})">
                <button class="send-btn" onclick="enviarRespuestaConsulta(${idPublicacion}, ${idCliente})">
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

// Función para seleccionar una publicación
function seleccionarPublicacion(idPublicacion, tituloPublicacion) {
    // Remover selección anterior
    document.querySelectorAll('.client-chat-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Marcar como seleccionado
    const publicacionItem = document.querySelector(`[data-id="${idPublicacion}"]`);
    if (publicacionItem) {
        publicacionItem.classList.add('selected');
    }
    
    // Cargar chat de la publicación
    cargarChatPublicacion(idPublicacion, tituloPublicacion);
}

// Función para cargar el chat de una publicación
async function cargarChatPublicacion(idPublicacion, tituloPublicacion) {
    const chatMain = document.querySelector('.chat-main');
    
    // Mostrar loading
    chatMain.innerHTML = `
        <div class="chat-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Cargando consultas...</p>
        </div>
    `;
    
    try {
        // Obtener token
        const token = obtenerToken();
        if (!token) {
            throw new Error('No se encontró token');
        }
        
        // Obtener el tipo de usuario del sessionStorage y capitalizarlo
        const tipoUsuario = sessionStorage.getItem('tipo_usuario') || 'administrador';
        const rolCapitalizado = tipoUsuario.charAt(0).toUpperCase() + tipoUsuario.slice(1).toLowerCase();
        
        // Cargar mensajes de la publicación
        const response = await fetch(`/GestionDeEspacios/backend/public/mensajes.php?tipo=consulta&publicacion=${idPublicacion}&rol=${rolCapitalizado}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Auth-Token': token
            }
        });
        
        const data = await response.json();
        
        console.log('Debug consulta response:', data);
        
        if (data.success) {
            console.log('Mensajes de consulta cargados:', data.mensajes);
            mostrarChatPublicacion(idPublicacion, tituloPublicacion, data.mensajes || []);
        } else {
            console.error('Error al cargar consultas:', data);
            mostrarChatPublicacion(idPublicacion, tituloPublicacion, []);
        }
    } catch (error) {
        console.error('Error al cargar chat de consulta:', error);
        mostrarChatPublicacion(idPublicacion, tituloPublicacion, []);
    }
}

// Función para mostrar el chat de una publicación
function mostrarChatPublicacion(idPublicacion, tituloPublicacion, mensajes) {
    const chatMain = document.querySelector('.chat-main');
    
    // Obtener el nombre del usuario que envió el primer mensaje (el que hizo la consulta)
    const primerMensaje = mensajes.find(mensaje => mensaje.id_emisor != parseInt(sessionStorage.getItem('usuario_logueado')?.id_usuario || 0));
    const nombreUsuario = primerMensaje ? primerMensaje.nombre_emisor : 'Usuario';
    const idCliente = primerMensaje ? primerMensaje.id_emisor : 0;
    
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
                <button class="chat-action-btn" onclick="eliminarConversacionConsulta(${idPublicacion}, ${idCliente}, '${tituloPublicacion}')" title="Eliminar conversación">
                    <i class="fas fa-trash" style="color: #e74c3c;"></i>
                </button>
            </div>
        </div>
        <div class="chat-messages" id="chatMessages">
            ${mensajes.length > 0 ? mensajes.map(mensaje => crearMensajeChat(mensaje)).join('') : `
                <div class="no-messages">
                    <i class="fas fa-comment-slash"></i>
                    <p>No hay consultas aún</p>
                    <p>Las consultas sobre esta publicación aparecerán aquí</p>
                </div>
            `}
        </div>
        <div class="chat-input">
            <div class="input-group">
                <input type="text" id="mensajeInput" placeholder="Escribe tu respuesta..." onkeypress="enviarRespuestaEnter(event, ${idPublicacion}, ${idCliente})">
                <button class="send-btn" onclick="enviarRespuestaConsulta(${idPublicacion}, ${idCliente})">
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
// Función para mostrar consultas vacías
function mostrarMensajesConsultaVacios() {
    const messagesList = document.getElementById('messagesList');
    
    messagesList.innerHTML = `
        <div class="empty-messages">
            <div class="empty-icon">
                <i class="fas fa-user-tie"></i>
            </div>
            <h3>No hay consultas</h3>
            <p>No tienes consultas sobre publicaciones en este momento.</p>
        </div>
    `;
}
// Función para eliminar conversación de consulta
function eliminarConversacionConsulta(idPublicacion, idCliente, tituloPublicacion) {
    mostrarConfirmacionEliminacionConversacionConsulta(idPublicacion, idCliente, tituloPublicacion);
}

// Función para mostrar confirmación de eliminación de conversación de consulta
function mostrarConfirmacionEliminacionConversacionConsulta(idPublicacion, idCliente, tituloPublicacion) {
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
                    <button class="btn-cancel" onclick="cerrarConfirmacionEliminacionConversacionConsulta()">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button class="btn-confirm-delete" onclick="confirmarEliminacionConversacionConsulta(${idPublicacion}, ${idCliente}, '${tituloPublicacion}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

// Función para cerrar confirmación de eliminación de conversación de consulta
function cerrarConfirmacionEliminacionConversacionConsulta() {
    const modal = document.querySelector('.confirmation-overlay');
    if (modal) {
        modal.remove();
    }
}

// Función para confirmar eliminación de conversación de consulta
async function confirmarEliminacionConversacionConsulta(idPublicacion, idCliente, tituloPublicacion) {
    try {
        const token = obtenerToken();
        if (!token) {
            console.error('No se encontró token en sessionStorage');
            mostrarCardEmergente(false, 'Sesión no válida');
            return;
        }
        
        const response = await fetch('/GestionDeEspacios/backend/public/mensajes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Auth-Token': token
            },
            body: JSON.stringify({
                action: 'eliminar_conversacion_consulta',
                id_publicacion: idPublicacion,
                id_cliente: idCliente,
                tipo: 'consulta'
            })
        });
        
        const data = await response.json();
        
        // Cerrar el modal de confirmación
        cerrarConfirmacionEliminacionConversacionConsulta();
        
        if (data.success) {
            mostrarCardEmergente(true, 'Conversación eliminada correctamente');
            // Recargar la lista de consultas
            cargarMensajes('consulta');
        } else {
            mostrarCardEmergente(false, data.message || 'Error al eliminar conversación');
        }
    } catch (error) {
        console.error('Error al eliminar conversación:', error);
        cerrarConfirmacionEliminacionConversacionConsulta();
        mostrarCardEmergente(false, 'Error del servidor');
    }
}

// Función para responder consulta
function responderConsulta(idPublicacion, tituloPublicacion) {
    // Implementar modal para responder consulta
    console.log('Responder consulta:', idPublicacion, tituloPublicacion);
}

// Función para enviar respuesta con Enter
function enviarRespuestaEnter(event, idPublicacion, idCliente) {
    if (event.key === 'Enter') {
        enviarRespuestaConsulta(idPublicacion, idCliente);
    }
}

// Función para enviar respuesta de consulta
async function enviarRespuestaConsulta(idPublicacion, idCliente) {
    const input = document.getElementById('mensajeInput');
    const mensaje = input.value.trim();
    
    if (!mensaje) return;
    
    // Limpiar input
    input.value = '';
    
    try {
        const token = obtenerToken();
        if (!token) {
            throw new Error('No se encontró token');
        }
        
        const response = await fetch('/GestionDeEspacios/backend/public/mensajes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Auth-Token': token
            },
            body: JSON.stringify({
                action: 'responder_consulta',
                id_publicacion: idPublicacion,
                id_cliente: idCliente,
                mensaje: mensaje
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Obtener el nombre del cliente del chat actual
            const chatHeader = document.querySelector('.chat-header .user-details h3');
            const nombreCliente = chatHeader ? chatHeader.textContent : 'Cliente';
            
            // Recargar chat de consulta específico
            cargarChatConsulta(idCliente, idPublicacion, nombreCliente);
            
            // Mantener la selección visual
            seleccionarClienteConsulta(idCliente, idPublicacion, nombreCliente);
        } else {
            mostrarCardEmergente(false, data.message || 'Error al enviar respuesta');
        }
    } catch (error) {
        console.error('Error al enviar respuesta:', error);
        mostrarCardEmergente(false, 'Error del servidor');
    }
}

// Función para mostrar clientes vacíos
function mostrarClientesVacios() {
    const messagesList = document.getElementById('messagesList');
    
    messagesList.innerHTML = `
        <div class="empty-messages">
            <div class="empty-icon">
                <i class="fas fa-users"></i>
            </div>
            <h3>No hay clientes asignados</h3>
            <p>No tienes clientes asignados a espacios en este momento.</p>
        </div>
    `;
}

// Función para seleccionar un cliente en mensajes de asignación
function seleccionarClienteMensajes(idCliente, nombreCliente) {
    // Remover selección anterior
    document.querySelectorAll('.client-chat-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Marcar como seleccionado
    const clienteItem = document.querySelector(`[data-id="${idCliente}"]`);
    if (clienteItem) {
        clienteItem.classList.add('selected');
    }
    
    // Cargar chat del cliente
    cargarChatCliente(idCliente, nombreCliente);
}

// Función para cargar el chat de un cliente
async function cargarChatCliente(idCliente, nombreCliente) {
    const chatMain = document.querySelector('.chat-main');
    
    // Mostrar loading
    chatMain.innerHTML = `
        <div class="chat-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Cargando conversación...</p>
        </div>
    `;
    
    try {
        // Obtener token
        const token = obtenerToken();
        if (!token) {
            throw new Error('No se encontró token');
        }
        
        // Cargar mensajes del cliente
        const response = await fetch(`/GestionDeEspacios/backend/public/mensajes.php?tipo=asignacion&cliente=${idCliente}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Auth-Token': token
            }
        });
        
        const data = await response.json();
        
        console.log('Debug chat response:', data);
        
        if (data.success) {
            console.log('Mensajes cargados:', data.mensajes);
            mostrarChatCliente(idCliente, nombreCliente, data.mensajes || []);
        } else {
            console.error('Error al cargar mensajes:', data);
            mostrarChatCliente(idCliente, nombreCliente, []);
        }
    } catch (error) {
        console.error('Error al cargar chat:', error);
        mostrarChatCliente(idCliente, nombreCliente, []);
    }
}

// Función para mostrar el chat del cliente
function mostrarChatCliente(idCliente, nombreCliente, mensajes) {
    const chatMain = document.querySelector('.chat-main');
    
    chatMain.innerHTML = `
        <div class="chat-header">
            <div class="chat-user-info">
                <div class="user-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="user-details">
                    <h3>${nombreCliente}</h3>
                    <span class="user-status">En línea</span>
                </div>
            </div>
            <div class="chat-actions">
                <button class="chat-action-btn" onclick="eliminarConversacion(${idCliente}, '${nombreCliente}')" title="Eliminar conversación">
                    <i class="fas fa-trash" style="color: #e74c3c;"></i>
                </button>
            </div>
        </div>
        <div class="chat-messages" id="chatMessages">
            ${mensajes.length > 0 ? mensajes.map(mensaje => crearMensajeChat(mensaje)).join('') : `
                <div class="no-messages">
                    <i class="fas fa-comment-slash"></i>
                    <p>No hay mensajes aún</p>
                    <p>Envía el primer mensaje a ${nombreCliente}</p>
                </div>
            `}
        </div>
        <div class="chat-input">
            <div class="input-group">
                <input type="text" id="mensajeInput" placeholder="Escribe un mensaje..." onkeypress="enviarMensajeEnter(event, ${idCliente})">
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
// Función para ver detalles de un espacio (administrador)
function verDetallesEspacioAdmin(idEspacio) {
    // Navegar a la sección de "Publicar Arriendo" en la página del administrador
    if (window.location.pathname.includes('administrador.html')) {
        // Si ya estamos en la página del administrador, cambiar a la sección de publicar arriendo
        try {
            // Buscar el elemento del menú de publicar arriendo
            const menuItems = document.querySelectorAll('.menu-item');
            for (let item of menuItems) {
                if (item.textContent.includes('Publicar Arriendo')) {
                    setActiveMenu(item);
                    break;
                }
            }
            
            // Hacer scroll a la sección de "Mis Publicaciones de Arriendo"
            setTimeout(() => {
                const arriendosSection = document.querySelector('.arriendos-sistema-section');
                if (arriendosSection) {
                    arriendosSection.scrollIntoView({ behavior: 'smooth' });
                    
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
                    }, 500);
                } else {
                    // Si no encuentra la sección, hacer scroll al top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, 200);
        } catch (error) {
            console.error('Error al navegar a publicar arriendo:', error);
            // Fallback: hacer scroll al top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } else {
        // Si no estamos en la página del administrador, redirigir con hash para el espacio específico
        window.location.href = `administrador.html#espacio-${idEspacio}`;
    }
}

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
                        <div class="space-card-mini" onclick="verDetallesEspacioAdmin(${mensaje.id_publicacion})" style="cursor: pointer;">
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
    
    // Limpiar input
    input.value = '';
    
    try {
        const token = obtenerToken();
        if (!token) {
            throw new Error('No se encontró token');
        }
        
        const response = await fetch('/GestionDeEspacios/backend/public/mensajes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Auth-Token': token
            },
            body: JSON.stringify({
                action: 'enviar_mensaje_cliente',
                id_cliente: idCliente,
                mensaje: mensaje
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Recargar chat
            const clienteItem = document.querySelector('.client-chat-item.selected');
            if (clienteItem) {
                const nombreCliente = clienteItem.querySelector('h4').textContent;
                cargarChatCliente(idCliente, nombreCliente);
            }
        } else {
            mostrarCardEmergente(false, data.message || 'Error al enviar mensaje');
        }
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        mostrarCardEmergente(false, 'Error del servidor');
    }
}

// Función para abrir modal de enviar mensaje
function abrirModalEnviarMensaje(idCliente, nombreCliente) {
    const modal = `
        <div class="modal-overlay" id="modalEnviarMensaje">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Enviar Mensaje a ${nombreCliente}</h3>
                    <button class="close-modal" onclick="cerrarModalEnviarMensaje()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="formEnviarMensaje">
                        <div class="form-group">
                            <label for="mensajeTexto">Mensaje:</label>
                            <textarea id="mensajeTexto" name="mensaje" rows="5" placeholder="Escribe tu mensaje aquí..." required></textarea>
                        </div>
                        <input type="hidden" id="idClienteDestino" value="${idCliente}">
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="cerrarModalEnviarMensaje()">
                        <i class="fas fa-times"></i>
                        Cancelar
                    </button>
                    <button type="button" class="btn-primary" onclick="enviarMensajeCliente()">
                        <i class="fas fa-paper-plane"></i>
                        Enviar Mensaje
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

// Función para cerrar modal de enviar mensaje
function cerrarModalEnviarMensaje() {
    const modal = document.getElementById('modalEnviarMensaje');
    if (modal) {
        modal.remove();
    }
}

// Función para enviar mensaje a cliente
async function enviarMensajeCliente() {
    const mensaje = document.getElementById('mensajeTexto').value.trim();
    const idCliente = document.getElementById('idClienteDestino').value;
    
    if (!mensaje) {
        mostrarCardEmergente(false, 'Por favor, escribe un mensaje');
        return;
    }
    
    try {
        // Obtener token usando la función mejorada
        const token = obtenerToken();
        if (!token) {
            console.error('No se encontró token en sessionStorage');
            mostrarCardEmergente(false, 'Sesión no válida');
            return;
        }
        
        const response = await fetch('/GestionDeEspacios/backend/public/mensajes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Auth-Token': token
            },
            body: JSON.stringify({
                action: 'enviar_mensaje_cliente',
                id_cliente: idCliente,
                mensaje: mensaje
            })
        });

        const data = await response.json();

        if (data.success) {
            mostrarCardEmergente(true, 'Mensaje enviado correctamente');
            cerrarModalEnviarMensaje();
            // Recargar la lista de clientes
            cargarMensajes('asignacion');
        } else {
            mostrarCardEmergente(false, data.message || 'Error al enviar mensaje');
        }
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        mostrarCardEmergente(false, 'Error del servidor');
    }
}

// Función para eliminar conversación
function eliminarConversacion(idCliente, nombreCliente) {
    mostrarConfirmacionEliminacionConversacion(idCliente, nombreCliente);
}

// Función para mostrar confirmación de eliminación de conversación
function mostrarConfirmacionEliminacionConversacion(idCliente, nombreCliente) {
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
                    <button class="btn-cancel" onclick="cerrarConfirmacionEliminacionConversacion()">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button class="btn-confirm-delete" onclick="confirmarEliminacionConversacion(${idCliente}, '${nombreCliente}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

// Función para cerrar confirmación de eliminación de conversación
function cerrarConfirmacionEliminacionConversacion() {
    const modal = document.querySelector('.confirmation-overlay');
    if (modal) {
        modal.remove();
    }
}
// Función para confirmar eliminación de conversación
async function confirmarEliminacionConversacion(idCliente, nombreCliente) {
    try {
        const token = obtenerToken();
        if (!token) {
            console.error('No se encontró token en sessionStorage');
            mostrarCardEmergente(false, 'Sesión no válida');
            return;
        }
        
        const response = await fetch('/GestionDeEspacios/backend/public/mensajes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
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
        cerrarConfirmacionEliminacionConversacion();
        
        if (data.success) {
            mostrarCardEmergente(true, 'Conversación eliminada correctamente');
            // Recargar la lista de clientes
            cargarMensajes('asignacion');
        } else {
            mostrarCardEmergente(false, data.message || 'Error al eliminar conversación');
        }
    } catch (error) {
        console.error('Error al eliminar conversación:', error);
        cerrarConfirmacionEliminacionConversacion();
        mostrarCardEmergente(false, 'Error del servidor');
    }
}

// Función para marcar un mensaje como leído
async function marcarComoLeido(idMensaje, tipo) {
    try {
        // Obtener token usando la función mejorada
        const token = obtenerToken();
        if (!token) {
            console.error('No se encontró token en sessionStorage');
            mostrarCardEmergente(false, 'Sesión no válida');
            return;
        }
        
        const response = await fetch('/GestionDeEspacios/backend/public/mensajes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Auth-Token': token
            },
            body: JSON.stringify({
                action: 'marcar_leido',
                id_mensaje: idMensaje,
                tipo: tipo
            })
        });

        const data = await response.json();

        if (data.success) {
            // Actualizar la interfaz
            const messageCard = document.querySelector(`[data-id="${idMensaje}"]`);
            if (messageCard) {
                messageCard.classList.remove('unread');
                const unreadBadge = messageCard.querySelector('.unread-badge');
                if (unreadBadge) {
                    unreadBadge.remove();
                }
            }
        }
    } catch (error) {
        console.error('Error al marcar mensaje como leído:', error);
    }
}

// Función para marcar todos los mensajes como leídos
async function marcarTodosComoLeidos(tipo) {
    try {
        // Obtener token usando la función mejorada
        const token = obtenerToken();
        if (!token) {
            console.error('No se encontró token en sessionStorage');
            mostrarCardEmergente(false, 'Sesión no válida');
            return;
        }
        
        const response = await fetch('/GestionDeEspacios/backend/public/mensajes.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Auth-Token': token
            },
            body: JSON.stringify({
                action: 'marcar_todos_leidos',
                tipo: tipo
            })
        });

        const data = await response.json();

        if (data.success) {
            mostrarCardEmergente(true, 'Todos los mensajes han sido marcados como leídos');
            // Recargar los mensajes
            cargarMensajes(tipo);
        } else {
            mostrarCardEmergente(false, data.message || 'Error al marcar mensajes como leídos');
        }
    } catch (error) {
        console.error('Error al marcar todos como leídos:', error);
        mostrarCardEmergente(false, 'Error del servidor');
    }
}
async function cargarDashboardAdmin(){
	try{
		const token = sessionStorage.getItem('token_sesion')||'';
		const base = '../backend/public/';
		const usuario = JSON.parse(sessionStorage.getItem('usuario_logueado')||'{}');
		const [repR, solR, pubR, calCliR] = await Promise.all([
			fetch(`${base}gestionar_reportes.php?token=${encodeURIComponent(token)}`),
			fetch(`${base}gestionar_solicitudes_horario.php?token=${encodeURIComponent(token)}`),
			fetch(`/GestionDeEspacios/backend/public/gestionar_arriendo.php?action=obtener_publicaciones&token=${encodeURIComponent(token)}`),
			fetch('/GestionDeEspacios/backend/public/calificar_clientes.php', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:`action=obtener_calificaciones&id_administrador=${encodeURIComponent(usuario.id_usuario||'')}` })
		]);

		// Reportes
		let repJson={}; try{ repJson = await repR.json(); }catch{ repJson={}; }
		const reportes = (repJson && repJson.success && Array.isArray(repJson.reportes))? repJson.reportes : (Array.isArray(repJson)?repJson:[]);
		const rep_total = reportes.length;
		const rep_resueltos = reportes.filter(r=>String(r.estado||'').toLowerCase()==='resuelto').length;
		const rep_revisados = reportes.filter(r=>String(r.estado||'').toLowerCase()==='revisado').length;
		const rep_pendientes = rep_total - rep_resueltos - rep_revisados;

		// Solicitudes
		let solJson={}; try{ solJson = await solR.json(); }catch{ solJson={}; }
		const solicitudes = (solJson && solJson.success && Array.isArray(solJson.solicitudes))? solJson.solicitudes : (Array.isArray(solJson)?solJson:[]);
		const sol_total = solicitudes.length;
		const sol_aprobadas = solicitudes.filter(s=>String(s.estado_admin||'').toLowerCase()==='aprobado').length;
		const sol_rechazadas = solicitudes.filter(s=>String(s.estado_admin||'').toLowerCase()==='rechazado').length;
		const sol_pendientes = sol_total - sol_aprobadas - sol_rechazadas;

		// Publicaciones
		let pubJson={}; try{ pubJson = await pubR.json(); }catch{ pubJson={}; }
		const publicaciones = (pubJson && pubJson.success && Array.isArray(pubJson.publicaciones))? pubJson.publicaciones : (Array.isArray(pubJson)?pubJson:[]);
		const pub_total = (publicaciones && publicaciones.length) || (pubJson.contadores && pubJson.contadores.total_publicaciones) || 0;

		// Calificaciones clientes
		let calCliJson={}; try{ calCliJson = await calCliR.json(); }catch{ calCliJson={}; }
		const calCliArr = (calCliJson && calCliJson.success && Array.isArray(calCliJson.calificaciones))? calCliJson.calificaciones : [];
		const cal_cli_total = Array.isArray(calCliArr) ? calCliArr.length : 0;

		// Calificaciones espacios (sumar por publicación)
		let cal_esp_total = 0;
		if (Array.isArray(publicaciones) && publicaciones.length){
			try{
				const sums = await Promise.all(publicaciones.map(async (p)=>{
					if (!p.id_publicacion) return 0;
					try{
						const r = await fetch('/GestionDeEspacios/backend/public/calificar_espacios.php', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:`action=obtener_calificaciones&id_publicacion=${encodeURIComponent(p.id_publicacion)}` });
						const j = await r.json();
						if (j && j.success && Array.isArray(j.calificaciones)) return j.calificaciones.length;
						return 0;
					}catch{ return 0; }
				}));
				cal_esp_total = sums.reduce((a,b)=>a+b,0);
			}catch{ cal_esp_total = 0; }
		}

		const setNum=(id,val)=>{ const el=document.getElementById(id); if (el) el.textContent=String(val); };
		setNum('rep_total', rep_total);
		setNum('rep_resueltos', rep_resueltos);
		setNum('rep_revisados', rep_revisados);
		setNum('rep_pendientes', rep_pendientes);
		setNum('sol_total', sol_total);
		setNum('sol_aprobadas', sol_aprobadas);
		setNum('sol_rechazadas', sol_rechazadas);
		setNum('sol_pendientes', sol_pendientes);
		setNum('pub_total', pub_total);
		setNum('cal_cli_total', cal_cli_total);
		setNum('cal_esp_total', cal_esp_total);
	}catch(e){ console.error('Dashboard load error', e); }
}