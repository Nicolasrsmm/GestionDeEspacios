async function cargarInformacionSuscripcionColab(){
    try{
        const adminId = getAdminIdFromSession();
        if (!adminId) return;
        const resp = await fetch('/GestionDeEspacios/backend/public/contador_espacios.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=obtener_contadores&id_administrador=${encodeURIComponent(adminId)}`
        });
        const data = await resp.json();
        if (!data || !data.success) return;
        const cont = data.contadores || {};
        const planName = document.getElementById('planNameColab');
        const planPrice = document.getElementById('planPriceColab');
        if (planName) planName.textContent = cont.suscripcion || 'Sin plan';
        if (planPrice) planPrice.textContent = '';
        const ep = document.getElementById('espaciosProgressColab');
        const et = document.getElementById('espaciosTextColab');
        const pp = document.getElementById('publicacionesProgressColab');
        const pt = document.getElementById('publicacionesTextColab');
        const totalEsp = cont.limite_espacios || 0;
        const usadosEsp = cont.total_espacios || 0;
        const totalPub = cont.limite_publicaciones || 0;
        const usadasPub = cont.total_publicaciones || 0;
        if (ep) ep.style.width = totalEsp? `${Math.min(100, Math.round(usadosEsp*100/totalEsp))}%` : '0%';
        if (et) et.textContent = `${usadosEsp}/${totalEsp}`;
        if (pp) pp.style.width = totalPub? `${Math.min(100, Math.round(usadasPub*100/totalPub))}%` : '0%';
        if (pt) pt.textContent = `${usadasPub}/${totalPub}`;
    }catch(e){ /* silencioso */ }
}

