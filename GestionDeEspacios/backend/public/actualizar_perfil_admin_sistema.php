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

function handleMySQLError($error_message, $conn) {
    if (strpos($error_message, 'Duplicate entry') !== false) {
        if (strpos($error_message, 'nombre_usuario_UNIQUE') !== false) {
            return ['success' => false, 'message' => 'El nombre de usuario ya está en uso.'];
        }
        if (strpos($error_message, 'correo_electronico_UNIQUE') !== false) {
            return ['success' => false, 'message' => 'El correo electrónico ya está registrado.'];
        }
    }
    return ['success' => false, 'message' => 'Error en la base de datos: ' . $error_message];
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['action'])) {
    echo json_encode(['success' => false, 'message' => 'Acción no especificada.']);
    exit;
}

$conn = getDBConnection();

switch ($data['action']) {
    case 'actualizar_perfil':
        echo json_encode(actualizarPerfil($conn, $data['id_usuario'], $data['nombre_usuario'], $data['nombre'], $data['apellido'], $data['correo_electronico'], $data['telefono'], $data['region'], $data['ciudad'], $data['direccion']));
        break;
    case 'cambiar_contrasena':
        echo json_encode(cambiarContrasena($conn, $data['id_usuario'], $data['contrasena_actual'], $data['nueva_contrasena']));
        break;
    case 'actualizar_adminsistema':
        echo json_encode(actualizarAdminSistema($conn, $data));
        break;
    case 'eliminar_adminsistema':
        echo json_encode(eliminarAdminSistema($conn, $data));
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Acción no válida.']);
        break;
}

$conn->close();

function actualizarPerfil($conn, $id_usuario, $nombre_usuario, $nombre, $apellido, $correo_electronico, $telefono, $region, $ciudad, $direccion) {
    $stmt = $conn->prepare("UPDATE usuarios SET nombre_usuario = ?, nombre = ?, apellido = ?, correo_electronico = ?, telefono = ?, region = ?, ciudad = ?, direccion = ? WHERE id_usuario = ?");
    $stmt->bind_param('ssssssssi', $nombre_usuario, $nombre, $apellido, $correo_electronico, $telefono, $region, $ciudad, $direccion, $id_usuario);
    
    if ($stmt->execute()) {
        $stmt->close();
        return ['success' => true, 'message' => 'Perfil actualizado correctamente'];
    } else {
        $stmt->close();
        return handleMySQLError($stmt->error, $conn);
    }
}

