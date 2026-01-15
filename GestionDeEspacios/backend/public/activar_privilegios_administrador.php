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

if (!isset($data['id_usuario'])) {
    echo json_encode(['success' => false, 'message' => 'ID de usuario requerido']);
    exit;
}

try {
    $conn = getDBConnection();
    $id_usuario = $data['id_usuario'];
    
    // Iniciar transacción
    $conn->autocommit(false);
    
    try {
        // Verificar que el usuario existe y está activo
        $stmt = $conn->prepare("
            SELECT u.id_usuario, u.nombre, u.apellido, u.activo, c.nombre_usuario 
            FROM usuarios u 
            LEFT JOIN credenciales c ON u.id_usuario = c.id_usuario 
            WHERE u.id_usuario = ? AND u.activo = 1
        ");
        $stmt->bind_param('i', $id_usuario);
        $stmt->execute();
        $result = $stmt->get_result();
        $usuario = $result->fetch_assoc();
        
        if (!$usuario) {
            throw new Exception('Usuario no encontrado o inactivo');
        }
        
        // Verificar que el usuario es un Cliente
        $stmt = $conn->prepare("
            SELECT r.nombre_rol 
            FROM usuario_rol ur 
            JOIN roles r ON ur.id_rol = r.id_rol 
            WHERE ur.id_usuario = ? AND ur.estado = 'Activo'
        ");
        $stmt->bind_param('i', $id_usuario);
        $stmt->execute();
        $result = $stmt->get_result();
        $roles_actuales = $result->fetch_all(MYSQLI_ASSOC);
        
        $es_cliente = false;
        $ya_es_administrador = false;
        
        foreach ($roles_actuales as $rol) {
            if ($rol['nombre_rol'] === 'Cliente') {
                $es_cliente = true;
            }
            if ($rol['nombre_rol'] === 'Administrador') {
                $ya_es_administrador = true;
            }
        }
        
        if (!$es_cliente) {
            throw new Exception('El usuario debe tener rol de Cliente para activar privilegios de administrador');
        }
        
        if ($ya_es_administrador) {
            throw new Exception('El usuario ya tiene privilegios de administrador');
        }
        
        // Obtener ID del rol Administrador
        $stmt = $conn->prepare("SELECT id_rol FROM roles WHERE nombre_rol = 'Administrador'");
        $stmt->execute();
        $result = $stmt->get_result();
        $rol_admin = $result->fetch_assoc();
        
        if (!$rol_admin) {
            throw new Exception('Rol de Administrador no encontrado en el sistema');
        }
        
        $id_rol_admin = $rol_admin['id_rol'];
        
        // Insertar nuevo rol de Administrador
        $stmt = $conn->prepare("
            INSERT INTO usuario_rol (id_usuario, id_rol, estado) 
            VALUES (?, ?, 'Activo')
        ");
        $stmt->bind_param('ii', $id_usuario, $id_rol_admin);
        $stmt->execute();
        $stmt->close();

        // Si no tiene suscripción, crear por defecto (plan Básica id=1) y enlazar
        $stmt = $conn->prepare("SELECT id_suscripcion FROM usuarios WHERE id_usuario = ? FOR UPDATE");
        $stmt->bind_param('i', $id_usuario);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res->fetch_assoc();
        $stmt->close();

        if (!$row || !$row['id_suscripcion']) {
            $fecha_inicio = date('Y-m-d');
            $fecha_fin = date('Y-m-d', strtotime('+30 days'));
            $plan_por_defecto = 1;
            $stmt = $conn->prepare("INSERT INTO suscripciones (id_usuario, id_plan, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?)");
            $stmt->bind_param('iiss', $id_usuario, $plan_por_defecto, $fecha_inicio, $fecha_fin);
            if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al crear suscripción por defecto: ' . $err); }
            $id_suscripcion = $conn->insert_id;
            $stmt->close();
            $stmt = $conn->prepare("UPDATE usuarios SET id_suscripcion = ? WHERE id_usuario = ?");
            $stmt->bind_param('ii', $id_suscripcion, $id_usuario);
            if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al enlazar suscripción por defecto: ' . $err); }
            $stmt->close();
        }
        
        // Obtener información actualizada del usuario con todos sus roles
        $stmt = $conn->prepare("
            SELECT u.*, c.nombre_usuario, c.correo_electronico,
                   GROUP_CONCAT(r.nombre_rol) as roles
            FROM usuarios u 
            LEFT JOIN credenciales c ON u.id_usuario = c.id_usuario 
            LEFT JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario AND ur.estado = 'Activo'
            LEFT JOIN roles r ON ur.id_rol = r.id_rol
            WHERE u.id_usuario = ?
            GROUP BY u.id_usuario
        ");
        $stmt->bind_param('i', $id_usuario);
        $stmt->execute();
        $result = $stmt->get_result();
        $usuario_actualizado = $result->fetch_assoc();
        
        // Convertir roles a array
        if ($usuario_actualizado['roles']) {
            $usuario_actualizado['roles'] = explode(',', $usuario_actualizado['roles']);
        } else {
            $usuario_actualizado['roles'] = [];
        }
        
        // Confirmar transacción
        $conn->commit();
        
        // Respuesta exitosa
        echo json_encode([
            'success' => true,
            'message' => 'Privilegios de administrador activados exitosamente',
            'usuario_actualizado' => $usuario_actualizado
        ]);
        
    } catch (Exception $e) {
        // Rollback en caso de error
        $conn->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("Error en activar_privilegios_administrador.php: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
