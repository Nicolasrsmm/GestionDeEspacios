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
        case 'registrar_colaborador':
            echo json_encode(registrarColaborador($conn, $data));
            break;
        case 'obtener_colaboradores':
            echo json_encode(obtenerColaboradores($conn, $data['id_administrador']));
            break;
        case 'actualizar_colaborador':
            echo json_encode(actualizarColaborador($conn, $data));
            break;
        case 'eliminar_colaborador':
            echo json_encode(eliminarColaborador($conn, $data['id_colaborador'], $data['id_administrador']));
            break;
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
            break;
    }
    
    $conn->close();
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error de conexión a la base de datos: ' . $e->getMessage()]);
}

function validarRutChileno($rut, $dv) {
    $rut = preg_replace('/[^0-9]/', '', $rut);
    $dv = strtoupper($dv);
    
    if (strlen($rut) < 7 || strlen($rut) > 8) {
        return false;
    }
    
    $suma = 0;
    $multiplicador = 2;
    
    for ($i = strlen($rut) - 1; $i >= 0; $i--) {
        $suma += intval($rut[$i]) * $multiplicador;
        $multiplicador = $multiplicador == 7 ? 2 : $multiplicador + 1;
    }
    
    $resto = $suma % 11;
    $dv_calculado = 11 - $resto;
    
    if ($dv_calculado == 11) $dv_calculado = '0';
    if ($dv_calculado == 10) $dv_calculado = 'K';
    
    return $dv == $dv_calculado;
}

