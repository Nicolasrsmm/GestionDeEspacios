// menu.js extraído de admin_box.js
// Función para inicializar el menú (con verificación de sesión)
function inicializarMenu() {
    // Verificar si hay usuario logueado
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    const tipoUsuario = sessionStorage.getItem('tipo_usuario');
    
    if (!usuarioLogueado || tipoUsuario !== 'adminsistema') {
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

// ====== Dashboard Inicio (Admin Sistema) ======
async function cargarInformacionSuscripcionAdminSistema(){
    try{
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (!usuarioLogueado) return;
        const usuario = JSON.parse(usuarioLogueado);
        const idUsuario = usuario.id_usuario;
        // Contadores generales (usa el mismo endpoint que Administrador)
        const resp = await fetch('../backend/public/contador_espacios.php', {
            method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded' },
            body: `action=obtener_contadores&id_administrador=${encodeURIComponent(idUsuario)}`
        });
        const data = await resp.json();
        if (data && data.success && data.contadores){
            const c = data.contadores;
            const planName = document.getElementById('planName');
            if (planName) planName.textContent = c.suscripcion || '—';
            const espaciosPct = (Number(c.total_espacios||0) / Math.max(1, Number(c.limite_espacios||0))) * 100;
            const publicacionesPct = (Number(c.total_publicaciones||0) / Math.max(1, Number(c.limite_publicaciones||0))) * 100;
            const eProg = document.getElementById('espaciosProgress'); if (eProg) { eProg.style.width = `${Math.min(100, espaciosPct)}%`; eProg.style.backgroundColor = espaciosPct>=90? '#e74c3c' : espaciosPct>=70? '#f39c12' : '#27ae60'; }
            const eText = document.getElementById('espaciosText'); if (eText) eText.textContent = `${c.total_espacios||0}/${c.limite_espacios||0}`;
            const pProg = document.getElementById('publicacionesProgress'); if (pProg) { pProg.style.width = `${Math.min(100, publicacionesPct)}%`; pProg.style.backgroundColor = publicacionesPct>=90? '#e74c3c' : publicacionesPct>=70? '#f39c12' : '#27ae60'; }
            const pText = document.getElementById('publicacionesText'); if (pText) pText.textContent = `${c.total_publicaciones||0}/${c.limite_publicaciones||0}`;
        }
    } catch(e){ console.error('Error suscripción admin sistema', e); }
}

async function cargarDashboardAdminSistema(){
    try{
        const token = sessionStorage.getItem('token_sesion')||'';
        const base = '../backend/public/';
        const usuario = JSON.parse(sessionStorage.getItem('usuario_logueado')||'{}');
        // Llamadas paralelas necesarias para métricas
        const [usuariosR, espaciosR, pubsR] = await Promise.all([
            fetch(`${base}gestionar_clientes.php`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'listar', roles:['AdminSistema','Administrador','Colaboradores','Secretaria','Cliente'] }) }),
            fetch(`${base}gestionarespacios.php`, { method:'POST', body: (()=>{ const fd=new FormData(); fd.append('action','obtener_espacios_sistema'); return fd; })() }),
            fetch(`${base}gestionarespacios.php`, { method:'POST', body: (()=>{ const fd=new FormData(); fd.append('action','obtener_publicaciones_sistema'); return fd; })() })
        ]);

        // Usuarios por rol
        let usersJson={}; try{ usersJson = await usuariosR.json(); }catch{ usersJson={}; }
        const listaUsuarios = Array.isArray(usersJson.clientes)? usersJson.clientes : [];
        const rolesMap = { 'Administrador':0, 'Cliente':0, 'Colaboradores':0, 'AdminSistema':0 };
        listaUsuarios.forEach(u=>{
            const rol = (u.nombre_rol||'').toString();
            if (rol.includes('Secretaria')) { rolesMap['Colaboradores']++; return; }
            if (rolesMap.hasOwnProperty(rol)) rolesMap[rol]++;
        });
        const users_total = listaUsuarios.length;

        // Espacios totales y asignados
        let espJson={}; try{ espJson = await espaciosR.json(); }catch{ espJson={}; }
        const espacios = Array.isArray(espJson.espacios)? espJson.espacios : [];
        const esp_total = espacios.length;
        const esp_asignados = espacios.reduce((sum, e)=> sum + (parseInt(e.total_asignaciones)||0), 0);

        // Publicaciones totales
        let pubJson={}; try{ pubJson = await pubsR.json(); }catch{ pubJson={}; }
        const publicaciones = Array.isArray(pubJson.publicaciones)? pubJson.publicaciones : [];
        const pub_total = publicaciones.length;

        // Sesiones activas (best-effort)
        let sesiones_activas_val = '-';
        try{
            const sR = await fetch(`${base}sesion.php`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'contar' }) });
            const sJ = await sR.json();
            if (sJ && (typeof sJ.activos === 'number' || typeof sJ.total === 'number')) {
                sesiones_activas_val = String(sJ.activos ?? sJ.total);
            }
        }catch{}

        // Suscripciones por plan (solo Administradores)
        let sus_total = 0; const planesMap = {};
        try{
            const respAdmins = await fetch(`${base}gestionar_clientes.php`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'listar', roles:['Administrador'] }) });
            const dataAdmins = await respAdmins.json();
            const admins = Array.isArray(dataAdmins.clientes)? dataAdmins.clientes : [];
            admins.forEach(a=>{
                if (a.id_suscripcion){
                    sus_total++;
                    const nombre = a.nombre_suscripcion || 'Sin nombre';
                    planesMap[nombre] = (planesMap[nombre]||0)+1;
                }
            });
        }catch{}

        // Actividad 7 días (espacios + publicaciones recientes)
        const now = new Date(); const weekAgo = new Date(now.getTime() - 7*24*60*60*1000);
        const toDate = v=>{ const d=new Date(v); return isNaN(d.getTime())? null : d; };
        const act_esp = espacios.filter(e=>{ const d=toDate(e.fecha_creacion||e.fecha); return d && d>=weekAgo; }).length;
        const act_pub = publicaciones.filter(p=>{ const d=toDate(p.fecha_publicacion||p.fecha); return d && d>=weekAgo; }).length;
        const act_total = act_esp + act_pub;

        const setNum=(id,val)=>{ const el=document.getElementById(id); if (el) el.textContent=String(val); };
        setNum('users_total', users_total);
        setNum('users_admins', rolesMap['Administrador']);
        setNum('users_clientes', rolesMap['Cliente']);
        setNum('users_colab', rolesMap['Colaboradores']);
        setNum('users_adminsis', rolesMap['AdminSistema']);
        setNum('esp_total', esp_total);
        setNum('esp_asignados', esp_asignados);
        setNum('pub_total', pub_total);
        const sesEl = document.getElementById('sesiones_activas'); if (sesEl) sesEl.textContent = sesiones_activas_val;
        setNum('sus_total', sus_total);
        const planesEl = document.getElementById('sus_planes');
        if (planesEl){
            const entries = Object.entries(planesMap).sort((a,b)=> a[0].localeCompare(b[0]));
            planesEl.innerHTML = entries.length? entries.map(([plan, cnt])=>`<div><span class="metric-number">${cnt}</span><span class="metric-label">${plan}</span></div>`).join('') : '<div style="grid-column:1/-1;color:#9aa0a6;">Sin planes asignados</div>';
        }
        setNum('act_total', act_total);
    }catch(e){ console.error('Dashboard admin sistema error', e); }
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
        overlay.className = 'overlay-blur';
        document.body.appendChild(overlay);
    }
    
    // Crear card
    let card = document.createElement('div');
    card.className = 'logout-card';

    // Icono
    let icon = document.createElement('div');
    icon.innerHTML = '<i class="fas fa-sign-out-alt logout-icon"></i>';
    card.appendChild(icon);

    // Mensaje
    let msg = document.createElement('div');
    msg.className = 'logout-text';
    msg.textContent = '¿Estás seguro de que quieres cerrar sesión?';
    card.appendChild(msg);

    // Botones
    let buttonContainer = document.createElement('div');
    buttonContainer.className = 'logout-actions';

    // Botón Cancelar
    let cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.className = 'cancel-btn';
    cancelBtn.onclick = function() {
        overlay.remove();
    };
    buttonContainer.appendChild(cancelBtn);

    // Botón Confirmar
    let confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Cerrar Sesión';
    confirmBtn.className = 'btn-logout';
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
        overlay.className = 'overlay-blur';
        document.body.appendChild(overlay);
    }
    
    // Crear card
    let card = document.createElement('div');
    card.className = `msg-card ${success ? 'success' : 'error'}`;

    // Icono
    let icon = document.createElement('div');
    icon.innerHTML = success
        ? '<i class="fas fa-check-circle msg-icon"></i>'
        : '<i class="fas fa-times-circle msg-icon"></i>';
    card.appendChild(icon);

    // Mensaje
    let msg = document.createElement('div');
    msg.className = 'msg-text';
    msg.textContent = message;
    card.appendChild(msg);

    // Botón de cerrar (solo para errores o si es exitoso)
    if (!success || success) {
        let closeBtn = document.createElement('button');
        closeBtn.textContent = 'Cerrar';
        closeBtn.className = success ? 'btn-msg-success' : 'btn-msg-error';
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
    
    // Obtener el texto del menú seleccionado
    const menuText = menuItem.querySelector('span').textContent;
    
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
    
    switch(opcion) {
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
                    <h2>Bienvenido al Panel de Admin</h2>
                    <p>Gestiona El Sistema Completo</p>
                </div>

                <div class="dashboard-metrics" id="dashboardMetrics">
                    <div class="dashboard-metrics-card">
                        <h3 style="margin-top:.25rem;">Resumen general</h3>
                        <div class="metrics-grid">
                            <div class="metric-card">
                                <div class="metric-title"><i class="fas fa-users"></i> Usuarios</div>
                                <div class="metric-values">
                                    <div><span class="metric-number" id="users_total">-</span><span class="metric-label">Total</span></div>
                                    <div><span class="metric-number" id="users_admins">-</span><span class="metric-label">Administradores</span></div>
                                    <div><span class="metric-number" id="users_clientes">-</span><span class="metric-label">Clientes</span></div>
                                    <div><span class="metric-number" id="users_colab">-</span><span class="metric-label">Colaboradores</span></div>
                                    <div><span class="metric-number" id="users_adminsis">-</span><span class="metric-label">AdminSistema</span></div>
                                </div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-title"><i class="fas fa-warehouse"></i> Gestión de espacios</div>
                                <div class="metric-values">
                                    <div><span class="metric-number" id="esp_total">-</span><span class="metric-label">Total espacios</span></div>
                                    <div><span class="metric-number" id="esp_asignados">-</span><span class="metric-label">Asignados</span></div>
                                </div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-title"><i class="fas fa-bullhorn"></i> Publicar arriendo</div>
                                <div class="metric-values">
                                    <div><span class="metric-number" id="pub_total">-</span><span class="metric-label">Total en arriendo</span></div>
                                </div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-title"><i class="fas fa-sign-in-alt"></i> Sesiones</div>
                                <div class="metric-values">
                                    <div><span class="metric-number" id="sesiones_activas">-</span><span class="metric-label">Usuarios activos</span></div>
                                </div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-title"><i class="fas fa-crown"></i> Suscripciones</div>
                                <div class="metric-values">
                                    <div><span class="metric-number" id="sus_total">-</span><span class="metric-label">Con suscripción</span></div>
                                    <div id="sus_planes" style="grid-column: 1 / -1; display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:.5rem 1rem;"></div>
                                </div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-title"><i class="fas fa-chart-line"></i> Actividad (7 días)</div>
                                <div class="metric-values">
                                    <div><span class="metric-number" id="act_total">-</span><span class="metric-label">Total</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            // Cargar métricas
            setTimeout(() => { try { cargarDashboardAdminSistema(); } catch(_){} }, 100);
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
                    <h2>Mi Perfil de Admin Sistema</h2>
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
                                    <p>Admin Sistema</p>
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
            
            
        case 'Gestionar Administradores':
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
                    <h2>Gestionar Administradores</h2>
                    <p>Administra los administradores del sistema</p>
                </div>
                
                <div class="register-admin-section">
                    <div class="register-form-container">
                        <div class="form-header">
                            <h3><i class="fas fa-user-plus"></i> Registrar Nuevo AdminSistema</h3>
                            <p>Completa los datos para crear un nuevo administrador del sistema</p>
                        </div>
                        
                        <form id="registerAdminForm" class="register-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="rut_numero">RUT Número</label>
                                    <input type="number" id="rut_numero" name="rut_numero" placeholder="Ej: 12345678" required>
                                </div>
                                <div class="form-group">
                                    <label for="rut_dv">Dígito Verificador</label>
                                    <input type="text" id="rut_dv" name="rut_dv" placeholder="K" maxlength="1" required>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="nombre">Nombre</label>
                                    <input type="text" id="nombre" name="nombre" placeholder="Nombre" required>
                                </div>
                                <div class="form-group">
                                    <label for="apellido">Apellido</label>
                                    <input type="text" id="apellido" name="apellido" placeholder="Apellido" required>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="telefono">Teléfono</label>
                                    <input type="tel" id="telefono" name="telefono" placeholder="+56 9 1234 5678" required>
                                </div>
                                <div class="form-group">
                                    <label for="direccion">Dirección</label>
                                    <input type="text" id="direccion" name="direccion" placeholder="Dirección completa" required>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="region">Región</label>
                                    <select id="region" name="region" required>
                                        <option value="">Selecciona una región</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="ciudad">Ciudad</label>
                                    <select id="ciudad" name="ciudad" required>
                                        <option value="">Selecciona una ciudad</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="nombre_usuario">Nombre de Usuario</label>
                                    <input type="text" id="nombre_usuario" name="nombre_usuario" placeholder="admin123" required>
                                </div>
                                <div class="form-group">
                                    <label for="correo_electronico">Correo Electrónico</label>
                                    <input type="email" id="correo_electronico" name="correo_electronico" placeholder="admin@example.com" required>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="contrasena">Contraseña</label>
                                    <input type="password" id="contrasena" name="contrasena" placeholder="Mínimo 8 caracteres" required>
                                </div>
                                <div class="form-group">
                                    <label for="confirmar_contrasena">Confirmar Contraseña</label>
                                    <input type="password" id="confirmar_contrasena" name="confirmar_contrasena" placeholder="Repite la contraseña" required>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="cancel-btn" onclick="cancelarRegistroAdmin()">
                                    <i class="fas fa-times"></i> Cancelar
                                </button>
                                <button type="submit" class="submit-btn">
                                    <i class="fas fa-user-plus"></i> Registrar AdminSistema
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Modal para editar AdminSistema -->
                <div id="modalEditarAdminSistema" class="modal-overlay" style="display: none;">
                    <div class="modal-content modal-adminsistema">
                        <div class="modal-header">
                            <h3><i class="fas fa-user-shield"></i> Editar AdminSistema</h3>
                            <p>Modifica los datos del AdminSistema seleccionado</p>
                            <button class="close-modal" onclick="cerrarModalEditarAdminSistema()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form id="formEditarAdminSistema" onsubmit="actualizarAdminSistema(event)">
                                <input type="hidden" id="id_adminsistema_modal" name="id_adminsistema" value="">
                                
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
                                        <input type="text" id="rut_modal" name="rut_numero" placeholder="12345678" required maxlength="8">
                                    </div>
                                    <div class="form-group">
                                        <label for="dv_modal">DV *</label>
                                        <input type="text" id="dv_modal" name="rut_dv" placeholder="9" required maxlength="1">
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
                                    <label for="telefono_modal">Teléfono *</label>
                                    <input type="tel" id="telefono_modal" name="telefono" required>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="region_modal">Región *</label>
                                        <select id="region_modal" name="region" required onchange="cargarCiudadesModalAdmin(this.value)">
                                            <option value="">Seleccionar región...</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="ciudad_modal">Ciudad *</label>
                                        <select id="ciudad_modal" name="ciudad" required>
                                            <option value="">Seleccionar ciudad...</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="direccion_modal">Dirección *</label>
                                    <input type="text" id="direccion_modal" name="direccion" required>
                                </div>
                                
                                <div class="modal-actions">
                                    <button type="button" class="cancel-btn" onclick="cerrarModalEditarAdminSistema()">
                                        <i class="fas fa-times"></i> Cancelar
                                    </button>
                                    <button type="submit" class="submit-btn">
                                        <i class="fas fa-save"></i> Actualizar AdminSistema
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            
            // Cargar regiones al inicializar el formulario
            cargarRegionesAdmin();
            // Cargar usuarios del sistema
            cargarUsuariosSistema();
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
                    <h2>Gestionar Médicos del Sistema</h2>
                    <p>Administra todos los médicos del sistema</p>
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
            
        case 'Gestionar Usuarios':
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
                    <h2>Gestionar Usuarios del Sistema</h2>
                    <p>Administra todos los usuarios del sistema</p>
                </div>
                
                <div class="manage-section">
                    <div class="search-filters-card">
                        <h3><i class="fas fa-filter"></i> Filtros De Usuarios</h3>
                        <div id="generarReportesFiltros" class="filters-grid">
                            <div class="filter-group">
                                <label>Tipo de usuario</label>
                                <select id="reporteTipo" class="filter-select">
                                    <option value="Cliente" selected>Cliente</option>
                                    <option value="Administrador">Administrador</option>
                                    <option value="Colaboradores">Colaboradores</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label>Buscar</label>
                                <input type="text" id="reporteBuscar" class="filter-select" placeholder="Buscar por RUT o nombre...">
                            </div>
                        </div>
                    </div>
                    <div class="usuarios-sistema-section" id="clientesSection">
                        <div class="usuarios-header">
                            <h3><i class="fas fa-users"></i> Usuarios del Sistema</h3>
                            <p id="clientesCount">Cargando...</p>
                        </div>
                        <div class="usuarios-grid" id="clientesGrid"></div>
                    </div>
                </div>
            `;

            // eventos
            {
                const selTipo = document.getElementById('reporteTipo');
                if (selTipo) {
                    selTipo.addEventListener('change', () => {
                        const q = document.getElementById('reporteBuscar');
                        cargarClientes(q ? q.value.trim() : '');
                    });
                }
            }
            {
                const inputBuscar = document.getElementById('reporteBuscar');
                if (inputBuscar) {
                    let t = null;
                    inputBuscar.addEventListener('input', () => {
                        clearTimeout(t);
                        t = setTimeout(() => cargarClientes(inputBuscar.value.trim()), 300);
                    });
                }
            }
            // cargar lista inicial
            cargarClientes('');
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
                    <h2>Gestionar Espacios del Sistema</h2>
                    <p>Administra todos los espacios del sistema</p>
                </div>
                <div class="manage-section">
                    <div class="search-filters-card">
                        <h3><i class="fas fa-filter"></i> Filtros De Espacios</h3>
                        <div class="filters-grid">
                            <div class="filter-group">
                                <label>Tipo de listado</label>
                                <select id="espFuenteSelect" class="filter-select">
                                    <option value="gestiondeespacio" selected>Gestión de Espacios</option>
                                    <option value="publicararriendo">Publicaciones de Arriendo</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label>Buscar por propietario</label>
                                <input type="text" id="espBuscar" class="filter-select" placeholder="Nombre o apellido del propietario...">
                            </div>
                            <div class="filter-group">
                                <label>Región</label>
                                <select id="espFiltroRegion" class="filter-select"><option value="">Todas</option></select>
                            </div>
                            <div class="filter-group">
                                <label>Ciudad</label>
                                <select id="espFiltroCiudad" class="filter-select"><option value="">Todas</option></select>
                            </div>
                            <div class="filter-group">
                                <label>&nbsp;</label>
                                <button id="btnEspLimpiar" type="button" class="cancel-btn"><i class="fas fa-eraser"></i> Limpiar filtros</button>
                            </div>
                        </div>
                    </div>
                    <div class="usuarios-sistema-section" id="espaciosSection">
                        <div class="usuarios-header">
                            <h3><i class="fas fa-warehouse"></i> Espacios del Sistema</h3>
                            <p id="espaciosCount">Cargando...</p>
                        </div>
                        <div class="usuarios-grid" id="espaciosGrid"></div>
                    </div>
                </div>
            `;
            // eventos
            (async function(){
                const sel = document.getElementById('espFuenteSelect');
                const input = document.getElementById('espBuscar');
                const selRegion = document.getElementById('espFiltroRegion');
                const selCiudad = document.getElementById('espFiltroCiudad');
                const btnLimpiar = document.getElementById('btnEspLimpiar');

                const triggerLoad = () => {
                    if (sel.value==='publicararriendo') { cargarPublicaciones(); }
                    else { cargarEspacios(); }
                };

                // Poblar regiones
                try {
                    const resp = await fetch('../backend/public/regiones_chile.php?action=regiones');
                    const data = await resp.json();
                    if (data.success && Array.isArray(data.regiones)){
                        selRegion.innerHTML = '<option value="">Todas</option>' + data.regiones.map(r=>`<option value="${r.nombre_region||r.nombre}">${r.nombre_region||r.nombre}</option>`).join('');
                    }
                } catch(e){ console.error('Error cargando regiones filtro', e); }

                // Eventos
                if (sel){ sel.addEventListener('change', ()=>{ selCiudad.value=''; triggerLoad(); }); }
                if (input){ let t=null; input.addEventListener('input', ()=>{ clearTimeout(t); t=setTimeout(triggerLoad,300); }); }
                if (selRegion){ selRegion.addEventListener('change', async ()=>{
                    // cargar ciudades de la región seleccionada
                    const regionNombre = selRegion.value;
                    selCiudad.innerHTML = '<option value="">Todas</option>';
                    if (regionNombre){
                        try{
                            const resReg = await fetch('../backend/public/regiones_chile.php?action=regiones');
                            const dReg = await resReg.json();
                            const regObj = (dReg.regiones||[]).find(r => (r.nombre_region||r.nombre)===regionNombre);
                            if (regObj){
                                const respC = await fetch(`../backend/public/regiones_chile.php?action=ciudades&id_region=${regObj.id_region}`);
                                const dataC = await respC.json();
                                if (dataC.success && Array.isArray(dataC.ciudades)){
                                    selCiudad.innerHTML = '<option value="">Todas</option>' + dataC.ciudades.map(c=>`<option value="${c.nombre_ciudad||c.nombre}">${c.nombre_ciudad||c.nombre}</option>`).join('');
                                }
                            }
                        } catch(e){ console.error('Error cargando ciudades filtro', e); }
                    }
                    triggerLoad();
                }); }
                if (selCiudad){ selCiudad.addEventListener('change', triggerLoad); }
                if (btnLimpiar){ btnLimpiar.addEventListener('click', ()=>{
                    input && (input.value='');
                    selRegion && (selRegion.value='');
                    selCiudad && (selCiudad.innerHTML='<option value="">Todas</option>');
                    triggerLoad();
                }); }

                // carga inicial
                triggerLoad();
            })();
            break;
            
            
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
                    <h2>Generar Reportes del Sistema</h2>
                    <p>Genera reportes y estadísticas del sistema completo</p>
                </div>
                
                <div class="search-filters-card">
                    <h3><i class="fas fa-filter"></i> Filtros del Reporte</h3>
                    <div id="generarReportesFiltros" class="filters-grid">
                        <div class="filter-group">
                            <label>Tipo de Reporte</label>
                            <select id="reporteTipo" class="filter-select">
                                <option value="general">Reporte General del Sistema</option>
                                <option value="gestiondeespacio">Gestión de Espacios</option>
                                <option value="publicararriendo">Publicaciones de Arriendo</option>
                                <option value="usuarios_por_tipo">Usuarios por Tipo</option>
                                <option value="suscripciones">Suscripciones</option>
                                <option value="actividad_reciente">Actividad Reciente</option>
                                <option value="estadisticas_uso">Estadísticas de Uso</option>
                                <option value="pagos">Todos los Pagos Realizados</option>
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
            
            document.getElementById('profileName').textContent = `${usuario.nombre} ${usuario.apellido}`;
            document.getElementById('profileNombreUsuario').value = usuario.nombre_usuario || '';
            document.getElementById('profileNombre').value = usuario.nombre || '';
            document.getElementById('profileApellido').value = usuario.apellido || '';
            document.getElementById('profileEmail').value = usuario.correo_electronico || '';
            document.getElementById('profileTelefono').value = usuario.telefono || '';
            document.getElementById('profileDireccion').value = usuario.direccion || '';
            
            // Cargar regiones y ciudades automáticamente
            await cargarRegionesYCiudades();
            
            // Establecer valores de región y ciudad
            if (usuario.region) {
                document.getElementById('profileRegion').value = usuario.region;
                await cargarCiudadesPorRegion(usuario.region);
                if (usuario.ciudad) {
                    document.getElementById('profileCiudad').value = usuario.ciudad;
                }
            }
        } catch (error) {
            console.error('Error al cargar datos del perfil:', error);
        }
    }
}

