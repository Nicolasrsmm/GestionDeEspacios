<?php
// Configurar manejo de errores ANTES de cualquier salida
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Buffer de salida para capturar cualquier output inesperado
ob_start();

// Headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit();
}

try {
    require_once '../config/db_config.php';
} catch (Exception $e) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de configuración: ' . $e->getMessage()
    ]);
    exit();
}

// Función para validar sesión
function validarSesion($data) {
    // Solo validar sesión para acciones que requieren autenticación
    if ($data['action'] === 'guardar_calificacion_espacio') {
        if (!isset($data['id_cliente']) || empty($data['id_cliente'])) {
            throw new Exception('ID de cliente requerido');
        }
        
        // Aquí podrías agregar validación adicional de sesión si es necesario
        return true;
    }
    
    // Para otras acciones como 'obtener_calificaciones', no validar sesión
    return true;
}

// Función para validar datos de entrada
function validarDatos($data) {
    $errores = [];
    
    // Validar acción
    if (!isset($data['action']) || empty($data['action'])) {
        $errores[] = 'Acción requerida';
        return $errores; // Si no hay acción, no validar más campos
    }
    
    // Validar según la acción
    switch ($data['action']) {
        case 'guardar_calificacion_espacio':
            // Validar ID del cliente
            if (!isset($data['id_cliente']) || !is_numeric($data['id_cliente'])) {
                $errores[] = 'ID de cliente inválido';
            }
            
            // Validar ID de la publicación
            if (!isset($data['id_publicacion']) || !is_numeric($data['id_publicacion'])) {
                $errores[] = 'ID de publicación inválido';
            }
            
            // Validar calificación
            if (!isset($data['calificacion']) || !is_numeric($data['calificacion'])) {
                $errores[] = 'Calificación requerida';
            } elseif ($data['calificacion'] < 1 || $data['calificacion'] > 5) {
                $errores[] = 'La calificación debe estar entre 1 y 5';
            }
            
            // Validar descripción
            if (!isset($data['descripcion']) || empty(trim($data['descripcion']))) {
                $errores[] = 'Descripción requerida';
            } elseif (strlen(trim($data['descripcion'])) < 10) {
                $errores[] = 'La descripción debe tener al menos 10 caracteres';
            } elseif (strlen(trim($data['descripcion'])) > 500) {
                $errores[] = 'La descripción no puede exceder 500 caracteres';
            }
            break;
            
        case 'obtener_calificaciones':
            // Solo validar ID de publicación para obtener calificaciones
            if (!isset($data['id_publicacion']) || !is_numeric($data['id_publicacion'])) {
                $errores[] = 'ID de publicación inválido';
            }
            break;
            
        case 'obtener_calificaciones_de_cliente':
            if (!isset($data['id_usuario']) || !is_numeric($data['id_usuario'])) {
                $errores[] = 'ID de usuario inválido';
            }
            break;

        case 'obtener_calificaciones_de_cliente':
            if (!isset($data['id_usuario']) || !is_numeric($data['id_usuario'])) {
                $errores[] = 'ID de usuario inválido';
            }
            break;

        case 'eliminar_calificacion':
            if (!isset($data['id_calificacion']) || !is_numeric($data['id_calificacion'])) {
                $errores[] = 'ID de calificación inválido';
            }
            if (!isset($data['id_usuario']) || !is_numeric($data['id_usuario'])) {
                $errores[] = 'ID de usuario inválido';
            }
            break;

        default:
            $errores[] = 'Acción no válida';
    }
    
    return $errores;
}

// Función para verificar si la publicación existe
function verificarPublicacionExiste($conn, $id_publicacion) {
    $stmt = $conn->prepare("SELECT id_publicacion FROM publicararriendo WHERE id_publicacion = ?");
    $stmt->bind_param("i", $id_publicacion);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result->num_rows > 0;
}

// Función para calcular el promedio de calificaciones de una publicación
function calcularPromedioCalificacion($conn, $id_publicacion) {
    $stmt = $conn->prepare("SELECT AVG(puntuacion) as promedio FROM calificacionespacio WHERE id_publicacion = ?");
    $stmt->bind_param("i", $id_publicacion);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        return round($row['promedio'], 2);
    }
    
    return null;
}

