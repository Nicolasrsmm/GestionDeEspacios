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

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || count($data) === 0) {
    echo json_encode(['success' => false, 'message' => 'No se recibieron datos']);
    exit;
}

try {
    $conn = getDBConnection();
    
    // Validar datos requeridos
    $camposRequeridos = ['rut_numero', 'rut_dv', 'nombre', 'apellido', 'telefono', 'direccion', 'region', 'ciudad', 'nombre_usuario', 'correo_electronico', 'contrasena'];
    foreach ($camposRequeridos as $campo) {
        if (!isset($data[$campo]) || empty(trim($data[$campo]))) {
            echo json_encode(['success' => false, 'message' => "El campo {$campo} es requerido"]);
            exit;
        }
    }
    
    $rut_numero = intval($data['rut_numero']);
    $rut_dv = strtoupper(trim($data['rut_dv']));
    $nombre = trim($data['nombre']);
    $apellido = trim($data['apellido']);
    $telefono = trim($data['telefono']);
    $direccion = trim($data['direccion']);
    $region = trim($data['region']);
    $ciudad = trim($data['ciudad']);
    $nombre_usuario = trim($data['nombre_usuario']);
    $correo_electronico = trim($data['correo_electronico']);
    $contrasena = $data['contrasena'];
    
    // Validar formato de email
    if (!filter_var($correo_electronico, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'El formato del email no es válido']);
        exit;
    }
    
    // Validar longitud de contraseña
    if (strlen($contrasena) < 8) {
        echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 8 caracteres']);
        exit;
    }
    
    // Obtener IDs de región y ciudad
    $id_region = null;
    $id_ciudad = null;
    
    if ($region) {
        $stmt = $conn->prepare("SELECT id_region FROM regiones WHERE nombre_region = ?");
        $stmt->bind_param('s', $region);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            $id_region = $result->fetch_assoc()['id_region'];
        }
        $stmt->close();
    }
    
    if ($ciudad && $id_region) {
        $stmt = $conn->prepare("SELECT id_ciudad FROM ciudades WHERE nombre_ciudad = ? AND id_region = ?");
        $stmt->bind_param('si', $ciudad, $id_region);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            $id_ciudad = $result->fetch_assoc()['id_ciudad'];
        }
        $stmt->close();
    }
    
    // Verificar si el nombre de usuario ya existe
    $stmt = $conn->prepare("SELECT id_credencial FROM credenciales WHERE nombre_usuario = ?");
    $stmt->bind_param('s', $nombre_usuario);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        $stmt->close();
        echo json_encode(['success' => false, 'message' => 'El nombre de usuario ya existe']);
        exit;
    }
    $stmt->close();
    
    // Verificar si el email ya existe
    $stmt = $conn->prepare("SELECT id_credencial FROM credenciales WHERE correo_electronico = ?");
    $stmt->bind_param('s', $correo_electronico);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        $stmt->close();
        echo json_encode(['success' => false, 'message' => 'El correo electrónico ya está registrado']);
        exit;
    }
    $stmt->close();
    
    // Verificar si el RUT ya existe
    $stmt = $conn->prepare("SELECT id_usuario FROM usuarios WHERE rut_numero = ? AND rut_dv = ?");
    $stmt->bind_param('is', $rut_numero, $rut_dv);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        $stmt->close();
        echo json_encode(['success' => false, 'message' => 'El RUT ya está registrado']);
        exit;
    }
    $stmt->close();
    
    // Obtener ID del rol AdminSistema
    $stmt = $conn->prepare("SELECT id_rol FROM roles WHERE nombre_rol = 'AdminSistema'");
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows === 0) {
        $stmt->close();
        echo json_encode(['success' => false, 'message' => 'Error: Rol AdminSistema no encontrado']);
        exit;
    }
    $id_rol_admin = $result->fetch_assoc()['id_rol'];
    $stmt->close();
    
    // Iniciar transacción
    $conn->autocommit(false);
    
    try {
        // Insertar usuario
        $stmt = $conn->prepare("INSERT INTO usuarios (rut_numero, rut_dv, nombre, apellido, telefono, id_region, id_ciudad, direccion, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)");
        $stmt->bind_param('issssiis', $rut_numero, $rut_dv, $nombre, $apellido, $telefono, $id_region, $id_ciudad, $direccion);
        
        if (!$stmt->execute()) {
            throw new Exception('Error al insertar usuario: ' . $stmt->error);
        }
        
        $id_usuario = $conn->insert_id;
        $stmt->close();
        
        // Hash de la contraseña
        $contrasena_hash = password_hash($contrasena, PASSWORD_DEFAULT);
        
        // Insertar credenciales
        $stmt = $conn->prepare("INSERT INTO credenciales (id_usuario, nombre_usuario, correo_electronico, contrasena_hash) VALUES (?, ?, ?, ?)");
        $stmt->bind_param('isss', $id_usuario, $nombre_usuario, $correo_electronico, $contrasena_hash);
        
        if (!$stmt->execute()) {
            throw new Exception('Error al insertar credenciales: ' . $stmt->error);
        }
        $stmt->close();
        
        // Asignar rol AdminSistema
        $stmt = $conn->prepare("INSERT INTO usuario_rol (id_usuario, id_rol, estado) VALUES (?, ?, 'Activo')");
        $stmt->bind_param('ii', $id_usuario, $id_rol_admin);
        
        if (!$stmt->execute()) {
            throw new Exception('Error al asignar rol: ' . $stmt->error);
        }
        $stmt->close();
        
        // Confirmar transacción
        $conn->commit();
        
        echo json_encode([
            'success' => true,
            'message' => "AdminSistema '{$nombre} {$apellido}' registrado exitosamente",
            'usuario_id' => $id_usuario
        ]);
        
    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error al registrar AdminSistema: ' . $e->getMessage()]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