// Variable para almacenar datos originales
let datosOriginales = {};

// Función para alternar edición de perfil
async function toggleEditProfile() {
    const editBtn = document.getElementById('editProfileBtn');
    const profileActions = document.getElementById('profileActions');
    const inputs = ['profileNombreUsuario', 'profileNombre', 'profileApellido', 'profileEmail', 'profileTelefono', 'profileRegion', 'profileCiudad', 'profileDireccion'];
    
    if (profileActions.style.display === 'none') {
        // Entrar en modo edición
        // Guardar datos originales
        datosOriginales = {};
        inputs.forEach(id => {
            const element = document.getElementById(id);
            datosOriginales[id] = element.value;
        });
        
        // Habilitar campos
        inputs.forEach(id => {
            document.getElementById(id).disabled = false;
        });
        
        // Mostrar botones de acción
        profileActions.style.display = 'flex';
        
        // Cambiar botón
        editBtn.innerHTML = '<i class="fas fa-times"></i> Cancelar';
        editBtn.onclick = cancelarEdicion;
        
        // Cargar regiones y ciudades automáticamente
        await cargarRegionesYCiudades();
        
        // Establecer valores de región y ciudad si existen
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (usuarioLogueado) {
            try {
                const usuario = JSON.parse(usuarioLogueado);
                if (usuario.region) {
                    document.getElementById('profileRegion').value = usuario.region;
                    await cargarCiudadesPorRegion(usuario.region);
                    if (usuario.ciudad) {
                        document.getElementById('profileCiudad').value = usuario.ciudad;
                    }
                }
            } catch (error) {
                console.error('Error al cargar datos del usuario:', error);
            }
        }
    }
}