// Función para guardar calificación
function guardarCalificacion($conn, $data) {
    try {
        $conn->begin_transaction();
        
        // Verificar si la publicación existe
        if (!verificarPublicacionExiste($conn, $data['id_publicacion'])) {
            throw new Exception('La publicación especificada no existe');
        }
        
        // Insertar nueva calificación (siempre como nuevo registro)
        $stmt = $conn->prepare("
            INSERT INTO calificacionespacio (
                id_usuario_cliente, 
                id_publicacion, 
                puntuacion, 
                comentario
            ) VALUES (?, ?, ?, ?)
        ");
        
        $stmt->bind_param(
            "iiis", 
            $data['id_cliente'], 
            $data['id_publicacion'], 
            $data['calificacion'], 
            trim($data['descripcion'])
        );
        
        if (!$stmt->execute()) {
            throw new Exception('Error al guardar la calificación: ' . $stmt->error);
        }
        
        $id_calificacion = $conn->insert_id;
        
        // Guardar la puntuación del usuario en promedio_calificacion (las estrellas que seleccionó)
        $stmt_update = $conn->prepare("UPDATE calificacionespacio SET promedio_calificacion = ? WHERE id_calificacion = ?");
        $stmt_update->bind_param("di", $data['calificacion'], $id_calificacion);
        $stmt_update->execute();
        
        $conn->commit();
        
        return [
            'success' => true,
            'message' => 'Calificación guardada correctamente',
            'id_calificacion' => $id_calificacion,
            'promedio_calificacion' => $data['calificacion']
        ];
        
    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }
}

// Función para obtener calificaciones de una publicación
function obtenerCalificacionesPublicacion($conn, $id_publicacion) {
    $stmt = $conn->prepare("
        SELECT 
            c.id_calificacion,
            c.puntuacion,
            c.comentario,
            c.fecha_calificacion,
            c.promedio_calificacion,
            c.id_usuario_cliente,
            u.nombre,
            u.apellido
        FROM calificacionespacio c
        JOIN usuarios u ON c.id_usuario_cliente = u.id_usuario
        WHERE c.id_publicacion = ?
        ORDER BY c.fecha_calificacion DESC
    ");
    
    $stmt->bind_param("i", $id_publicacion);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $calificaciones = [];
    while ($row = $result->fetch_assoc()) {
        $calificaciones[] = $row;
    }
    
    // Calcular el promedio de todos los promedio_calificacion
    $promedio_general = calcularPromedioGeneral($conn, $id_publicacion);
    
    return [
        'calificaciones' => $calificaciones,
        'promedio_general' => $promedio_general
    ];
}

// Función para calcular el promedio general de una publicación
function calcularPromedioGeneral($conn, $id_publicacion) {
    $stmt = $conn->prepare("SELECT AVG(promedio_calificacion) as promedio_general FROM calificacionespacio WHERE id_publicacion = ? AND promedio_calificacion IS NOT NULL");
    $stmt->bind_param("i", $id_publicacion);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        return round($row['promedio_general'], 2);
    }
    
    return null;
}

// Función principal
try {
    // Limpiar cualquier output previo
    ob_clean();
    
    // Log para depuración
    error_log("Calificar espacios - Iniciando procesamiento");
    error_log("Método: " . $_SERVER['REQUEST_METHOD']);
    error_log("Datos POST: " . print_r($_POST, true));
    
    // Verificar método HTTP
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Método no permitido');
    }
    
    // Obtener datos
    $data = $_POST;
    
    // Validar datos
    $errores = validarDatos($data);
    if (!empty($errores)) {
        throw new Exception(implode(', ', $errores));
    }
    
    // Validar sesión
    validarSesion($data);
    
    // Conectar a la base de datos
    error_log("Intentando conectar a la base de datos...");
    $conn = getDBConnection();
    error_log("Conexión a base de datos exitosa");
    
    // Procesar según la acción
    switch ($data['action']) {
        case 'guardar_calificacion_espacio':
            error_log("Procesando guardar calificación...");
            $resultado = guardarCalificacion($conn, $data);
            break;
            
        case 'obtener_calificaciones':
            if (!isset($data['id_publicacion']) || !is_numeric($data['id_publicacion'])) {
                throw new Exception('ID de publicación requerido para obtener calificaciones');
            }
            $datos_calificaciones = obtenerCalificacionesPublicacion($conn, $data['id_publicacion']);
            $resultado = [
                'success' => true,
                'calificaciones' => $datos_calificaciones['calificaciones'],
                'promedio_general' => $datos_calificaciones['promedio_general'],
                'total' => count($datos_calificaciones['calificaciones'])
            ];
            break;

        case 'obtener_calificaciones_de_cliente':
            if (!isset($data['id_usuario']) || !is_numeric($data['id_usuario'])) {
                throw new Exception('ID de usuario requerido');
            }
            $stmt = $conn->prepare("SELECT COUNT(*) AS total FROM calificacionespacio WHERE id_usuario_cliente = ?");
            $stmt->bind_param('i', $data['id_usuario']);
            $stmt->execute();
            $res = $stmt->get_result()->fetch_assoc();
            $resultado = [ 'success' => true, 'total' => intval($res['total'] ?? 0) ];
            break;

        case 'eliminar_calificacion':
            if (!isset($data['id_calificacion']) || !is_numeric($data['id_calificacion'])) {
                throw new Exception('ID de calificación requerido');
            }
            if (!isset($data['id_usuario']) || !is_numeric($data['id_usuario'])) {
                throw new Exception('ID de usuario requerido');
            }
            $stmt = $conn->prepare("SELECT id_calificacion FROM calificacionespacio WHERE id_calificacion = ? AND id_usuario_cliente = ?");
            $stmt->bind_param('ii', $data['id_calificacion'], $data['id_usuario']);
            $stmt->execute();
            $existe = $stmt->get_result()->num_rows > 0;
            $stmt->close();
            if (!$existe) { throw new Exception('No autorizado para eliminar esta calificación'); }
            $stmt = $conn->prepare("DELETE FROM calificacionespacio WHERE id_calificacion = ?");
            $stmt->bind_param('i', $data['id_calificacion']);
            if (!$stmt->execute()) { throw new Exception('No se pudo eliminar'); }
            $resultado = [ 'success' => true, 'message' => 'Calificación eliminada' ];
            break;
            
        default:
            throw new Exception('Acción no válida');
    }
    
    error_log("Procesamiento exitoso, enviando respuesta");
    
    // Limpiar buffer y enviar respuesta JSON
    ob_end_clean();
    echo json_encode($resultado, JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    error_log("Error en calificar espacios: " . $e->getMessage());
    
    // Limpiar buffer y enviar error JSON
    ob_end_clean();
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Error $e) {
    error_log("Error fatal en calificar espacios: " . $e->getMessage());
    
    // Limpiar buffer y enviar error JSON
    ob_end_clean();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno del servidor'
    ], JSON_UNESCAPED_UNICODE);
    
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
