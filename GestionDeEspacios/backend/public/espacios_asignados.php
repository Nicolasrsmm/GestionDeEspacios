<?php
require_once __DIR__ . '/../config/db_config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function validarSesionPorToken($conn, $token) {
    $stmt = $conn->prepare("SELECT s.id_usuario FROM Sesion s WHERE s.token_sesion = ?");
    $stmt->bind_param('s', $token);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows === 0) {
        $stmt->close();
        return null;
    }
    $row = $result->fetch_assoc();
    $stmt->close();
    // Obtener todos los roles activos
    $stmt2 = $conn->prepare("SELECT r.nombre_rol FROM usuario_rol ur JOIN roles r ON ur.id_rol = r.id_rol WHERE ur.id_usuario = ? AND ur.estado = 'Activo'");
    $stmt2->bind_param('i', $row['id_usuario']);
    $stmt2->execute();
    $res2 = $stmt2->get_result();
    $roles = [];
    while ($rol = $res2->fetch_assoc()) {
        $roles[] = $rol['nombre_rol'];
    }
    $stmt2->close();
    return ['id_usuario' => $row['id_usuario'], 'roles' => $roles];
}

try {
    $conn = getDBConnection();

    $token = $_GET['token'] ?? '';
    if (empty($token)) {
        echo json_encode(['success' => false, 'message' => 'Token requerido']);
        $conn->close();
        exit;
    }

    $sesion = validarSesionPorToken($conn, $token);
    if (!$sesion) {
        echo json_encode(['success' => false, 'message' => 'Sesión no válida o expirada']);
        $conn->close();
        exit;
    }

    $action = $_GET['action'] ?? '';
    if ($action === 'fotos_espacio') {
        $idEspacio = intval($_GET['id_espacio'] ?? 0);
        if ($idEspacio <= 0) {
            echo json_encode(['success' => false, 'message' => 'id_espacio inválido']);
            $conn->close();
            exit;
        }
        // Cargar fotos del espacio
        $stmtF = $conn->prepare("SELECT id_foto, url_imagen FROM fotos_publicacion WHERE id_espacio = ? ORDER BY id_foto ASC");
        $stmtF->bind_param('i', $idEspacio);
        $stmtF->execute();
        $resF = $stmtF->get_result();
        $fotos = [];
        while ($row = $resF->fetch_assoc()) { $fotos[] = $row['url_imagen']; }
        $stmtF->close();
        echo json_encode(['success' => true, 'fotos' => $fotos]);
        $conn->close();
        exit;
    }

    // Solo clientes deben consultar sus espacios asignados
    if (!in_array('Cliente', $sesion['roles'] ?? [])) {
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        $conn->close();
        exit;
    }

    $idCliente = intval($sesion['id_usuario']);

    $sql = "SELECT
                ge.id_espacio, ge.nombre_espacio, ge.tipo_espacio, ge.metros_cuadrados,
                r.nombre_region AS region, c.nombre_ciudad AS ciudad, ge.direccion, ge.ubicacion_interna,
                aec.id_asignacion, aec.id_horario,
                he.nombre_dia, he.hora_inicio, he.hora_fin, he.fecha_inicio, he.fecha_termino, he.descripcion AS descripcion_horario,
                u_admin.id_usuario AS id_administrador, u_admin.nombre AS admin_nombre, u_admin.apellido AS admin_apellido
            FROM asignacion_espacio_cliente aec
            JOIN gestiondeespacio ge ON aec.id_espacio = ge.id_espacio
            LEFT JOIN horario_espacios he ON aec.id_horario = he.id_horario
            LEFT JOIN regiones r ON ge.id_region = r.id_region
            LEFT JOIN ciudades c ON ge.id_ciudad = c.id_ciudad
            JOIN usuarios u_admin ON ge.id_usuario = u_admin.id_usuario
            WHERE aec.id_usuario = ?
            ORDER BY ge.nombre_espacio ASC";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $idCliente);
    $stmt->execute();
    $result = $stmt->get_result();

    $espacios = [];
    while ($row = $result->fetch_assoc()) {
        $equip = [];
        $stmtEq = $conn->prepare("SELECT nombre_equipamiento, cantidad, descripcion, estado FROM equipamiento WHERE id_espacio = ?");
        $idEsp = intval($row['id_espacio']);
        $stmtEq->bind_param('i', $idEsp);
        $stmtEq->execute();
        $resEq = $stmtEq->get_result();
        while ($eq = $resEq->fetch_assoc()) {
            $equip[] = $eq;
        }
        $stmtEq->close();

        // Obtener primera foto del espacio
        $stmtF = $conn->prepare("SELECT url_imagen FROM fotos_publicacion WHERE id_espacio = ? ORDER BY id_foto ASC LIMIT 1");
        $stmtF->bind_param('i', $idEsp);
        $stmtF->execute();
        $resF = $stmtF->get_result();
        $row['foto1'] = $resF->num_rows ? $resF->fetch_assoc()['url_imagen'] : null;
        $stmtF->close();

        // Contar fotos del espacio
        $stmtCnt = $conn->prepare("SELECT COUNT(*) AS total FROM fotos_publicacion WHERE id_espacio = ?");
        $stmtCnt->bind_param('i', $idEsp);
        $stmtCnt->execute();
        $resCnt = $stmtCnt->get_result();
        $row['num_fotos'] = $resCnt->num_rows ? intval($resCnt->fetch_assoc()['total']) : 0;
        $stmtCnt->close();

        $row['equipamiento'] = $equip;
        $espacios[] = $row;
    }
    $stmt->close();

    echo json_encode([
        'success' => true,
        'espacios' => $espacios
    ]);

    $conn->close();
    exit;

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
    exit;
}
?>


