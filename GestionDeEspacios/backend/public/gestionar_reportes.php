<?php
require_once '../config/db_config.php';

header('Content-Type: application/json; charset=utf-8');

function verificarSesionLocal(mysqli $conn, string $token): array {
	$stmt = $conn->prepare("SELECT s.id_usuario FROM Sesion s WHERE s.token_sesion = ?");
	$stmt->bind_param('s', $token);
	$stmt->execute();
	$res = $stmt->get_result();
	if ($res->num_rows === 0) {
		$stmt->close();
		return ['success' => false, 'message' => 'Sesión no válida o expirada'];
	}
	$row = $res->fetch_assoc();
	$stmt->close();

	$stmt2 = $conn->prepare("SELECT r.nombre_rol FROM usuario_rol ur JOIN roles r ON ur.id_rol = r.id_rol WHERE ur.id_usuario = ? AND ur.estado = 'Activo' LIMIT 1");
	$stmt2->bind_param('i', $row['id_usuario']);
	$stmt2->execute();
	$res2 = $stmt2->get_result();
	$rol = $res2->num_rows ? $res2->fetch_assoc()['nombre_rol'] : null;
	$stmt2->close();

	return ['success' => true, 'sesion' => ['id_usuario' => $row['id_usuario'], 'nombre_rol' => $rol]];
}

$conn = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET' || $method === 'HEAD') {
	$token = $_GET['token'] ?? '';
	if (!$token) {
		echo json_encode(['success' => false, 'message' => 'Token requerido']);
		$conn->close();
		exit;
	}

    $ses = verificarSesionLocal($conn, $token);
	if (!$ses['success']) {
		echo json_encode(['success' => false, 'message' => $ses['message']]);
		$conn->close();
		exit;
	}
    $id_admin = intval($ses['sesion']['id_usuario']);
    // Si el token pertenece a un Colaborador, usar el administrador asociado
    if (!empty($ses['sesion']['nombre_rol']) && $ses['sesion']['nombre_rol'] === 'Colaboradores') {
        $stmtAdm = $conn->prepare("SELECT COALESCE(u.id_administrador_asociado, u.id_usuario) AS id_admin FROM usuarios u WHERE u.id_usuario = ?");
        $stmtAdm->bind_param('i', $id_admin);
        $stmtAdm->execute();
        $resAdm = $stmtAdm->get_result();
        if ($resAdm->num_rows) {
            $id_admin = intval($resAdm->fetch_assoc()['id_admin']);
        }
        $stmtAdm->close();
    }
    // Si el token pertenece a un Colaborador, usar el administrador asociado
    if (!empty($ses['sesion']['nombre_rol']) && $ses['sesion']['nombre_rol'] === 'Colaboradores') {
        $stmtAdm = $conn->prepare("SELECT COALESCE(u.id_administrador_asociado, u.id_usuario) AS id_admin FROM usuarios u WHERE u.id_usuario = ?");
        $stmtAdm->bind_param('i', $id_admin);
        $stmtAdm->execute();
        $resAdm = $stmtAdm->get_result();
        if ($resAdm->num_rows) {
            $id_admin = intval($resAdm->fetch_assoc()['id_admin']);
        }
        $stmtAdm->close();
    }

	// Listar reportes que pertenecen a espacios gestionados por este admin
	$sql = "
		SELECT r.id_reporte, r.id_asignacion, r.titulo, r.contenido, r.estado, r.respuesta_admin,
		       r.fecha_creacion, r.fecha_respuesta,
		       ge.id_espacio, ge.nombre_espacio, ge.tipo_espacio,
		       ciu.nombre_ciudad AS ciudad, reg.nombre_region AS region,
		       u.nombre, u.apellido, u.telefono, cred.correo_electronico
		FROM envioreportes r
		JOIN asignacion_espacio_cliente aec ON aec.id_asignacion = r.id_asignacion
		JOIN gestiondeespacio ge ON ge.id_espacio = aec.id_espacio
		JOIN usuarios u ON u.id_usuario = aec.id_usuario
		LEFT JOIN credenciales cred ON cred.id_usuario = u.id_usuario
		LEFT JOIN regiones reg ON reg.id_region = ge.id_region
		LEFT JOIN ciudades ciu ON ciu.id_ciudad = ge.id_ciudad
		WHERE ge.id_usuario = ?
		ORDER BY r.fecha_creacion DESC";
	$stmt = $conn->prepare($sql);
	$stmt->bind_param('i', $id_admin);
	$stmt->execute();
	$res = $stmt->get_result();
	$rows = [];
	while ($row = $res->fetch_assoc()) { $rows[] = $row; }
	$stmt->close();

	echo json_encode(['success' => true, 'reportes' => $rows], JSON_UNESCAPED_UNICODE);
	$conn->close();
	exit;
}