function cambiarContrasena($conn, $id_usuario, $contrasena_actual, $nueva_contrasena) {
    // Primero, verificar la contraseña actual
    $stmt = $conn->prepare("SELECT c.contrasena_hash FROM credenciales c WHERE c.id_usuario = ?");
    $stmt->bind_param('i', $id_usuario);
    $stmt->execute();
    $result = $stmt->get_result();
    $credencial = $result->fetch_assoc();
    $stmt->close();

    if (!$credencial || !password_verify($contrasena_actual, $credencial['contrasena_hash'])) {
        return ['success' => false, 'message' => 'Contraseña actual incorrecta.'];
    }

    // Hashear la nueva contraseña
    $nueva_contrasena_hash = password_hash($nueva_contrasena, PASSWORD_ARGON2ID);

    // Actualizar la contraseña en la base de datos
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

function actualizarAdminSistema($conn, $data) {
    // Validar datos requeridos
    $required_fields = ['id_usuario', 'nombre_usuario', 'rut_numero', 'rut_dv', 'nombre', 'apellido', 'correo_electronico', 'telefono', 'region', 'ciudad', 'direccion'];
    foreach ($required_fields as $field) {
        if (empty($data[$field])) {
            return ['success' => false, 'message' => "El campo $field es requerido"];
        }
    }

    $id_usuario = $data['id_usuario'];
    $nombre_usuario = trim($data['nombre_usuario']);
    $rut_numero = intval($data['rut_numero']);
    $rut_dv = strtoupper(trim($data['rut_dv']));
    $nombre = trim($data['nombre']);
    $apellido = trim($data['apellido']);
    $correo_electronico = trim($data['correo_electronico']);
    $telefono = trim($data['telefono']);
    $region = trim($data['region']);
    $ciudad = trim($data['ciudad']);
    $direccion = trim($data['direccion']);

    // Validar formato de email
    if (!filter_var($correo_electronico, FILTER_VALIDATE_EMAIL)) {
        return ['success' => false, 'message' => 'Formato de correo electrónico inválido'];
    }

    // Validar que el usuario existe y es AdminSistema
    $stmt = $conn->prepare("
        SELECT u.id_usuario 
        FROM usuarios u
        JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario AND ur.estado = 'Activo'
        JOIN roles r ON ur.id_rol = r.id_rol
        WHERE u.id_usuario = ? AND r.nombre_rol = 'AdminSistema'
    ");
    $stmt->bind_param('i', $id_usuario);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows == 0) {
        $stmt->close();
        return ['success' => false, 'message' => 'AdminSistema no encontrado'];
    }
    $stmt->close();

    // Validar unicidad de nombre_usuario (excluyendo el usuario actual)
    $stmt = $conn->prepare("SELECT COUNT(*) FROM credenciales WHERE nombre_usuario = ? AND id_usuario != ?");
    $stmt->bind_param('si', $nombre_usuario, $id_usuario);
    $stmt->execute();
    $count = $stmt->get_result()->fetch_row()[0];
    $stmt->close();
    if ($count > 0) {
        return ['success' => false, 'message' => 'El nombre de usuario ya está en uso'];
    }

    // Validar unicidad de correo electrónico (excluyendo el usuario actual)
    $stmt = $conn->prepare("SELECT COUNT(*) FROM credenciales WHERE correo_electronico = ? AND id_usuario != ?");
    $stmt->bind_param('si', $correo_electronico, $id_usuario);
    $stmt->execute();
    $count = $stmt->get_result()->fetch_row()[0];
    $stmt->close();
    if ($count > 0) {
        return ['success' => false, 'message' => 'El correo electrónico ya está registrado'];
    }

    // Validar unicidad de RUT (excluyendo el usuario actual)
    $stmt = $conn->prepare("SELECT COUNT(*) FROM usuarios WHERE rut_numero = ? AND rut_dv = ? AND id_usuario != ?");
    $stmt->bind_param('isi', $rut_numero, $rut_dv, $id_usuario);
    $stmt->execute();
    $count = $stmt->get_result()->fetch_row()[0];
    $stmt->close();
    if ($count > 0) {
        return ['success' => false, 'message' => 'El RUT ya está registrado'];
    }

    // Obtener IDs de región y ciudad
    $id_region = null;
    $id_ciudad = null;
    
    $stmt = $conn->prepare("SELECT id_region FROM regiones WHERE nombre_region = ?");
    $stmt->bind_param('s', $region);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        $id_region = $result->fetch_assoc()['id_region'];
    }
    $stmt->close();

    if ($id_region && !empty($ciudad)) {
        $stmt = $conn->prepare("SELECT id_ciudad FROM ciudades WHERE nombre_ciudad = ? AND id_region = ?");
        $stmt->bind_param('si', $ciudad, $id_region);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            $id_ciudad = $result->fetch_assoc()['id_ciudad'];
        }
        $stmt->close();
    }

    // Iniciar transacción
    $conn->begin_transaction();

    try {
        // Actualizar datos en tabla usuarios
        $stmt = $conn->prepare("UPDATE usuarios SET rut_numero = ?, rut_dv = ?, nombre = ?, apellido = ?, telefono = ?, id_region = ?, id_ciudad = ?, direccion = ? WHERE id_usuario = ?");
        $stmt->bind_param('issssiisi', $rut_numero, $rut_dv, $nombre, $apellido, $telefono, $id_region, $id_ciudad, $direccion, $id_usuario);
        
        if (!$stmt->execute()) {
            throw new Exception("Error actualizando usuario: " . $stmt->error);
        }
        $stmt->close();

        // Actualizar credenciales
        $stmt = $conn->prepare("UPDATE credenciales SET nombre_usuario = ?, correo_electronico = ? WHERE id_usuario = ?");
        $stmt->bind_param('ssi', $nombre_usuario, $correo_electronico, $id_usuario);
        
        if (!$stmt->execute()) {
            throw new Exception("Error actualizando credenciales: " . $stmt->error);
        }
        $stmt->close();

        // Actualizar contraseña si se proporcionó
        if (!empty($data['contrasena'])) {
            $contrasena_hash = password_hash($data['contrasena'], PASSWORD_ARGON2ID);
            $stmt = $conn->prepare("UPDATE credenciales SET contrasena_hash = ? WHERE id_usuario = ?");
            $stmt->bind_param('si', $contrasena_hash, $id_usuario);
            
            if (!$stmt->execute()) {
                throw new Exception("Error actualizando contraseña: " . $stmt->error);
            }
            $stmt->close();
        }

        // Confirmar transacción
        $conn->commit();
        
        return ['success' => true, 'message' => 'AdminSistema actualizado correctamente'];

    } catch (Exception $e) {
        // Revertir transacción
        $conn->rollback();
        return ['success' => false, 'message' => 'Error al actualizar AdminSistema: ' . $e->getMessage()];
    }
}