async function cargarDashboardColab(){
    try{
        const token = sessionStorage.getItem('token_sesion')||'';
        const adminId = getAdminIdFromSession();
        const base = '../backend/public/';
        const [repR, solR, pubsR] = await Promise.all([
            fetch(`${base}gestionar_reportes.php?token=${encodeURIComponent(token)}`),
            fetch(`${base}gestionar_solicitudes_horario.php?token=${encodeURIComponent(token)}`),
            fetch(`/GestionDeEspacios/backend/public/gestionar_arriendo.php?action=obtener_publicaciones&token=${encodeURIComponent(token)}&id_usuario=${encodeURIComponent(adminId)}`)
        ]);
        // Reportes
        let repJson={}; try{ repJson=await repR.json(); }catch{ repJson={}; }
        const reportes=(repJson&&repJson.success&&Array.isArray(repJson.reportes))?repJson.reportes:[];
        const rep_total=reportes.length;
        const rep_resueltos=reportes.filter(r=>String(r.estado||'').toLowerCase()==='resuelto').length;
        const rep_revisados=reportes.filter(r=>String(r.estado||'').toLowerCase()==='revisado').length;
        const rep_pendientes=rep_total-rep_resueltos-rep_revisados;
        // Solicitudes
        let solJson={}; try{ solJson=await solR.json(); }catch{ solJson={}; }
        const solicitudes=(solJson&&solJson.success&&Array.isArray(solJson.solicitudes))?solJson.solicitudes:[];
        const sol_total=solicitudes.length;
        const sol_aprobadas=solicitudes.filter(s=>String(s.estado_admin||'').toLowerCase()==='aprobado').length;
        const sol_rechazadas=solicitudes.filter(s=>String(s.estado_admin||'').toLowerCase()==='rechazado').length;
        const sol_pendientes=sol_total-sol_aprobadas-sol_rechazadas;
        // Publicaciones para calificaciones de espacios
        let pubsJson={}; try{ pubsJson=await pubsR.json(); }catch{ pubsJson={}; }
        const publicaciones=(pubsJson&&pubsJson.success&&Array.isArray(pubsJson.publicaciones))?pubsJson.publicaciones:[];
        // Calificaciones a clientes
        const calCliR = await fetch('/GestionDeEspacios/backend/public/calificar_clientes.php', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:`action=obtener_calificaciones&id_administrador=${encodeURIComponent(adminId)}` });
        let calCliJson={}; try{ calCliJson=await calCliR.json(); }catch{ calCliJson={}; }
        const calCliArr=(calCliJson&&calCliJson.success&&Array.isArray(calCliJson.calificaciones))?calCliJson.calificaciones:[];
        const cal_cli_total_c=calCliArr.length;
        // Calificaciones de espacios
        let cal_esp_total_c=0;
        if (Array.isArray(publicaciones) && publicaciones.length){
            const sums=await Promise.all(publicaciones.map(async(p)=>{
                if(!p.id_publicacion) return 0;
                try{
                    const r=await fetch('/GestionDeEspacios/backend/public/calificar_espacios.php', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:`action=obtener_calificaciones&id_publicacion=${encodeURIComponent(p.id_publicacion)}` });
                    const j=await r.json();
                    if (j&&j.success&&Array.isArray(j.calificaciones)) return j.calificaciones.length; return 0;
                }catch{ return 0; }
            }));
            cal_esp_total_c=sums.reduce((a,b)=>a+b,0);
        }
        const setNum=(id,val)=>{ const el=document.getElementById(id); if(el) el.textContent=String(val); };
        setNum('rep_total_c',rep_total);
        setNum('rep_resueltos_c',rep_resueltos);
        setNum('rep_revisados_c',rep_revisados);
        setNum('rep_pendientes_c',rep_pendientes);
        setNum('sol_total_c',sol_total);
        setNum('sol_aprobadas_c',sol_aprobadas);
        setNum('sol_rechazadas_c',sol_rechazadas);
        setNum('sol_pendientes_c',sol_pendientes);
        setNum('cal_cli_total_c',cal_cli_total_c);
        setNum('cal_esp_total_c',cal_esp_total_c);
    }catch(e){ console.error('Dashboard colaborador error', e); }
}
// menu.js extraído de admin_box.js
// Función para inicializar el menú (con verificación de sesión)
function inicializarMenu() {
    // Verificar si hay usuario logueado
    const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
    const tipoUsuario = sessionStorage.getItem('tipo_usuario');
    
    if (!usuarioLogueado || tipoUsuario !== 'colaboradores') {
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

// ====== GENERADOR DE REPORTES (Colaborador) ======
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

    // Validación fechas
    const inputDesde = document.getElementById('reporteDesde');
    const inputHasta = document.getElementById('reporteHasta');
    if (inputDesde && inputHasta) {
        inputDesde.addEventListener('change', function() {
            if (this.value) {
                inputHasta.min = this.value;
                if (inputHasta.value && inputHasta.value < this.value) inputHasta.value = this.value;
            } else {
                inputHasta.removeAttribute('min');
            }
        });
        inputHasta.addEventListener('change', function() {
            if (inputDesde.value && this.value && this.value < inputDesde.value) this.value = inputDesde.value;
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

// Obtener id del administrador asociado al colaborador
function getAdminIdFromSession() {
    try {
        const usuario = JSON.parse(sessionStorage.getItem('usuario_logueado')||'{}');
        return usuario.id_administrador || usuario.id_administrador_asociado || usuario.id_usuario || '';
    } catch (e) {
        return '';
    }
}

async function generarReporte() {
    const filtros = leerFiltrosReporte();
    if (filtros.desde && filtros.hasta && filtros.hasta < filtros.desde) {
        mostrarCardEmergente(false, 'La fecha "Hasta" no puede ser inferior a "Desde"');
        return;
    }
    // log UI removido
    const card = document.getElementById('reporteResultsCard');
    const cont = document.getElementById('reporteResultado');
    if (cont) cont.innerHTML = '<div style="color:#888;padding:1rem;"><i class="fas fa-spinner fa-spin"></i> Generando...</div>';
    if (card) card.style.display = '';
    try {
        let data = [];
        switch (filtros.tipo) {
            case 'asignaciones': data = await reporteAsignaciones(filtros); break;
            case 'historial_asignaciones': data = await reporteHistorialAsignaciones(filtros); break;
            case 'publicaciones': data = await reportePublicaciones(filtros); break;
            case 'colaboradores': data = await reporteColaboradores(filtros); break;
            case 'calificaciones': data = await reporteCalificaciones(filtros); break;
            case 'reportes': data = await reporteReportes(filtros); break;
            case 'solicitudes': data = await reporteSolicitudes(filtros); break;
        }
        datosReporteActual = data;
        renderTablaReporte(data);
    } catch (e) {
        console.error('[Reportes][Colaborador] Error generarReporte:', e);
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

function safe(v) { if (v == null) return ''; if (typeof v === 'object') return JSON.stringify(v); return String(v); }

// Card emergente simple para logs visibles
function mostrarLogEmergente(titulo, mensaje) {
    try {
        let overlay = document.getElementById('overlay-log-reportes');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'overlay-log-reportes';
            overlay.style.position = 'fixed';
            overlay.style.right = '20px';
            overlay.style.bottom = '20px';
            overlay.style.zIndex = '100000';
            overlay.style.display = 'flex';
            overlay.style.flexDirection = 'column';
            overlay.style.gap = '10px';
            document.body.appendChild(overlay);
        }
        const card = document.createElement('div');
        card.style.background = 'rgba(26,26,26,0.96)';
        card.style.color = '#ffd700';
        card.style.border = '1px solid #333';
        card.style.borderLeft = '4px solid #ffd700';
        card.style.borderRadius = '10px';
        card.style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)';
        card.style.padding = '12px 14px';
        card.style.maxWidth = '420px';
        card.style.fontSize = '12px';
        card.style.whiteSpace = 'pre-wrap';
        card.style.backdropFilter = 'blur(2px)';
        card.innerHTML = `<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.3rem;"><i class='fas fa-bug'></i><b>${titulo}</b><button style="margin-left:auto;background:none;border:none;color:#aaa;cursor:pointer;" onclick="this.parentElement.parentElement.remove()">✕</button></div><div style='color:#e0e0e0;'>${mensaje}</div>`;
        overlay.appendChild(card);
        setTimeout(() => { try{ card.remove(); }catch{} }, 7000);
    } catch {}
}

async function exportarPDFReporte() {
    if (!datosReporteActual || !datosReporteActual.length) { mostrarCardEmergente(false, 'No hay datos para exportar'); return; }
    await cargarScriptSiNoExiste('jspdf', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    await cargarScriptSiNoExiste('jspdf-autotable', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js');
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF || !window.jspdf || !window.jspdf.jsPDF) { mostrarCardEmergente(false, 'No se pudo cargar el generador de PDF'); return; }
    const cols = Object.keys(datosReporteActual[0]);
    const rows = datosReporteActual.map(r => cols.map(c => safe(r[c])));
    const doc = new jsPDF('p', 'pt');
    const ahora = new Date();
    const tipoSel = (document.getElementById('reporteTipo')||{});
    const tipoTexto = (tipoSel.options||[])[tipoSel.selectedIndex||0]?.text || 'Reporte';
    const titulo = 'Informe';
    const subtitulo = tipoTexto;
    const filtros = leerFiltrosReporte();
    doc.setTextColor(26, 42, 62); doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text(titulo, 40, 48);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(14); doc.text(subtitulo, 40, 70);
    doc.setDrawColor(230, 234, 240); doc.line(40, 80, 555, 80);
    doc.setFontSize(10); doc.setTextColor(90, 99, 110);
    const metaY1 = 100, metaY2 = 116; const label=(t,x,y)=>{doc.setFont('helvetica','bold');doc.text(t,x,y);doc.setFont('helvetica','normal');}; const val=(t,x,y)=>{doc.text(t,x,y);};
    label('Generado:',40,metaY1); val(ahora.toLocaleString(),110,metaY1);
    label('Desde:',40,metaY2); val(filtros.desde||'-',85,metaY2);
    label('Hasta:',200,metaY2); val(filtros.hasta||'-',245,metaY2);
    label('Región:',360,metaY2); val(filtros.region||'Todas',410,metaY2);
    label('Ciudad:',480,metaY2); val(filtros.ciudad||'Todas',532,metaY2);
    if (doc.autoTable) {
        doc.autoTable({ head:[cols], body:rows, startY:140, styles:{fontSize:9, cellPadding:6, textColor:[44,62,80]}, headStyles:{fillColor:[26,42,62], halign:'left'}, margin:{left:40,right:40} });
    } else {
        let y=150; doc.setFontSize(8); doc.text(cols.join(' | '),40,y); y+=14; rows.forEach(r=>{ doc.text(String(r.join(' | ')).slice(0,1000),40,y); y+=12; if (y>760){doc.addPage(); y=40;} });
    }
    const nombre = `informe_${slugifyNombre(tipoTexto)}.pdf`; doc.save(nombre);
}

function cargarScriptSiNoExiste(key, src) { return new Promise(resolve=>{ if (key==='jspdf' && window.jspdf && window.jspdf.jsPDF) return resolve(); if (key==='jspdf-autotable' && window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API && window.jspdf.jsPDF.API.autoTable) return resolve(); const s=document.createElement('script'); s.src=src; s.onload=()=>setTimeout(resolve,50); s.onerror=()=>resolve(); document.head.appendChild(s); }); }
function slugifyNombre(texto){ try{ return String(texto||'reporte').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-_]/g,'').replace(/\s+/g,'_').replace(/_+/g,'_').replace(/^_+|_+$/g,''); } catch { return 'reporte'; } }

// Reutilizamos endpoints tal como en administrador
async function reporteAsignaciones(f){ const adminId=getAdminIdFromSession(); const resp=await fetch('../backend/public/asignarespacio.php',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:`action=obtener_espacios_completos&id_administrador=${adminId}`}); const text=await resp.text(); let json={}; try{ json=JSON.parse(text);}catch(e){ console.warn('[Asignaciones] Respuesta no JSON:', text); } const arr=json.success?(json.espacios||[]):[]; const rows=arr.filter(e=>e.esta_asignado).filter(e=>(!f.region||(e.nombre_region||'')===f.region)&&(!f.ciudad||(e.nombre_ciudad||'')===f.ciudad)).map(e=>{ const fc=e.fecha_creacion_asignacion||e.fecha_creacion||e.asignacion_fecha_creacion||''; return {'Nombre del espacio':e.nombre_espacio,'Tipo de espacio':e.tipo_espacio,'Región':e.nombre_region,'Ciudad':e.nombre_ciudad,'Dirección':e.direccion,'Fecha creación':fc};}); if (f.desde||f.hasta){const desde=f.desde?new Date(f.desde):null; const hasta=f.hasta?new Date(f.hasta):null; return rows.filter(r=>{const v=r['Fecha creación']; if(!v)return false; const d=new Date(String(v).substring(0,10)); if(desde&&d<desde)return false; if(hasta&&d>hasta)return false; return true;});} return rows; }
async function reporteHistorialAsignaciones(f){ const adminId=getAdminIdFromSession(); const resp=await fetch('../backend/public/asignarespacio.php',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:`action=obtener_espacios_completos&id_administrador=${adminId}`}); const text=await resp.text(); let json={}; try{ json=JSON.parse(text);}catch(e){ console.warn('[HistorialAsignaciones] Respuesta no JSON:', text); } const espacios=json.success?(json.espacios||[]):[]; let rows=[]; espacios.filter(e=>(!f.region||(e.nombre_region||'')===f.region)&&(!f.ciudad||(e.nombre_ciudad||'')===f.ciudad)).forEach(e=>{ const lista=Array.isArray(e.clientes_asignados)?e.clientes_asignados:[]; lista.forEach(c=>{ const hi=c.horario_asignado||{}; const fi=hi.fecha_inicio||c.fecha_inicio_asignacion||''; const ff=hi.fecha_termino||c.fecha_termino_asignacion||''; rows.push({'Nombre del espacio':e.nombre_espacio,'Tipo de espacio':e.tipo_espacio,'Cliente':`${c.nombre||''} ${c.apellido||''}`.trim(),'RUT':c.rut||'','Teléfono':c.telefono||'','Región':e.nombre_region||'','Ciudad':e.nombre_ciudad||'','Fecha inicio':fi,'Fecha término':ff});});}); if(f.desde||f.hasta){const desde=f.desde?new Date(f.desde):null; const hasta=f.hasta?new Date(f.hasta):null; rows=rows.filter(r=>{const v=r['Fecha inicio']; if(!v)return false; const d=new Date(String(v).substring(0,10)); if(desde&&d<desde)return false; if(hasta&&d>hasta)return false; return true;});} return rows; }
async function reportePublicaciones(f){ const token=sessionStorage.getItem('token_sesion')||''; const adminId=getAdminIdFromSession(); const resp=await fetch(`/GestionDeEspacios/backend/public/gestionar_arriendo.php?action=obtener_publicaciones&token=${encodeURIComponent(token)}&id_usuario=${encodeURIComponent(adminId)}`); const text=await resp.text(); let json={}; try{ json=JSON.parse(text);}catch(e){ console.warn('[Publicaciones] Respuesta no JSON:', text);} const pubs=json.success?(json.publicaciones||[]):[]; const rows=pubs.filter(p=>(!f.region||(p.region||'')===f.region)&&(!f.ciudad||(p.ciudad||'')===f.ciudad)).map(p=>{ const fc=p.fecha_creacion||p.fecha_publicacion||p.created_at||''; return {'Título':p.titulo,'Tipo de espacio':p.tipo_espacio,'Metros cuadrados':p.metros_cuadrados,'Región':p.region,'Ciudad':p.ciudad,'Dirección':p.direccion,'Precio arriendo':p.precio_arriendo,'Fecha creación':fc};}); if(f.desde||f.hasta){const desde=f.desde?new Date(f.desde):null; const hasta=f.hasta?new Date(f.hasta):null; return rows.filter(r=>{const v=r['Fecha creación']; if(!v)return false; const d=new Date(String(v).substring(0,10)); if(desde&&d<desde)return false; if(hasta&&d>hasta)return false; return true;});} return rows; }
async function reporteColaboradores(f){ const adminId=getAdminIdFromSession(); const resp=await fetch('/GestionDeEspacios/backend/public/gestionar_colaboradores.php',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:`action=obtener_colaboradores&id_administrador=${adminId}`}); const text=await resp.text(); let json={}; try{ json=JSON.parse(text);}catch(e){ console.warn('[Colaboradores] Respuesta no JSON:', text);} const cols=json.success?(json.colaboradores||[]):[]; const rows=cols.map(c=>{ const fc=c.fecha_creacion||c.created_at||''; return {'Nombre':`${c.nombre} ${c.apellido}`,'RUT':c.rut,'Correo':c.correo_electronico,'Usuario':c.nombre_usuario,'Teléfono':c.telefono||'','Región':c.region||'','Ciudad':c.ciudad||'','Fecha creación':fc};}); if(f.desde||f.hasta){const desde=f.desde?new Date(f.desde):null; const hasta=f.hasta?new Date(f.hasta):null; return rows.filter(r=>{const v=r['Fecha creación']; if(!v)return false; const d=new Date(String(v).substring(0,10)); if(desde&&d<desde)return false; if(hasta&&d>hasta)return false; return true;});} return rows; }
async function reporteCalificaciones(f){ const adminId=getAdminIdFromSession(); const resp=await fetch('/GestionDeEspacios/backend/public/calificar_clientes.php',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:`action=obtener_calificaciones&id_administrador=${adminId}`}); const text=await resp.text(); let json={}; try{ json=JSON.parse(text);}catch(e){ console.warn('[Calificaciones] Respuesta no JSON:', text);} const arr=json.success?(json.calificaciones||[]):[]; const rows=arr.map(c=>{ const fc=c.fecha_registro||c.fecha_creacion||''; return {'Cliente':`${c.cliente_nombre} ${c.cliente_apellido}`,'Espacio':c.espacio,'Calificación':c.calificacion,'Tipo':c.tipo_comportamiento||'','Gravedad':(typeof getGravedadTexto==='function')?getGravedadTexto(c.nivel_gravedad):(c.nivel_gravedad||''),'Fecha creación':fc};}); if(f.desde||f.hasta){const desde=f.desde?new Date(f.desde):null; const hasta=f.hasta?new Date(f.hasta):null; return rows.filter(r=>{const v=r['Fecha creación']; if(!v)return false; const d=new Date(String(v).substring(0,10)); if(desde&&d<desde)return false; if(hasta&&d>hasta)return false; return true;});} return rows; }
async function reporteReportes(f){ const token=sessionStorage.getItem('token_sesion')||''; const resp=await fetch(`../backend/public/gestionar_reportes.php?token=${encodeURIComponent(token)}`); const text=await resp.text(); let json={}; try{ json=JSON.parse(text);}catch(e){ console.warn('[Reportes] Respuesta no JSON:', text);} const arr=json.success?(json.reportes||[]):[]; const rows=arr.map(r=>({'Estado':r.estado,'Fecha creación':r.fecha_creacion,'Título':r.titulo,'Contenido':r.contenido||'','Nombre del espacio':r.nombre_espacio,'Cliente':`${r.nombre||''} ${r.apellido||''}`.trim(),'Región':r.region||'','Ciudad':r.ciudad||''})); if(f.desde||f.hasta){const desde=f.desde?new Date(f.desde):null; const hasta=f.hasta?new Date(f.hasta):null; return rows.filter(r=>{const v=r['Fecha creación']; if(!v)return false; const d=new Date(String(v).substring(0,10)); if(desde&&d<desde)return false; if(hasta&&d>hasta)return false; return true;});} return rows; }
async function reporteSolicitudes(f){ const token=sessionStorage.getItem('token_sesion')||''; const resp=await fetch(`../backend/public/gestionar_solicitudes_horario.php?token=${encodeURIComponent(token)}`); const text=await resp.text(); let json={}; try{ json=JSON.parse(text);}catch(e){ console.warn('[Solicitudes] Respuesta no JSON:', text);} const arr=json.success?(json.solicitudes||[]):[]; const rows=arr.map(s=>({'Estado':s.estado_admin||'Pendiente','Fecha creación':s.fecha_solicitud,'Nombre del espacio':s.nombre_espacio||'','Motivo':s.motivo||'','Cliente':`${s.nombre||''} ${s.apellido||''}`.trim(),'Región':s.region||'','Ciudad':s.ciudad||''})); if(f.desde||f.hasta){const desde=f.desde?new Date(f.desde):null; const hasta=f.hasta?new Date(f.hasta):null; return rows.filter(r=>{const v=r['Fecha creación']; if(!v)return false; const d=new Date(String(v).substring(0,10)); if(desde&&d<desde)return false; if(hasta&&d>hasta)return false; return true;});} return rows; }

