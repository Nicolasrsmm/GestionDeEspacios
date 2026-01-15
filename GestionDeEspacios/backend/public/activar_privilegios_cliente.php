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
        case 'activar_privilegios':
            echo json_encode(activarPrivilegiosCliente($conn, $data));
            break;
        case 'verificar_privilegios':
            echo json_encode(verificarPrivilegiosCliente($conn, $data));
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
            break;
    }
    
    $conn->close();
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

// Función para activar privilegios de cliente
function activarPrivilegiosCliente($conn, $data) {
    if (!isset($data['id_usuario'])) {
        return ['success' => false, 'message' => 'ID de usuario requerido'];
    }
    
    $id_usuario = intval($data['id_usuario']);
    
    // Verificar que el usuario existe
    $stmt_user = $conn->prepare("
        SELECT u.id_usuario, u.nombre, u.apellido, r.nombre_rol
        FROM usuarios u
        JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario
        JOIN roles r ON ur.id_rol = r.id_rol
        WHERE u.id_usuario = ? AND u.activo = 1 AND ur.estado = 'Activo'
    ");
    $stmt_user->bind_param('i', $id_usuario);
    $stmt_user->execute();
    $result_user = $stmt_user->get_result();
    
    if ($result_user->num_rows === 0) {
        $stmt_user->close();
        return ['success' => false, 'message' => 'Usuario no encontrado o inactivo'];
    }
    
    $usuario = $result_user->fetch_assoc();
    $stmt_user->close();
    
    // Verificar que el usuario actual es Administrador
    if ($usuario['nombre_rol'] !== 'Administrador') {
        return ['success' => false, 'message' => 'Solo los administradores pueden activar privilegios de cliente'];
    }
    
    // Obtener ID del rol Cliente
    $stmt_rol = $conn->prepare("SELECT id_rol FROM roles WHERE nombre_rol = 'Cliente'");
    $stmt_rol->execute();
    $result_rol = $stmt_rol->get_result();
    
    if ($result_rol->num_rows === 0) {
        $stmt_rol->close();
        return ['success' => false, 'message' => 'Rol de Cliente no encontrado en el sistema'];
    }
    
    $rol_cliente = $result_rol->fetch_assoc();
    $id_rol_cliente = $rol_cliente['id_rol'];
    $stmt_rol->close();
    
    // Verificar si ya tiene el rol de Cliente asignado
    $stmt_verificar = $conn->prepare("
        SELECT id_usuariorol FROM usuario_rol 
        WHERE id_usuario = ? AND id_rol = ? AND estado = 'Activo'
    ");
    $stmt_verificar->bind_param('ii', $id_usuario, $id_rol_cliente);
    $stmt_verificar->execute();
    $result_verificar = $stmt_verificar->get_result();
    
    if ($result_verificar->num_rows > 0) {
        $stmt_verificar->close();
        return ['success' => false, 'message' => 'El usuario ya tiene privilegios de cliente activos'];
    }
    $stmt_verificar->close();
    
    // Iniciar transacción
    $conn->begin_transaction();
    
    try {
        // Insertar el rol de Cliente para el usuario
        $stmt_insert = $conn->prepare("
            INSERT INTO usuario_rol (id_usuario, id_rol, estado) 
            VALUES (?, ?, 'Activo')
        ");
        $stmt_insert->bind_param('ii', $id_usuario, $id_rol_cliente);
        
        if (!$stmt_insert->execute()) {
            throw new Exception('Error al asignar rol de cliente: ' . $stmt_insert->error);
        }
        
        $stmt_insert->close();
        
        // Confirmar transacción
        $conn->commit();
        
        // Obtener información actualizada del usuario
        $stmt_updated = $conn->prepare("
            SELECT 
                u.id_usuario, u.rut_numero, u.rut_dv, u.nombre, u.apellido, 
                u.telefono, u.id_region, u.id_ciudad, u.direccion, u.id_suscripcion,
                u.id_administrador_asociado, c.nombre_usuario, c.correo_electronico,
                GROUP_CONCAT(r.nombre_rol) as roles
            FROM usuarios u
            JOIN credenciales c ON u.id_usuario = c.id_usuario
            JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario
            JOIN roles r ON ur.id_rol = r.id_rol
            WHERE u.id_usuario = ? AND u.activo = 1 AND ur.estado = 'Activo'
            GROUP BY u.id_usuario
        ");
        $stmt_updated->bind_param('i', $id_usuario);
        $stmt_updated->execute();
        $result_updated = $stmt_updated->get_result();
        $usuario_actualizado = $result_updated->fetch_assoc();
        $stmt_updated->close();
        
        // Construir RUT completo
        $rut_completo = $usuario_actualizado['rut_numero'] . '-' . $usuario_actualizado['rut_dv'];
        
        return [
            'success' => true, 
            'message' => 'Privilegios de cliente activados correctamente',
            'usuario_actualizado' => [
                'id_usuario' => $usuario_actualizado['id_usuario'],
                'nombre_usuario' => $usuario_actualizado['nombre_usuario'],
                'nombre' => $usuario_actualizado['nombre'],
                'apellido' => $usuario_actualizado['apellido'],
                'rut' => $rut_completo,
                'correo_electronico' => $usuario_actualizado['correo_electronico'],
                'telefono' => $usuario_actualizado['telefono'],
                'direccion' => $usuario_actualizado['direccion'],
                'id_suscripcion' => $usuario_actualizado['id_suscripcion'],
                'roles' => explode(',', $usuario_actualizado['roles']),
                'id_administrador' => $usuario_actualizado['id_administrador_asociado'] ?? $usuario_actualizado['id_usuario']
            ]
        ];
        
    } catch (Exception $e) {
        // Revertir transacción
        $conn->rollback();
        throw $e;
    }
}

// Función para verificar si el usuario ya tiene privilegios de cliente
function verificarPrivilegiosCliente($conn, $data) {
    if (!isset($data['id_usuario'])) {
        return ['success' => false, 'message' => 'ID de usuario requerido'];
    }
    
    $id_usuario = intval($data['id_usuario']);
    
    $stmt = $conn->prepare("
        SELECT COUNT(*) as tiene_cliente
        FROM usuario_rol ur
        JOIN roles r ON ur.id_rol = r.id_rol
        WHERE ur.id_usuario = ? AND r.nombre_rol = 'Cliente' AND ur.estado = 'Activo'
    ");
    $stmt->bind_param('i', $id_usuario);
    $stmt->execute();
    $result = $stmt->get_result();
    $data = $result->fetch_assoc();
    $stmt->close();
    
    return [
        'success' => true,
        'tiene_privilegios_cliente' => $data['tiene_cliente'] > 0
    ];
}
?>
