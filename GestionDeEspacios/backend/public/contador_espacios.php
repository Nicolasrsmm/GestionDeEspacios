<?php
require_once __DIR__ . '/../config/db_config.php';

header('Content-Type: application/json; charset=utf-8');

set_exception_handler(function($e) {
    echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
    exit;
});

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $errstr]);
    exit;
});

$data = $_POST;

if (!$data || count($data) === 0) {
    echo json_encode(['success' => false, 'message' => 'No se recibieron datos']);
    exit;
}

if (!isset($data['action'])) {
    echo json_encode(['success' => false, 'message' => 'Acción no especificada']);
    exit;
}

try {
    $conn = getDBConnection();
    
    switch ($data['action']) {
        case 'verificar_limite_espacio':
            echo json_encode(verificarLimiteEspacio($conn, $data['id_administrador']));
            break;
        case 'verificar_limite_publicacion':
            echo json_encode(verificarLimitePublicacion($conn, $data['id_administrador']));
            break;
        case 'incrementar_espacio':
            echo json_encode(incrementarContadorEspacio($conn, $data['id_administrador']));
            break;
        case 'incrementar_publicacion':
            echo json_encode(incrementarContadorPublicacion($conn, $data['id_administrador']));
            break;
        case 'decrementar_espacio':
            echo json_encode(decrementarContadorEspacio($conn, $data['id_administrador']));
            break;
        case 'decrementar_publicacion':
            echo json_encode(decrementarContadorPublicacion($conn, $data['id_administrador']));
            break;
        case 'obtener_contadores':
            echo json_encode(obtenerContadores($conn, $data['id_administrador']));
            break;
        case 'obtener_suscripcion':
            echo json_encode(obtenerSuscripcion($conn, $data['id_administrador']));
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
            break;
    }
    
    $conn->close();
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error de conexión a la base de datos: ' . $e->getMessage()]);
}

/**
 * Verificar si el administrador puede crear más espacios
 */