function eliminarAdminSistema($conn, $data) {
    // Validar datos requeridos
    if (empty($data['id_usuario'])) {
        return ['success' => false, 'message' => 'ID de usuario requerido'];
    }

    $id_usuario = $data['id_usuario'];

    // Validar que el usuario existe y es AdminSistema
    $stmt = $conn->prepare("
        SELECT u.id_usuario, u.nombre, u.apellido, u.id_suscripcion
        FROM usuarios u
        JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario AND ur.estado = 'Activo'
        JOIN roles r ON ur.id_rol = r.id_rol
        WHERE u.id_usuario = ? AND r.nombre_rol = 'AdminSistema'
    ");
    $stmt->bind_param('i', $id_usuario);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows == 0) {
        $stmt->close();
        return ['success' => false, 'message' => 'AdminSistema no encontrado'];
    }
    
    $usuario = $result->fetch_assoc();
    $id_suscripcion = $usuario['id_suscripcion'];
    $stmt->close();

    // Iniciar transacción
    $conn->begin_transaction();

    try {
        // 1) Eliminar pagos asociados a las suscripciones del usuario (ANTES de eliminar suscripciones)
        if ($id_suscripcion) {
            $stmt = $conn->prepare('DELETE FROM pagos WHERE id_suscripcion = ?');
            $stmt->bind_param('i', $id_suscripcion);
            if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar pagos: ' . $err); }
            $stmt->close();
        }

        // Obtener todas las suscripciones del usuario
        $stmt = $conn->prepare('SELECT id_suscripcion FROM suscripciones WHERE id_usuario = ?');
        $stmt->bind_param('i', $id_usuario);
        $stmt->execute();
        $res = $stmt->get_result();
        $suscripciones = [];
        while ($row = $res->fetch_assoc()) {
            $suscripciones[] = $row['id_suscripcion'];
        }
        $stmt->close();

        // Eliminar pagos de todas las suscripciones del usuario
        if (!empty($suscripciones)) {
            $placeholders = implode(',', array_fill(0, count($suscripciones), '?'));
            $stmt = $conn->prepare("DELETE FROM pagos WHERE id_suscripcion IN ($placeholders)");
            $types = str_repeat('i', count($suscripciones));
            $stmt->bind_param($types, ...$suscripciones);
            if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar pagos de suscripciones: ' . $err); }
            $stmt->close();
        }

        // 2) Eliminar asignaciones de espacios del cliente y sus dependencias (si tiene rol Cliente también)
        $stmt = $conn->prepare('SELECT id_asignacion FROM asignacion_espacio_cliente WHERE id_usuario = ?');
        $stmt->bind_param('i', $id_usuario);
        $stmt->execute();
        $res = $stmt->get_result();
        $asignaciones = [];
        while ($row = $res->fetch_assoc()) {
            $asignaciones[] = $row['id_asignacion'];
        }
        $stmt->close();

        if (!empty($asignaciones)) {
            $placeholders = implode(',', array_fill(0, count($asignaciones), '?'));
            $types = str_repeat('i', count($asignaciones));
            
            // Eliminar mensajes de asignación
            $stmt = $conn->prepare("DELETE FROM mensajesasignacion WHERE id_asignacion IN ($placeholders)");
            $stmt->bind_param($types, ...$asignaciones);
            if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar mensajes de asignación: ' . $err); }
            $stmt->close();

            // Eliminar reportes de asignación
            $stmt = $conn->prepare("DELETE FROM envioreportes WHERE id_asignacion IN ($placeholders)");
            $stmt->bind_param($types, ...$asignaciones);
            if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar reportes: ' . $err); }
            $stmt->close();

            // Eliminar solicitudes de cambio de horario
            $stmt = $conn->prepare("DELETE FROM solicitud_cambio_horario WHERE id_asignacion IN ($placeholders)");
            $stmt->bind_param($types, ...$asignaciones);
            if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar solicitudes de cambio de horario: ' . $err); }
            $stmt->close();

            // Eliminar asignaciones
            $stmt = $conn->prepare("DELETE FROM asignacion_espacio_cliente WHERE id_asignacion IN ($placeholders)");
            $stmt->bind_param($types, ...$asignaciones);
            if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar asignaciones: ' . $err); }
            $stmt->close();
        }

        // 3) Eliminar calificaciones del usuario
        $stmt = $conn->prepare('DELETE FROM calificacionadministrador WHERE id_usuario_cliente = ?');
        $stmt->bind_param('i', $id_usuario);
        if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar calificaciones de administrador: ' . $err); }
        $stmt->close();

        $stmt = $conn->prepare('DELETE FROM calificacionespacio WHERE id_usuario_cliente = ?');
        $stmt->bind_param('i', $id_usuario);
        if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar calificaciones de espacios: ' . $err); }
        $stmt->close();

        // 4) Eliminar mensajes de consulta
        $stmt = $conn->prepare('DELETE FROM mensajesconsulta WHERE id_emisor = ? OR id_receptor = ?');
        $stmt->bind_param('ii', $id_usuario, $id_usuario);
        if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar mensajes de consulta: ' . $err); }
        $stmt->close();

        // 5) Romper referencias hacia este usuario
        $stmt = $conn->prepare('UPDATE usuarios SET id_administrador_asociado = NULL WHERE id_administrador_asociado = ?');
        $stmt->bind_param('i', $id_usuario);
        if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al limpiar asociaciones: ' . $err); }
        $stmt->close();

        // 6) Eliminar espacios gestionados por el usuario (si es administrador también)
        $stmt = $conn->prepare('SELECT id_espacio FROM gestiondeespacio WHERE id_usuario = ?');
        $stmt->bind_param('i', $id_usuario);
        $stmt->execute();
        $res = $stmt->get_result();
        $espacios = [];
        while ($row = $res->fetch_assoc()) {
            $espacios[] = $row['id_espacio'];
        }
        $stmt->close();

        if (!empty($espacios)) {
            $placeholders = implode(',', array_fill(0, count($espacios), '?'));
            $types = str_repeat('i', count($espacios));
            
            // Obtener URLs de fotos para eliminarlas físicamente
            $stmt = $conn->prepare("SELECT url_imagen FROM fotos_publicacion WHERE id_espacio IN ($placeholders)");
            $stmt->bind_param($types, ...$espacios);
            $stmt->execute();
            $res = $stmt->get_result();
            while ($row = $res->fetch_assoc()) {
                $ruta = '../../' . $row['url_imagen'];
                if (file_exists($ruta)) {
                    @unlink($ruta);
                }
            }
            $stmt->close();

            // Eliminar registros de fotos
            $stmt = $conn->prepare("DELETE FROM fotos_publicacion WHERE id_espacio IN ($placeholders)");
            $stmt->bind_param($types, ...$espacios);
            if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar fotos: ' . $err); }
            $stmt->close();

            // Eliminar equipamiento
            $stmt = $conn->prepare("DELETE FROM equipamiento WHERE id_espacio IN ($placeholders)");
            $stmt->bind_param($types, ...$espacios);
            if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar equipamiento: ' . $err); }
            $stmt->close();

            // Eliminar horarios
            $stmt = $conn->prepare("DELETE FROM horario_espacios WHERE id_espacio IN ($placeholders)");
            $stmt->bind_param($types, ...$espacios);
            if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar horarios: ' . $err); }
            $stmt->close();

            // Eliminar espacios
            $stmt = $conn->prepare("DELETE FROM gestiondeespacio WHERE id_espacio IN ($placeholders)");
            $stmt->bind_param($types, ...$espacios);
            if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar espacios: ' . $err); }
            $stmt->close();
        }

        // 7) Eliminar publicaciones de arriendo del usuario
        $stmt = $conn->prepare('SELECT id_publicacion FROM publicararriendo WHERE id_usuario = ?');
        $stmt->bind_param('i', $id_usuario);
        $stmt->execute();
        $res = $stmt->get_result();
        $publicaciones = [];
        while ($row = $res->fetch_assoc()) {
            $publicaciones[] = $row['id_publicacion'];
        }
        $stmt->close();

        if (!empty($publicaciones)) {
            $placeholders = implode(',', array_fill(0, count($publicaciones), '?'));
            $types = str_repeat('i', count($publicaciones));
            
            // Eliminar calificaciones de publicaciones
            $stmt = $conn->prepare("DELETE FROM calificacionespacio WHERE id_publicacion IN ($placeholders)");
            $stmt->bind_param($types, ...$publicaciones);
            if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar calificaciones de publicaciones: ' . $err); }
            $stmt->close();

            // Eliminar mensajes de consulta de publicaciones
            $stmt = $conn->prepare("DELETE FROM mensajesconsulta WHERE id_publicacion IN ($placeholders)");
            $stmt->bind_param($types, ...$publicaciones);
            if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar mensajes de consulta de publicaciones: ' . $err); }
            $stmt->close();

            // Eliminar fotos de publicaciones
            $stmt = $conn->prepare("SELECT url_imagen FROM fotos_publicacion WHERE id_publicacion IN ($placeholders)");
            $stmt->bind_param($types, ...$publicaciones);
            $stmt->execute();
            $res = $stmt->get_result();
            while ($row = $res->fetch_assoc()) {
                $ruta = '../../' . $row['url_imagen'];
                if (file_exists($ruta)) {
                    @unlink($ruta);
                }
            }
            $stmt->close();

            // Eliminar registros de fotos
            $stmt = $conn->prepare("DELETE FROM fotos_publicacion WHERE id_publicacion IN ($placeholders)");
            $stmt->bind_param($types, ...$publicaciones);
            if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar fotos de publicaciones: ' . $err); }
            $stmt->close();

            // Eliminar publicaciones
            $stmt = $conn->prepare("DELETE FROM publicararriendo WHERE id_publicacion IN ($placeholders)");
            $stmt->bind_param($types, ...$publicaciones);
            if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar publicaciones: ' . $err); }
            $stmt->close();
        }

        // 8) Limpiar id_suscripcion del usuario
        $stmt = $conn->prepare('UPDATE usuarios SET id_suscripcion = NULL WHERE id_usuario = ?');
        $stmt->bind_param('i', $id_usuario);
        if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al limpiar id_suscripcion: ' . $err); }
        $stmt->close();

        // 9) Eliminar suscripciones del usuario
        $stmt = $conn->prepare('DELETE FROM suscripciones WHERE id_usuario = ?');
        $stmt->bind_param('i', $id_usuario);
        if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar suscripciones: ' . $err); }
        $stmt->close();

        // 10) Eliminar contadores del usuario
        $stmt = $conn->prepare('DELETE FROM contador_admin_espacios WHERE id_usuario = ?');
        $stmt->bind_param('i', $id_usuario);
        if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar contadores: ' . $err); }
        $stmt->close();

        // 11) Eliminar roles del usuario
        $stmt = $conn->prepare("DELETE FROM usuario_rol WHERE id_usuario = ?");
        $stmt->bind_param('i', $id_usuario);
        if (!$stmt->execute()) {
            throw new Exception("Error eliminando roles del usuario: " . $stmt->error);
        }
        $stmt->close();

        // 12) Eliminar credenciales
        $stmt = $conn->prepare("DELETE FROM credenciales WHERE id_usuario = ?");
        $stmt->bind_param('i', $id_usuario);
        if (!$stmt->execute()) {
            throw new Exception("Error eliminando credenciales: " . $stmt->error);
        }
        $stmt->close();

        // 13) Eliminar sesiones
        $stmt = $conn->prepare('DELETE FROM Sesion WHERE id_usuario = ?');
        $stmt->bind_param('i', $id_usuario);
        if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar sesiones: ' . $err); }
        $stmt->close();

        // 14) Eliminar usuario
        $stmt = $conn->prepare("DELETE FROM usuarios WHERE id_usuario = ?");
        $stmt->bind_param('i', $id_usuario);
        if (!$stmt->execute()) {
            throw new Exception("Error eliminando usuario: " . $stmt->error);
        }
        $stmt->close();

        // Confirmar transacción
        $conn->commit();
        
        return [
            'success' => true, 
            'message' => 'AdminSistema eliminado correctamente',
            'usuario_eliminado' => $usuario['nombre'] . ' ' . $usuario['apellido']
        ];

    } catch (Exception $e) {
        // Revertir transacción
        $conn->rollback();
        return ['success' => false, 'message' => 'Error al eliminar AdminSistema: ' . $e->getMessage()];
    }
}
?>