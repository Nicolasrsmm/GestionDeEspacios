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

// Verificar que sea una petición POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['id_usuario_excluir'])) {
    echo json_encode(['success' => false, 'message' => 'ID de usuario a excluir es requerido']);
    exit;
}

$id_usuario_excluir = intval($input['id_usuario_excluir']);

try {
    $conn = getDBConnection();
    
    // Consulta para obtener solo los usuarios AdminSistema, excluyendo al usuario logueado
    $stmt = $conn->prepare("
        SELECT 
            u.id_usuario,
            CONCAT(u.rut_numero, '-', u.rut_dv) as rut,
            u.nombre,
            u.apellido,
            u.telefono,
            u.direccion,
            u.fecha_creacion,
            u.activo,
            c.nombre_usuario,
            c.correo_electronico,
            r.nombre_rol,
            reg.nombre_region,
            ciu.nombre_ciudad,
            p.nombre_plan AS nombre_suscripcion
        FROM usuarios u
        JOIN credenciales c ON u.id_usuario = c.id_usuario
        JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario AND ur.estado = 'Activo'
        JOIN roles r ON ur.id_rol = r.id_rol
        LEFT JOIN regiones reg ON u.id_region = reg.id_region
        LEFT JOIN ciudades ciu ON u.id_ciudad = ciu.id_ciudad
        LEFT JOIN suscripciones s ON u.id_suscripcion = s.id_suscripcion
        LEFT JOIN planes p ON p.id_plan = s.id_plan
        WHERE u.id_usuario != ? AND u.activo = 1 AND r.nombre_rol = 'AdminSistema'
        ORDER BY u.nombre, u.apellido
    ");
    
    $stmt->bind_param('i', $id_usuario_excluir);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $usuarios = [];
    while ($row = $result->fetch_assoc()) {
        $usuarios[] = [
            'id_usuario' => $row['id_usuario'],
            'rut' => $row['rut'],
            'nombre' => $row['nombre'],
            'apellido' => $row['apellido'],
            'nombre_completo' => $row['nombre'] . ' ' . $row['apellido'],
            'telefono' => $row['telefono'],
            'direccion' => $row['direccion'],
            'fecha_creacion' => $row['fecha_creacion'],
            'activo' => $row['activo'],
            'nombre_usuario' => $row['nombre_usuario'],
            'correo_electronico' => $row['correo_electronico'],
            'rol' => $row['nombre_rol'],
            'region' => $row['nombre_region'],
            'ciudad' => $row['nombre_ciudad'],
            'suscripcion' => $row['nombre_suscripcion'],
            'iniciales' => strtoupper(substr($row['nombre'], 0, 1) . substr($row['apellido'], 0, 1))
        ];
    }
    
    $stmt->close();
    $conn->close();
    
    echo json_encode([
        'success' => true,
        'usuarios' => $usuarios,
        'total' => count($usuarios)
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener usuarios: ' . $e->getMessage()
    ]);
}
?>
