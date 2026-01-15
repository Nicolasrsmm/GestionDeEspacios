<?php
// Configurar manejo de errores
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Iniciar buffer de salida para evitar output no deseado
ob_start();

// Configurar headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configurar manejo de excepciones
set_exception_handler(function($exception) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno del servidor: ' . $exception->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit();
});

set_error_handler(function($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

try {
    // Incluir configuración de base de datos
    require_once '../config/db_config.php';
    
    // Obtener conexión
    $conn = getDBConnection();
    
    // Obtener datos del POST
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // Si no hay JSON, usar POST normal
    if (!$data) {
        $data = $_POST;
    }
    
    $action = $data['action'] ?? '';
    
    switch ($action) {
        case 'obtener_administrador_asignado':
            $resultado = obtenerAdministradorAsignado($conn, $data);
            break;
            
        case 'guardar_calificacion_admin':
            $resultado = guardarCalificacionAdmin($conn, $data);
            break;
            
        case 'obtener_calificaciones_admin':
            $resultado = obtenerCalificacionesAdmin($conn, $data);
            break;
            
        case 'actualizar_calificacion_admin':
            $resultado = actualizarCalificacionAdmin($conn, $data);
            break;
            
        case 'eliminar_calificacion':
            $resultado = eliminarCalificacionAdmin($conn, $data);
            break;
            
        case 'obtener_calificacion_por_id':
            $resultado = obtenerCalificacionPorId($conn, $data);
            break;
            
        case 'buscar_calificaciones_por_nombre':
            $resultado = buscarCalificacionesPorNombre($conn, $data);
            break;
            
        case 'buscar_calificaciones_por_rut':
            $resultado = buscarCalificacionesPorRUT($conn, $data);
            break;
            
        default:
            throw new Exception('Acción no válida');
    }
    
    // Limpiar buffer y enviar respuesta
    ob_end_clean();
    echo json_encode($resultado, JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    ob_end_clean();
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

// Función para obtener el administrador asignado al cliente
function obtenerAdministradorAsignado($conn, $data) {
    // Validar sesión
    validarSesionAdmin($data);
    
    $id_cliente = $data['id_cliente'] ?? null;
    
    if (!$id_cliente || !is_numeric($id_cliente)) {
        throw new Exception('ID de cliente inválido');
    }
    
    // Consulta para obtener todos los administradores de los espacios asignados al cliente
    $query = "
        SELECT DISTINCT 
            u.id_usuario,
            u.nombre,
            u.apellido,
            u.rut_numero,
            u.rut_dv,
            ge.nombre_espacio,
            ge.tipo_espacio
        FROM usuarios u
        INNER JOIN gestiondeespacio ge ON u.id_usuario = ge.id_usuario
        INNER JOIN asignacion_espacio_cliente aec ON ge.id_espacio = aec.id_espacio
        WHERE aec.id_usuario = ? 
        AND u.id_usuario IN (
            SELECT DISTINCT ge2.id_usuario 
            FROM gestiondeespacio ge2 
            WHERE ge2.id_usuario IN (
                SELECT id_usuario FROM usuarios WHERE id_usuario IN (
                    SELECT DISTINCT id_usuario FROM gestiondeespacio
                )
            )
        )
        ORDER BY u.nombre, u.apellido
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id_cliente);
    
    if (!$stmt->execute()) {
        throw new Exception('Error al consultar administradores asignados: ' . $stmt->error);
    }
    
    $result = $stmt->get_result();
    $administradores = [];
    
    while ($row = $result->fetch_assoc()) {
        $administradores[] = $row;
    }
    
    if (empty($administradores)) {
        return [
            'success' => true,
            'administradores' => [],
            'message' => 'No tienes administradores asignados'
        ];
    }
    
    return [
        'success' => true,
        'administradores' => $administradores,
        'message' => 'Administradores encontrados'
    ];
}

// Función para guardar calificación de administrador
function guardarCalificacionAdmin($conn, $data) {
    // Validar sesión
    validarSesionAdmin($data);
    
    // Validar datos requeridos
    $id_cliente = $data['id_cliente'] ?? null;
    $id_administrador = $data['id_administrador'] ?? null;
    $calificacion = $data['calificacion'] ?? null;
    $descripcion = $data['descripcion'] ?? null;
    
    if (!$id_cliente || !is_numeric($id_cliente)) {
        throw new Exception('ID de cliente inválido');
    }
    
    if (!$id_administrador || !is_numeric($id_administrador)) {
        throw new Exception('ID de administrador inválido');
    }
    
    if (!$calificacion || !is_numeric($calificacion) || $calificacion < 1 || $calificacion > 5) {
        throw new Exception('Calificación inválida (debe ser entre 1 y 5)');
    }
    
    if (!$descripcion || strlen(trim($descripcion)) < 10) {
        throw new Exception('Descripción requerida (mínimo 10 caracteres)');
    }
    
    // Iniciar transacción
    $conn->begin_transaction();
    
    try {
        // Insertar calificación
        $stmt = $conn->prepare("
            INSERT INTO calificacionadministrador (
                id_usuario_cliente, 
                id_usuario_admin, 
                puntuacion, 
                comentario, 
                promedio_calificacion
            ) VALUES (?, ?, ?, ?, ?)
        ");
        
        $stmt->bind_param("iiisd", 
            $id_cliente, 
            $id_administrador, 
            $calificacion, 
            $descripcion, 
            $calificacion
        );
        
        if (!$stmt->execute()) {
            throw new Exception('Error al guardar la calificación: ' . $stmt->error);
        }
        
        $id_calificacion = $conn->insert_id;
        
        $conn->commit();
        
        return [
            'success' => true,
            'message' => 'Calificación guardada correctamente',
            'id_calificacion' => $id_calificacion,
            'promedio_calificacion' => $calificacion
        ];
        
    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }
}

// Función para obtener calificaciones de administrador
function obtenerCalificacionesAdmin($conn, $data) {
    // Validar sesión
    validarSesionAdmin($data);
    
    $id_cliente = $data['id_cliente'] ?? null;
    
    if (!$id_cliente || !is_numeric($id_cliente)) {
        throw new Exception('ID de cliente inválido');
    }
    
    // Consulta para obtener calificaciones del cliente
    $query = "
        SELECT 
            ca.id_calificacion,
            ca.puntuacion,
            ca.comentario,
            ca.fecha_calificacion,
            ca.promedio_calificacion,
            u.nombre,
            u.apellido,
            u.rut_numero,
            u.rut_dv
        FROM calificacionadministrador ca
        INNER JOIN usuarios u ON ca.id_usuario_admin = u.id_usuario
        WHERE ca.id_usuario_cliente = ?
        ORDER BY ca.fecha_calificacion DESC
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id_cliente);
    
    if (!$stmt->execute()) {
        throw new Exception('Error al consultar calificaciones: ' . $stmt->error);
    }
    
    $result = $stmt->get_result();
    $calificaciones = [];
    
    while ($row = $result->fetch_assoc()) {
        $calificaciones[] = [
            'id_calificacion' => $row['id_calificacion'],
            'puntuacion' => $row['puntuacion'],
            'comentario' => $row['comentario'],
            'fecha_calificacion' => $row['fecha_calificacion'],
            'promedio_calificacion' => $row['promedio_calificacion'],
            'administrador' => [
                'nombre' => $row['nombre'],
                'apellido' => $row['apellido'],
                'rut_numero' => $row['rut_numero'],
                'rut_dv' => $row['rut_dv']
            ]
        ];
    }
    
    // Calcular promedio general
    $promedio_general = calcularPromedioGeneralAdmin($conn, $id_cliente);
    
    return [
        'success' => true,
        'calificaciones' => $calificaciones,
        'promedio_general' => $promedio_general
    ];
}

// Función para buscar calificaciones por RUT
function buscarCalificacionesPorRUT($conn, $data) {
    // Validar sesión
    validarSesionAdmin($data);
    
    $rut_busqueda = $data['rut_busqueda'] ?? null;
    
    if (!$rut_busqueda || strlen(trim($rut_busqueda)) < 8) {
        throw new Exception('RUT inválido');
    }
    
    // Limpiar y formatear RUT
    $rut_limpio = preg_replace('/[^0-9kK]/', '', $rut_busqueda);
    $rut_numero = substr($rut_limpio, 0, -1);
    $rut_dv = strtoupper(substr($rut_limpio, -1));
    
    if (!is_numeric($rut_numero) || strlen($rut_numero) < 7) {
        throw new Exception('RUT inválido');
    }
    
    // Buscar administrador por RUT
    $query = "
        SELECT 
            u.id_usuario,
            u.nombre,
            u.apellido,
            u.rut_numero,
            u.rut_dv
        FROM usuarios u
        WHERE u.rut_numero = ? AND u.rut_dv = ?
        AND u.id_usuario IN (
            SELECT DISTINCT id_usuario FROM gestiondeespacio
        )
        LIMIT 1
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("is", $rut_numero, $rut_dv);
    
    if (!$stmt->execute()) {
        throw new Exception('Error al buscar administrador: ' . $stmt->error);
    }
    
    $result = $stmt->get_result();
    $administrador = $result->fetch_assoc();
    
    if (!$administrador) {
        return [
            'success' => true,
            'administrador' => null,
            'calificaciones' => [],
            'message' => 'No se encontró administrador con ese RUT'
        ];
    }
    
    // Obtener calificaciones del administrador
    $query_calificaciones = "
        SELECT 
            ca.id_calificacion,
            ca.puntuacion,
            ca.comentario,
            ca.fecha_calificacion,
            ca.promedio_calificacion,
            u_cliente.nombre as cliente_nombre,
            u_cliente.apellido as cliente_apellido,
            u_cliente.rut_numero as cliente_rut_numero,
            u_cliente.rut_dv as cliente_rut_dv
        FROM calificacionadministrador ca
        INNER JOIN usuarios u_cliente ON ca.id_usuario_cliente = u_cliente.id_usuario
        WHERE ca.id_usuario_admin = ?
        ORDER BY ca.fecha_calificacion DESC
    ";
    
    $stmt_calificaciones = $conn->prepare($query_calificaciones);
    $stmt_calificaciones->bind_param("i", $administrador['id_usuario']);
    
    if (!$stmt_calificaciones->execute()) {
        throw new Exception('Error al consultar calificaciones: ' . $stmt_calificaciones->error);
    }
    
    $result_calificaciones = $stmt_calificaciones->get_result();
    $calificaciones = [];
    
    while ($row = $result_calificaciones->fetch_assoc()) {
        $calificaciones[] = [
            'id_calificacion' => $row['id_calificacion'],
            'puntuacion' => $row['puntuacion'],
            'comentario' => $row['comentario'],
            'fecha_calificacion' => $row['fecha_calificacion'],
            'promedio_calificacion' => $row['promedio_calificacion'],
            'cliente' => [
                'nombre' => $row['cliente_nombre'],
                'apellido' => $row['cliente_apellido'],
                'rut_numero' => $row['cliente_rut_numero'],
                'rut_dv' => $row['cliente_rut_dv']
            ]
        ];
    }
    
    // Calcular promedio general del administrador
    $promedio_general = calcularPromedioGeneralAdministrador($conn, $administrador['id_usuario']);
    
    return [
        'success' => true,
        'administrador' => $administrador,
        'calificaciones' => $calificaciones,
        'promedio_general' => $promedio_general
    ];
}

// Función para calcular promedio general del cliente
function calcularPromedioGeneralAdmin($conn, $id_cliente) {
    $query = "
        SELECT AVG(promedio_calificacion) as promedio
        FROM calificacionadministrador
        WHERE id_usuario_cliente = ?
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id_cliente);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    
    return $row['promedio'] ? round($row['promedio'], 2) : 0;
}

// Función para calcular promedio general del administrador
function calcularPromedioGeneralAdministrador($conn, $id_administrador) {
    $query = "
        SELECT AVG(promedio_calificacion) as promedio
        FROM calificacionadministrador
        WHERE id_administrador = ?
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id_administrador);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    
    return $row['promedio'] ? round($row['promedio'], 2) : 0;
}

// Función para validar sesión
function validarSesionAdmin($data) {
    $action = $data['action'] ?? '';
    
    // Solo validar sesión para acciones que la requieren
    if (in_array($action, ['buscar_calificaciones_por_rut'])) {
        session_start();
        
        if (!isset($_SESSION['usuario_logueado'])) {
            throw new Exception('Sesión no válida');
        }
        
        $usuario = $_SESSION['usuario_logueado'];
        if (!$usuario || !isset($usuario['id_usuario'])) {
            throw new Exception('Usuario no válido');
        }
    }
}

// Función para buscar calificaciones por nombre y apellido
function buscarCalificacionesPorNombre($conn, $data) {
    $nombre_busqueda = $data['nombre_busqueda'] ?? null;
    
    if (!$nombre_busqueda || strlen(trim($nombre_busqueda)) < 2) {
        throw new Exception('Nombre inválido. Debe tener al menos 2 caracteres');
    }
    
    // Buscar administradores por nombre o apellido
    $query = "
        SELECT 
            u.id_usuario,
            u.nombre,
            u.apellido,
            u.rut_numero,
            u.rut_dv
        FROM usuarios u
        WHERE (u.nombre LIKE ? OR u.apellido LIKE ? OR CONCAT(u.nombre, ' ', u.apellido) LIKE ?)
        AND u.id_usuario IN (
            SELECT DISTINCT id_usuario FROM gestiondeespacio
        )
        ORDER BY u.nombre, u.apellido
        LIMIT 10
    ";
    
    $busqueda = '%' . $nombre_busqueda . '%';
    $stmt = $conn->prepare($query);
    $stmt->bind_param("sss", $busqueda, $busqueda, $busqueda);
    
    if (!$stmt->execute()) {
        throw new Exception('Error al buscar administradores: ' . $stmt->error);
    }
    
    $result = $stmt->get_result();
    $administradores = [];
    
    while ($row = $result->fetch_assoc()) {
        $administradores[] = $row;
    }
    
    if (empty($administradores)) {
        return [
            'success' => true,
            'administradores' => [],
            'calificaciones' => [],
            'promedio_general' => 0,
            'message' => 'No se encontraron administradores con ese nombre'
        ];
    }
    
    // Si solo hay un administrador, mostrar sus calificaciones
    if (count($administradores) === 1) {
        $administrador = $administradores[0];
        
        // Obtener calificaciones del administrador
        $calificaciones_query = "
            SELECT 
                ca.id_calificacion,
                ca.puntuacion,
                ca.comentario,
                ca.fecha_calificacion,
                ca.promedio_calificacion,
                u.nombre,
                u.apellido,
                u.rut_numero,
                u.rut_dv
            FROM calificacionadministrador ca
            INNER JOIN usuarios u ON ca.id_usuario_cliente = u.id_usuario
            WHERE ca.id_usuario_admin = ?
            ORDER BY ca.fecha_calificacion DESC
        ";
        
        $stmt_calificaciones = $conn->prepare($calificaciones_query);
        $stmt_calificaciones->bind_param("i", $administrador['id_usuario']);
        
        if (!$stmt_calificaciones->execute()) {
            throw new Exception('Error al obtener calificaciones: ' . $stmt_calificaciones->error);
        }
        
        $calificaciones_result = $stmt_calificaciones->get_result();
        $calificaciones = [];
        
        while ($row = $calificaciones_result->fetch_assoc()) {
            $calificaciones[] = [
                'id_calificacion' => $row['id_calificacion'],
                'puntuacion' => $row['puntuacion'],
                'comentario' => $row['comentario'],
                'fecha_calificacion' => $row['fecha_calificacion'],
                'promedio_calificacion' => $row['promedio_calificacion'],
                'cliente' => [
                    'nombre' => $row['nombre'],
                    'apellido' => $row['apellido'],
                    'rut_numero' => $row['rut_numero'],
                    'rut_dv' => $row['rut_dv']
                ]
            ];
        }
        
        // Calcular promedio general
        $promedio_general = 0;
        if (!empty($calificaciones)) {
            $suma_promedios = array_sum(array_column($calificaciones, 'promedio_calificacion'));
            $promedio_general = round($suma_promedios / count($calificaciones), 1);
        }
        
        return [
            'success' => true,
            'administrador' => $administrador,
            'calificaciones' => $calificaciones,
            'promedio_general' => $promedio_general,
            'message' => 'Administrador encontrado'
        ];
    }
    
    // Si hay múltiples administradores, devolver la lista para selección
    return [
        'success' => true,
        'administradores' => $administradores,
        'calificaciones' => [],
        'promedio_general' => 0,
        'message' => 'Múltiples administradores encontrados'
    ];
}

// Función para obtener una calificación por ID
function obtenerCalificacionPorId($conn, $data) {
    $id_calificacion = $data['id_calificacion'] ?? null;
    $id_cliente = $data['id_cliente'] ?? null;
    
    if (!$id_calificacion || !is_numeric($id_calificacion)) {
        throw new Exception('ID de calificación inválido');
    }
    
    if (!$id_cliente || !is_numeric($id_cliente)) {
        throw new Exception('ID de cliente inválido');
    }
    
    // Consulta para obtener la calificación específica
    $query = "
        SELECT 
            ca.id_calificacion,
            ca.puntuacion,
            ca.comentario,
            ca.fecha_calificacion,
            ca.promedio_calificacion,
            ca.id_usuario_admin,
            u.nombre,
            u.apellido,
            u.rut_numero,
            u.rut_dv
        FROM calificacionadministrador ca
        INNER JOIN usuarios u ON ca.id_usuario_admin = u.id_usuario
        WHERE ca.id_calificacion = ? AND ca.id_usuario_cliente = ?
        LIMIT 1
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ii", $id_calificacion, $id_cliente);
    
    if (!$stmt->execute()) {
        throw new Exception('Error al obtener la calificación: ' . $stmt->error);
    }
    
    $result = $stmt->get_result();
    $calificacion = $result->fetch_assoc();
    
    if (!$calificacion) {
        return [
            'success' => false,
            'message' => 'Calificación no encontrada'
        ];
    }
    
    return [
        'success' => true,
        'calificacion' => $calificacion,
        'message' => 'Calificación obtenida correctamente'
    ];
}

// Función para actualizar calificación de administrador
function actualizarCalificacionAdmin($conn, $data) {
    // Debugging: mostrar datos recibidos
    error_log("Datos recibidos para actualizar: " . json_encode($data));
    
    $id_calificacion = $data['id_calificacion'] ?? null;
    $id_cliente = $data['id_cliente'] ?? null;
    $id_usuario_admin = $data['id_usuario_admin'] ?? null;
    $calificacion = $data['calificacion'] ?? null;
    $descripcion = $data['descripcion'] ?? null;
    
    // Debugging: mostrar valores extraídos
    error_log("Valores extraídos - ID Admin: $id_usuario_admin, Cliente: $id_cliente, Calificación: $calificacion");
    
    if (!$id_calificacion || !is_numeric($id_calificacion)) {
        throw new Exception('ID de calificación inválido');
    }
    
    if (!$id_cliente || !is_numeric($id_cliente)) {
        throw new Exception('ID de cliente inválido');
    }
    
    if (!$id_usuario_admin || !is_numeric($id_usuario_admin)) {
        throw new Exception('ID de administrador inválido');
    }
    
    if (!$calificacion || !is_numeric($calificacion) || $calificacion < 1 || $calificacion > 5) {
        throw new Exception('Calificación inválida');
    }
    
    if (!$descripcion || strlen(trim($descripcion)) < 5) {
        throw new Exception('Descripción requerida (mínimo 5 caracteres)');
    }
    
    $conn->begin_transaction();
    
    try {
        // Actualizar la calificación
        $query = "
            UPDATE calificacionadministrador 
            SET 
                id_usuario_admin = ?,
                puntuacion = ?,
                comentario = ?,
                promedio_calificacion = ?
            WHERE id_calificacion = ? AND id_usuario_cliente = ?
        ";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param(
            "iisdii", 
            $id_usuario_admin, 
            $calificacion, 
            $descripcion, 
            $calificacion, 
            $id_calificacion, 
            $id_cliente
        );
        
        if (!$stmt->execute()) {
            throw new Exception('Error al actualizar la calificación: ' . $stmt->error);
        }
        
        if ($stmt->affected_rows === 0) {
            throw new Exception('No se encontró la calificación para actualizar');
        }
        
        $conn->commit();
        
        return [
            'success' => true,
            'message' => 'Calificación actualizada correctamente',
            'promedio_calificacion' => $calificacion
        ];
        
    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }
}

