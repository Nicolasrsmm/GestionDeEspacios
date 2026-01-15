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

if (empty($data['token']) || empty($data['id_usuario']) || empty($data['nueva_password'])) {
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit;
}

$token = trim($data['token']);
$id_usuario = intval($data['id_usuario']);
$nueva_password = $data['nueva_password'];

// Validar longitud de contraseña
if (strlen($nueva_password) < 8) {
    echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 8 caracteres']);
    exit;
}

$conn = getDBConnection();

// Verificar que el usuario existe y está activo
$stmt = $conn->prepare("SELECT u.id_usuario, u.nombre, u.apellido, c.contrasena_hash 
                        FROM usuarios u 
                        JOIN credenciales c ON u.id_usuario = c.id_usuario 
                        WHERE u.id_usuario = ? AND u.activo = 1");
$stmt->bind_param('i', $id_usuario);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    $stmt->close();
    $conn->close();
    echo json_encode(['success' => false, 'message' => 'Usuario no encontrado o inactivo']);
    exit;
}

$usuario = $result->fetch_assoc();
$stmt->close();

// Hash de la nueva contraseña
$nueva_password_hash = password_hash($nueva_password, PASSWORD_ARGON2ID);

// Actualizar contraseña
$stmt = $conn->prepare("UPDATE credenciales SET contrasena_hash = ? WHERE id_usuario = ?");
$stmt->bind_param('si', $nueva_password_hash, $id_usuario);

if ($stmt->execute()) {
    $stmt->close();
    $conn->close();
    echo json_encode(['success' => true, 'message' => 'Contraseña restablecida correctamente']);
} else {
    $stmt->close();
    $conn->close();
    echo json_encode(['success' => false, 'message' => 'Error al actualizar la contraseña: ' . $conn->error]);
}

