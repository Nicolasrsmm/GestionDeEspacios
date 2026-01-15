<?php
require_once __DIR__ . '/../config/db_config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        echo json_encode(['success' => false, 'message' => 'No se recibieron datos']);
        exit;
    }
    
    $action = $data['action'] ?? 'obtener';
    
    $conn = getDBConnection();
    
    switch ($action) {
        case 'obtener':
            obtenerPerfilColaborador($conn, $data);
            break;
        case 'actualizar_perfil':
            actualizarPerfilColaborador($conn, $data);
            break;
        case 'cambiar_contrasena':
            cambiarContrasenaColaborador($conn, $data);
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
    }
    
} catch (Exception $e) {
    error_log('Error en obtener_perfil_secretaria.php: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Error interno del servidor'
    ]);
}

function obtenerPerfilColaborador($conn, $data) {
    if (!isset($data['id_usuario'])) {
        echo json_encode(['success' => false, 'message' => 'ID de usuario requerido']);
        return;
    }
    
    $id_usuario = intval($data['id_usuario']);
    
    if ($id_usuario <= 0) {
        echo json_encode(['success' => false, 'message' => 'ID de usuario inválido']);
        return;
    }
    
    // Consultar los datos del usuario secretaria (esquema actualizado)
    $stmt = $conn->prepare("
        SELECT 
            u.id_usuario,
            c.nombre_usuario,
            u.nombre,
            u.apellido,
            CONCAT(u.rut_numero, '-', u.rut_dv) as rut,
            c.correo_electronico,
            u.telefono,
            reg.nombre_region AS region,
            ciu.nombre_ciudad AS ciudad,
            u.direccion,
            u.activo,
            u.fecha_creacion,
            r.nombre_rol
        FROM usuarios u
        JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario AND ur.estado = 'Activo'
        JOIN roles r ON ur.id_rol = r.id_rol
        JOIN credenciales c ON u.id_usuario = c.id_usuario
        LEFT JOIN regiones reg ON u.id_region = reg.id_region
        LEFT JOIN ciudades ciu ON u.id_ciudad = ciu.id_ciudad
        WHERE u.id_usuario = ? AND r.nombre_rol = 'Colaboradores' AND u.activo = 1
    ");
    
    $stmt->bind_param('i', $id_usuario);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $secretaria = $result->fetch_assoc();
        $stmt->close();
        
        echo json_encode([
            'success' => true,
            'secretaria' => $secretaria
        ]);
    } else {
        $stmt->close();
        echo json_encode([
            'success' => false,
            'message' => 'Colaborador no encontrada'
        ]);
    }
}