function verificarLimiteEspacio($conn, $id_administrador) {
    // Obtener plan de la suscripción actual del administrador
    $stmt = $conn->prepare("
        SELECT p.cantidad_espacios, p.nombre_plan
        FROM usuarios u
        JOIN suscripciones s ON u.id_suscripcion = s.id_suscripcion
        JOIN planes p ON p.id_plan = s.id_plan
        WHERE u.id_usuario = ? AND u.activo = 1
    ");
    $stmt->bind_param('i', $id_administrador);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        return ['success' => false, 'message' => 'Administrador no encontrado o sin suscripción'];
    }
    
    $suscripcion = $result->fetch_assoc();
    $limite_espacios = $suscripcion['cantidad_espacios'];
    
    // Obtener contador actual
    $stmt = $conn->prepare("
        SELECT total_espacios FROM contador_admin_espacios 
        WHERE id_usuario = ?
    ");
    $stmt->bind_param('i', $id_administrador);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $espacios_actuales = 0;
    if ($result->num_rows > 0) {
        $contador = $result->fetch_assoc();
        $espacios_actuales = $contador['total_espacios'];
    }
    
    $puede_crear = $espacios_actuales < $limite_espacios;
    $espacios_disponibles = $limite_espacios - $espacios_actuales;
    
    return [
        'success' => true,
        'puede_crear' => $puede_crear,
        'espacios_actuales' => $espacios_actuales,
        'limite_espacios' => $limite_espacios,
        'espacios_disponibles' => $espacios_disponibles,
        'suscripcion' => $suscripcion['nombre_plan']
    ];
}

/**
 * Verificar si el administrador puede crear más publicaciones de arriendo
 */
function verificarLimitePublicacion($conn, $id_administrador) {
    // Obtener plan de la suscripción actual del administrador
    $stmt = $conn->prepare("
        SELECT p.cantidad_espacios, p.nombre_plan
        FROM usuarios u
        JOIN suscripciones s ON u.id_suscripcion = s.id_suscripcion
        JOIN planes p ON p.id_plan = s.id_plan
        WHERE u.id_usuario = ? AND u.activo = 1
    ");
    $stmt->bind_param('i', $id_administrador);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        return ['success' => false, 'message' => 'Administrador no encontrado o sin suscripción'];
    }
    
    $suscripcion = $result->fetch_assoc();
    $limite_publicaciones = $suscripcion['cantidad_espacios']; // Mismo límite que espacios
    
    // Obtener contador actual
    $stmt = $conn->prepare("
        SELECT total_publicaciones FROM contador_admin_espacios 
        WHERE id_usuario = ?
    ");
    $stmt->bind_param('i', $id_administrador);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $publicaciones_actuales = 0;
    if ($result->num_rows > 0) {
        $contador = $result->fetch_assoc();
        $publicaciones_actuales = $contador['total_publicaciones'];
    }
    
    $puede_crear = $publicaciones_actuales < $limite_publicaciones;
    $publicaciones_disponibles = $limite_publicaciones - $publicaciones_actuales;
    
    return [
        'success' => true,
        'puede_crear' => $puede_crear,
        'publicaciones_actuales' => $publicaciones_actuales,
        'limite_publicaciones' => $limite_publicaciones,
        'publicaciones_disponibles' => $publicaciones_disponibles,
        'suscripcion' => $suscripcion['nombre_plan']
    ];
}

/**
 * Incrementar contador de espacios
 */
function incrementarContadorEspacio($conn, $id_administrador) {
    $conn->begin_transaction();
    
    try {
        // Verificar si existe el contador
        $stmt = $conn->prepare("SELECT total_espacios FROM contador_admin_espacios WHERE id_usuario = ?");
        $stmt->bind_param('i', $id_administrador);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            // Actualizar contador existente
            $stmt = $conn->prepare("
                UPDATE contador_admin_espacios 
                SET total_espacios = total_espacios + 1 
                WHERE id_usuario = ?
            ");
            $stmt->bind_param('i', $id_administrador);
        } else {
            // Crear nuevo contador
            $stmt = $conn->prepare("
                INSERT INTO contador_admin_espacios (id_usuario, total_espacios) 
                VALUES (?, 1)
            ");
            $stmt->bind_param('i', $id_administrador);
        }
        
        if (!$stmt->execute()) {
            throw new Exception('Error al actualizar contador de espacios');
        }
        
        $conn->commit();
        return ['success' => true, 'message' => 'Contador de espacios incrementado'];
        
    } catch (Exception $e) {
        $conn->rollback();
        return ['success' => false, 'message' => 'Error al incrementar contador: ' . $e->getMessage()];
    }
}

/**
 * Incrementar contador de publicaciones
 */
function incrementarContadorPublicacion($conn, $id_administrador) {
    $conn->begin_transaction();
    
    try {
        // Verificar si existe el contador
        $stmt = $conn->prepare("SELECT total_publicaciones FROM contador_admin_espacios WHERE id_usuario = ?");
        $stmt->bind_param('i', $id_administrador);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            // Actualizar contador existente
            $stmt = $conn->prepare("
                UPDATE contador_admin_espacios 
                SET total_publicaciones = total_publicaciones + 1 
                WHERE id_usuario = ?
            ");
            $stmt->bind_param('i', $id_administrador);
        } else {
            // Crear nuevo contador
            $stmt = $conn->prepare("
                INSERT INTO contador_admin_espacios (id_usuario, total_publicaciones) 
                VALUES (?, 1)
            ");
            $stmt->bind_param('i', $id_administrador);
        }
        
        if (!$stmt->execute()) {
            throw new Exception('Error al actualizar contador de publicaciones');
        }
        
        $conn->commit();
        return ['success' => true, 'message' => 'Contador de publicaciones incrementado'];
        
    } catch (Exception $e) {
        $conn->rollback();
        return ['success' => false, 'message' => 'Error al incrementar contador: ' . $e->getMessage()];
    }
}

/**
 * Decrementar contador de espacios
 */
function decrementarContadorEspacio($conn, $id_administrador) {
    $conn->begin_transaction();
    
    try {
        $stmt = $conn->prepare("
            UPDATE contador_admin_espacios 
            SET total_espacios = GREATEST(total_espacios - 1, 0) 
            WHERE id_usuario = ?
        ");
        $stmt->bind_param('i', $id_administrador);
        
        if (!$stmt->execute()) {
            throw new Exception('Error al decrementar contador de espacios');
        }
        
        $conn->commit();
        return ['success' => true, 'message' => 'Contador de espacios decrementado'];
        
    } catch (Exception $e) {
        $conn->rollback();
        return ['success' => false, 'message' => 'Error al decrementar contador: ' . $e->getMessage()];
    }
}

/**
 * Decrementar contador de publicaciones
 */
function decrementarContadorPublicacion($conn, $id_administrador) {
    $conn->begin_transaction();
    
    try {
        $stmt = $conn->prepare("
            UPDATE contador_admin_espacios 
            SET total_publicaciones = GREATEST(total_publicaciones - 1, 0) 
            WHERE id_usuario = ?
        ");
        $stmt->bind_param('i', $id_administrador);
        
        if (!$stmt->execute()) {
            throw new Exception('Error al decrementar contador de publicaciones');
        }
        
        $conn->commit();
        return ['success' => true, 'message' => 'Contador de publicaciones decrementado'];
        
    } catch (Exception $e) {
        $conn->rollback();
        return ['success' => false, 'message' => 'Error al decrementar contador: ' . $e->getMessage()];
    }
}

/**
 * Obtener contadores del administrador
 */
function obtenerContadores($conn, $id_administrador) {
    $stmt = $conn->prepare("
        SELECT 
            COALESCE(c.total_espacios, 0) as total_espacios,
            COALESCE(c.total_publicaciones, 0) as total_publicaciones,
            p.cantidad_espacios as limite_espacios,
            p.nombre_plan
        FROM usuarios u
        JOIN suscripciones s ON u.id_suscripcion = s.id_suscripcion
        JOIN planes p ON p.id_plan = s.id_plan
        LEFT JOIN contador_admin_espacios c ON u.id_usuario = c.id_usuario
        WHERE u.id_usuario = ? AND u.activo = 1
    ");
    $stmt->bind_param('i', $id_administrador);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        return ['success' => false, 'message' => 'Administrador no encontrado'];
    }
    
    $data = $result->fetch_assoc();
    
    return [
        'success' => true,
        'contadores' => [
            'total_espacios' => (int)$data['total_espacios'],
            'total_publicaciones' => (int)$data['total_publicaciones'],
            'limite_espacios' => (int)$data['limite_espacios'],
            'limite_publicaciones' => (int)$data['limite_espacios'], // Mismo límite
            'espacios_disponibles' => (int)$data['limite_espacios'] - (int)$data['total_espacios'],
            'publicaciones_disponibles' => (int)$data['limite_espacios'] - (int)$data['total_publicaciones'],
            'suscripcion' => $data['nombre_plan']
        ]
    ];
}

/**
 * Obtener información de suscripción del administrador
 */
function obtenerSuscripcion($conn, $id_administrador) {
    $stmt = $conn->prepare("
        SELECT 
            s.id_suscripcion,
            p.id_plan,
            p.nombre_plan,
            p.precio,
            p.cantidad_espacios
        FROM usuarios u
        JOIN suscripciones s ON u.id_suscripcion = s.id_suscripcion
        JOIN planes p ON p.id_plan = s.id_plan
        WHERE u.id_usuario = ? AND u.activo = 1
    ");
    $stmt->bind_param('i', $id_administrador);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        return ['success' => false, 'message' => 'Administrador no encontrado o sin suscripción'];
    }
    
    $suscripcion = $result->fetch_assoc();
    
    return [
        'success' => true,
        'suscripcion' => [
            'id_suscripcion' => $suscripcion['id_suscripcion'],
            'id_plan' => $suscripcion['id_plan'],
            'nombre_suscripcion' => $suscripcion['nombre_plan'],
            'precio' => $suscripcion['precio'],
            'cantidad_espacios' => $suscripcion['cantidad_espacios']
        ]
    ];
}
?>
