<?php
require_once __DIR__ . '/../config/db_config.php';

header('Content-Type: application/json; charset=utf-8');

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['action'])) {
    echo json_encode(['success' => false, 'message' => 'Acción no especificada.']);
    exit;
}

$conn = getDBConnection();

if ($data['action'] === 'actualizar_perfil') {
    actualizarPerfil($conn, $data);
} elseif ($data['action'] === 'cambiar_contrasena') {
    cambiarContrasena($conn, $data);
} else {
    echo json_encode(['success' => false, 'message' => 'Acción no válida.']);
}

$conn->close();

function actualizarPerfil($conn, $data) {
    // Validar campos requeridos
    if (!isset($data['id_usuario']) || !isset($data['nombre_usuario']) || !isset($data['nombre']) || 
        !isset($data['apellido']) || !isset($data['correo_electronico']) || !isset($data['telefono'])) {
        echo json_encode(['success' => false, 'message' => 'Faltan campos requeridos.']);
        return;
    }
    
    $id_usuario = $data['id_usuario'];
    $nombre_usuario = trim($data['nombre_usuario']);
    $nombre = trim($data['nombre']);
    $apellido = trim($data['apellido']);
    $correo_electronico = trim($data['correo_electronico']);
    $telefono = trim($data['telefono']);
    $region = isset($data['region']) ? trim($data['region']) : '';
    $ciudad = isset($data['ciudad']) ? trim($data['ciudad']) : '';
    $direccion = isset($data['direccion']) ? trim($data['direccion']) : '';
    
    // Asegurar que la dirección no sea una cadena vacía
    $direccion = ($direccion === '' || $direccion === null) ? null : $direccion;
    
    // Validar formato de email
    if (!filter_var($correo_electronico, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Formato de email inválido.']);
        return;
    }
    
    // Verificar si el nombre de usuario ya existe en otros usuarios
    $stmt = $conn->prepare("SELECT id_usuario FROM credenciales WHERE nombre_usuario = ? AND id_usuario != ?");
    $stmt->bind_param('si', $nombre_usuario, $id_usuario);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'El nombre de usuario ya está en uso.']);
        $stmt->close();
        return;
    }
    $stmt->close();
    
    // Verificar si el email ya existe en otros usuarios
    $stmt = $conn->prepare("SELECT id_usuario FROM credenciales WHERE correo_electronico = ? AND id_usuario != ?");
    $stmt->bind_param('si', $correo_electronico, $id_usuario);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'El email ya está en uso.']);
        $stmt->close();
        return;
    }
    $stmt->close();
    
    $conn->begin_transaction();
    
    try {
        // Obtener IDs de región y ciudad
        $id_region = null;
        $id_ciudad = null;
        
        if (!empty($region)) {
            $id_region = obtenerIdRegion($conn, $region);
            
            if ($id_region && !empty($ciudad)) {
                $id_ciudad = obtenerIdCiudad($conn, $ciudad, $id_region);
            }
        }
        
        // Debug: Log de la dirección recibida
        error_log("Dirección recibida en actualización cliente: " . var_export($direccion, true));
        
        // Actualizar datos en tabla usuarios
        $stmt = $conn->prepare("UPDATE usuarios SET nombre = ?, apellido = ?, telefono = ?, id_region = ?, id_ciudad = ?, direccion = ? WHERE id_usuario = ?");
        $stmt->bind_param('sssiisi', $nombre, $apellido, $telefono, $id_region, $id_ciudad, $direccion, $id_usuario);
        
        if (!$stmt->execute()) {
            throw new Exception('Error al actualizar datos de usuario: ' . $stmt->error);
        }
        $stmt->close();
        
        // Actualizar credenciales
        $stmt = $conn->prepare("UPDATE credenciales SET nombre_usuario = ?, correo_electronico = ? WHERE id_usuario = ?");
        $stmt->bind_param('ssi', $nombre_usuario, $correo_electronico, $id_usuario);
        
        if (!$stmt->execute()) {
            throw new Exception('Error al actualizar credenciales: ' . $stmt->error);
        }
        $stmt->close();
        
        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Perfil actualizado correctamente']);
        
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'Error al actualizar perfil: ' . $e->getMessage()]);
    }
}

// Función para obtener ID de región por nombre
function obtenerIdRegion($conn, $nombre_region) {
    if (empty($nombre_region)) return null;
    
    $stmt = $conn->prepare("SELECT id_region FROM regiones WHERE nombre_region = ?");
    $stmt->bind_param('s', $nombre_region);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $region = $result->fetch_assoc();
        $stmt->close();
        return $region['id_region'];
    }
    
    $stmt->close();
    return null;
}

// Función para obtener ID de ciudad por nombre y región
function obtenerIdCiudad($conn, $nombre_ciudad, $id_region) {
    if (empty($nombre_ciudad) || empty($id_region)) return null;
    
    $stmt = $conn->prepare("SELECT id_ciudad FROM ciudades WHERE nombre_ciudad = ? AND id_region = ?");
    $stmt->bind_param('si', $nombre_ciudad, $id_region);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $ciudad = $result->fetch_assoc();
        $stmt->close();
        return $ciudad['id_ciudad'];
    }
    
    $stmt->close();
    return null;
}

function cambiarContrasena($conn, $data) {
    // Validar campos requeridos
    if (!isset($data['id_usuario']) || !isset($data['contrasena_actual']) || !isset($data['nueva_contrasena'])) {
        echo json_encode(['success' => false, 'message' => 'Faltan campos requeridos.']);
        return;
    }
    
    $id_usuario = $data['id_usuario'];
    $contrasena_actual = $data['contrasena_actual'];
    $nueva_contrasena = $data['nueva_contrasena'];
    
    // Obtener contraseña actual del usuario
    $stmt = $conn->prepare("SELECT c.contrasena_hash FROM credenciales c WHERE c.id_usuario = ?");
    $stmt->bind_param('i', $id_usuario);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado.']);
        $stmt->close();
        return;
    }
    
    $credencial = $result->fetch_assoc();
    $stmt->close();
    
    // Verificar contraseña actual
    if (!password_verify($contrasena_actual, $credencial['contrasena_hash'])) {
        echo json_encode(['success' => false, 'message' => 'Contraseña actual incorrecta.']);
        return;
    }
    
    // Hash de la nueva contraseña
    $nueva_contrasena_hash = password_hash($nueva_contrasena, PASSWORD_ARGON2ID);
    
    // Actualizar contraseña
    $stmt = $conn->prepare("UPDATE credenciales SET contrasena_hash = ? WHERE id_usuario = ?");
    $stmt->bind_param('si', $nueva_contrasena_hash, $id_usuario);
    
    if ($stmt->execute()) {
        $stmt->close();
        echo json_encode(['success' => true, 'message' => 'Contraseña actualizada correctamente']);
    } else {
        $stmt->close();
        echo json_encode(['success' => false, 'message' => 'Error al actualizar contraseña: ' . $conn->error]);
    }
}

function handleMySQLError($error, $conn) {
    if ($conn->errno === 1062) {
        return ['success' => false, 'message' => 'El email o nombre de usuario ya está en uso.'];
    } else {
        return ['success' => false, 'message' => 'Error de base de datos: ' . $error];
    }
}
?>