function validarNombreUsuarioUnico($conn, $nombre_usuario, $excluir_id_usuario = null) {
    if ($excluir_id_usuario) {
        $stmt = $conn->prepare("SELECT COUNT(*) FROM credenciales WHERE nombre_usuario = ? AND id_usuario != ?");
        $stmt->bind_param('si', $nombre_usuario, $excluir_id_usuario);
    } else {
        $stmt = $conn->prepare("SELECT COUNT(*) FROM credenciales WHERE nombre_usuario = ?");
        $stmt->bind_param('s', $nombre_usuario);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    $count = $result->fetch_row()[0];
    $stmt->close();
    return $count == 0;
}

function validarRutUnico($conn, $rut_numero, $rut_dv) {
    $stmt = $conn->prepare("SELECT COUNT(*) FROM usuarios WHERE rut_numero = ? AND rut_dv = ?");
    $stmt->bind_param('is', $rut_numero, $rut_dv);
    $stmt->execute();
    $result = $stmt->get_result();
    $count = $result->fetch_row()[0];
    $stmt->close();
    return $count == 0;
}

function validarCorreoUnico($conn, $correo, $excluir_id_usuario = null) {
    if ($excluir_id_usuario) {
        $stmt = $conn->prepare("SELECT COUNT(*) FROM credenciales WHERE correo_electronico = ? AND id_usuario != ?");
        $stmt->bind_param('si', $correo, $excluir_id_usuario);
    } else {
        $stmt = $conn->prepare("SELECT COUNT(*) FROM credenciales WHERE correo_electronico = ?");
        $stmt->bind_param('s', $correo);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    $count = $result->fetch_row()[0];
    $stmt->close();
    return $count == 0;
}

function obtenerIdRolColaborador($conn) {
    $stmt = $conn->prepare("SELECT id_rol FROM roles WHERE nombre_rol = 'Colaboradores'");
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $stmt->close();
        return $row['id_rol'];
    }
    $stmt->close();
    return null;
}

function registrarColaborador($conn, $data) {
    // Debug: Log de datos recibidos
    error_log("Datos recibidos para registrar colaborador: " . json_encode($data));
    
    $required = ['nombre_usuario', 'contrasena', 'rut', 'nombre', 'apellido', 'correo_electronico', 'id_administrador'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            error_log("Campo faltante: $field");
            return ['success' => false, 'message' => "Falta el campo: $field"];
        }
    }
    
    // Verificar que el administrador existe
    $stmt = $conn->prepare("SELECT id_usuario FROM usuarios WHERE id_usuario = ?");
    $stmt->bind_param('i', $data['id_administrador']);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows == 0) {
        error_log("Administrador no encontrado: " . $data['id_administrador']);
        return ['success' => false, 'message' => 'Administrador no encontrado. ID: ' . $data['id_administrador']];
    }
    $stmt->close();
    
    // Obtener ID del rol de colaborador
    $id_rol_colaborador = obtenerIdRolColaborador($conn);
    if (!$id_rol_colaborador) {
        return ['success' => false, 'message' => 'Error: No se pudo obtener el rol de colaborador'];
    }
    
    // Validaciones
    $password = $data['contrasena'];
    if (strlen($password) < 6) {
        return ['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres.'];
    }
    
    if (!filter_var($data['correo_electronico'], FILTER_VALIDATE_EMAIL)) {
        return ['success' => false, 'message' => 'Correo electrónico inválido.'];
    }
    
    // Validar formato de RUT chileno (formato: 12345678-9)
    $rut = trim($data['rut']);
    if (!preg_match('/^\d{7,8}-[\dkK]$/', $rut)) {
        return ['success' => false, 'message' => 'El RUT debe tener el formato: 12345678-9'];
    }
    
    // Validar RUT chileno
    $rut_parts = explode('-', $rut);
    if (!validarRutChileno($rut_parts[0], $rut_parts[1])) {
        return ['success' => false, 'message' => 'El RUT ingresado no es válido.'];
    }
    
    $rut_numero = intval($rut_parts[0]);
    $rut_dv = strtoupper($rut_parts[1]);
    
    // Validar unicidad de nombre_usuario
    if (!validarNombreUsuarioUnico($conn, $data['nombre_usuario'])) {
        return ['success' => false, 'message' => 'El nombre de usuario ya existe en el sistema'];
    }
    
    // Validar unicidad de RUT
    if (!validarRutUnico($conn, $rut_numero, $rut_dv)) {
        return ['success' => false, 'message' => 'El RUT ya está registrado en el sistema'];
    }
    
    // Validar unicidad de correo electrónico
    if (!validarCorreoUnico($conn, $data['correo_electronico'])) {
        return ['success' => false, 'message' => 'El correo electrónico ya está registrado en el sistema'];
    }
    
    // Hash de la contraseña
    $contrasena_hash = password_hash($data['contrasena'], PASSWORD_ARGON2ID);
    
    // Preparar datos opcionales
    $telefono = !empty($data['telefono']) ? $data['telefono'] : null;
    $direccion = !empty($data['direccion']) ? $data['direccion'] : null;

    // Mapear región y ciudad por nombre -> id
    $id_region = null;
    $id_ciudad = null;
    if (!empty($data['region'])) {
        $stmt_reg = $conn->prepare("SELECT id_region FROM regiones WHERE nombre_region = ?");
        $stmt_reg->bind_param('s', $data['region']);
        $stmt_reg->execute();
        $res_reg = $stmt_reg->get_result();
        if ($res_reg->num_rows > 0) {
            $id_region = (int)$res_reg->fetch_assoc()['id_region'];
            if (!empty($data['ciudad'])) {
                $stmt_ciu = $conn->prepare("SELECT id_ciudad FROM ciudades WHERE nombre_ciudad = ? AND id_region = ?");
                $stmt_ciu->bind_param('si', $data['ciudad'], $id_region);
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
    
    // Iniciar transacción
    $conn->begin_transaction();
    
    try {
        // Insertar usuario (colaborador) con administrador asociado (tabla usuarios)
        $stmt = $conn->prepare("INSERT INTO usuarios (rut_numero, rut_dv, nombre, apellido, telefono, id_region, id_ciudad, direccion, id_administrador_asociado, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)");
        
        if (!$stmt) {
            throw new Exception("Error preparando consulta de usuario: " . $conn->error);
        }
        
        $stmt->bind_param(
            'issssiisi',
            $rut_numero,
            $rut_dv,
            $data['nombre'],
            $data['apellido'],
            $telefono,
            $id_region,
            $id_ciudad,
            $direccion,
            $data['id_administrador']
        );
        
        if (!$stmt->execute()) {
            throw new Exception("Error insertando usuario: " . $stmt->error);
        }
        
        $id_usuario = $conn->insert_id;
        $stmt->close();
        
        // Insertar credenciales (nombre_usuario y correo_electronico)
        $stmtCred = $conn->prepare("INSERT INTO credenciales (id_usuario, nombre_usuario, correo_electronico, contrasena_hash) VALUES (?, ?, ?, ?)");
        if (!$stmtCred) {
            throw new Exception("Error preparando consulta de credenciales: " . $conn->error);
        }
        $stmtCred->bind_param('isss', $id_usuario, $data['nombre_usuario'], $data['correo_electronico'], $contrasena_hash);
        if (!$stmtCred->execute()) {
            throw new Exception("Error insertando credenciales: " . $stmtCred->error);
        }
        $stmtCred->close();

        // Asignar rol de colaborador en usuario_rol
        $stmtRol = $conn->prepare("INSERT INTO usuario_rol (id_usuario, id_rol, estado) VALUES (?, ?, 'Activo')");
        if (!$stmtRol) {
            throw new Exception("Error preparando asignación de rol: " . $conn->error);
        }
        $stmtRol->bind_param('ii', $id_usuario, $id_rol_colaborador);
        if (!$stmtRol->execute()) {
            throw new Exception("Error asignando rol: " . $stmtRol->error);
        }
        $stmtRol->close();
        
        // Confirmar transacción
        $conn->commit();
        
        error_log("Colaborador registrada exitosamente con ID: " . $id_usuario);
        return ['success' => true, 'message' => 'Colaborador registrada correctamente'];
        
    } catch (Exception $e) {
        // Revertir transacción
        $conn->rollback();
        error_log("Error en transacción: " . $e->getMessage());
        return ['success' => false, 'message' => 'Error al registrar colaborador: ' . $e->getMessage()];
    }
}

function obtenerColaboradores($conn, $id_administrador) {
    $stmt = $conn->prepare("\n        SELECT \n            u.id_usuario,\n            c.nombre_usuario,\n            CONCAT(u.rut_numero, '-', u.rut_dv) as rut,\n            u.nombre,\n            u.apellido,\n            c.correo_electronico,\n            u.telefono,\n            r.nombre_region AS region,\n            ciu.nombre_ciudad AS ciudad,\n            u.direccion,\n            u.activo,\n            u.fecha_creacion\n        FROM usuarios u\n        JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario AND ur.estado = 'Activo'\n        JOIN roles r2 ON ur.id_rol = r2.id_rol\n        JOIN credenciales c ON u.id_usuario = c.id_usuario\n        LEFT JOIN regiones r ON u.id_region = r.id_region\n        LEFT JOIN ciudades ciu ON u.id_ciudad = ciu.id_ciudad\n        WHERE r2.nombre_rol = 'Colaboradores' AND u.id_administrador_asociado = ?\n        ORDER BY u.fecha_creacion DESC\n    ");
    $stmt->bind_param('i', $id_administrador);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $colaboradores = [];
    while ($row = $result->fetch_assoc()) {
        $colaboradores[] = [
            'id_colaborador' => $row['id_usuario'], // Mapear id_usuario a id_colaborador
            'nombre_usuario' => $row['nombre_usuario'],
            'rut' => $row['rut'],
            'nombre' => $row['nombre'],
            'apellido' => $row['apellido'],
            'correo_electronico' => $row['correo_electronico'],
            'telefono' => $row['telefono'],
            'region' => $row['region'],
            'ciudad' => $row['ciudad'],
            'direccion' => $row['direccion'],
            'activo' => $row['activo'],
            'fecha_creacion' => $row['fecha_creacion']
        ];
    }
    
    $stmt->close();
    return ['success' => true, 'colaboradores' => $colaboradores];
}

function actualizarColaborador($conn, $data) {
    $required = ['id_colaborador', 'nombre_usuario', 'rut', 'nombre', 'apellido', 'correo_electronico', 'id_administrador'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            return ['success' => false, 'message' => "Falta el campo: $field"];
        }
    }

    // Verificar colaborador y pertenencia al administrador vía usuario_rol
    $stmt = $conn->prepare("SELECT u.id_usuario
        FROM usuarios u
        JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario AND ur.estado = 'Activo'
        JOIN roles r ON ur.id_rol = r.id_rol
        WHERE u.id_usuario = ? AND r.nombre_rol = 'Colaboradores' AND u.id_administrador_asociado = ?");
    $stmt->bind_param('ii', $data['id_colaborador'], $data['id_administrador']);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows == 0) {
        $stmt->close();
        return ['success' => false, 'message' => 'Colaborador no encontrada o sin permisos'];
    }
    $stmt->close();

    // Validaciones básicas
    if (!filter_var($data['correo_electronico'], FILTER_VALIDATE_EMAIL)) {
        return ['success' => false, 'message' => 'Correo electrónico inválido.'];
    }

    $rut = trim($data['rut']);
    if (!preg_match('/^\d{7,8}-[\dkK]$/', $rut)) {
        return ['success' => false, 'message' => 'El RUT debe tener el formato: 12345678-9'];
    }
    $rut_parts = explode('-', $rut);
    if (!validarRutChileno($rut_parts[0], $rut_parts[1])) {
        return ['success' => false, 'message' => 'El RUT ingresado no es válido.'];
    }
    $rut_numero = intval($rut_parts[0]);
    $rut_dv = strtoupper($rut_parts[1]);

    // Unicidad nombre_usuario y correo en credenciales (excluyendo actual)
    $stmt = $conn->prepare("SELECT COUNT(*) FROM credenciales WHERE nombre_usuario = ? AND id_usuario != ?");
    $stmt->bind_param('si', $data['nombre_usuario'], $data['id_colaborador']);
    $stmt->execute();
    $count = $stmt->get_result()->fetch_row()[0];
    $stmt->close();
    if ($count > 0) {
        return ['success' => false, 'message' => 'El nombre de usuario ya existe en el sistema'];
    }

    $stmt = $conn->prepare("SELECT COUNT(*) FROM credenciales WHERE correo_electronico = ? AND id_usuario != ?");
    $stmt->bind_param('si', $data['correo_electronico'], $data['id_colaborador']);
    $stmt->execute();
    $count = $stmt->get_result()->fetch_row()[0];
    $stmt->close();
    if ($count > 0) {
        return ['success' => false, 'message' => 'El correo electrónico ya está registrado en el sistema'];
    }

    // Unicidad de RUT en usuarios (excluyendo actual)
    $stmt = $conn->prepare("SELECT COUNT(*) FROM usuarios WHERE rut_numero = ? AND rut_dv = ? AND id_usuario != ?");
    $stmt->bind_param('isi', $rut_numero, $rut_dv, $data['id_colaborador']);
    $stmt->execute();
    $count = $stmt->get_result()->fetch_row()[0];
    $stmt->close();
    if ($count > 0) {
        return ['success' => false, 'message' => 'El RUT ya está registrado en el sistema'];
    }

    // Mapear región y ciudad por nombre -> id
    $id_region = null;
    $id_ciudad = null;
    if (!empty($data['region'])) {
        $stmt_reg = $conn->prepare("SELECT id_region FROM regiones WHERE nombre_region = ?");
        $stmt_reg->bind_param('s', $data['region']);
        $stmt_reg->execute();
        $res_reg = $stmt_reg->get_result();
        if ($res_reg->num_rows > 0) {
            $id_region = (int)$res_reg->fetch_assoc()['id_region'];
            if (!empty($data['ciudad'])) {
                $stmt_ciu = $conn->prepare("SELECT id_ciudad FROM ciudades WHERE nombre_ciudad = ? AND id_region = ?");
                $stmt_ciu->bind_param('si', $data['ciudad'], $id_region);
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

    // Datos opcionales
    $telefono = !empty($data['telefono']) ? trim($data['telefono']) : null;
    $direccion = !empty($data['direccion']) && trim($data['direccion']) !== '' ? trim($data['direccion']) : null;
    $activo = isset($data['activo']) ? (int)$data['activo'] : 1;
    
    // Debug: Log de datos recibidos
    error_log("Actualizar Colaborador - Datos recibidos: " . json_encode($data));
    error_log("Actualizar Colaborador - Dirección raw: " . ($data['direccion'] ?? 'NO_EXISTE'));
    error_log("Actualizar Colaborador - Dirección procesada: " . ($direccion ?? 'NULL'));
    error_log("Actualizar Colaborador - empty(direccion): " . (empty($data['direccion']) ? 'TRUE' : 'FALSE'));
    error_log("Actualizar Colaborador - trim(direccion) !== '': " . (trim($data['direccion']) !== '' ? 'TRUE' : 'FALSE'));

    $conn->begin_transaction();
    try {
        // Actualizar usuarios
        $stmt = $conn->prepare("UPDATE usuarios SET rut_numero = ?, rut_dv = ?, nombre = ?, apellido = ?, telefono = ?, id_region = ?, id_ciudad = ?, direccion = ?, activo = ? WHERE id_usuario = ?");
        if (!$stmt) {
            throw new Exception("Error preparando actualización de usuario: " . $conn->error);
        }
        $stmt->bind_param('issssiisii', $rut_numero, $rut_dv, $data['nombre'], $data['apellido'], $telefono, $id_region, $id_ciudad, $direccion, $activo, $data['id_colaborador']);
        if (!$stmt->execute()) {
            throw new Exception("Error actualizando usuario: " . $stmt->error);
        }
        $stmt->close();

        // Actualizar credenciales (nombre_usuario, correo y opcional contraseña)
        $stmt = $conn->prepare("UPDATE credenciales SET nombre_usuario = ?, correo_electronico = ? WHERE id_usuario = ?");
        if (!$stmt) {
            throw new Exception("Error preparando actualización de credenciales: " . $conn->error);
        }
        $stmt->bind_param('ssi', $data['nombre_usuario'], $data['correo_electronico'], $data['id_colaborador']);
        if (!$stmt->execute()) {
            throw new Exception("Error actualizando credenciales: " . $stmt->error);
        }
        $stmt->close();

        if (!empty($data['nueva_contrasena'])) {
            $contrasena_hash = password_hash($data['nueva_contrasena'], PASSWORD_ARGON2ID);
            $stmt = $conn->prepare("UPDATE credenciales SET contrasena_hash = ? WHERE id_usuario = ?");
            $stmt->bind_param('si', $contrasena_hash, $data['id_colaborador']);
            if (!$stmt->execute()) {
                throw new Exception("Error actualizando contraseña: " . $stmt->error);
            }
            $stmt->close();
        }

        $conn->commit();
        return ['success' => true, 'message' => 'Colaborador actualizada correctamente'];
    } catch (Exception $e) {
        $conn->rollback();
        return ['success' => false, 'message' => 'Error al actualizar colaborador: ' . $e->getMessage()];
    }
}

function eliminarColaborador($conn, $id_colaborador, $id_administrador) {
    // Verificar que la colaborador existe, es realmente una colaborador y pertenece al administrador
    $stmt = $conn->prepare("
        SELECT u.id_usuario 
        FROM usuarios u
        JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario AND ur.estado = 'Activo'
        JOIN roles r ON ur.id_rol = r.id_rol
        WHERE u.id_usuario = ? AND r.nombre_rol = 'Colaboradores' AND u.id_administrador_asociado = ?
    ");
    $stmt->bind_param('ii', $id_colaborador, $id_administrador);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows == 0) {
        return ['success' => false, 'message' => 'Colaborador no encontrada o sin permisos'];
    }
    $stmt->close();
    
    // Iniciar transacción
    $conn->begin_transaction();
    
    try {
        // Eliminar credenciales (se elimina automáticamente por CASCADE)
        // Eliminar usuario (esto eliminará las credenciales por CASCADE)
        $stmt = $conn->prepare("DELETE FROM usuarios WHERE id_usuario = ?");
        $stmt->bind_param('i', $id_colaborador);
        
        if (!$stmt->execute()) {
            throw new Exception("Error eliminando colaborador: " . $stmt->error);
        }
        
        $stmt->close();
        
        // Confirmar transacción
        $conn->commit();
        
        return ['success' => true, 'message' => 'Colaborador eliminada correctamente'];
        
    } catch (Exception $e) {
        // Revertir transacción
        $conn->rollback();
        return ['success' => false, 'message' => 'Error al eliminar colaborador: ' . $e->getMessage()];
    }
}
?>