if ($method === 'POST') {
	$raw = file_get_contents('php://input');
	$data = json_decode($raw, true);
	if (json_last_error() !== JSON_ERROR_NONE || empty($data)) { $data = $_POST; }

	$token = $data['token'] ?? '';
	$id_reporte = intval($data['id_reporte'] ?? 0);
	$accion = $data['accion'] ?? '';
    if (!$token || !$id_reporte || !$accion) {
		echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
		$conn->close();
		exit;
	}

	$ses = verificarSesionLocal($conn, $token);
	if (!$ses['success']) {
		echo json_encode(['success' => false, 'message' => $ses['message']]);
		$conn->close();
		exit;
	}
	// Atajo para eliminación por cliente: no requiere validación de pertenencia del admin
	if ($accion === 'eliminar_cliente') {
		$id_usuario_sesion = intval($ses['sesion']['id_usuario']);
		$sqlC = "SELECT r.id_reporte
				 FROM envioreportes r
				 JOIN asignacion_espacio_cliente aec ON aec.id_asignacion = r.id_asignacion
				 WHERE r.id_reporte = ? AND aec.id_usuario = ? AND (r.estado IS NULL OR r.estado = '' OR r.estado = 'Enviado')";
		$stmtC = $conn->prepare($sqlC);
		$stmtC->bind_param('ii', $id_reporte, $id_usuario_sesion);
		$stmtC->execute();
		$resC = $stmtC->get_result();
		$stmtC->close();

		if ($resC && $resC->num_rows > 0) {
			$stmtD = $conn->prepare("DELETE FROM envioreportes WHERE id_reporte = ?");
			$stmtD->bind_param('i', $id_reporte);
			if ($stmtD->execute() && $stmtD->affected_rows > 0) {
				echo json_encode(['success' => true, 'message' => 'Reporte eliminado correctamente.']);
			} else {
				echo json_encode(['success' => false, 'message' => 'No fue posible eliminar el reporte.']);
			}
			$stmtD->close();
		} else {
			echo json_encode(['success' => false, 'message' => 'No es posible eliminar este reporte (no es Enviado o no te pertenece).']);
		}
		$conn->close();
		exit;
	}

	$id_admin = intval($ses['sesion']['id_usuario']);
	// Si el token es de Colaborador, usar id del administrador asociado
	if (!empty($ses['sesion']['nombre_rol']) && $ses['sesion']['nombre_rol'] === 'Colaboradores') {
		$stmtAdm = $conn->prepare("SELECT COALESCE(u.id_administrador_asociado, u.id_usuario) AS id_admin FROM usuarios u WHERE u.id_usuario = ?");
		$stmtAdm->bind_param('i', $id_admin);
		$stmtAdm->execute();
		$resAdm = $stmtAdm->get_result();
		if ($resAdm->num_rows) { $id_admin = intval($resAdm->fetch_assoc()['id_admin']); }
		$stmtAdm->close();
	}

	// Verificar que el reporte pertenezca a un espacio del admin (para acciones de admin)
	$sqlV = "SELECT r.id_reporte, r.respuesta_admin
			 FROM envioreportes r
			 JOIN asignacion_espacio_cliente aec ON aec.id_asignacion = r.id_asignacion
			 JOIN gestiondeespacio ge ON ge.id_espacio = aec.id_espacio
			 WHERE r.id_reporte = ? AND ge.id_usuario = ?";
	$stmtV = $conn->prepare($sqlV);
	$stmtV->bind_param('ii', $id_reporte, $id_admin);
	$stmtV->execute();
	$resV = $stmtV->get_result();
	if ($resV->num_rows === 0) {
		echo json_encode(['success' => false, 'message' => 'No autorizado']);
		$stmtV->close();
		$conn->close();
		exit;
	}
	$info = $resV->fetch_assoc();
	$stmtV->close();

	if ($accion === 'responder') {
		$respTxt = trim($data['respuesta'] ?? '');
		$nuevoEstado = $data['nuevo_estado'] ?? 'Revisado';
		if ($respTxt === '') {
			echo json_encode(['success' => false, 'message' => 'La respuesta no puede estar vacía']);
			$conn->close();
			exit;
		}

		// Concatenar respuestas si ya existe una previa
		$fechaNow = date('Y-m-d H:i:s');
		$nuevaRespuesta = $info['respuesta_admin'];
		if ($nuevaRespuesta && trim($nuevaRespuesta) !== '') {
			$nuevaRespuesta .= "\n--- Nueva respuesta ($fechaNow) ---\n" . $respTxt;
		} else {
			$nuevaRespuesta = $respTxt;
		}

		$stmt = $conn->prepare("UPDATE envioreportes SET respuesta_admin = ?, estado = ?, fecha_respuesta = NOW() WHERE id_reporte = ?");
		$stmt->bind_param('ssi', $nuevaRespuesta, $nuevoEstado, $id_reporte);
		if ($stmt->execute()) {
			echo json_encode(['success' => true, 'message' => 'Respuesta enviada']);
		} else {
			echo json_encode(['success' => false, 'message' => 'No se pudo enviar la respuesta']);
		}
		$stmt->close();
		$conn->close();
		exit;
	}

	if ($accion === 'cambiar_estado') {
		$nuevoEstado = $data['nuevo_estado'] ?? '';
		if (!$nuevoEstado) {
			echo json_encode(['success' => false, 'message' => 'Estado requerido']);
			$conn->close();
			exit;
		}

		$stmt = $conn->prepare("UPDATE envioreportes SET estado = ? WHERE id_reporte = ?");
		$stmt->bind_param('si', $nuevoEstado, $id_reporte);
		if ($stmt->execute()) {
			echo json_encode(['success' => true, 'message' => 'Estado actualizado']);
		} else {
			echo json_encode(['success' => false, 'message' => 'No se pudo actualizar el estado']);
		}
		$stmt->close();
		$conn->close();
		exit;
	}

	echo json_encode(['success' => false, 'message' => 'Acción no válida']);
	$conn->close();
	exit;
}

echo json_encode(['success' => false, 'message' => 'Método no soportado: ' . $method]);
$conn->close();
?>
