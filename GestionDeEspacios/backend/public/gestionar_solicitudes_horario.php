<?php
require_once '../config/db_config.php';

header('Content-Type: application/json; charset=utf-8');

// Local function to verify session (to avoid conflicts with sesion.php)
function verificarSesionLocal($conn, $token) {
    // Obtener id_usuario por token
    $stmt = $conn->prepare("SELECT s.id_usuario FROM Sesion s WHERE s.token_sesion = ?");
    $stmt->bind_param('s', $token);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows === 0) {
        $stmt->close();
        return ['success' => false, 'message' => 'Sesión no válida o expirada'];
    }
    $ses = $result->fetch_assoc();
    $stmt->close();

    // Resolver rol activo vía usuario_rol/roles
    $stmt2 = $conn->prepare("SELECT r.nombre_rol FROM usuario_rol ur JOIN roles r ON ur.id_rol = r.id_rol WHERE ur.id_usuario = ? AND ur.estado = 'Activo' LIMIT 1");
    $stmt2->bind_param('i', $ses['id_usuario']);
    $stmt2->execute();
    $res2 = $stmt2->get_result();
    $nombreRol = $res2->num_rows ? $res2->fetch_assoc()['nombre_rol'] : null;
    $stmt2->close();

    return ['success' => true, 'sesion' => ['id_usuario' => $ses['id_usuario'], 'nombre_rol' => $nombreRol]];
}