// Función para eliminar calificación de administrador
function eliminarCalificacionAdmin($conn, $data) {
    $id_calificacion = $data['id_calificacion'] ?? null;
    $id_cliente = $data['id_cliente'] ?? null;
    
    if (!$id_calificacion || !is_numeric($id_calificacion)) {
        throw new Exception('ID de calificación inválido');
    }
    
    if (!$id_cliente || !is_numeric($id_cliente)) {
        throw new Exception('ID de cliente inválido');
    }
    
    $conn->begin_transaction();
    
    try {
        // Verificar que la calificación pertenece al cliente
        $query_verificar = "SELECT id_calificacion FROM calificacionadministrador WHERE id_calificacion = ? AND id_usuario_cliente = ?";
        $stmt_verificar = $conn->prepare($query_verificar);
        $stmt_verificar->bind_param("ii", $id_calificacion, $id_cliente);
        $stmt_verificar->execute();
        $resultado_verificar = $stmt_verificar->get_result();
        
        if ($resultado_verificar->num_rows === 0) {
            throw new Exception('La calificación no existe o no pertenece a este cliente');
        }
        
        // Eliminar la calificación
        $query_eliminar = "DELETE FROM calificacionadministrador WHERE id_calificacion = ? AND id_usuario_cliente = ?";
        $stmt_eliminar = $conn->prepare($query_eliminar);
        $stmt_eliminar->bind_param("ii", $id_calificacion, $id_cliente);
        
        if (!$stmt_eliminar->execute()) {
            throw new Exception('Error al eliminar la calificación: ' . $stmt_eliminar->error);
        }
        
        if ($stmt_eliminar->affected_rows === 0) {
            throw new Exception('No se pudo eliminar la calificación');
        }
        
        $conn->commit();
        
        return [
            'success' => true,
            'message' => 'Calificación eliminada correctamente'
        ];
        
    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }
}

?>
