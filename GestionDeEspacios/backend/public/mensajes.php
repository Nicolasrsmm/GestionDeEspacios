<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/db_config.php';

// Función para validar sesión
function validarSesionPorToken() {
    // Intentar obtener el token de diferentes maneras
    $token = null;
    
    // Método 1: Header Authorization
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        $token = str_replace('Bearer ', '', $authHeader);
    }
    
    // Método 2: Header personalizado
    if (empty($token) && isset($_SERVER['HTTP_X_AUTH_TOKEN'])) {
        $token = $_SERVER['HTTP_X_AUTH_TOKEN'];
    }
    
    // Método 3: SessionStorage (para debug)
    if (empty($token) && isset($_GET['token'])) {
        $token = $_GET['token'];
    }
    
    // Método 4: Parámetro de rol específico
    $rol_especifico = null;
    if (isset($_GET['rol'])) {
        $rol_especifico = $_GET['rol'];
        error_log("Debug: Rol específico recibido: " . $rol_especifico);
    }
    
    if (empty($token)) {
        error_log("Debug: No se encontró token en headers");
        return false;
    }
    
    try {
        $conn = getDBConnection();
        $stmt = $conn->prepare("SELECT u.id_usuario, c.nombre_usuario, c.correo_electronico, r.nombre_rol 
                               FROM usuarios u 
                               JOIN credenciales c ON u.id_usuario = c.id_usuario
                               JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario 
                               JOIN roles r ON ur.id_rol = r.id_rol 
                               JOIN sesion s ON u.id_usuario = s.id_usuario 
                               WHERE s.token_sesion = ? AND u.activo = 1 AND ur.estado = 'Activo'
                               ORDER BY CASE 
                                   WHEN r.nombre_rol = 'Cliente' THEN 1
                                   WHEN r.nombre_rol = 'Administrador' THEN 2
                                   WHEN r.nombre_rol = 'Admin Sistema' THEN 3
                                   ELSE 4
                               END");
        $stmt->bind_param("s", $token);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $usuario = $result->fetch_assoc();
            error_log("Debug: Usuario validado correctamente: " . json_encode($usuario));
            
            // Si se especificó un rol específico, usarlo en lugar del de la base de datos
            if ($rol_especifico) {
                error_log("Debug: Usando rol específico: " . $rol_especifico);
                // Convertir el rol a la forma correcta (primera letra mayúscula)
                $rol_especifico = ucfirst(strtolower($rol_especifico));
                $usuario['nombre_rol'] = $rol_especifico;
            } else {
                error_log("Debug: Rol seleccionado de BD: " . $usuario['nombre_rol']);
            }
            
            error_log("Debug: Rol final que se usará: " . $usuario['nombre_rol']);
            
            return $usuario;
        }
        
        error_log("Debug: No se encontró usuario con token: " . $token);
        return false;
    } catch (Exception $e) {
        error_log("Error en validarSesionPorToken: " . $e->getMessage());
        return false;
    }
}

