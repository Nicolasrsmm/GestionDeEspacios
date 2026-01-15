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

$action = $_GET['action'] ?? $_POST['action'] ?? '';

if (!$action) {
    echo json_encode(['success' => false, 'message' => 'Acción no especificada']);
    exit;
}

try {
    $conn = getDBConnection();
    
    switch ($action) {
        case 'obtener_pagos':
            echo json_encode(obtenerPagos($conn, $_GET['id_administrador'] ?? $_POST['id_administrador'] ?? 0));
            break;
        
        case 'obtener_todos_pagos':
            echo json_encode(obtenerTodosPagos($conn));
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
 * Obtener pagos del administrador
 */
function obtenerPagos($conn, $id_administrador) {
    if ($id_administrador <= 0) {
        return ['success' => false, 'message' => 'ID de administrador inválido'];
    }
    
    $stmt = $conn->prepare("
        SELECT 
            p.id_pago,
            p.id_suscripcion,
            p.id_usuario,
            p.id_plan,
            p.id_metodo_pago,
            p.monto_total,
            p.cantidad_cuotas,
            p.monto_por_cuota,
            p.fecha_pago,
            p.estado,
            p.transaccion_id,
            p.token_pago,
            pl.nombre_plan,
            mp.metodo_pago
        FROM pagos p
        LEFT JOIN planes pl ON p.id_plan = pl.id_plan
        LEFT JOIN metodos_pago mp ON p.id_metodo_pago = mp.id_metodo_pago
        WHERE p.id_usuario = ?
        ORDER BY p.fecha_pago DESC
    ");
    
    $stmt->bind_param('i', $id_administrador);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $pagos = [];
    while ($row = $result->fetch_assoc()) {
        $pagos[] = $row;
    }
    
    return [
        'success' => true,
        'pagos' => $pagos
    ];
}

/**
 * Obtener todos los pagos del sistema (para AdminSistema)
 */
function obtenerTodosPagos($conn) {
    $stmt = $conn->prepare("
        SELECT 
            p.id_pago,
            p.id_suscripcion,
            p.id_usuario,
            p.id_plan,
            p.id_metodo_pago,
            p.monto_total,
            p.cantidad_cuotas,
            p.monto_por_cuota,
            p.fecha_pago,
            p.estado,
            p.transaccion_id,
            p.token_pago,
            pl.nombre_plan,
            mp.metodo_pago,
            CONCAT(u.nombre, ' ', u.apellido) as nombre_usuario_completo
        FROM pagos p
        LEFT JOIN planes pl ON p.id_plan = pl.id_plan
        LEFT JOIN metodos_pago mp ON p.id_metodo_pago = mp.id_metodo_pago
        LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
        ORDER BY p.fecha_pago DESC
    ");
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $pagos = [];
    while ($row = $result->fetch_assoc()) {
        $pagos[] = $row;
    }
    
    $stmt->close();
    
    return [
        'success' => true,
        'pagos' => $pagos
    ];
}
?>