// === Reportes (replicado de Administrador) ===
async function cargarReportesColaborador() {
    const wrapper = document.getElementById('reportesList');
    if (!wrapper) return;
    try {
        const token = sessionStorage.getItem('token_sesion') || '';
        const url = `../backend/public/gestionar_reportes.php?token=${encodeURIComponent(token)}`;
        const resp = await fetch(url);
        const json = await resp.json();
        if (!json.success) { wrapper.innerHTML = `<div style="color:#e74c3c; padding:1rem; text-align:center;">${json.message || 'No se pudieron cargar los reportes'}</div>`; return; }
        const reportes = Array.isArray(json.reportes) ? json.reportes : [];
        if (!reportes.length) { wrapper.innerHTML = '<div style="color:#888; padding:1rem; text-align:center;">No tienes reportes pendientes.</div>'; return; }
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
                    const partes = respuestaCompleta.split('--- Nueva respuesta');
                    let todasLasRespuestas = '';
                    if (partes[0].trim()) { todasLasRespuestas += `<div class="respuesta-individual"><strong>Respuesta Original:</strong><br>${partes[0].trim().replace(/\n/g, '<br>')}</div>`; }
                    for (let i = 1; i < partes.length; i++) {
                        const parte = partes[i].trim(); if (!parte) continue;
                        const fechaMatch = parte.match(/\(([^)]+)\)/); const fecha = fechaMatch ? fechaMatch[1] : 'Fecha no disponible';
                        const contenido = parte.replace(/\([^)]+\)/, '').trim();
                        const contenidoLimpio = contenido.replace(/^---\s*/, '').replace(/^Nueva respuesta\s*/, '').trim();
                        if (contenidoLimpio) { todasLasRespuestas += `<div class=\"respuesta-individual\"><strong>Respuesta Adicional (${fecha}):</strong><br>${contenidoLimpio.replace(/\n/g, '<br>')}</div>`; }
                    }
                    textoResp = `<div class=\"respuesta-text\">${todasLasRespuestas}</div>`;
                } else {
                    textoResp = `<div class=\"respuesta-text\">${respuestaCompleta.replace(/\n/g, '<br>')}<br><small>${(r.fecha_respuesta||'').replace('T',' ').substring(0,19)}</small></div>`;
                }
            }
            return `
            <div class=\"reporte-card\">
                <div class=\"reporte-card__header\">
                    <div class=\"reporte-card__title\">${r.titulo || ''}</div>
                    <span class=\"estado-chip ${estadoClass}\">${estadoTexto}</span>
                </div>
                <div class=\"reporte-card__meta\">
                    <span><i class=\"fas fa-calendar\"></i> ${fecha}</span>
                    <span><i class=\"fas fa-building\"></i> ${r.nombre_espacio || ''}</span>
                    <span><i class=\"fas fa-user\"></i> ${r.nombre || ''} ${r.apellido || ''}</span>
                </div>
                <div class=\"reporte-card__contenido\">
                    <div class=\"reporte-card__descripcion\">
                        <strong>Descripción:</strong><br>
                        ${r.contenido || ''}
                    </div>
                    <div class=\"reporte-card__cliente-info\">
                        <strong>Cliente:</strong> ${r.nombre || ''} ${r.apellido || ''}<br>
                        <strong>Email:</strong> ${r.correo_electronico || ''}<br>
                        <strong>Teléfono:</strong> ${r.telefono || 'N/A'}<br>
                        <strong>Espacio:</strong> ${r.nombre_espacio || ''} (${r.tipo_espacio || ''})<br>
                        <strong>Ubicación:</strong> ${r.ciudad || ''}, ${r.region || ''}
                    </div>
                </div>
                <div class=\"reporte-card__respuesta\">
                    ${badgeResp}
                    ${textoResp ? `<div class=\\"reporte-card__respuesta-text\\">${textoResp}</div>` : ''}
                </div>
                <div class=\"reporte-card__actions\">
                    <button class=\"btn-responder\" onclick=\"abrirModalRespuestaColab(${r.id_reporte})\">
                        <i class=\"fas fa-reply\"></i> Responder
                    </button>
                </div>
            </div>`;
        }).join('');
        const filterSelect = document.getElementById('filterEstado'); if (filterSelect) { filterSelect.onchange = () => filtrarReportesColaborador(); }
    } catch (e) { console.error('Error cargando reportes', e); wrapper.innerHTML = '<div style="color:#e74c3c; padding:1rem; text-align:center;">Error al cargar reportes</div>'; }
}

function filtrarReportesColaborador() {
    const filterEstado = document.getElementById('filterEstado').value;
    const cards = document.querySelectorAll('.reporte-card');
    cards.forEach(card => {
        const estadoChip = card.querySelector('.estado-chip');
        const estado = estadoChip ? estadoChip.textContent.trim() : '';
        card.style.display = (!filterEstado || estado === filterEstado) ? 'block' : 'none';
    });
}

function abrirModalRespuestaColab(idReporte) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'modalRespuesta';
    modal.innerHTML = `
        <div class=\"modal-content\">
            <div class=\"modal-header\">
                <h3>Responder Reporte de Incidencia</h3>
                <button class=\"close-modal\" onclick=\"cerrarModalRespuestaColab()\">&times;</button>
            </div>
            <div class=\"modal-body\">
                <form id=\"formRespuesta\">
                    <div class=\"form-group\">
                        <label>Respuesta</label>
                        <textarea id=\"respuestaTexto\" rows=\"6\" placeholder=\"Escribe tu respuesta aquí...\" required></textarea>
                    </div>
                    <div class=\"form-group\">
                        <label>Nuevo Estado</label>
                        <select id=\"nuevoEstado\" required>
                            <option value=\"Revisado\">Revisado</option>
                            <option value=\"Resuelto\">Resuelto</option>
                        </select>
                    </div>
                    <div class=\"form-actions\">
                        <button type=\"button\" class=\"btn-cancel\" onclick=\"cerrarModalRespuestaColab()\">Cancelar</button>
                        <button type=\"submit\" class=\"btn-primary\">Enviar Respuesta</button>
                    </div>
                </form>
            </div>
        </div>`;
    document.body.appendChild(modal);
    document.getElementById('formRespuesta').addEventListener('submit', async (e) => { e.preventDefault(); await enviarRespuestaColab(idReporte); });
}

