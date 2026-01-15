<?php
require_once __DIR__ . '/../config/db_config.php';

header('Content-Type: application/json; charset=utf-8');

// Función para manejar errores de MySQL
function handleMySQLError($error, $conn) {
    $conn->close();
    return ['success' => false, 'message' => 'Error de base de datos: ' . $error];
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

// Función para actualizar perfil de usuario
function actualizarPerfil($conn, $id_usuario, $nombre_usuario, $nombre, $apellido, $correo_electronico, $telefono, $region, $ciudad, $direccion) {
    // Asegurar que la dirección no sea una cadena vacía
    $direccion = ($direccion === '' || $direccion === null) ? null : $direccion;
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
        error_log("Dirección recibida en actualización: " . var_export($direccion, true));
        
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
        return ['success' => true, 'message' => 'Perfil actualizado correctamente'];
        
    } catch (Exception $e) {
        $conn->rollback();
        return ['success' => false, 'message' => 'Error al actualizar perfil: ' . $e->getMessage()];
    }
}

// Función para cambiar contraseña
function cambiarContrasena($conn, $id_usuario, $contrasena_actual, $nueva_contrasena) {
    // Primero verificar la contraseña actual
    $stmt = $conn->prepare("SELECT c.contrasena_hash FROM credenciales c WHERE c.id_usuario = ?");
    $stmt->bind_param('i', $id_usuario);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $stmt->close();
        return ['success' => false, 'message' => 'Usuario no encontrado'];
    }
    
    $credencial = $result->fetch_assoc();
    $stmt->close();
    
    // Verificar contraseña actual
    if (!password_verify($contrasena_actual, $credencial['contrasena_hash'])) {
        return ['success' => false, 'message' => 'La contraseña actual es incorrecta'];
    }
    
    // Validar nueva contraseña
    if (strlen($nueva_contrasena) < 8) {
        return ['success' => false, 'message' => 'La nueva contraseña debe tener al menos 8 caracteres'];
    }
    
    // Hash de la nueva contraseña
    $nueva_contrasena_hash = password_hash($nueva_contrasena, PASSWORD_ARGON2ID);
    
    // Actualizar contraseña
    $stmt = $conn->prepare("UPDATE credenciales SET contrasena_hash = ? WHERE id_usuario = ?");
    $stmt->bind_param('si', $nueva_contrasena_hash, $id_usuario);
    
    if ($stmt->execute()) {
        $stmt->close();
        return ['success' => true, 'message' => 'Contraseña actualizada correctamente'];
    } else {
        $stmt->close();
        return handleMySQLError($stmt->error, $conn);
    }
}

// Manejar diferentes métodos HTTP
$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents('php://input'), true);

$conn = getDBConnection();

if ($method === 'POST' && isset($data['action'])) {
    if ($data['action'] === 'actualizar_perfil') {
        if (isset($data['id_usuario'], $data['nombre_usuario'], $data['nombre'], $data['apellido'], $data['correo_electronico'], $data['telefono'], $data['region'], $data['ciudad'], $data['direccion'])) {
            echo json_encode(actualizarPerfil($conn, $data['id_usuario'], $data['nombre_usuario'], $data['nombre'], $data['apellido'], $data['correo_electronico'], $data['telefono'], $data['region'], $data['ciudad'], $data['direccion']));
        } else {
            echo json_encode(['success' => false, 'message' => 'Faltan parámetros para actualizar perfil']);
        }
    } elseif ($data['action'] === 'cambiar_contrasena') {
        if (isset($data['id_usuario'], $data['contrasena_actual'], $data['nueva_contrasena'])) {
            echo json_encode(cambiarContrasena($conn, $data['id_usuario'], $data['contrasena_actual'], $data['nueva_contrasena']));
        } else {
            echo json_encode(['success' => false, 'message' => 'Faltan parámetros para cambiar contraseña']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Acción no válida']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Método no soportado']);
}

$conn->close();
?>