function actualizarPerfilColaborador($conn, $data) {
    // Validar campos requeridos
    $campos_requeridos = ['id_usuario', 'nombre_usuario', 'nombre', 'apellido', 'correo_electronico'];
    foreach ($campos_requeridos as $campo) {
        if (!isset($data[$campo]) || empty(trim($data[$campo]))) {
            echo json_encode(['success' => false, 'message' => "El campo {$campo} es requerido"]);
            return;
        }
    }

    $id_usuario = intval($data['id_usuario']);
    $nombre_usuario = trim($data['nombre_usuario']);
    $nombre = trim($data['nombre']);
    $apellido = trim($data['apellido']);
    $correo_electronico = trim($data['correo_electronico']);
    $telefono = trim($data['telefono'] ?? '');
    $regionNombre = trim($data['region'] ?? '');
    $ciudadNombre = trim($data['ciudad'] ?? '');
    $direccion = trim($data['direccion'] ?? '');

    if (!filter_var($correo_electronico, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Formato de email inválido']);
        return;
    }

    // Validaciones de unicidad en credenciales
    $stmt = $conn->prepare("SELECT id_usuario FROM credenciales WHERE nombre_usuario = ? AND id_usuario != ?");
    $stmt->bind_param('si', $nombre_usuario, $id_usuario);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        $stmt->close();
        echo json_encode(['success' => false, 'message' => 'El nombre de usuario ya está en uso']);
        return;
    }
    $stmt->close();

    $stmt = $conn->prepare("SELECT id_usuario FROM credenciales WHERE correo_electronico = ? AND id_usuario != ?");
    $stmt->bind_param('si', $correo_electronico, $id_usuario);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        $stmt->close();
        echo json_encode(['success' => false, 'message' => 'El email ya está en uso']);
        return;
    }
    $stmt->close();

    // Mapear región y ciudad (nombres -> IDs)
    $id_region = null;
    $id_ciudad = null;
    if (!empty($regionNombre)) {
        $stmt_reg = $conn->prepare("SELECT id_region FROM regiones WHERE nombre_region = ?");
        $stmt_reg->bind_param('s', $regionNombre);
        $stmt_reg->execute();
        $res_reg = $stmt_reg->get_result();
        if ($res_reg->num_rows > 0) {
            $id_region = (int)$res_reg->fetch_assoc()['id_region'];
            if (!empty($ciudadNombre)) {
                $stmt_ciu = $conn->prepare("SELECT id_ciudad FROM ciudades WHERE nombre_ciudad = ? AND id_region = ?");
                $stmt_ciu->bind_param('si', $ciudadNombre, $id_region);
                $stmt_ciu->execute();
                $res_ciu = $stmt_ciu->get_result();
                if ($res_ciu->num_rows > 0) {
                    $id_ciudad = (int)$res_ciu->fetch_assoc()['id_ciudad'];
                }
                $stmt_ciu->close();
            }
        }
        $stmt_reg->close();
    }

    // Actualizar en transacción usuarios + credenciales
    $conn->begin_transaction();
    try {
        // usuarios
        $stmt = $conn->prepare("UPDATE usuarios SET nombre = ?, apellido = ?, telefono = ?, id_region = ?, id_ciudad = ?, direccion = ? WHERE id_usuario = ?");
        if (!$stmt) {
            throw new Exception('Error preparando UPDATE usuarios: ' . $conn->error);
        }
        $stmt->bind_param('sssissi', $nombre, $apellido, $telefono, $id_region, $id_ciudad, $direccion, $id_usuario);
        if (!$stmt->execute()) {
            throw new Exception('Error actualizando usuarios: ' . $stmt->error);
        }
        $stmt->close();

        // credenciales
        $stmt = $conn->prepare("UPDATE credenciales SET nombre_usuario = ?, correo_electronico = ? WHERE id_usuario = ?");
        if (!$stmt) {
            throw new Exception('Error preparando UPDATE credenciales: ' . $conn->error);
        }
        $stmt->bind_param('ssi', $nombre_usuario, $correo_electronico, $id_usuario);
        if (!$stmt->execute()) {
            throw new Exception('Error actualizando credenciales: ' . $stmt->error);
        }
        $stmt->close();

        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Perfil actualizado correctamente']);
    } catch (Exception $e) {
        $conn->rollback();
        error_log('Error actualizarPerfilColaborador: ' . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
    }
}

function cambiarContrasenaColaborador($conn, $data) {
    // Validar campos requeridos
    $campos_requeridos = ['id_usuario', 'contrasena_actual', 'nueva_contrasena'];
    foreach ($campos_requeridos as $campo) {
        if (!isset($data[$campo]) || empty($data[$campo])) {
            echo json_encode(['success' => false, 'message' => "El campo {$campo} es requerido"]);
            return;
        }
    }
    
    $id_usuario = intval($data['id_usuario']);
    $contrasena_actual = $data['contrasena_actual'];
    $nueva_contrasena = $data['nueva_contrasena'];
    
    // Validar longitud de nueva contraseña
    if (strlen($nueva_contrasena) < 6) {
        echo json_encode(['success' => false, 'message' => 'La nueva contraseña debe tener al menos 6 caracteres']);
        return;
    }
    
    // Verificar contraseña actual
    $stmt = $conn->prepare("SELECT c.contrasena_hash FROM credenciales c WHERE c.id_usuario = ?");
    $stmt->bind_param('i', $id_usuario);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $stmt->close();
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
        return;
    }
    
    $credencial = $result->fetch_assoc();
    $stmt->close();
    
    if (!password_verify($contrasena_actual, $credencial['contrasena_hash'])) {
        echo json_encode(['success' => false, 'message' => 'La contraseña actual es incorrecta']);
        return;
    }
    
    // Actualizar contraseña
    $nueva_contrasena_hash = password_hash($nueva_contrasena, PASSWORD_ARGON2ID);
    
    $stmt = $conn->prepare("UPDATE credenciales SET contrasena_hash = ? WHERE id_usuario = ?");
    $stmt->bind_param('si', $nueva_contrasena_hash, $id_usuario);
    
    if ($stmt->execute()) {
        $stmt->close();
        echo json_encode(['success' => true, 'message' => 'Contraseña actualizada correctamente']);
    } else {
        $stmt->close();
        echo json_encode(['success' => false, 'message' => 'Error al actualizar la contraseña']);
    }
}
?>