async function enviarRespuestaColab(idReporte) {
    try {
        const respuesta = document.getElementById('respuestaTexto').value.trim();
        const nuevoEstado = document.getElementById('nuevoEstado').value;
        if (!respuesta) { mostrarCardEmergente(false, 'La respuesta no puede estar vacía'); return; }
        const token = sessionStorage.getItem('token_sesion') || '';
        const data = { token, id_reporte: idReporte, accion: 'responder', respuesta, nuevo_estado: nuevoEstado };
        const resp = await fetch('../backend/public/gestionar_reportes.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const json = await resp.json();
        if (json.success) { mostrarCardEmergente(true, json.message); cerrarModalRespuestaColab(); cargarReportesColaborador(); }
        else { mostrarCardEmergente(false, json.message); }
    } catch (e) { console.error('Error enviando respuesta', e); mostrarCardEmergente(false, 'Error del servidor'); }
}

function cerrarModalRespuestaColab() { const modal = document.getElementById('modalRespuesta'); if (modal) modal.remove(); }

// === Solicitudes Cambio de Horario (replicado) ===
async function cargarSolicitudesHorarioColab() {
    const wrapper = document.getElementById('solicitudesList');
    if (!wrapper) return;
    try {
        const token = sessionStorage.getItem('token_sesion') || '';
        const url = `../backend/public/gestionar_solicitudes_horario.php?token=${encodeURIComponent(token)}`;
        const resp = await fetch(url);
        const json = await resp.json();
        if (!json.success) { wrapper.innerHTML = `<div style="color:#e74c3c; padding:1rem; text-align:center;">${json.message || 'No se pudieron cargar las solicitudes'}</div>`; return; }
        const solicitudes = Array.isArray(json.solicitudes) ? json.solicitudes : [];
        if (!solicitudes.length) { wrapper.innerHTML = '<div style="color:#888; padding:1rem; text-align:center;">No tienes solicitudes de cambio de horario.</div>'; return; }
        wrapper.innerHTML = solicitudes.map(s => {
            const fechaSolicitud = (s.fecha_solicitud || '').replace('T',' ').substring(0,19);
            const estado = (s.estado_admin || 'Pendiente').toLowerCase();
            const estadoClass = estado === 'aprobado' ? 'estado-resuelto' : (estado === 'rechazado' ? 'estado-revisado' : 'estado-enviado');
            const respondido = (s.respuesta_admin && s.respuesta_admin.trim().length) ? true : false;
            const badgeResp = respondido ? '<span class="respuesta-badge respuesta-ok">Respuesta</span>' : '<span class="respuesta-badge respuesta-none">Sin respuesta</span>';
            const textoResp = respondido ? `<div class="respuesta-text">${s.respuesta_admin.replace(/\n/g, '<br>')}<br><small>${(s.fecha_respuesta_admin||'').replace('T',' ').substring(0,19)}</small></div>` : '';
            let fechaActualTxt = 'Sin horario actual';
            if (s.actual_fecha_inicio && s.actual_fecha_termino) { fechaActualTxt = `${s.actual_fecha_inicio} a ${s.actual_fecha_termino}`; }
            return `
            <div class=\"reporte-card\">
                <div class=\"reporte-card__header\">
                    <div class=\"reporte-card__title\">Solicitud de Cambio de Horario</div>
                    <span class=\"estado-chip ${estadoClass}\">${s.estado_admin || 'Pendiente'}</span>
                </div>
                <div class=\"reporte-card__meta\">
                    <span><i class=\"fas fa-calendar\"></i> ${fechaSolicitud}</span>
                    <span><i class=\"fas fa-building\"></i> ${s.nombre_espacio || ''}</span>
                    <span><i class=\"fas fa-user\"></i> ${s.nombre || ''} ${s.apellido || ''}</span>
                </div>
                <div class=\"reporte-card__contenido\">
                    <div class=\"reporte-card__descripcion\">
                        <strong>Motivo de la solicitud:</strong><br>
                        ${s.motivo || ''}
                    </div>
                    <div class=\"reporte-card__cliente-info\">
                        <strong>Cliente:</strong> ${s.nombre || ''} ${s.apellido || ''}<br>
                        <strong>Email:</strong> ${s.correo_electronico || ''}<br>
                        <strong>Teléfono:</strong> ${s.telefono || 'N/A'}<br>
                        <strong>Espacio:</strong> ${s.nombre_espacio || ''} (${s.tipo_espacio || ''})<br>
                        <strong>Ubicación:</strong> ${s.ciudad || ''}, ${s.region || ''}<br>
                        <strong>Fecha actual:</strong> ${fechaActualTxt}<br>
                        <strong>Nueva fecha solicitada:</strong> ${s.fecha_solicitada || ''}
                    </div>
                </div>
                <div class=\"reporte-card__respuesta\">
                    ${badgeResp}
                    ${textoResp ? `<div class=\\"reporte-card__respuesta-text\\">${textoResp}</div>` : ''}
                </div>
                <div class=\"reporte-card__actions\">
                    ${s.estado_admin === 'Pendiente' ? `
                        <button class=\"btn-aprobar\" onclick=\"abrirModalAprobarSolicitudColab(${s.id_solicitud})\">
                            <i class=\"fas fa-check\"></i> Aprobar
                        </button>
                        <button class=\"btn-rechazar\" onclick=\"abrirModalRechazarSolicitudColab(${s.id_solicitud})\">
                            <i class=\"fas fa-times\"></i> Rechazar
                        </button>
                    ` : ''}
                </div>
            </div>`;
        }).join('');
        const sel = document.getElementById('filterEstadoSolicitud'); if (sel) sel.onchange = () => filtrarSolicitudesColab();
    } catch (e) { console.error('Error cargando solicitudes', e); wrapper.innerHTML = '<div style="color:#e74c3c; padding:1rem; text-align:center;">Error al cargar solicitudes</div>'; }
}

function filtrarSolicitudesColab() {
    const filterEstado = document.getElementById('filterEstadoSolicitud').value;
    const cards = document.querySelectorAll('.reporte-card');
    cards.forEach(card => {
        const estadoChip = card.querySelector('.estado-chip');
        const estado = estadoChip ? estadoChip.textContent.trim() : '';
        card.style.display = (!filterEstado || estado === filterEstado) ? 'block' : 'none';
    });
}

function abrirModalAprobarSolicitudColab(idSolicitud) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'modalAprobarSolicitud';
    modal.innerHTML = `
        <div class=\"modal-content\">
            <div class=\"modal-header\">
                <h3>Aprobar Solicitud de Cambio de Horario</h3>
                <button class=\"close-modal\" onclick=\"cerrarModalAprobarSolicitudColab()\">&times;</button>
            </div>
            <div class=\"modal-body\">
                <form id=\"formAprobarSolicitud\">
                    <div class=\"form-group\">
                        <label>Respuesta de aprobación</label>
                        <textarea id=\"respuestaAprobacion\" rows=\"4\" placeholder=\"Escribe tu respuesta de aprobación...\" required></textarea>
                    </div>
                    <div class=\"form-actions\">
                        <button type=\"button\" class=\"btn-cancel\" onclick=\"cerrarModalAprobarSolicitudColab()\">Cancelar</button>
                        <button type=\"submit\" class=\"btn-primary\">Aprobar Solicitud</button>
                    </div>
                </form>
            </div>
        </div>`;
    document.body.appendChild(modal);
    document.getElementById('formAprobarSolicitud').addEventListener('submit', async (e) => { e.preventDefault(); await aprobarSolicitudColab(idSolicitud); });
}

function abrirModalRechazarSolicitudColab(idSolicitud) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'modalRechazarSolicitud';
    modal.innerHTML = `
        <div class=\"modal-content\">
            <div class=\"modal-header\">
                <h3>Rechazar Solicitud de Cambio de Horario</h3>
                <button class=\"close-modal\" onclick=\"cerrarModalRechazarSolicitudColab()\">&times;</button>
            </div>
            <div class=\"modal-body\">
                <form id=\"formRechazarSolicitud\">
                    <div class=\"form-group\">
                        <label>Motivo del rechazo</label>
                        <textarea id=\"respuestaRechazo\" rows=\"4\" placeholder=\"Explica el motivo del rechazo...\" required></textarea>
                    </div>
                    <div class=\"form-actions\">
                        <button type=\"button\" class=\"btn-cancel\" onclick=\"cerrarModalRechazarSolicitudColab()\">Cancelar</button>
                        <button type=\"submit\" class=\"btn-primary\">Rechazar Solicitud</button>
                    </div>
                </form>
            </div>
        </div>`;
    document.body.appendChild(modal);
    document.getElementById('formRechazarSolicitud').addEventListener('submit', async (e) => { e.preventDefault(); await rechazarSolicitudColab(idSolicitud); });
}

