<?php
require_once __DIR__ . '/../config/db_config.php';

header('Content-Type: application/json; charset=utf-8');

function json_error($message) {
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}

function obtenerIdRolCliente($conn) {
    $stmt = $conn->prepare("SELECT id_rol FROM roles WHERE nombre_rol = 'Cliente'");
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res->num_rows === 0) {
        $stmt->close();
        return null;
    }
    $row = $res->fetch_assoc();
    $stmt->close();
    return intval($row['id_rol']);
}

function obtenerIdRegionPorNombre($conn, $nombre_region) {
    if ($nombre_region === null || $nombre_region === '') return null;
    $stmt = $conn->prepare('SELECT id_region FROM regiones WHERE nombre_region = ?');
    $stmt->bind_param('s', $nombre_region);
    $stmt->execute();
    $res = $stmt->get_result();
    $id = null;
    if ($res && $res->num_rows > 0) {
        $id = intval($res->fetch_assoc()['id_region']);
    }
    $stmt->close();
    return $id;
}

function obtenerIdCiudadPorNombre($conn, $nombre_ciudad, $id_region) {
    if ($nombre_ciudad === null || $nombre_ciudad === '' || !$id_region) return null;
    $stmt = $conn->prepare('SELECT id_ciudad FROM ciudades WHERE nombre_ciudad = ? AND id_region = ?');
    $stmt->bind_param('si', $nombre_ciudad, $id_region);
    $stmt->execute();
    $res = $stmt->get_result();
    $id = null;
    if ($res && $res->num_rows > 0) {
        $id = intval($res->fetch_assoc()['id_ciudad']);
    }
    $stmt->close();
    return $id;
}

function listarClientes($conn, $filtro = '', $roles = ['Cliente']) {
    // Normalizar roles: Colaborador -> Secretaria
    $rolesNorm = [];
    foreach ($roles as $r) {
        $r = trim($r);
        if ($r === 'Colaboradores' || $r === 'Colaboradores') { $r = 'Colaboradores'; }
        if ($r !== '') { $rolesNorm[] = $r; }
    }
    if (empty($rolesNorm)) { $rolesNorm = ['Cliente']; }

    $placeholders = implode(',', array_fill(0, count($rolesNorm), '?'));

    $sql = "SELECT 
                u.id_usuario,
                u.id_suscripcion,
                CONCAT(u.rut_numero,'-',u.rut_dv) AS rut,
                u.nombre,
                u.apellido,
                u.telefono,
                u.direccion,
                u.activo,
                u.fecha_creacion,
                c.nombre_usuario,
                c.correo_electronico,
                r.nombre_region,
                ciu.nombre_ciudad,
                MIN(ro.nombre_rol) AS nombre_rol,
                p.nombre_plan AS nombre_suscripcion
            FROM usuarios u
            JOIN credenciales c ON u.id_usuario = c.id_usuario
            JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario AND ur.estado = 'Activo'
            JOIN roles ro ON ur.id_rol = ro.id_rol AND ro.nombre_rol IN ($placeholders)
            LEFT JOIN regiones r ON u.id_region = r.id_region
            LEFT JOIN ciudades ciu ON u.id_ciudad = ciu.id_ciudad
            LEFT JOIN suscripciones s ON u.id_suscripcion = s.id_suscripcion
            LEFT JOIN planes p ON p.id_plan = s.id_plan
            GROUP BY u.id_usuario, u.id_suscripcion, u.rut_numero, u.rut_dv, u.nombre, u.apellido, u.telefono, u.direccion, u.activo, u.fecha_creacion, c.nombre_usuario, c.correo_electronico, r.nombre_region, ciu.nombre_ciudad, p.nombre_plan";

    $types = str_repeat('s', count($rolesNorm));
    $params = $rolesNorm;
    if ($filtro !== '') {
        $sql .= " AND (
                    u.nombre LIKE ? OR u.apellido LIKE ? OR c.nombre_usuario LIKE ? OR c.correo_electronico LIKE ? OR CONCAT(u.rut_numero,'-',u.rut_dv) LIKE ?
                 )";
        $like = '%' . $filtro . '%';
        $types .= 'sssss';
        $params = array_merge($params, [$like, $like, $like, $like, $like]);
    }
    $sql .= ' ORDER BY u.nombre, u.apellido';

    $stmt = $conn->prepare($sql);
    if ($types !== '') { $stmt->bind_param($types, ...$params); }
    $stmt->execute();
    $res = $stmt->get_result();
    $clientes = [];
    while ($row = $res->fetch_assoc()) {
        $row['nombre_completo'] = $row['nombre'] . ' ' . $row['apellido'];
        $row['iniciales'] = strtoupper(substr($row['nombre'],0,1) . substr($row['apellido'],0,1));
        $clientes[] = $row;
    }
    $stmt->close();
    return $clientes;
}