$conn = getDBConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET' || $method === 'HEAD') {
    $token = $_GET['token'] ?? '';

    if (empty($token)) {
        echo json_encode(['success' => false, 'message' => 'Token de sesión requerido.']);
        $conn->close();
        exit;
    }

    $sesion_valida = verificarSesionLocal($conn, $token);

    if (!$sesion_valida['success']) {
        echo json_encode(['success' => false, 'message' => $sesion_valida['message']]);
        $conn->close();
        exit;
    }

    $id_admin = $sesion_valida['sesion']['id_usuario'];
    $id_usuario_cliente = isset($_GET['id_usuario_cliente']) ? intval($_GET['id_usuario_cliente']) : 0;
    // Si el token es de Colaborador, resolver admin asociado
    if (!empty($sesion_valida['sesion']['nombre_rol']) && $sesion_valida['sesion']['nombre_rol'] === 'Colaboradores') {
        $stmtAdm = $conn->prepare("SELECT COALESCE(u.id_administrador_asociado, u.id_usuario) AS id_admin FROM usuarios u WHERE u.id_usuario = ?");
        $stmtAdm->bind_param('i', $id_admin);
        $stmtAdm->execute();
        $resAdm = $stmtAdm->get_result();
        if ($resAdm->num_rows) {
            $id_admin = intval($resAdm->fetch_assoc()['id_admin']);
        }
        $stmtAdm->close();
    }

    // Fetch schedule change requests
    // Si se proporciona id_usuario_cliente, filtrar por ese cliente; si no, por administrador asociado al espacio
    $filtroWhere = $id_usuario_cliente > 0 ? 'aec.id_usuario = ?' : 'ge.id_usuario = ?';
    $sql = "
        SELECT 
            sch.id_solicitud,
            sch.id_asignacion,
            sch.fecha_solicitada,
            sch.motivo,
            sch.estado_admin,
            sch.respuesta_admin,
            sch.fecha_respuesta_admin,
            sch.fecha_solicitud,
            ge.nombre_espacio,
            ge.tipo_espacio,
            ciu.nombre_ciudad AS ciudad,
            reg.nombre_region AS region,
            u.nombre,
            u.apellido,
            cred.correo_electronico AS correo_electronico,
            u.telefono,
            he.nombre_dia AS actual_nombre_dia,
            he.nombre_dia AS actual_tipo_horario,
            he.hora_inicio AS actual_hora_inicio,
            he.hora_fin AS actual_hora_fin,
            he.fecha_inicio AS actual_fecha_inicio,
            he.fecha_termino AS actual_fecha_termino
        FROM solicitud_cambio_horario sch
        JOIN asignacion_espacio_cliente aec ON sch.id_asignacion = aec.id_asignacion
        JOIN gestiondeespacio ge ON aec.id_espacio = ge.id_espacio
        JOIN usuarios u ON aec.id_usuario = u.id_usuario
        LEFT JOIN credenciales cred ON cred.id_usuario = u.id_usuario
        LEFT JOIN horario_espacios he ON aec.id_horario = he.id_horario
        LEFT JOIN regiones reg ON ge.id_region = reg.id_region
        LEFT JOIN ciudades ciu ON ge.id_ciudad = ciu.id_ciudad
        WHERE $filtroWhere
        ORDER BY sch.fecha_solicitud DESC
    ";
    $stmt = $conn->prepare($sql);
    if ($id_usuario_cliente > 0) {
        $stmt->bind_param('i', $id_usuario_cliente);
    } else {
        $stmt->bind_param('i', $id_admin);
    }
    $stmt->execute();
    $result = $stmt->get_result();

    $solicitudes = [];
    while ($row = $result->fetch_assoc()) {
        $solicitudes[] = $row;
    }
    $stmt->close();

    echo json_encode(['success' => true, 'solicitudes' => $solicitudes]);

} elseif ($method === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE || empty($data)) {
        $data = $_POST;
    }

    $token = $data['token'] ?? '';
    $id_solicitud = $data['id_solicitud'] ?? '';
    $accion = $data['accion'] ?? '';

    if (empty($token) || empty($id_solicitud) || empty($accion)) {
        echo json_encode(['success' => false, 'message' => 'Faltan parámetros requeridos.']);
        $conn->close();
        exit;
    }

    $sesion_valida = verificarSesionLocal($conn, $token);

    if (!$sesion_valida['success']) {
        echo json_encode(['success' => false, 'message' => $sesion_valida['message']]);
        $conn->close();
        exit;
    }

    $id_admin = $sesion_valida['sesion']['id_usuario'];
    if (!empty($sesion_valida['sesion']['nombre_rol']) && $sesion_valida['sesion']['nombre_rol'] === 'Colaboradores') {
        $stmtAdm = $conn->prepare("SELECT COALESCE(u.id_administrador_asociado, u.id_usuario) AS id_admin FROM usuarios u WHERE u.id_usuario = ?");
        $stmtAdm->bind_param('i', $id_admin);
        $stmtAdm->execute();
        $resAdm = $stmtAdm->get_result();
        if ($resAdm->num_rows) {
            $id_admin = intval($resAdm->fetch_assoc()['id_admin']);
        }
        $stmtAdm->close();
    }

    if ($accion === 'aprobar') {
        // Verify that the request belongs to a space managed by this admin
        $stmt = $conn->prepare("
            SELECT sch.id_solicitud, sch.id_asignacion, sch.fecha_solicitada
            FROM solicitud_cambio_horario sch
            JOIN asignacion_espacio_cliente aec ON sch.id_asignacion = aec.id_asignacion
            JOIN gestiondeespacio ge ON aec.id_espacio = ge.id_espacio
            WHERE sch.id_solicitud = ? AND ge.id_usuario = ?
        ");
        $stmt->bind_param('ii', $id_solicitud, $id_admin);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'La solicitud no pertenece a tus espacios gestionados.']);
            $stmt->close();
            $conn->close();
            exit;
        }
        
        $solicitud_info = $result->fetch_assoc();
        $id_asignacion = $solicitud_info['id_asignacion'];
        $fecha_solicitada = $solicitud_info['fecha_solicitada'];
        $stmt->close();
        $respuesta = $data['respuesta'] ?? '';
        
        if (empty($respuesta)) {
            echo json_encode(['success' => false, 'message' => 'La respuesta no puede estar vacía.']);
            $conn->close();
            exit;
        }

        // Start transaction
        $conn->begin_transaction();

        try {
            // Update the request status
            $stmt = $conn->prepare("
                UPDATE solicitud_cambio_horario 
                SET estado_admin = 'Aprobado', respuesta_admin = ?, fecha_respuesta_admin = NOW()
                WHERE id_solicitud = ?
            ");
            $stmt->bind_param('si', $respuesta, $id_solicitud);

            if (!$stmt->execute()) {
                throw new Exception('Error al actualizar la solicitud');
            }
            $stmt->close();

            // Update the assignment with new date
            $stmt = $conn->prepare("
                UPDATE asignacion_espacio_cliente 
                SET fecha_asignacion = ?
                WHERE id_asignacion = ?
            ");
            $stmt->bind_param('si', $fecha_solicitada, $id_asignacion);

            if (!$stmt->execute()) {
                throw new Exception('Error al actualizar la asignación');
            }
            $stmt->close();

            // Update the schedule dates in horario_espacios if it exists
            $stmt = $conn->prepare("
                UPDATE horario_espacios 
                SET fecha_inicio = ?, fecha_termino = ?
                WHERE id_horario = (
                    SELECT id_horario FROM asignacion_espacio_cliente WHERE id_asignacion = ?
                )
            ");
            $stmt->bind_param('ssi', $fecha_solicitada, $fecha_solicitada, $id_asignacion);
            $stmt->execute();
            $stmt->close();

            $conn->commit();
            echo json_encode(['success' => true, 'message' => 'Solicitud aprobada y fecha actualizada correctamente.']);

        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }

    } elseif ($accion === 'rechazar') {
        // Verify that the request belongs to a space managed by this admin
        $stmt = $conn->prepare("
            SELECT sch.id_solicitud, sch.id_asignacion, sch.fecha_solicitada
            FROM solicitud_cambio_horario sch
            JOIN asignacion_espacio_cliente aec ON sch.id_asignacion = aec.id_asignacion
            JOIN gestiondeespacio ge ON aec.id_espacio = ge.id_espacio
            WHERE sch.id_solicitud = ? AND ge.id_usuario = ?
        ");
        $stmt->bind_param('ii', $id_solicitud, $id_admin);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'La solicitud no pertenece a tus espacios gestionados.']);
            $stmt->close();
            $conn->close();
            exit;
        }
        $stmt->close();

        $respuesta = $data['respuesta'] ?? '';
        
        if (empty($respuesta)) {
            echo json_encode(['success' => false, 'message' => 'La respuesta no puede estar vacía.']);
            $conn->close();
            exit;
        }

        $stmt = $conn->prepare("
            UPDATE solicitud_cambio_horario 
            SET estado_admin = 'Rechazado', respuesta_admin = ?, fecha_respuesta_admin = NOW()
            WHERE id_solicitud = ?
        ");
        $stmt->bind_param('si', $respuesta, $id_solicitud);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Solicitud rechazada correctamente.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al rechazar la solicitud: ' . $conn->error]);
        }
        $stmt->close();

    } elseif ($accion === 'eliminar') {
        // Eliminar solo si está pendiente
        // 1) Permitir SIEMPRE que el propio usuario (cliente) elimine su solicitud pendiente
        $id_sesion = intval($sesion_valida['sesion']['id_usuario']);

        $stmt = $conn->prepare("SELECT sch.id_solicitud FROM solicitud_cambio_horario sch JOIN asignacion_espacio_cliente aec ON sch.id_asignacion = aec.id_asignacion WHERE sch.id_solicitud = ? AND aec.id_usuario = ? AND (sch.estado_admin IS NULL OR sch.estado_admin = '' OR sch.estado_admin = 'Pendiente')");
        $stmt->bind_param('ii', $id_solicitud, $id_sesion);
        $stmt->execute();
        $ownResult = $stmt->get_result();
        $stmt->close();

        if ($ownResult && $ownResult->num_rows > 0) {
            // Elimina como dueño (cliente)
            $stmt = $conn->prepare("DELETE sch FROM solicitud_cambio_horario sch WHERE sch.id_solicitud = ?");
            $stmt->bind_param('i', $id_solicitud);
            if ($stmt->execute() && $stmt->affected_rows > 0) {
                echo json_encode(['success' => true, 'message' => 'Solicitud eliminada correctamente.']);
            } else {
                echo json_encode(['success' => false, 'message' => 'No fue posible eliminar la solicitud.']);
            }
            $stmt->close();
        } else {
            // 2) Si no es del usuario, permitir a Admin/Colab eliminar si pertenece a sus espacios y está pendiente
            $stmt = $conn->prepare("DELETE sch FROM solicitud_cambio_horario sch JOIN asignacion_espacio_cliente aec ON sch.id_asignacion = aec.id_asignacion JOIN gestiondeespacio ge ON aec.id_espacio = ge.id_espacio WHERE sch.id_solicitud = ? AND ge.id_usuario = ? AND (sch.estado_admin IS NULL OR sch.estado_admin = '' OR sch.estado_admin = 'Pendiente')");
            $stmt->bind_param('ii', $id_solicitud, $id_admin);
            if ($stmt->execute() && $stmt->affected_rows > 0) {
                echo json_encode(['success' => true, 'message' => 'Solicitud eliminada correctamente.']);
            } else {
                echo json_encode(['success' => false, 'message' => 'No es posible eliminar esta solicitud (no es Pendiente o no te pertenece).']);
            }
            $stmt->close();
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Acción no válida.']);
    }

} else {
    echo json_encode(['success' => false, 'message' => 'Método no soportado: ' . $method]);
}

$conn->close();
?>