async function aprobarSolicitudColab(idSolicitud) {
    const submitBtn = document.querySelector('#formAprobarSolicitud button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    try {
        const respuesta = document.getElementById('respuestaAprobacion').value.trim();
        if (!respuesta) { mostrarCardEmergente(false, 'La respuesta no puede estar vacía'); return; }
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...'; submitBtn.disabled = true; submitBtn.classList.add('loading');
        const token = sessionStorage.getItem('token_sesion') || '';
        const data = { token, id_solicitud: idSolicitud, accion: 'aprobar', respuesta };
        const resp = await fetch('../backend/public/gestionar_solicitudes_horario.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
        const json = await resp.json();
        if (json.success) { mostrarCardEmergente(true, json.message); cerrarModalAprobarSolicitudColab(); cargarSolicitudesHorarioColab(); }
        else { mostrarCardEmergente(false, json.message); }
    } catch (e) { console.error('Error aprobando solicitud', e); mostrarCardEmergente(false, 'Error del servidor'); }
    finally { submitBtn.innerHTML = originalText; submitBtn.disabled = false; submitBtn.classList.remove('loading'); }
}

async function rechazarSolicitudColab(idSolicitud) {
    const submitBtn = document.querySelector('#formRechazarSolicitud button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    try {
        const respuesta = document.getElementById('respuestaRechazo').value.trim();
        if (!respuesta) { mostrarCardEmergente(false, 'El motivo del rechazo no puede estar vacío'); return; }
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...'; submitBtn.disabled = true; submitBtn.classList.add('loading');
        const token = sessionStorage.getItem('token_sesion') || '';
        const data = { token, id_solicitud: idSolicitud, accion: 'rechazar', respuesta };
        const resp = await fetch('../backend/public/gestionar_solicitudes_horario.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
        const json = await resp.json();
        if (json.success) { mostrarCardEmergente(true, json.message); cerrarModalRechazarSolicitudColab(); cargarSolicitudesHorarioColab(); }
        else { mostrarCardEmergente(false, json.message); }
    } catch (e) { console.error('Error rechazando solicitud', e); mostrarCardEmergente(false, 'Error del servidor'); }
    finally { submitBtn.innerHTML = originalText; submitBtn.disabled = false; submitBtn.classList.remove('loading'); }
}

function cerrarModalAprobarSolicitudColab() { const modal = document.getElementById('modalAprobarSolicitud'); if (modal) modal.remove(); }
function cerrarModalRechazarSolicitudColab() { const modal = document.getElementById('modalRechazarSolicitud'); if (modal) modal.remove(); }
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
    
    // Usar data-view si existe para decidir la vista, sino usar texto del span
    const dataView = menuItem.getAttribute('data-view');
    const spanText = menuItem.querySelector('span')?.textContent?.trim() || '';
    const menuText = dataView || spanText;
    
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
    // Normalizar la opción: aceptar data-view y textos visibles
    if (typeof opcion === 'string') {
        const k = opcion.toLowerCase().trim();
        if (
            k === 'reportes-incidencias' ||
            (k.includes('reportes') && k.includes('incid')) ||
            (k === 'reportes' && !k.includes('generar'))
        ) {
            opcion = 'Reportes';
        } else if (k === 'generar-reportes' || (k.includes('generar') && k.includes('reportes'))) {
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
                    <h2>Bienvenido al Panel de Colaboradors</h2>
                    <p>Gestiona tus Espacios desde aquí</p>
                </div>

                <div class="subscription-info" id="subscriptionInfoColab">
                    <div class="subscription-card inicio">
                        <h3>Información de Suscripción del Administrador</h3>
                        <div class="subscription-details">
                            <div class="subscription-plan">
                                <span class="plan-name" id="planNameColab">Cargando...</span>
                                <span class="plan-price" id="planPriceColab"></span>
                            </div>
                            <div class="usage-stats">
                                <div class="stat-item">
                                    <i class="fas fa-building"></i>
                                    <div class="stat-content">
                                        <span class="stat-label">Espacios</span>
                                        <div class="stat-bar"><div class="stat-progress" id="espaciosProgressColab"></div></div>
                                        <span class="stat-text" id="espaciosTextColab">0/0</span>
                                    </div>
                                </div>
                                <div class="stat-item">
                                    <i class="fas fa-calendar-alt"></i>
                                    <div class="stat-content">
                                        <span class="stat-label">Publicaciones</span>
                                        <div class="stat-bar"><div class="stat-progress" id="publicacionesProgressColab"></div></div>
                                        <span class="stat-text" id="publicacionesTextColab">0/0</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-metrics" id="dashboardMetricsColab">
                    <div class="dashboard-metrics-card">
                        <h3 style="margin-top:.25rem;">Resumen general</h3>
                        <div class="metrics-grid">
                            <div class="metric-card">
                                <div class="metric-title"><i class="fas fa-flag"></i> Reportes recibidos</div>
                                <div class="metric-values">
                                    <div><span class="metric-number" id="rep_total_c">-</span><span class="metric-label">Total</span></div>
                                    <div><span class="metric-number" id="rep_resueltos_c">-</span><span class="metric-label">Resueltos</span></div>
                                    <div><span class="metric-number" id="rep_revisados_c">-</span><span class="metric-label">Revisados</span></div>
                                    <div><span class="metric-number" id="rep_pendientes_c">-</span><span class="metric-label">Pendientes</span></div>
                                </div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-title"><i class="fas fa-exchange-alt"></i> Solicitudes de cambio de horario</div>
                                <div class="metric-values">
                                    <div><span class="metric-number" id="sol_total_c">-</span><span class="metric-label">Total</span></div>
                                    <div><span class="metric-number" id="sol_aprobadas_c">-</span><span class="metric-label">Aprobadas</span></div>
                                    <div><span class="metric-number" id="sol_rechazadas_c">-</span><span class="metric-label">Rechazadas</span></div>
                                    <div><span class="metric-number" id="sol_pendientes_c">-</span><span class="metric-label">Pendientes</span></div>
                                </div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-title"><i class="fas fa-user-check"></i> Calificaciones a clientes</div>
                                <div class="metric-values">
                                    <div><span class="metric-number" id="cal_cli_total_c">-</span><span class="metric-label">Total</span></div>
                                </div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-title"><i class="fas fa-door-open"></i> Calificaciones de espacios</div>
                                <div class="metric-values">
                                    <div><span class="metric-number" id="cal_esp_total_c">-</span><span class="metric-label">Total</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            `;
            setTimeout(()=>{ try{ cargarInformacionSuscripcionColab(); }catch(_){} try{ cargarDashboardColab(); }catch(_){ } }, 100);
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
                    <h2>Mi Perfil de Colaborador</h2>
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
                    </div>
                </div>
            `;
            cargarDatosPerfil();
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
                cargarInformacionUsoEspaciosColaborador();
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
            cargarReportesColaborador();
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
            cargarSolicitudesHorarioColab();
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
                    <p>Completa la información para publicar un espacio en arriendo para tu administrador</p>
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
                                <textarea id="descripcionArriendo" name="descripcion" rows="4" placeholder="Describe el espacio, sus características y ventajas..." required></textarea>
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
                cargarInformacionUsoPublicacionesColaborador();
            }, 100);
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
            
            // Hacer petición al backend para obtener datos actualizados de la colaborador
            const response = await fetch('/GestionDeEspacios/backend/public/obtener_perfil_colaborador.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_usuario: usuario.id_usuario
                })
            });
            
            const result = await response.json();
            
            if (result.success && result.colaborador) {
                const colaborador = result.colaborador;
                
                // Actualizar la interfaz con los datos reales de la base de datos
                document.getElementById('profileName').textContent = `${colaborador.nombre} ${colaborador.apellido}`;
                document.getElementById('profileNombreUsuario').value = colaborador.nombre_usuario || '';
                document.getElementById('profileNombre').value = colaborador.nombre || '';
                document.getElementById('profileApellido').value = colaborador.apellido || '';
                document.getElementById('profileEmail').value = colaborador.correo_electronico || '';
                document.getElementById('profileTelefono').value = colaborador.telefono || '';
                document.getElementById('profileDireccion').value = colaborador.direccion || '';
                
                // Cargar regiones y ciudades automáticamente
                await cargarRegionesYCiudades();
                
                // Establecer valores de región y ciudad
                if (colaborador.region) {
                    document.getElementById('profileRegion').value = colaborador.region;
                    await cargarCiudadesPorRegion(colaborador.region);
                    if (colaborador.ciudad) {
                        document.getElementById('profileCiudad').value = colaborador.ciudad;
                    }
                }
                
                // Actualizar también los datos en sessionStorage para mantener consistencia
                usuario.nombre = colaborador.nombre;
                usuario.apellido = colaborador.apellido;
                usuario.nombre_usuario = colaborador.nombre_usuario;
                usuario.correo_electronico = colaborador.correo_electronico;
                usuario.telefono = colaborador.telefono;
                usuario.region = colaborador.region;
                usuario.ciudad = colaborador.ciudad;
                usuario.direccion = colaborador.direccion;
                sessionStorage.setItem('usuario_logueado', JSON.stringify(usuario));
                
            } else {
                // Fallback: usar datos de la sesión si hay error
                console.warn('No se pudieron cargar datos actualizados, usando datos de sesión');
                document.getElementById('profileName').textContent = `${usuario.nombre} ${usuario.apellido}`;
                document.getElementById('profileNombreUsuario').value = usuario.nombre_usuario || '';
                document.getElementById('profileNombre').value = usuario.nombre || '';
                document.getElementById('profileApellido').value = usuario.apellido || '';
                document.getElementById('profileEmail').value = usuario.correo_electronico || '';
                document.getElementById('profileTelefono').value = usuario.telefono || '';
                document.getElementById('profileDireccion').value = usuario.direccion || '';
                
                await cargarRegionesYCiudades();
                
                if (usuario.region) {
                    document.getElementById('profileRegion').value = usuario.region;
                    await cargarCiudadesPorRegion(usuario.region);
                    if (usuario.ciudad) {
                        document.getElementById('profileCiudad').value = usuario.ciudad;
                    }
                }
            }
        } catch (error) {
            console.error('Error al cargar datos del perfil:', error);
            // Fallback: usar datos de la sesión
            const usuario = JSON.parse(usuarioLogueado);
            document.getElementById('profileName').textContent = `${usuario.nombre} ${usuario.apellido}`;
            document.getElementById('profileNombreUsuario').value = usuario.nombre_usuario || '';
            document.getElementById('profileNombre').value = usuario.nombre || '';
            document.getElementById('profileApellido').value = usuario.apellido || '';
            document.getElementById('profileEmail').value = usuario.correo_electronico || '';
            document.getElementById('profileTelefono').value = usuario.telefono || '';
            document.getElementById('profileDireccion').value = usuario.direccion || '';
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
        
        console.log('Respuesta del servidor de regiones:', data);
        
        const regionSelect = document.getElementById('profileRegion');
        regionSelect.innerHTML = '<option value="">Selecciona una región</option>';
        
        if (data.success && Array.isArray(data.regiones)) {
            data.regiones.forEach(regionObj => {
                const nombreRegion = regionObj.nombre_region;
                const option = document.createElement('option');
                option.value = nombreRegion;
                option.textContent = nombreRegion;
                regionSelect.appendChild(option);
            });
        } else {
            console.error('Error en la respuesta del servidor de regiones:', data);
        }
        
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

        // Obtener id_region por nombre
        const regionesResp = await fetch('../backend/public/regiones_chile.php?action=regiones');
        const regionesData = await regionesResp.json();
        if (!regionesData.success || !Array.isArray(regionesData.regiones)) return;

        const regionObj = regionesData.regiones.find(r => (r.nombre_region || '') === region);
        if (!regionObj) {
            console.warn('Región no encontrada para cargar ciudades:', region);
            return;
        }

        const response = await fetch(`../backend/public/regiones_chile.php?action=ciudades&id_region=${regionObj.id_region}`);
        const data = await response.json();
        
        console.log('Respuesta del servidor de ciudades:', data);
        
        const ciudadSelect = document.getElementById('profileCiudad');
        ciudadSelect.innerHTML = '<option value="">Selecciona una ciudad</option>';
        
        if (data.success && Array.isArray(data.ciudades)) {
            data.ciudades.forEach(ciudadObj => {
                const nombreCiudad = ciudadObj.nombre_ciudad;
                const option = document.createElement('option');
                option.value = nombreCiudad;
                option.textContent = nombreCiudad;
                ciudadSelect.appendChild(option);
            });
        } else {
            console.error('Error al cargar ciudades:', data.message || 'Error desconocido');
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
        
        const response = await fetch('/GestionDeEspacios/backend/public/obtener_perfil_colaborador.php', {
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
        
        const response = await fetch('/GestionDeEspacios/backend/public/obtener_perfil_colaborador.php', {
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


// Función para cargar regiones y ciudades para el formulario de espacios
async function cargarRegionesYCiudadesEspacios() {
    try {
        const response = await fetch('../backend/public/regiones_chile.php?action=regiones');
        const data = await response.json();
        
        if (data.success && Array.isArray(data.regiones)) {
            const regionSelect = document.getElementById('region');
            regionSelect.innerHTML = '<option value="">Selecciona una región</option>';
            
            // Llenar select de regiones
            data.regiones.forEach(region => {
                const nombreRegion = region.nombre_region;
                const option = document.createElement('option');
                option.value = nombreRegion;
                option.textContent = nombreRegion;
                regionSelect.appendChild(option);
            });
            
            // Agregar evento para cargar ciudades cuando cambie la región
            regionSelect.addEventListener('change', function() {
                const ciudadSelect = document.getElementById('ciudad');
                if (this.value) {
                    cargarCiudadesPorRegionEspacios(this.value);
                } else if (ciudadSelect) {
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
        // Obtener id_region por nombre
        const regionesResp = await fetch('../backend/public/regiones_chile.php?action=regiones');
        const regionesData = await regionesResp.json();
        if (!regionesData.success || !Array.isArray(regionesData.regiones)) return;

        const regionObj = regionesData.regiones.find(r => (r.nombre_region || '') === region);
        if (!regionObj) {
            console.warn('Región no encontrada para cargar ciudades (espacios):', region);
            return;
        }

        const response = await fetch(`../backend/public/regiones_chile.php?action=ciudades&id_region=${regionObj.id_region}`);
        const data = await response.json();
        
        const ciudadSelect = document.getElementById('ciudad');
        if (!ciudadSelect) return;
        ciudadSelect.innerHTML = '<option value="">Selecciona una ciudad</option>';
        
        if (data.success && Array.isArray(data.ciudades)) {
            data.ciudades.forEach(ciudad => {
                const nombreCiudad = ciudad.nombre_ciudad;
                const option = document.createElement('option');
                option.value = nombreCiudad;
                option.textContent = nombreCiudad;
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
                <button type="button" onclick="removePhoto('${input.id}', '${previewId}')" class="remove-photo">×</button>
            `;
            preview.style.position = 'relative';
        };
        
        reader.readAsDataURL(input.files[0]);
    }
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
        formData.append('id_administrador', usuario.id_administrador);
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
        
        scheduleItems.forEach((item, index) => {
            const nombre_dia = item.querySelector(`select[name="horarios[${index + 1}][nombre_dia]"]`)?.value;
            const hora_inicio = item.querySelector(`input[name="horarios[${index + 1}][hora_inicio]"]`)?.value;
            const hora_fin = item.querySelector(`input[name="horarios[${index + 1}][hora_fin]"]`)?.value;
            const fecha_inicio = item.querySelector(`input[name="horarios[${index + 1}][fecha_inicio]"]`)?.value;
            const fecha_termino = item.querySelector(`input[name="horarios[${index + 1}][fecha_termino]"]`)?.value;
            const descripcion = item.querySelector(`input[name="horarios[${index + 1}][descripcion]"]`)?.value;
            
            if (nombre_dia && hora_inicio && hora_fin && fecha_inicio && fecha_termino) {
                horarios.push({
                    nombre_dia: nombre_dia.trim(),
                    hora_inicio: hora_inicio,
                    hora_fin: hora_fin,
                    fecha_inicio: fecha_inicio,
                    fecha_termino: fecha_termino,
                    descripcion: descripcion ? descripcion.trim() : ''
                });
            }
        });
        
        formData.append('horarios', JSON.stringify(horarios));
        
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
            body: `action=obtener_espacios_completos&id_administrador=${usuario.id_administrador}`
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
            body: `action=obtener_espacio_por_id&id_espacio=${idEspacio}&id_administrador=${usuario.id_administrador}`
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
                                                <input type="hidden" name="eliminar_foto${num}" value="0" id="eliminar_foto${num}">
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
                                                        <option value="No Disponible" ${equipo.estado === 'No Disponible' ? 'selected' : ''}>No Disponible</option>
                                                    </select>
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
                        <option value="No Disponible">No Disponible</option>
                    </select>
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
    const previewId = `edit_preview${fotoCampo.replace('foto', '')}`;
    const eliminarInput = document.getElementById(`eliminar_foto${fotoCampo.replace('foto', '')}`);
    const fileInput = document.getElementById(`edit_foto${fotoCampo.replace('foto', '')}`);
    
    // Marcar para eliminar en el backend
    if (eliminarInput) {
        eliminarInput.value = '1';
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
            body: `action=eliminar_asignacion&id_asignacion=${idAsignacion}&id_administrador=${usuario.id_administrador}`
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
            body: `action=actualizar_asignacion&id_asignacion=${idAsignacion}&id_horario=${nuevoHorario}&id_administrador=${usuario.id_administrador}`
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
            body: `action=intercambiar_horarios&id_asignacion_1=${idAsignacion}&id_asignacion_2=${otraAsignacion}&id_administrador=${usuario.id_administrador}`
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
        formData.append('id_administrador', usuario.id_administrador);
        
        // Recopilar equipamiento
        const equipamiento = [];
        const equipmentItems = document.querySelectorAll('#edit_equipment_list .equipment-item');
        equipmentItems.forEach((item, index) => {
            const nombre = item.querySelector(`input[name="equipamiento[${index}][nombre]"]`)?.value;
            const cantidad = item.querySelector(`input[name="equipamiento[${index}][cantidad]"]`)?.value;
            const descripcion = item.querySelector(`textarea[name="equipamiento[${index}][descripcion]"]`)?.value;
            const estado = item.querySelector(`select[name="equipamiento[${index}][estado]"]`)?.value;
            
            if (nombre && cantidad) {
                equipamiento.push({
                    nombre: nombre,
                    cantidad: cantidad,
                    descripcion: descripcion || '',
                    estado: estado || 'Disponible'
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
    const searchResults = document.getElementById('searchResults');
    
    // Filtrar clientes por RUT
    const clientesFiltrados = clientesData.filter(cliente => 
        cliente.rut.toLowerCase().includes(query.toLowerCase())
    );
    
    if (clientesFiltrados.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No se encontraron clientes con ese RUT</div>';
    } else {
        searchResults.innerHTML = clientesFiltrados.map(cliente => `
            <div class="client-result-item" onclick="seleccionarCliente(${cliente.id_usuario})">
                <div class="client-avatar-small">${cliente.nombre.charAt(0)}${cliente.apellido.charAt(0)}</div>
                <div class="client-info">
                    <div class="client-name">${cliente.nombre} ${cliente.apellido}</div>
                    <div class="client-rut">RUT: ${cliente.rut}</div>
                    <div class="client-phone">Tel: ${cliente.telefono}</div>
                </div>
            </div>
        `).join('');
    }
    
    searchResults.style.display = 'block';
}

// Función para seleccionar un cliente
function seleccionarCliente(idCliente) {
    const cliente = clientesData.find(c => c.id_usuario == idCliente);
    if (!cliente) return;
    
    clienteSeleccionado = cliente;
    
    // Ocultar resultados de búsqueda
    document.getElementById('searchResults').style.display = 'none';
    
    // Limpiar campo de búsqueda
    document.getElementById('clienteSearch').value = '';
    
    // Mostrar cliente seleccionado
    mostrarClienteSeleccionado(cliente);
    
    // Habilitar botón de confirmación
    document.getElementById('confirmAssignBtn').disabled = false;
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
            body: `action=obtener_horarios_disponibles&id_espacio=${espacio.id_espacio}&id_administrador=${usuario.id_administrador}`
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

// ==================== FUNCIONES PARA PUBLICAR ARRIENDO ====================

// Función para cargar regiones
async function cargarRegionesArriendo() {
    try {
        const response = await fetch('/GestionDeEspacios/backend/public/regiones_chile.php?action=regiones');
        const data = await response.json();
        
        const select = document.getElementById('regionArriendo');
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

// Función para cargar ciudades
async function cargarCiudadesArriendo() {
    const region = document.getElementById('regionArriendo').value;
    if (!region) return;
    
    try {
        // Obtener id_region por nombre y luego cargar ciudades
        const regionesResp = await fetch('/GestionDeEspacios/backend/public/regiones_chile.php?action=regiones');
        const regionesData = await regionesResp.json();
        if (!regionesData.success) return;
        const regionObj = (regionesData.regiones || []).find(r => r.nombre_region === region);
        if (!regionObj) return;
        const response = await fetch(`/GestionDeEspacios/backend/public/regiones_chile.php?action=ciudades&id_region=${regionObj.id_region}`);
        const data = await response.json();
        
        const select = document.getElementById('ciudadArriendo');
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
        // Para colaborador, publicar como su administrador asociado
        formData.append('id_usuario', usuario.id_administrador || usuario.id_usuario);
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
            // Limpiar previews
            for (let i = 1; i <= 5; i++) {
                document.getElementById(`preview${i}`).innerHTML = '';
            }
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

// Función para cargar arriendos del usuario
async function cargarArriendosUsuario() {
    try {
        const token = sessionStorage.getItem('token_sesion');
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        
        if (!usuarioLogueado) {
            document.getElementById('arriendosList').innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>No hay sesión activa</p>
                </div>
            `;
            return;
        }
        
        const usuario = JSON.parse(usuarioLogueado);
        // Para colaborador, obtener arriendos de su administrador asociado
        const idUsuario = usuario.id_administrador || usuario.id_usuario;
        
        const response = await fetch(`/GestionDeEspacios/backend/public/gestionar_arriendo.php?action=obtener_publicaciones&token=${token}&id_usuario=${idUsuario}`);
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
                        <button class="btn-action ratings" onclick="verCalificacionesArriendoColab(${arriendo.id_publicacion})" title="Ver calificaciones">
                            <i class="fas fa-star-half-alt"></i>
                        </button>
                        <button class="btn-action edit" onclick="editarArriendo(${arriendo.id_publicacion})" title="Editar">
                            <i class="fas fa-edit"></i>
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

// Función para ver detalles del arriendo
async function verDetallesArriendo(id) {
    try {
        const token = sessionStorage.getItem('token_sesion');
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        
        if (!usuarioLogueado) {
            mostrarCardEmergente(false, 'No hay sesión activa');
            return;
        }
        
        const usuario = JSON.parse(usuarioLogueado);
        const idUsuario = usuario.id_administrador || usuario.id_usuario;
        
        const response = await fetch(`/GestionDeEspacios/backend/public/gestionar_arriendo.php?action=obtener_publicaciones&token=${token}&id_usuario=${idUsuario}`);
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

// === Calificaciones de arriendo (Colaborador) ===
async function verCalificacionesArriendoColab(idPublicacion){
    try{ mostrarLoadingCalificacionesColab(); const data=await obtenerCalificacionesArriendoColab(idPublicacion); crearModalCalificacionesColab(idPublicacion, data.calificaciones||[], data.promedio_general||0); }
    catch(e){ console.error('Error calificaciones colab:', e); mostrarErrorCalificacionesColab('Error al cargar las calificaciones'); }
}

async function obtenerCalificacionesArriendoColab(idPublicacion){
    if(!idPublicacion||isNaN(idPublicacion)) throw new Error('ID inválido');
    const resp = await fetch('/GestionDeEspacios/backend/public/calificar_espacios.php', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:`action=obtener_calificaciones&id_publicacion=${encodeURIComponent(parseInt(idPublicacion))}` });
    const json = await resp.json();
    if(!json.success) throw new Error(json.message||'Error al obtener calificaciones');
    return { calificaciones: json.calificaciones||[], promedio_general: json.promedio_general||0 };
}

function mostrarLoadingCalificacionesColab(){
    let modal=document.getElementById('modalCalificacionesArriendoColab');
    if(!modal){ modal=document.createElement('div'); modal.id='modalCalificacionesArriendoColab'; modal.className='modal-overlay'; document.body.appendChild(modal); }
    modal.innerHTML=`
        <div class="modal-content calificaciones-modal">
            <div class="modal-header">
                <h3><i class="fas fa-star-half-alt"></i> Calificaciones del Arriendo</h3>
                <button class="modal-close" onclick="cerrarModalCalificacionesArriendoColab()"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body"><div class="loading-calificaciones"><i class=\"fas fa-spinner fa-spin\"></i><p>Cargando calificaciones...</p></div></div>
        </div>`;
    modal.style.display='flex'; modal.classList.add('show');
}

function crearModalCalificacionesColab(idPublicacion, calificaciones, promedioGeneral){
    const modal=document.getElementById('modalCalificacionesArriendoColab');
    let contenido='';
    if(!calificaciones||!calificaciones.length){
        contenido=`<div class="no-calificaciones"><i class="fas fa-star"></i><h4>No hay calificaciones aún</h4><p>Este arriendo aún no ha recibido calificaciones.</p></div>`;
    } else {
        const promedio=Number(promedioGeneral||0);
        contenido=`
            <div class="calificaciones-resumen">
                <div class="promedio-calificacion">
                    <div class="promedio-numero">${promedio.toFixed(1)}</div>
                    <div class="promedio-estrellas">${generarEstrellasPromedioColab(promedio)}</div>
                    <div class="promedio-texto">Basado en ${calificaciones.length} calificación${calificaciones.length!==1?'es':''}</div>
                </div>
            </div>
            <div class="calificaciones-lista">
                ${calificaciones.map(c=>`
                    <div class="calificacion-item">
                        <div class="calificacion-header">
                            <div class="calificacion-usuario">
                                <div class="usuario-avatar">${(c.nombre||'U').charAt(0).toUpperCase()}</div>
                                <div class="usuario-info">
                                    <div class="usuario-nombre">${c.nombre||'Usuario'} ${c.apellido||''}</div>
                                    <div class="calificacion-fecha">${formatearFechaColab(c.fecha_calificacion)}</div>
                                </div>
                            </div>
                            <div class="calificacion-puntuacion">${generarEstrellasCalificacionColab(c.promedio_calificacion)}<span class="puntuacion-numero">${c.promedio_calificacion}</span></div>
                        </div>
                        <div class="calificacion-comentario">${c.comentario||'Sin comentario'}</div>
                    </div>`).join('')}
            </div>`;
    }
    modal.innerHTML=`
        <div class="modal-content calificaciones-modal">
            <div class="modal-header">
                <h3><i class="fas fa-star-half-alt"></i> Calificaciones del Arriendo</h3>
                <button class="modal-close" onclick="cerrarModalCalificacionesArriendoColab()"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">${contenido}</div>
        </div>`;
    modal.style.display='flex'; modal.classList.add('show');
}

function cerrarModalCalificacionesArriendoColab(){ const modal=document.getElementById('modalCalificacionesArriendoColab'); if(modal){ modal.classList.remove('show'); setTimeout(()=>{ modal.style.display='none'; },300);} }
function generarEstrellasPromedioColab(prom){ let e=''; const enter=Math.floor(prom); const half=prom%1>=0.5; for(let i=0;i<enter;i++) e+='<i class="fas fa-star"></i>'; if(half) e+='<i class="fas fa-star-half-alt"></i>'; const vac=5-enter-(half?1:0); for(let i=0;i<vac;i++) e+='<i class="far fa-star"></i>'; return e; }
function generarEstrellasCalificacionColab(p){ let e=''; const n=parseFloat(p); for(let i=1;i<=5;i++){ e+= i<=n ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>'; } return e; }
function formatearFechaColab(f){ const d=new Date(f); return d.toLocaleDateString('es-ES',{year:'numeric',month:'long',day:'numeric'}); }
function mostrarErrorCalificacionesColab(msg){ let modal=document.getElementById('modalCalificacionesArriendoColab'); if(!modal){ modal=document.createElement('div'); modal.id='modalCalificacionesArriendoColab'; modal.className='modal-overlay'; document.body.appendChild(modal);} modal.innerHTML=`<div class=\"modal-content calificaciones-modal\"><div class=\"modal-header\"><h3><i class=\"fas fa-star-half-alt\"></i> Calificaciones del Arriendo</h3><button class=\"modal-close\" onclick=\"cerrarModalCalificacionesArriendoColab()\"><i class=\"fas fa-times\"></i></button></div><div class=\"modal-body\"><div class=\"error-calificaciones\"><i class=\"fas fa-exclamation-triangle\"></i><h4>Error</h4><p>${msg}</p></div></div></div>`; modal.style.display='flex'; modal.classList.add('show'); }
// Función para cerrar modal de detalles
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
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        
        if (!usuarioLogueado) {
            mostrarCardEmergente(false, 'No hay sesión activa');
            return;
        }
        
        const usuario = JSON.parse(usuarioLogueado);
        const idUsuario = usuario.id_administrador || usuario.id_usuario;
        
        const response = await fetch(`/GestionDeEspacios/backend/public/gestionar_arriendo.php?action=obtener_publicaciones&token=${token}&id_usuario=${idUsuario}`);
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
                    <div id="editPreview1" class="photo-preview"></div>
                                </div>
                                <div class="photo-upload-item">
                                    <input type="file" id="editFoto2" name="foto2" accept="image/*" onchange="previewImage(this, 'editPreview2')">
                                    <label for="editFoto2" class="photo-upload-label">
                                        <i class="fas fa-camera"></i>
                                        <span>IMG</span>
                                    </label>
                    <div id="editPreview2" class="photo-preview"></div>
                                </div>
                                <div class="photo-upload-item">
                                    <input type="file" id="editFoto3" name="foto3" accept="image/*" onchange="previewImage(this, 'editPreview3')">
                                    <label for="editFoto3" class="photo-upload-label">
                                        <i class="fas fa-camera"></i>
                                        <span>IMG</span>
                                    </label>
                    <div id="editPreview3" class="photo-preview"></div>
                                </div>
                                <div class="photo-upload-item">
                                    <input type="file" id="editFoto4" name="foto4" accept="image/*" onchange="previewImage(this, 'editPreview4')">
                                    <label for="editFoto4" class="photo-upload-label">
                                        <i class="fas fa-camera"></i>
                                        <span>IMG</span>
                                    </label>
                    <div id="editPreview4" class="photo-preview"></div>
                                </div>
                                <div class="photo-upload-item">
                                    <input type="file" id="editFoto5" name="foto5" accept="image/*" onchange="previewImage(this, 'editPreview5')">
                                    <label for="editFoto5" class="photo-upload-label">
                                        <i class="fas fa-camera"></i>
                                        <span>IMG</span>
                                    </label>
                    <div id="editPreview5" class="photo-preview"></div>
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
                        previews[idx].innerHTML = `<img src="/GestionDeEspacios/backend/${f.url_imagen}" alt="Foto actual"><button type=\"button\" class=\"remove-photo\" onclick=\"removePhoto('editFoto${idx+1}', 'editPreview${idx+1}')\"><i class=\"fas fa-times\"></i></button>`;
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
        const response = await fetch('/GestionDeEspacios/backend/public/regiones_chile.php?action=regiones');
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
        const regionesResp = await fetch('/GestionDeEspacios/backend/public/regiones_chile.php?action=regiones');
        const regionesData = await regionesResp.json();
        if (!regionesData.success) return;
        const regionObj = (regionesData.regiones || []).find(r => r.nombre_region === region);
        if (!regionObj) return;
        const response = await fetch(`/GestionDeEspacios/backend/public/regiones_chile.php?action=ciudades&id_region=${regionObj.id_region}`);
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
        
        const result = await response.json();
        
        if (result.success) {
            mostrarCardEmergente(true, result.message);
            cerrarModalEditarArriendo();
            cargarArriendosUsuario(); // Recargar la lista
        } else {
            mostrarCardEmergente(false, result.message);
        }
        
    } catch (error) {
        console.error('Error al editar arriendo:', error);
        mostrarCardEmergente(false, 'Error al editar el arriendo');
    }
}


// Función para preview de imagen
function previewImage(input, previewId) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById(previewId).innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="remove-photo" onclick="removePhoto('${input.id}', '${previewId}')">
                    <i class="fas fa-times"></i>
                </button>
            `;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Función para remover foto (para arriendos)
function removePhoto(inputId, previewId) {
    document.getElementById(inputId).value = '';
    document.getElementById(previewId).innerHTML = '';
    
    // Agregar campo oculto para indicar que la foto fue eliminada
    const form = document.getElementById('editarArriendoForm');
    if (form) {
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
}

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


// ==================== FUNCIONES PARA CARGAR REGIONES Y CIUDADES ====================

// Función para cargar regiones al inicializar
async function cargarRegiones() {
    try {
        const response = await fetch('/GestionDeEspacios/backend/public/regiones_chile.php');
        const data = await response.json();
        
        if (data.success) {
            const regionSelect = document.getElementById('region');
            if (regionSelect) {
                regionSelect.innerHTML = '<option value="">Seleccionar región...</option>';
                data.regiones.forEach(region => {
                    const option = document.createElement('option');
                    option.value = region.nombre;
                    option.textContent = region.nombre;
                    regionSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error al cargar regiones:', error);
    }
}

// Función para cargar información de uso de espacios (para colaboradors)
async function cargarInformacionUsoEspaciosColaborador() {
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (!usuarioLogueado) return;
        
        const usuario = JSON.parse(usuarioLogueado);
        const idAdministrador = usuario.id_administrador; // Para colaboradors, usar el administrador asociado
        
        console.log('Colaborador Espacios - Usuario:', usuario);
        console.log('Colaborador Espacios - ID Administrador:', idAdministrador);
        
        if (!idAdministrador) {
            console.error('No se encontró ID del administrador asociado');
            document.getElementById('espaciosUsageText').textContent = 'Error: No se encontró administrador asociado';
            return;
        }
        
        // Cargar contadores
        const contadoresResponse = await fetch('/GestionDeEspacios/backend/public/contador_espacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=obtener_contadores&id_administrador=${idAdministrador}`
        });
        
        const contadoresData = await contadoresResponse.json();
        console.log('Colaborador Espacios - Respuesta:', contadoresData);
        
        if (contadoresData.success) {
            const contadores = contadoresData.contadores;
            const elementosDisponibles = contadores.espacios_disponibles;
            
            document.getElementById('espaciosUsageText').textContent = 
                `Tu administrador ha publicado ${contadores.total_espacios} espacios. Quedan ${elementosDisponibles} espacios disponibles.`;
            
            // Cambiar color según disponibilidad
            const headerElement = document.getElementById('espaciosUsageHeader');
            const iconElement = headerElement.querySelector('i');
            
            if (elementosDisponibles === 0) {
                // Sin espacios disponibles - Rojo
                headerElement.style.setProperty('border-left-color', '#e74c3c', 'important');
                iconElement.style.setProperty('color', '#e74c3c', 'important');
            } else {
                // Con espacios disponibles - Verde
                headerElement.style.setProperty('border-left-color', '#27ae60', 'important');
                iconElement.style.setProperty('color', '#27ae60', 'important');
            }
        } else {
            console.error('Error en respuesta de contadores:', contadoresData.message);
            document.getElementById('espaciosUsageText').textContent = 'Error al cargar información de espacios';
        }
        
    } catch (error) {
        console.error('Error al cargar información de uso de espacios:', error);
        document.getElementById('espaciosUsageText').textContent = 'Error al cargar información';
    }
}

// Función para cargar información de uso de publicaciones (para colaboradors)
async function cargarInformacionUsoPublicacionesColaborador() {
    try {
        const usuarioLogueado = sessionStorage.getItem('usuario_logueado');
        if (!usuarioLogueado) return;
        
        const usuario = JSON.parse(usuarioLogueado);
        const idAdministrador = usuario.id_administrador; // Para colaboradors, usar el administrador asociado
        
        console.log('Colaborador Arriendo - Usuario:', usuario);
        console.log('Colaborador Arriendo - ID Administrador:', idAdministrador);
        
        if (!idAdministrador) {
            console.error('No se encontró ID del administrador asociado');
            document.getElementById('arriendoUsageText').textContent = 'Error: No se encontró administrador asociado';
            return;
        }
        
        // Cargar contadores
        const contadoresResponse = await fetch('/GestionDeEspacios/backend/public/contador_espacios.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=obtener_contadores&id_administrador=${idAdministrador}`
        });
        
        const contadoresData = await contadoresResponse.json();
        console.log('Colaborador Arriendo - Respuesta:', contadoresData);
        
        if (contadoresData.success) {
            const contadores = contadoresData.contadores;
            const publicacionesDisponibles = contadores.publicaciones_disponibles;
            
            document.getElementById('arriendoUsageText').textContent = 
                `Tu administrador ha publicado ${contadores.total_publicaciones} arriendos. Quedan ${publicacionesDisponibles} publicaciones disponibles.`;
            
            // Cambiar color según disponibilidad
            const headerElement = document.getElementById('arriendoUsageHeader');
            if (publicacionesDisponibles === 0) {
                headerElement.style.setProperty('border-left-color', '#e74c3c', 'important');
                headerElement.style.setProperty('background-color', '#fdf2f2', 'important');
            } else if (publicacionesDisponibles <= 2) {
                headerElement.style.setProperty('border-left-color', '#f39c12', 'important');
                headerElement.style.setProperty('background-color', '#fef9e7', 'important');
            } else {
                headerElement.style.setProperty('border-left-color', '#27ae60', 'important');
                headerElement.style.setProperty('background-color', '#f0f9f0', 'important');
            }
        } else {
            console.error('Error en respuesta de contadores:', contadoresData.message);
            document.getElementById('arriendoUsageText').textContent = 'Error al cargar información de publicaciones';
        }
        
    } catch (error) {
        console.error('Error al cargar información de uso de publicaciones:', error);
        document.getElementById('arriendoUsageText').textContent = 'Error al cargar información';
    }
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
        const formData = new FormData();
        formData.append('region', regionSeleccionada);
        
        const response = await fetch('/GestionDeEspacios/backend/public/regiones_chile.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            data.ciudades.forEach(ciudad => {
                const option = document.createElement('option');
                option.value = ciudad.nombre;
                option.textContent = ciudad.nombre;
                ciudadSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar ciudades:', error);
    }
} 