function validarUnicidad($conn, $nombre_usuario, $correo, $rut_numero, $rut_dv, $excluir_id = null) {
    // nombre_usuario
    if ($excluir_id) {
        $stmt = $conn->prepare('SELECT 1 FROM credenciales WHERE nombre_usuario = ? AND id_usuario != ? LIMIT 1');
        $stmt->bind_param('si', $nombre_usuario, $excluir_id);
    } else {
        $stmt = $conn->prepare('SELECT 1 FROM credenciales WHERE nombre_usuario = ? LIMIT 1');
        $stmt->bind_param('s', $nombre_usuario);
    }
    $stmt->execute(); $res = $stmt->get_result(); $existsUser = $res->num_rows > 0; $stmt->close();
    if ($existsUser) return 'El nombre de usuario ya existe';

    // correo
    if ($excluir_id) {
        $stmt = $conn->prepare('SELECT 1 FROM credenciales WHERE correo_electronico = ? AND id_usuario != ? LIMIT 1');
        $stmt->bind_param('si', $correo, $excluir_id);
    } else {
        $stmt = $conn->prepare('SELECT 1 FROM credenciales WHERE correo_electronico = ? LIMIT 1');
        $stmt->bind_param('s', $correo);
    }
    $stmt->execute(); $res = $stmt->get_result(); $existsMail = $res->num_rows > 0; $stmt->close();
    if ($existsMail) return 'El correo electrónico ya está registrado';

    // RUT
    if ($excluir_id) {
        $stmt = $conn->prepare('SELECT 1 FROM usuarios WHERE rut_numero = ? AND rut_dv = ? AND id_usuario != ? LIMIT 1');
        $stmt->bind_param('isi', $rut_numero, $rut_dv, $excluir_id);
    } else {
        $stmt = $conn->prepare('SELECT 1 FROM usuarios WHERE rut_numero = ? AND rut_dv = ? LIMIT 1');
        $stmt->bind_param('is', $rut_numero, $rut_dv);
    }
    $stmt->execute(); $res = $stmt->get_result(); $existsRut = $res->num_rows > 0; $stmt->close();
    if ($existsRut) return 'El RUT ya está registrado';

    return null;
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $conn = getDBConnection();

    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) { $data = $_POST; }
        $action = $data['action'] ?? '';

        switch ($action) {
            case 'obtener_por_id': {
                if (empty($data['id_usuario'])) json_error('Falta id_usuario');
                $id_usuario = intval($data['id_usuario']);
                $stmt = $conn->prepare("SELECT 
                        u.id_usuario,
                        CONCAT(u.rut_numero,'-',u.rut_dv) AS rut,
                        u.rut_numero,
                        u.rut_dv,
                        u.nombre,
                        u.apellido,
                        u.telefono,
                        u.direccion,
                        u.id_suscripcion,
                        u.activo,
                        u.fecha_creacion,
                        c.nombre_usuario,
                        c.correo_electronico,
                        r.nombre_region,
                        ciu.nombre_ciudad,
                        MIN(ro.nombre_rol) AS nombre_rol,
                        p.nombre_plan AS nombre_suscripcion
                    FROM usuarios u
                    JOIN credenciales c ON u.id_usuario = c.id_usuario
                    LEFT JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario AND ur.estado = 'Activo'
                    LEFT JOIN roles ro ON ur.id_rol = ro.id_rol
                    LEFT JOIN regiones r ON u.id_region = r.id_region
                    LEFT JOIN ciudades ciu ON u.id_ciudad = ciu.id_ciudad
                    LEFT JOIN suscripciones s ON u.id_suscripcion = s.id_suscripcion
                    LEFT JOIN planes p ON p.id_plan = s.id_plan
                    WHERE u.id_usuario = ?
                    GROUP BY u.id_usuario");
                $stmt->bind_param('i', $id_usuario);
                $stmt->execute();
                $res = $stmt->get_result();
                if ($res && $res->num_rows > 0) {
                    $u = $res->fetch_assoc();
                    $stmt->close();
                    echo json_encode(['success' => true, 'usuario' => $u]);
                } else {
                    $stmt->close();
                    json_error('Usuario no encontrado');
                }
                break;
            }
            case 'listar': {
                $filtro = trim($data['filtro'] ?? '');
                $roles = $data['roles'] ?? ['Cliente'];
                if (!is_array($roles)) { $roles = [$roles]; }
                $clientes = listarClientes($conn, $filtro, $roles);
                echo json_encode(['success' => true, 'clientes' => $clientes, 'total' => count($clientes)]);
                break;
            }

            case 'crear': {
                $required = ['rut_numero','rut_dv','nombre','apellido','nombre_usuario','correo_electronico','contrasena'];
                foreach ($required as $f) { if (empty($data[$f])) json_error("Falta el campo: $f"); }

                $rut_numero = intval($data['rut_numero']);
                $rut_dv = strtoupper($data['rut_dv']);
                $nombre = trim($data['nombre']);
                $apellido = trim($data['apellido']);
                $telefono = isset($data['telefono']) && $data['telefono'] !== '' ? trim($data['telefono']) : null;
                $regionNombre = isset($data['region']) ? trim($data['region']) : null;
                $ciudadNombre = isset($data['ciudad']) ? trim($data['ciudad']) : null;
                $direccion = isset($data['direccion']) && $data['direccion'] !== '' ? trim($data['direccion']) : null;
                $nombre_usuario = trim($data['nombre_usuario']);
                $correo_electronico = trim($data['correo_electronico']);
                $contrasena = $data['contrasena'];

                if (!filter_var($correo_electronico, FILTER_VALIDATE_EMAIL)) json_error('Correo electrónico inválido');
                if (strlen($contrasena) < 8) json_error('La contraseña debe tener al menos 8 caracteres');

                $uniqueError = validarUnicidad($conn, $nombre_usuario, $correo_electronico, $rut_numero, $rut_dv, null);
                if ($uniqueError) json_error($uniqueError);

                $id_region = obtenerIdRegionPorNombre($conn, $regionNombre);
                $id_ciudad = obtenerIdCiudadPorNombre($conn, $ciudadNombre, $id_region);

                $id_rol_cliente = obtenerIdRolCliente($conn);
                if (!$id_rol_cliente) json_error('Rol Cliente no encontrado');

                $conn->begin_transaction();
                try {
                    $stmt = $conn->prepare("INSERT INTO usuarios (rut_numero, rut_dv, nombre, apellido, telefono, id_region, id_ciudad, direccion, id_suscripcion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)");
                    $stmt->bind_param('issssiis', $rut_numero, $rut_dv, $nombre, $apellido, $telefono, $id_region, $id_ciudad, $direccion);
                    if (!$stmt->execute()) throw new Exception('Error al crear usuario: ' . $stmt->error);
                    $id_usuario = $conn->insert_id; $stmt->close();

                    $hash = password_hash($contrasena, PASSWORD_ARGON2ID);
                    $stmt = $conn->prepare('INSERT INTO credenciales (id_usuario, nombre_usuario, correo_electronico, contrasena_hash) VALUES (?, ?, ?, ?)');
                    $stmt->bind_param('isss', $id_usuario, $nombre_usuario, $correo_electronico, $hash);
                    if (!$stmt->execute()) throw new Exception('Error al crear credenciales: ' . $stmt->error);
                    $stmt->close();

                    $stmt = $conn->prepare('INSERT INTO usuario_rol (id_usuario, id_rol, estado) VALUES (?, ?, "Activo")');
                    $stmt->bind_param('ii', $id_usuario, $id_rol_cliente);
                    if (!$stmt->execute()) throw new Exception('Error al asignar rol: ' . $stmt->error);
                    $stmt->close();

                    $conn->commit();
                    echo json_encode(['success' => true, 'message' => 'Cliente creado correctamente', 'id_usuario' => $id_usuario]);
                } catch (Exception $e) {
                    $conn->rollback();
                    json_error($e->getMessage());
                }
                break;
            }

            case 'actualizar': {
                $required = ['id_usuario','nombre','apellido','nombre_usuario','correo_electronico'];
                foreach ($required as $f) { if (!isset($data[$f]) || $data[$f] === '') json_error("Falta el campo: $f"); }

                $id_usuario = intval($data['id_usuario']);
                $rut_numero = isset($data['rut_numero']) ? intval($data['rut_numero']) : null;
                $rut_dv = isset($data['rut_dv']) ? strtoupper($data['rut_dv']) : null;
                $nombre = trim($data['nombre']);
                $apellido = trim($data['apellido']);
                $telefono = isset($data['telefono']) && $data['telefono'] !== '' ? trim($data['telefono']) : null;
                $regionNombre = isset($data['region']) ? trim($data['region']) : null;
                $ciudadNombre = isset($data['ciudad']) ? trim($data['ciudad']) : null;
                $direccion = isset($data['direccion']) && $data['direccion'] !== '' ? trim($data['direccion']) : null;
                $nombre_usuario = trim($data['nombre_usuario']);
                $correo_electronico = trim($data['correo_electronico']);
                $nueva_contrasena = isset($data['contrasena']) ? $data['contrasena'] : '';

                if (!filter_var($correo_electronico, FILTER_VALIDATE_EMAIL)) json_error('Correo electrónico inválido');

                // Para validar RUT en actualización solo si ambos vienen
                if ($rut_numero !== null && $rut_dv !== null) {
                    $uniqueError = validarUnicidad($conn, $nombre_usuario, $correo_electronico, $rut_numero, $rut_dv, $id_usuario);
                    if ($uniqueError) json_error($uniqueError);
                } else {
                    // validar usuario/correo con exclusión
                    $uniqueError = validarUnicidad($conn, $nombre_usuario, $correo_electronico, -1, 'X', $id_usuario);
                    if ($uniqueError && strpos($uniqueError, 'RUT') !== false) $uniqueError = null; // ignorar RUT si no se envió
                    if ($uniqueError) json_error($uniqueError);
                }

                $id_region = obtenerIdRegionPorNombre($conn, $regionNombre);
                $id_ciudad = obtenerIdCiudadPorNombre($conn, $ciudadNombre, $id_region);

                $conn->begin_transaction();
                try {
                    // actualizar usuarios
                    if ($rut_numero !== null && $rut_dv !== null) {
                        $stmt = $conn->prepare('UPDATE usuarios SET rut_numero = ?, rut_dv = ?, nombre = ?, apellido = ?, telefono = ?, id_region = ?, id_ciudad = ?, direccion = ? WHERE id_usuario = ?');
                        $stmt->bind_param('issssiisi', $rut_numero, $rut_dv, $nombre, $apellido, $telefono, $id_region, $id_ciudad, $direccion, $id_usuario);
                    } else {
                        $stmt = $conn->prepare('UPDATE usuarios SET nombre = ?, apellido = ?, telefono = ?, id_region = ?, id_ciudad = ?, direccion = ? WHERE id_usuario = ?');
                        $stmt->bind_param('sssiisi', $nombre, $apellido, $telefono, $id_region, $id_ciudad, $direccion, $id_usuario);
                    }
                    if (!$stmt->execute()) throw new Exception('Error al actualizar usuario: ' . $stmt->error);
                    $stmt->close();

                    // actualizar credenciales (y contraseña opcional)
                    if ($nueva_contrasena !== '') {
                        if (strlen($nueva_contrasena) < 8) throw new Exception('La nueva contraseña debe tener al menos 8 caracteres');
                        $hash = password_hash($nueva_contrasena, PASSWORD_ARGON2ID);
                        $stmt = $conn->prepare('UPDATE credenciales SET nombre_usuario = ?, correo_electronico = ?, contrasena_hash = ? WHERE id_usuario = ?');
                        $stmt->bind_param('sssi', $nombre_usuario, $correo_electronico, $hash, $id_usuario);
                    } else {
                        $stmt = $conn->prepare('UPDATE credenciales SET nombre_usuario = ?, correo_electronico = ? WHERE id_usuario = ?');
                        $stmt->bind_param('ssi', $nombre_usuario, $correo_electronico, $id_usuario);
                    }
                    if (!$stmt->execute()) throw new Exception('Error al actualizar credenciales: ' . $stmt->error);
                    $stmt->close();

                    $conn->commit();
                    echo json_encode(['success' => true, 'message' => 'Cliente actualizado correctamente']);
                } catch (Exception $e) {
                    $conn->rollback();
                    json_error($e->getMessage());
                }
                break;
            }

            case 'eliminar': {
                if (empty($data['id_usuario'])) json_error('Falta id_usuario');
                $id_usuario = intval($data['id_usuario']);
                $stmt = $conn->prepare('UPDATE usuarios SET activo = 0 WHERE id_usuario = ?');
                $stmt->bind_param('i', $id_usuario);
                if ($stmt->execute()) {
                    $stmt->close();
                    echo json_encode(['success' => true, 'message' => 'Cliente desactivado correctamente']);
                } else {
                    $msg = $stmt->error; $stmt->close(); json_error('Error al desactivar: ' . $msg);
                }
                break;
            }

            case 'eliminar_definitivo': {
                if (empty($data['id_usuario'])) json_error('Falta id_usuario');
                $id_usuario = intval($data['id_usuario']);
                $conn->begin_transaction();
                try {
                    // 1) Obtener id_suscripcion antes de eliminarla (para eliminar pagos)
                    $stmt = $conn->prepare('SELECT id_suscripcion FROM usuarios WHERE id_usuario = ?');
                    $stmt->bind_param('i', $id_usuario);
                    $stmt->execute();
                    $res = $stmt->get_result();
                    $id_suscripcion = null;
                    if ($res && $res->num_rows > 0) {
                        $row = $res->fetch_assoc();
                        $id_suscripcion = $row['id_suscripcion'];
                    }
                    $stmt->close();

                    // 2) Eliminar pagos asociados a las suscripciones del usuario (ANTES de eliminar suscripciones)
                    if ($id_suscripcion) {
                        $stmt = $conn->prepare('DELETE FROM pagos WHERE id_suscripcion = ?');
                        $stmt->bind_param('i', $id_suscripcion);
                        if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar pagos: ' . $err); }
                        $stmt->close();
                    }

                    // 3) Eliminar asignaciones de espacios del cliente y sus dependencias
                    // 3a) Obtener todas las asignaciones del usuario
                    $stmt = $conn->prepare('SELECT id_asignacion FROM asignacion_espacio_cliente WHERE id_usuario = ?');
                    $stmt->bind_param('i', $id_usuario);
                    $stmt->execute();
                    $res = $stmt->get_result();
                    $asignaciones = [];
                    while ($row = $res->fetch_assoc()) {
                        $asignaciones[] = $row['id_asignacion'];
                    }
                    $stmt->close();

                    // 3b) Eliminar mensajes de asignación
                    if (!empty($asignaciones)) {
                        $placeholders = implode(',', array_fill(0, count($asignaciones), '?'));
                        $stmt = $conn->prepare("DELETE FROM mensajesasignacion WHERE id_asignacion IN ($placeholders)");
                        $types = str_repeat('i', count($asignaciones));
                        $stmt->bind_param($types, ...$asignaciones);
                        if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar mensajes de asignación: ' . $err); }
                        $stmt->close();

                        // 3c) Eliminar reportes de asignación
                        $stmt = $conn->prepare("DELETE FROM envioreportes WHERE id_asignacion IN ($placeholders)");
                        $stmt->bind_param($types, ...$asignaciones);
                        if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar reportes: ' . $err); }
                        $stmt->close();

                        // 3d) Eliminar solicitudes de cambio de horario
                        $stmt = $conn->prepare("DELETE FROM solicitud_cambio_horario WHERE id_asignacion IN ($placeholders)");
                        $stmt->bind_param($types, ...$asignaciones);
                        if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar solicitudes de cambio de horario: ' . $err); }
                        $stmt->close();
                    }

                    // 3e) Eliminar asignaciones de espacios
                    $stmt = $conn->prepare('DELETE FROM asignacion_espacio_cliente WHERE id_usuario = ?');
                    $stmt->bind_param('i', $id_usuario);
                    if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar asignaciones: ' . $err); }
                    $stmt->close();

                    // 4) Eliminar calificaciones del usuario (como cliente que califica)
                    $stmt = $conn->prepare('DELETE FROM calificacionadministrador WHERE id_usuario_cliente = ?');
                    $stmt->bind_param('i', $id_usuario);
                    if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar calificaciones de administrador: ' . $err); }
                    $stmt->close();

                    // 5) Eliminar calificaciones de espacios (si el usuario calificó espacios)
                    $stmt = $conn->prepare('DELETE FROM calificacionespacio WHERE id_usuario_cliente = ?');
                    $stmt->bind_param('i', $id_usuario);
                    if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar calificaciones de espacios: ' . $err); }
                    $stmt->close();

                    // 6) Eliminar mensajes de consulta (donde el usuario es emisor o receptor)
                    $stmt = $conn->prepare('DELETE FROM mensajesconsulta WHERE id_emisor = ? OR id_receptor = ?');
                    $stmt->bind_param('ii', $id_usuario, $id_usuario);
                    if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar mensajes de consulta: ' . $err); }
                    $stmt->close();

                    // 7) Romper referencias hacia este usuario
                    // 7a) Usuarios que lo tengan como administrador asociado -> NULL
                    $stmt = $conn->prepare('UPDATE usuarios SET id_administrador_asociado = NULL WHERE id_administrador_asociado = ?');
                    $stmt->bind_param('i', $id_usuario);
                    if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al limpiar asociaciones: ' . $err); }
                    $stmt->close();

                    // 8) Eliminar espacios gestionados por el usuario (si es administrador)
                    // 8a) Obtener espacios del usuario
                    $stmt = $conn->prepare('SELECT id_espacio FROM gestiondeespacio WHERE id_usuario = ?');
                    $stmt->bind_param('i', $id_usuario);
                    $stmt->execute();
                    $res = $stmt->get_result();
                    $espacios = [];
                    while ($row = $res->fetch_assoc()) {
                        $espacios[] = $row['id_espacio'];
                    }
                    $stmt->close();

                    // 8b) Eliminar fotos de espacios
                    if (!empty($espacios)) {
                        // Obtener URLs de fotos para eliminarlas físicamente
                        $placeholders = implode(',', array_fill(0, count($espacios), '?'));
                        $stmt = $conn->prepare("SELECT url_imagen FROM fotos_publicacion WHERE id_espacio IN ($placeholders)");
                        $types = str_repeat('i', count($espacios));
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

                    // 9) Eliminar publicaciones de arriendo del usuario
                    // 9a) Obtener publicaciones del usuario
                    $stmt = $conn->prepare('SELECT id_publicacion FROM publicararriendo WHERE id_usuario = ?');
                    $stmt->bind_param('i', $id_usuario);
                    $stmt->execute();
                    $res = $stmt->get_result();
                    $publicaciones = [];
                    while ($row = $res->fetch_assoc()) {
                        $publicaciones[] = $row['id_publicacion'];
                    }
                    $stmt->close();

                    // 9b) Eliminar calificaciones de publicaciones
                    if (!empty($publicaciones)) {
                        $placeholders = implode(',', array_fill(0, count($publicaciones), '?'));
                        $stmt = $conn->prepare("DELETE FROM calificacionespacio WHERE id_publicacion IN ($placeholders)");
                        $types = str_repeat('i', count($publicaciones));
                        $stmt->bind_param($types, ...$publicaciones);
                        if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar calificaciones de publicaciones: ' . $err); }
                        $stmt->close();

                        // 9c) Eliminar mensajes de consulta de publicaciones
                        $stmt = $conn->prepare("DELETE FROM mensajesconsulta WHERE id_publicacion IN ($placeholders)");
                        $stmt->bind_param($types, ...$publicaciones);
                        if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar mensajes de consulta de publicaciones: ' . $err); }
                        $stmt->close();

                        // 9d) Eliminar fotos de publicaciones
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

                    // 10) Eliminar dependencias directas del usuario
                    // 10a) Primero romper la FK usuarios.id_suscripcion -> suscripciones.id_suscripcion
                    $stmt = $conn->prepare('UPDATE usuarios SET id_suscripcion = NULL WHERE id_usuario = ?');
                    $stmt->bind_param('i', $id_usuario);
                    if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al limpiar id_suscripcion: ' . $err); }
                    $stmt->close();

                    // 10b) Suscripciones del usuario (por nueva FK suscripciones.id_usuario -> usuarios.id_usuario)
                    // IMPORTANTE: Eliminar pagos de estas suscripciones primero
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

                    // Ahora eliminar suscripciones
                    $stmt = $conn->prepare('DELETE FROM suscripciones WHERE id_usuario = ?');
                    $stmt->bind_param('i', $id_usuario);
                    if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar suscripciones: ' . $err); }
                    $stmt->close();

                    // 10c) Contadores del usuario
                    $stmt = $conn->prepare('DELETE FROM contador_admin_espacios WHERE id_usuario = ?');
                    $stmt->bind_param('i', $id_usuario);
                    if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar contadores: ' . $err); }
                    $stmt->close();

                    // 10d) Roles del usuario
                    $stmt = $conn->prepare('DELETE FROM usuario_rol WHERE id_usuario = ?');
                    $stmt->bind_param('i', $id_usuario);
                    if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar roles: ' . $err); }
                    $stmt->close();

                    // 10e) Credenciales del usuario
                    $stmt = $conn->prepare('DELETE FROM credenciales WHERE id_usuario = ?');
                    $stmt->bind_param('i', $id_usuario);
                    if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar credenciales: ' . $err); }
                    $stmt->close();

                    // 10f) Sesiones del usuario
                    $stmt = $conn->prepare('DELETE FROM Sesion WHERE id_usuario = ?');
                    $stmt->bind_param('i', $id_usuario);
                    if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar sesiones: ' . $err); }
                    $stmt->close();

                    // 11) Finalmente eliminar el usuario
                    $stmt = $conn->prepare('DELETE FROM usuarios WHERE id_usuario = ?');
                    $stmt->bind_param('i', $id_usuario);
                    if (!$stmt->execute()) { $err = $stmt->error; $stmt->close(); throw new Exception('Error al eliminar usuario: ' . $err); }
                    $af = $stmt->affected_rows; $stmt->close();

                    $conn->commit();
                    if ($af > 0) {
                        echo json_encode(['success' => true, 'message' => 'Usuario eliminado definitivamente']);
                    } else {
                        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
                    }
                } catch (Exception $e) {
                    $conn->rollback();
                    json_error($e->getMessage());
                }
                break;
            }

            case 'activar': {
                if (empty($data['id_usuario'])) json_error('Falta id_usuario');
                $id_usuario = intval($data['id_usuario']);
                $stmt = $conn->prepare('UPDATE usuarios SET activo = 1 WHERE id_usuario = ?');
                $stmt->bind_param('i', $id_usuario);
                if ($stmt->execute()) {
                    $stmt->close();
                    echo json_encode(['success' => true, 'message' => 'Cliente activado correctamente']);
                } else {
                    $msg = $stmt->error; $stmt->close(); json_error('Error al activar: ' . $msg);
                }
                break;
            }

            default:
                json_error('Acción no válida');
        }
        $conn->close();
        exit;
    }

    echo json_encode(['success' => false, 'message' => 'Método no soportado']);
    $conn->close();
    exit;
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
    exit;
}
?>