// Función para obtener administradores asignados (para clientes)
function obtenerAdministradoresAsignados($idCliente) {
    try {
        $conn = getDBConnection();
        
        error_log("Debug: Buscando administradores para cliente ID: " . $idCliente);
        
        // Primero verificar si hay asignaciones para este cliente
        $stmt = $conn->prepare("SELECT COUNT(*) as total FROM asignacion_espacio_cliente WHERE id_usuario = ?");
        $stmt->bind_param("i", $idCliente);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        error_log("Debug: Total asignaciones para cliente: " . $row['total']);
        
        if ($row['total'] == 0) {
            error_log("Debug: No hay asignaciones para este cliente");
            return [];
        }
        
        // Verificar las asignaciones específicas
        $stmt = $conn->prepare("
            SELECT aec.id_asignacion, aec.id_espacio, ge.nombre_espacio, ge.id_usuario as admin_id
            FROM asignacion_espacio_cliente aec
            JOIN gestiondeespacio ge ON aec.id_espacio = ge.id_espacio
            WHERE aec.id_usuario = ?
        ");
        $stmt->bind_param("i", $idCliente);
        $stmt->execute();
        $result = $stmt->get_result();
        
        error_log("Debug: Asignaciones específicas encontradas: " . $result->num_rows);
        while ($row = $result->fetch_assoc()) {
            error_log("Debug: Asignación - ID: " . $row['id_asignacion'] . ", Espacio: " . $row['nombre_espacio'] . ", Admin ID: " . $row['admin_id']);
        }
        
        // Obtener los administradores de los espacios asignados al cliente
        $stmt = $conn->prepare("
            SELECT DISTINCT
                ge.id_usuario as id_administrador,
                CONCAT(u.nombre, ' ', u.apellido) as nombre_administrador,
                u.telefono,
                GROUP_CONCAT(ge.nombre_espacio SEPARATOR ', ') as espacios_asignados
            FROM asignacion_espacio_cliente aec
            JOIN gestiondeespacio ge ON aec.id_espacio = ge.id_espacio
            JOIN usuarios u ON ge.id_usuario = u.id_usuario
            WHERE aec.id_usuario = ? AND u.activo = 1
            GROUP BY ge.id_usuario, u.nombre, u.apellido, u.telefono
        ");
        $stmt->bind_param("i", $idCliente);
        $stmt->execute();
        $result = $stmt->get_result();
        
        error_log("Debug: Administradores encontrados: " . $result->num_rows);
        
        $administradores = [];
        while ($row = $result->fetch_assoc()) {
            error_log("Debug: Administrador: " . json_encode($row));
            $administradores[] = [
                'id_administrador' => $row['id_administrador'],
                'nombre_administrador' => $row['nombre_administrador'],
                'telefono' => $row['telefono'],
                'espacios_asignados' => $row['espacios_asignados']
            ];
        }
        
        error_log("Debug: Total administradores devueltos: " . count($administradores));
        
        return $administradores;
        
    } catch (Exception $e) {
        error_log("Error en obtenerAdministradoresAsignados: " . $e->getMessage());
        return [];
    }
}

// Función para obtener clientes asignados por el administrador
function obtenerClientesAsignados($idUsuario) {
    try {
        $conn = getDBConnection();
        
        // Consulta simplificada para debuggear paso a paso
        error_log("Debug: Buscando clientes para usuario ID: " . $idUsuario);
        
        // Primero, verificar si hay asignaciones
        $stmt = $conn->prepare("
            SELECT aec.*, ge.id_usuario as admin_espacio
            FROM asignacion_espacio_cliente aec
            JOIN gestiondeespacio ge ON aec.id_espacio = ge.id_espacio
            WHERE ge.id_usuario = ?
        ");
        $stmt->bind_param("i", $idUsuario);
        $stmt->execute();
        $result = $stmt->get_result();
        
        error_log("Debug: Asignaciones encontradas: " . $result->num_rows);
        
        if ($result->num_rows == 0) {
            error_log("Debug: No hay asignaciones para este administrador");
            return [];
        }
        
        // Ahora obtener los datos completos
        $stmt = $conn->prepare("
            SELECT 
                u.id_usuario as id_cliente,
                CONCAT(u.nombre, ' ', u.apellido) as nombre_cliente,
                u.telefono,
                u.direccion,
                r.nombre_region,
                c.nombre_ciudad,
                ge.nombre_espacio,
                ge.tipo_espacio,
                aec.id_asignacion
            FROM asignacion_espacio_cliente aec
            JOIN usuarios u ON aec.id_usuario = u.id_usuario
            JOIN gestiondeespacio ge ON aec.id_espacio = ge.id_espacio
            LEFT JOIN regiones r ON u.id_region = r.id_region
            LEFT JOIN ciudades c ON u.id_ciudad = c.id_ciudad
            WHERE ge.id_usuario = ? AND u.activo = 1
            ORDER BY u.nombre, u.apellido
        ");
        $stmt->bind_param("i", $idUsuario);
        $stmt->execute();
        $result = $stmt->get_result();
        
        error_log("Debug: Consulta principal devolvió: " . $result->num_rows . " filas");
        
        $clientes = [];
        $clientesAgrupados = [];
        
        while ($row = $result->fetch_assoc()) {
            error_log("Debug - Cliente encontrado: " . json_encode($row));
            $idCliente = $row['id_cliente'];
            
            if (!isset($clientesAgrupados[$idCliente])) {
                $clientesAgrupados[$idCliente] = [
                    'id_cliente' => $row['id_cliente'],
                    'nombre_cliente' => $row['nombre_cliente'],
                    'telefono' => $row['telefono'],
                    'direccion' => $row['direccion'],
                    'nombre_region' => $row['nombre_region'],
                    'nombre_ciudad' => $row['nombre_ciudad'],
                    'espacios_asignados' => [],
                    'total_espacios' => 0
                ];
            }
            
            $clientesAgrupados[$idCliente]['espacios_asignados'][] = $row['nombre_espacio'] . ' (' . $row['tipo_espacio'] . ')';
            $clientesAgrupados[$idCliente]['total_espacios']++;
        }
        
        // Convertir a formato final
        foreach ($clientesAgrupados as $cliente) {
            $cliente['espacios_asignados'] = implode(', ', $cliente['espacios_asignados']);
            $clientes[] = $cliente;
        }
        
        error_log("Debug: Total clientes finales: " . count($clientes));
        return $clientes;
    } catch (Exception $e) {
        error_log("Error en obtenerClientesAsignados: " . $e->getMessage());
        return [];
    }
}

// Función para obtener mensajes de consulta
function obtenerMensajesConsulta($idUsuario) {
    try {
        $conn = getDBConnection();
        
        // Determinar el rol del usuario para aplicar el filtro correcto
        $rol = $_GET['rol'] ?? '';
        if (empty($rol)) {
            // Si no se especifica rol, intentar determinarlo desde la sesión
            $usuarioInfo = validarSesionPorToken();
            $rol = $usuarioInfo['nombre_rol'] ?? '';
        }
        
        error_log("Debug: Rol detectado en obtenerMensajesConsulta: " . $rol);
        error_log("Debug: ID usuario en obtenerMensajesConsulta: " . $idUsuario);
        error_log("Debug: Parámetro rol de URL: " . ($_GET['rol'] ?? 'no enviado'));
        error_log("Debug: Comparación rol === 'Cliente': " . ($rol === 'Cliente' ? 'TRUE' : 'FALSE'));
        error_log("Debug: Tipo de rol: " . gettype($rol));
        error_log("Debug: Longitud del rol: " . strlen($rol));
        
        $filtroBorrado = '';
        if ($rol === 'Cliente') {
            $filtroBorrado = 'AND mc.borrado_cliente = 0';
            error_log("Debug: Aplicando filtro de CLIENTE: borrado_cliente = 0");
        } else {
            $filtroBorrado = 'AND mc.borrado_admin = 0';
            error_log("Debug: Aplicando filtro de ADMINISTRADOR: borrado_admin = 0");
        }
        
        error_log("Debug: Filtro final aplicado: " . $filtroBorrado);
        
        // Construir la consulta SQL completa para debug
        // Filtrar mensajes según el rol: administrador solo ve mensajes donde él es receptor (recibió del cliente)
        // Cliente ve mensajes donde él es emisor (envió) o receptor (recibió respuesta del admin)
        if ($rol === 'Cliente') {
            // Cliente ve todos sus mensajes (como emisor o receptor)
            $sqlQuery = "
                SELECT 
                    mc.id_mensaje,
                    mc.mensaje,
                    mc.fecha_envio,
                    mc.leido,
                    mc.id_emisor,
                    mc.id_receptor,
                    mc.id_publicacion,
                    mc.borrado_admin,
                    mc.borrado_cliente,
                    ue.nombre as nombre_emisor,
                    ur.nombre as nombre_receptor,
                    pa.titulo as nombre_publicacion
                FROM mensajesconsulta mc
                LEFT JOIN usuarios ue ON mc.id_emisor = ue.id_usuario
                LEFT JOIN usuarios ur ON mc.id_receptor = ur.id_usuario
                LEFT JOIN publicararriendo pa ON mc.id_publicacion = pa.id_publicacion
                WHERE (mc.id_emisor = ? OR mc.id_receptor = ?) 
                $filtroBorrado
                ORDER BY mc.fecha_envio DESC
            ";
            $params = [$idUsuario, $idUsuario];
        } else {
            // Administrador ve mensajes donde él es receptor (recibió del cliente) O emisor (respondió)
            $sqlQuery = "
                SELECT 
                    mc.id_mensaje,
                    mc.mensaje,
                    mc.fecha_envio,
                    mc.leido,
                    mc.id_emisor,
                    mc.id_receptor,
                    mc.id_publicacion,
                    mc.borrado_admin,
                    mc.borrado_cliente,
                    ue.nombre as nombre_emisor,
                    ur.nombre as nombre_receptor,
                    pa.titulo as nombre_publicacion
                FROM mensajesconsulta mc
                LEFT JOIN usuarios ue ON mc.id_emisor = ue.id_usuario
                LEFT JOIN usuarios ur ON mc.id_receptor = ur.id_usuario
                LEFT JOIN publicararriendo pa ON mc.id_publicacion = pa.id_publicacion
                WHERE (mc.id_emisor = ? OR mc.id_receptor = ?)
                $filtroBorrado
                ORDER BY mc.fecha_envio DESC
            ";
            $params = [$idUsuario, $idUsuario];
        }
        
        error_log("Debug: Consulta SQL completa: " . $sqlQuery);
        error_log("Debug: Parámetros: " . json_encode($params));
        
        $stmt = $conn->prepare($sqlQuery);
        if ($rol === 'Cliente') {
            $stmt->bind_param("ii", $params[0], $params[1]);
        } else {
            $stmt->bind_param("ii", $params[0], $params[1]);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        
        error_log("Debug: Mensajes encontrados: " . $result->num_rows);
        
        // Procesar mensajes y mostrar debug
        $mensajes = [];
        $mensajesEncontrados = 0;
        
        while ($row = $result->fetch_assoc()) {
            $mensajes[] = $row;
            $mensajesEncontrados++;
            
            // Mostrar debug solo para los primeros 5 mensajes
            if ($mensajesEncontrados <= 5) {
                error_log("Debug: Mensaje ID: " . $row['id_mensaje'] . 
                         ", Emisor: " . $row['id_emisor'] . 
                         ", Receptor: " . $row['id_receptor'] . 
                         ", Borrado Admin: " . $row['borrado_admin'] . 
                         ", Borrado Cliente: " . $row['borrado_cliente'] . 
                         ", Mensaje: " . substr($row['mensaje'], 0, 50) . "...");
            }
        }
        
        error_log("Debug: Total mensajes procesados: " . $mensajesEncontrados);
        
        // Si no hay mensajes con filtros, hacer consulta sin filtros para debug
        if ($mensajesEncontrados == 0) {
            error_log("Debug: No se encontraron mensajes con los filtros aplicados");
            
            // Hacer una consulta sin filtros para ver si hay mensajes en general
            $stmtSinFiltros = $conn->prepare("
                SELECT 
                    mc.id_mensaje,
                    mc.id_emisor,
                    mc.id_receptor,
                    mc.borrado_admin,
                    mc.borrado_cliente,
                    mc.mensaje
                FROM mensajesconsulta mc
                WHERE (mc.id_emisor = ? OR mc.id_receptor = ?)
            ");
            $stmtSinFiltros->bind_param("ii", $idUsuario, $idUsuario);
            $stmtSinFiltros->execute();
            $resultSinFiltros = $stmtSinFiltros->get_result();
            
            error_log("Debug: Mensajes SIN filtros: " . $resultSinFiltros->num_rows);
            if ($resultSinFiltros->num_rows > 0) {
                error_log("Debug: === MENSAJES SIN FILTROS ===");
                $contador = 0;
                while (($row = $resultSinFiltros->fetch_assoc()) && $contador < 5) {
                    error_log("Debug: Mensaje ID: " . $row['id_mensaje'] . 
                             ", Emisor: " . $row['id_emisor'] . 
                             ", Receptor: " . $row['id_receptor'] . 
                             ", Borrado Admin: " . $row['borrado_admin'] . 
                             ", Borrado Cliente: " . $row['borrado_cliente'] . 
                             ", Mensaje: " . substr($row['mensaje'], 0, 50) . "...");
                    $contador++;
                }
                error_log("Debug: === FIN MENSAJES SIN FILTROS ===");
            }
        }
        
        return $mensajes;
    } catch (Exception $e) {
        error_log("Error en obtenerMensajesConsulta: " . $e->getMessage());
        return [];
    }
}

// Función para obtener mensajes de consulta de una publicación específica
function obtenerMensajesConsultaPublicacion($idUsuario, $idPublicacion) {
    try {
        $conn = getDBConnection();
        
        // Determinar el rol del usuario para aplicar el filtro correcto
        $rol = $_GET['rol'] ?? '';
        if (empty($rol)) {
            // Si no se especifica rol, intentar determinarlo desde la sesión
            $usuarioInfo = validarSesionPorToken();
            $rol = $usuarioInfo['nombre_rol'] ?? '';
        }
        
        error_log("Debug: Rol detectado en obtenerMensajesConsultaPublicacion: " . $rol);
        error_log("Debug: ID usuario en obtenerMensajesConsultaPublicacion: " . $idUsuario);
        error_log("Debug: ID publicación en obtenerMensajesConsultaPublicacion: " . $idPublicacion);
        error_log("Debug: Parámetro rol de URL: " . ($_GET['rol'] ?? 'no enviado'));
        error_log("Debug: Comparación rol === 'Cliente': " . ($rol === 'Cliente' ? 'TRUE' : 'FALSE'));
        error_log("Debug: Tipo de rol: " . gettype($rol));
        error_log("Debug: Longitud del rol: " . strlen($rol));
        
        $filtroBorrado = '';
        if ($rol === 'Cliente') {
            $filtroBorrado = 'AND mc.borrado_cliente = 0';
            error_log("Debug: Aplicando filtro de CLIENTE: borrado_cliente = 0");
        } else {
            $filtroBorrado = 'AND mc.borrado_admin = 0';
            error_log("Debug: Aplicando filtro de ADMINISTRADOR: borrado_admin = 0");
        }
        
        error_log("Debug: Filtro final aplicado en obtenerMensajesConsultaPublicacion: " . $filtroBorrado);
        
        // Filtrar mensajes según el rol: administrador solo ve mensajes donde él es receptor (recibió del cliente)
        // Cliente ve mensajes donde él es emisor (envió) o receptor (recibió respuesta del admin)
        if ($rol === 'Cliente') {
            // Cliente ve todos sus mensajes (como emisor o receptor)
            $stmt = $conn->prepare("
                SELECT 
                    mc.id_mensaje,
                    mc.mensaje,
                    mc.fecha_envio,
                    mc.leido,
                    mc.id_emisor,
                    mc.id_receptor,
                    mc.id_publicacion,
                    CONCAT(ue.nombre, ' ', ue.apellido) as nombre_emisor,
                    CONCAT(ur.nombre, ' ', ur.apellido) as nombre_receptor,
                    pa.titulo as nombre_publicacion
                FROM mensajesconsulta mc
                JOIN usuarios ue ON mc.id_emisor = ue.id_usuario
                JOIN usuarios ur ON mc.id_receptor = ur.id_usuario
                JOIN publicararriendo pa ON mc.id_publicacion = pa.id_publicacion
                WHERE mc.id_publicacion = ? 
                AND (mc.id_emisor = ? OR mc.id_receptor = ?)
                $filtroBorrado
                ORDER BY mc.fecha_envio ASC
            ");
            $stmt->bind_param("iii", $idPublicacion, $idUsuario, $idUsuario);
        } else {
            // Administrador ve mensajes donde él es receptor (recibió del cliente) O emisor (respondió)
            $stmt = $conn->prepare("
                SELECT 
                    mc.id_mensaje,
                    mc.mensaje,
                    mc.fecha_envio,
                    mc.leido,
                    mc.id_emisor,
                    mc.id_receptor,
                    mc.id_publicacion,
                    CONCAT(ue.nombre, ' ', ue.apellido) as nombre_emisor,
                    CONCAT(ur.nombre, ' ', ur.apellido) as nombre_receptor,
                    pa.titulo as nombre_publicacion
                FROM mensajesconsulta mc
                JOIN usuarios ue ON mc.id_emisor = ue.id_usuario
                JOIN usuarios ur ON mc.id_receptor = ur.id_usuario
                JOIN publicararriendo pa ON mc.id_publicacion = pa.id_publicacion
                WHERE mc.id_publicacion = ? 
                AND (mc.id_emisor = ? OR mc.id_receptor = ?)
                $filtroBorrado
                ORDER BY mc.fecha_envio ASC
            ");
            $stmt->bind_param("iii", $idPublicacion, $idUsuario, $idUsuario);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        
        $mensajes = [];
        while ($row = $result->fetch_assoc()) {
            $mensajes[] = $row;
        }
        
        error_log("Debug: Mensajes de consulta encontrados para publicación $idPublicacion: " . count($mensajes));
        
        return $mensajes;
    } catch (Exception $e) {
        error_log("Error en obtenerMensajesConsultaPublicacion: " . $e->getMessage());
        return [];
    }
}

// Función para obtener mensajes de un cliente específico
function obtenerMensajesCliente($idUsuario, $idCliente) {
    try {
        $conn = getDBConnection();
        
        // Obtener mensajes de asignación entre el administrador y el cliente
        // Filtrar mensajes que no estén marcados como borrados por el administrador
        $stmt = $conn->prepare("
            SELECT 
                ma.id_mensaje,
                ma.mensaje,
                ma.fecha_envio,
                ma.leido,
                ma.id_emisor,
                ma.id_receptor,
                CONCAT(ue.nombre, ' ', ue.apellido) as nombre_emisor,
                CONCAT(ur.nombre, ' ', ur.apellido) as nombre_receptor,
                ge.nombre_espacio
            FROM mensajesasignacion ma
            JOIN usuarios ue ON ma.id_emisor = ue.id_usuario
            JOIN usuarios ur ON ma.id_receptor = ur.id_usuario
            JOIN asignacion_espacio_cliente aec ON ma.id_asignacion = aec.id_asignacion
            JOIN gestiondeespacio ge ON aec.id_espacio = ge.id_espacio
            WHERE ge.id_usuario = ? 
            AND (ma.id_emisor = ? OR ma.id_receptor = ?)
            AND (ma.id_emisor = ? OR ma.id_receptor = ?)
            AND ma.borrado_admin = 0
            ORDER BY ma.fecha_envio ASC
        ");
        $stmt->bind_param("iiiii", $idUsuario, $idCliente, $idCliente, $idUsuario, $idUsuario);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $mensajes = [];
        while ($row = $result->fetch_assoc()) {
            $mensajes[] = $row;
        }
        
        error_log("Debug: Mensajes encontrados para cliente $idCliente: " . count($mensajes));
        
        return $mensajes;
    } catch (Exception $e) {
        error_log("Error en obtenerMensajesCliente: " . $e->getMessage());
        return [];
    }
}

// Función para marcar mensaje como leído
function marcarMensajeComoLeido($idMensaje, $tipo) {
    try {
        $conn = getDBConnection();
        
        if ($tipo === 'asignacion') {
            $stmt = $conn->prepare("UPDATE mensajesasignacion SET leido = 1 WHERE id_mensaje = ?");
        } else {
            $stmt = $conn->prepare("UPDATE mensajesconsulta SET leido = 1 WHERE id_mensaje = ?");
        }
        
        $stmt->bind_param("i", $idMensaje);
        $stmt->execute();
        
        return $stmt->affected_rows > 0;
    } catch (Exception $e) {
        return false;
    }
}

// Función para marcar todos los mensajes como leídos
function marcarTodosComoLeidos($idUsuario, $tipo) {
    try {
        $conn = getDBConnection();
        
        if ($tipo === 'asignacion') {
            $stmt = $conn->prepare("UPDATE mensajesasignacion SET leido = 1 WHERE id_receptor = ? AND leido = 0");
        } else {
            $stmt = $conn->prepare("UPDATE mensajesconsulta SET leido = 1 WHERE id_receptor = ? AND leido = 0");
        }
        
        $stmt->bind_param("i", $idUsuario);
        $stmt->execute();
        
        return $stmt->affected_rows > 0;
    } catch (Exception $e) {
        return false;
    }
}

// Función para obtener mensajes entre cliente y administrador
function obtenerMensajesAdministrador($idCliente, $idAdministrador) {
    try {
        $conn = getDBConnection();
        
        // Obtener mensajes de asignación entre el cliente y el administrador
        // Filtrar mensajes que no estén marcados como borrados por el cliente
        $stmt = $conn->prepare("
            SELECT 
                ma.id_mensaje,
                ma.mensaje,
                ma.fecha_envio,
                ma.leido,
                ma.id_emisor,
                ma.id_receptor,
                CONCAT(ue.nombre, ' ', ue.apellido) as nombre_emisor,
                CONCAT(ur.nombre, ' ', ur.apellido) as nombre_receptor,
                ge.nombre_espacio
            FROM mensajesasignacion ma
            JOIN usuarios ue ON ma.id_emisor = ue.id_usuario
            JOIN usuarios ur ON ma.id_receptor = ur.id_usuario
            JOIN asignacion_espacio_cliente aec ON ma.id_asignacion = aec.id_asignacion
            JOIN gestiondeespacio ge ON aec.id_espacio = ge.id_espacio
            WHERE aec.id_usuario = ? AND ge.id_usuario = ? AND ma.borrado_cliente = 0
            ORDER BY ma.fecha_envio ASC
        ");
        $stmt->bind_param("ii", $idCliente, $idAdministrador);
        $stmt->execute();
        $result = $stmt->get_result();
        
        error_log("Debug: Mensajes encontrados entre cliente $idCliente y administrador $idAdministrador: " . $result->num_rows);
        
        $mensajes = [];
        while ($row = $result->fetch_assoc()) {
            $mensajes[] = [
                'id_mensaje' => $row['id_mensaje'],
                'mensaje' => $row['mensaje'],
                'fecha_envio' => $row['fecha_envio'],
                'leido' => $row['leido'],
                'id_emisor' => $row['id_emisor'],
                'id_receptor' => $row['id_receptor'],
                'nombre_emisor' => $row['nombre_emisor'],
                'nombre_receptor' => $row['nombre_receptor'],
                'nombre_espacio' => $row['nombre_espacio']
            ];
        }
        
        return $mensajes;
        
    } catch (Exception $e) {
        error_log("Error en obtenerMensajesAdministrador: " . $e->getMessage());
        return [];
    }
}

// Función para enviar mensaje de asignación (cliente a administrador)
function enviarMensajeAsignacion($idCliente, $idAdministrador, $mensaje) {
    try {
        $conn = getDBConnection();
        
        // Buscar la asignación entre el cliente y el administrador
        $stmt = $conn->prepare("
            SELECT aec.id_asignacion
            FROM asignacion_espacio_cliente aec
            JOIN gestiondeespacio ge ON aec.id_espacio = ge.id_espacio
            WHERE aec.id_usuario = ? AND ge.id_usuario = ?
            LIMIT 1
        ");
        $stmt->bind_param("ii", $idCliente, $idAdministrador);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            error_log("Debug: No se encontró asignación entre cliente $idCliente y administrador $idAdministrador");
            return false;
        }
        
        $asignacion = $result->fetch_assoc();
        $idAsignacion = $asignacion['id_asignacion'];
        
        // Insertar el mensaje
        $stmt = $conn->prepare("
            INSERT INTO mensajesasignacion (id_asignacion, id_emisor, id_receptor, mensaje)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->bind_param("iiis", $idAsignacion, $idCliente, $idAdministrador, $mensaje);
        
        if ($stmt->execute()) {
            error_log("Debug: Mensaje de asignación enviado correctamente");
            return true;
        } else {
            error_log("Debug: Error al enviar mensaje de asignación: " . $conn->error);
            return false;
        }
        
    } catch (Exception $e) {
        error_log("Error en enviarMensajeAsignacion: " . $e->getMessage());
        return false;
    }
}

// Función para enviar mensaje a cliente asignado
function enviarMensajeCliente($idAdministrador, $idCliente, $mensaje) {
    try {
        $conn = getDBConnection();
        
        // Obtener la primera asignación del cliente con este administrador
        $stmt = $conn->prepare("
            SELECT aec.id_asignacion 
            FROM asignacion_espacio_cliente aec
            JOIN gestiondeespacio ge ON aec.id_espacio = ge.id_espacio
            WHERE aec.id_usuario = ? AND ge.id_usuario = ?
            LIMIT 1
        ");
        $stmt->bind_param("ii", $idCliente, $idAdministrador);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            return false; // No hay asignación válida
        }
        
        $asignacion = $result->fetch_assoc();
        $idAsignacion = $asignacion['id_asignacion'];
        
        // Insertar el mensaje
        $stmt = $conn->prepare("
            INSERT INTO mensajesasignacion (id_asignacion, id_emisor, id_receptor, mensaje) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->bind_param("iiis", $idAsignacion, $idAdministrador, $idCliente, $mensaje);
        $stmt->execute();
        
        return $stmt->affected_rows > 0;
    } catch (Exception $e) {
        return false;
    }
}

// Función para enviar una consulta inicial (cliente)
function enviarConsulta($idCliente, $idPublicacion, $mensaje) {
    try {
        $conn = getDBConnection();
        
        // Obtener el administrador propietario de la publicación
        $stmt = $conn->prepare("
            SELECT pa.id_usuario as id_administrador
            FROM publicararriendo pa
            WHERE pa.id_publicacion = ?
        ");
        $stmt->bind_param("i", $idPublicacion);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            return false; // No existe la publicación
        }
        
        $publicacion = $result->fetch_assoc();
        $idAdministrador = $publicacion['id_administrador'];
        
        // Verificar si ya existe una conversación entre este cliente y administrador
        // Buscar la primera conversación donde el cliente y administrador ya hayan intercambiado mensajes
        $stmt = $conn->prepare("
            SELECT id_publicacion
            FROM mensajesconsulta
            WHERE id_emisor = ? AND id_receptor = ?
            ORDER BY fecha_envio ASC
            LIMIT 1
        ");
        $stmt->bind_param("ii", $idCliente, $idAdministrador);
        $stmt->execute();
        $result = $stmt->get_result();
        
        // Si existe una conversación previa, usar esa publicación como contexto para unificar el chat
        $publicacionAUsar = $idPublicacion;
        if ($result->num_rows > 0) {
            $existentes = $result->fetch_assoc();
            $publicacionAUsar = $existentes['id_publicacion'];
            error_log("Debug: Conversación existente encontrada, unificando en publicación: " . $publicacionAUsar);
        }
        
        // Insertar la consulta usando la publicación del contexto
        $stmt = $conn->prepare("
            INSERT INTO mensajesconsulta (id_publicacion, id_emisor, id_receptor, mensaje) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->bind_param("iiis", $publicacionAUsar, $idCliente, $idAdministrador, $mensaje);
        $stmt->execute();

        return $stmt->affected_rows > 0;
    } catch (Exception $e) {
        error_log("Error en enviarConsulta: " . $e->getMessage());
        return false;
    }
}

// Función para responder una consulta
function responderConsulta($idAdministrador, $idPublicacion, $mensaje, $idCliente = null) {
    try {
        $conn = getDBConnection();
        
        // Si no se proporciona idCliente, obtenerlo de la base de datos (comportamiento anterior)
        if ($idCliente === null) {
            $stmt = $conn->prepare("
                SELECT DISTINCT mc.id_emisor as id_cliente
                FROM mensajesconsulta mc
                WHERE mc.id_publicacion = ? AND mc.id_emisor != ?
                ORDER BY mc.fecha_envio ASC
                LIMIT 1
            ");
            $stmt->bind_param("ii", $idPublicacion, $idAdministrador);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                return false; // No hay consulta válida
            }
            
            $consulta = $result->fetch_assoc();
            $idCliente = $consulta['id_cliente'];
        }
        
        // Insertar la respuesta
        error_log("DEBUG responderConsulta: Insertando respuesta");
        error_log("DEBUG responderConsulta: idPublicacion = " . $idPublicacion);
        error_log("DEBUG responderConsulta: idAdministrador = " . $idAdministrador);
        error_log("DEBUG responderConsulta: idCliente = " . $idCliente);
        error_log("DEBUG responderConsulta: mensaje = " . $mensaje);
        
        $stmt = $conn->prepare("
            INSERT INTO mensajesconsulta (id_publicacion, id_emisor, id_receptor, mensaje) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->bind_param("iiis", $idPublicacion, $idAdministrador, $idCliente, $mensaje);
        $stmt->execute();
        
        error_log("DEBUG responderConsulta: Respuesta insertada, affected_rows = " . $stmt->affected_rows);
        
        return $stmt->affected_rows > 0;
    } catch (Exception $e) {
        error_log("Error en responderConsulta: " . $e->getMessage());
        return false;
    }
}

// Función para eliminar mensaje de asignación
function eliminarMensajeAsignacion($idMensaje, $idUsuario) {
    try {
        $conn = getDBConnection();
        
        // Verificar que el usuario es el emisor del mensaje
        $stmt = $conn->prepare("
            SELECT id_emisor, id_receptor 
            FROM mensajesasignacion 
            WHERE id_mensaje = ?
        ");
        $stmt->bind_param("i", $idMensaje);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            return false; // Mensaje no encontrado
        }
        
        $mensaje = $result->fetch_assoc();
        
        // Solo el emisor puede eliminar su mensaje
        if ($mensaje['id_emisor'] != $idUsuario) {
            return false; // No autorizado
        }
        
        // Eliminar el mensaje
        $stmt = $conn->prepare("DELETE FROM mensajesasignacion WHERE id_mensaje = ?");
        $stmt->bind_param("i", $idMensaje);
        $stmt->execute();
        
        return $stmt->affected_rows > 0;
    } catch (Exception $e) {
        error_log("Error en eliminarMensajeAsignacion: " . $e->getMessage());
        return false;
    }
}

// Función para eliminar mensaje de consulta
function eliminarMensajeConsulta($idMensaje, $idUsuario) {
    try {
        $conn = getDBConnection();
        
        // Verificar que el usuario es el emisor del mensaje
        $stmt = $conn->prepare("
            SELECT id_emisor, id_receptor 
            FROM mensajesconsulta 
            WHERE id_mensaje = ?
        ");
        $stmt->bind_param("i", $idMensaje);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            return false; // Mensaje no encontrado
        }
        
        $mensaje = $result->fetch_assoc();
        
        // Solo el emisor puede eliminar su mensaje
        if ($mensaje['id_emisor'] != $idUsuario) {
            return false; // No autorizado
        }
        
        // Eliminar el mensaje
        $stmt = $conn->prepare("DELETE FROM mensajesconsulta WHERE id_mensaje = ?");
        $stmt->bind_param("i", $idMensaje);
        $stmt->execute();
        
        return $stmt->affected_rows > 0;
    } catch (Exception $e) {
        error_log("Error en eliminarMensajeConsulta: " . $e->getMessage());
        return false;
    }
}

// Función para eliminar toda la conversación con un cliente (eliminación suave)
function eliminarConversacionCompleta($idAdministrador, $idCliente) {
    try {
        $conn = getDBConnection();
        
        // Obtener todas las asignaciones entre el administrador y el cliente
        $stmt = $conn->prepare("
            SELECT aec.id_asignacion
            FROM asignacion_espacio_cliente aec
            JOIN gestiondeespacio ge ON aec.id_espacio = ge.id_espacio
            WHERE aec.id_usuario = ? AND ge.id_usuario = ?
        ");
        $stmt->bind_param("ii", $idCliente, $idAdministrador);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $asignaciones = [];
        while ($row = $result->fetch_assoc()) {
            $asignaciones[] = $row['id_asignacion'];
        }
        
        if (empty($asignaciones)) {
            return false; // No hay conversación
        }
        
        // Marcar como borrado para el administrador (no eliminar físicamente)
        $placeholders = str_repeat('?,', count($asignaciones) - 1) . '?';
        $stmt = $conn->prepare("
            UPDATE mensajesasignacion 
            SET borrado_admin = 1 
            WHERE id_asignacion IN ($placeholders)
        ");
        $stmt->bind_param(str_repeat('i', count($asignaciones)), ...$asignaciones);
        $stmt->execute();
        
        return $stmt->affected_rows > 0;
    } catch (Exception $e) {
        error_log("Error en eliminarConversacionCompleta: " . $e->getMessage());
        return false;
    }
}

// Función para eliminar toda la conversación con un administrador (eliminación suave para cliente)
function eliminarConversacionCompletaCliente($idCliente, $idAdministrador) {
    try {
        $conn = getDBConnection();
        
        // Obtener todas las asignaciones entre el cliente y el administrador
        $stmt = $conn->prepare("
            SELECT aec.id_asignacion
            FROM asignacion_espacio_cliente aec
            JOIN gestiondeespacio ge ON aec.id_espacio = ge.id_espacio
            WHERE aec.id_usuario = ? AND ge.id_usuario = ?
        ");
        $stmt->bind_param("ii", $idCliente, $idAdministrador);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $asignaciones = [];
        while ($row = $result->fetch_assoc()) {
            $asignaciones[] = $row['id_asignacion'];
        }
        
        if (empty($asignaciones)) {
            return false; // No hay conversación
        }
        
        // Marcar como borrado para el cliente (no eliminar físicamente)
        $placeholders = str_repeat('?,', count($asignaciones) - 1) . '?';
        $stmt = $conn->prepare("
            UPDATE mensajesasignacion 
            SET borrado_cliente = 1 
            WHERE id_asignacion IN ($placeholders)
        ");
        $stmt->bind_param(str_repeat('i', count($asignaciones)), ...$asignaciones);
        $stmt->execute();
        
        return $stmt->affected_rows > 0;
    } catch (Exception $e) {
        error_log("Error en eliminarConversacionCompletaCliente: " . $e->getMessage());
        return false;
    }
}

// Función para eliminar conversación de consulta (eliminación suave para administrador)
function eliminarConversacionConsulta($idPublicacion, $idAdministrador, $idCliente = null) {
    try {
        $conn = getDBConnection();
        
        if ($idCliente) {
            // Si se especifica un cliente, eliminar solo la conversación con ese cliente específico
            $stmt = $conn->prepare("
                UPDATE mensajesconsulta 
                SET borrado_admin = 1 
                WHERE id_publicacion = ? 
                AND ((id_emisor = ? AND id_receptor = ?) OR (id_emisor = ? AND id_receptor = ?))
            ");
            $stmt->bind_param("iiiii", $idPublicacion, $idCliente, $idAdministrador, $idAdministrador, $idCliente);
        } else {
            // Si no se especifica cliente, eliminar todas las conversaciones de esa publicación (comportamiento anterior)
            $stmt = $conn->prepare("
                UPDATE mensajesconsulta 
                SET borrado_admin = 1 
                WHERE id_publicacion = ? 
                AND (id_emisor = ? OR id_receptor = ?)
            ");
            $stmt->bind_param("iii", $idPublicacion, $idAdministrador, $idAdministrador);
        }
        
        $stmt->execute();
        return $stmt->affected_rows > 0;
    } catch (Exception $e) {
        error_log("Error en eliminarConversacionConsulta: " . $e->getMessage());
        return false;
    }
}

// Función para eliminar conversación de consulta (eliminación suave para cliente)
function eliminarConversacionConsultaCliente($idPublicacion, $idCliente) {
    try {
        $conn = getDBConnection();
        
        // Marcar como borrado para el cliente SOLO los mensajes donde él es emisor o receptor
        $stmt = $conn->prepare("
            UPDATE mensajesconsulta 
            SET borrado_cliente = 1 
            WHERE id_publicacion = ? 
            AND (id_emisor = ? OR id_receptor = ?)
        ");
        $stmt->bind_param("iii", $idPublicacion, $idCliente, $idCliente);
        $stmt->execute();
        
        return $stmt->affected_rows > 0;
    } catch (Exception $e) {
        error_log("Error en eliminarConversacionConsultaCliente: " . $e->getMessage());
        return false;
    }
}

// Función de debug para verificar datos
function verificarDatosDebug($idUsuario) {
    try {
        $conn = getDBConnection();
        $debug = [];
        
        // Verificar espacios del administrador
        $stmt = $conn->prepare("SELECT COUNT(*) as total FROM gestiondeespacio WHERE id_usuario = ?");
        $stmt->bind_param("i", $idUsuario);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $debug['espacios_admin'] = $row['total'];
        
        // Verificar asignaciones
        $stmt = $conn->prepare("
            SELECT COUNT(*) as total 
            FROM asignacion_espacio_cliente aec
            JOIN gestiondeespacio ge ON aec.id_espacio = ge.id_espacio
            WHERE ge.id_usuario = ?
        ");
        $stmt->bind_param("i", $idUsuario);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $debug['asignaciones'] = $row['total'];
        
        // Verificar usuarios activos
        $stmt = $conn->prepare("SELECT COUNT(*) as total FROM usuarios WHERE activo = 1");
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $debug['usuarios_activos'] = $row['total'];
        
        // Debug adicional: verificar datos específicos
        $stmt = $conn->prepare("
            SELECT aec.id_asignacion, aec.id_usuario, aec.id_espacio, 
                   ge.id_usuario as admin_espacio, ge.nombre_espacio,
                   u.nombre, u.apellido, u.activo
            FROM asignacion_espacio_cliente aec
            JOIN gestiondeespacio ge ON aec.id_espacio = ge.id_espacio
            JOIN usuarios u ON aec.id_usuario = u.id_usuario
            WHERE ge.id_usuario = ?
        ");
        $stmt->bind_param("i", $idUsuario);
        $stmt->execute();
        $result = $stmt->get_result();
        $debug['detalles_asignaciones'] = [];
        while ($row = $result->fetch_assoc()) {
            $debug['detalles_asignaciones'][] = $row;
        }
        
        return $debug;
    } catch (Exception $e) {
        return ['error' => $e->getMessage()];
    }
}

// Función de consulta simple para debug
function obtenerClientesAsignadosSimple($idUsuario) {
    try {
        $conn = getDBConnection();
        
        // Consulta muy simple para verificar datos básicos
        $stmt = $conn->prepare("
            SELECT 
                u.id_usuario as id_cliente,
                CONCAT(u.nombre, ' ', u.apellido) as nombre_cliente,
                u.telefono,
                u.direccion,
                ge.nombre_espacio,
                ge.tipo_espacio
            FROM asignacion_espacio_cliente aec
            JOIN usuarios u ON aec.id_usuario = u.id_usuario
            JOIN gestiondeespacio ge ON aec.id_espacio = ge.id_espacio
            WHERE ge.id_usuario = ?
        ");
        $stmt->bind_param("i", $idUsuario);
        $stmt->execute();
        $result = $stmt->get_result();
        
        error_log("Debug consulta simple - Filas: " . $result->num_rows);
        
        $clientes = [];
        while ($row = $result->fetch_assoc()) {
            error_log("Debug consulta simple - Cliente: " . json_encode($row));
            $clientes[] = [
                'id_cliente' => $row['id_cliente'],
                'nombre_cliente' => $row['nombre_cliente'],
                'telefono' => $row['telefono'],
                'direccion' => $row['direccion'],
                'nombre_region' => '',
                'nombre_ciudad' => '',
                'espacios_asignados' => $row['nombre_espacio'] . ' (' . $row['tipo_espacio'] . ')',
                'total_espacios' => 1
            ];
        }
        
        return $clientes;
    } catch (Exception $e) {
        error_log("Error en consulta simple: " . $e->getMessage());
        return [];
    }
}

// Función de prueba para verificar datos básicos
function verificarDatosBasicos($idUsuario) {
    try {
        $conn = getDBConnection();
        $debug = [];
        
        // Verificar si el usuario existe
        $stmt = $conn->prepare("SELECT id_usuario, nombre, apellido FROM usuarios WHERE id_usuario = ?");
        $stmt->bind_param("i", $idUsuario);
        $stmt->execute();
        $result = $stmt->get_result();
        $debug['usuario_existe'] = $result->num_rows > 0;
        if ($result->num_rows > 0) {
            $debug['usuario_info'] = $result->fetch_assoc();
        }
        
        // Verificar espacios del usuario
        $stmt = $conn->prepare("SELECT COUNT(*) as total FROM gestiondeespacio WHERE id_usuario = ?");
        $stmt->bind_param("i", $idUsuario);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $debug['espacios_usuario'] = $row['total'];
        
        // Verificar asignaciones
        $stmt = $conn->prepare("SELECT COUNT(*) as total FROM asignacion_espacio_cliente aec JOIN gestiondeespacio ge ON aec.id_espacio = ge.id_espacio WHERE ge.id_usuario = ?");
        $stmt->bind_param("i", $idUsuario);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $debug['asignaciones_usuario'] = $row['total'];
        
        return $debug;
    } catch (Exception $e) {
        return ['error' => $e->getMessage()];
    }
}

// Procesar la petición
try {
    // Validar sesión
    $usuario = validarSesionPorToken();
    if (!$usuario) {
        echo json_encode([
            'success' => false,
            'message' => 'Sesión no válida'
        ]);
        exit();
    }

    $idUsuario = $usuario['id_usuario'];

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Obtener tipo de mensajes
        $tipo = $_GET['tipo'] ?? 'asignacion';
        
        if ($tipo === 'asignacion') {
            // Verificar si se está pidiendo mensajes de un cliente específico
            $clienteId = $_GET['cliente'] ?? null;
            $administradorId = $_GET['administrador'] ?? null;
            
            if ($clienteId) {
                // Obtener mensajes del cliente específico (para administradores)
                $mensajes = obtenerMensajesCliente($idUsuario, $clienteId);
                echo json_encode([
                    'success' => true,
                    'mensajes' => $mensajes
                ]);
            } elseif ($administradorId) {
                // Obtener mensajes del administrador específico (para clientes)
                $mensajes = obtenerMensajesAdministrador($idUsuario, $administradorId);
                echo json_encode([
                    'success' => true,
                    'mensajes' => $mensajes
                ]);
            } else {
                // Determinar el rol del usuario para usar la función correcta
                $usuarioInfo = validarSesionPorToken();
                $rol = $usuarioInfo['rol'] ?? '';
                
                // Si se especificó un rol en la URL, usarlo en lugar del de la sesión
                if (isset($_GET['rol']) && !empty($_GET['rol'])) {
                    $rol = ucfirst(strtolower($_GET['rol']));
                    error_log("Debug: Usando rol de URL: " . $rol);
                }
                
                error_log("Debug: Rol del usuario obtenido: " . $rol);
                error_log("Debug: Parámetro rol de URL: " . ($_GET['rol'] ?? 'no enviado'));
                
                if ($rol === 'Cliente') {
                    // Para clientes: obtener administradores asignados
                    error_log("Debug: Usuario es cliente, buscando administradores...");
                    $administradores = obtenerAdministradoresAsignados($idUsuario);
                    
                    error_log("Debug: Administradores obtenidos: " . json_encode($administradores));
                    
                    echo json_encode([
                        'success' => true,
                        'administradores' => $administradores,
                        'tipo_usuario' => 'cliente',
                        'debug' => [
                            'id_usuario' => $idUsuario,
                            'rol' => $rol,
                            'total_administradores' => count($administradores)
                        ]
                    ]);
                } else {
                    error_log("Debug: Usuario NO es cliente, rol detectado: " . $rol);
                    // Para administradores: obtener clientes asignados
                    $clientes = obtenerClientesAsignados($idUsuario);
                    
                    // Debug adicional: verificar datos en las tablas
                    $debugInfo = verificarDatosDebug($idUsuario);
                    $debugBasico = verificarDatosBasicos($idUsuario);
                    
                    // Si no hay clientes, intentar una consulta más simple
                    if (empty($clientes)) {
                        $clientes = obtenerClientesAsignadosSimple($idUsuario);
                    }
                    
                    echo json_encode([
                        'success' => true,
                        'clientes' => $clientes,
                        'debug' => [
                            'id_usuario' => $idUsuario,
                            'total_clientes' => count($clientes),
                            'debug_info' => $debugInfo,
                            'debug_basico' => $debugBasico,
                            'usuario_info' => $usuario
                        ],
                        'tipo_usuario' => 'administrador'
                    ]);
                }
            }
        } else {
            // Verificar si se está pidiendo mensajes de una publicación específica
            $publicacionId = $_GET['publicacion'] ?? null;
            
            if ($publicacionId) {
                // Obtener mensajes de una publicación específica
                $mensajes = obtenerMensajesConsultaPublicacion($idUsuario, $publicacionId);
                echo json_encode([
                    'success' => true,
                    'mensajes' => $mensajes
                ]);
            } else {
                // Obtener todos los mensajes de consulta
                $mensajes = obtenerMensajesConsulta($idUsuario);
                echo json_encode([
                    'success' => true,
                    'mensajes' => $mensajes
                ]);
            }
        }
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';
        
        if ($action === 'marcar_leido') {
            $idMensaje = $input['id_mensaje'] ?? 0;
            $tipo = $input['tipo'] ?? '';
            
            if (marcarMensajeComoLeido($idMensaje, $tipo)) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Mensaje marcado como leído'
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Error al marcar mensaje como leído'
                ]);
            }
            
        } elseif ($action === 'marcar_todos_leidos') {
            $tipo = $input['tipo'] ?? '';
            
            if (marcarTodosComoLeidos($idUsuario, $tipo)) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Todos los mensajes han sido marcados como leídos'
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Error al marcar mensajes como leídos'
                ]);
            }
        } elseif ($action === 'enviar_mensaje') {
            $tipo = $input['tipo'] ?? '';
            $destinatario = $input['destinatario'] ?? 0;
            $mensaje = $input['mensaje'] ?? '';
            
            if ($tipo === 'asignacion') {
                // Para mensajes de asignación (cliente a administrador)
                if (enviarMensajeAsignacion($idUsuario, $destinatario, $mensaje)) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Mensaje enviado correctamente'
                    ]);
                } else {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Error al enviar mensaje'
                    ]);
                }
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Tipo de mensaje no válido'
                ]);
            }
        } elseif ($action === 'enviar_mensaje_cliente') {
            $idCliente = $input['id_cliente'] ?? 0;
            $mensaje = $input['mensaje'] ?? '';
            
            if (enviarMensajeCliente($idUsuario, $idCliente, $mensaje)) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Mensaje enviado correctamente'
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Error al enviar mensaje'
                ]);
            }
                } elseif ($action === 'enviar_consulta') {
                    $idPublicacion = $input['id_publicacion'] ?? 0;
                    $mensaje = $input['mensaje'] ?? '';
                    
                    if (enviarConsulta($idUsuario, $idPublicacion, $mensaje)) {
                        echo json_encode([
                            'success' => true,
                            'message' => 'Consulta enviada correctamente'
                        ]);
                    } else {
                        echo json_encode([
                            'success' => false,
                            'message' => 'Error al enviar consulta'
                        ]);
                    }
                } elseif ($action === 'responder_consulta') {
                    $idPublicacion = $input['id_publicacion'] ?? 0;
                    $idCliente = $input['id_cliente'] ?? 0;
                    $mensaje = $input['mensaje'] ?? '';
                    
                    if (responderConsulta($idUsuario, $idPublicacion, $mensaje, $idCliente)) {
                        echo json_encode([
                            'success' => true,
                            'message' => 'Respuesta enviada correctamente'
                        ]);
                    } else {
                        echo json_encode([
                            'success' => false,
                            'message' => 'Error al enviar respuesta'
                        ]);
                    }
                } elseif ($action === 'eliminar_mensaje') {
                    $idMensaje = $input['id_mensaje'] ?? 0;
                    $tipo = $input['tipo'] ?? '';
                    
                    if ($tipo === 'asignacion') {
                        if (eliminarMensajeAsignacion($idMensaje, $idUsuario)) {
                            echo json_encode([
                                'success' => true,
                                'message' => 'Mensaje eliminado correctamente'
                            ]);
                        } else {
                            echo json_encode([
                                'success' => false,
                                'message' => 'Error al eliminar mensaje'
                            ]);
                        }
                    } elseif ($tipo === 'consulta') {
                        if (eliminarMensajeConsulta($idMensaje, $idUsuario)) {
                            echo json_encode([
                                'success' => true,
                                'message' => 'Mensaje eliminado correctamente'
                            ]);
                        } else {
                            echo json_encode([
                                'success' => false,
                                'message' => 'Error al eliminar mensaje'
                            ]);
                        }
                    } else {
                        echo json_encode([
                            'success' => false,
                            'message' => 'Tipo de mensaje no válido'
                        ]);
                    }
                } elseif ($action === 'eliminar_conversacion') {
                    $idCliente = $input['id_cliente'] ?? 0;
                    $idAdministrador = $input['id_administrador'] ?? 0;
                    $idPublicacion = $input['id_publicacion'] ?? 0;
                    $tipo = $input['tipo'] ?? '';
                    
                    if ($tipo === 'asignacion') {
                        // Si es un cliente eliminando conversación con administrador
                        if ($idAdministrador > 0) {
                            if (eliminarConversacionCompletaCliente($idUsuario, $idAdministrador)) {
                                echo json_encode([
                                    'success' => true,
                                    'message' => 'Conversación eliminada correctamente'
                                ]);
                            } else {
                                echo json_encode([
                                    'success' => false,
                                    'message' => 'Error al eliminar conversación'
                                ]);
                            }
                        } 
                        // Si es un administrador eliminando conversación con cliente
                        else if ($idCliente > 0) {
                            if (eliminarConversacionCompleta($idUsuario, $idCliente)) {
                                echo json_encode([
                                    'success' => true,
                                    'message' => 'Conversación eliminada correctamente'
                                ]);
                            } else {
                                echo json_encode([
                                    'success' => false,
                                    'message' => 'Error al eliminar conversación'
                                ]);
                            }
                        } else {
                            echo json_encode([
                                'success' => false,
                                'message' => 'ID de usuario no válido'
                            ]);
                        }
                    } else if ($tipo === 'consulta') {
                        // Si es una consulta, determinar si es administrador o cliente
                        if ($idPublicacion > 0) {
                            // Verificar el rol del usuario para determinar qué función usar
                            $usuarioInfo = validarSesionPorToken();
                            $rol = $usuarioInfo['nombre_rol'] ?? '';
                            
                            if ($rol === 'Cliente') {
                                if (eliminarConversacionConsultaCliente($idPublicacion, $idUsuario)) {
                                    echo json_encode([
                                        'success' => true,
                                        'message' => 'Conversación eliminada correctamente'
                                    ]);
                                } else {
                                    echo json_encode([
                                        'success' => false,
                                        'message' => 'Error al eliminar conversación'
                                    ]);
                                }
                            } else {
                                if (eliminarConversacionConsulta($idPublicacion, $idUsuario)) {
                                    echo json_encode([
                                        'success' => true,
                                        'message' => 'Conversación eliminada correctamente'
                                    ]);
                                } else {
                                    echo json_encode([
                                        'success' => false,
                                        'message' => 'Error al eliminar conversación'
                                    ]);
                                }
                            }
                        } else {
                            echo json_encode([
                                'success' => false,
                                'message' => 'ID de publicación no válido'
                            ]);
                        }
                    } else {
                        echo json_encode([
                            'success' => false,
                            'message' => 'Tipo de conversación no válido'
                        ]);
                    }
                } elseif ($action === 'eliminar_conversacion_consulta') {
                    $idPublicacion = $input['id_publicacion'] ?? 0;
                    $idCliente = $input['id_cliente'] ?? null;
                    $tipo = $input['tipo'] ?? '';
                    
                    if ($tipo === 'consulta') {
                        if (eliminarConversacionConsulta($idPublicacion, $idUsuario, $idCliente)) {
                            echo json_encode([
                                'success' => true,
                                'message' => 'Conversación eliminada correctamente'
                            ]);
                        } else {
                            echo json_encode([
                                'success' => false,
                                'message' => 'Error al eliminar conversación'
                            ]);
                        }
                    } else {
                        echo json_encode([
                            'success' => false,
                            'message' => 'Tipo de conversación no válido'
                        ]);
                    }
                } elseif ($action === 'eliminar_conversacion_consulta_cliente') {
                    $idPublicacion = $input['id_publicacion'] ?? 0;
                    $tipo = $input['tipo'] ?? '';
                    
                    if ($tipo === 'consulta') {
                        if (eliminarConversacionConsultaCliente($idPublicacion, $idUsuario)) {
                            echo json_encode([
                                'success' => true,
                                'message' => 'Conversación eliminada correctamente'
                            ]);
                        } else {
                            echo json_encode([
                                'success' => false,
                                'message' => 'Error al eliminar conversación'
                            ]);
                        }
                    } else {
                        echo json_encode([
                            'success' => false,
                            'message' => 'Tipo de conversación no válido'
                        ]);
                    }
                } else {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Acción no válida'
                    ]);
                }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Método no permitido'
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error del servidor: ' . $e->getMessage()
    ]);
}
?>