// Función para cancelar edición
function cancelarEdicion() {
    const editBtn = document.getElementById('editProfileBtn');
    const profileActions = document.getElementById('profileActions');
    const inputs = ['profileNombreUsuario', 'profileNombre', 'profileApellido', 'profileEmail', 'profileTelefono', 'profileRegion', 'profileCiudad', 'profileDireccion'];
    
    // Restaurar datos originales
    Object.keys(datosOriginales).forEach(id => {
        document.getElementById(id).value = datosOriginales[id];
    });
    
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
        
        const response = await fetch('../backend/public/actualizar_perfil_admin_sistema.php', {
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
        
        const contrasenaActual = document.getElementById('contrasenaActual').value.trim();
        const nuevaContrasena = document.getElementById('nuevaContrasena').value.trim();
        const confirmarContrasena = document.getElementById('confirmarContrasena').value.trim();
        
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
        
        const response = await fetch('../backend/public/actualizar_perfil_admin_sistema.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosContrasena)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Limpiar campos
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
 

// Función para cargar regiones y ciudades
async function cargarRegionesYCiudades() {
    try {
        const response = await fetch('../backend/public/regiones_chile.php');
        const data = await response.json();
        
        console.log('Respuesta del servidor de regiones:', data);
        
        const regionSelect = document.getElementById('profileRegion');
        regionSelect.innerHTML = '<option value="">Selecciona una región</option>';
        
        // Verificar si la respuesta tiene la estructura correcta
        if (data.success && data.regiones) {
            // Llenar select de regiones
            data.regiones.forEach(regionObj => {
                const option = document.createElement('option');
                option.value = regionObj.nombre;
                option.textContent = regionObj.nombre;
                regionSelect.appendChild(option);
            });
        } else {
            console.error('Error en la respuesta del servidor de regiones:', data);
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
        console.log('Cargando ciudades para región:', region);
        
        const formData = new FormData();
        formData.append('region', region);
        
        const response = await fetch('../backend/public/regiones_chile.php', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        
        console.log('Respuesta del servidor de ciudades:', data);
        
        const ciudadSelect = document.getElementById('profileCiudad');
        ciudadSelect.innerHTML = '<option value="">Selecciona una ciudad</option>';
        
        if (data.success && data.ciudades) {
            data.ciudades.forEach(ciudadObj => {
                const option = document.createElement('option');
                option.value = ciudadObj.nombre;
                option.textContent = ciudadObj.nombre;
                ciudadSelect.appendChild(option);
            });
        } else {
            console.error('Error en la respuesta del servidor de ciudades:', data);
        }
        
    } catch (error) {
        console.error('Error al cargar ciudades:', error);
    }
}

// Función para cargar regiones en el formulario de registro de admin
async function cargarRegionesAdmin() {
    try {
        const response = await fetch('../backend/public/regiones_chile.php');
        const data = await response.json();
        
        const regionSelect = document.getElementById('region');
        if (regionSelect) {
            regionSelect.innerHTML = '<option value="">Selecciona una región</option>';
            
            if (data.success && data.regiones) {
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
                    cargarCiudadesAdmin(this.value);
                } else {
                    const ciudadSelect = document.getElementById('ciudad');
                    ciudadSelect.innerHTML = '<option value="">Selecciona una ciudad</option>';
                }
            });
        }
    } catch (error) {
        console.error('Error al cargar regiones:', error);
    }
}

// Función para cargar ciudades por región en el formulario de admin
async function cargarCiudadesAdmin(region) {
    try {
        // Primero necesitamos obtener el ID de la región
        const regionResponse = await fetch('../backend/public/regiones_chile.php');
        const regionData = await regionResponse.json();
        
        let id_region = null;
        if (regionData.success && regionData.regiones) {
            const regionObj = regionData.regiones.find(r => r.nombre_region === region);
            if (regionObj) {
                id_region = regionObj.id_region;
            }
        }
        
        if (!id_region) {
            console.error('No se encontró el ID de la región:', region);
            return;
        }
        
        const response = await fetch(`../backend/public/regiones_chile.php?action=ciudades&id_region=${id_region}`);
        const data = await response.json();
        
        const ciudadSelect = document.getElementById('ciudad');
        if (ciudadSelect) {
            ciudadSelect.innerHTML = '<option value="">Selecciona una ciudad</option>';
            
            if (data.success && data.ciudades) {
                data.ciudades.forEach(ciudadObj => {
                    const option = document.createElement('option');
                    option.value = ciudadObj.nombre_ciudad;
                    option.textContent = ciudadObj.nombre_ciudad;
                    ciudadSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error al cargar ciudades:', error);
    }
}

// Función para validar RUT chileno
function validarRUT(rut_numero, rut_dv) {
    rut_numero = rut_numero.toString().replace(/\./g, '');
    rut_dv = rut_dv.toUpperCase();
    
    let suma = 0;
    let multiplicador = 2;
    
    for (let i = rut_numero.length - 1; i >= 0; i--) {
        suma += parseInt(rut_numero.charAt(i)) * multiplicador;
        multiplicador = multiplicador < 7 ? multiplicador + 1 : 2;
    }
    
    const resto = suma % 11;
    const dvCalculado = resto < 2 ? resto : 11 - resto;
    const dvEsperado = dvCalculado === 11 ? '0' : dvCalculado === 10 ? 'K' : dvCalculado.toString();
    
    return rut_dv === dvEsperado;
}

// Función para validar email
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Función para cancelar registro de admin
function cancelarRegistroAdmin() {
    document.getElementById('registerAdminForm').reset();
    const ciudadSelect = document.getElementById('ciudad');
    if (ciudadSelect) {
        ciudadSelect.innerHTML = '<option value="">Selecciona una ciudad</option>';
    }
}

// Función para manejar el envío del formulario de registro de admin
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('submit', function(e) {
        if (e.target.id === 'registerAdminForm') {
            e.preventDefault();
            registrarAdminSistema();
        }
    });
});

// Función para registrar un nuevo AdminSistema
async function registrarAdminSistema() {
    const formData = new FormData(document.getElementById('registerAdminForm'));
    
    // Obtener valores del formulario
    const rut_numero = parseInt(formData.get('rut_numero'));
    const rut_dv = formData.get('rut_dv').toUpperCase();
    const nombre = formData.get('nombre').trim();
    const apellido = formData.get('apellido').trim();
    const telefono = formData.get('telefono').trim();
    const direccion = formData.get('direccion').trim();
    const region = formData.get('region');
    const ciudad = formData.get('ciudad');
    const nombre_usuario = formData.get('nombre_usuario').trim();
    const correo_electronico = formData.get('correo_electronico').trim();
    const contrasena = formData.get('contrasena');
    const confirmar_contrasena = formData.get('confirmar_contrasena');
    
    // Validaciones
    if (!validarRUT(rut_numero, rut_dv)) {
        mostrarCardEmergente(false, 'El RUT ingresado no es válido');
        return;
    }
    
    if (!validarEmail(correo_electronico)) {
        mostrarCardEmergente(false, 'El formato del email no es válido');
        return;
    }
    
    if (contrasena.length < 8) {
        mostrarCardEmergente(false, 'La contraseña debe tener al menos 8 caracteres');
        return;
    }
    
    if (contrasena !== confirmar_contrasena) {
        mostrarCardEmergente(false, 'Las contraseñas no coinciden');
        return;
    }
    
    // Preparar datos para enviar
    const datosRegistro = {
        rut_numero: rut_numero,
        rut_dv: rut_dv,
        nombre: nombre,
        apellido: apellido,
        telefono: telefono,
        direccion: direccion,
        region: region,
        ciudad: ciudad,
        nombre_usuario: nombre_usuario,
        correo_electronico: correo_electronico,
        contrasena: contrasena
    };
    
    try {
        const response = await fetch('../backend/public/registrar_admin_sistema.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosRegistro)
        });
        
        const result = await response.json();
        
        if (result.success) {
            mostrarCardEmergente(true, result.message);
            cancelarRegistroAdmin();
        } else {
            mostrarCardEmergente(false, result.message);
        }
        
    } catch (error) {
        console.error('Error al registrar AdminSistema:', error);
        mostrarCardEmergente(false, 'Error al registrar AdminSistema');
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

// Variable global para almacenar los datos de usuarios
let usuariosData = [];

// ========= Gestionar Espacios =========
async function cargarEspacios() {
    try {
        const fd = new FormData();
        fd.append('action','obtener_espacios_sistema');
        const resp = await fetch('../backend/public/gestionarespacios.php', { method: 'POST', body: fd });
        const data = await resp.json();
        if (!data.success) { mostrarCardEmergente(false, data.message || 'Error al obtener espacios'); return; }
        let lista = data.espacios || [];
        const qInput = document.getElementById('espBuscar');
        const q = (qInput && qInput.value ? qInput.value : '').trim().toLowerCase();
        const rSel = document.getElementById('espFiltroRegion');
        const cSel = document.getElementById('espFiltroCiudad');
        const region = rSel ? rSel.value : '';
        const ciudad = cSel ? cSel.value : '';

        if (q) {
            lista = lista.filter(e => {
                const nombre = (e.propietario_nombre||'').toLowerCase();
                const apellido = (e.propietario_apellido||'').toLowerCase();
                return nombre.includes(q) || apellido.includes(q) || `${nombre} ${apellido}`.includes(q);
            });
        }
        if (region) {
            lista = lista.filter(e => (e.nombre_region||'') === region);
        }
        if (ciudad) {
            lista = lista.filter(e => (e.nombre_ciudad||'') === ciudad);
        }
        renderEspacios(lista);
    } catch(e){ console.error('Error cargar espacios', e); mostrarCardEmergente(false,'Error al cargar espacios'); }
}

function renderEspacios(espacios){
    const grid = document.getElementById('espaciosGrid');
    const count = document.getElementById('espaciosCount');
    if (!grid) return;
    count.textContent = `Espacios encontrados (${espacios.length})`;
    grid.innerHTML = espacios.map(e=>`
        <div class="usuario-card" data-id="${e.id_espacio}">
            <div class="usuario-avatar">${(e.nombre_espacio||'E').substring(0,2).toUpperCase()}</div>
            <div class="usuario-info">
                <h4>${e.nombre_espacio} ${parseInt(e.disponible)===1 ? '' : '<span style=\"color:#dc3545;font-weight:600;\">(No disponible)</span>'}</h4>
                <p class="usuario-rol administrador"><i class="fas fa-door-open"></i> ${e.tipo_espacio||''}</p>
                <div class="usuario-details">
                    <p><i class="fas fa-ruler-combined"></i> ${e.metros_cuadrados} m²</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${(e.nombre_region||'')}${e.nombre_ciudad? ', '+e.nombre_ciudad:''}</p>
                    <p><i class="fas fa-location-arrow"></i> ${e.direccion||''}</p>
                    ${e.ubicacion_interna? `<p><i class=\"fas fa-layer-group\"></i> ${e.ubicacion_interna}</p>`:''}
                    ${(e.propietario_nombre||e.propietario_apellido) ? `<p><i class=\"fas fa-user fa-fw\"></i> ${[e.propietario_nombre||'', e.propietario_apellido||''].join(' ').trim()}</p>` : ''}
                </div>
            </div>
            <div class="usuario-actions">
                <button class="edit-btn" title="Editar" onclick="abrirModalEspacio(${e.id_espacio})"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" title="Eliminar" onclick="confirmarEliminarEspacio(${e.id_espacio})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

// Publicaciones de arriendo (lista de publicararriendo)
async function cargarPublicaciones(){
    try{
        const fd = new FormData(); fd.append('action','obtener_publicaciones_sistema');
        const resp = await fetch('../backend/public/gestionarespacios.php', { method:'POST', body: fd });
        const data = await resp.json();
        if (!data.success){ mostrarCardEmergente(false, data.message||'Error al obtener publicaciones'); return; }
        let lista = data.publicaciones||[];
        const qInput = document.getElementById('espBuscar');
        const q = (qInput && qInput.value ? qInput.value : '').trim().toLowerCase();
        const rSel = document.getElementById('espFiltroRegion');
        const cSel = document.getElementById('espFiltroCiudad');
        const region = rSel ? rSel.value : '';
        const ciudad = cSel ? cSel.value : '';

        if (q){
            lista = lista.filter(p => {
                const nombre = (p.propietario_nombre||'').toLowerCase();
                const apellido = (p.propietario_apellido||'').toLowerCase();
                return nombre.includes(q) || apellido.includes(q) || `${nombre} ${apellido}`.includes(q);
            });
        }
        if (region){ lista = lista.filter(p => (p.nombre_region||'') === region); }
        if (ciudad){ lista = lista.filter(p => (p.nombre_ciudad||'') === ciudad); }
        renderPublicaciones(lista);
    } catch(e){ console.error('Error cargar publicaciones', e); mostrarCardEmergente(false,'Error al cargar publicaciones'); }
}

function renderPublicaciones(publicaciones){
    const grid = document.getElementById('espaciosGrid');
    const count = document.getElementById('espaciosCount');
    if (!grid) return;
    count.textContent = `Publicaciones encontradas (${publicaciones.length})`;
    grid.innerHTML = publicaciones.map(p=>`
        <div class=\"usuario-card\" data-id=\"${p.id_publicacion}\"> 
            <div class=\"usuario-avatar\">${(p.titulo||'P').substring(0,2).toUpperCase()}</div>
            <div class=\"usuario-info\">
                <h4>${p.titulo} ${p.estado && p.estado!=='Publicado' ? '<span style=\\"color:#e67e22;font-weight:600;\\">('+p.estado+')</span>':''}</h4>
                <p class=\"usuario-rol administrador\"><i class=\"fas fa-door-open\"></i> ${p.tipo_espacio||''}</p>
                <div class=\"usuario-details\">
                    <p><i class=\"fas fa-ruler-combined\"></i> ${p.metros_cuadrados} m²</p>
                    <p><i class=\"fas fa-map-marker-alt\"></i> ${(p.nombre_region||'')}${p.nombre_ciudad? ', '+p.nombre_ciudad:''}</p>
                    <p><i class=\"fas fa-location-arrow\"></i> ${p.direccion||''}</p>
                    <p><i class=\"fas fa-dollar-sign\"></i> ${p.precio_arriendo}</p>
                    ${(p.propietario_nombre||p.propietario_apellido) ? `<p><i class=\"fas fa-user fa-fw\"></i> ${[p.propietario_nombre||'', p.propietario_apellido||''].join(' ').trim()}</p>` : ''}
                </div>
            </div>
            <div class=\"usuario-actions\">
                <button class=\"edit-btn\" title=\"Editar\" onclick=\"abrirModalPublicacion(${p.id_publicacion})\"><i class=\"fas fa-edit\"></i></button>
                <button class=\"delete-btn\" title=\"Eliminar\" onclick=\"confirmarEliminarPublicacion(${p.id_publicacion})\"><i class=\"fas fa-trash\"></i></button>
            </div>
        </div>
    `).join('');
}

async function abrirModalPublicacion(id_publicacion){
    let pub = null;
    try{
        const fd = new FormData(); fd.append('action','obtener_publicacion'); fd.append('id_publicacion', id_publicacion);
        const resp = await fetch('../backend/public/gestionarespacios.php', { method:'POST', body: fd });
        const data = await resp.json();
        if (data.success) pub = data.publicacion; else { mostrarCardEmergente(false, data.message||'No se encontró la publicación'); return; }
    } catch(e){ console.error('Error obtener publicación', e); mostrarCardEmergente(false,'Error al obtener publicación'); return; }
    const html = plantillaModalPublicacion('Editar Publicación', pub);
    document.body.insertAdjacentHTML('beforeend', html);
    await cargarRegionesCiudadesPublicacion(pub?.nombre_region||null, pub?.nombre_ciudad||null);
    const form = document.getElementById('formPublicacion');
    form.addEventListener('submit', (e)=>{ e.preventDefault(); guardarPublicacion(pub.id_publicacion); });
}

function plantillaModalPublicacion(titulo, pub){
    return `
    <div class=\"modal-overlay\" id=\"modalPublicacionOverlay\"> 
        <div class=\"modal-content modal-adminsistema modal-publicacion\"> 
            <div class=\"modal-header\"> 
                <h3><i class=\"fas fa-bullhorn\"></i> ${titulo}</h3>
                <button class=\"close-modal\" onclick=\"cerrarModalPublicacion()\"><i class=\"fas fa-times\"></i></button>
            </div>
            <div class=\"modal-body\"> 
                <form id=\"formPublicacion\"> 
                    <div class=\"form-row\"> 
                        <div class=\"form-group\"> 
                            <label>Título</label> 
                            <input type=\"text\" id=\"pub_titulo\" value=\"${pub.titulo||''}\" required> 
                        </div>
                        <div class=\"form-group\"> 
                            <label>Tipo de Espacio</label> 
                            <input type=\"text\" id=\"pub_tipo\" value=\"${pub.tipo_espacio||''}\" required> 
                        </div>
                    </div>
                    <div class=\"form-row\"> 
                        <div class=\"form-group\"> 
                            <label>Metros Cuadrados</label> 
                            <input type=\"number\" step=\"0.01\" id=\"pub_metros\" value=\"${pub.metros_cuadrados||''}\" required> 
                        </div>
                        <div class=\"form-group\"> 
                            <label>Precio Arriendo</label> 
                            <input type=\"number\" step=\"0.01\" id=\"pub_precio\" value=\"${pub.precio_arriendo||''}\" required> 
                        </div>
                    </div>
                    <div class=\"form-row\"> 
                        <div class=\"form-group\"> 
                            <label>Región</label> 
                            <select id=\"pub_region\"><option value=\"\">Selecciona una región</option></select> 
                        </div>
                        <div class=\"form-group\"> 
                            <label>Ciudad</label> 
                            <select id=\"pub_ciudad\"><option value=\"\">Selecciona una ciudad</option></select> 
                        </div>
                    </div>
                    <div class=\"form-group\"> 
                        <label>Dirección</label> 
                        <input type=\"text\" id=\"pub_direccion\" value=\"${pub.direccion||''}\" required> 
                    </div>
                    <div class=\"form-group\"> 
                        <label><i class=\"fas fa-user fa-fw\"></i> Propietario (Usuario)</label> 
                        <input type=\"text\" id=\"pub_propietario\" value=\"${[(pub.propietario_nombre||''),(pub.propietario_apellido||'')].join(' ').trim()}\" disabled> 
                    </div>
                    <div class=\"form-group\"> 
                        <label>Descripción</label> 
                        <textarea id=\"pub_descripcion\" rows=\"4\">${pub.descripcion||''}</textarea> 
                    </div>
                    <div class=\"form-row\"> 
                        <div class=\"form-group\"> 
                            <label>Estado</label> 
                            <select id=\"pub_estado\"> 
                                <option value=\"Publicado\" ${pub.estado==='Publicado'?'selected':''}>Publicado</option>
                                <option value=\"Reservado\" ${pub.estado==='Reservado'?'selected':''}>Reservado</option>
                                <option value=\"Finalizado\" ${pub.estado==='Finalizado'?'selected':''}>Finalizado</option>
                            </select>
                        </div>
                        <div class=\"form-group\"> 
                            <label>Equipamiento (texto)</label> 
                            <input type=\"text\" id=\"pub_equipamiento\" value=\"${pub.equipamiento||''}\"> 
                        </div>
                    </div>
                    <div class=\"modal-actions\"> 
                        <button type=\"button\" class=\"cancel-btn\" onclick=\"cerrarModalPublicacion()\"><i class=\"fas fa-times\"></i> Cancelar</button> 
                        <button type=\"submit\" class=\"submit-btn\"><i class=\"fas fa-save\"></i> Guardar</button> 
                    </div>
                </form>
            </div>
        </div>
    </div>`;
}

function cerrarModalPublicacion(){
    const overlay = document.getElementById('modalPublicacionOverlay'); if (overlay) overlay.remove();
}

async function cargarRegionesCiudadesPublicacion(regionActual=null, ciudadActual=null){
    try{
        const resp = await fetch('../backend/public/regiones_chile.php');
        const data = await resp.json();
        const selRegion = document.getElementById('pub_region');
        const selCiudad = document.getElementById('pub_ciudad');
        if (selRegion){
            selRegion.innerHTML = '<option value="">Selecciona una región</option>';
            if (data.success && data.regiones){
                data.regiones.forEach(r=>{
                    const nom = r.nombre_region || r.nombre;
                    const opt = document.createElement('option'); opt.value = nom; opt.textContent = nom; if (regionActual && nom===regionActual) opt.selected=true; selRegion.appendChild(opt);
                });
            }
            selRegion.addEventListener('change', async function(){ await cargarCiudadesPublicacion(this.value, null); });
        }
        if (regionActual){ await cargarCiudadesPublicacion(regionActual, ciudadActual); }
    } catch(e){ console.error('Error cargar regiones publicación', e); }
}

async function cargarCiudadesPublicacion(regionNombre, ciudadActual=null){
    try{
        const regionesResp = await fetch('../backend/public/regiones_chile.php?action=regiones');
        const regionesData = await regionesResp.json();
        const regObj = (regionesData.regiones||[]).find(r => (r.nombre_region||r.nombre)===regionNombre);
        if (!regObj) return;
        const resp = await fetch(`../backend/public/regiones_chile.php?action=ciudades&id_region=${regObj.id_region}`);
        const data = await resp.json();
        const selCiudad = document.getElementById('pub_ciudad');
        if (selCiudad){
            selCiudad.innerHTML = '<option value="">Selecciona una ciudad</option>';
            if (data.success && data.ciudades){
                data.ciudades.forEach(c=>{
                    const nom = c.nombre_ciudad || c.nombre;
                    const opt = document.createElement('option'); opt.value = nom; opt.textContent = nom; if (ciudadActual && nom===ciudadActual) opt.selected=true; selCiudad.appendChild(opt);
                });
            }
        }
    } catch(e){ console.error('Error cargar ciudades publicación', e); }
}

async function guardarPublicacion(id_publicacion){
    try{
        const fd = new FormData();
        fd.append('action','actualizar_publicacion');
        fd.append('id_publicacion', id_publicacion);
        fd.append('titulo', document.getElementById('pub_titulo').value.trim());
        fd.append('descripcion', document.getElementById('pub_descripcion').value.trim());
        fd.append('tipo_espacio', document.getElementById('pub_tipo').value.trim());
        fd.append('metros_cuadrados', document.getElementById('pub_metros').value.trim());
        fd.append('region', document.getElementById('pub_region').value);
        fd.append('ciudad', document.getElementById('pub_ciudad').value);
        fd.append('direccion', document.getElementById('pub_direccion').value.trim());
        fd.append('precio_arriendo', document.getElementById('pub_precio').value.trim());
        fd.append('estado', document.getElementById('pub_estado').value);
        fd.append('equipamiento', document.getElementById('pub_equipamiento').value.trim());
        const resp = await fetch('../backend/public/gestionarespacios.php', { method:'POST', body: fd });
        const data = await resp.json();
        if (!data.success){ mostrarCardEmergente(false, data.message||'Error al guardar'); return; }
        mostrarCardEmergente(true, data.message||'Publicación actualizada');
        cerrarModalPublicacion();
        const fuente = document.getElementById('espFuenteSelect').value; if (fuente==='publicararriendo') cargarPublicaciones(); else cargarEspacios();
    } catch(e){ console.error('Error guardar publicación', e); mostrarCardEmergente(false,'Error al guardar publicación'); }
}

function confirmarEliminarPublicacion(id_publicacion){
    const existing = document.getElementById('confirmDeleteOverlay'); if (existing) existing.remove();
    const html = `
    <div class=\"modal-overlay\" id=\"confirmDeleteOverlay\"> 
        <div class=\"confirmation-modal\"> 
            <div class=\"confirmation-header\"> 
                <i class=\"fas fa-exclamation-triangle\"></i> 
                <h3>Confirmar Eliminación</h3> 
            </div> 
            <div class=\"confirmation-body\"> 
                <p>¿Estás seguro de que deseas eliminar esta publicación?</p> 
                <p class=\"confirmation-warning\">Esta acción no se puede deshacer.</p> 
            </div> 
            <div class=\"confirmation-actions\"> 
                <button class=\"btn-cancel\" onclick=\"cerrarConfirmEliminar()\"><i class=\"fas fa-times\"></i> Cancelar</button> 
                <button class=\"btn-confirm-delete\" onclick=\"confirmarEliminarPublicacionExec(${id_publicacion})\"><i class=\"fas fa-trash\"></i> Eliminar</button> 
            </div> 
        </div> 
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

async function confirmarEliminarPublicacionExec(id_publicacion){
    try{
        const fd = new FormData(); fd.append('action','eliminar_publicacion'); fd.append('id_publicacion', id_publicacion);
        const resp = await fetch('../backend/public/gestionarespacios.php', { method:'POST', body: fd });
        const data = await resp.json();
        if (!data.success){ mostrarCardEmergente(false, data.message||'Error al eliminar publicación'); }
        else { mostrarCardEmergente(true, data.message||'Publicación eliminada'); }
        cerrarConfirmEliminar();
        const fuente = document.getElementById('espFuenteSelect').value; if (fuente==='publicararriendo') cargarPublicaciones(); else cargarEspacios();
    } catch(e){ console.error('Error eliminar publicación', e); mostrarCardEmergente(false,'Error al eliminar publicación'); cerrarConfirmEliminar(); }
}

function plantillaModalEspacio(titulo, espacio=null){
    const isEdit = !!espacio;
    return `
    <div class="modal-overlay" id="modalEspacioOverlay">
        <div class="modal-content modal-adminsistema modal-espacio">
            <div class="modal-header">
                <h3><i class="fas fa-warehouse"></i> ${titulo}</h3>
                <button class="close-modal" onclick="cerrarModalEspacio()"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <form id="formEspacio">
                    ${isEdit ? `<input type=\"hidden\" id=\"id_espacio\" value=\"${espacio.id_espacio}\">` : ''}
                    <div class="form-row">
                        <div class="form-group">
                            <label>Nombre del Espacio</label>
                            <input type="text" id="esp_nombre" value="${isEdit ? (espacio.nombre_espacio||'') : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Tipo de Espacio</label>
                            <input type="text" id="esp_tipo" value="${isEdit ? (espacio.tipo_espacio||'') : ''}" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Metros Cuadrados</label>
                            <input type="number" step="0.01" id="esp_metros" value="${isEdit ? (espacio.metros_cuadrados||'') : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Ubicación Interna</label>
                            <input type="text" id="esp_ubicacion" value="${isEdit ? (espacio.ubicacion_interna||'') : ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Región</label>
                            <select id="esp_region"><option value="">Selecciona una región</option></select>
                        </div>
                        <div class="form-group">
                            <label>Ciudad</label>
                            <select id="esp_ciudad"><option value="">Selecciona una ciudad</option></select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Dirección</label>
                        <input type="text" id="esp_direccion" value="${isEdit ? (espacio.direccion||'') : ''}" required>
                    </div>
                    ${isEdit ? `
                    <div class="form-group">
                        <label>Propietario (Usuario)</label>
                        <input type="text" id="esp_propietario" value="${((espacio.propietario_nombre||'') + ' ' + (espacio.propietario_apellido||'')).trim()}" disabled>
                    </div>
                    <input type="hidden" id="esp_owner_id" value="${espacio.id_usuario_propietario||''}">
                    ` : ''}
                    <div class="modal-actions">
                        <button type="button" class="cancel-btn" onclick="cerrarModalEspacio()"><i class="fas fa-times"></i> Cancelar</button>
                        <button type="submit" class="submit-btn"><i class="fas fa-save"></i> Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>`;
}

async function abrirModalEspacio(id=null){
    let espacio = null;
    if (id){
        try {
            const fd = new FormData(); fd.append('action','obtener_espacio_sistema_por_id'); fd.append('id_espacio', id);
            const resp = await fetch('../backend/public/gestionarespacios.php',{ method:'POST', body: fd });
            const data = await resp.json();
            if (data.success) { espacio = data.espacio; }
        } catch(e){ console.error('Error obtener espacio', e); }
    }
    const html = plantillaModalEspacio(id? 'Editar Espacio' : 'Registrar Espacio', espacio);
    document.body.insertAdjacentHTML('beforeend', html);
    await cargarRegionesCiudadesEspacio(espacio?.nombre_region || null, espacio?.nombre_ciudad || null);
    const form = document.getElementById('formEspacio');
    form.addEventListener('submit', (e)=>{ e.preventDefault(); guardarEspacio(!!id); });
}

function cerrarModalEspacio(){
    const overlay = document.getElementById('modalEspacioOverlay');
    if (overlay) overlay.remove();
}

async function cargarRegionesCiudadesEspacio(regionActual=null, ciudadActual=null){
    try{
        const resp = await fetch('../backend/public/regiones_chile.php');
        const data = await resp.json();
        const selRegion = document.getElementById('esp_region');
        const selCiudad = document.getElementById('esp_ciudad');
        if (selRegion){
            selRegion.innerHTML = '<option value="">Selecciona una región</option>';
            if (data.success && data.regiones){
                data.regiones.forEach(r=>{
                    const nom = r.nombre_region || r.nombre;
                    const opt = document.createElement('option'); opt.value = nom; opt.textContent = nom; if (regionActual && nom===regionActual) opt.selected=true; selRegion.appendChild(opt);
                });
            }
            selRegion.addEventListener('change', async function(){ await cargarCiudadesEspacio(this.value, null); });
        }
        if (regionActual){ await cargarCiudadesEspacio(regionActual, ciudadActual); }
    } catch(e){ console.error('Error cargar regiones espacio', e); }
}

async function cargarCiudadesEspacio(regionNombre, ciudadActual=null){
    try{
        const regionesResp = await fetch('../backend/public/regiones_chile.php?action=regiones');
        const regionesData = await regionesResp.json();
        const regObj = (regionesData.regiones||[]).find(r => (r.nombre_region||r.nombre)===regionNombre);
        if (!regObj) return;
        const resp = await fetch(`../backend/public/regiones_chile.php?action=ciudades&id_region=${regObj.id_region}`);
        const data = await resp.json();
        const selCiudad = document.getElementById('esp_ciudad');
        if (selCiudad){
            selCiudad.innerHTML = '<option value="">Selecciona una ciudad</option>';
            if (data.success && data.ciudades){
                data.ciudades.forEach(c=>{
                    const nom = c.nombre_ciudad || c.nombre;
                    const opt = document.createElement('option'); opt.value = nom; opt.textContent = nom; if (ciudadActual && nom===ciudadActual) opt.selected=true; selCiudad.appendChild(opt);
                });
            }
        }
    } catch(e){ console.error('Error cargar ciudades espacio', e); }
}

async function guardarEspacio(isEdit){
    try{
        const sel = document.getElementById('espAdminSelect');
        let adminId = null;
        if (isEdit) {
            const owner = document.getElementById('esp_owner_id');
            if (owner && owner.value) { adminId = parseInt(owner.value); }
        }
        if (!adminId) {
            if (sel && sel.value) { adminId = parseInt(sel.value); }
            else { const usuario = JSON.parse(sessionStorage.getItem('usuario_logueado')); adminId = usuario.id_usuario; }
        }
        const fd = new FormData();
        fd.append('action', isEdit? 'actualizar_espacio':'registrar_espacio');
        if (isEdit){ fd.append('id_espacio', document.getElementById('id_espacio').value); }
        fd.append('id_administrador', adminId);
        fd.append('nombre_espacio', document.getElementById('esp_nombre').value.trim());
        fd.append('tipo_espacio', document.getElementById('esp_tipo').value.trim());
        fd.append('metros_cuadrados', document.getElementById('esp_metros').value.trim());
        fd.append('region', document.getElementById('esp_region').value);
        fd.append('ciudad', document.getElementById('esp_ciudad').value);
        fd.append('direccion', document.getElementById('esp_direccion').value.trim());
        fd.append('ubicacion_interna', document.getElementById('esp_ubicacion').value.trim());
        const resp = await fetch('../backend/public/gestionarespacios.php', { method:'POST', body: fd });
        const text = await resp.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch(parseErr) {
            console.error('Respuesta del servidor:', text);
            cerrarModalEspacio();
            mostrarCardEmergente(false, 'Error: respuesta inválida del servidor');
            return;
        }
        if (!data.success){ cerrarModalEspacio(); mostrarCardEmergente(false, data.message || 'Error al guardar espacio'); return; }
        cerrarModalEspacio();
        mostrarCardEmergente(true, data.message || 'Espacio guardado');
        cargarEspacios();
    } catch(e){ console.error('Error guardar espacio', e); cerrarModalEspacio(); mostrarCardEmergente(false,'Error al guardar espacio'); }
}

function confirmarEliminarEspacio(id_espacio){
    const existing = document.getElementById('confirmDeleteOverlay'); if (existing) existing.remove();
    const html = `
    <div class="modal-overlay" id="confirmDeleteOverlay">
        <div class="confirmation-modal">
            <div class="confirmation-header">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Confirmar Eliminación</h3>
            </div>
            <div class="confirmation-body">
                <p>¿Estás seguro de que deseas eliminar este espacio?</p>
                <p class="confirmation-warning">Esta acción no se puede deshacer.</p>
            </div>
            <div class="confirmation-actions">
                <button class="btn-cancel" onclick="cerrarConfirmEliminar()">
                    <i class="fas fa-times"></i> Cancelar
                </button>
                <button class="btn-confirm-delete" onclick="confirmarEliminarEspacioExec(${id_espacio})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

async function confirmarEliminarEspacioExec(id_espacio){
    try{
        const usuario = JSON.parse(sessionStorage.getItem('usuario_logueado'));
        const fd = new FormData(); fd.append('action','eliminar_espacio'); fd.append('id_espacio', id_espacio); fd.append('id_administrador', usuario.id_usuario);
        const resp = await fetch('../backend/public/gestionarespacios.php', { method:'POST', body: fd });
        const data = await resp.json();
        if (!data.success){ mostrarCardEmergente(false, data.message||'Error al eliminar'); } else { mostrarCardEmergente(true, data.message||'Espacio eliminado'); }
        cerrarConfirmEliminar();
        cargarEspacios();
    } catch(e){ console.error('Error eliminar espacio', e); mostrarCardEmergente(false,'Error al eliminar espacio'); cerrarConfirmEliminar(); }
}

// ========= Gestionar Clientes =========
async function cargarClientes(filtro = '') {
    try {
        const tipoSel = document.getElementById('reporteTipo');
        const roles = tipoSel ? [tipoSel.value] : ['Cliente'];
        const resp = await fetch('../backend/public/gestionar_clientes.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'listar', filtro, roles })
        });
        const data = await resp.json();
        if (!data.success) {
            console.error('Error listar clientes:', data.message);
            mostrarCardEmergente(false, 'Error al listar clientes');
            return;
        }
        let lista = data.clientes || [];
        const q = filtro ? filtro.trim().toLowerCase() : '';
        if (q) {
            // Buscar coincidencia EXACTA por RUT completo o nombre completo
            const exact = lista.find(u => {
                const rut = (u.rut || '').toLowerCase();
                const nombreCompleto = ((u.nombre || '') + ' ' + (u.apellido || '')).trim().toLowerCase();
                return rut === q || nombreCompleto === q;
            });
            if (exact) {
                lista = [exact];
            } else {
                // Fallback: filtrar por incluye en RUT o nombre/apellido
                lista = lista.filter(u => {
                    const rut = (u.rut || '').toLowerCase();
                    const nombre = (u.nombre || '').toLowerCase();
                    const apellido = (u.apellido || '').toLowerCase();
                    const nombreCompleto = (nombre + ' ' + apellido).trim();
                    return rut.includes(q) || nombre.includes(q) || apellido.includes(q) || nombreCompleto.includes(q);
                });
            }
        }
        renderClientes(lista);
    } catch (e) {
        console.error('Error listar clientes:', e);
        mostrarCardEmergente(false, 'Error al listar clientes');
    }
}

function renderClientes(clientes) {
    const grid = document.getElementById('clientesGrid');
    const count = document.getElementById('clientesCount');
    if (!grid) return;
    count.textContent = `Usuarios encontrados (${clientes.length})`;
    grid.innerHTML = clientes.map(c => `
        <div class="usuario-card" data-id="${c.id_usuario}">
            <div class="usuario-avatar">${(c.iniciales || 'CL')}</div>
            <div class="usuario-info">
                <h4>${c.nombre} ${c.apellido} ${c.activo ? '' : '<span style="color:#dc3545;font-weight:600;">(Inactivo)</span>'}</h4>
                <p class="usuario-rol ${(c.nombre_rol === 'Secretaria' ? 'colaboradores' : (c.nombre_rol||'cliente')).toLowerCase()}"><i class="fas fa-user-tag"></i> ${c.nombre_rol === 'Secretaria' ? 'Colaboradores' : (c.nombre_rol || 'Cliente')}</p>
                <div class="usuario-details">
                    <p><i class="fas fa-id-card"></i> ${c.rut || ''}</p>
                    <p><i class="fas fa-envelope"></i> ${c.correo_electronico || ''}</p>
                    <p><i class="fas fa-phone"></i> ${c.telefono || 'No especificado'}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${c.nombre_region || 'Sin región'}${c.nombre_ciudad ? ', ' + c.nombre_ciudad : ''}</p>
                    <p><i class="fas fa-user"></i> ${c.nombre_usuario || ''}</p>
                </div>
            </div>
            <div class="usuario-actions">
                <button class="edit-btn" title="Editar" onclick="abrirModalCliente(${c.id_usuario})"><i class="fas fa-edit"></i></button>
                ${c.activo ? `
                    <button class=\"delete-btn\" title=\"Eliminar\" onclick=\"confirmarEliminarUsuario(${c.id_usuario})\"><i class=\"fas fa-trash\"></i></button>
                ` : `
                    <button class="activate-btn" title="Activar" onclick="activarCliente(${c.id_usuario})"><i class="fas fa-undo"></i></button>
                `}
            </div>
        </div>
    `).join('');
}

// Confirmación para eliminar usuario definitivamente
function confirmarEliminarUsuario(id_usuario) {
    const existing = document.getElementById('confirmDeleteOverlay');
    if (existing) existing.remove();
    const html = `
    <div class="modal-overlay" id="confirmDeleteOverlay">
        <div class="confirmation-modal">
            <div class="confirmation-header">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Confirmar Eliminación</h3>
            </div>
            <div class="confirmation-body">
                <p>¿Estás seguro de que deseas eliminar este usuario?</p>
                <p class="confirmation-warning">Esta acción no se puede deshacer.</p>
            </div>
            <div class="confirmation-actions">
                <button class="btn-cancel" onclick="cerrarConfirmEliminar()">
                    <i class="fas fa-times"></i> Cancelar
                </button>
                <button class="btn-confirm-delete" onclick="confirmarEliminarUsuarioExec(${id_usuario})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

function cerrarConfirmEliminar() {
    const overlay = document.getElementById('confirmDeleteOverlay');
    if (overlay) overlay.remove();
}

async function confirmarEliminarUsuarioExec(id_usuario) {
    await eliminarCliente(id_usuario);
    cerrarConfirmEliminar();
}

function plantillaModalCliente(titulo, cliente = null) {
    const isEdit = !!cliente;
    return `
    <div class="modal-overlay" id="modalClienteOverlay">
        <div class="modal-content modal-adminsistema" style="max-width: 720px;">
            <div class="modal-header">
                <h3><i class="fas fa-user"></i> ${titulo}</h3>
                <button class="close-modal" onclick="cerrarModalCliente()"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <form id="formCliente">
                    ${isEdit ? `<input type="hidden" id="cliente_id" value="${cliente.id_usuario}">` : ''}
                    ${isEdit && cliente?.nombre_rol ? `<input type=\"hidden\" id=\"cli_rol\" value=\"${cliente.nombre_rol}\">` : ''}
                    <div class="form-row">
                        <div class="form-group">
                            <label>RUT Número</label>
                            <input type="number" id="cli_rut_numero" ${isEdit ? `value="${(cliente.rut||'').split('-')[0] || ''}"` : ''} ${isEdit ? '' : 'required'}>
                        </div>
                        <div class="form-group">
                            <label>DV</label>
                            <input type="text" id="cli_rut_dv" maxlength="1" ${isEdit ? `value="${(cliente.rut||'').split('-')[1] || ''}"` : ''} ${isEdit ? '' : 'required'}>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Nombre</label>
                            <input type="text" id="cli_nombre" value="${isEdit ? (cliente.nombre||'') : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Apellido</label>
                            <input type="text" id="cli_apellido" value="${isEdit ? (cliente.apellido||'') : ''}" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Teléfono</label>
                            <input type="tel" id="cli_telefono" value="${isEdit ? (cliente.telefono||'') : ''}">
                        </div>
                        <div class="form-group">
                            <label>Dirección</label>
                            <input type="text" id="cli_direccion" value="${isEdit ? (cliente.direccion||'') : ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Región</label>
                            <select id="cli_region"><option value="">Selecciona una región</option></select>
                        </div>
                        <div class="form-group">
                            <label>Ciudad</label>
                            <select id="cli_ciudad"><option value="">Selecciona una ciudad</option></select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Nombre de Usuario</label>
                            <input type="text" id="cli_nombre_usuario" value="${isEdit ? (cliente.nombre_usuario||'') : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>Correo Electrónico</label>
                            <input type="email" id="cli_correo" value="${isEdit ? (cliente.correo_electronico||'') : ''}" required>
                        </div>
                    </div>
                    ${isEdit && cliente?.nombre_rol === 'Administrador' ? `
                        <div class=\"form-group\">
                            <label>Suscripción</label>
                            <select id=\"cli_suscripcion\"><option value=\"\">Cargando suscripciones...</option></select>
                        </div>
                    ` : ''}
                    ${isEdit ? `
                        <div class="form-group">
                            <label>Nueva Contraseña (opcional)</label>
                            <input type="password" id="cli_contrasena" placeholder="Dejar vacío para mantener">
                        </div>
                    ` : `
                        <div class="form-row">
                            <div class="form-group">
                                <label>Contraseña</label>
                                <input type="password" id="cli_contrasena" required>
                            </div>
                        </div>
                    `}
                    <div class="modal-actions">
                        <button type="button" class="cancel-btn" onclick="cerrarModalCliente()"><i class="fas fa-times"></i> Cancelar</button>
                        <button type="submit" class="submit-btn"><i class="fas fa-save"></i> Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>`;
}

async function abrirModalCliente(id = null) {
    let cliente = null;
    if (id) {
        // Obtener por ID sin depender del rol seleccionado
        try {
            const resp = await fetch('../backend/public/gestionar_clientes.php', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'obtener_por_id', id_usuario: id })
            });
            const data = await resp.json();
            if (data.success) {
                cliente = data.usuario;
            }
        } catch (e) { console.error('Error cargar usuario por id', e); }
    }
    let tituloModal = id ? 'Editar Cliente' : 'Registrar Cliente';
    if (id && cliente && cliente.nombre_rol) {
        const rolNorm = String(cliente.nombre_rol).toLowerCase();
        if (rolNorm.includes('admin')) {
            tituloModal = 'Editar Administrador';
        } else if (rolNorm.includes('secretaria') || rolNorm.includes('colab')) {
            tituloModal = 'Editar Colaborador';
        } else if (rolNorm.includes('cliente')) {
            tituloModal = 'Editar Cliente';
        }
    }
    const html = plantillaModalCliente(tituloModal, cliente);
    document.body.insertAdjacentHTML('beforeend', html);
    await cargarRegionesEnClienteModal(cliente?.nombre_region || null, cliente?.nombre_ciudad || null);
    const form = document.getElementById('formCliente');
    form.addEventListener('submit', (e) => { e.preventDefault(); guardarCliente(!!id); });
    // Si es Administrador, cargar suscripciones y seleccionar la actual
    if (cliente && cliente.nombre_rol === 'Administrador') {
        try {
            const resp = await fetch('../backend/public/suscripciones.php?action=listar');
            const data = await resp.json();
            const sel = document.getElementById('cli_suscripcion');
            if (sel) {
                sel.innerHTML = '';
                if (data.success && Array.isArray(data.suscripciones)) {
                    data.suscripciones.forEach(s => {
                        const opt = document.createElement('option');
                        // Ahora la API devuelve planes; usar id_plan/nombre_plan
                        opt.value = s.id_plan;
                        opt.textContent = `${s.nombre_plan} (${s.cantidad_espacios})`;
                        // Selección no puede compararse por id_suscripcion; mantener selección vacía por ahora
                        sel.appendChild(opt);
                    });
                } else {
                    const opt = document.createElement('option'); opt.value = ''; opt.textContent = 'No hay suscripciones'; sel.appendChild(opt);
                }
            }
        } catch (e) { console.error('Error al cargar suscripciones', e); }
    }
}

function cerrarModalCliente() {
    const overlay = document.getElementById('modalClienteOverlay');
    if (overlay) overlay.remove();
}

async function cargarRegionesEnClienteModal(regionActual = null, ciudadActual = null) {
    try {
        const resp = await fetch('../backend/public/regiones_chile.php');
        const data = await resp.json();
        const selRegion = document.getElementById('cli_region');
        const selCiudad = document.getElementById('cli_ciudad');
        if (selRegion) {
            selRegion.innerHTML = '<option value="">Selecciona una región</option>';
            if (data.success && data.regiones) {
                (data.regiones).forEach(r => {
                    const nombre = r.nombre_region || r.nombre;
                    const opt = document.createElement('option');
                    opt.value = nombre; opt.textContent = nombre; if (regionActual && nombre === regionActual) opt.selected = true; selRegion.appendChild(opt);
                });
            }
            selRegion.addEventListener('change', async function() {
                await cargarCiudadesClienteModal(this.value, null);
            });
        }
        if (regionActual) await cargarCiudadesClienteModal(regionActual, ciudadActual);
    } catch (e) { console.error('Error regiones cliente modal', e); }
}

async function cargarCiudadesClienteModal(regionNombre, ciudadActual = null) {
    try {
        const regionesResp = await fetch('../backend/public/regiones_chile.php?action=regiones');
        const regionesData = await regionesResp.json();
        const regionObj = (regionesData.regiones || []).find(r => (r.nombre_region || r.nombre) === regionNombre);
        if (!regionObj) return;
        const resp = await fetch(`../backend/public/regiones_chile.php?action=ciudades&id_region=${regionObj.id_region}`);
        const data = await resp.json();
        const selCiudad = document.getElementById('cli_ciudad');
        if (selCiudad) {
            selCiudad.innerHTML = '<option value="">Selecciona una ciudad</option>';
            if (data.success && data.ciudades) {
                data.ciudades.forEach(c => {
                    const nombre = c.nombre_ciudad || c.nombre;
                    const opt = document.createElement('option');
                    opt.value = nombre; opt.textContent = nombre; if (ciudadActual && nombre === ciudadActual) opt.selected = true; selCiudad.appendChild(opt);
                });
            }
        }
    } catch (e) { console.error('Error ciudades cliente modal', e); }
}

async function guardarCliente(isEdit) {
    const id = isEdit ? document.getElementById('cliente_id').value : null;
    const rol = isEdit ? (document.getElementById('cli_rol')?.value || '') : '';
    const rut_numero = document.getElementById('cli_rut_numero').value;
    const rut_dv = document.getElementById('cli_rut_dv').value.toUpperCase();
    const nombre = document.getElementById('cli_nombre').value.trim();
    const apellido = document.getElementById('cli_apellido').value.trim();
    const telefono = document.getElementById('cli_telefono').value.trim();
    const region = document.getElementById('cli_region').value;
    const ciudad = document.getElementById('cli_ciudad').value;
    const direccion = document.getElementById('cli_direccion').value.trim();
    const nombre_usuario = document.getElementById('cli_nombre_usuario').value.trim();
    const correo_electronico = document.getElementById('cli_correo').value.trim();
    const contrasena = document.getElementById('cli_contrasena').value;
    const nuevaSuscripcion = document.getElementById('cli_suscripcion')?.value || '';

    const payload = {
        action: isEdit ? 'actualizar' : 'crear',
        id_usuario: isEdit ? parseInt(id) : undefined,
        rut_numero: rut_numero ? parseInt(rut_numero) : undefined,
        rut_dv: rut_dv || undefined,
        nombre, apellido, telefono, region, ciudad, direccion,
        nombre_usuario, correo_electronico, contrasena
    };

    try {
        const resp = await fetch('../backend/public/gestionar_clientes.php', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const data = await resp.json();
        if (!data.success) {
            mostrarCardEmergente(false, data.message || 'Error al guardar cliente');
            return;
        }
        // Si es Administrador y se eligió suscripción, actualizarla
        if (isEdit && rol === 'Administrador' && nuevaSuscripcion) {
            try {
                const respSus = await fetch('../backend/public/suscripciones.php', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    // Cambiado: enviar id_plan
                    body: JSON.stringify({ action: 'actualizar', id_administrador: parseInt(id), id_plan: parseInt(nuevaSuscripcion) })
                });
                const resSus = await respSus.json();
                if (!resSus.success) {
                    console.error('Error al actualizar suscripción:', resSus.message);
                }
            } catch (e) { console.error('Error al actualizar suscripción', e); }
        }
        mostrarCardEmergente(true, data.message || 'Guardado');
        cerrarModalCliente();
        cargarClientes(document.getElementById('reporteBuscar')?.value?.trim() || '');
    } catch (e) {
        console.error('Error guardar cliente', e);
        mostrarCardEmergente(false, 'Error al guardar cliente');
    }
}

async function eliminarCliente(id_usuario) {
    try {
        const resp = await fetch('../backend/public/gestionar_clientes.php', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'eliminar_definitivo', id_usuario })
        });
        const data = await resp.json();
        if (!data.success) { mostrarCardEmergente(false, data.message || 'Error'); return; }
        mostrarCardEmergente(true, data.message || 'Usuario eliminado');
        cargarClientes(document.getElementById('reporteBuscar')?.value?.trim() || '');
    } catch (e) {
        console.error('Error eliminar usuario', e);
        mostrarCardEmergente(false, 'Error al eliminar usuario');
    }
}

async function activarCliente(id_usuario) {
    try {
        const resp = await fetch('../backend/public/gestionar_clientes.php', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'activar', id_usuario })
        });
        const data = await resp.json();
        if (!data.success) { mostrarCardEmergente(false, data.message || 'Error'); return; }
        mostrarCardEmergente(true, data.message || 'Cliente activado');
        cargarClientes(document.getElementById('reporteBuscar')?.value?.trim() || '');
    } catch (e) {
        console.error('Error activar cliente', e);
        mostrarCardEmergente(false, 'Error al activar cliente');
    }
}

// Función para cargar usuarios del sistema
async function cargarUsuariosSistema() {
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    
    if (!usuarioLogueado) {
        console.error('No hay sesión activa');
        return;
    }
    
    try {
        const usuario = JSON.parse(usuarioLogueado);
        
        const response = await fetch('../backend/public/obtener_usuarios_sistema.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id_usuario_excluir: usuario.id_usuario
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            usuariosData = result.usuarios; // Almacenar datos globalmente
            mostrarListaUsuarios(result.usuarios);
        } else {
            console.error('Error al cargar usuarios:', result.message);
            mostrarCardEmergente(false, 'Error al cargar usuarios del sistema');
        }
        
    } catch (error) {
        console.error('Error al cargar usuarios del sistema:', error);
        mostrarCardEmergente(false, 'Error al cargar usuarios del sistema');
    }
}

// Función para mostrar la lista de usuarios
function mostrarListaUsuarios(usuarios) {
    const container = document.querySelector('.container');
    
    // Crear la sección de usuarios si no existe
    let usuariosSection = container.querySelector('.usuarios-sistema-section');
    if (!usuariosSection) {
        usuariosSection = document.createElement('div');
        usuariosSection.className = 'usuarios-sistema-section';
        
        // Insertar después del formulario de registro
        const registerSection = container.querySelector('.register-admin-section');
        if (registerSection) {
            registerSection.insertAdjacentElement('afterend', usuariosSection);
        }
    }
    
    usuariosSection.innerHTML = `
        <div class="usuarios-header">
            <h3><i class="fas fa-user-shield"></i> Administradores del Sistema</h3>
            <p>Lista de todos los AdminSistema registrados (${usuarios.length} administradores)</p>
        </div>
        
        <div class="usuarios-grid" id="usuariosGrid">
            ${generarHTMLUsuarios(usuarios)}
        </div>
    `;
    
}

// Función para generar HTML de usuarios
function generarHTMLUsuarios(usuarios) {
    return usuarios.map(usuario => `
        <div class="usuario-card" data-rol="${usuario.rol}" data-nombre="${usuario.nombre_completo.toLowerCase()}" data-rut="${usuario.rut.toLowerCase()}" data-email="${usuario.correo_electronico.toLowerCase()}">
            <div class="usuario-avatar">
                ${usuario.iniciales}
            </div>
            <div class="usuario-info">
                <h4>${usuario.nombre_completo}</h4>
                <p class="usuario-rol ${usuario.rol.toLowerCase().replace(' ', '-')}">
                    <i class="fas fa-user-tag"></i> ${usuario.rol}
                </p>
                <div class="usuario-details">
                    <p><i class="fas fa-id-card"></i> ${usuario.rut}</p>
                    <p><i class="fas fa-envelope"></i> ${usuario.correo_electronico}</p>
                    <p><i class="fas fa-phone"></i> ${usuario.telefono || 'No especificado'}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${usuario.region || 'No especificado'}${usuario.ciudad ? ', ' + usuario.ciudad : ''}</p>
                    ${usuario.suscripcion ? `<p><i class="fas fa-crown"></i> ${usuario.suscripcion}</p>` : ''}
                </div>
            </div>
                <div class="usuario-actions">
                    <button class="edit-btn" onclick="editarUsuario(${usuario.id_usuario})" title="Editar usuario">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="eliminarUsuario(${usuario.id_usuario})" title="Eliminar usuario">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
        </div>
    `).join('');
}

// Función para filtrar usuarios
function filtrarUsuarios(usuariosOriginales) {
    const buscarInput = document.getElementById('buscarUsuarios');
    const usuariosGrid = document.getElementById('usuariosGrid');
    
    if (!buscarInput || !usuariosGrid) return;
    
    const terminoBusqueda = buscarInput.value.toLowerCase();
    
    let usuariosFiltrados = usuariosOriginales;
    
    // Filtrar por término de búsqueda
    if (terminoBusqueda) {
        usuariosFiltrados = usuariosFiltrados.filter(usuario => 
            usuario.nombre_completo.toLowerCase().includes(terminoBusqueda) ||
            usuario.rut.toLowerCase().includes(terminoBusqueda) ||
            usuario.correo_electronico.toLowerCase().includes(terminoBusqueda) ||
            usuario.nombre_usuario.toLowerCase().includes(terminoBusqueda)
        );
    }
    
    // Actualizar el grid
    usuariosGrid.innerHTML = generarHTMLUsuarios(usuariosFiltrados);
    
    // Actualizar el contador
    const usuariosHeader = document.querySelector('.usuarios-header p');
    if (usuariosHeader) {
        usuariosHeader.textContent = `Lista de todos los AdminSistema registrados (${usuariosFiltrados.length} administradores)`;
    }
}

// Función para editar AdminSistema
async function editarUsuario(idUsuario) {
    try {
        // Buscar el usuario en la lista actual
        const usuario = usuariosData.find(u => u.id_usuario == idUsuario);
        if (!usuario) {
            mostrarCardEmergente(false, 'AdminSistema no encontrado');
            return;
        }
        
        // Llenar formulario del modal con datos del usuario
        document.getElementById('id_adminsistema_modal').value = usuario.id_usuario;
        document.getElementById('nombre_usuario_modal').value = usuario.nombre_usuario;
        document.getElementById('contrasena_modal').value = ''; // No mostrar contraseña actual
        
        // Separar RUT y DV
        const rutCompleto = usuario.rut || '';
        const rutPartes = rutCompleto.split('-');
        document.getElementById('rut_modal').value = rutPartes[0] || '';
        document.getElementById('dv_modal').value = rutPartes[1] || '';
        
        document.getElementById('nombre_modal').value = usuario.nombre;
        document.getElementById('apellido_modal').value = usuario.apellido;
        document.getElementById('correo_electronico_modal').value = usuario.correo_electronico;
        document.getElementById('telefono_modal').value = usuario.telefono || '';
        document.getElementById('region_modal').value = usuario.region || '';
        document.getElementById('ciudad_modal').value = usuario.ciudad || '';
        document.getElementById('direccion_modal').value = usuario.direccion || '';
        
        // Cargar regiones primero con la región actual seleccionada
        await cargarRegionesModalAdmin(usuario.region);
        
        // Si hay región, cargar ciudades
        if (usuario.region) {
            await cargarCiudadesModalAdmin(usuario.ciudad);
        }
        
        // Mostrar el modal
        document.getElementById('modalEditarAdminSistema').style.display = 'flex';
        
    } catch (error) {
        console.error('Error al editar AdminSistema:', error);
        mostrarCardEmergente(false, 'Error al cargar datos del AdminSistema');
    }
}

// Función para eliminar AdminSistema con confirmación
async function eliminarUsuario(idUsuario) {
    try {
        // Buscar el usuario en la lista actual
        const usuario = usuariosData.find(u => u.id_usuario == idUsuario);
        if (!usuario) {
            mostrarCardEmergente(false, 'AdminSistema no encontrado');
            return;
        }

        const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`;
        
        // Crear modal de confirmación
        const confirmacionModal = `
            <div class="modal-overlay" style="z-index: 10000;">
                <div class="confirmation-modal">
                    <div class="confirmation-header">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Confirmar Eliminación</h3>
                    </div>
                    <div class="confirmation-body">
                        <p>¿Estás seguro de que deseas eliminar el AdminSistema <strong>"${nombreCompleto}"</strong>?</p>
                        <p class="confirmation-warning">Esta acción no se puede deshacer.</p>
                    </div>
                    <div class="confirmation-actions">
                        <button class="btn-cancel" onclick="cerrarModalConfirmacion()">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                        <button class="btn-confirm-delete" onclick="confirmarEliminacion(${idUsuario})">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', confirmacionModal);
        
    } catch (error) {
        console.error('Error al mostrar confirmación:', error);
        mostrarCardEmergente(false, 'Error al cargar datos del AdminSistema');
    }
}

// Función para cerrar modal de confirmación
function cerrarModalConfirmacion() {
    const modal = document.querySelector('.confirmation-modal');
    if (modal) {
        modal.closest('.modal-overlay').remove();
    }
}

// Función para confirmar eliminación
async function confirmarEliminacion(idUsuario) {
    try {
        const response = await fetch('../backend/public/actualizar_perfil_admin_sistema.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'eliminar_adminsistema',
                id_usuario: idUsuario
            })
        });
        
        const data = await response.json();
        
        // Cerrar modal de confirmación
        cerrarModalConfirmacion();
        
        if (data.success) {
            mostrarCardEmergente(true, data.message);
            // Recargar la lista de usuarios
            cargarUsuariosSistema();
        } else {
            mostrarCardEmergente(false, data.message);
        }
    } catch (error) {
        console.error('Error al eliminar AdminSistema:', error);
        cerrarModalConfirmacion();
        mostrarCardEmergente(false, 'Error de conexión al eliminar AdminSistema');
    }
}

// Función para cerrar modal de editar AdminSistema
function cerrarModalEditarAdminSistema() {
    document.getElementById('modalEditarAdminSistema').style.display = 'none';
    
    // Limpiar formulario del modal
    document.getElementById('formEditarAdminSistema').reset();
    document.getElementById('id_adminsistema_modal').value = '';
}

// Función para cargar regiones en el modal
async function cargarRegionesModalAdmin(regionActual = null) {
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
async function cargarCiudadesModalAdmin(ciudadActual = null) {
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

// Función para actualizar AdminSistema
async function actualizarAdminSistema(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const idUsuario = document.getElementById('id_adminsistema_modal').value;
    
    // Preparar datos para enviar como JSON
    const datos = {
        action: 'actualizar_adminsistema',
        id_usuario: idUsuario,
        nombre_usuario: formData.get('nombre_usuario'),
        rut_numero: formData.get('rut_numero'),
        rut_dv: formData.get('rut_dv'),
        nombre: formData.get('nombre'),
        apellido: formData.get('apellido'),
        correo_electronico: formData.get('correo_electronico'),
        telefono: formData.get('telefono'),
        region: formData.get('region'),
        ciudad: formData.get('ciudad'),
        direccion: formData.get('direccion'),
        contrasena: formData.get('contrasena') || '' // Contraseña opcional
    };
    
    try {
        const response = await fetch('../backend/public/actualizar_perfil_admin_sistema.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datos)
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarCardEmergente(true, data.message);
            cerrarModalEditarAdminSistema();
            // Recargar la lista de usuarios
            cargarUsuariosSistema();
        } else {
            mostrarCardEmergente(false, data.message);
        }
    } catch (error) {
        console.error('Error al actualizar AdminSistema:', error);
        mostrarCardEmergente(false, 'Error de conexión al actualizar AdminSistema');
    }
}

async function cargarAdministradoresEspacios(){
    try{
        const resp = await fetch('../backend/public/gestionar_clientes.php', {
            method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'listar', roles:['Administrador'] })
        });
        const data = await resp.json();
        const sel = document.getElementById('espAdminSelect');
        if (!sel) { await cargarEspacios(); return; }
        sel.innerHTML = '';
        if (data.success){
            (data.clientes||[]).forEach(a => {
                const opt = document.createElement('option');
                opt.value = a.id_usuario; opt.textContent = `${a.nombre} ${a.apellido} (${a.rut})`;
                sel.appendChild(opt);
            });
        } else {
            const opt = document.createElement('option'); opt.value=''; opt.textContent='Sin administradores'; sel.appendChild(opt);
        }
        sel.addEventListener('change', ()=>{ cargarEspacios(); });
        // Cargar espacios del primero por defecto
        cargarEspacios();
    } catch(e){ console.error('Error cargar administradores', e); await cargarEspacios(); }
}

// ==================== GENERADOR DE REPORTES (ADMIN SISTEMA) ====================
let datosReporteActual = [];

async function inicializarGeneradorReportes() {
    try {
        await cargarRegionesParaReportes();
        const selRegion = document.getElementById('reporteRegion');
        if (selRegion) selRegion.onchange = actualizarCiudadesParaReportes;
    } catch {}

    const btnGenerar = document.getElementById('btnGenerarReporte');
    const btnExportar = document.getElementById('btnExportarPDF');
    if (btnGenerar) btnGenerar.onclick = generarReporteAdminSistema;
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

// ====== Utilidades de filtros de reportes ======
function normalizarFechaISO(valor) {
    try {
        if (!valor) return null;
        // Si viene como Date o timestamp
        if (valor instanceof Date) return valor;
        // Aceptar formatos comunes (YYYY-MM-DD, YYYY/MM/DD, ISO, dd-mm-aaaa)
        let v = String(valor).trim();
        if (!v) return null;
        // Convertir dd-mm-aaaa a yyyy-mm-dd
        if (/^\d{2}-\d{2}-\d{4}$/.test(v)) {
            const [d, m, y] = v.split('-');
            v = `${y}-${m}-${d}`;
        }
        // Reemplazar "/" por "-" si viene como yyyy/mm/dd
        v = v.replaceAll('/', '-');
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
    } catch { return null; }
}

function coincideRangoFechas(fechaValor, desde, hasta) {
    const f = normalizarFechaISO(fechaValor);
    if (!f) return true; // si no hay fecha en el registro, no bloquear
    const d = desde ? normalizarFechaISO(desde) : null;
    const h = hasta ? normalizarFechaISO(hasta) : null;
    if (d && f < d) return false;
    if (h && f > h) return false;
    return true;
}

function coincideRegionCiudad(item, filtros, camposRegion, camposCiudad) {
    const { region, ciudad } = filtros || {};
    const regiones = Array.isArray(camposRegion) ? camposRegion : [camposRegion];
    const ciudades = Array.isArray(camposCiudad) ? camposCiudad : [camposCiudad];
    const valorRegion = regiones.map(c => (item?.[c] ?? '')).find(v => v);
    const valorCiudad = ciudades.map(c => (item?.[c] ?? '')).find(v => v);
    if (region && (valorRegion || '') !== region) return false;
    if (ciudad && (valorCiudad || '') !== ciudad) return false;
    return true;
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
        tipo: (document.getElementById('reporteTipo')||{}).value || 'general',
        desde: (document.getElementById('reporteDesde')||{}).value || '',
        hasta: (document.getElementById('reporteHasta')||{}).value || '',
        region: (document.getElementById('reporteRegion')||{}).value || '',
        ciudad: (document.getElementById('reporteCiudad')||{}).value || ''
    };
}

async function generarReporteAdminSistema() {
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
            case 'general':
                data = await reporteGeneralSistema(filtros);
                break;
            case 'gestiondeespacio':
                data = await reporteGestionEspacios(filtros);
                break;
            case 'publicararriendo':
                data = await reportePublicacionesArriendo(filtros);
                break;
            case 'usuarios_por_tipo':
                data = await reporteUsuariosPorTipo(filtros);
                break;
            case 'suscripciones':
                data = await reporteSuscripciones(filtros);
                break;
            case 'actividad_reciente':
                data = await reporteActividadReciente(filtros);
                break;
            case 'estadisticas_uso':
                data = await reporteEstadisticasUso(filtros);
                break;
            case 'pagos':
                data = await reportePagosAdminSistema(filtros);
                break;
        }
        datosReporteActual = data;
        // Si es reporte general, usar renderizado especial
        if (filtros.tipo === 'general') {
            renderReporteGeneralAdminSistema(data);
        } else {
            renderTablaReporteAdminSistema(data);
        }
    } catch (e) {
        console.error('Error al generar reporte:', e);
        if (cont) cont.innerHTML = '<div style="color:#e74c3c;padding:1rem;">Error al generar el reporte</div>';
    }
}

function renderTablaReporteAdminSistema(rows) {
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
    html += '<tbody>';
    rows.forEach((r, idx) => {
        // Verificar si es una fila de resumen
        const col0 = r[cols[0]];
        const col1 = r[cols[1]];
        const isResumenHeader = col0 && col0.toString() === 'RESUMEN';
        const isResumenRow = !isResumenHeader && col0 && col0.toString() !== '' && col0.toString() !== 'RESUMEN' && col1 && (col1.toString().includes('TOTAL:') || col1.toString().includes('Cantidad:'));
        
        // Verificar si es una fila de separador de sección
        const isSeccionHeader = col0 && col0.toString().includes('===');
        
        if (isResumenHeader) {
            html += `<tr class="resumen-header">`;
            html += `<td colspan="${cols.length}" style="text-align:center;">${safeReporte(col0)}</td>`;
        } else if (isSeccionHeader) {
            html += `<tr class="resumen-header">`;
            html += `<td colspan="${cols.length}" style="text-align:center;font-size:1.1rem;padding:15px;">${safeReporte(col0)}</td>`;
        } else if (isResumenRow) {
            html += `<tr class="resumen-row">`;
            html += cols.map(c => `<td>${safeReporte(r[c])}</td>`).join('');
        } else {
            html += '<tr>';
            html += cols.map(c => `<td>${safeReporte(r[c])}</td>`).join('');
        }
        html += '</tr>';
    });
    html += '</tbody>';
    html += '</table></div>';
    cont.innerHTML = html;
    if (resumen) resumen.textContent = `Filas: ${rows.length}`;
    if (card) card.style.display = '';
}

function safeReporte(v) {
    if (v == null) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
}

function renderReporteGeneralAdminSistema(rows) {
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
    
    // Dividir las filas por secciones
    const secciones = [];
    let seccionActual = null;
    
    rows.forEach(row => {
        const col0 = row['Sección'];
        if (col0 && col0.toString().includes('===')) {
            // Nueva sección
            if (seccionActual) {
                secciones.push(seccionActual);
            }
            const nombreSeccion = col0.toString().replace(/===/g, '').trim();
            seccionActual = {
                nombre: nombreSeccion,
                filas: [],
                columnas: []
            };
        } else if (seccionActual) {
            // Agregar fila a la sección actual, pero solo si no está vacía
            const filaVacia = Object.values(row).every(v => !v || v.toString().trim() === '');
            if (!filaVacia) {
                seccionActual.filas.push(row);
                // Actualizar columnas únicas de la sección
                Object.keys(row).forEach(col => {
                    if (!seccionActual.columnas.includes(col)) {
                        seccionActual.columnas.push(col);
                    }
                });
            }
        }
    });
    
    // Agregar la última sección
    if (seccionActual) {
        secciones.push(seccionActual);
    }
    
    // Renderizar cada sección por separado
    let html = '<div class="reporte-general-container">';
    
    secciones.forEach((seccion, idx) => {
        if (seccion.filas.length === 0) return;
        
        // Filtrar columnas: solo las que tienen datos en al menos una fila
        const columnasConDatos = seccion.columnas.filter(col => {
            if (col === 'Sección') return false; // Siempre excluir columna Sección
            // Verificar si la columna tiene datos en al menos una fila
            return seccion.filas.some(fila => {
                const valor = fila[col];
                return valor !== undefined && valor !== null && valor.toString().trim() !== '';
            });
        });
        
        // Si no hay columnas con datos, saltar esta sección
        if (columnasConDatos.length === 0) return;
        
        html += `<div class="reporte-seccion">`;
        html += `<h4 class="reporte-seccion-titulo">${seccion.nombre}</h4>`;
        html += `<div class="reporte-seccion-tabla">`;
        html += `<div style="overflow-x:auto;"><table class="reports-table reports-table-seccion">`;
        
        // Encabezado
        html += '<thead><tr>';
        columnasConDatos.forEach(col => {
            html += `<th>${col}</th>`;
        });
        html += '</tr></thead>';
        
        // Cuerpo
        html += '<tbody>';
        seccion.filas.forEach(fila => {
            // Obtener el primer valor no vacío para detectar resumen
            const primeraColumna = columnasConDatos[0];
            const segundaColumna = columnasConDatos[1];
            const col0 = fila[primeraColumna];
            const col1 = segundaColumna ? fila[segundaColumna] : null;
            
            const isResumenHeader = col0 && col0.toString().trim() === 'RESUMEN';
            const hasResumenData = col1 && (col1.toString().includes('TOTAL:') || col1.toString().includes('Cantidad:'));
            const isResumenRow = !isResumenHeader && col0 && col0.toString().trim() !== '' && hasResumenData;
            
            // Verificar si la fila tiene datos (al menos una columna no vacía)
            const filaTieneDatos = columnasConDatos.some(col => {
                const valor = fila[col];
                return valor !== undefined && valor !== null && valor.toString().trim() !== '';
            });
            
            if (!filaTieneDatos) return; // Saltar filas completamente vacías
            
            if (isResumenHeader) {
                html += `<tr class="resumen-header">`;
                html += `<td colspan="${columnasConDatos.length}" style="text-align:center;">${safeReporte(col0)}</td>`;
            } else if (isResumenRow) {
                html += `<tr class="resumen-row">`;
                columnasConDatos.forEach(col => {
                    html += `<td>${safeReporte(fila[col])}</td>`;
                });
            } else {
                html += '<tr>';
                columnasConDatos.forEach(col => {
                    html += `<td>${safeReporte(fila[col])}</td>`;
                });
            }
            html += '</tr>';
        });
        html += '</tbody>';
        html += '</table></div>';
        html += `</div></div>`;
        
        // Agregar espacio entre secciones (excepto en la última)
        if (idx < secciones.length - 1) {
            html += '<div class="reporte-seccion-separador"></div>';
        }
    });
    
    html += '</div>';
    cont.innerHTML = html;
    if (resumen) resumen.textContent = `Secciones: ${secciones.length} | Total de filas: ${rows.length}`;
    if (card) card.style.display = '';
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

    // Verificar si es reporte general (tiene múltiples secciones)
    if (filtros.tipo === 'general') {
        exportarPDFReporteGeneral(doc, datosReporteActual, titulo, filtros, ahora);
    } else {
        // Reporte normal (una sola tabla)
        const cols = Object.keys(datosReporteActual[0]);
        const rows = datosReporteActual.map(r => cols.map(c => safeReporte(r[c])));

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
    }

    const nombre = `informe_${slugifyNombre(tipoTexto)}.pdf`;
    doc.save(nombre);
}

function agregarEncabezadoPaginaPDF(doc, titulo, subtitulo, filtros, ahora) {
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
}

function exportarPDFReporteGeneral(doc, rows, titulo, filtros, ahora) {
    // Dividir las filas por secciones (igual que en renderReporteGeneralAdminSistema)
    const secciones = [];
    let seccionActual = null;
    
    rows.forEach(row => {
        const col0 = row['Sección'];
        if (col0 && col0.toString().includes('===')) {
            if (seccionActual) {
                secciones.push(seccionActual);
            }
            const nombreSeccion = col0.toString().replace(/===/g, '').trim();
            seccionActual = {
                nombre: nombreSeccion,
                filas: [],
                columnas: []
            };
        } else if (seccionActual) {
            const filaVacia = Object.values(row).every(v => !v || v.toString().trim() === '');
            if (!filaVacia) {
                seccionActual.filas.push(row);
                Object.keys(row).forEach(col => {
                    if (!seccionActual.columnas.includes(col)) {
                        seccionActual.columnas.push(col);
                    }
                });
            }
        }
    });
    
    if (seccionActual) {
        secciones.push(seccionActual);
    }
    
    secciones.forEach((seccion, idx) => {
        if (seccion.filas.length === 0) return;
        
        // Nueva página para cada sección (excepto la primera que ya tiene encabezado)
        if (idx > 0) {
            doc.addPage();
            agregarEncabezadoPaginaPDF(doc, titulo, seccion.nombre, filtros, ahora);
        } else {
            // Primera sección: actualizar el subtítulo con el nombre de la sección
            // Sobrescribir el subtítulo genérico con el nombre específico de la sección
            doc.setFillColor(255, 255, 255);
            doc.rect(40, 56, 515, 18, 'F'); // Rectángulo blanco para limpiar el área
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(14);
            doc.setTextColor(26, 42, 62);
            doc.text(seccion.nombre, 40, 70);
        }
        
        // Filtrar columnas con datos (igual que en renderizado)
        const columnasConDatos = seccion.columnas.filter(col => {
            if (col === 'Sección') return false;
            return seccion.filas.some(fila => {
                const valor = fila[col];
                return valor !== undefined && valor !== null && valor.toString().trim() !== '';
            });
        });
        
        if (columnasConDatos.length === 0) return;
        
        // Filtrar filas vacías
        const filasConDatos = seccion.filas.filter(fila => {
            return columnasConDatos.some(col => {
                const valor = fila[col];
                return valor !== undefined && valor !== null && valor.toString().trim() !== '';
            });
        });
        
        if (filasConDatos.length === 0) return;
        
        // Preparar datos de la tabla
        const cols = columnasConDatos;
        const tableRows = filasConDatos.map(fila => {
            return cols.map(col => safeReporte(fila[col]));
        });
        
        if (doc.autoTable) {
            doc.autoTable({
                head: [cols],
                body: tableRows,
                startY: 140,
                styles: { fontSize: 8, cellPadding: 4, textColor: [44, 62, 80] },
                headStyles: { fillColor: [26, 42, 62], halign: 'left', fontSize: 8, textColor: [255, 255, 255] },
                margin: { left: 40, right: 40 }
            });
        } else {
            // Fallback simple
            let y = 150;
            doc.setFontSize(8);
            doc.text(cols.join(' | '), 40, y);
            y += 14;
            tableRows.forEach(r => {
                doc.text(String(r.join(' | ')).slice(0,100), 40, y);
                y += 12;
                if (y > 760) { doc.addPage(); y = 40; }
            });
        }
    });
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

// Funciones específicas de reportes
async function reporteGeneralSistema(filtros) {
    try {
        const resultado = [];
        
        // 1. Estadísticas de Uso (resumen general)
        const estadisticas = await reporteEstadisticasUso(filtros);
        if (estadisticas.length > 0) {
            resultado.push({
                'Sección': '=== ESTADÍSTICAS DE USO ==='
            });
            estadisticas.forEach(est => {
                resultado.push({
                    'Sección': '',
                    'Métrica': est['Métrica'] || '',
                    'Total': est['Total'] || '',
                    'Asignados/Activos': est['Asignados'] || '',
                    'Disponibles/Inactivos': est['Disponibles'] || ''
                });
            });
        }
        
        // 2. Usuarios por Tipo
        const usuariosPorTipo = await reporteUsuariosPorTipo(filtros);
        if (usuariosPorTipo.length > 0) {
            resultado.push({
                'Sección': '=== USUARIOS POR TIPO ==='
            });
            usuariosPorTipo.forEach(u => {
                resultado.push({
                    'Sección': '',
                    'Tipo de Usuario': u['Tipo de Usuario'] || '',
                    'Nombre de Usuario': u['Nombre de Usuario'] || '',
                    'Nombre': u['Nombre'] || '',
                    'Apellido': u['Apellido'] || '',
                    'Dirección': u['Dirección'] || '',
                    'Teléfono': u['Teléfono'] || '',
                    'Estado': u['Estado'] || ''
                });
            });
        }
        
        // 3. Suscripciones
        const suscripciones = await reporteSuscripciones(filtros);
        if (suscripciones.length > 0) {
            resultado.push({
                'Sección': '=== SUSCRIPCIONES ==='
            });
            suscripciones.forEach(s => {
                resultado.push({
                    'Sección': '',
                    'Usuario': s['Usuario'] || '',
                    'RUT': s['RUT'] || '',
                    'Nombre': s['Nombre'] || '',
                    'Apellido': s['Apellido'] || '',
                    'Suscripción': s['Suscripción'] || ''
                });
            });
        }
        
        // 4. Gestión de Espacios
        const gestionEspacios = await reporteGestionEspacios(filtros);
        if (gestionEspacios.length > 0) {
            resultado.push({
                'Sección': '=== GESTIÓN DE ESPACIOS ==='
            });
            gestionEspacios.forEach(esp => {
                resultado.push({
                    'Sección': '',
                    'ID': esp['ID'] || '',
                    'Nombre': esp['Nombre'] || '',
                    'Tipo': esp['Tipo'] || '',
                    'Metros²': esp['Metros²'] || '',
                    'Región': esp['Región'] || '',
                    'Ciudad': esp['Ciudad'] || '',
                    'Dirección': esp['Dirección'] || '',
                    'Propietario': esp['Propietario'] || '',
                    'Disponible': esp['Disponible'] || ''
                });
            });
        }
        
        // 5. Publicaciones de Arriendo
        const publicaciones = await reportePublicacionesArriendo(filtros);
        if (publicaciones.length > 0) {
            resultado.push({
                'Sección': '=== PUBLICACIONES DE ARRIENDO ==='
            });
            publicaciones.forEach(pub => {
                resultado.push({
                    'Sección': '',
                    'ID': pub['ID'] || '',
                    'Título': pub['Título'] || '',
                    'Tipo': pub['Tipo'] || '',
                    'Metros²': pub['Metros²'] || '',
                    'Región': pub['Región'] || '',
                    'Ciudad': pub['Ciudad'] || '',
                    'Precio': pub['Precio'] || '',
                    'Estado': pub['Estado'] || '',
                    'Propietario': pub['Propietario'] || '',
                    'Fecha': pub['Fecha'] || ''
                });
            });
        }
        
        // 6. Actividad Reciente
        const actividad = await reporteActividadReciente(filtros);
        if (actividad.length > 0) {
            resultado.push({
                'Sección': '=== ACTIVIDAD RECIENTE ==='
            });
            actividad.forEach(act => {
                resultado.push({
                    'Sección': '',
                    'Acción': act['Acción'] || '',
                    'Detalle': act['Detalle'] || '',
                    'Fecha': act['Fecha'] || '',
                    'Usuario': act['Usuario'] || ''
                });
            });
        }
        
        // 7. Pagos Realizados
        const pagos = await reportePagosAdminSistema(filtros);
        if (pagos.length > 0) {
            resultado.push({
                'Sección': '=== PAGOS REALIZADOS ==='
            });
            pagos.forEach(p => {
                resultado.push({
                    'Sección': '',
                    'ID Pago': p['ID Pago'] || '',
                    'Usuario': p['Usuario'] || '',
                    'Plan': p['Plan'] || '',
                    'Método de Pago': p['Método de Pago'] || '',
                    'Monto Total': p['Monto Total'] || '',
                    'Cuotas': p['Cuotas'] || '',
                    'Estado': p['Estado'] || '',
                    'Fecha Pago': p['Fecha Pago'] || '',
                    'Transacción ID': p['Transacción ID'] || ''
                });
            });
        }
        
        // Normalizar todas las filas para que tengan todas las columnas posibles
        if (resultado.length === 0) return [];
        
        // Recopilar todas las columnas únicas de todos los objetos
        const todasLasColumnas = new Set();
        resultado.forEach(fila => {
            Object.keys(fila).forEach(col => todasLasColumnas.add(col));
        });
        const columnasArray = Array.from(todasLasColumnas);
        
        // Normalizar cada fila para que tenga todas las columnas
        const resultadoNormalizado = resultado.map(fila => {
            const filaNormalizada = {};
            columnasArray.forEach(col => {
                filaNormalizada[col] = fila[col] !== undefined ? fila[col] : '';
            });
            return filaNormalizada;
        });
        
        return resultadoNormalizado;
    } catch (e) {
        console.error('Error en reporte general:', e);
        return [];
    }
}

async function reporteGestionEspacios(filtros) {
    try {
        const formData = new FormData();
        formData.append('action', 'obtener_espacios_sistema');
        const resp = await fetch('../backend/public/gestionarespacios.php', {
            method: 'POST',
            body: formData
        });
        const data = await resp.json();
        if (!data.espacios) return [];
        // Filtro por región/ciudad y rango de fechas (si existe fecha_creacion)
        const filtrados = (data.espacios || []).filter(esp => {
            if (!coincideRegionCiudad(esp, filtros, ['nombre_region', 'region'], ['nombre_ciudad', 'ciudad'])) return false;
            const fecha = esp.fecha_creacion || esp.fecha || null;
            if (!coincideRangoFechas(fecha, filtros.desde, filtros.hasta)) return false;
            return true;
        });
        
        return filtrados.map(esp => ({
            'ID': esp.id_espacio,
            'Nombre': esp.nombre_espacio,
            'Tipo': esp.tipo_espacio,
            'Metros²': esp.metros_cuadrados,
            'Región': esp.nombre_region || '',
            'Ciudad': esp.nombre_ciudad || '',
            'Dirección': esp.direccion || '',
            'Propietario': `${esp.propietario_nombre || ''} ${esp.propietario_apellido || ''}`,
            'Disponible': esp.disponible ? 'Sí' : 'No'
        }));
    } catch (e) {
        console.error('Error en reporte gestión espacios:', e);
        return [];
    }
}

async function reportePublicacionesArriendo(filtros) {
    try {
        const formData = new FormData();
        formData.append('action', 'obtener_publicaciones_sistema');
        const resp = await fetch('../backend/public/gestionarespacios.php', {
            method: 'POST',
            body: formData
        });
        const data = await resp.json();
        if (!data.publicaciones) return [];
        const filtrados = (data.publicaciones || []).filter(pub => {
            if (!coincideRegionCiudad(pub, filtros, ['nombre_region', 'region'], ['nombre_ciudad', 'ciudad'])) return false;
            const fecha = pub.fecha_publicacion || pub.fecha || null;
            if (!coincideRangoFechas(fecha, filtros.desde, filtros.hasta)) return false;
            return true;
        });
        
        return filtrados.map(pub => ({
            'ID': pub.id_publicacion,
            'Título': pub.titulo,
            'Tipo': pub.tipo_espacio,
            'Metros²': pub.metros_cuadrados,
            'Región': pub.nombre_region || '',
            'Ciudad': pub.nombre_ciudad || '',
            'Precio': `$${pub.precio_arriendo}`,
            'Estado': pub.estado,
            'Propietario': `${pub.propietario_nombre || ''} ${pub.propietario_apellido || ''}`,
            'Fecha': pub.fecha_publicacion || ''
        }));
    } catch (e) {
        console.error('Error en reporte publicaciones:', e);
        return [];
    }
}

async function reporteUsuariosPorTipo(filtros) {
    try {
        // Obtener todos los tipos de usuarios
        const roles = ['AdminSistema', 'Administrador', 'Colaboradores', 'Secretaria', 'Cliente'];
        const datosCompletos = [];
        
        // Obtener cada tipo de usuario por separado
        for (const rol of roles) {
            const resp = await fetch('../backend/public/gestionar_clientes.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'listar', roles: [rol] })
            });
            const data = await resp.json();
            if (data.clientes && data.clientes.length > 0) {
                datosCompletos.push(...data.clientes);
            }
        }
        
        if (datosCompletos.length === 0) return [];
        // Filtro por región/ciudad
        const filtrados = datosCompletos.filter(u =>
            coincideRegionCiudad(u, filtros, ['nombre_region', 'region'], ['nombre_ciudad', 'ciudad'])
        );
        if (filtrados.length === 0) return [];
        
        // Primero, agregar fila por cada usuario con sus detalles
        const resultado = [];
        filtrados.forEach(u => {
            resultado.push({
                'Tipo de Usuario': u.nombre_rol || 'Sin rol',
                'Nombre de Usuario': u.nombre_usuario || '',
                'Nombre': u.nombre || '',
                'Apellido': u.apellido || '',
                'Dirección': u.direccion || '',
                'Teléfono': u.telefono || '',
                'Estado': u.activo === 1 ? 'Activo' : 'Inactivo'
            });
        });
        
        // Agregar resumen por tipo al final
        const porTipo = {};
        filtrados.forEach(u => {
            const tipo = u.nombre_rol || 'Sin rol';
            if (!porTipo[tipo]) {
                porTipo[tipo] = { total: 0, activos: 0 };
            }
            porTipo[tipo].total++;
            if (u.activo === 1) {
                porTipo[tipo].activos++;
            }
        });
        
        // Agregar filas de resumen
        resultado.push({
            'Tipo de Usuario': 'RESUMEN',
            'Nombre de Usuario': '',
            'Nombre': '',
            'Apellido': '',
            'Dirección': '',
            'Teléfono': '',
            'Estado': ''
        });
        
        Object.keys(porTipo).sort().forEach(tipo => {
            resultado.push({
                'Tipo de Usuario': tipo,
                'Nombre de Usuario': `TOTAL: ${porTipo[tipo].total}`,
                'Nombre': `Activos: ${porTipo[tipo].activos}`,
                'Apellido': `Inactivos: ${porTipo[tipo].total - porTipo[tipo].activos}`,
                'Dirección': '',
                'Teléfono': '',
                'Estado': ''
            });
        });
        
        return resultado;
    } catch (e) {
        console.error('Error en reporte usuarios por tipo:', e);
        return [];
    }
}

async function reporteSuscripciones(filtros) {
    try {
        const respUsers = await fetch('../backend/public/gestionar_clientes.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'listar', roles: ['Administrador'] })
        });
        const dataUsers = await respUsers.json();
        
        if (!dataUsers.clientes || dataUsers.clientes.length === 0) return [];
        // Filtro por región/ciudad
        const admins = dataUsers.clientes.filter(u =>
            coincideRegionCiudad(u, filtros, ['nombre_region', 'region'], ['nombre_ciudad', 'ciudad'])
        );
        if (admins.length === 0) return [];
        
        // Construir resultado con datos de cada usuario
        const resultado = [];
        const porSuscripcion = {};
        
        admins.forEach(u => {
            // Solo incluir usuarios que tienen suscripción asignada
            if (!u.id_suscripcion || u.id_suscripcion === null) {
                return; // Saltar usuarios sin suscripción
            }
            
            const susc = u.nombre_suscripcion || 'Sin suscripción';
            
            // Agregar al resultado (orden: Nombre, Apellido, Usuario, RUT, Suscripción)
            resultado.push({
                'Nombre': u.nombre || '',
                'Apellido': u.apellido || '',
                'Usuario': u.nombre_usuario || '',
                'RUT': u.rut || '',
                'Suscripción': susc
            });
            
            // Contar por suscripción
            if (!porSuscripcion[susc]) {
                porSuscripcion[susc] = 0;
            }
            porSuscripcion[susc]++;
        });
        
        // Agregar fila de resumen (igual formato que usuarios por tipo)
        resultado.push({
            'Nombre': 'RESUMEN',
            'Apellido': '',
            'Usuario': '',
            'RUT': '',
            'Suscripción': ''
        });
        
        // Agregar filas de resumen por tipo de suscripción (mismo formato que usuarios por tipo)
        const orden = ['Básica', 'Estándar', 'Premium', 'Corporativa'];
        orden.forEach(susc => {
            if (porSuscripcion[susc]) {
                resultado.push({
                    'Nombre': susc,
                    'Apellido': `TOTAL: ${porSuscripcion[susc]}`,
                    'Usuario': '',
                    'RUT': '',
                    'Suscripción': ''
                });
            }
        });
        
        return resultado;
    } catch (e) {
        console.error('Error en reporte suscripciones:', e);
        return [];
    }
}

async function reporteActividadReciente(filtros) {
    try {
        const formDataEsp = new FormData();
        formDataEsp.append('action', 'obtener_espacios_sistema');
        const respEsp = await fetch('../backend/public/gestionarespacios.php', {
            method: 'POST',
            body: formDataEsp
        });
        const dataEsp = await respEsp.json();
        
        const formDataPub = new FormData();
        formDataPub.append('action', 'obtener_publicaciones_sistema');
        const respPub = await fetch('../backend/public/gestionarespacios.php', {
            method: 'POST',
            body: formDataPub
        });
        const dataPub = await respPub.json();
        
        const actividades = [];
        
        if (dataEsp.espacios) {
            (dataEsp.espacios).forEach(esp => {
                // Filtrar por región/ciudad/fecha
                if (!coincideRegionCiudad(esp, filtros, ['nombre_region', 'region'], ['nombre_ciudad', 'ciudad'])) return;
                const fecha = esp.fecha_creacion || esp.fecha || null;
                if (!coincideRangoFechas(fecha, filtros.desde, filtros.hasta)) return;
                actividades.push({
                    'Acción': 'Espacio creado',
                    'Detalle': esp.nombre_espacio || '',
                    'Fecha': esp.fecha_creacion || '',
                    'Usuario': `${esp.propietario_nombre || ''} ${esp.propietario_apellido || ''}`
                });
            });
        }
        
        if (dataPub.publicaciones) {
            (dataPub.publicaciones).forEach(pub => {
                if (!coincideRegionCiudad(pub, filtros, ['nombre_region', 'region'], ['nombre_ciudad', 'ciudad'])) return;
                const fecha = pub.fecha_publicacion || pub.fecha || null;
                if (!coincideRangoFechas(fecha, filtros.desde, filtros.hasta)) return;
                actividades.push({
                    'Acción': 'Publicación de arriendo',
                    'Detalle': pub.titulo || '',
                    'Fecha': pub.fecha_publicacion || '',
                    'Usuario': `${pub.propietario_nombre || ''} ${pub.propietario_apellido || ''}`
                });
            });
        }
        
        actividades.sort((a, b) => new Date(b.Fecha) - new Date(a.Fecha));
        return actividades.slice(0, 50);
    } catch (e) {
        console.error('Error en reporte actividad reciente:', e);
        return [];
    }
}

async function reporteEstadisticasUso(filtros) {
    try {
        const formDataEsp = new FormData();
        formDataEsp.append('action', 'obtener_espacios_sistema');
        const respEsp = await fetch('../backend/public/gestionarespacios.php', {
            method: 'POST',
            body: formDataEsp
        });
        const dataEsp = await respEsp.json();
        
        const formDataPub = new FormData();
        formDataPub.append('action', 'obtener_publicaciones_sistema');
        const respPub = await fetch('../backend/public/gestionarespacios.php', {
            method: 'POST',
            body: formDataPub
        });
        const dataPub = await respPub.json();
        
        // Aplicar filtros a los conjuntos
        const espaciosFiltrados = (dataEsp.espacios || []).filter(e =>
            coincideRegionCiudad(e, filtros, ['nombre_region', 'region'], ['nombre_ciudad', 'ciudad']) &&
            coincideRangoFechas(e.fecha_creacion || e.fecha || null, filtros.desde, filtros.hasta)
        );
        const publicacionesFiltradas = (dataPub.publicaciones || []).filter(p =>
            coincideRegionCiudad(p, filtros, ['nombre_region', 'region'], ['nombre_ciudad', 'ciudad']) &&
            coincideRangoFechas(p.fecha_publicacion || p.fecha || null, filtros.desde, filtros.hasta)
        );

        const totalEspacios = espaciosFiltrados.length;
        const espaciosAsignados = espaciosFiltrados.reduce((sum, e) => sum + (parseInt(e.total_asignaciones) || 0), 0);
        const totalPublicaciones = publicacionesFiltradas.length;
        
        const resultado = [
            { 'Métrica': 'Espacios gestionados', 'Total': totalEspacios, 'Asignados': espaciosAsignados, 'Disponibles': totalEspacios - espaciosAsignados },
            { 'Métrica': 'Publicaciones de arriendo', 'Total': totalPublicaciones, 'Asignados': 0, 'Disponibles': totalPublicaciones }
        ];
        
        // Agregar fila de total
        resultado.push({
            'Métrica': 'TOTAL GENERAL',
            'Total': totalEspacios + totalPublicaciones,
            'Asignados': espaciosAsignados,
            'Disponibles': (totalEspacios - espaciosAsignados) + totalPublicaciones
        });
        
        return resultado;
    } catch (e) {
        console.error('Error en reporte estadísticas de uso:', e);
        return [];
    }
}

async function reportePagosAdminSistema(filtros) {
    try {
        const resp = await fetch('/GestionDeEspacios/backend/public/gestionar_pagos.php?action=obtener_todos_pagos', {
            method: 'GET',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        const json = await resp.json();
        let arr = json.success ? (json.pagos || []) : [];
        
        // Filtrar por fechas si hay filtros
        if (filtros && (filtros.desde || filtros.hasta)) {
            const desde = filtros.desde ? new Date(filtros.desde) : null;
            const hasta = filtros.hasta ? new Date(filtros.hasta) : null;
            arr = arr.filter(p => {
                const fecha = p.fecha_pago || '';
                if (!fecha) return false;
                const d = new Date(fecha.substring(0, 10));
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
                'Usuario': p.nombre_usuario_completo || 'N/A',
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
    } catch (e) {
        console.error('Error en reporte pagos:', e);
        return [];
    }
}
