<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../config/db_config.php';

function verificarSesionLocal(mysqli $conn, string $token): array {
    $sql = "SELECT s.id_sesion, s.id_usuario
            FROM Sesion s
            WHERE s.token_sesion = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) return ['success' => false, 'message' => 'Error de servidor'];
    $stmt->bind_param('s', $token);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res && $res->num_rows > 0) {
        $row = $res->fetch_assoc();
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
        return ['success' => true, 'sesion' => ['id_usuario' => $row['id_usuario'], 'roles' => $roles]];
    }
    $stmt->close();
    return ['success' => false, 'message' => 'Sesión no válida o expirada'];
}

try {
    $conn = getDBConnection();
    if ($conn->connect_error) throw new Exception('Error de conexión');

    $method = $_SERVER['REQUEST_METHOD'];
    $ct = $_SERVER['CONTENT_TYPE'] ?? '';

    if ($method !== 'POST' && !empty($_POST)) $method = 'POST';

    if ($method === 'POST') {
        $token = '';
        $id_asignacion = 0;
        $fecha_solicitada = '';
        $motivo = '';
        if (stripos($ct, 'application/json') !== false) {
            $data = json_decode(file_get_contents('php://input'), true) ?: [];
            $token = $data['token'] ?? '';
            $id_asignacion = intval($data['id_asignacion'] ?? 0);
            $fecha_solicitada = trim($data['fecha_solicitada'] ?? '');
            $motivo = trim($data['motivo'] ?? '');
        } else {
            $token = $_POST['token'] ?? '';
            $id_asignacion = intval($_POST['id_asignacion'] ?? 0);
            $fecha_solicitada = trim($_POST['fecha_solicitada'] ?? '');
            $motivo = trim($_POST['motivo'] ?? '');
        }

        if (!$token) { echo json_encode(['success'=>false,'message'=>'Token requerido']); exit; }
        $ses = verificarSesionLocal($conn, $token);
        if (!$ses['success']) { echo json_encode(['success'=>false,'message'=>$ses['message']]); exit; }
        $id_cliente = intval($ses['sesion']['id_usuario']);

        if ($id_asignacion <= 0 || $fecha_solicitada === '' || $motivo === '') {
            echo json_encode(['success'=>false,'message'=>'Faltan datos obligatorios']);
            exit;
        }

        // Verificar que la asignación pertenece al cliente y obtener el admin del espacio
        $sql = "SELECT a.id_asignacion, ge.id_usuario AS id_usuario_admin
                FROM asignacion_espacio_cliente a
                JOIN gestiondeespacio ge ON ge.id_espacio = a.id_espacio
                WHERE a.id_asignacion = ? AND a.id_usuario = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('ii', $id_asignacion, $id_cliente);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($res->num_rows === 0) {
            echo json_encode(['success'=>false,'message'=>'No autorizado para esta asignación']);
            exit;
        }
        $row = $res->fetch_assoc();
        $stmt->close();
        $id_usuario_admin = intval($row['id_usuario_admin']);

        // Insertar solicitud
        $sqlIns = "INSERT INTO solicitud_cambio_horario (id_asignacion, id_usuario_admin, fecha_solicitada, motivo) VALUES (?,?,?,?)";
        $stmtI = $conn->prepare($sqlIns);
        $stmtI->bind_param('iiss', $id_asignacion, $id_usuario_admin, $fecha_solicitada, $motivo);
        if (!$stmtI->execute()) {
            echo json_encode(['success'=>false,'message'=>'No se pudo registrar la solicitud']);
            exit;
        }
        $id_new = $stmtI->insert_id;
        $stmtI->close();
        echo json_encode(['success'=>true,'message'=>'Solicitud enviada','id_solicitud'=>$id_new]);
        exit;
    }

    if ($method === 'GET') {
        // Listar solicitudes del cliente actual
        $token = $_GET['token'] ?? '';
        if (!$token) { echo json_encode(['success'=>false,'message'=>'Token requerido']); exit; }
        $ses = verificarSesionLocal($conn, $token);
        if (!$ses['success']) { echo json_encode(['success'=>false,'message'=>$ses['message']]); exit; }
        $id_cliente = intval($ses['sesion']['id_usuario']);

        $sql = "SELECT s.id_solicitud, s.id_asignacion, s.fecha_solicitada, s.motivo, s.estado_admin, s.respuesta_admin, s.fecha_respuesta_admin, s.fecha_solicitud,
                       ge.nombre_espacio,
                       he.nombre_dia AS actual_nombre_dia,
                       he.hora_inicio AS actual_hora_inicio,
                       he.hora_fin AS actual_hora_fin,
                       he.fecha_inicio AS actual_fecha_inicio,
                       he.fecha_termino AS actual_fecha_termino
                FROM solicitud_cambio_horario s
                JOIN asignacion_espacio_cliente a ON a.id_asignacion = s.id_asignacion
                JOIN gestiondeespacio ge ON ge.id_espacio = a.id_espacio
                LEFT JOIN horario_espacios he ON he.id_horario = a.id_horario
                WHERE a.id_usuario = ?
                ORDER BY s.fecha_solicitud DESC";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('i', $id_cliente);
        $stmt->execute();
        $res = $stmt->get_result();
        $rows = [];
        while ($r = $res->fetch_assoc()) { $rows[] = $r; }
        $stmt->close();
        echo json_encode(['success'=>true,'solicitudes'=>$rows], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode(['success'=>false,'message'=>'Método no soportado']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success'=>false,'message'=>'Error del servidor','error'=>$e->getMessage()]);
}

?>


